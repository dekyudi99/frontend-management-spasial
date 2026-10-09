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
  Circle,
  Square,
  Triangle,
  Star,
  Sparkles,
  Sliders,
  RotateCcw,
  Image as ImageIcon,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import layerApi from "../api/LayerApi";
import workspaceApi from "../api/WorkspaceApi";
import { GEOSERVER_BASE_URL } from "../api/microserviceConfig";
import {
  COLOR_RAMP_PREVIEWS,
  PRESETS,
  loadSavedCustomRamps,
  saveCustomRampsToStorage,
  generateClassificationClasses,
  findMatchingColorRamp,
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
  { id: "circle", label: "Lingkaran", icon: Circle },
  { id: "square", label: "Persegi", icon: Square },
  { id: "triangle", label: "Segitiga", icon: Triangle },
  { id: "star", label: "Bintang", icon: Star },
  { id: "cross", label: "Salib (+)", icon: Plus },
];

const STROKE_DASH_OPTIONS = [
  { id: "solid", label: "Garis Utuh", value: null },
  { id: "dashed", label: "Putus-putus", value: "6,4" },
  { id: "dotted", label: "Titik-titik", value: "2,4" },
];

const LayerStyleModal = ({ open, onClose, layer, workspace, onStyleApplied }) => {
  const { t, translateApi } = useLanguage();
  const queryClient = useQueryClient();
  const isWorkspaceMode = Boolean(workspace);

  // Deteksi tipe data
  const isVector = !isWorkspaceMode && (
    layer?.layer_type === "vector" ||
    ["SHP", "GEOJSON", "KML", "KMZ"].includes(String(layer?.data_type || layer?.file_format || "").toUpperCase())
  );

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
  const [markerType, setMarkerType] = useState("shape"); // "shape" | "icon"
  const [selectedIcon, setSelectedIcon] = useState("agriculture-wheat-svgrepo-com.svg");
  const [availableIcons, setAvailableIcons] = useState([]);
  const [loadingIcons, setLoadingIcons] = useState(false);

  // ==================== STATE RASTER ====================
  const [method, setMethod] = useState("jenks"); // "jenks", "equal_interval", "quantile", "manual"
  const [nClasses, setNClasses] = useState(10); // default 10 kelas
  const [colorRamp, setColorRamp] = useState("cyan_blue_magenta");
  const [styleType, setStyleType] = useState("intervals");

  // Custom Color Ramps State
  const [customRamps, setCustomRamps] = useState(loadSavedCustomRamps);
  const [detectedLayerRamp, setDetectedLayerRamp] = useState(null);
  const [originalLayerClasses, setOriginalLayerClasses] = useState([]);
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

  // Inisialisasi data saat modal dibuka
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

    if (isVector) {
      // Inisialisasi Vector Style dari layer.symbology atau default
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
        if (iconName) {
          setSelectedIcon(iconName);
        }
      } else {
        setMarkerType("shape");
        setMark(rawMark);
      }

      loadVectorIcons(iconName);

      if (sym.stroke_dasharray === "2,4") {
        setStrokeDash("dotted");
      } else if (sym.stroke_dasharray) {
        setStrokeDash("dashed");
      } else {
        setStrokeDash("solid");
      }

      setHasSavedSymbology(Boolean(layer?.symbology));
      setLastSavedTime(layer?.symbology?.updated_at || null);
      return;
    }

    // Helper untuk mengaplikasikan symbology ke state secara konsisten
    const applySymbologyToState = (sym) => {
      const rawClasses = sym.classes || sym.colors || [];
      const formattedClasses = rawClasses.map((c, i) => ({
        min: c.min !== undefined ? c.min : (c.quantity !== undefined ? c.quantity : i),
        max: c.max !== undefined ? c.max : (c.quantity !== undefined ? c.quantity : i),
        quantity: c.quantity !== undefined ? c.quantity : (c.max !== undefined ? c.max : i),
        color: c.color || "#00e5ff",
        opacity: c.opacity ?? 1.0,
        label: c.label || (c.min !== undefined && c.max !== undefined ? `${c.min} - ${c.max}` : `Class ${i + 1}`),
      }));

      setStyleType(sym.style_type || "intervals");
      setMethod(sym.classification_method || "manual");
      setNClasses(sym.classes_count || formattedClasses.length);
      setClasses(formattedClasses);
      setOriginalLayerClasses(formattedClasses);
      setHasSavedSymbology(true);
      setLastSavedTime(sym.updated_at || null);

      // Sinkronkan Color Ramp dropdown dengan warna layer saat ini
      const classColors = formattedClasses.map((c) => c.color);
      const matched = findMatchingColorRamp(classColors, allRamps);

      if (sym.color_ramp && sym.color_ramp !== "custom" && allRamps.some((r) => r.id === sym.color_ramp)) {
        setColorRamp(sym.color_ramp);
        setDetectedLayerRamp(null);
      } else if (matched) {
        setColorRamp(matched.id);
        setDetectedLayerRamp(null);
      } else {
        const detected = {
          id: "layer_style",
          name: t("layerCurrentStyle", "Style Layer Saat Ini"),
          colors: classColors,
        };
        setDetectedLayerRamp(detected);
        setColorRamp("layer_style");
      }
    };

    // Jika layer prop sudah memiliki symbology dengan kelas tersimpan, inisialisasi langsung
    const initialSym = (layer?.symbology && (layer.symbology.classes?.length > 0 || layer.symbology.colors?.length > 0))
      ? layer.symbology
      : null;

    if (initialSym) {
      applySymbologyToState(initialSym);
    }

    // Raster layer: fetch info & stats
    setLoadingInfo(true);
    Promise.resolve(layerApi.getRasterInfo(layer.id))
      .then((res) => {
        const data = res?.data;
        if (data?.statistics) {
          setStats(data.statistics);
        }

        const sym = (data?.saved_symbology && (data.saved_symbology.classes?.length > 0 || data.saved_symbology.colors?.length > 0))
          ? data.saved_symbology
          : initialSym;

        if (sym && (sym.classes?.length > 0 || sym.colors?.length > 0)) {
          applySymbologyToState(sym);
        } else {
          // Jika layer tidak ada style, tampilkan color-ramp paling atas (default index 0)
          setHasSavedSymbology(false);
          setLastSavedTime(null);
          setDetectedLayerRamp(null);
          setOriginalLayerClasses([]);
          const topRamp = allRamps[0]?.id || COLOR_RAMP_PREVIEWS[0].id;
          setColorRamp(topRamp);
          handleRunClassification(10, "jenks", topRamp, data?.statistics);
        }
      })
      .catch((err) => {
        console.warn("Failed to load raster info, falling back:", err);
        if (!initialSym) {
          const topRamp = allRamps[0]?.id || COLOR_RAMP_PREVIEWS[0].id;
          setColorRamp(topRamp);
          handleRunClassification(10, "jenks", topRamp);
        }
      })
      .finally(() => {
        setLoadingInfo(false);
      });
  }, [open, layer, workspace, isVector, isWorkspaceMode]);

  // Fungsi memanggil API klasifikasi atau menghitung kelas secara DRY (Raster)
  const handleRunClassification = async (
    classesCount = nClasses,
    classMethod = method,
    rampId = colorRamp,
    incomingStats = null
  ) => {
    const activeRamps = detectedLayerRamp ? [detectedLayerRamp, ...allRamps] : allRamps;
    const selectedRamp = activeRamps.find((r) => r.id === rampId) || allRamps[0];
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

      // Jika user mengedit warna satuan, perbarui preview color ramp agar tetap sinkron
      if (field === "color") {
        const updatedColors = updated.map((c) => c.color);
        setDetectedLayerRamp({
          id: "layer_style",
          name: t("layerCurrentStyle", "Style Layer Saat Ini"),
          colors: updatedColors,
        });
        setColorRamp("layer_style");
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
      message.warning(t("minOneColorClass", "Minimal harus ada 1 kelas warna!"));
      return;
    }
    setClasses((prev) => prev.filter((_, i) => i !== index));
  };

  // Reset Style Vektor ke default
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

  // Render SVG Marker sesuai bentuk (mark) atau icon SVG
  const renderPointPreview = () => {
    const s = Math.min(26, Math.max(10, pointSize * 1.5));
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
            strokeWidth={Math.min(2.5, strokeWidth)}
            strokeOpacity={strokeOpacity}
          />
        );
      }
      case "cross": {
        const half = s / 2;
        return (
          <g>
            <line
              x1={cx - half}
              y1={cy}
              x2={cx + half}
              y2={cy}
              stroke={strokeColor}
              strokeWidth={Math.min(4, Math.max(2, strokeWidth))}
              strokeOpacity={strokeOpacity}
            />
            <line
              x1={cx}
              y1={cy - half}
              x2={cx}
              y2={cy + half}
              stroke={strokeColor}
              strokeWidth={Math.min(4, Math.max(2, strokeWidth))}
              strokeOpacity={strokeOpacity}
            />
          </g>
        );
      }
      case "circle":
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

  const svgDashArray = strokeDash === "dashed" ? "6,4" : strokeDash === "dotted" ? "2,4" : undefined;

  const mutation = useMutation({
    mutationFn: (data) => layerApi.updateStyle(data),
    onSuccess: (res) => {
      message.success(
        res?.data?.detail || t("styleSavedSuccess", "Klasifikasi & style layer berhasil disimpan!")
      );
      setHasSavedSymbology(true);
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      if (onStyleApplied && layer) {
        onStyleApplied(layer.id);
      }
      onClose();
    },
    onError: (err) => {
      message.error(translateApi(err, "styleApplyFailed"));
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

  const handleSubmit = () => {
    // Mode Workspace Template
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

    // Mode Vektor (Point, Line, Polygon)
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

    // Mode Raster
    mutation.mutate({
      layer_id: layer.id,
      workspace_name: layer.workspace_name,
      layer_name: layer.geoserver_name || layer.table_name || layer.store_name || layer.layer_name,
      layer_kind: "raster",
      style_type: styleType,
      classification_method: method,
      classes_count: classes.length,
      color_ramp: colorRamp === "layer_style" ? "custom" : colorRamp,
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
        width={isVector ? 620 : 780}
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
                      Workspace:{" "}
                      <span className="font-semibold text-slate-700">
                        {workspace?.name}
                      </span>{" "}
                      ({t("defaultTemplate", "Default Template")})
                    </>
                  ) : (
                    <>
                      Layer:{" "}
                      <span className="font-semibold text-slate-700">
                        {layer?.layer_name || layer?.display_name}
                      </span>{" "}
                      ({layer?.workspace_name})
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================== */}
          {/* SECTION 1: KONTROL STYLE VEKTOR (POINT, LINE, POLYGON)  */}
          {/* ======================================================== */}
          {isVector ? (
            <div className="mt-3.5 space-y-4">
              {/* Preset Palet Warna Cepat */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" /> Preset Warna Cepat
                  </label>
                  <button
                    type="button"
                    onClick={handleResetVector}
                    className="text-[11px] text-slate-500 hover:text-teal-600 font-medium flex items-center gap-1 transition cursor-pointer"
                    title="Reset ke warna default"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset Default
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
                        title={preset.name}
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

              {/* Live Preview Card */}
              <div className="p-3.5 bg-gradient-to-b from-slate-50 to-slate-100/70 border border-slate-200 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Sliders className="w-3 h-3 text-teal-600" /> Pratinjau Tampilan (Live Preview)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">SLD Vector Preview</span>
                </div>

                <div className="h-20 bg-white rounded-lg border border-slate-200 flex items-center justify-around px-4 relative overflow-hidden shadow-inner">
                  {/* Preview Polygon */}
                  <div className={`flex flex-col items-center gap-1 ${isPolygon ? "opacity-100 ring-1 ring-teal-400/40 p-1 rounded-md bg-teal-50/30" : "opacity-60"}`}>
                    <svg width="44" height="44" className="drop-shadow-xs">
                      <polygon
                        points="22,4 40,16 34,40 10,40 4,16"
                        fill={fillColor}
                        fillOpacity={fillOpacity}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={strokeOpacity}
                        strokeDasharray={svgDashArray}
                      />
                    </svg>
                    <span className={`text-[9px] font-medium ${isPolygon ? "text-teal-700 font-bold" : "text-slate-400"}`}>
                      Poligon {isPolygon && "•"}
                    </span>
                  </div>

                  {/* Preview Line */}
                  <div className={`flex flex-col items-center gap-1 ${isLine ? "opacity-100 ring-1 ring-teal-400/40 p-1 rounded-md bg-teal-50/30" : "opacity-60"}`}>
                    <svg width="44" height="44">
                      <path
                        d="M 4,36 Q 22,4 40,36"
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={strokeOpacity}
                        strokeLinecap="round"
                        strokeDasharray={svgDashArray}
                      />
                    </svg>
                    <span className={`text-[9px] font-medium ${isLine ? "text-teal-700 font-bold" : "text-slate-400"}`}>
                      Garis {isLine && "•"}
                    </span>
                  </div>

                  {/* Preview Point with Dynamic Marker Shape or SVG Icon */}
                  <div className={`flex flex-col items-center gap-1 ${isPoint ? "opacity-100 ring-1 ring-teal-400/40 p-1 rounded-md bg-teal-50/30" : "opacity-60"}`}>
                    <svg width="44" height="44">
                      {renderPointPreview()}
                    </svg>
                    <span className={`text-[9px] font-medium capitalize truncate max-w-[100px] text-center ${isPoint ? "text-teal-700 font-bold" : "text-slate-400"}`}>
                      {markerType === "icon" ? `${(selectedIcon || "").split(/[-_.]/)[0] || "Icon"}` : mark} ({pointSize}px) {isPoint && "•"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pilihan Bentuk Marker (Point Mark) atau Icon SVG */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-700">
                    Bentuk Marker Titik (Point Marker)
                  </label>
                  {/* Toggle Mode: Bentuk Standar vs Icon SVG */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setMarkerType("shape")}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer ${
                        markerType === "shape"
                          ? "bg-white text-teal-700 shadow-xs font-semibold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      Bentuk Geometri
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMarkerType("icon");
                        if (!selectedIcon && availableIcons.length > 0) {
                          setSelectedIcon(availableIcons[0].filename || availableIcons[0].id);
                        }
                      }}
                      className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition cursor-pointer flex items-center gap-1 ${
                        markerType === "icon"
                          ? "bg-white text-teal-700 shadow-xs font-semibold"
                          : "text-slate-500 hover:text-slate-800"
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5 text-teal-600" />
                      Icon SVG
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
                              ? "border-teal-500 bg-teal-50 text-teal-800 font-semibold shadow-xs ring-1 ring-teal-200"
                              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                          }`}
                        >
                          <IconComponent className={`w-3.5 h-3.5 ${isSelected ? "text-teal-600" : "text-slate-400"}`} />
                          <span className="text-[10px]">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-2.5 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-slate-600">
                        Pilih Icon SVG yang Tersedia ({availableIcons.length}):
                      </span>
                    </div>

                    {loadingIcons ? (
                      <div className="flex items-center justify-center py-4">
                        <Spin size="small" />
                        <span className="ml-2 text-xs text-slate-500">Memuat koleksi icon...</span>
                      </div>
                    ) : availableIcons.length === 0 ? (
                      <div className="text-center py-4 text-xs text-slate-400">
                        Belum ada icon SVG tersedia.
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-2 max-h-36 overflow-y-auto p-1 custom-scrollbar">
                        {availableIcons.map((ic) => {
                          const isSelected = selectedIcon === ic.filename || selectedIcon === ic.id;
                          const iconUrl = ic.url.startsWith("http")
                            ? ic.url
                            : `${GEOSERVER_BASE_URL}${ic.url.startsWith("/") ? "" : "/"}${ic.url}`;

                          return (
                            <button
                              key={ic.id}
                              type="button"
                              onClick={() => setSelectedIcon(ic.filename || ic.id)}
                              title={ic.name}
                              className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer bg-white ${
                                isSelected
                                  ? "border-teal-500 bg-teal-50/80 ring-2 ring-teal-300 shadow-xs"
                                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-100/60"
                              }`}
                            >
                              <div className="w-7 h-7 flex items-center justify-center p-0.5">
                                <img
                                  src={iconUrl}
                                  alt={ic.name}
                                  className="w-full h-full object-contain pointer-events-none"
                                  loading="lazy"
                                />
                              </div>
                              <span className="text-[9px] font-medium text-slate-600 truncate w-full text-center">
                                {ic.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Form Kontrol Warna */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Fill Color */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warna Isian (Fill Color)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={fillColor}
                      onChange={(e) => setFillColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={fillColor}
                      onChange={(e) => setFillColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>

                {/* Stroke Color */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Warna Garis Tepi (Stroke Color)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-8 h-8 rounded-lg border border-slate-300 p-0.5 cursor-pointer bg-white shrink-0"
                    />
                    <input
                      type="text"
                      value={strokeColor}
                      onChange={(e) => setStrokeColor(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs font-mono uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>

              {/* Tipe Garis Tepi (Stroke Style) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pola Garis Tepi (Stroke Style)
                </label>
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
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider Transparansi & Ukuran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Fill Opacity */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700">
                    <span>Transparansi Isian (Fill Opacity)</span>
                    <span className="font-mono text-teal-700 text-[10px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {Math.round(fillOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={fillOpacity}
                    onChange={(e) => setFillOpacity(parseFloat(e.target.value))}
                    className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Stroke Opacity */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700">
                    <span>Transparansi Garis (Stroke Opacity)</span>
                    <span className="font-mono text-teal-700 text-[10px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {Math.round(strokeOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={strokeOpacity}
                    onChange={(e) => setStrokeOpacity(parseFloat(e.target.value))}
                    className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Stroke Width */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700">
                    <span>Ketebalan Garis (Stroke Width)</span>
                    <span className="font-mono text-teal-700 text-[10px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {strokeWidth} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="8"
                    step="0.5"
                    value={strokeWidth}
                    onChange={(e) => setStrokeWidth(parseFloat(e.target.value))}
                    className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>

                {/* Point Size */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1 font-semibold text-slate-700">
                    <span>Ukuran Marker Titik (Point Size)</span>
                    <span className="font-mono text-teal-700 text-[10px] bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                      {pointSize} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="24"
                    step="1"
                    value={pointSize}
                    onChange={(e) => setPointSize(parseInt(e.target.value, 10))}
                    className="w-full accent-teal-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ======================================================== */
            /* SECTION 2: KONTROL STYLE RASTER & KLASIFIKASI            */
            /* ======================================================== */
            <>
              {/* Raster Statistics Banner */}
              {stats && (
                <div className="mt-3 flex items-center justify-between px-3 py-2 bg-gradient-to-r from-blue-50/70 to-teal-50/70 rounded-xl border border-blue-100 text-xs text-slate-700">
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-blue-900 flex items-center gap-1">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                      {t("dataStatistics", "Data Statistics:")}
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
                      {t("classificationMethod", "Classification Method:")}
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
                        className="text-[10px] text-teal-600 hover:text-teal-700 font-medium flex items-center gap-0.5 hover:underline cursor-pointer"
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
                        if (val === "layer_style") {
                          if (originalLayerClasses.length > 0) {
                            setClasses(originalLayerClasses);
                            setNClasses(originalLayerClasses.length);
                          }
                        } else {
                          handleRunClassification(nClasses, method, val);
                        }
                      }}
                      className="w-full text-xs"
                    >
                      {detectedLayerRamp && (
                        <Select.OptGroup label={t("detectedStyleGroup", "Style Layer Terdeteksi")}>
                          <Select.Option key={detectedLayerRamp.id} value={detectedLayerRamp.id}>
                            <div className="flex items-center gap-2">
                              <div className="flex h-2.5 w-14 rounded overflow-hidden shadow-inner flex-shrink-0">
                                {detectedLayerRamp.colors.map((c, i) => (
                                  <div key={i} style={{ backgroundColor: c, flex: 1 }} />
                                ))}
                              </div>
                              <span className="text-xs truncate font-medium text-teal-700">
                                {detectedLayerRamp.name} ({classes.length} {t("classesLabel", "Kelas")})
                              </span>
                            </div>
                          </Select.Option>
                        </Select.OptGroup>
                      )}

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
                                  className="text-slate-400 hover:text-red-500 p-0.5 cursor-pointer"
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
                            className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
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
            </>
          )}

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
                className="bg-teal-600 hover:bg-teal-500 flex items-center gap-1 cursor-pointer"
              >
                {isWorkspaceMode
                  ? "Terapkan & Simpan Default Style Workspace"
                  : isVector
                  ? "Terapkan & Simpan Style Vektor"
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
