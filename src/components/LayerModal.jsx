import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Upload, Select, message } from "antd";
import { InboxOutlined, FileImageOutlined } from "@ant-design/icons";
import layerApi from "../api/LayerApi";
import projectApi from "../api/ProjectApi";
import workspaceApi from "../api/WorkspaceApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const { Dragger } = Upload;

// Hanya GeoTIFF yang diterima
const ACCEPTED_EXTENSIONS = [".tif", ".tiff"];

const getFileExtension = (filename = "") =>
  filename.toLowerCase().slice(filename.lastIndexOf("."));

const FILE_TYPE_INFO = {
  ".tif":  { label: "GeoTIFF (Raster)", color: "#f59e0b", icon: <FileImageOutlined /> },
  ".tiff": { label: "GeoTIFF (Raster)", color: "#f59e0b", icon: <FileImageOutlined /> },
};

const LayerModal = ({
  open,
  onClose,
  page,
  pageSize,
  defaultProjectId,
  defaultWorkspaceId,
  lockWorkspace = false,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [fileList, setFileList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(defaultProjectId || null);
  const [selectedExt, setSelectedExt] = useState(null);

  useEffect(() => {
    if (open) {
      if (defaultProjectId) {
        setSelectedProjectId(defaultProjectId);
        form.setFieldValue("project_id", defaultProjectId);
      }
      if (defaultWorkspaceId) {
        form.setFieldValue("workspace_id", defaultWorkspaceId);
      }
    }
  }, [open, defaultProjectId, defaultWorkspaceId, form]);

  const { data: projectData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ["projects-select"],
    queryFn: () => projectApi.getall({ page: 1, size: 100 }),
    enabled: open,
  });

  const { data: workspaceData, isLoading: isLoadingWorkspaces } = useQuery({
    queryKey: ["workspaces-by-project", selectedProjectId],
    queryFn: () => workspaceApi.list(selectedProjectId),
    enabled: open && !!selectedProjectId,
  });

  const projects = projectData?.data?.data || [];
  const workspaces = workspaceData?.data?.data || [];

  const createLayer = useMutation({
    mutationFn: (formData) => layerApi.create(formData),
    onSuccess: (response) => {
      message.success(response?.data?.detail || "Layer berhasil dipublikasikan!");
      handleClose();
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-layers"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      const errDetail = error.response?.data?.detail;
      const errMsg = Array.isArray(errDetail)
        ? errDetail.map((e) => e.msg).join(", ")
        : errDetail || "Gagal membuat Layer!";
      message.error(errMsg);
    },
  });

  const handleClose = () => {
    form.resetFields();
    setFileList([]);
    if (!lockWorkspace) {
      setSelectedProjectId(null);
    }
    setSelectedExt(null);
    onClose();
  };

  const onFinish = (values) => {
    if (fileList.length === 0) {
      message.error("Silakan unggah file GeoTIFF (.tif / .tiff) terlebih dahulu!");
      return;
    }

    const fileToUpload = fileList[0]?.originFileObj || fileList[0];

    const formData = new FormData();
    formData.append("workspace_id", values.workspace_id);
    formData.append("layer_name", values.layer_name);
    formData.append("description", values.description || "");
    formData.append("file", fileToUpload);

    createLayer.mutate(formData);
  };

  const uploadProps = {
    onRemove: () => {
      setFileList([]);
      setSelectedExt(null);
    },
    beforeUpload: (file) => {
      const ext = getFileExtension(file.name);
      if (!ACCEPTED_EXTENSIONS.includes(ext)) {
        message.error(
          `Format tidak didukung: "${ext}". Hanya GeoTIFF (.tif / .tiff) yang diterima.`
        );
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      setSelectedExt(ext);
      return false;
    },
    fileList,
    maxCount: 1,
    accept: ".tif,.tiff",
  };

  const fileTypeInfo = selectedExt ? FILE_TYPE_INFO[selectedExt] : null;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title={<span className="text-base font-semibold">Tambah Layer Baru</span>}
      width={520}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={onFinish} className="pt-2">

        {/* Project */}
        <Form.Item
          label="Project"
          name="project_id"
          rules={[{ required: true, message: "Pilih project terlebih dahulu!" }]}
        >
          <Select
            showSearch
            disabled={lockWorkspace}
            placeholder="Cari & pilih project..."
            loading={isLoadingProjects}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={
              lockWorkspace && defaultProjectId && !projects.some((p) => p.id === defaultProjectId)
                ? [{ value: defaultProjectId, label: "Project Terpilih" }, ...projects.map((proj) => ({ value: proj.id, label: proj.project_name }))]
                : projects.map((proj) => ({ value: proj.id, label: proj.project_name }))
            }
            onChange={(val) => {
              setSelectedProjectId(val);
              form.setFieldValue("workspace_id", undefined);
            }}
          />
        </Form.Item>

        {/* Workspace */}
        <Form.Item
          label="Workspace"
          name="workspace_id"
          rules={[{ required: true, message: "Pilih workspace tujuan!" }]}
        >
          <Select
            showSearch
            disabled={lockWorkspace || !selectedProjectId}
            placeholder={
              !selectedProjectId
                ? "Pilih project terlebih dahulu..."
                : "Cari & pilih workspace..."
            }
            loading={isLoadingWorkspaces}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={
              lockWorkspace && defaultWorkspaceId && !workspaces.some((w) => w.id === defaultWorkspaceId)
                ? [{ value: defaultWorkspaceId, label: "Workspace Terpilih" }, ...workspaces.map((ws) => ({ value: ws.id, label: ws.name }))]
                : workspaces.map((ws) => ({ value: ws.id, label: ws.name }))
            }
          />
        </Form.Item>

        {/* Layer Name */}
        <Form.Item
          label="Nama Layer"
          name="layer_name"
          rules={[{ required: true, message: "Nama layer wajib diisi!" }]}
        >
          <Input placeholder="Contoh: Titik Rawan Banjir 2026" />
        </Form.Item>

        {/* Description */}
        <Form.Item label="Deskripsi" name="description">
          <Input.TextArea rows={2} placeholder="Deskripsi singkat layer (opsional)" />
        </Form.Item>

        {/* Upload */}
        <Form.Item label="Upload File GeoTIFF" required>
          {fileList.length === 0 ? (
            /* --- Belum ada file: tampilkan area drop --- */
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="text-amber-500 text-3xl" />
              </p>
              <p className="ant-upload-text text-sm font-medium">
                Klik atau seret file GeoTIFF ke area ini
              </p>
              <p className="ant-upload-hint text-xs text-slate-400">
                Hanya mendukung format <strong>.tif</strong> / <strong>.tiff</strong> (GeoTIFF Raster)
              </p>
            </Dragger>
          ) : (
            /* --- File sudah dipilih: tampilkan chip + tombol hapus --- */
            <div
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border"
              style={{
                backgroundColor: "#f59e0b12",
                borderColor: "#f59e0b55",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileImageOutlined style={{ color: "#f59e0b", fontSize: 18 }} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-amber-700 truncate">
                    {fileList[0]?.name}
                  </p>
                  <p className="text-xs text-amber-500">
                    GeoTIFF Raster &middot; {(fileList[0]?.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFileList([]);
                  setSelectedExt(null);
                }}
                className="flex-shrink-0 text-xs text-slate-400 hover:text-red-500 transition px-2 py-1 rounded hover:bg-red-50"
              >
                Hapus &times;
              </button>
            </div>
          )}
        </Form.Item>


        <Button
          htmlType="submit"
          type="primary"
          block
          loading={createLayer.isPending}
          className="mt-1"
        >
          Publikasikan Layer
        </Button>
      </Form>
    </Modal>
  );
};

export default LayerModal;
