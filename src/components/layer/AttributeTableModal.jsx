import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Modal,
  Table,
  Button,
  Select,
  Space,
  Alert,
  Tooltip,
  Tag,
  Spin,
} from "antd";
import {
  Filter,
  RefreshCw,
  LocateFixed,
  AlertTriangle,
} from "lucide-react";
import layerApi from "../../api/LayerApi";
import { extractApiError } from "../../utils/wfsUtils";
import { useLanguage } from "../../context/LanguageContext";
import CqlFilterBuilder from "./CqlFilterBuilder";

const { Option } = Select;
const CHUNK_SIZE = 100;

const AttributeTableModal = ({
  layer,
  visible,
  onClose,
  onSelectFeature,
  initialCql = "",
  onCqlFilterChange,
}) => {
  const { t } = useLanguage();

  // State schema & data
  const [schema, setSchema] = useState(null);
  const [columns, setColumns] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState([]);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);

  // Loading & error
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [isLoadingRows, setIsLoadingRows] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [schemaError, setSchemaError] = useState(null);
  const [rowsError, setRowsError] = useState(null);
  const [hasNoPk, setHasNoPk] = useState(false);

  // Infinite scroll & Sort
  const [currentPage, setCurrentPage] = useState(1);
  const [sorter, setSorter] = useState({ field: null, order: null });

  // CQL Filter Builder state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [appliedCql, setAppliedCql] = useState(initialCql || null);

  const abortControllerRef = useRef(null);
  const tableContainerRef = useRef(null);
  const isFetchingMoreRef = useRef(false);

  // 1. Fetch Schema saat modal dibuka atau layer berubah
  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setSchema(null);
    setColumns([]);
    setVisibleColumns([]);
    setRows([]);
    setTotal(0);
    setSchemaError(null);
    setRowsError(null);
    setHasNoPk(false);
    setCurrentPage(1);
    setSorter({ field: null, order: null });
    setAppliedCql(initialCql ? String(initialCql).trim() : null);
    isFetchingMoreRef.current = false;

    if (!visible || !layer) {
      return;
    }

    const fetchSchema = async () => {
      setIsLoadingSchema(true);
      setSchemaError(null);
      setHasNoPk(false);

      try {
        const res = await layerApi.getLayerSchema(layer.id);
        const schemaData = res?.data || res;
        setSchema(schemaData);

        if (!schemaData.has_pk) {
          setHasNoPk(true);
          return;
        }

        // Siapkan kolom tabel (sembunyikan kolom PK/gid dan geometri)
        const allCols = schemaData.columns || [];
        const tableCols = allCols
          .filter((c) => !c.is_pk && c.local_type !== "geometry" && c.name !== "geometry")
          .map((c) => ({
            title: c.name,
            dataIndex: [c.name],
            key: c.name,
            sorter: true,
            render: (text, record) => {
              const val = text !== undefined ? text : (record?.[c.name] ?? record?.properties?.[c.name]);
              if (val === null || val === undefined) {
                return <span className="text-slate-400 select-none font-sans font-medium">—</span>;
              }
              if (typeof val === "object") return JSON.stringify(val);
              return String(val);
            },
          }));

        setColumns(tableCols);
        setVisibleColumns(tableCols.map((c) => c.key));
      } catch (err) {
        if (err?.response?.status === 409) {
          setHasNoPk(true);
        } else {
          setSchemaError(extractApiError(err) || t("failedLoadSchema", "Gagal memuat skema layer."));
        }
      } finally {
        setIsLoadingSchema(false);
      }
    };

    fetchSchema();
  }, [visible, layer?.id, t]);

  // 2. Fetch Features Data (page 1 reset atau append chunk berikutnya saat scroll)
  const fetchFeatures = useCallback(
    async (pageNum, sortConfig, cqlExpression, append = false) => {
      if (!layer || !schema?.has_pk) return;

      if (append) {
        if (isFetchingMoreRef.current) return;
        isFetchingMoreRef.current = true;
        setIsLoadingMore(true);
      } else {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        setIsLoadingRows(true);
        setRowsError(null);
      }

      const signal = abortControllerRef.current?.signal;
      const payload = {
        page: pageNum,
        page_size: CHUNK_SIZE,
      };

      if (sortConfig?.field && sortConfig?.order) {
        payload.sort = [
          {
            field: sortConfig.field,
            dir: sortConfig.order === "descend" ? "DESC" : "ASC",
          },
        ];
      }

      if (cqlExpression && String(cqlExpression).trim()) {
        payload.cql_expression = String(cqlExpression).trim();
      }

      try {
        const res = await layerApi.queryLayerFeatures(layer.id, payload, signal);
        const rowsData = res?.rows || [];
        const mappedRows = rowsData.map((r, idx) => ({
          key: r.fid || `${pageNum}-${idx}`,
          __fid: r.fid,
          ...(r.properties || {}),
        }));

        if (append) {
          setRows((prev) => {
            const seen = new Set(prev.map((item) => item.key));
            const uniqueNew = mappedRows.filter((item) => !seen.has(item.key));
            return [...prev, ...uniqueNew];
          });
        } else {
          setRows(mappedRows);
          const bodyEl = tableContainerRef.current?.querySelector(".ant-table-body");
          if (bodyEl) bodyEl.scrollTop = 0;
        }

        setCurrentPage(pageNum);
        setTotal(res?.total ?? mappedRows.length);

        if (!append && onCqlFilterChange) {
          if (cqlExpression && String(cqlExpression).trim()) {
            onCqlFilterChange(
              layer.id,
              String(cqlExpression).trim(),
              res?.normalized_cql || String(cqlExpression).trim()
            );
          }
        }
      } catch (err) {
        if (!signal?.aborted && err?.name !== "CanceledError" && err?.name !== "AbortError") {
          setRowsError(extractApiError(err));
        }
      } finally {
        if (append) {
          isFetchingMoreRef.current = false;
          setIsLoadingMore(false);
        } else {
          setIsLoadingRows(false);
        }
      }
    },
    [layer, schema]
  );

  // Trigger initial/reset query saat modal dibuka, sorter berubah, atau appliedCql berubah
  useEffect(() => {
    if (visible && layer && schema?.has_pk) {
      fetchFeatures(1, sorter, appliedCql, false);
    }
  }, [visible, layer, schema, sorter, appliedCql, fetchFeatures]);

  const hasMoreRows = rows.length < total;

  // Listener scroll pada .ant-table-body untuk memuat chunk berikutnya otomatis
  useEffect(() => {
    if (!visible || hasNoPk) return undefined;
    const container = tableContainerRef.current;
    const bodyEl = container?.querySelector(".ant-table-body");
    if (!bodyEl) return undefined;

    const handleScroll = () => {
      if (isLoadingRows || isLoadingMore || isFetchingMoreRef.current || !hasMoreRows) {
        return;
      }
      const distanceFromBottom = bodyEl.scrollHeight - bodyEl.scrollTop - bodyEl.clientHeight;
      if (distanceFromBottom <= 120) {
        fetchFeatures(currentPage + 1, sorter, appliedCql, true);
      }
    };

    bodyEl.addEventListener("scroll", handleScroll, { passive: true });
    return () => bodyEl.removeEventListener("scroll", handleScroll);
  }, [
    visible,
    hasNoPk,
    isLoadingRows,
    isLoadingMore,
    hasMoreRows,
    rows.length,
    currentPage,
    sorter,
    appliedCql,
    fetchFeatures,
  ]);

  // Handle sorting change
  const handleTableChange = (_pagination, _filters, newSorter) => {
    setSorter({
      field: newSorter.field || null,
      order: newSorter.order || null,
    });
  };

  const handleApplyCql = (nextExpression) => {
    const clean = nextExpression && String(nextExpression).trim() ? String(nextExpression).trim() : null;
    setAppliedCql(clean);
    if (!clean && layer && onCqlFilterChange) {
      onCqlFilterChange(layer.id, null, null);
    }
  };

  // Handle locate feature (fetch geometri lengkap via getFeatureById)
  const handleLocateRow = async (record) => {
    if (!record?.__fid || !layer) return;
    try {
      const full = await layerApi.getFeatureById(layer.id, record.__fid);
      if (full) {
        onSelectFeature?.(full);
        onClose();
      }
    } catch (_err) {
      // Locate failed
    }
  };

  const schemaFilterColumns = (schema?.columns || []).filter(
    (c) => !c.is_pk && !c.hidden && c.local_type !== "geometry" && c.name !== "geometry"
  );

  // Kolom aksi 'Locate' di paling kiri
  const activeColumns = [
    {
      title: "",
      key: "__actions",
      width: 50,
      fixed: "left",
      render: (_, record) => (
        <Tooltip title={t("locateOnMap", "Sorot di Peta")}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleLocateRow(record);
            }}
            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition cursor-pointer"
          >
            <LocateFixed className="w-4 h-4" />
          </button>
        </Tooltip>
      ),
    },
    ...columns.filter((c) => visibleColumns.includes(c.key)),
  ];

  return (
    <Modal
      title={
        <div className="flex items-center justify-between pr-8">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">
              {t("attributeTableTitle", "Tabel Atribut")}:{" "}
              {layer?.display_name || layer?.layer_name || layer?.store_name}
            </span>
            <Tag color="blue">
              {total.toLocaleString()} {t("features", "Fitur")}
            </Tag>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1020}
      footer={null}
      destroyOnHidden
      centered
      styles={{ body: { padding: "12px 16px" } }}
    >
      {/* Peringatan 409 Belum punya PK */}
      {hasNoPk && (
        <Alert
          type="warning"
          showIcon
          icon={<AlertTriangle className="w-5 h-5 text-amber-600" />}
          title={t("noPkWarningTitle", "Layer Belum Memiliki Primary Key (gid)")}
          description={
            <div>
              <p>
                {t(
                  "noPkWarningDesc",
                  "Layer belum memiliki primary key (gid). Silakan hubungi admin atau jalankan migrasi scripts/add_gid_pk.py terlebih dahulu."
                )}
              </p>
              <div className="mt-2 text-xs text-slate-500 font-mono bg-amber-100/50 p-2 rounded">
                python scripts/add_gid_pk.py --workspace {layer?.workspace_name}
              </div>
            </div>
          }
          className="mb-4"
        />
      )}

      {schemaError && <Alert type="error" title={schemaError} showIcon className="mb-4" />}

      {!hasNoPk && (
        <div className="space-y-3">
          {/* Toolbar: Filter toggle & Refresh */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Space>
              <Button
                size="small"
                icon={<Filter className="w-3.5 h-3.5" />}
                type={appliedCql ? "primary" : "default"}
                onClick={() => setIsFilterOpen((prev) => !prev)}
              >
                {t("filterBuilder", "Filter CQL")} {appliedCql ? "(Aktif)" : ""}
              </Button>

              {appliedCql && (
                <Button size="small" onClick={() => handleApplyCql(null)}>
                  {t("reset", "Reset")}
                </Button>
              )}

              <Button
                size="small"
                icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoadingRows ? "animate-spin" : ""}`} />}
                onClick={() => fetchFeatures(1, sorter, appliedCql, false)}
              >
                {t("refresh", "Refresh")}
              </Button>
            </Space>

            {/* Kolom Visibilitas Selector */}
            <Select
              mode="multiple"
              size="small"
              maxTagCount="responsive"
              placeholder={t("selectColumns", "Pilih Kolom")}
              value={visibleColumns}
              onChange={setVisibleColumns}
              style={{ minWidth: 200, maxWidth: 350 }}
            >
              {columns.map((c) => (
                <Option key={c.key} value={c.key}>
                  {c.title}
                </Option>
              ))}
            </Select>
          </div>

          {/* Panel Select by Attributes / CQL Filter Detail */}
          {isFilterOpen && (
            <CqlFilterBuilder
              layerId={layer?.id}
              layerTableName={schema?.table_name || layer?.geoserver_name || layer?.layer_name}
              schemaColumns={schemaFilterColumns}
              appliedExpression={appliedCql || ""}
              onApply={handleApplyCql}
              onClose={() => setIsFilterOpen(false)}
            />
          )}

          {rowsError && (
            <Alert type="error" title={rowsError} showIcon closable onClose={() => setRowsError(null)} />
          )}

          {/* Tabel Data Atribut (Scroll Tanpa Pagination) */}
          <div ref={tableContainerRef}>
            <Table
              columns={activeColumns}
              dataSource={rows}
              loading={isLoadingSchema || isLoadingRows}
              pagination={false}
              onChange={handleTableChange}
              scroll={{ x: "max-content", y: 380 }}
              size="small"
              bordered
              onRow={(record) => ({
                onDoubleClick: () => handleLocateRow(record),
                className: "cursor-pointer hover:bg-blue-50/50",
              })}
            />
          </div>

          {/* Status Bar Infinite Scroll */}
          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              {t("loadedFeaturesSummary", "Dimuat")}{" "}
              <strong className="text-slate-700">{rows.length.toLocaleString()}</strong>{" "}
              {t("ofTotalFeatures", "dari")}{" "}
              <strong className="text-slate-700">{total.toLocaleString()}</strong>{" "}
              {t("features", "fitur")}
              {hasMoreRows && (
                <span className="text-slate-400 ml-2">
                  • {t("scrollForMore", "Scroll ke bawah untuk memuat baris berikutnya secara otomatis")}
                </span>
              )}
            </span>

            <div className="flex items-center gap-2">
              {isLoadingMore && (
                <span className="flex items-center gap-1.5 text-blue-600">
                  <Spin size="small" />
                  {t("loadingMoreFeatures", "Memuat baris berikutnya...")}
                </span>
              )}
              {hasMoreRows && !isLoadingMore && (
                <Button
                  size="small"
                  onClick={() => fetchFeatures(currentPage + 1, sorter, appliedCql, true)}
                >
                  {t("loadMore", "Muat Lagi")}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default AttributeTableModal;
