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
} from "lucide-react";
import { Popconfirm, Checkbox } from "antd";
import { getTypeConfig } from "../../utils/geoUtils";

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
  onDelete,
  // Drag & drop handlers
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}) => {
  const [showDetail, setShowDetail] = useState(false);
  const cfg = getTypeConfig(layer.data_type);

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
            {/* Grip Handle untuk Drag & Drop */}
            <div
              className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 p-0.5 rounded transition"
              title="Tahan dan geser untuk ubah urutan layer (stacking order)"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical className="w-4 h-4" />
            </div>

            {/* Checkbox Checklist untuk Layer Group */}
            <div onClick={(e) => e.stopPropagation()} className="flex items-center">
              <Checkbox
                checked={isChecked}
                onChange={() => onToggleCheck(layer.id)}
                className="cursor-pointer"
              />
            </div>

            {/* Ikon Tipe File */}
            <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.bgColor} ${cfg.textColor}`}>
              <ImageIcon className="w-4 h-4" />
            </div>

            {/* Judul dan Tag */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-slate-800 text-sm truncate max-w-[170px] sm:max-w-[220px]">
                  {layer.layer_name}
                </h3>
                {index !== undefined && (
                  <span className="text-[10px] text-slate-400 font-mono" title="Urutan rendering">
                    #{index + 1}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {/* Badge Workspace */}
                {(layer.workspace_display_name || layer.workspace_name) && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 max-w-[120px] truncate"
                    title={`Workspace: ${layer.workspace_display_name || layer.workspace_name}`}
                  >
                    <Folder className="w-3 h-3 text-blue-500 flex-shrink-0" />
                    <span className="truncate">{layer.workspace_display_name || layer.workspace_name}</span>
                  </span>
                )}
                <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor}`} />
                  {cfg.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                  EPSG:{layer.epsg}
                </span>
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
            {/* Fly-to indicator saat dipilih */}
            {isSelected && layer.bbox && (
              <span title="Peta aktif pada layer ini" className="p-1.5 text-blue-500">
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
              title="Atur Warna & SLD Style Layer"
            >
              <Palette className="w-4 h-4" />
            </button>
            {/* Detail toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDetail((p) => !p);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Detail Metadata"
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
              title={layer.visible ? "Sembunyikan dari Peta" : "Tampilkan di Peta"}
            >
              {layer.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            {/* Delete button */}
            <Popconfirm
              title="Hapus Layer?"
              description={`Yakin ingin menghapus layer "${layer.layer_name}"?`}
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete?.(layer.id);
              }}
              okText="Hapus"
              cancelText="Batal"
              okButtonProps={{ danger: true }}
            >
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Hapus Layer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Popconfirm>
          </div>
        </div>

        {/* Panel Detail (Collapsible) */}
        {showDetail && (
          <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-x-4 gap-y-1.5">
            <InfoRow
              label="Workspace"
              value={
                layer.workspace_display_name && layer.workspace_display_name !== layer.workspace_name
                  ? `${layer.workspace_display_name} (${layer.workspace_name})`
                  : layer.workspace_name
              }
            />
            <InfoRow label="Format" value={layer.data_type} />
            {layer.layer_type === "raster" && layer.width && (
              <InfoRow label="Dimensi" value={`${layer.width} × ${layer.height} px`} />
            )}
            {layer.bbox && (
              <div className="col-span-2">
                <InfoRow
                  label="Bounding Box"
                  value={layer.bbox.map((v) => v?.toFixed(4)).join(", ")}
                />
              </div>
            )}
            {layer.description && (
              <div className="col-span-2">
                <InfoRow label="Deskripsi" value={layer.description} />
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
};

export default LayerCard;
