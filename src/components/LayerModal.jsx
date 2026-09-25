import { useState, useEffect } from "react";
import { Modal, Form, Input, Button, Upload, Select, message } from "antd";
import { 
  InboxOutlined, 
  FileImageOutlined, 
  FileTextOutlined, 
  FileZipOutlined, 
  ThunderboltOutlined 
} from "@ant-design/icons";
import layerApi from "../api/LayerApi";
import projectApi from "../api/ProjectApi";
import workspaceApi from "../api/WorkspaceApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const { Dragger } = Upload;

// Format yang diterima: Raster GeoTIFF dan Vektor (Shapefile zip, GeoJSON, GeoPackage, CSV, KML, KMZ)
const ACCEPTED_EXTENSIONS = [".tif", ".tiff", ".geojson", ".json", ".zip", ".shp", ".gpkg", ".csv", ".kml", ".kmz"];

const getFileExtension = (filename = "") =>
  filename.toLowerCase().slice(filename.lastIndexOf("."));

const FILE_TYPE_INFO = {
  ".tif":     { label: "GeoTIFF (Raster)", color: "#f59e0b", icon: <FileImageOutlined /> },
  ".tiff":    { label: "GeoTIFF (Raster)", color: "#f59e0b", icon: <FileImageOutlined /> },
  ".geojson": { label: "GeoJSON (Vektor)", color: "#10b981", icon: <FileTextOutlined /> },
  ".json":    { label: "GeoJSON (Vektor)", color: "#10b981", icon: <FileTextOutlined /> },
  ".zip":     { label: "Shapefile Archive (.zip)", color: "#06b6d4", icon: <FileZipOutlined /> },
  ".shp":     { label: "ESRI Shapefile (.shp)", color: "#06b6d4", icon: <FileZipOutlined /> },
  ".gpkg":    { label: "GeoPackage (.gpkg)", color: "#8b5cf6", icon: <FileTextOutlined /> },
  ".csv":     { label: "CSV Koordinat (Vektor)", color: "#ec4899", icon: <FileTextOutlined /> },
  ".kml":     { label: "Keyhole Markup Language (.kml)", color: "#0284c7", icon: <FileTextOutlined /> },
  ".kmz":     { label: "Compressed KML (.kmz)", color: "#0284c7", icon: <FileZipOutlined /> },
};

