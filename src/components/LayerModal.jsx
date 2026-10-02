import { useState, useEffect, useRef } from "react";
import { Modal, Form, Input, Button, Upload, Select, message, Progress, Alert } from "antd";
import {
  InboxOutlined,
  CloudUploadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  ClearOutlined,
} from "@ant-design/icons";
import workspaceApi from "../api/WorkspaceApi";
import ingestApi from "../api/IngestApi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../context/LanguageContext";
import keyApi from "../api/KeyApi";
import FileListItem from "./molecules/FileListItem";

const { Dragger } = Upload;

const MAX_FILES = 10;
const ACCEPTED_EXTENSIONS = [".tif", ".tiff", ".geojson", ".json", ".zip", ".kml", ".kmz", ".csv"];

const getFileExtension = (filename = "") => {
  const idx = filename.lastIndexOf(".");
  return idx !== -1 ? filename.toLowerCase().slice(idx) : "";
};

const deriveDisplayName = (filename = "") => {
  const stem = filename.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
  if (!stem) return "Layer";
  return stem.charAt(0).toUpperCase() + stem.slice(1);
};

const LayerModal = ({
  open,
  onClose,
  defaultWorkspaceId,
  lockWorkspace = false,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchFinished, setBatchFinished] = useState(false);
  const pollIntervalRef = useRef(null);


  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  const { data: keyData } = useQuery({
    queryKey: ["layer-modal-my-api-key"],
    queryFn: () => keyApi.getMyKey(),
    enabled: open,
    staleTime: 5000,
  });

  const isKeyActive = Boolean(keyData?.data?.is_active);

  const { data: workspaceData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ["workspaces-for-layer-modal", keyData?.data?.id, isKeyActive],
    queryFn: () => workspaceApi.list(),
    enabled: open && isKeyActive,
  });

  const workspaces = workspaceData?.data?.data || [];

  useEffect(() => {
    if (open) {
      if (defaultWorkspaceId) {
        form.setFieldValue("workspace_name", defaultWorkspaceId);
      } else if (workspaces.length === 1 && !form.getFieldValue("workspace_name")) {
        form.setFieldValue("workspace_name", workspaces[0].id || workspaces[0].ws_name);
      }
    } else {
      stopPolling();
    }
  }, [open, defaultWorkspaceId, workspaces, form]);

  const handleClose = () => {
    stopPolling();
    form.resetFields();
    setSelectedFiles([]);
    setIsSubmitting(false);
    setIsBatchRunning(false);
    setBatchFinished(false);
    queryClient.invalidateQueries({ queryKey: ["layers"] });
    queryClient.refetchQueries({ queryKey: ["layers"] });
    if (onSuccess) onSuccess();
    onClose();
  };

  const handleDisplayNameChange = (fileId, newName) => {
    setSelectedFiles((prev) =>
      prev.map((item) => (item.id === fileId ? { ...item, displayName: newName } : item))
    );
  };

  const handleRemoveFile = (fileId) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== fileId));
  };

  const handleClearAll = () => {
    setSelectedFiles([]);
  };

  // Kalkulasi total ukuran batch
  const totalSizeBytes = selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0);
  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(1);

  // Penanganan penambahan berkas dari Dragger / Upload
  const handleFilesAdded = (file, fileList) => {
    // Karena Ant Design memanggil beforeUpload untuk SETIAP file di dalam fileList,
    // kita hanya memproses batch satu kali pada file pertama (file === fileList[0]).
    if (fileList && fileList.length > 0 && file !== fileList[0]) {
      return false;
    }

    const rawFiles = Array.isArray(fileList) && fileList.length > 0 ? fileList : [file];

    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((item) => `${item.fileName}_${item.size}`));
      const newItems = [];
      let currentTotalBytes = prev.reduce((acc, f) => acc + (f.size || 0), 0);
      let exceededQuota = false;

      for (const f of rawFiles) {
        const fileObj = f.originFileObj || f;
        const ext = getFileExtension(fileObj.name);

        if (!ACCEPTED_EXTENSIONS.includes(ext)) {
          message.error(
            t(
              "unsupportedFormat",
              `Format "${fileObj.name}" tidak didukung. Gunakan GeoTIFF (.tif/.tiff), Shapefile (.zip), GeoJSON (.geojson/.json), KML (.kml), KMZ (.kmz), atau CSV (.csv).`
            )
          );
          continue;
        }

        // Hindari duplikasi jika file yang sama persis dipilih ulang
        const fileKey = `${fileObj.name}_${fileObj.size}`;
        if (existingKeys.has(fileKey)) {
          continue;
        }

        if (prev.length + newItems.length >= MAX_FILES) {
          exceededQuota = true;
          break;
        }

        existingKeys.add(fileKey);
        currentTotalBytes += fileObj.size;
        newItems.push({
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_${newItems.length}`,
          file: fileObj,
          fileName: fileObj.name,
          displayName: deriveDisplayName(fileObj.name),
          ext: ext,
          size: fileObj.size,
          status: null,
          progress: 0,
          errorMessage: null,
          geoserverName: null,
          jobId: null,
        });
      }

      if (exceededQuota) {
        message.warning(t("maxFilesExceeded", `Maksimum ${MAX_FILES} berkas per batch upload.`));
      }

      return [...prev, ...newItems];
    });

    return false; // Mencegah default upload bawaan AntD
  };


  // Memulai Polling Status Batch
  const startBatchPolling = (jobIds) => {
    stopPolling();
    setIsBatchRunning(true);
    setBatchFinished(false);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await ingestApi.getBatchStatus(jobIds);
        const jobs = res.jobs || [];

        // Update status masing-masing item di UI
        setSelectedFiles((prev) =>
          prev.map((item) => {
            if (!item.jobId) return item;
            const matchJob = jobs.find((j) => j.id === item.jobId);
            if (!matchJob) return item;

            const st = matchJob.status;
            return {
              ...item,
              status: st,
              progress: matchJob.progress || (st === "COMPLETED" ? 100 : st === "FAILED" ? 0 : 45),
              errorMessage: matchJob.error_message,
              geoserverName: matchJob.geoserver_name || matchJob.result_layer_name,
            };
          })
        );

        // Evaluasi penyelesaian: Selesai jika tidak ada lagi job yang berstatus QUEUED atau RUNNING
        const completedJobs = jobs.filter((j) => j.status === "COMPLETED");
        const failedJobs = jobs.filter((j) => j.status === "FAILED");
        const hasPending = jobs.some((j) => j.status === "QUEUED" || j.status === "RUNNING");
        const allJobsFinished = jobs.length > 0 && !hasPending;

        if (allJobsFinished) {
          stopPolling();
          setIsBatchRunning(false);
          setBatchFinished(true);

          if (completedJobs.length > 0) {
            queryClient.invalidateQueries({ queryKey: ["layers"] });
            queryClient.refetchQueries({ queryKey: ["layers"] });
            queryClient.invalidateQueries({ queryKey: ["workspace-layers"] });
            queryClient.invalidateQueries({ queryKey: ["workspaces"] });
            queryClient.invalidateQueries({ queryKey: ["recentlyWorkspace"] });
            queryClient.invalidateQueries({ queryKey: ["my-api-key"] });
            if (onSuccess) onSuccess();
          }
        }
      } catch (err) {
        console.error("Gagal polling status batch:", err);
      }
    }, 1500);
  };

  const onFinish = async (values) => {
    try {
      if (selectedFiles.length === 0) {
        message.error(t("uploadFileRequired", "Silakan pilih berkas spasial terlebih dahulu!"));
        return;
      }

      setIsSubmitting(true);
      setIsBatchRunning(true);
      setBatchFinished(false);

      // Tandai semua item sebagai sedang diunggah
      setSelectedFiles((prev) =>
        prev.map((f) => ({
          ...f,
          status: "RUNNING",
          progress: 15,
          errorMessage: null,
        }))
      );

      const formData = new FormData();
      formData.append("workspace_name", values.workspace_name);
      if (values.description) {
        formData.append("description", values.description);
      }

      const displayNames = [];
      selectedFiles.forEach((item) => {
        formData.append("files", item.file);
        displayNames.push(item.displayName.trim() || item.fileName);
      });
      formData.append("display_names", JSON.stringify(displayNames));

      const res = await ingestApi.batchUpload(formData);
      const jobs = res.jobs || [];

      // Ekstrak unique jobId murni dari backend response tanpa side effect di state setter
      const uniqueJobIds = Array.from(
        new Set(jobs.map((j) => j.id).filter(Boolean))
      );

      setSelectedFiles((prev) =>
        prev.map((item, idx) => {
          const matchJob = jobs[idx] || jobs.find((j) => j.filename === item.fileName);
          if (matchJob) {
            return {
              ...item,
              jobId: matchJob.id,
              status: matchJob.status || "QUEUED",
              progress: matchJob.status === "FAILED" ? 0 : 25,
              errorMessage: matchJob.error_message || null,
              geoserverName: matchJob.geoserver_name,
            };
          }
          return item;
        })
      );

      setIsSubmitting(false);

      if (uniqueJobIds.length > 0) {
        startBatchPolling(uniqueJobIds);
      } else {
        setIsBatchRunning(false);
        setBatchFinished(true);
      }
    } catch (err) {
      setIsSubmitting(false);
      setIsBatchRunning(false);
      setBatchFinished(true);
      const errMsg =
        err?.response?.data?.detail ||
        err?.message ||
        t("ingestFailedTitle", "Gagal Memproses Data Spasial");
      message.error(errMsg);
    }
  };


  const hasVectorFile = selectedFiles.some((f) =>
    [".geojson", ".json", ".zip"].includes(f.ext?.toLowerCase())
  );

  const completedCount = selectedFiles.filter((f) => f.status === "COMPLETED").length;
  const failedCount = selectedFiles.filter((f) => f.status === "FAILED").length;
  const totalCount = selectedFiles.length;
  const isDone = batchFinished || (totalCount > 0 && (completedCount + failedCount) >= totalCount);

  // Safety guard: Jika semua berkas di UI sudah COMPLETED atau FAILED, otomatis selesaikan batch
  useEffect(() => {
    if (isBatchRunning && totalCount > 0 && (completedCount + failedCount) >= totalCount) {
      stopPolling();
      setIsBatchRunning(false);
      setBatchFinished(true);
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      queryClient.refetchQueries({ queryKey: ["layers"] });
      if (onSuccess) onSuccess();
    }
  }, [completedCount, failedCount, totalCount, isBatchRunning]);

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title={
        <div className="flex items-center gap-2">
          <CloudUploadOutlined className="text-blue-600 text-lg" />
          <span className="text-base font-semibold">
            {t("ingestModalTitle", "Ingest & Publikasi Data Spasial")}
          </span>
        </div>
      }
      width={620}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={onFinish} className="pt-2">
        {/* Workspace Selection */}
        <Form.Item
          label={t("targetWorkspaceLabel", "Target Workspace")}
          name="workspace_name"
          rules={[{ required: true, message: t("selectWorkspaceRequired", "Pilih workspace target!") }]}
        >
          <Select
            showSearch
            disabled={lockWorkspace || isSubmitting || isBatchRunning || batchFinished}
            placeholder={t("selectWorkspacePlaceholder", "Cari & pilih workspace...")}
            loading={isLoadingWorkspaces}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={
              lockWorkspace && defaultWorkspaceId && !workspaces.some((w) => (w.id || w.ws_name) === defaultWorkspaceId)
                ? [{ value: defaultWorkspaceId, label: `Workspace (${defaultWorkspaceId})` }, ...workspaces.map((ws) => ({
                    value: ws.id || ws.ws_name,
                    label: ws.display_name && ws.display_name !== ws.id
                      ? `${ws.display_name} (${ws.id || ws.ws_name})`
                      : (ws.display_name || ws.name || ws.id || ws.ws_name)
                  }))]
                : workspaces.map((ws) => ({
                    value: ws.id || ws.ws_name,
                    label: ws.display_name && ws.display_name !== ws.id
                      ? `${ws.display_name} (${ws.id || ws.ws_name})`
                      : (ws.display_name || ws.name || ws.id || ws.ws_name)
                  }))
            }
          />
        </Form.Item>

        {!isLoadingWorkspaces && workspaces.length === 0 && !lockWorkspace && (
          <Alert
            type="warning"
            showIcon
            className="mb-4"
            message={t("noWorkspaceWarningTitle", "Belum Ada Workspace")}
            description={t("noWorkspaceWarningDesc", "Tidak ada workspace yang terhubung dengan API Key Anda. Silakan buat workspace terlebih dahulu sebelum mengunggah layer.")}
          />
        )}

        {/* Description (Optional) */}
        {!isBatchRunning && !batchFinished && (
          <Form.Item label={t("descriptionLabel", "Deskripsi (Opsional)")} name="description">
            <Input.TextArea
              rows={2}
              placeholder={t("descriptionPlaceholder", "Keterangan singkat mengenai layer...")}
              disabled={isSubmitting}
            />
          </Form.Item>
        )}

        {/* Area Unggah Berkas Perangkat (Multi-File Dropzone) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              {t("dragDropTitle", "Unggah Berkas Geospasial:")}
            </span>
            {selectedFiles.length > 0 && !isBatchRunning && !batchFinished && (
              <Button
                type="link"
                size="small"
                danger
                icon={<ClearOutlined />}
                onClick={handleClearAll}
                className="text-xs p-0 h-auto"
              >
                {t("clearAll", "Hapus Semua")}
              </Button>
            )}
          </div>

          {/* Initial Full Dragger Area jika belum ada file */}
          {selectedFiles.length === 0 && (
            <Dragger
              multiple={true}
              beforeUpload={(file, fileList) => handleFilesAdded(file, fileList)}
              showUploadList={false}
              accept=".tif,.tiff,.geojson,.json,.zip,.kml,.kmz,.csv"
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="text-blue-600 text-3xl" />
              </p>
              <p className="ant-upload-text text-sm font-medium">
                {t("dragDropTitle", "Klik atau tarik berkas spasial atau folder ke area ini")}
              </p>
              <p className="ant-upload-hint text-xs text-slate-400">
                {t("dragDropHint", "GeoTIFF (.tif/.tiff), Shapefile (.zip), GeoJSON (.geojson/.json), KML/KMZ (.kml/.kmz), atau CSV (.csv)")}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                {t('uploadLimitHint', 'Maksimal {max} berkas · Ukuran tanpa batas (unlimited)', { max: MAX_FILES })}
              </p>
            </Dragger>
          )}

          {/* Daftar Berkas Terpilih (Molekul FileListItem) */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200">
                <span>
                  <strong>{selectedFiles.length}</strong> / {MAX_FILES} {t("selectedFilesCount", "Berkas Terpilih")}
                </span>
                <span>
                  {totalSizeMB} MB
                </span>
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {selectedFiles.map((item) => (
                  <FileListItem
                    key={item.id}
                    fileItem={item}
                    onDisplayNameChange={handleDisplayNameChange}
                    onRemove={handleRemoveFile}
                    disabled={isSubmitting || isBatchRunning || batchFinished}
                  />
                ))}
              </div>

              {/* Tombol Tambah Berkas Lain jika belum mencapai kuota */}
              {!isBatchRunning && !batchFinished && selectedFiles.length < MAX_FILES && (
                <Upload
                  multiple={true}
                  beforeUpload={(file, fileList) => handleFilesAdded(file, fileList)}
                  showUploadList={false}
                  accept=".tif,.tiff,.geojson,.json,.zip,.kml,.kmz,.csv"
                >
                  <Button type="dashed" block icon={<PlusOutlined />} size="small" className="text-xs">
                    {t("addMoreFiles", "Tambah Berkas Lain")}
                  </Button>
                </Upload>
              )}
            </div>
          )}
        </div>

        {/* Info PostGIS Staging untuk Vektor */}
        {hasVectorFile && !isBatchRunning && !batchFinished && (
          <div className="p-3 mb-4 rounded-lg bg-teal-50 border border-teal-200/80 flex items-start gap-2.5">
            <ThunderboltOutlined className="text-teal-600 text-sm mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-teal-800 leading-snug">
              <span className="font-semibold block text-teal-900 mb-0.5">
                {t("postgisPipelineActive", "Pipeline Staging PostGIS Aktif")}
              </span>
              {t(
                "postgisPipelineDesc",
                "Sistem memvalidasi geometri via shapely make_valid, menulis ke tabel staging PostGIS, dan mempublikasikan FeatureType GeoServer secara otomatis."
              )}
            </div>
          </div>
        )}

        {/* Ringkasan Progres Live Saat Berjalan / Selesai */}
        {(isBatchRunning || isDone) && (
          <div className="mb-4">
            <Alert
              type={isDone ? (failedCount === 0 ? "success" : "warning") : "info"}
              showIcon
              icon={
                isDone ? (
                  failedCount === 0 ? (
                    <CheckCircleOutlined />
                  ) : (
                    <CloseCircleOutlined />
                  )
                ) : (
                  <SyncOutlined spin />
                )
              }
              message={
                isDone
                  ? failedCount === 0
                    ? t("allCompleted", "Semua layer berhasil diproses!")
                    : t("partialFailure", "Beberapa layer gagal diproses.")
                  : t("ingestProcessingTitle", "Sedang Memproses Data Spasial...")
              }
              description={
                <div className="mt-1 space-y-1">
                  <div className="text-xs">
                    {t('batchPublishStatus', { completed: completedCount, total: totalCount }, '{completed} of {total} published successfully')}
                    {failedCount > 0 && ` (${t('batchFailedCount', { failed: failedCount }, '{failed} failed')})`}
                  </div>
                  <Progress
                    percent={Math.round((completedCount / totalCount) * 100)}
                    size="small"
                    status={isDone && failedCount > 0 ? "normal" : isDone ? "success" : "active"}
                    strokeColor={{ from: "#3b82f6", to: "#10b981" }}
                  />
                </div>
              }
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2">
          {!isBatchRunning && !isDone ? (
            <Button
              htmlType="submit"
              type="primary"
              block
              loading={isSubmitting}
              disabled={selectedFiles.length === 0 || (!lockWorkspace && workspaces.length === 0)}
            >
              {t("startIngestBtn", "Mulai Ingest & Publikasikan")}
            </Button>
          ) : (
            <div className="flex gap-2">
              {isDone && failedCount > 0 && (
                <Button
                  block
                  onClick={() => {
                    setBatchFinished(false);
                    setIsBatchRunning(false);
                  }}
                >
                  {t("retryBtn", "Coba Lagi")}
                </Button>
              )}
              <Button
                type="primary"
                block
                onClick={handleClose}
                disabled={isBatchRunning && !isDone}
              >
                {isDone
                  ? t("closeAndViewLayer", "Tutup & Lihat Layer")
                  : t("closeBtn", "Tutup")}
              </Button>
            </div>
          )}
        </div>
      </Form>
    </Modal>
  );
};

export default LayerModal;
