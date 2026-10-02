import { useState, useEffect } from "react";
import { Modal, Button, Select, Input, message, Spin } from "antd";
import {
  Palette,
  Plus,
  Trash2,
  Check,
  Calculator,
  BookmarkPlus,
  SlidersHorizontal,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import layerApi from "../api/LayerApi";
import workspaceApi from "../api/WorkspaceApi";
import {
  COLOR_RAMP_PREVIEWS,
  PRESETS,
  loadSavedCustomRamps,
  saveCustomRampsToStorage,
  generateClassificationClasses,
} from "../utils/styleConstants";
import { useLanguage } from "../context/LanguageContext";

const LayerStyleModal = ({ open, onClose, layer, workspace, onStyleApplied }) => {
  const { t, translateApi } = useLanguage();
  const queryClient = useQueryClient();
  const isWorkspaceMode = Boolean(workspace);

  // Classification settings
  const [method, setMethod] = useState("jenks"); // "jenks", "equal_interval", "quantile", "manual"
  const [nClasses, setNClasses] = useState(10); // default 10 kelas
  const [colorRamp, setColorRamp] = useState("cyan_blue_magenta");
  const [styleType, setStyleType] = useState("intervals");

  // Custom Color Ramps State
  const [customRamps, setCustomRamps] = useState(loadSavedCustomRamps);
  const [isSaveRampModalOpen, setIsSaveRampModalOpen] = useState(false);
  const [newRampName, setNewRampName] = useState("");

  // Raster stats & saved status
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [stats, setStats] = useState(null);
  const [hasSavedSymbology, setHasSavedSymbology] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Table classes: [{ min, max, quantity, color, opacity, label }]
  const [classes, setClasses] = useState([]);

  // Gabungkan Standard Ramps dan Custom Ramps
  const allRamps = [...COLOR_RAMP_PREVIEWS, ...customRamps];

  // Fetch raster info & saved symbology saat modal dibuka
  useEffect(() => {
    if (!open) return;

    // Mode 1: Workspace Default Style Mode
    if (isWorkspaceMode) {
      const sym = workspace?.default_style_config;
      if (sym && sym.colors && sym.colors.length > 0) {
        setStyleType(sym.style_type || "intervals");
        setNClasses(sym.colors.length);
        setClasses(
          sym.colors.map((c) => ({
            min: c.min,
            max: c.max !== undefined ? c.max : c.quantity,
            quantity: c.quantity !== undefined ? c.quantity : c.max,
            color: c.color,
            opacity: c.opacity ?? 1.0,
            label: c.label || "",
          }))
        );
        setHasSavedSymbology(true);
        setLastSavedTime(sym.updated_at);
      } else {
        setHasSavedSymbology(false);
        setLastSavedTime(null);
        if (layer && layer.layer_type === "raster") {
          handleRunClassification(10, "jenks", "cyan_blue_magenta");
        } else {
          handleRunClassification(10, "equal_interval", "cyan_blue_magenta");
        }
      }
      return;
    }

    // Mode 2: Layer Individual Style Mode
    if (!layer) return;

    if (layer.layer_type === "raster") {
      setLoadingInfo(true);
      Promise.resolve(layerApi.getRasterInfo(layer.id))
        .then((res) => {
          const data = res?.data;
          if (data?.statistics) {
            setStats(data.statistics);
          }

          if (data?.saved_symbology && data.saved_symbology.classes?.length > 0) {
            const sym = data.saved_symbology;
            setStyleType(sym.style_type || "intervals");
            setMethod(sym.classification_method || "jenks");
            setNClasses(sym.classes_count || sym.classes.length);
            setColorRamp(sym.color_ramp || "cyan_blue_magenta");
            setClasses(sym.classes);
            setHasSavedSymbology(true);
            setLastSavedTime(sym.updated_at);
          } else {
            setHasSavedSymbology(false);
            setLastSavedTime(null);
            handleRunClassification(10, "jenks", "cyan_blue_magenta", data?.statistics);
          }
        })
        .catch((err) => {
          console.warn("Failed to load raster info, falling back:", err);
          handleRunClassification(10, "jenks", "cyan_blue_magenta");
        })
        .finally(() => {
          setLoadingInfo(false);
        });
    } else {
      // Vector layer: default classes
      setClasses([
        { quantity: 1, color: "#2b83ba", opacity: 1.0, label: "Feature 1" },
        { quantity: 2, color: "#ffffbf", opacity: 1.0, label: "Feature 2" },
        { quantity: 3, color: "#d7191c", opacity: 1.0, label: "Feature 3" },
      ]);
    }
  }, [open, layer, workspace]);

  // Fungsi memanggil API klasifikasi atau menghitung kelas secara DRY
  const handleRunClassification = async (
    classesCount = nClasses,
    classMethod = method,
    rampId = colorRamp,
    incomingStats = null
  ) => {
    const selectedRamp = allRamps.find((r) => r.id === rampId) || allRamps[0];
    const colors = selectedRamp?.colors || ["#00e5ff", "#0044ff", "#ff00ee"];
    const count = Number(classesCount) || 10;
    const currentStats = incomingStats || stats;

    setCalculating(true);
    try {
      if (layer && layer.id && layer.layer_type === "raster") {
        const res = await layerApi.classifyPreview(layer.id, {
          n_classes: count,
          method: classMethod,
          custom_colors: colors,
        });
        const result = res?.data?.data;
        if (result?.classes && result.classes.length > 0) {
          setClasses(result.classes);
          setStyleType("intervals");
          if (result.statistics) {
            setStats(result.statistics);
          }
          return;
        }
      }

      // Perhitungan lokal instan & DRY berbasis batas statistik
      const minVal = currentStats?.min ?? 0;
      const maxVal = currentStats?.max ?? 100;
      const newClasses = generateClassificationClasses({
        min: minVal,
        max: maxVal,
        count,
        method: classMethod,
        colors,
      });
      setClasses(newClasses);
      setStyleType("intervals");
    } catch (err) {
      console.warn("Classification computation fallback:", err);
      const newClasses = generateClassificationClasses({
        min: 0,
        max: 100,
        count,
        method: classMethod,
        colors,
      });
      setClasses(newClasses);
      setStyleType("intervals");
    } finally {
      setCalculating(false);
    }
  };

  // Simpan warna tabel saat ini sebagai Color Ramp Custom
  const handleSaveCurrentAsCustomRamp = () => {
    if (!newRampName.trim()) {
      message.warning("Masukkan nama Color Ramp terlebih dahulu!");
      return;
    }
    const currentColors = classes.map((c) => c.color).filter(Boolean);
    if (currentColors.length < 2) {
      message.warning("Minimal harus ada 2 warna pada kelas untuk disimpan sebagai Color Ramp!");
      return;
    }

    const newRamp = {
      id: `custom_${Date.now()}`,
      name: newRampName.trim(),
      colors: currentColors,
      isCustom: true,
    };

    const updated = [newRamp, ...customRamps];
    setCustomRamps(updated);
    saveCustomRampsToStorage(updated);
    setColorRamp(newRamp.id);
    setNewRampName("");
    setIsSaveRampModalOpen(false);
    message.success(`Color Ramp '${newRamp.name}' berhasil disimpan!`);
  };

  // Hapus Color Ramp Custom
  const handleDeleteCustomRamp = (e, rampId) => {
    e.stopPropagation();
    const updated = customRamps.filter((r) => r.id !== rampId);
    setCustomRamps(updated);
    saveCustomRampsToStorage(updated);
    if (colorRamp === rampId) {
      setColorRamp("cyan_blue_magenta");
      handleRunClassification(nClasses, method, "cyan_blue_magenta");
    }
    message.info("Color Ramp kustom berhasil dihapus.");
  };

  const updateClass = (index, field, value) => {
    setClasses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      if (field === "quantity") {
        updated[index].max = Number(value);
        if (updated[index].min !== undefined) {
          updated[index].label = `${updated[index].min} - ${value}`;
        }
      } else if (field === "max") {
        updated[index].quantity = Number(value);
        if (updated[index].min !== undefined) {
          updated[index].label = `${updated[index].min} - ${value}`;
        }
      }
      return updated;
    });
  };

  const addClass = () => {
    const lastCls = classes.length > 0 ? classes[classes.length - 1] : null;
    const lastQty = lastCls ? Number(lastCls.quantity || lastCls.max || 0) : 0;
    const newQty = Number((lastQty + 1).toFixed(2));
    setClasses((prev) => [
      ...prev,
      {
        min: lastQty,
        max: newQty,
        quantity: newQty,
        color: "#3b82f6",
        opacity: 1.0,
        label: `${lastQty} - ${newQty}`,
      },
    ]);
  };

  const removeClass = (index) => {
    if (classes.length <= 1) {
      message.warning(t('minOneColorClass', "Minimal harus ada 1 kelas warna!"));
      return;
    }
    setClasses((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: (data) => layerApi.updateStyle(data),
    onSuccess: (res) => {
      message.success(res?.data?.detail || t('styleSavedSuccess', "Klasifikasi & style layer berhasil disimpan!"));
      setHasSavedSymbology(true);
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      if (onStyleApplied && layer) {
        onStyleApplied(layer.id);
      }
      onClose();
    },
    onError: (err) => {
      message.error(translateApi(err, 'styleApplyFailed'));
    },
  });

  const workspaceMutation = useMutation({
    mutationFn: (data) => workspaceApi.saveDefaultStyle(workspace.id, data),
    onSuccess: (res) => {
      message.success(
        res?.data?.detail || t('workspaceDefaultStyleSaved', "Default style workspace berhasil disimpan!")
      );
      setHasSavedSymbology(true);
      queryClient.invalidateQueries({
        queryKey: ["workspace-detail", workspace.id],
      });
      if (onStyleApplied) {
        onStyleApplied();
      }
      onClose();
    },
    onError: (err) => {
      message.error(translateApi(err, 'workspaceDefaultStyleFailed'));
    },
  });

  const handleSubmit = () => {
    if (isWorkspaceMode) {
      if (!workspace) return;
      workspaceMutation.mutate({
        style_type: styleType,
        colors: classes.map((c) => ({
          quantity: Number(
            c.quantity !== undefined
              ? c.quantity
              : c.max !== undefined
              ? c.max
              : 0
          ),
          color: c.color,
          opacity: Number(c.opacity ?? 1.0),
          label: c.label || "",
        })),
        apply_to_existing: false,
      });
      return;
    }

    if (!layer) return;
    mutation.mutate({
      layer_id: layer.id,
      workspace_name: layer.workspace_name,
      layer_name: layer.geoserver_name || layer.table_name || layer.store_name || layer.layer_name,
      style_type: styleType,
      classification_method: method,
      classes_count: classes.length,
      color_ramp: colorRamp,
      colors: classes.map((c) => ({
        min: c.min !== undefined ? Number(c.min) : null,
        max: c.max !== undefined ? Number(c.max) : null,
        quantity: Number(c.quantity !== undefined ? c.quantity : c.max),
        color: c.color,
        opacity: Number(c.opacity ?? 1.0),
        label: c.label || "",
      })),
    });
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width={780}
        centered
        className="rounded-2xl overflow-hidden"
      >
        <div className="pt-2">
          {/* Header Modal */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-800">
                    {isWorkspaceMode
                      ? t('workspaceDefaultStyleTemplate', "Workspace Default Style Template")
                      : t('rasterSymbologyTitle', "Raster Symbology & Classification")}
                  </h2>
                </div>
                <p className="text-xs text-slate-500">
                  {isWorkspaceMode ? (
                    <>
                      Workspace:{" "}
                      <span className="font-semibold text-slate-700">
                        {workspace?.name}
                      </span>{" "}
                      ({t('defaultTemplate', 'Default Template')})
                    </>
                  ) : (
                    <>
                      Layer:{" "}
                      <span className="font-semibold text-slate-700">
                        {layer?.layer_name}
                      </span>{" "}
                      ({layer?.workspace_name})
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Raster Statistics Banner */}
          {stats && (
            <div className="mt-3 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50/70 to-teal-50/70 rounded-xl border border-blue-100 text-xs text-slate-700">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-blue-900 flex items-center gap-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  {t('dataStatistics', 'Data Statistics:')}
                </span>
                <span>
                  Min: <strong className="font-mono text-blue-800">{stats.min}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  Max: <strong className="font-mono text-blue-800">{stats.max}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  Mean: <strong className="font-mono text-blue-800">{stats.mean}</strong>
                </span>
                <span className="text-slate-300">|</span>
                <span>
                  Std: <strong className="font-mono text-blue-800">{stats.std}</strong>
                </span>
              </div>
              {stats.valid_pixels && (
                <span className="text-[11px] text-slate-400">
                  {stats.valid_pixels.toLocaleString()} pixels
                </span>
              )}
            </div>
          )}

          {/* Classification Controls Panel */}
          <div className="mt-3.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Classification Method */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  {t('classificationMethod', 'Classification Method:')}
                </label>
                <Select
                  value={method}
                  onChange={(val) => {
                    setMethod(val);
                    if (val !== "manual") {
                      handleRunClassification(nClasses, val, colorRamp);
                    }
                  }}
                  className="w-full text-xs"
                  options={[
                    { value: "jenks", label: "Natural Breaks (Jenks)" },
                    { value: "equal_interval", label: "Equal Interval" },
                    { value: "quantile", label: "Quantile" },
                    { value: "manual", label: "Manual (Custom)" },
                  ]}
                />
              </div>

              {/* Number of Classes */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Classes:
                </label>
                <Select
                  value={nClasses}
                  onChange={(val) => {
                    setNClasses(val);
                    handleRunClassification(val, method, colorRamp);
                  }}
                  className="w-full text-xs"
                  options={[
                    { value: 3, label: "3 Classes" },
                    { value: 4, label: "4 Classes" },
                    { value: 5, label: "5 Classes" },
                    { value: 6, label: "6 Classes" },
                    { value: 7, label: "7 Classes" },
                    { value: 8, label: "8 Classes" },
                    { value: 9, label: "9 Classes" },
                    { value: 10, label: "10 Classes (Default)" },
                    { value: 12, label: "12 Classes" },
                    { value: 15, label: "15 Classes" },
                  ]}
                />
              </div>

              {/* Color Ramp Selector */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-slate-600">
                    Color Ramp:
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsSaveRampModalOpen(true)}
                    className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5 hover:underline"
                    title="Simpan susunan warna saat ini sebagai Color Ramp kustom"
                  >
                    <BookmarkPlus className="w-3 h-3" />
                    + Simpan Custom
                  </button>
                </div>
                <Select
                  value={colorRamp}
                  onChange={(val) => {
                    setColorRamp(val);
                    handleRunClassification(nClasses, method, val);
                  }}
                  className="w-full text-xs"
                >
                  <Select.OptGroup label="Standard Color Ramps">
                    {COLOR_RAMP_PREVIEWS.map((ramp) => (
                      <Select.Option key={ramp.id} value={ramp.id}>
                        <div className="flex items-center gap-2">
                          <div className="flex h-2.5 w-14 rounded overflow-hidden shadow-inner flex-shrink-0">
                            {ramp.colors.map((c, i) => (
                              <div key={i} style={{ backgroundColor: c, flex: 1 }} />
                            ))}
                          </div>
                          <span className="text-xs truncate">{ramp.name}</span>
                        </div>
                      </Select.Option>
                    ))}
                  </Select.OptGroup>

                  {customRamps.length > 0 && (
                    <Select.OptGroup label="Custom Color Ramps (Tersimpan)">
                      {customRamps.map((ramp) => (
                        <Select.Option key={ramp.id} value={ramp.id}>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="flex h-2.5 w-14 rounded overflow-hidden shadow-inner flex-shrink-0">
                                {ramp.colors.map((c, i) => (
                                  <div key={i} style={{ backgroundColor: c, flex: 1 }} />
                                ))}
                              </div>
                              <span className="text-xs truncate font-medium text-teal-700">{ramp.name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteCustomRamp(e, ramp.id)}
                              className="text-slate-400 hover:text-red-500 p-0.5"
                              title="Hapus color ramp ini"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </Select.Option>
                      ))}
                    </Select.OptGroup>
                  )}
                </Select>
              </div>
            </div>

            {/* Tombol Re-classify */}
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="text-[11px] text-slate-500">
                SLD Mode: <strong>Intervals (Range Min &ndash; Max)</strong>
              </span>
              <Button
                size="small"
                type="default"
                icon={<Calculator className="w-3.5 h-3.5 text-teal-600" />}
                onClick={() => handleRunClassification(nClasses, method, colorRamp)}
                loading={calculating}
                className="text-xs flex items-center gap-1 font-medium"
              >
                Classify...
              </Button>
            </div>
          </div>

          {/* Tabel Rentang Kelas (Classification Breaks) */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Draw raster grouping values into classes ({classes.length} classes):
              </span>
              <Button
                type="dashed"
                size="small"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={addClass}
                className="text-xs flex items-center"
              >
                Add Class
              </Button>
            </div>

            {loadingInfo || calculating ? (
              <div className="flex items-center justify-center py-10 bg-slate-50 rounded-xl border border-slate-200">
                <Spin tip="Calculating raster values &amp; intervals..." />
              </div>
            ) : (
              <div className="max-h-[260px] overflow-y-auto overflow-x-auto pr-1 border border-slate-200 rounded-xl bg-slate-50/50 p-1.5">
                <div className="min-w-[620px] space-y-1.5">
                  {/* Header Tabel */}
                  <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-lg">
                    <div className="w-24">Symbol</div>
                    <div className="w-36">Range (Min - Max)</div>
                    <div className="flex-1">Label</div>
                    <div className="w-20">Value (&le;)</div>
                    <div className="w-20">Opacity</div>
                    <div className="w-6"></div>
                  </div>

                  {classes.map((cls, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 text-xs hover:border-slate-300 hover:shadow-xs transition"
                    >
                      {/* Symbol / Color Picker */}
                      <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                        <input
                          type="color"
                          value={cls.color}
                          onChange={(e) => updateClass(idx, "color", e.target.value)}
                          className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                          title="Pick Symbol Color"
                        />
                        <input
                          type="text"
                          value={cls.color}
                          onChange={(e) => updateClass(idx, "color", e.target.value)}
                          className="w-14 px-1 py-0.5 text-[10px] font-mono border border-slate-200 rounded uppercase text-slate-700"
                        />
                      </div>

                      {/* Range (Min - Max) */}
                      <div className="w-36 flex items-center gap-1 flex-shrink-0">
                        <input
                          type="number"
                          step="any"
                          value={cls.min ?? ""}
                          placeholder="Min"
                          onChange={(e) => updateClass(idx, "min", parseFloat(e.target.value))}
                          className="w-16 px-1.5 py-1 text-xs border border-slate-200 rounded text-slate-800 font-mono text-center"
                        />
                        <span className="text-slate-400 font-bold">-</span>
                        <input
                          type="number"
                          step="any"
                          value={cls.max ?? cls.quantity ?? ""}
                          placeholder="Max"
                          onChange={(e) => updateClass(idx, "max", parseFloat(e.target.value))}
                          className="w-16 px-1.5 py-1 text-xs border border-slate-200 rounded text-slate-800 font-mono text-center font-medium"
                        />
                      </div>

                      {/* Label */}
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={cls.label || ""}
                          placeholder="Custom Label..."
                          onChange={(e) => updateClass(idx, "label", e.target.value)}
                          className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-700"
                        />
                      </div>

                      {/* Value Threshold (GeoServer quantity) */}
                      <div className="w-20 flex-shrink-0">
                        <input
                          type="number"
                          step="any"
                          value={cls.quantity !== undefined ? cls.quantity : (cls.max ?? 0)}
                          onChange={(e) => updateClass(idx, "quantity", parseFloat(e.target.value))}
                          className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded text-slate-800 font-mono text-center"
                        />
                      </div>

                      {/* Opacity */}
                      <div className="w-20 flex items-center gap-1 flex-shrink-0">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.05"
                          value={cls.opacity ?? 1.0}
                          onChange={(e) => updateClass(idx, "opacity", parseFloat(e.target.value))}
                          className="w-12 accent-teal-600 cursor-pointer"
                        />
                        <span className="text-[10px] font-mono text-slate-500">
                          {Math.round((cls.opacity ?? 1.0) * 100)}%
                        </span>
                      </div>

                      {/* Hapus */}
                      <button
                        type="button"
                        onClick={() => removeClass(idx)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                        title="Remove Class"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Preview Legenda */}
          <div className="mt-3.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
              Legend Preview:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {classes.map((cls, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs"
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0 border border-black/10"
                    style={{
                      backgroundColor: cls.opacity === 0 ? "transparent" : cls.color,
                    }}
                  />
                  <span className="font-semibold text-slate-800">
                    {cls.label || (cls.min !== undefined && cls.max !== undefined ? `${cls.min} - ${cls.max}` : `Val ${cls.quantity}`)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              {lastSavedTime && (
                <span>
                  Last saved: {new Date(lastSavedTime).toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onClose}
                disabled={
                  isWorkspaceMode
                    ? workspaceMutation.isPending
                    : mutation.isPending
                }
              >
                Cancel
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={
                  isWorkspaceMode
                    ? workspaceMutation.isPending
                    : mutation.isPending
                }
                icon={<Check className="w-4 h-4" />}
                className="bg-teal-600 hover:bg-teal-500 flex items-center gap-1"
              >
                {isWorkspaceMode
                  ? "Terapkan & Simpan Default Style Workspace"
                  : "Apply & Save Classification"}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal Simpan Custom Color Ramp */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
            <BookmarkPlus className="w-4 h-4 text-teal-600" />
            Simpan Color Ramp Custom
          </div>
        }
        open={isSaveRampModalOpen}
        onCancel={() => setIsSaveRampModalOpen(false)}
        onOk={handleSaveCurrentAsCustomRamp}
        okText="Simpan"
        cancelText="Batal"
        okButtonProps={{ className: "bg-teal-600 hover:bg-teal-500" }}
        centered
        width={420}
      >
        <div className="py-2 space-y-3">
          <p className="text-xs text-slate-500">
            Warna-warna dari susunan kelas saat ini ({classes.length} warna) akan disimpan ke daftar Color Ramp Anda:
          </p>

          {/* Preview Warna yang akan disimpan */}
          <div className="flex h-3.5 w-full rounded-md overflow-hidden shadow-inner border border-slate-200">
            {classes.map((c, i) => (
              <div key={i} style={{ backgroundColor: c.color, flex: 1 }} />
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Color Ramp:
            </label>
            <Input
              placeholder="Contoh: Gradasi Bahaya Banjir..."
              value={newRampName}
              onChange={(e) => setNewRampName(e.target.value)}
              onPressEnter={handleSaveCurrentAsCustomRamp}
              maxLength={40}
              autoFocus
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default LayerStyleModal;
