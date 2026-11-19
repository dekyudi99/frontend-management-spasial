import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button, Input, Alert, Spin } from "antd";
import { CheckCircle2, XCircle } from "lucide-react";
import layerApi from "../../api/LayerApi";
import { extractApiError } from "../../utils/wfsUtils";
import { useLanguage } from "../../context/LanguageContext";

const NUMERIC_TYPES = new Set([
  "int",
  "integer",
  "long",
  "short",
  "byte",
  "number",
  "float",
  "double",
  "decimal",
]);

function formatValueForExpression(value, localType) {
  if (value === null || value === undefined) return "NULL";
  const normType = String(localType || "string").toLowerCase();
  if (NUMERIC_TYPES.has(normType) || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

/**
 * ArcMap/QGIS-style "Select by Attributes" CQL WHERE expression builder.
 */
const CqlFilterBuilder = ({
  layerId,
  layerTableName,
  schemaColumns = [],
  appliedExpression = "",
  onApply,
  onClose,
}) => {
  const { t } = useLanguage();
  const [expression, setExpression] = useState(appliedExpression || "");
  const [selectedField, setSelectedField] = useState(() => schemaColumns[0]?.name || null);
  const [selectedValueKey, setSelectedValueKey] = useState(null);
  const [uniqueValues, setUniqueValues] = useState([]);
  const [hasMoreValues, setHasMoreValues] = useState(false);
  const [loadingValues, setLoadingValues] = useState(false);
  const [valuesError, setValuesError] = useState(null);
  const [goToQuery, setGoToQuery] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyFeedback, setVerifyFeedback] = useState(null);

  const textareaRef = useRef(null);
  const uniqueAbortRef = useRef(null);

  useEffect(() => {
    setExpression(appliedExpression || "");
    setVerifyFeedback(null);
  }, [appliedExpression]);

  useEffect(() => {
    if (!selectedField && schemaColumns.length > 0) {
      setSelectedField(schemaColumns[0].name);
    }
  }, [schemaColumns, selectedField]);

  useEffect(() => {
    return () => {
      if (uniqueAbortRef.current) uniqueAbortRef.current.abort();
    };
  }, []);

  const selectedColMeta = useMemo(
    () => schemaColumns.find((c) => c.name === selectedField) || null,
    [schemaColumns, selectedField]
  );

  const insertAtCursor = (snippet, cursorBackOffset = 0, padBefore = false) => {
    const el = textareaRef.current;
    setVerifyFeedback(null);

    if (!el) {
      setExpression((prev) => `${prev}${snippet}`);
      return;
    }

    const start = el.selectionStart ?? expression.length;
    const end = el.selectionEnd ?? expression.length;
    const selectedText = expression.slice(start, end);
    const charBefore = start > 0 ? expression[start - 1] : "";
    const charAfter = end < expression.length ? expression[end] : "";

    let toInsert = snippet;
    let adjustedBackOffset = cursorBackOffset;

    if (snippet === "()" && selectedText) {
      toInsert = `(${selectedText})`;
      adjustedBackOffset = 0;
    } else {
      if (toInsert.startsWith(" ") && (!charBefore || /\s|\(/.test(charBefore))) {
        toInsert = toInsert.slice(1);
      } else if (padBefore && charBefore && !/[\s(]/.test(charBefore)) {
        toInsert = ` ${toInsert}`;
      }
      if (toInsert.endsWith(" ") && charAfter && /\s|\)/.test(charAfter)) {
        toInsert = toInsert.slice(0, -1);
      }
    }

    const nextCursorPos = start + toInsert.length - adjustedBackOffset;
    const nextExpr = expression.slice(0, start) + toInsert + expression.slice(end);
    setExpression(nextExpr);

    requestAnimationFrame(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(nextCursorPos, nextCursorPos);
      }
    });
  };

  const fetchUniqueValues = async (colName, searchText = "") => {
    if (!layerId || !colName) return;
    if (uniqueAbortRef.current) uniqueAbortRef.current.abort();
    uniqueAbortRef.current = new AbortController();

    setLoadingValues(true);
    setValuesError(null);
    try {
      const res = await layerApi.getLayerUniqueValues(
        layerId,
        { column: colName, search: searchText, limit: 200 },
        uniqueAbortRef.current.signal
      );
      setUniqueValues(Array.isArray(res?.values) ? res.values : []);
      setHasMoreValues(Boolean(res?.has_more));
    } catch (err) {
      if (!uniqueAbortRef.current?.signal?.aborted && err?.name !== "CanceledError" && err?.name !== "AbortError") {
        setValuesError(extractApiError(err));
      }
    } finally {
      setLoadingValues(false);
    }
  };

  const handleSelectField = (colName) => {
    if (colName !== selectedField) {
      setSelectedField(colName);
      setSelectedValueKey(null);
      setUniqueValues([]);
      setHasMoreValues(false);
      setGoToQuery("");
      setValuesError(null);
    }
  };

  const handleVerify = async () => {
    const trimmed = expression.trim();
    if (!trimmed) {
      setVerifyFeedback({
        type: "error",
        message: t("cqlEmptyWarning", "Ekspresi filter masih kosong."),
      });
      return;
    }
    setVerifying(true);
    setVerifyFeedback(null);
    try {
      const res = await layerApi.verifyLayerCql(layerId, trimmed);
      setVerifyFeedback({
        type: "success",
        message:
          res?.message ||
          `Verified (${res?.matched_count ?? 0} features matched).`,
      });
    } catch (err) {
      setVerifyFeedback({
        type: "error",
        message: extractApiError(err),
      });
    } finally {
      setVerifying(false);
    }
  };

  const handleClear = () => {
    setExpression("");
    setVerifyFeedback(null);
  };

  const handleApply = () => {
    const trimmed = expression.trim();
    onApply(trimmed || null);
  };

  const filteredUniqueValues = useMemo(() => {
    const q = goToQuery.trim().toLowerCase();
    if (!q) return uniqueValues;
    return uniqueValues.filter((v) => String(v).toLowerCase().includes(q));
  }, [uniqueValues, goToQuery]);

  const opBtnCls =
    "h-7 px-2 text-xs font-medium rounded border border-slate-300 bg-white hover:bg-blue-50 hover:border-blue-400 text-slate-700 transition cursor-pointer select-none";

  return (
    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
      {/* 1. Daftar Kolom (Fields) */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-semibold text-slate-600">
            {t("selectColumns", "Fields")}
          </span>
          <span className="text-[10px] text-slate-400">
            {t("cqlFieldHint", "Klik untuk pilih kolom, klik ganda untuk sisipkan ke ekspresi")}
          </span>
        </div>
        <div className="h-28 overflow-y-auto bg-white border border-slate-300 rounded divide-y divide-slate-100">
          {schemaColumns.map((col) => {
            const isSelected = selectedField === col.name;
            return (
              <button
                key={col.name}
                type="button"
                onClick={() => handleSelectField(col.name)}
                onDoubleClick={() => insertAtCursor(`"${col.name}" `, 0, true)}
                className={`w-full px-2.5 py-1 text-left text-xs flex items-center justify-between cursor-pointer transition ${
                  isSelected ? "bg-blue-600 text-white font-medium" : "hover:bg-slate-100 text-slate-800"
                }`}
              >
                <span className="font-mono">"{col.name}"</span>
                <span className={`text-[10px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                  {col.local_type}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Operator Keypad (kiri) + Unique Values (kanan) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
        {/* Operator Grid ala Select by Attributes */}
        <div className="md:col-span-5 space-y-1.5">
          <div className="grid grid-cols-3 gap-1.5">
            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" = ")}>=</button>
            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" <> ")}>&lt;&gt;</button>
            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" LIKE ")}>Like</button>

            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" > ")}>&gt;</button>
            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" >= ")}>&gt;=</button>
            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" AND ")}>And</button>

            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" < ")}>&lt;</button>
            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" <= ")}>&lt;=</button>
            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" OR ")}>Or</button>

            <div className="grid grid-cols-2 gap-1">
              <button type="button" className={opBtnCls} onClick={() => insertAtCursor("_")} title="Single char wildcard">_</button>
              <button type="button" className={opBtnCls} onClick={() => insertAtCursor("%")} title="Multi-char wildcard">%</button>
            </div>
            <button type="button" className={opBtnCls} onClick={() => insertAtCursor("()", 1)}>{"( )"}</button>
            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" NOT ")}>Not</button>

            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" IS ")}>Is</button>
            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" IN ()", 1)}>In</button>
            <button type="button" className={opBtnCls} onClick={() => insertAtCursor(" NULL")}>Null</button>
          </div>
        </div>

        {/* Unique Values Panel */}
        <div className="md:col-span-7 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-600">Unique Values</span>
            <span className="text-[10px] text-slate-400">
              {t("cqlValueHint", "Klik ganda nilai untuk menyisipkan ke ekspresi")}
            </span>
          </div>
          <div className="h-28 overflow-y-auto bg-white border border-slate-300 rounded">
            {loadingValues ? (
              <div className="h-full flex items-center justify-center">
                <Spin size="small" />
              </div>
            ) : valuesError ? (
              <div className="p-2 text-xs text-red-600">{valuesError}</div>
            ) : filteredUniqueValues.length === 0 ? (
              <div className="h-full flex items-center justify-center px-3 text-center text-[11px] text-slate-400">
                {uniqueValues.length === 0
                  ? t("cqlNoUniqueValues", "Pilih kolom lalu klik 'Get Unique Values'")
                  : t("noMatchingValues", "Tidak ada nilai yang cocok.")}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredUniqueValues.map((val, idx) => {
                  const formatted = formatValueForExpression(val, selectedColMeta?.local_type);
                  const valKey = `${formatted}-${idx}`;
                  const isValSelected = selectedValueKey === valKey;
                  return (
                    <button
                      key={valKey}
                      type="button"
                      onClick={() => setSelectedValueKey(valKey)}
                      onDoubleClick={() => insertAtCursor(`${formatted} `, 0, true)}
                      title={t("cqlValueHint", "Klik ganda nilai untuk menyisipkan ke ekspresi")}
                      className={`w-full px-2.5 py-1 text-left text-xs font-mono truncate cursor-pointer transition ${
                        isValSelected
                          ? "bg-blue-600 text-white font-medium"
                          : "text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      {formatted}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="small"
              disabled={!selectedField || loadingValues}
              onClick={() => fetchUniqueValues(selectedField, goToQuery)}
            >
              {t("getUniqueValues", "Get Unique Values")}
            </Button>
            <div className="flex items-center gap-1.5 flex-1 min-w-[140px]">
              <span className="text-[11px] text-slate-600 shrink-0">
                {t("goToValue", "Go To:")}
              </span>
              <Input
                size="small"
                allowClear
                placeholder={t("goToPlaceholder", "Cari nilai...")}
                value={goToQuery}
                onChange={(e) => setGoToQuery(e.target.value)}
                onPressEnter={() => {
                  if (selectedField) fetchUniqueValues(selectedField, goToQuery);
                }}
              />
            </div>
          </div>
          {hasMoreValues && (
            <p className="text-[10px] text-amber-600">
              {t("cqlMoreValuesHint", "Menampilkan sebagian nilai. Ketik di 'Go To' lalu Enter untuk mencari semua nilai.")}
            </p>
          )}
        </div>
      </div>

      {/* 3. WHERE Expression Editor */}
      <div>
        <div className="text-[11px] font-semibold text-slate-700 mb-1 font-mono">
          SELECT * FROM {layerTableName || "layer"} WHERE:
        </div>
        <textarea
          ref={textareaRef}
          rows={3}
          value={expression}
          onChange={(e) => {
            setExpression(e.target.value);
            setVerifyFeedback(null);
          }}
          placeholder={t("cqlExpressionHint", 'Masukkan klausa WHERE (mis. "name" = \'Bangkok\' AND "area" > 10)')}
          className="w-full p-2 text-xs font-mono bg-white border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 resize-y"
        />
      </div>

      {/* Verify feedback */}
      {verifyFeedback && (
        <Alert
          type={verifyFeedback.type}
          showIcon
          icon={
            verifyFeedback.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <XCircle className="w-4 h-4 text-red-600" />
            )
          }
          title={verifyFeedback.message}
          className="text-xs py-1.5"
        />
      )}

      {/* 4. Action Buttons */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 flex-wrap">
        <div className="flex items-center gap-2">
          <Button size="small" onClick={handleClear}>
            {t("clearFilter", "Clear")}
          </Button>
          <Button size="small" loading={verifying} onClick={handleVerify}>
            {t("verifyCql", "Verify")}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button size="small" onClick={onClose}>
            {t("closeFilter", "Tutup")}
          </Button>
          <Button size="small" type="primary" onClick={handleApply}>
            {t("applyCql", "Apply")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CqlFilterBuilder;
