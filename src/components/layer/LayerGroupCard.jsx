import React, { useState } from "react";
import {
  Layers,
  Eye,
  EyeOff,
  Info,
  ChevronUp,
  Folder,
  Trash2,
  Copy,
  Check,
  Pencil,
  Navigation2,
} from "lucide-react";
import { Popconfirm, Tag, message } from "antd";
import { useLanguage } from "../../context/LanguageContext";

const LayerGroupCard = ({
  group,
  isSelected,
  isVisible,
  onSelect,
  onToggleVisibility,
  onEdit,
  onDelete,
}) => {
  const { t } = useLanguage();
  const [showDetail, setShowDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyWms = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${group.wms_url}?service=WMS&version=1.1.1&request=GetMap&layers=${group.wms_layers_param}`);
    setCopied(true);
    message.success(t('layerGroupWmsCopied', "Layer Group WMS URL copied!"));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onSelect(group.id)}
      className={`rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected
          ? "border-blue-500 shadow-md shadow-blue-100 ring-1 ring-blue-400/30 bg-white"
          : isVisible
          ? "border-indigo-300 bg-indigo-50/20 shadow-xs"
          : "border-slate-200 hover:border-slate-300 hover:shadow-xs bg-white"
      }`}
    >
      {/* Top accent bar */}
      <div className="h-1 w-full bg-indigo-500" />

      <div className="p-3.5 bg-white">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {/* Group Icon */}
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 flex-shrink-0">
              <Layers className="w-4 h-4" />
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm truncate max-w-[180px] sm:max-w-[240px]">
                {group.title}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {/* Badge Workspace */}
                <span
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 max-w-[120px] truncate"
                  title={t('workspaceParam', 'Workspace: {ws}', { ws: group.workspace_name })}
                >
                  <Folder className="w-3 h-3 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{group.workspace_name}</span>
                </span>

                <Tag color="purple" className="!text-[10px] !m-0 !rounded-full">
                  {t('layersCountBadge', '{count} Layers', { count: group.layer_count || 0 })}
                </Tag>

                <Tag color="cyan" className="!text-[10px] !m-0 !rounded-full font-mono">
                  {t('groupModeBadge', 'Mode: {mode}', { mode: group.mode || "single" })}
                </Tag>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Fly-to indicator when group is selected */}
            {isSelected && group.bbox && (
              <span title={t('mapFocusedGroup', 'Map focused on top layer of this group')} className="p-1.5 text-indigo-600">
                <Navigation2 className="w-3.5 h-3.5" />
              </span>
            )}

            {/* Copy WMS */}
            <button
              onClick={handleCopyWms}
              className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
              title={t('copyGroupWms', 'Copy Layer Group WMS parameters')}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>

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

            {/* Visibility toggle on map */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(group.id);
              }}
              className={`p-1.5 rounded-lg transition ${
                isVisible ? "text-indigo-600 hover:bg-indigo-50" : "text-slate-400 hover:bg-slate-100"
              }`}
              title={isVisible ? t('hideFromMap', 'Hide from Map') : t('viewOnMap', 'Show on Map')}
            >
              {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>

            {/* Edit button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(group.id);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
              title={t('editLayerGroupBtn', 'Edit Layer Group & Members')}
            >
              <Pencil className="w-4 h-4" />
            </button>

            {/* Delete button */}
            <Popconfirm
              title={t('deleteGroupConfirmTitle', 'Delete Layer Group?')}
              description={t('deleteGroupConfirmDesc', 'Are you sure you want to delete Layer Group "{title}"?', { title: group.title })}
              onConfirm={(e) => {
                e?.stopPropagation();
                onDelete?.(group.id);
              }}
              okText={t('delete', 'Delete')}
              cancelText={t('cancel', 'Cancel')}
              okButtonProps={{ danger: true }}
            >
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title={t('deleteGroupBtn', 'Delete Group')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </Popconfirm>
          </div>
        </div>

        {/* Panel Detail */}
        {showDetail && (
          <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-2">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                {t('technicalNameParam', 'Technical Name (WMS Layer Param)')}
              </span>
              <p className="font-mono text-slate-700 bg-slate-50 p-1 rounded mt-0.5 border border-slate-100 break-all">
                {group.wms_layers_param}
              </p>
            </div>
            {group.abstract_text && (
              <div>
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                  {t('descriptionLabel', 'Description')}
                </span>
                <p className="text-slate-600 mt-0.5">{group.abstract_text}</p>
              </div>
            )}
          </div>
        )}


      </div>
    </div>
  );
};

export default LayerGroupCard;
