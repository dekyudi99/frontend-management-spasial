import { useState, useEffect, useReducer, useRef, useMemo, useCallback } from "react";
import { Modal, Button, Select, Input, message, Spin, Tag, Tooltip, Alert, Slider, InputNumber } from "antd";
import {
  Palette,
  Plus,
  Trash2,
  Check,
  Calculator,
  BookmarkPlus,
  SlidersHorizontal,
  Circle,
  Square,
  Triangle,
  Star,
  Sparkles,
  Sliders,
  RotateCcw,
  Image as ImageIcon,
  AlertTriangle,
  Combine,
  Maximize2,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import layerApi from "../api/LayerApi";
import workspaceApi from "../api/WorkspaceApi";
import { GEOSERVER_BASE_URL } from "../api/microserviceConfig";
import {
  COLOR_RAMP_PREVIEWS,
  QUALITATIVE_PALETTES,
  PRESETS,
  CLASSIFICATION_METHODS,
  loadSavedCustomRamps,
  saveCustomRampsToStorage,
  findMatchingColorRamp,
  normalizeClassificationMethod,
  sampleRampColors,
  equalIntervalBreaks,
  uniqueValueClasses,
  createInitialClassificationState,
  getClassesFromState,
  validateClassification,
  classificationReducer,
  toApplyPayload,
  fromSavedSymbology,
  formatBound,
  formatClassLabel,
  parseNumberInput,
} from "../utils/styleConstants";
import { useLanguage } from "../context/LanguageContext";

// Presets warna untuk Vektor (konsisten dengan FlowGIS design tokens)
const VECTOR_PRESET_PALETTES = [
  { name: "Teal AstraGIS", fill: "#0d9488", stroke: "#0f766e", label: "Teal" },
  { name: "Ocean Blue", fill: "#0284c7", stroke: "#0369a1", label: "Blue" },
  { name: "Crimson Alert", fill: "#e11d48", stroke: "#be123c", label: "Red" },
  { name: "Sunset Amber", fill: "#d97706", stroke: "#b45309", label: "Amber" },
  { name: "Emerald Forest", fill: "#059669", stroke: "#047857", label: "Green" },
  { name: "Royal Purple", fill: "#7c3aed", stroke: "#6d28d9", label: "Purple" },
  { name: "Slate Gray", fill: "#475569", stroke: "#1e293b", label: "Slate" },
];

const MARK_OPTIONS = [
  { id: "circle", labelKey: "shapeCircle", defaultLabel: "Lingkaran", icon: Circle },
  { id: "square", labelKey: "shapeSquare", defaultLabel: "Persegi", icon: Square },
  { id: "triangle", labelKey: "shapeTriangle", defaultLabel: "Segitiga", icon: Triangle },
  { id: "star", labelKey: "shapeStar", defaultLabel: "Bintang", icon: Star },
  { id: "cross", labelKey: "shapeCross", defaultLabel: "Salib (+)", icon: Plus },
];

const STROKE_DASH_OPTIONS = [
  { id: "solid", labelKey: "lineSolid", defaultLabel: "Garis Utuh", value: null },
  { id: "dashed", labelKey: "lineDashed", defaultLabel: "Putus-putus", value: "6,4" },
  { id: "dotted", labelKey: "lineDotted", defaultLabel: "Titik-titik", value: "2,4" },
];

/**
 * Komponen Input batas yang menerima "," dan "." serta hanya meng-commit saat onBlur
 * agar tidak mengganggu pengetikan user.
 */
const BoundInput = ({ value, onCommit, disabled, className, placeholder }) => {
  const [localText, setLocalText] = useState(value !== undefined && value !== null ? String(value) : "");

  useEffect(() => {
    setLocalText(value !== undefined && value !== null ? String(value) : "");
  }, [value]);

  const handleBlur = () => {
    const parsed = parseNumberInput(localText);
    if (parsed !== null && parsed !== value) {
      onCommit(parsed);
    } else {
      setLocalText(value !== undefined && value !== null ? String(value) : "");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.target.blur();
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      disabled={disabled}
      value={localText}
      placeholder={placeholder}
      onChange={(e) => setLocalText(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={className}
    />
  );
};

const LayerStyleModal = ({ open, onClose, layer, workspace, onStyleApplied }) => {
  const { t, translateApi } = useLanguage();
  const queryClient = useQueryClient();
  const isWorkspaceMode = Boolean(workspace);

  // Deteksi tipe data vektor
  const isVector =
    !isWorkspaceMode &&
    (layer?.layer_type === "vector" ||
      ["SHP", "GEOJSON", "KML", "KMZ"].includes(
        String(layer?.data_type || layer?.file_format || "").toUpperCase()
      ));

  const rawGeom = String(layer?.geom_type || layer?.geometry_type || "").toLowerCase();
  const isPoint = rawGeom.includes("point");
  const isLine = rawGeom.includes("line") || rawGeom.includes("string");
  const isPolygon = !isPoint && !isLine;

  // ==================== STATE VEKTOR ====================
  const [fillColor, setFillColor] = useState("#0d9488");
  const [strokeColor, setStrokeColor] = useState("#0f766e");
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [fillOpacity, setFillOpacity] = useState(0.65);
  const [strokeOpacity, setStrokeOpacity] = useState(1.0);
  const [pointSize, setPointSize] = useState(8);
  const [mark, setMark] = useState("circle");
  const [strokeDash, setStrokeDash] = useState("solid");
  const [markerType, setMarkerType] = useState("shape");
  const [selectedIcon, setSelectedIcon] = useState("agriculture-wheat-svgrepo-com.svg");
  const [availableIcons, setAvailableIcons] = useState([]);
  const [loadingIcons, setLoadingIcons] = useState(false);

  // ==================== STATE RASTER DENGAN REDUCER MURNI ====================
  const [cState, cDispatch] = useReducer(classificationReducer, null, () =>
    createInitialClassificationState()
  );

  const [loadingInfo, setLoadingInfo] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState(null);
  const [categoricalHint, setCategoricalHint] = useState(false);
  const [presetWarning, setPresetWarning] = useState(null);
  const [hasSavedSymbology, setHasSavedSymbology] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState(null);

  // Custom Color Ramps State
  const [customRamps, setCustomRamps] = useState(loadSavedCustomRamps);
  const [isSaveRampModalOpen, setIsSaveRampModalOpen] = useState(false);
  const [newRampName, setNewRampName] = useState("");

  // Refs untuk debounce & AbortController request klasifikasi otomatis
  const abortControllerRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Daftar seluruh Color Ramp
  const allRamps = useMemo(
    () => [...COLOR_RAMP_PREVIEWS, ...QUALITATIVE_PALETTES, ...customRamps],
    [customRamps]
  );

  // Kelas raster yang diturunkan dari breaks (Single source of truth)
  const derivedClasses = useMemo(() => getClassesFromState(cState), [cState]);

  // Validasi klasifikasi raster
  const validation = useMemo(() => validateClassification(cState), [cState]);

  // Helper eksekusi klasifikasi otomatis (Jenks / Quantile via API dengan AbortController + Debounce)
  const runAutoClassification = useCallback(
    (targetMethod, targetCount, targetRampId) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const normMethod = normalizeClassificationMethod(targetMethod);
      const count = Math.max(1, Math.min(50, Number(targetCount) || 5));

      // 1. Equal Interval: dihitung lokal tanpa API
      if (normMethod === CLASSIFICATION_METHODS.EQUAL_INTERVAL) {
        const minVal = stats && Number.isFinite(stats.min) ? stats.min : 0;
        const maxVal = stats && Number.isFinite(stats.max) ? stats.max : 100;
        const breaks = equalIntervalBreaks(minVal, maxVal, count);
        const selectedRamp = allRamps.find((r) => r.id === targetRampId) || allRamps[0];
        const rampColors = sampleRampColors(selectedRamp.colors, count);

        cDispatch({
          type: "APPLY_AUTO_METHOD",
          method: normMethod,
          breaks,
          rampColors,
        });
        return;
      }

      // 2. Natural Breaks & Quantile: panggil backend via endpoint raster-classify
      if (
        normMethod === CLASSIFICATION_METHODS.NATURAL_BREAKS ||
        normMethod === CLASSIFICATION_METHODS.QUANTILE
      ) {
        if (!layer?.id) return;
        setCalculating(true);

        debounceTimerRef.current = setTimeout(async () => {
          const controller = new AbortController();
          abortControllerRef.current = controller;

          try {
            const res = await layerApi.rasterClassify(
              layer.id,
              { method: normMethod, classes: count },
              { signal: controller.signal }
            );

            if (res && Array.isArray(res.breaks) && res.breaks.length >= 2) {
              const selectedRamp = allRamps.find((r) => r.id === targetRampId) || allRamps[0];
              const effCount = res.breaks.length - 1;
              const rampColors = sampleRampColors(selectedRamp.colors, effCount);

              cDispatch({
                type: "APPLY_AUTO_METHOD",
                method: normMethod,
                breaks: res.breaks,
                rampColors,
              });

              if (res.notice) {
                message.info(res.notice);
              }
            }
          } catch (err) {
            if (err?.name === "CanceledError" || err?.name === "AbortError") {
              return;
            }
            console.warn("Classification API error:", err);
            const errDetail = err?.response?.data?.detail || "Gagal menghitung klasifikasi raster.";
            message.error(errDetail);
          } finally {
            setCalculating(false);
          }
        }, 300);
      }
    },
    [layer?.id, stats, allRamps]
  );

  // Inisialisasi data saat modal dibuka
  useEffect(() => {
    if (!open) return;

    // Reset warnings & hints
    setCategoricalHint(false);
    setPresetWarning(null);
    setStatsError(null);

    // Mode Vektor
    if (isVector) {
      const sym = layer?.symbology?.symbol || (typeof layer?.symbology === "object" ? layer?.symbology : null) || {};
      setFillColor(sym.fill_color || "#0d9488");
      setStrokeColor(sym.stroke_color || "#0f766e");
      setStrokeWidth(sym.stroke_width !== undefined ? Number(sym.stroke_width) : 2);
      setFillOpacity(sym.fill_opacity !== undefined ? Number(sym.fill_opacity) : 0.65);
      setStrokeOpacity(sym.stroke_opacity !== undefined ? Number(sym.stroke_opacity) : 1.0);
      setPointSize(sym.point_size !== undefined ? Number(sym.point_size) : 8);

      const rawMark = sym.mark || "circle";
      const isIcon = sym.marker_type === "icon" || Boolean(sym.icon_name) || String(rawMark).startsWith("icon:");
      const iconName = sym.icon_name || (String(rawMark).startsWith("icon:") ? String(rawMark).slice(5) : null);

      if (isIcon) {
        setMarkerType("icon");
        if (iconName) setSelectedIcon(iconName);
      } else {
        setMarkerType("shape");
        setMark(rawMark);
      }

      loadVectorIcons(iconName);

      if (sym.stroke_dasharray === "2,4") setStrokeDash("dotted");
      else if (sym.stroke_dasharray) setStrokeDash("dashed");
      else setStrokeDash("solid");

      setHasSavedSymbology(Boolean(layer?.symbology));
      setLastSavedTime(layer?.symbology?.updated_at || null);
      return;
    }

    // Mode Raster
    if (!layer?.id) return;

    setLoadingInfo(true);
    layerApi
      .getRasterInfo(layer.id)
      .then((res) => {
        const data = res?.data;
        const currentStats = data?.statistics || null;
        setStats(currentStats);

        if (!currentStats && data?.statistics_error) {
          setStatsError(data.statistics_error);
        }

        // 1. Jika saved_symbology ada (version 2 atau data tersimpan): pulihkan apa adanya tanpa hitung ulang
        if (data?.saved_symbology && Array.isArray(data.saved_symbology.classes) && data.saved_symbology.classes.length > 0) {
          const restoredState = fromSavedSymbology(data.saved_symbology, currentStats);
          cDispatch({
            type: "APPLY_AUTO_METHOD",
            method: restoredState.method,
            breaks: restoredState.breaks,
            rampColors: restoredState.colors,
          });
          // Pulihkan properti tambahan
          if (restoredState.presetId) {
            const p = PRESETS.find((item) => item.id === restoredState.presetId);
            if (p) cDispatch({ type: "APPLY_PRESET", preset: p });
          }
          setHasSavedSymbology(true);
          setLastSavedTime(data.saved_symbology.updated_at || null);
          return;
        }

        // 2. Jika tidak ada saved_symbology, tentukan default berdasarkan statistik:
        setHasSavedSymbology(false);
        setLastSavedTime(null);

        // Kasus: Data kategorikal terdeteksi (is_integer dan unique_values <= 20)
        if (
          currentStats &&
          currentStats.is_integer &&
          Array.isArray(currentStats.unique_values) &&
          currentStats.unique_values.length > 0 &&
          currentStats.unique_values.length <= 20
        ) {
          setCategoricalHint(true);
          const uClasses = uniqueValueClasses(currentStats.unique_values, QUALITATIVE_PALETTES[0].colors);
          const breaks = uClasses.map((c) => c.quantity);
          cDispatch({
            type: "APPLY_AUTO_METHOD",
            method: CLASSIFICATION_METHODS.UNIQUE_VALUES,
            breaks: breaks.length > 0 ? breaks : [0, 1],
            rampColors: uClasses.map((c) => c.color),
          });
          return;
        }

        // Kasus umum: Default Natural Breaks dengan jumlah kelas min(10, jumlah nilai unik)
        const defaultCount = Math.min(
          10,
          currentStats?.unique_values?.length ? currentStats.unique_values.length : 10
        );

        if (currentStats && Number.isFinite(currentStats.min) && Number.isFinite(currentStats.max)) {
          runAutoClassification(CLASSIFICATION_METHODS.NATURAL_BREAKS, defaultCount, "traffic_light");
        } else {
          // Statistik tidak tersedia: inisialisasi state manual kosong
          cDispatch({
            type: "APPLY_AUTO_METHOD",
            method: CLASSIFICATION_METHODS.MANUAL,
            breaks: [0, 1],
            rampColors: ["#00e5ff"],
          });
        }
      })
      .catch((err) => {
        console.warn("Gagal memuat raster info:", err);
        setStatsError("Gagal memproses statistik raster dari server.");
      })
      .finally(() => {
        setLoadingInfo(false);
      });
  }, [open, layer?.id, isVector]);

  // Handler pemilihan metode klasifikasi
  const handleMethodSelect = (newMethod) => {
    const applyMethod = (target) => {
      if (target === "preset") {
        const defaultPreset = PRESETS[0];
        handlePresetSelect(defaultPreset.id);
        return;
      }
      if (target === CLASSIFICATION_METHODS.UNIQUE_VALUES) {
        if (stats?.unique_values && stats.unique_values.length > 0) {
          const uClasses = uniqueValueClasses(stats.unique_values, QUALITATIVE_PALETTES[0].colors);
          cDispatch({
            type: "APPLY_AUTO_METHOD",
            method: CLASSIFICATION_METHODS.UNIQUE_VALUES,
            breaks: uClasses.map((c) => c.quantity),
            rampColors: uClasses.map((c) => c.color),
          });
        }
        return;
      }
      if (target === CLASSIFICATION_METHODS.MANUAL) {
        // Hanya ubah tanda metode menjadi manual tanpa menghitung ulang breaks
        cDispatch({
          type: "SET_BREAK",
          index: 0,
          value: cState.breaks[0],
        });
        return;
      }
      runAutoClassification(target, cState.classCount, cState.rampId);
    };

    if (cState.method === CLASSIFICATION_METHODS.MANUAL && newMethod !== CLASSIFICATION_METHODS.MANUAL) {
      Modal.confirm({
        title: t("confirmOverwriteTitle", "Konfirmasi Perubahan Klasifikasi"),
        content: t(
          "confirmOverwriteContent",
          "Perubahan manual akan ditimpa. Lanjutkan?"
        ),
        okText: t("continue", "Lanjutkan"),
        cancelText: t("cancel", "Batal"),
        onOk: () => applyMethod(newMethod),
      });
      return;
    }

    applyMethod(newMethod);
  };

  // Handler perubahan jumlah kelas
  const handleClassCountChange = (newCount) => {
    const applyCount = (cnt) => {
      if (cState.method === CLASSIFICATION_METHODS.UNIQUE_VALUES) return;
      const targetMethod =
        cState.method === CLASSIFICATION_METHODS.MANUAL
          ? cState.lastAutoMethod || CLASSIFICATION_METHODS.NATURAL_BREAKS
          : cState.method;
      runAutoClassification(targetMethod, cnt, cState.rampId);
    };

    if (cState.method === CLASSIFICATION_METHODS.MANUAL) {
      Modal.confirm({
        title: t("confirmOverwriteTitle", "Konfirmasi Perubahan Klasifikasi"),
        content: t(
          "confirmOverwriteContent",
          "Perubahan manual akan ditimpa. Lanjutkan?"
        ),
        okText: t("continue", "Lanjutkan"),
        cancelText: t("cancel", "Batal"),
        onOk: () => applyCount(newCount),
      });
      return;
    }

    applyCount(newCount);
  };

  // Handler klik tombol "Classify..."
  const handleReclassifyClick = () => {
    const targetMethod = cState.lastAutoMethod || CLASSIFICATION_METHODS.NATURAL_BREAKS;
    if (cState.method === CLASSIFICATION_METHODS.MANUAL) {
      Modal.confirm({
        title: t("confirmOverwriteTitle", "Konfirmasi Perubahan Klasifikasi"),
        content: t(
          "confirmOverwriteContent",
          `Perubahan manual akan ditimpa dengan perhitungan ulang metode '${targetMethod}'. Lanjutkan?`
        ),
        okText: t("continue", "Lanjutkan"),
        cancelText: t("cancel", "Batal"),
        onOk: () => runAutoClassification(targetMethod, cState.classCount, cState.rampId),
      });
      return;
    }
    runAutoClassification(targetMethod, cState.classCount, cState.rampId);
  };

  // Handler kembali ke lastAutoMethod saat sedang manual
  const handleRevertToAuto = () => {
    const targetMethod = cState.lastAutoMethod || CLASSIFICATION_METHODS.NATURAL_BREAKS;
    Modal.confirm({
      title: t("confirmRevertTitle", "Kembalikan ke Klasifikasi Otomatis"),
      content: t(
        "confirmRevertContent",
        `Kembalikan klasifikasi ke '${targetMethod}'? Perubahan manual Anda akan ditimpa.`
      ),
      okText: t("continue", "Lanjutkan"),
      cancelText: t("cancel", "Batal"),
      onOk: () => runAutoClassification(targetMethod, cState.classCount, cState.rampId),
    });
  };

  // Handler pemilihan preset template
  const handlePresetSelect = (presetId) => {
    const p = PRESETS.find((item) => item.id === presetId);
    if (!p) return;

    // Cek apakah rentang data di luar rentang preset
    if (stats && Number.isFinite(stats.min) && Number.isFinite(stats.max)) {
      const quantities = p.classes.map((c) => Number(c.quantity)).filter(Number.isFinite);
      if (quantities.length > 0) {
        const pMin = Math.min(...quantities);
        const pMax = Math.max(...quantities);
        if (stats.min < pMin || stats.max > pMax) {
          setPresetWarning(
            `Peringatan: Rentang data raster [${stats.min}, ${stats.max}] berada di luar rentang preset ini [${pMin}, ${pMax}]. Data tidak akan dipotong.`
          );
        } else {
          setPresetWarning(null);
        }
      }
    }

    cDispatch({ type: "APPLY_PRESET", preset: p });
  };

  // Handler Color Ramp change
  const handleRampChange = (rampId) => {
    const selected = allRamps.find((r) => r.id === rampId);
    if (!selected) return;
    cDispatch({
      type: "APPLY_RAMP",
      rampId: selected.id,
      baseColors: selected.colors,
    });
  };

  // Simpan custom color ramp
  const handleSaveCurrentAsCustomRamp = () => {
    if (!newRampName.trim()) {
      message.warning("Masukkan nama Color Ramp terlebih dahulu!");
      return;
    }
    const currentColors = derivedClasses.map((c) => c.color).filter(Boolean);
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
    setNewRampName("");
    setIsSaveRampModalOpen(false);
    message.success(`Color Ramp '${newRamp.name}' berhasil disimpan!`);
  };

  // Hapus custom color ramp
  const handleDeleteCustomRamp = (e, rampId) => {
    e.stopPropagation();
    const updated = customRamps.filter((r) => r.id !== rampId);
    setCustomRamps(updated);
    saveCustomRampsToStorage(updated);
    message.info("Color Ramp kustom berhasil dihapus.");
  };

  // Helper load icons untuk data vektor
  const loadVectorIcons = async (defaultToSelect = null) => {
    try {
      setLoadingIcons(true);
      const res = await layerApi.getVectorIcons();
      const list = res?.data || [];
      setAvailableIcons(list);
      if (defaultToSelect && list.some((item) => item.id === defaultToSelect || item.filename === defaultToSelect)) {
        setSelectedIcon(defaultToSelect);
      } else if (list.length > 0 && !selectedIcon) {
        setSelectedIcon(list[0].filename || list[0].id);
      }
    } catch (err) {
      console.warn("Gagal memuat ikon vektor:", err);
    } finally {
      setLoadingIcons(false);
    }
  };

  const handleResetVector = () => {
    setFillColor("#0d9488");
    setStrokeColor("#0f766e");
    setStrokeWidth(2);
    setFillOpacity(0.65);
    setStrokeOpacity(1.0);
    setPointSize(8);
    setMark("circle");
    setMarkerType("shape");
    setStrokeDash("solid");
  };

  const svgDashArray = strokeDash === "dashed" ? "6,4" : strokeDash === "dotted" ? "2,4" : undefined;

  // React Query Mutation untuk menyimpan style ke GeoServer
  const mutation = useMutation({
    mutationFn: (data) => layerApi.updateStyle(data),
    onSuccess: (res) => {
      message.success(
        res?.data?.detail || t("styleSavedSuccess", "Klasifikasi & style layer berhasil disimpan!")
      );
      setHasSavedSymbology(true);
      setLastSavedTime(new Date().toISOString());
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      if (onStyleApplied && layer) {
        onStyleApplied(layer.id);
      }
      onClose();
    },
    onError: (err) => {
      const errMsg = err?.response?.data?.detail || err?.message || translateApi(err, "styleApplyFailed");
      message.error(errMsg);
    },
  });

  const workspaceMutation = useMutation({
    mutationFn: (data) => workspaceApi.saveDefaultStyle(workspace.id, data),
    onSuccess: (res) => {
      message.success(
        res?.data?.detail || t("workspaceDefaultStyleSaved", "Default style workspace berhasil disimpan!")
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
      message.error(translateApi(err, "workspaceDefaultStyleFailed"));
    },
  });

  // Submit Handler
  const handleSubmit = () => {
    if (isWorkspaceMode) {
      if (!workspace) return;
      workspaceMutation.mutate({
        style_type: "intervals",
        colors: derivedClasses.map((c) => ({
          quantity: c.quantity,
          color: c.color,
          opacity: c.opacity,
          label: c.label || "",
        })),
        apply_to_existing: false,
      });
      return;
    }

    if (!layer) return;

    if (isVector) {
      const dashParam = STROKE_DASH_OPTIONS.find((opt) => opt.id === strokeDash)?.value || null;
      const geomType = layer.geom_type || layer.geometry_type || (isPoint ? "Point" : isLine ? "LineString" : "Polygon");
      const isIconMode = markerType === "icon" && Boolean(selectedIcon);

      mutation.mutate({
        layer_id: layer.id,
        workspace_name: layer.workspace_name,
        layer_name: layer.geoserver_name || layer.table_name || layer.layer_name,
        layer_kind: "vector",
        geometry_type: geomType,
        style_mode: "single",
        symbol: {
          fill_color: fillColor,
          fill_opacity: Number(fillOpacity),
          stroke_color: strokeColor,
          stroke_width: Number(strokeWidth),
          stroke_opacity: Number(strokeOpacity),
          point_size: Number(pointSize),
          mark: isIconMode ? `icon:${selectedIcon}` : mark,
          stroke_dasharray: dashParam,
          marker_type: markerType,
          icon_name: isIconMode ? selectedIcon : null,
          icon_url: isIconMode ? `http://geoserver-microservice:8001/assets/${selectedIcon}` : null,
        },
      });
      return;
    }

    // Mode Raster: Validasi terlebih dahulu
    if (!validation.valid) {
      message.error(validation.errors[0]?.message || t("validationError", "Perbaiki kesalahan batas kelas sebelum menyimpan."));
      return;
    }

    const payload = toApplyPayload(cState, {
      layer_id: layer.id,
      workspace_name: layer.workspace_name,
      layer_name: layer.geoserver_name || layer.table_name || layer.store_name || layer.layer_name,
    });

    mutation.mutate(payload);
  };

  // Preview Point Vektor
  const renderPointPreview = () => {
    const s = Math.min(36, Math.max(12, Math.round(pointSize * 1.25)));
    const cx = 22;
    const cy = 22;

    if (markerType === "icon" && selectedIcon) {
      const iconObj = availableIcons.find((i) => i.id === selectedIcon || i.filename === selectedIcon);
      const iconPath = iconObj?.url || `/assets/${selectedIcon}`;
      const fullUrl = iconPath.startsWith("http") ? iconPath : `${GEOSERVER_BASE_URL}${iconPath.startsWith("/") ? "" : "/"}${iconPath}`;

      return (
        <image
          href={fullUrl}
          x={cx - s / 2}
          y={cy - s / 2}
          width={s}
          height={s}
          preserveAspectRatio="xMidYMid meet"
        />
      );
    }

    switch (mark) {
      case "square":
        return (
          <rect
            x={cx - s / 2}
            y={cy - s / 2}
            width={s}
            height={s}
            rx="1"
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={Math.min(3, strokeWidth)}
            strokeOpacity={strokeOpacity}
          />
        );
      case "triangle":
        return (
          <polygon
            points={`${cx},${cy - s / 2} ${cx + s / 2},${cy + s / 2} ${cx - s / 2},${cy + s / 2}`}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={Math.min(3, strokeWidth)}
            strokeOpacity={strokeOpacity}
          />
        );
      case "star": {
        const rOuter = s / 2;
        const rInner = rOuter * 0.45;
        const points = [];
        for (let i = 0; i < 10; i++) {
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const r = i % 2 === 0 ? rOuter : rInner;
          points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
        }
        return (
          <polygon
            points={points.join(" ")}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={Math.min(3, strokeWidth)}
            strokeOpacity={strokeOpacity}
          />
        );
      }
      default:
        return (
          <circle
            cx={cx}
            cy={cy}
            r={Math.min(16, Math.max(4, pointSize))}
            fill={fillColor}
            fillOpacity={fillOpacity}
            stroke={strokeColor}
            strokeWidth={Math.min(3, strokeWidth)}
            strokeOpacity={strokeOpacity}
          />
        );
    }
  };

  const hasStats = Boolean(stats && Number.isFinite(stats.min) && Number.isFinite(stats.max));

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        width={isVector ? 620 : 800}
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
                      ? t("workspaceDefaultStyleTemplate", "Workspace Default Style Template")
                      : isVector
                      ? t("vectorSymbologyTitle", "Vector Layer Style & Symbology")
                      : t("rasterSymbologyTitle", "Raster Symbology & Classification")}
                  </h2>
                  {isVector && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase">
                      {layer?.geom_type || layer?.data_type || "Vector"}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {isWorkspaceMode ? (
                    <>
                      Workspace: <span className="font-semibold text-slate-700">{workspace?.name}</span>
                    </>
                  ) : (
                    <>
                      Layer: <span className="font-semibold text-slate-700">{layer?.layer_name || layer?.display_name}</span>{" "}
                      ({layer?.workspace_name})
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 1: KONTROL STYLE VEKTOR                          */}
          {/* ======================================================== */}
          {isVector ? (
            <div className="mt-3.5 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" /> {t("quickColorPresets", "Preset Warna Cepat")}
                  </label>
                  <button
                    type="button"
                    onClick={handleResetVector}
                    className="text-[11px] text-slate-500 hover:text-teal-600 font-medium flex items-center gap-1 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> {t("resetDefault", "Reset Default")}
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {VECTOR_PRESET_PALETTES.map((preset) => {
                    const isSelected = fillColor.toLowerCase() === preset.fill.toLowerCase();
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setFillColor(preset.fill);
                          setStrokeColor(preset.stroke);
                        }}
                        className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-teal-500 bg-teal-50/80 ring-2 ring-teal-200 shadow-xs"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full border border-black/10 shadow-inner flex items-center justify-center"
                          style={{ backgroundColor: preset.fill }}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                        </div>
                        <span className="text-[9px] font-medium text-slate-600 truncate w-full text-center">
                          {preset.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Preview Card Vector */}
              <div className="p-3.5 bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-teal-600" /> {t("livePreview", "Live Preview")}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {layer?.geom_type || (isPoint ? "Point" : isLine ? "Line" : "Polygon")}
                  </span>
                </div>
                <div className="h-20 bg-white rounded-lg border border-slate-200 flex items-center justify-center px-4 relative overflow-hidden shadow-inner">
                  {isPolygon && (
                    <svg width="52" height="52" className="drop-shadow-xs shrink-0">
                      <polygon
                        points="26,4 48,18 40,48 12,48 4,18"
                        fill={fillColor}
                        fillOpacity={fillOpacity}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={strokeOpacity}
                        strokeDasharray={svgDashArray}
                      />
                    </svg>
                  )}
                  {isLine && (
                    <svg width="64" height="44" className="shrink-0">
                      <path
                        d="M 4,36 Q 32,4 60,36"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={strokeOpacity}
                        strokeLinecap="round"
                        strokeDasharray={svgDashArray}
                      />
                    </svg>
                  )}
                  {isPoint && (
                    <svg width="52" height="52" className="shrink-0">
                      {renderPointPreview()}
                    </svg>
                  )}
                </div>
              </div>

              {/* Point Marker Options */}
              {isPoint && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">
                      {t("pointMarkerShape", "Bentuk Marker Titik")}
                    </label>
                    <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          setMarkerType("shape");
                          if (pointSize > 24) setPointSize(8);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer ${
                          markerType === "shape" ? "bg-white text-teal-700 shadow-xs font-semibold" : "text-slate-500"
                        }`}
                      >
                        {t("geometricShape", "Bentuk Geometri")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMarkerType("icon");
                          if (pointSize < 16) setPointSize(24);
                        }}
                        className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1 ${
                          markerType === "icon" ? "bg-white text-teal-700 shadow-xs font-semibold" : "text-slate-500"
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5 text-teal-600" /> {t("svgIcon", "Icon SVG")}
                      </button>
                    </div>
                  </div>

                  {markerType === "shape" ? (
                    <div className="grid grid-cols-5 gap-1.5">
                      {MARK_OPTIONS.map((opt) => {
                        const IconComponent = opt.icon;
                        const isSelected = mark === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setMark(opt.id)}
                            className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg border text-xs font-medium transition cursor-pointer ${
                              isSelected
                                ? "border-teal-500 bg-teal-50 text-teal-800 font-semibold ring-1 ring-teal-200"
                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                            }`}
                          >
                            <IconComponent className={`w-3.5 h-3.5 ${isSelected ? "text-teal-600" : "text-slate-400"}`} />
                            <span className="text-[10px]">{t(opt.labelKey, opt.defaultLabel)}</span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <span className="text-[11px] font-medium text-slate-600">{t("selectSvgIcon", "Pilih Icon SVG:")}</span>
                      {loadingIcons ? (
                        <div className="py-4 text-center"><Spin size="small" /></div>
                      ) : (
                        <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                          {availableIcons.map((icon) => (
                            <button
                              key={icon.id}
                              type="button"
                              onClick={() => {
                                setSelectedIcon(icon.filename || icon.id);
                                if (pointSize < 16) setPointSize(24);
                              }}
                              className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition cursor-pointer ${
                                selectedIcon === (icon.filename || icon.id)
                                  ? "border-teal-500 bg-teal-50 ring-1 ring-teal-200"
                                  : "border-slate-200 bg-white hover:bg-slate-50"
                              }`}
                            >
                              <img
                                src={icon.url.startsWith("http") ? icon.url : `${GEOSERVER_BASE_URL}${icon.url}`}
                                alt={icon.name}
                                className="w-6 h-6 object-contain"
                              />
                              <span className="text-[9px] text-slate-600 truncate w-full">{icon.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* KONTROL UKURAN MARKER TITIK (Point Pixel Size Slider & Input) */}
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <Maximize2 className="w-3.5 h-3.5 text-teal-600" />
                        {t("markerSize", "Ukuran Marker (Pixel)")}
                      </label>
                      <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                        {pointSize} px
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Slider
                        min={4}
                        max={64}
                        value={pointSize}
                        onChange={(v) => setPointSize(v)}
                        className="flex-1 m-0"
                      />
                      <InputNumber
                        min={4}
                        max={64}
                        value={pointSize}
                        onChange={(v) => setPointSize(Number(v) || 8)}
                        size="small"
                        style={{ width: 62 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Stroke Dash Pattern */}
              {!isPoint && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">{t("linePattern", "Pola Garis")}</label>
                  <div className="grid grid-cols-3 gap-2">
                    {STROKE_DASH_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setStrokeDash(opt.id)}
                        className={`py-1.5 px-3 rounded-lg border text-xs font-medium text-center transition cursor-pointer ${
                          strokeDash === opt.id
                            ? "border-teal-500 bg-teal-50 text-teal-800 font-semibold ring-1 ring-teal-200"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {t(opt.labelKey, opt.defaultLabel)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ======================================================== */
            /* SECTION 2: KONTROL STYLE RASTER & KLASIFIKASI            */
            /* ======================================================== */
            <>
              {/* Loading Skeleton */}
              {loadingInfo ? (
                <div className="py-12 text-center bg-slate-50 rounded-xl border border-slate-200 mt-3">
                  <Spin description={t("loadingRasterStats", "Memuat statistik & simbologi raster...")} />
                </div>
              ) : (
                <>
                  {/* Statistics Banner */}
                  {stats ? (
                    <div className="mt-3 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50/70 to-teal-50/70 rounded-xl border border-blue-100 text-xs text-slate-700">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-blue-900 flex items-center gap-1">
                          <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                          {t("dataStatistics", "Statistik Data:")}
                        </span>
                        <span>Min: <strong className="font-mono text-blue-800">{formatBound(stats.min)}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Max: <strong className="font-mono text-blue-800">{formatBound(stats.max)}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Mean: <strong className="font-mono text-blue-800">{formatBound(stats.mean)}</strong></span>
                        <span className="text-slate-300">|</span>
                        <span>Std: <strong className="font-mono text-blue-800">{formatBound(stats.std)}</strong></span>
                      </div>
                      {categoricalHint && (
                        <Tag color="cyan" className="text-[10px] font-medium m-0">
                          {t("dataCategoricalDetected", "Data kategorikal terdeteksi")}
                        </Tag>
                      )}
                    </div>
                  ) : statsError ? (
                    <Alert
                      type="warning"
                      showIcon
                      message={t("distributionStatsUnavailable", "Statistik Distribusi Tidak Tersedia")}
                      description={statsError}
                      className="mt-3 text-xs"
                    />
                  ) : null}

                  {/* Preset Out of Range Warning */}
                  {presetWarning && (
                    <Alert
                      type="warning"
                      showIcon
                      message={presetWarning}
                      className="mt-2 text-xs"
                    />
                  )}

                  {/* Classification Controls Panel */}
                  <div className="mt-3.5 p-3.5 bg-slate-50/80 rounded-xl border border-slate-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Classification Method Dropdown */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-600">
                            {t("classificationMethod", "Metode Klasifikasi:")}
                          </label>
                          {cState.method === CLASSIFICATION_METHODS.MANUAL && (
                            <Tag color="orange" className="text-[9px] font-semibold m-0">
                              {t("manuallyEdited", "Diedit manual")}
                            </Tag>
                          )}
                          {cState.method === CLASSIFICATION_METHODS.PRESET && cState.presetId && (
                            <Tag color="blue" className="text-[9px] font-semibold m-0">
                              {t("presetBadge", "Preset: {name}", { name: PRESETS.find((p) => p.id === cState.presetId)?.name || cState.presetId })}
                            </Tag>
                          )}
                        </div>

                        <Select
                          value={cState.method}
                          onChange={handleMethodSelect}
                          className="w-full text-xs"
                          options={[
                            {
                              value: CLASSIFICATION_METHODS.NATURAL_BREAKS,
                              label: t("methodNaturalBreaks", "Natural Breaks (Jenks)"),
                              disabled: !hasStats,
                            },
                            {
                              value: CLASSIFICATION_METHODS.EQUAL_INTERVAL,
                              label: t("methodEqualInterval", "Equal Interval"),
                              disabled: !hasStats,
                            },
                            {
                              value: CLASSIFICATION_METHODS.QUANTILE,
                              label: t("methodQuantile", "Quantile"),
                              disabled: !hasStats,
                            },
                            {
                              value: CLASSIFICATION_METHODS.UNIQUE_VALUES,
                              label: t("methodUniqueValues", "Unique Values"),
                              disabled: !stats?.unique_values || stats.unique_values.length === 0,
                            },
                            {
                              value: CLASSIFICATION_METHODS.MANUAL,
                              label: t("methodManual", "Manual (Custom)"),
                            },
                            {
                              value: CLASSIFICATION_METHODS.PRESET,
                              label: t("methodPreset", "Preset Template"),
                            },
                          ]}
                        />

                        {/* Revert link when in manual mode */}
                        {cState.method === CLASSIFICATION_METHODS.MANUAL && cState.lastAutoMethod && (
                          <div className="mt-1 flex items-center justify-between">
                            <button
                              type="button"
                              onClick={handleRevertToAuto}
                              className="text-[10px] text-teal-600 hover:text-teal-700 hover:underline font-medium cursor-pointer"
                            >
                              {t("revertToMethod", "Kembalikan ke {method}", {
                                method: cState.lastAutoMethod === "natural_breaks" ? "Jenks" : cState.lastAutoMethod
                              })}
                            </button>
                            {cState._undo && (
                              <button
                                type="button"
                                onClick={() => cDispatch({ type: "UNDO" })}
                                className="text-[10px] text-slate-500 hover:text-slate-700 flex items-center gap-0.5 cursor-pointer"
                              >
                                <RotateCcw className="w-2.5 h-2.5" /> {t("undoBtn", "Undo")}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Number of Classes OR Preset Selector */}
                      {cState.method === CLASSIFICATION_METHODS.PRESET ? (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            {t("selectPresetTemplate", "Pilih Template Preset:")}
                          </label>
                          <Select
                            value={cState.presetId || PRESETS[0].id}
                            onChange={handlePresetSelect}
                            className="w-full text-xs"
                            options={PRESETS.map((p) => ({
                              value: p.id,
                              label: p.name,
                            }))}
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                            {t("numberOfClasses", "Jumlah Kelas:")}
                          </label>
                          <Select
                            value={cState.classCount}
                            onChange={handleClassCountChange}
                            disabled={cState.method === CLASSIFICATION_METHODS.UNIQUE_VALUES}
                            className="w-full text-xs"
                            options={[
                              { value: 3, label: t("classesCountOption", "{count} Classes", { count: 3 }) },
                              { value: 4, label: t("classesCountOption", "{count} Classes", { count: 4 }) },
                              { value: 5, label: t("classesCountOption", "{count} Classes", { count: 5 }) },
                              { value: 6, label: t("classesCountOption", "{count} Classes", { count: 6 }) },
                              { value: 7, label: t("classesCountOption", "{count} Classes", { count: 7 }) },
                              { value: 8, label: t("classesCountOption", "{count} Classes", { count: 8 }) },
                              { value: 9, label: t("classesCountOption", "{count} Classes", { count: 9 }) },
                              { value: 10, label: t("classesCountDefaultOption", "{count} Classes (Default)", { count: 10 }) },
                              { value: 12, label: t("classesCountOption", "{count} Classes", { count: 12 }) },
                              { value: 15, label: t("classesCountOption", "{count} Classes", { count: 15 }) },
                            ]}
                          />
                        </div>
                      )}

                      {/* Color Ramp Selector */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-slate-600">
                            {t("colorRampLabel", "Color Ramp:")}
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsSaveRampModalOpen(true)}
                            className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5 hover:underline cursor-pointer"
                          >
                            <BookmarkPlus className="w-3 h-3" /> {t("saveCustomRampBtn", "+ Simpan Custom")}
                          </button>
                        </div>
                        <Select
                          value={cState.rampId || "traffic_light"}
                          onChange={handleRampChange}
                          className="w-full text-xs"
                        >
                          {/* Qualitative group for unique values */}
                          {cState.method === CLASSIFICATION_METHODS.UNIQUE_VALUES && (
                            <Select.OptGroup label={t("qualitativePalettesGroup", "Qualitative (High Contrast Categories)")}>
                              {QUALITATIVE_PALETTES.map((ramp) => (
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
                          )}

                          <Select.OptGroup label={t("standardColorRampsGroup", "Standard Color Ramps")}>
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
                            <Select.OptGroup label={t("customColorRampsGroup", "Custom Color Ramps (Saved)")}>
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
                                      className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
                                      title={t("deleteCustomRampTitle", "Hapus color ramp ini")}
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

                    {/* Reclassify button bar */}
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-[11px] text-slate-500">
                        {t("sldModeLabel", "Mode SLD:")}{" "}
                        <strong>
                          {cState.method === CLASSIFICATION_METHODS.UNIQUE_VALUES
                            ? t("sldModeValues", "Values (Kategori Diskrit)")
                            : t("sldModeIntervals", "Intervals (Batas Atas ≤)")}
                        </strong>
                      </span>
                      <Tooltip title={t("reclassifyTooltip", "Hitung ulang titik batas klasifikasi otomatis")}>
                        <Button
                          size="small"
                          type="default"
                          icon={<Calculator className="w-3.5 h-3.5 text-teal-600" />}
                          onClick={handleReclassifyClick}
                          loading={calculating}
                          disabled={!hasStats}
                          className="text-xs flex items-center gap-1 font-medium"
                        >
                          {t("classifyBtn", "Classify...")}
                        </Button>
                      </Tooltip>
                    </div>
                  </div>

                  {/* Classes Table */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">
                        {t("classesTableTitle", "Daftar Kelas Klasifikasi ({count} kelas):", { count: derivedClasses.length })}
                      </span>
                      {cState.method !== CLASSIFICATION_METHODS.UNIQUE_VALUES && (
                        <Button
                          type="dashed"
                          size="small"
                          icon={<Plus className="w-3.5 h-3.5" />}
                          onClick={() => cDispatch({ type: "ADD_CLASS" })}
                          className="text-xs flex items-center"
                        >
                          {t("addClassBtn", "+ Tambah Kelas")}
                        </Button>
                      )}
                    </div>

                    {calculating ? (
                      <div className="py-10 text-center bg-slate-50 rounded-xl border border-slate-200">
                        <Spin description={t("calculatingClassificationBreaks", "Menghitung batas klasifikasi raster...")} />
                      </div>
                    ) : (
                      <div className="max-h-[260px] overflow-y-auto overflow-x-auto pr-1 border border-slate-200 rounded-xl bg-slate-50/50 p-1.5">
                        <div className="min-w-[620px] space-y-1.5">
                          {/* Table Header */}
                          <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-semibold text-slate-500 bg-slate-100 rounded-lg">
                            <div className="w-24">{t("colSymbol", "Simbol")}</div>
                            <div className="w-36">{t("colRange", "Rentang (Min - Max)")}</div>
                            <div className="flex-1">{t("colLabel", "Label")}</div>
                            <div className="w-24">{t("colUpperBound", "Batas Atas (≤)")}</div>
                            <div className="w-20">{t("colTransparency", "Transparansi")}</div>
                            <div className="w-12 text-center">{t("colAction", "Aksi")}</div>
                          </div>

                          {/* Pinned No Data Class jika ada */}
                          {cState.nodataClass && (
                            <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-lg border border-dashed border-slate-300 text-xs">
                              <div className="w-24 flex items-center gap-1.5">
                                <div className="w-7 h-7 rounded border border-slate-300 bg-transparent flex items-center justify-center text-[10px] text-slate-400">
                                  0%
                                </div>
                                <span className="text-[10px] font-mono text-slate-500">{t("transparentLabel", "Transparan")}</span>
                              </div>
                              <div className="w-36 font-mono text-slate-500 text-center">0 (Nodata)</div>
                              <div className="flex-1 font-semibold text-slate-600">No Data</div>
                              <div className="w-24 text-center font-mono text-slate-500">0</div>
                              <div className="w-20 text-center font-mono text-slate-400">0%</div>
                              <div className="w-12 text-center">
                                <Tag color="default" className="text-[9px] m-0">{t("lockedLabel", "Terkunci")}</Tag>
                              </div>
                            </div>
                          )}

                          {/* Regular Classes */}
                          {derivedClasses.map((cls, idx) => {
                            const rowError = validation.errors.find(
                              (e) => e.field === "breaks" && e.index === idx + 1
                            );
                            return (
                              <div key={idx} className="space-y-0.5">
                                <div className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 text-xs hover:border-slate-300 hover:shadow-xs transition">
                                  {/* Color Picker */}
                                  <div className="flex items-center gap-1.5 w-24 flex-shrink-0">
                                    <input
                                      type="color"
                                      value={cls.color}
                                      onChange={(e) => cDispatch({ type: "SET_COLOR", index: idx, color: e.target.value })}
                                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                                      title={t("pickSymbolColorTitle", "Pilih Warna Simbol")}
                                    />
                                    <input
                                      type="text"
                                      value={cls.color}
                                      onChange={(e) => cDispatch({ type: "SET_COLOR", index: idx, color: e.target.value })}
                                      className="w-14 px-1 py-0.5 text-[10px] font-mono border border-slate-200 rounded uppercase text-slate-700 text-center"
                                    />
                                  </div>

                                  {/* Range (Min - Max) */}
                                  <div className="w-36 flex items-center justify-center gap-1 flex-shrink-0 font-mono text-xs">
                                    <span className="w-16 px-1.5 py-1 text-center bg-slate-50 border border-slate-200 rounded text-slate-600 truncate">
                                      {formatBound(cls.min, stats?.min, stats?.max)}
                                    </span>
                                    <span className="text-slate-400 font-bold">-</span>
                                    <BoundInput
                                      value={cls.max}
                                      disabled={cState.method === CLASSIFICATION_METHODS.UNIQUE_VALUES}
                                      onCommit={(num) => cDispatch({ type: "SET_BREAK", index: idx + 1, value: num })}
                                      placeholder="Max"
                                      className="w-16 px-1.5 py-1 text-center border border-slate-200 rounded text-slate-800 font-medium"
                                    />
                                  </div>

                                  {/* Label Input */}
                                  <div className="flex-1 min-w-0">
                                    <input
                                      type="text"
                                      value={cls.label || ""}
                                      placeholder={t("customLabelPlaceholder", "Label Kustom...")}
                                      onChange={(e) => cDispatch({ type: "SET_LABEL", index: idx, label: e.target.value })}
                                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-700"
                                    />
                                  </div>

                                  {/* Upper Bound Value input */}
                                  <div className="w-24 flex-shrink-0">
                                    <BoundInput
                                      value={cls.quantity}
                                      disabled={cState.method === CLASSIFICATION_METHODS.UNIQUE_VALUES}
                                      onCommit={(num) => cDispatch({ type: "SET_BREAK", index: idx + 1, value: num })}
                                      className="w-full px-1.5 py-1 text-xs border border-slate-200 rounded text-slate-800 font-mono text-center"
                                    />
                                  </div>

                                  {/* Opacity slider */}
                                  <div className="w-20 flex items-center gap-1 flex-shrink-0">
                                    <input
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.05"
                                      value={cls.opacity ?? 1.0}
                                      onChange={(e) => cDispatch({ type: "SET_OPACITY", index: idx, opacity: parseFloat(e.target.value) })}
                                      className="w-12 accent-teal-600 cursor-pointer"
                                    />
                                    <span className="text-[10px] font-mono text-slate-500">
                                      {Math.round((cls.opacity ?? 1.0) * 100)}%
                                    </span>
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="w-12 flex items-center justify-center gap-1 flex-shrink-0">
                                    {cState.method === CLASSIFICATION_METHODS.UNIQUE_VALUES ? (
                                      <Tooltip title={t("mergeClassesTooltip", "Gabungkan dengan kelas berikutnya (Beralih ke manual)")}>
                                        <button
                                          type="button"
                                          disabled={idx >= derivedClasses.length - 1}
                                          onClick={() => {
                                            Modal.confirm({
                                              title: t("mergeClassesTitle", "Gabungkan Kelas"),
                                              content: t("mergeClassesConfirm", "Menggabungkan kelas akan beralih ke mode manual. Lanjutkan?"),
                                              okText: t("continueBtn", "Lanjutkan"),
                                              cancelText: t("cancel", "Batal"),
                                              onOk: () => cDispatch({ type: "MERGE_CLASSES", index1: idx, index2: idx + 1 }),
                                            });
                                          }}
                                          className="p-1 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded cursor-pointer disabled:opacity-30"
                                        >
                                          <Combine className="w-3.5 h-3.5" />
                                        </button>
                                      </Tooltip>
                                    ) : (
                                      <Tooltip title={t("deleteClassTooltip", "Hapus Kelas")}>
                                        <button
                                          type="button"
                                          onClick={() => cDispatch({ type: "REMOVE_CLASS", index: idx })}
                                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>

                                {/* Row Error Display */}
                                {rowError && (
                                  <div className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200 font-medium">
                                    {rowError.message}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Legend Preview (Selalu sinkron dengan state) */}
                  <div className="mt-3.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
                      {t("legendPreview", "Pratinjau Legenda:")}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {cState.nodataClass && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-2xs">
                          <span className="w-3 h-3 rounded-sm flex-shrink-0 border border-slate-300 bg-transparent" />
                          <span className="font-semibold text-slate-600">No Data</span>
                        </div>
                      )}
                      {derivedClasses.map((cls, idx) => (
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
                            {cls.label || `${formatBound(cls.min)} - ${formatBound(cls.max)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Footer Buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              {lastSavedTime && (
                <span>
                  {t("lastSaved", "Terakhir disimpan: {time}", { time: new Date(lastSavedTime).toLocaleString() })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onClose}
                disabled={isWorkspaceMode ? workspaceMutation.isPending : mutation.isPending}
              >
                {t("cancel", "Batal")}
              </Button>
              <Button
                type="primary"
                onClick={handleSubmit}
                loading={isWorkspaceMode ? workspaceMutation.isPending : mutation.isPending}
                disabled={calculating || (!isVector && !isWorkspaceMode && !validation.valid)}
                icon={<Check className="w-4 h-4" />}
                className="bg-teal-600 hover:bg-teal-500 flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isWorkspaceMode
                  ? t("applyAndSaveWorkspaceStyle", "Terapkan & Simpan Default Style Workspace")
                  : isVector
                  ? t("applyAndSaveVectorStyle", "Terapkan & Simpan Style Vektor")
                  : t("applyAndSaveClassification", "Apply & Save Classification")}
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
            {t("saveCustomRampTitle", "Simpan Color Ramp Custom")}
          </div>
        }
        open={isSaveRampModalOpen}
        onCancel={() => setIsSaveRampModalOpen(false)}
        onOk={handleSaveCurrentAsCustomRamp}
        okText={t("save", "Simpan")}
        cancelText={t("cancel", "Batal")}
        okButtonProps={{ className: "bg-teal-600 hover:bg-teal-500" }}
        centered
        width={420}
      >
        <div className="py-2 space-y-3">
          <p className="text-xs text-slate-500">
            {t("saveCustomRampDesc", "Warna-warna dari susunan kelas saat ini ({count} warna) akan disimpan ke daftar Color Ramp Anda:", { count: derivedClasses.length })}
          </p>

          <div className="flex h-3.5 w-full rounded-md overflow-hidden shadow-inner border border-slate-200">
            {derivedClasses.map((c, i) => (
              <div key={i} style={{ backgroundColor: c.color, flex: 1 }} />
            ))}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {t("customRampNameLabel", "Nama Color Ramp:")}
            </label>
            <Input
              placeholder={t("customRampNamePlaceholder", "Contoh: Gradasi Bahaya Banjir...")}
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
