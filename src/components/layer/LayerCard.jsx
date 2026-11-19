import React, { useState } from "react";
import {
  Eye,
  EyeOff,
  Image as ImageIcon,
  Info,
  ChevronUp,
  CheckCircle2,
  Navigation2,
  Palette,
  Folder,
  Trash2,
  GripVertical,
  Shapes,
  Table as TableIcon,
} from "lucide-react";
import { Popconfirm, Checkbox, Segmented, Spin } from "antd";
import { getTypeConfig } from "../../utils/geoUtils";
import { useLanguage } from "../../context/LanguageContext";

const InfoRow = ({ label, value }) => (
  <div>
    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
    <p className="text-xs text-slate-700 mt-0.5 truncate">{value ?? "-"}</p>
  </div>
);

const LayerCard = ({
  layer,
  index,
  isSelected,
  isChecked,
  onSelect,
  onToggleCheck,
  onToggleVisibility,
  onOpenStyle,
  onOpenAttributeTable,
  onDelete,
  isDeleting = false,
  onToggleServiceMode,
  hasTileError = false,
  // Drag & drop handlers
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}) => {
  const { t } = useLanguage();
  const [showDetail, setShowDetail] = useState(false);
  const [isUpdatingMode, setIsUpdatingMode] = useState(false);
  const [modeError, setModeError] = useState(null);
  const cfg = getTypeConfig(layer.data_type, layer.layer_type, layer);

  const handleModeChange = async (newMode) => {
    const currentMode = (layer.service_mode === "wmts" && layer.gwc_ready) ? "wmts" : "wms";
    if (newMode === currentMode || isUpdatingMode) return;
    setIsUpdatingMode(true);
    setModeError(null);
    try {
      await onToggleServiceMode?.(layer.id, newMode);
    } catch (err) {
      setModeError(err.message || t('switchModeFailed', 'Gagal mengubah mode layer.'));
    } finally {
      setIsUpdatingMode(false);
    }
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      onClick={() => onSelect(layer.id)}
      className={`rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isDragging
          ? "opacity-40 border-dashed border-blue-400 scale-[0.98]"
          : isSelected
          ? "border-blue-500 shadow-md shadow-blue-100 ring-1 ring-blue-400/30 bg-white"
          : isChecked
          ? "border-indigo-300 bg-indigo-50/20 shadow-xs"
          : "border-slate-200 hover:border-slate-300 hover:shadow-xs bg-white"
      }`}
    >
      {/* Garis warna status di atas kartu */}
      <div className={`h-1 w-full ${cfg.dotColor}`} />

      <div className="p-3.5 bg-white">
        {/* Header Bar: Drag Handle + Checkbox + Info + Controls */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Grip Handle for Drag & Drop */}
            <div
              className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-0.5 rounded transition"
              title={t('dragHandleHint', 'Drag to change layer rendering order')}
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Checkbox Checklist for Layer Group */}
            <div onClick={(e) => e.stopPropagation()} className="flex items-center">
              <Checkbox
                checked={isChecked}
                onChange={() => onToggleCheck(layer.id)}
                className="cursor-pointer"
              />
            </div>

            {/* File Type Icon */}
            <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.bgColor} ${cfg.textColor}`}>
              {cfg.isVector ? <Shapes className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            </div>

            {/* Title and Tags */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-slate-800 text-sm truncate max-w-[170px] sm:max-w-[220px]" title={layer.display_name || layer.layer_name}>
                  {layer.display_name || layer.layer_name}
                </h3>
                {index !== undefined && (
                  <span className="text-[10px] text-slate-400 font-mono" title={t('renderingOrder', 'Rendering order')}>
                    #{index + 1}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {/* Badge Workspace */}
                {(layer.workspace_display_name || layer.workspace_name) && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 max-w-[120px] truncate"
                    title={t('workspaceParam', 'Workspace: {ws}', { ws: layer.workspace_display_name || layer.workspace_name })}
                  >
                    <Folder className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{layer.workspace_display_name || layer.workspace_name}</span>
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${cfg.badgeBg} ${cfg.badgeText}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                  {cfg.label}
                </span>
                {layer.layer_type === "raster" && (layer.is_rgb || (layer.bands && layer.bands > 1)) && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200"
                    title={t('rgbRasterBadgeTooltip', 'Multi-band RGB/RGBA raster using GeoServer built-in default style')}
                  >
                    {layer.bands === 4 ? "RGBA" : "RGB"}
                  </span>
                )}
                <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  EPSG:{layer.epsg}
                </span>
                {/* Badge Service Mode WMS / WMTS */}
                {layer.service_mode === "wmts" && layer.gwc_ready ? (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200"
                    title={t('wmtsBadgeTitle', 'WMTS: Cached by GeoWebCache')}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                    WMTS
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200"
                    title={t('wmsBadgeTitle', 'WMS: Dynamic direct render')}
                  >
                    WMS
                  </span>
                )}
                {layer.status === "PUBLISHED" && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Fly-to indicator when selected */}
            {isSelected && layer.bbox && (
              <span title={t('mapFocusedLayer', 'Map focused on this layer')} className="p-1.5 text-blue-500">
                <Navigation2 className="w-3.5 h-3.5" />
              </span>
            )}
            {/* Style palette toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenStyle?.(layer);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
              title={t('styleLayer', 'Configure Color & SLD Style')}
            >
              <Palette className="w-4 h-4" />
            </button>
            {/* Attribute Table toggle for vector layers */}
            {(cfg.isVector || Boolean(layer.geom_type)) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenAttributeTable?.(layer);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                title={t('attributeTable', 'Attribute Table')}
              >
                <TableIcon className="w-4 h-4" />
              </button>
            )}
            {/* Detail toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetail((p) => !p);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title={showDetail ? t('hideDetails', 'Hide details') : t('moreDetails', 'More details')}
            >
              {showDetail ? <ChevronUp className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            </button>
            {/* Visibility toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
              className={`p-1.5 rounded-lg transition ${
                layer.visible ? "text-blue-600 hover:bg-blue-50" : "text-slate-400 hover:bg-slate-100"
              }`}
              title={layer.visible ? t('hideFromMap', 'Hide from Map') : t('viewOnMap', 'Show on Map')}
            >
              {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            {/* Delete button */}
            <Popconfirm
              title={t('deleteLayerConfirmTitle', 'Delete Layer?')}
              description={t('deleteLayerConfirmDesc', `Are you sure you want to delete layer "${layer.display_name || layer.layer_name}"?`)}
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete?.(layer);
              }}
              okText={t('delete', 'Delete')}
              cancelText={t('cancel', 'Cancel')}
              okButtonProps={{ danger: true, loading: isDeleting }}
            >
              <button
                onClick={(e) => e.stopPropagation()}
                disabled={isDeleting}
                className={`p-1.5 rounded-lg transition ${
                  isDeleting
                    ? "text-red-400 bg-red-50/50 cursor-wait"
                    : "text-slate-400 hover:text-red-600 hover:bg-red-50"
                }`}
                title={isDeleting ? t('deleting', 'Deleting...') : t('delete', 'Delete Layer')}
              >
                {isDeleting ? (
                  <span className="w-4 h-4 flex items-center justify-center">
                    <svg className="animate-spin h-3.5 w-3.5 text-red-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  </span>
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </Popconfirm>
          </div>
        </div>

        {/* Panel Detail (Collapsible) */}
        {showDetail && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-1.5">
            <InfoRow
              label={t('columnWorkspace', 'Workspace')}
              value={
                layer.workspace_display_name && layer.workspace_display_name !== layer.workspace_name
                  ? `${layer.workspace_display_name} (${layer.workspace_name})`
                  : layer.workspace_name
              }
            />
            <InfoRow label={t('typeLabel', 'Format')} value={cfg.label} />
            <InfoRow label={t('geoServerName', 'GeoServer Name')} value={layer.geoserver_name || layer.store_name || layer.table_name} />
            {layer.layer_type === "raster" && layer.width && (
              <InfoRow label={t('dimensions', 'Dimensions')} value={`${layer.width} × ${layer.height} px`} />
            )}
            {layer.bbox && (
              <div className="col-span-2">
                <InfoRow
                  label="Bounding Box"
                  value={Array.isArray(layer.bbox) ? layer.bbox.map((v) => Number(v)?.toFixed(4)).join(", ") : JSON.stringify(layer.bbox)}
                />
              </div>
            )}
            {layer.description && (
              <div className="col-span-2">
                <InfoRow label={t('descriptionLabel', 'Description')} value={layer.description} />
              </div>
            )}

            {/* Mode Tampilan: WMS / WMTS */}
            <div className="col-span-2 pt-2 border-t border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                    {t('displayMode', 'Display Mode')}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    {layer.service_mode === "wmts" && layer.gwc_ready
                      ? t('wmtsActiveDesc', 'WMTS: Cached by GeoWebCache for high speed')
                      : t('wmsActiveDesc', 'WMS: Dynamic direct render')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {isUpdatingMode && <Spin size="small" />}
                  <Segmented
                    size="small"
                    disabled={isUpdatingMode}
                    value={layer.service_mode === "wmts" && layer.gwc_ready ? "wmts" : "wms"}
                    onChange={handleModeChange}
                    options={[
                      { label: "WMS", value: "wms" },
                      { label: "WMTS", value: "wmts" },
                    ]}
                  />
                </div>
              </div>

              {/* Pesan Error jika HTTP 502 atau GWC gagal */}
              {modeError && (
                <div className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                  {modeError}
                </div>
              )}

              {/* Peringatan Tile Error berulang */}
              {hasTileError && (
                <div className="text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center justify-between gap-2">
                  <span>{t('wmtsCacheUnavailable', 'Cache tile tidak tersedia, coba kembali ke mode WMS.')}</span>
                  <button
                    type="button"
                    onClick={() => handleModeChange("wms")}
                    className="text-[11px] px-2 py-0.5 font-medium bg-amber-200 text-amber-900 rounded hover:bg-amber-300 transition shrink-0 cursor-pointer"
                  >
                    WMS
                  </button>
                </div>
              )}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

export default LayerCard;