const isVectorExtension = (ext) =>
  [".geojson", ".json", ".zip", ".shp", ".gpkg", ".csv", ".kml", ".kmz"].includes(ext);

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
      message.success(response?.data?.detail || "Layer published successfully!");
      handleClose();
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-layers"] });
      queryClient.invalidateQueries({ queryKey: ["project"] });
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      queryClient.invalidateQueries({ queryKey: ["recentlyWorkspace"] });
      queryClient.invalidateQueries({ queryKey: ["projectLogs"] });
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      const errDetail = error.response?.data?.detail;
      const errMsg = Array.isArray(errDetail)
        ? errDetail.map((e) => e.msg).join(", ")
        : errDetail || "Failed to create Layer!";
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
      message.error("Please upload a spatial file (.tif, .geojson, .zip, .shp, .gpkg, .csv, .kml, .kmz) first!");
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
          `Unsupported format: "${ext}". Please upload GeoTIFF (.tif/.tiff) or Vector (.geojson, .zip, .shp, .gpkg, .csv, .kml, .kmz).`
        );
        return Upload.LIST_IGNORE;
      }
      setFileList([file]);
      setSelectedExt(ext);

      // Auto-suggest layer name if empty
      const currentName = form.getFieldValue("layer_name");
      if (!currentName) {
        const cleanName = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
        form.setFieldValue("layer_name", cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
      return false;
    },
    fileList,
    maxCount: 1,
    accept: ".tif,.tiff,.geojson,.json,.zip,.shp,.gpkg,.csv,.kml,.kmz",
  };

  const fileTypeInfo = selectedExt ? FILE_TYPE_INFO[selectedExt] : null;

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      title={<span className="text-base font-semibold">Add New Spatial Layer</span>}
      width={540}
      destroyOnClose
    >
      <Form layout="vertical" form={form} onFinish={onFinish} className="pt-2">

        {/* Project */}
        <Form.Item
          label="Project"
          name="project_id"
          rules={[{ required: true, message: "Please select a project first!" }]}
        >
          <Select
            showSearch
            disabled={lockWorkspace}
            placeholder="Search & select project..."
            loading={isLoadingProjects}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={
              lockWorkspace && defaultProjectId && !projects.some((p) => p.id === defaultProjectId)
                ? [{ value: defaultProjectId, label: "Selected Project" }, ...projects.map((proj) => ({ value: proj.id, label: proj.project_name }))]
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
          rules={[{ required: true, message: "Please select target workspace!" }]}
        >
          <Select
            showSearch
            disabled={lockWorkspace || !selectedProjectId}
            placeholder={
              !selectedProjectId
                ? "Select a project first..."
                : "Search & select workspace..."
            }
            loading={isLoadingWorkspaces}
            optionFilterProp="label"
            filterOption={(input, option) =>
              (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
            }
            options={
              lockWorkspace && defaultWorkspaceId && !workspaces.some((w) => w.id === defaultWorkspaceId)
                ? [{ value: defaultWorkspaceId, label: "Selected Workspace" }, ...workspaces.map((ws) => ({ value: ws.id, label: ws.name }))]
                : workspaces.map((ws) => ({ value: ws.id, label: ws.name }))
            }
          />
        </Form.Item>

        {/* Layer Name */}
        <Form.Item
          label="Layer Name"
          name="layer_name"
          rules={[{ required: true, message: "Layer name is required!" }]}
        >
          <Input placeholder="e.g.: Flood Risk Points 2026" />
        </Form.Item>

        {/* Description */}
        <Form.Item label="Description" name="description">
          <Input.TextArea rows={2} placeholder="Short layer description (optional)" />
        </Form.Item>

        {/* Upload */}
        <Form.Item label="Upload Spatial File (Raster / Vektor)" required>
          {fileList.length === 0 ? (
            /* --- No file yet: show drop area --- */
            <Dragger {...uploadProps}>
              <p className="ant-upload-drag-icon">
                <InboxOutlined className="text-teal-600 text-3xl" />
              </p>
              <p className="ant-upload-text text-sm font-medium">
                Click or drag spatial file to this area
              </p>
              <p className="ant-upload-hint text-xs text-slate-400">
                Supports GeoTIFF (<strong>.tif</strong>), Shapefile (<strong>.zip</strong> / <strong>.shp</strong>), <strong>.geojson</strong>, <strong>.gpkg</strong>, <strong>.csv</strong>, KML (<strong>.kml</strong>), KMZ (<strong>.kmz</strong>)
              </p>
            </Dragger>
          ) : (
            /* --- File selected: show chip + remove button --- */
            <div
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border"
              style={{
                backgroundColor: `${fileTypeInfo?.color || "#10b981"}12`,
                borderColor: `${fileTypeInfo?.color || "#10b981"}55`,
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span style={{ color: fileTypeInfo?.color || "#10b981", fontSize: 20 }}>
                  {fileTypeInfo?.icon || <FileTextOutlined />}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {fileList[0]?.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    {fileTypeInfo?.label || "Spatial Layer"} &middot; {(fileList[0]?.size / 1024 / 1024).toFixed(2)} MB
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
                Remove &times;
              </button>
            </div>
          )}
        </Form.Item>

        {/* Informative notice for vector optimization (default & automated, no user input) */}
        {selectedExt && isVectorExtension(selectedExt) && (
          <div className="p-3 mb-4 rounded-lg bg-teal-50 border border-teal-200/80 flex items-start gap-2.5">
            <ThunderboltOutlined className="text-teal-600 text-sm mt-0.5 flex-shrink-0" />
            <div className="text-[11px] text-teal-800 leading-snug">
              <span className="font-semibold block text-teal-900 mb-0.5">Optimasi Geometri Otomatis Aktif</span>
              Sistem secara otomatis menerapkan simplifikasi topologi vektor bawaan untuk mempercepat rendering peta tanpa merusak batas spasial.
            </div>
          </div>
        )}


        <Button
          htmlType="submit"
          type="primary"
          block
          loading={createLayer.isPending}
          className="mt-1"
        >
          Publish Layer
        </Button>
      </Form>
    </Modal>
  );
};

export default LayerModal;
