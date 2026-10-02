import React from "react";
import { Input, Tag, Progress, Tooltip, Button } from "antd";
import {
  FileImageOutlined,
  FileTextOutlined,
  FileZipOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useLanguage } from "../../context/LanguageContext";

const FILE_TYPE_CONFIG = {
  ".tif":     { label: "TIF",     color: "#f59e0b", icon: <FileImageOutlined /> },
  ".tiff":    { label: "TIF",     color: "#f59e0b", icon: <FileImageOutlined /> },
  ".geojson": { label: "GEOJSON", color: "#10b981", icon: <FileTextOutlined /> },
  ".json":    { label: "GEOJSON", color: "#10b981", icon: <FileTextOutlined /> },
  ".zip":     { label: "SHP",     color: "#06b6d4", icon: <FileZipOutlined /> },
  ".kml":     { label: "KML",     color: "#8b5cf6", icon: <FileTextOutlined /> },
  ".kmz":     { label: "KMZ",     color: "#8b5cf6", icon: <FileZipOutlined /> },
  ".csv":     { label: "CSV",     color: "#3b82f6", icon: <FileTextOutlined /> },
};

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return "0 KB";
  const k = 1024;
  if (bytes < k * 1024) {
    return `${(bytes / k).toFixed(1)} KB`;
  }
  return `${(bytes / (k * 1024)).toFixed(2)} MB`;
};

/**
 * FileListItem (Molecule)
 * Menampilkan berkas terpilih dalam batch upload dengan opsi pengeditan display_name,
 * info ukuran, status proses, progres bar, dan tombol hapus.
 */
const FileListItem = ({
  fileItem,
  onDisplayNameChange,
  onRemove,
  disabled = false,
}) => {
  const { t } = useLanguage();
  const {
    id,
    fileName,
    displayName,
    ext,
    size,
    status, // null | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED'
    progress = 0,
    errorMessage,
    geoserverName,
  } = fileItem;

  const typeConfig = FILE_TYPE_CONFIG[ext?.toLowerCase()] || {
    label: ext?.toUpperCase() || "File",
    color: "#64748b",
    icon: <FileTextOutlined />,
  };

  const isCompleted = status === "COMPLETED";
  const isFailed = status === "FAILED";
  const isRunning = status === "RUNNING";
  const isQueued = status === "QUEUED";
  const isProcessing = isRunning || isQueued;

  return (
    <div
      className={`p-3 rounded-lg border transition-all ${
        isCompleted
          ? "bg-emerald-50/50 border-emerald-200"
          : isFailed
          ? "bg-red-50/50 border-red-200"
          : isProcessing
          ? "bg-blue-50/40 border-blue-200"
          : "bg-white border-slate-200 hover:border-slate-300 shadow-xs"
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Format Icon with colored badge */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 text-lg shadow-xs"
          style={{
            backgroundColor: `${typeConfig.color}18`,
            color: typeConfig.color,
          }}
        >
          {typeConfig.icon}
        </div>

        {/* File Name & Editable Display Name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-slate-500 font-mono truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
            <span className="text-[11px] text-slate-400">&bull; {formatFileSize(size)}</span>

            {/* Status Tag */}
            {status && (
              <span className="ml-auto">
                {isCompleted && (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    {t("jobCompleted", "Selesai")}
                  </Tag>
                )}
                {isFailed && (
                  <Tag color="error" icon={<CloseCircleOutlined />}>
                    {t("jobFailed", "Gagal")}
                  </Tag>
                )}
                {isRunning && (
                  <Tag color="processing" icon={<SyncOutlined spin />}>
                    {t("jobValidating", "Memproses")}
                  </Tag>
                )}
                {isQueued && (
                  <Tag color="default" icon={<ClockCircleOutlined />}>
                    {t("jobQueued", "Antrean")}
                  </Tag>
                )}
              </span>
            )}
          </div>

          {/* Editable Display Name Input */}
          <div className="flex items-center gap-2">
            <Input
              size="small"
              disabled={disabled || isProcessing || isCompleted}
              value={displayName}
              onChange={(e) => onDisplayNameChange && onDisplayNameChange(id, e.target.value)}
              placeholder={t("displayNamePlaceholder", "Nama tampilan layer ini")}
              className="text-xs font-medium rounded-md"
            />
          </div>
        </div>

        {/* Remove Button (Hanya jika belum selesai atau sedang berjalan) */}
        {!disabled && !isProcessing && (
          <Tooltip title={t("removeFile", "Hapus")}>
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onRemove && onRemove(id)}
              className="flex-shrink-0"
            />
          </Tooltip>
        )}
      </div>

      {/* Progress Bar saat memproses */}
      {isProcessing && (
        <div className="mt-2 pl-13">
          <Progress
            percent={progress || (isQueued ? 5 : 45)}
            size="small"
            status={isRunning ? "active" : "normal"}
            strokeColor={{ from: "#3b82f6", to: "#6366f1" }}
          />
        </div>
      )}

      {/* Tampilan Layer ID yang Dihasilkan */}
      {isCompleted && geoserverName && (
        <div className="mt-2 text-[11px] text-emerald-800 flex items-center gap-1.5 pl-13 font-mono">
          <span className="text-slate-400">Layer ID:</span>
          <span className="font-semibold">{geoserverName}</span>
        </div>
      )}

      {/* Error Message jika Gagal */}
      {isFailed && errorMessage && (
        <div className="mt-2 text-xs text-red-600 bg-red-100/70 p-2 rounded flex items-start gap-1.5">
          <ExclamationCircleOutlined className="mt-0.5 flex-shrink-0 text-red-500" />
          <span className="break-all">{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

export default FileListItem;
