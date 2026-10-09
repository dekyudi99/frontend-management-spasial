import { useState } from "react";
import {
  Layers,
  ChevronDown,
  ChevronUp,
  MapPin,
  Sparkles,
  Folder,
} from "lucide-react";
import { GEOSERVER_BASE_URL } from "../../api/microserviceConfig";
import { useLanguage } from "../../context/LanguageContext";

/**
 * Format nama icon dari file name (contoh: 'agriculture-wheat-svgrepo-com.svg' -> 'Agriculture Wheat')
 */
const formatIconName = (filename) => {
  if (!filename) return "Icon";
  const nameClean = filename.replace(/\.svg$/i, "");
  return (
    nameClean
      .split(/[-_]+/)
      .filter((w) => !["svgrepo", "com"].includes(w.toLowerCase()))
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") || nameClean
  );
};

/**
 * Render visual legend item untuk layer Vektor (Point, Line, Polygon, SVG Icon)
 */
const VectorLegendItem = ({ layer }) => {
  const { t } = useLanguage();
  const sym =
    layer.symbology?.symbol ||
    (typeof layer.symbology === "object" ? layer.symbology : null) ||
    {};
  const rawGeom = String(
    layer.geom_type || layer.geometry_type || sym.geometry_type || ""
  ).toLowerCase();
  const isPoint = rawGeom.includes("point");
  const isLine = rawGeom.includes("line") || rawGeom.includes("string");
  const isPolygon = !isPoint && !isLine;

  const fillColor = sym.fill_color || "#0d9488";
  const strokeColor = sym.stroke_color || "#0f766e";
  const strokeWidth = Number(sym.stroke_width || 1.5);
  const fillOpacity =
    sym.fill_opacity !== undefined ? Number(sym.fill_opacity) : 0.65;
  const strokeOpacity =
    sym.stroke_opacity !== undefined ? Number(sym.stroke_opacity) : 1.0;
  const mark = sym.mark || "circle";
  const strokeDash =
    sym.stroke_dasharray ||
    (sym.stroke_dash === "dashed"
      ? "6,4"
      : sym.stroke_dash === "dotted"
      ? "2,4"
      : undefined);

  const isIcon =
    sym.marker_type === "icon" ||
    Boolean(sym.icon_name) ||
    String(mark).startsWith("icon:");
  const iconName =
    sym.icon_name ||
    (String(mark).startsWith("icon:") ? String(mark).slice(5) : null);

  // 1. Point dengan Icon SVG
  if (isIcon && iconName) {
    const iconUrl = `${GEOSERVER_BASE_URL}/assets/${iconName}`;
    return (
      <div className="flex items-center gap-2 py-1 px-2 bg-slate-50/90 rounded-lg border border-slate-200/70">
        <div className="w-5 h-5 flex items-center justify-center shrink-0 p-0.5 bg-white rounded-md border border-slate-200 shadow-2xs">
          <img
            src={iconUrl}
            alt={iconName}
            className="w-full h-full object-contain pointer-events-none"
            loading="lazy"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[11px] font-medium text-slate-800 truncate">
            {formatIconName(iconName)}
          </span>
          <span className="text-[9px] text-teal-600 font-semibold">
            {t("svgIcon", "SVG Icon")} ({sym.point_size || 8}px)
          </span>
        </div>
      </div>
    );
  }

  // 2. Point dengan Geometri Mark (Circle, Square, Triangle, Star, Cross)
  if (isPoint) {
    const cx = 9;
    const cy = 9;

    const renderPointShape = () => {
      switch (mark) {
        case "square":
          return (
            <rect
              x="3"
              y="3"
              width="12"
              height="12"
              rx="1"
              fill={fillColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={Math.min(2, strokeWidth)}
              strokeOpacity={strokeOpacity}
            />
          );
        case "triangle":
          return (
            <polygon
              points="9,2 16,16 2,16"
              fill={fillColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={Math.min(2, strokeWidth)}
              strokeOpacity={strokeOpacity}
            />
          );
        case "star": {
          const points = [];
          for (let i = 0; i < 10; i++) {
            const angle = (i * Math.PI) / 5 - Math.PI / 2;
            const r = i % 2 === 0 ? 7 : 3.5;
            points.push(
              `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
            );
          }
          return (
            <polygon
              points={points.join(" ")}
              fill={fillColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={Math.min(2, strokeWidth)}
              strokeOpacity={strokeOpacity}
            />
          );
        }
        case "cross":
          return (
            <g
              stroke={strokeColor}
              strokeWidth={Math.min(2.5, strokeWidth)}
              strokeOpacity={strokeOpacity}
            >
              <line x1="3" y1="9" x2="15" y2="9" />
              <line x1="9" y1="3" x2="9" y2="15" />
            </g>
          );
        case "circle":
        default:
          return (
            <circle
              cx={cx}
              cy={cy}
              r="6"
              fill={fillColor}
              fillOpacity={fillOpacity}
              stroke={strokeColor}
              strokeWidth={Math.min(2, strokeWidth)}
              strokeOpacity={strokeOpacity}
            />
          );
      }
    };

    const getMarkLabel = (m) => {
      switch (m) {
        case "square":
          return t("pointSquare", "Kotak");
        case "triangle":
          return t("pointTriangle", "Segitiga");
        case "star":
          return t("pointStar", "Bintang");
        case "cross":
          return t("pointCross", "Silang");
        case "circle":
        default:
          return t("pointCircle", "Lingkaran");
      }
    };

    return (
      <div className="flex items-center gap-2 py-1 px-2 bg-slate-50/90 rounded-lg border border-slate-200/70">
        <svg width="18" height="18" className="shrink-0 drop-shadow-2xs">
          {renderPointShape()}
        </svg>
        <span className="text-[11px] font-medium text-slate-700 capitalize truncate">
          {getMarkLabel(mark)} ({sym.point_size || 8}px)
        </span>
      </div>
    );
  }

  // 3. Line
  if (isLine) {
    return (
      <div className="flex items-center gap-2 py-1 px-2 bg-slate-50/90 rounded-lg border border-slate-200/70">
        <svg width="24" height="14" className="shrink-0">
          <line
            x1="2"
            y1="7"
            x2="22"
            y2="7"
            stroke={strokeColor}
            strokeWidth={Math.max(2, Math.min(4, strokeWidth))}
            strokeOpacity={strokeOpacity}
            strokeDasharray={strokeDash}
            strokeLinecap="round"
          />
        </svg>
        <span className="text-[11px] font-medium text-slate-700 truncate">
          {strokeDash ? t("dashedLine", "Garis Putus-putus") : t("solidLine", "Garis Utuh")}
        </span>
      </div>
    );
  }

  // 4. Polygon
  return (
    <div className="flex items-center gap-2 py-1 px-2 bg-slate-50/90 rounded-lg border border-slate-200/70">
      <svg width="20" height="18" className="shrink-0 drop-shadow-2xs">
        <polygon
          points="10,2 18,7 15,16 5,16 2,7"
          fill={fillColor}
          fillOpacity={fillOpacity}
          stroke={strokeColor}
          strokeWidth={Math.min(2, strokeWidth)}
          strokeOpacity={strokeOpacity}
          strokeDasharray={strokeDash}
        />
      </svg>
      <span className="text-[11px] font-medium text-slate-700 truncate">
        {t("polygonArea", "Poligon Area")}
      </span>
    </div>
  );
};

/**
 * Render visual legend item untuk layer Raster (Klasifikasi kelas warna atau WMS GetLegendGraphic)
 */
const RasterLegendItem = ({ layer }) => {
  const { t } = useLanguage();
  const sym = layer.symbology || {};
  const classes = sym.classes || sym.colors || [];

  if (classes.length === 0) {
    // Fallback: Gunakan WMS GetLegendGraphic dari GeoServer
    const wmsUrl = layer.wms_url;
    const lyrName =
      layer.geoserver_name ||
      layer.table_name ||
      layer.store_name ||
      layer.layer_name;
    const styleParam = layer.style_name
      ? `&STYLE=${encodeURIComponent(layer.style_name)}`
      : "";
    const timeParam = layer.styleUpdatedAt ? `&_t=${layer.styleUpdatedAt}` : "";
    const legendUrl = wmsUrl
      ? `${wmsUrl}?REQUEST=GetLegendGraphic&VERSION=1.0.0&FORMAT=image/png&LAYER=${encodeURIComponent(
          `${layer.workspace_name}:${lyrName}`
        )}${styleParam}&LEGEND_OPTIONS=forceLabels:on;fontName:sans-serif;fontSize:10${timeParam}`
      : null;

    if (legendUrl) {
      return (
        <div className="py-1 px-1.5 bg-slate-50/90 rounded-lg border border-slate-200/70">
          <img
            src={legendUrl}
            alt={layer.display_name}
            className="max-h-28 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
        </div>
      );
    }

    return (
      <div className="text-[11px] text-slate-400 italic py-1 px-2">
        {t("defaultRasterColormap", "Palet Warna Raster Default")}
      </div>
    );
  }

  return (
    <div className="space-y-1 py-0.5">
      <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
        {classes.map((cls, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 text-[11px] text-slate-700"
          >
            <span
              className="w-3.5 h-3.5 rounded-xs shrink-0 border border-black/15 shadow-2xs"
              style={{
                backgroundColor:
                  cls.opacity === 0 ? "transparent" : cls.color,
                opacity: cls.opacity ?? 1,
              }}
            />
            <span
              className="truncate font-medium text-slate-700"
              title={cls.label}
            >
              {cls.label ||
                (cls.min !== undefined && cls.max !== undefined
                  ? `${cls.min} - ${cls.max}`
                  : `${t("legendClass", "Kelas")} ${idx + 1}`)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Komponen Floating Map Legend (Legenda Peta)
 * Menampilkan legenda interaktif untuk semua layer tunggal dan grup layer yang sedang aktif di peta.
 */
const MapLegend = ({ activeLayers = [], activeGroups = [] }) => {
  const { t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);

  const totalActive = activeLayers.length + activeGroups.length;

  if (totalActive === 0) return null;

  return (
    <div
      className="absolute bottom-5 right-4 z-[999] pointer-events-auto select-none transition-all duration-200"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onDoubleClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {collapsed ? (
        // Mode Terlipat (Compact Pill Button)
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex items-center gap-2 px-3 py-2 bg-white/95 hover:bg-white backdrop-blur-md border border-slate-200/90 shadow-lg rounded-full cursor-pointer transition-all hover:scale-102"
          title={t("showLegend", "Buka Legenda Peta")}
        >
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-700">
            {t("mapLegendShort", "Legenda")}
          </span>
          <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full">
            {totalActive}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
        </button>
      ) : (
        // Mode Terbuka (Full Legend Card)
        <div className="w-64 sm:w-72 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-xl overflow-hidden flex flex-col">
          {/* Header Card */}
          <div className="px-3 py-2 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-bold text-slate-800 tracking-tight">
                {t("mapLegend", "Legenda Peta")}
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full ml-1">
                {totalActive}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCollapsed(true)}
              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-md transition cursor-pointer"
              title={t("collapseLegend", "Ciutkan Legenda")}
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* Body Legend Items (Scrollable) */}
          <div className="p-2.5 space-y-3 max-h-[360px] overflow-y-auto custom-scrollbar">
            {/* 1. Single Layers Active */}
            {activeLayers.map((layer) => {
              const isRaster =
                layer.layer_type === "raster" ||
                layer.data_type === "TIF" ||
                Boolean(layer.store_name);

              return (
                <div
                  key={`legend-layer-${layer.id}`}
                  className="space-y-1.5 pb-2.5 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  {/* Layer Title Header */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className="text-xs font-semibold text-slate-800 truncate"
                      title={layer.display_name || layer.layer_name}
                    >
                      {layer.display_name || layer.layer_name}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm shrink-0 ${
                        isRaster
                          ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                          : "bg-teal-50 text-teal-700 border border-teal-200/60"
                      }`}
                    >
                      {isRaster ? t("raster", "Raster") : t("vector", "Vector")}
                    </span>
                  </div>

                  {/* Render Visual Swatch */}
                  {isRaster ? (
                    <RasterLegendItem layer={layer} />
                  ) : (
                    <VectorLegendItem layer={layer} />
                  )}
                </div>
              );
            })}

            {/* 2. Layer Groups Active */}
            {activeGroups.map((group) => {
              const allLayers = Array.isArray(group.layers) ? group.layers : [];

              return (
                <div
                  key={`legend-group-${group.id}`}
                  className="space-y-2 pb-2.5 border-b border-slate-100 last:border-b-0 last:pb-0"
                >
                  {/* Group Title Header */}
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <Folder className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span
                        className="text-xs font-semibold text-slate-800 truncate"
                        title={group.title || group.name}
                      >
                        {group.title || group.name}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-indigo-50 text-indigo-700 border border-indigo-200/60 shrink-0">
                      {t("group", "Group")} ({allLayers.length})
                    </span>
                  </div>

                  {/* Sublayers in Group */}
                  <div className="pl-2 space-y-2 border-l-2 border-indigo-100">
                    {allLayers.map((sublayer, sIdx) => {
                      const isSubRaster =
                        sublayer.layer_type === "raster" ||
                        sublayer.data_type === "TIF" ||
                        Boolean(sublayer.store_name);

                      return (
                        <div
                          key={`group-${group.id}-sub-${sublayer.id || sIdx}`}
                          className="space-y-1"
                        >
                          <span
                            className="text-[11px] font-medium text-slate-700 block truncate"
                            title={sublayer.display_name || sublayer.name}
                          >
                            {sublayer.display_name || sublayer.name}
                          </span>
                          {isSubRaster ? (
                            <RasterLegendItem layer={sublayer} />
                          ) : (
                            <VectorLegendItem layer={sublayer} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLegend;
