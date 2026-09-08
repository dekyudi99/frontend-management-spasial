import { useState, useEffect } from "react";
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DatabaseOutlined,
  FolderOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  Button,
  Spin,
  Typography,
  Tabs,
  Select,
  Checkbox,
  Pagination,
  Tag,
  message,
  Popconfirm,
} from "antd";
import {
  Palette,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Check,
  ExternalLink,
  Sliders,
  Image as ImageIcon,
  Clock,
  Info,
} from "lucide-react";
import formatTanggal from "../utils/formatTanggal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import workspaceApi from "../api/WorkspaceApi";
import layerApi from "../api/LayerApi";
import { PRESETS } from "../components/LayerStyleModal";
import LayerStyleModal from "../components/LayerStyleModal";
import LayerModal from "../components/LayerModal";

const { Title, Text } = Typography;

const Workspace = () => {
  const navigate = useNavigate();
  const { id_workspace } = useParams();
  const queryClient = useQueryClient();

  // Tab State
  const [activeTab, setActiveTab] = useState("palette");

  // Palette State
  const [styleType, setStyleType] = useState("values");
  const [classes, setClasses] = useState(PRESETS[0].classes);
  const [applyToExisting, setApplyToExisting] = useState(true);

  // Layers in Workspace State
  const [layerPage, setLayerPage] = useState(1);
  const [layerPageSize, setLayerPageSize] = useState(6);
  const [searchLayer, setSearchLayer] = useState("");
  const [selectedLayerForStyle, setSelectedLayerForStyle] = useState(null);
  const [openUploadModal, setOpenUploadModal] = useState(false);

  // Mutation Hapus Layer
  const deleteLayerMutation = useMutation({
    mutationFn: (layerId) => layerApi.delete(layerId),
    onSuccess: (res) => {
      message.success(res?.data?.detail || "Layer berhasil dihapus!");
      refetchLayers();
      queryClient.invalidateQueries({ queryKey: ["layers"] });
    },
    onError: (err) => {
      message.error(err.response?.data?.detail || "Gagal menghapus layer");
    },
  });

  // 1. Fetch Workspace Detail
  const {
    data: workspaceRes,
    isLoading: isLoadingWorkspace,
    isError,
    error,
  } = useQuery({
    queryKey: ["workspace-detail", id_workspace],
    queryFn: () => workspaceApi.detail(id_workspace),
    enabled: !!id_workspace,
  });

  const workspace = workspaceRes?.data?.data;

  // 2. Fetch Layers in this Workspace
  const {
    data: layersRes,
    isLoading: isLoadingLayers,
    refetch: refetchLayers,
  } = useQuery({
    queryKey: ["workspace-layers", id_workspace, layerPage, layerPageSize, searchLayer],
    queryFn: () =>
      layerApi.list({
        workspace_id: id_workspace,
        page: layerPage,
        size: layerPageSize,
        search: searchLayer || undefined,
      }),
    enabled: !!id_workspace,
  });

  const layersList = layersRes?.data?.data || [];
  const layerPagination = layersRes?.data?.pagination;

  // Handler preset
  const handleApplyPreset = (preset) => {
    setStyleType(preset.styleType);
    setClasses(JSON.parse(JSON.stringify(preset.classes)));
    message.info(`Preset "${preset.name}" diterapkan ke editor`);
  };

  const updateClass = (index, field, value) => {
    setClasses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addClass = () => {
    const lastQty = classes.length > 0 ? classes[classes.length - 1].quantity : 0;
    setClasses((prev) => [
      ...prev,
      {
        quantity: lastQty + 1,
        color: "#3b82f6",
        opacity: 1.0,
        label: `Kelas ${lastQty + 1}`,
      },
    ]);
  };

  const removeClass = (index) => {
    if (classes.length <= 1) {
      message.warning("Minimal harus ada 1 kelas warna!");
      return;
    }
    setClasses((prev) => prev.filter((_, i) => i !== index));
  };

  // Mutation Save Default Style
  const saveStyleMutation = useMutation({
    mutationFn: (payload) => workspaceApi.saveDefaultStyle(id_workspace, payload),
    onSuccess: (res) => {
      message.success(
        res?.data?.detail || "Palet default workspace berhasil disimpan ke GeoServer!"
      );
      if (applyToExisting) {
        refetchLayers();
        queryClient.invalidateQueries({ queryKey: ["layers"] });
      }
    },
    onError: (err) => {
      message.error(
        err.response?.data?.detail || "Gagal menyimpan palet default workspace"
      );
    },
  });

  const handleSaveDefaultStyle = () => {
    if (!id_workspace) return;
    saveStyleMutation.mutate({
      style_type: styleType,
      colors: classes.map((c) => ({
        quantity: Number(c.quantity),
        color: c.color,
        opacity: Number(c.opacity),
        label: c.label || "",
      })),
      apply_to_existing: applyToExisting,
    });
  };

  if (isLoadingWorkspace) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <Spin size="large" tip="Memuat data workspace..." />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-red-500">
        <p className="font-semibold">Terjadi Kesalahan</p>
        <p className="text-sm">{error?.response?.data?.detail || "Workspace tidak ditemukan"}</p>
        <Button onClick={() => navigate(-1)} className="mt-4" icon={<ArrowLeftOutlined />}>
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-5 md:p-8 bg-slate-50 min-h-screen font-sans">
      {/* Tombol Kembali */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition mb-3 sm:mb-4 group"
      >
        <ArrowLeftOutlined className="group-hover:-translate-x-1 transition-transform" />
        <span>Kembali ke Daftar Workspace</span>
      </button>

      {/* Header Workspace */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-sm mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2.5 sm:p-3 bg-blue-50 text-blue-600 rounded-xl flex-shrink-0">
              <FolderOutlined className="text-xl sm:text-2xl" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl font-bold text-slate-800 m-0">
                  {workspace?.name}
                </h1>
                <Tag color="blue" className="font-mono text-xs px-2.5 py-0.5 rounded-full">
                  GeoServer: {workspace?.ws_name || "ws_default"}
                </Tag>
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Dibuat {formatTanggal(workspace?.created_at)}
                </span>
                <span className="flex items-center gap-1">
                  <DatabaseOutlined /> {layerPagination?.total ?? 0} Layer Tersedia
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpenUploadModal(true)}
              className="flex items-center gap-1.5"
            >
              Upload Layer Baru
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-5 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center gap-3 text-xs text-blue-800">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            Workspace ini terintegrasi langsung dengan GeoServer. Semua layer di bawah workspace ini dapat diatur palet warna defaultnya di sini.
          </span>
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          tabBarStyle={{ paddingLeft: "24px", paddingRight: "24px", marginBottom: 0 }}
          items={[
            {
              key: "palette",
              label: (
                <span className="flex items-center gap-2 py-1 font-semibold">
                  <Palette className="w-4 h-4 text-amber-500" />
                  Pengaturan Palet Default (Template Style)
                </span>
              ),
              children: (
                <div className="p-6">
                  {/* Penjelasan Palet Default */}
                  <div className="mb-6">
                    <h2 className="text-base font-bold text-slate-800">
                      Palet Warna Default untuk Raster Baru
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Setiap layer raster 1-band baru yang dipublikasikan ke workspace{" "}
                      <span className="font-semibold text-slate-700 font-mono">
                        {workspace?.ws_name}
                      </span>{" "}
                      akan otomatis menggunakan skema warna ini (tersimpan sebagai style{" "}
                      <code className="text-blue-600 bg-blue-50 px-1 py-0.5 rounded">
                        default_{workspace?.ws_name}
                      </code>{" "}
                      di GeoServer).
                    </p>
                  </div>

                  {/* Preset Populer */}
                  <div className="mb-6">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-3">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Pilih Cepat dari Preset Palet Populer:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {PRESETS.map((p) => (
                        <div
                          key={p.id}
                          onClick={() => handleApplyPreset(p)}
                          className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 cursor-pointer transition flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">
                                {p.name}
                              </span>
                              <Tag className="text-[10px] m-0">{p.styleType}</Tag>
                            </div>
                            {/* Bar warna preview */}
                            <div className="flex h-3 w-full rounded overflow-hidden shadow-inner my-2">
                              {p.classes.map((c, i) => (
                                <div
                                  key={i}
                                  style={{
                                    backgroundColor: c.opacity === 0 ? "transparent" : c.color,
                                    flex: 1,
                                  }}
                                  className={
                                    c.opacity === 0 ? "border border-dashed border-slate-300" : ""
                                  }
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-[10px] text-slate-400 truncate">
                            {p.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mode Pewarnaan SLD */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-semibold text-slate-800 block">
                        Metode Pewarnaan SLD GeoServer
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {styleType === "values" &&
                          "Nilai eksak diskrit (Sangat pas untuk data klasifikasi risiko kelas 1, 2, 3, 4, 5)"}
                        {styleType === "intervals" &&
                          "Rentang interval bertahap (Piksel diwarnai berdasarkan batas interval kuantitas)"}
                        {styleType === "ramp" &&
                          "Gradien interpolasi mulus berkelanjutan antar nilai piksel"}
                      </span>
                    </div>
                    <Select
                      value={styleType}
                      onChange={setStyleType}
                      className="w-44"
                      options={[
                        { value: "values", label: "Diskrit (Values)" },
                        { value: "intervals", label: "Interval (Rentang)" },
                        { value: "ramp", label: "Gradien (Ramp)" },
                      ]}
                    />
                  </div>

                  {/* Editor Kelas & Warna */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-slate-700">
                        Daftar Kelas &amp; Warna ({classes.length} kelas):
                      </span>
                      <Button
                        type="dashed"
                        size="small"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={addClass}
                        className="text-xs flex items-center"
                      >
                        Tambah Kelas
                      </Button>
                    </div>

                    <div className="space-y-2 max-h-[320px] overflow-y-auto overflow-x-auto pr-1">
                      <div className="min-w-[500px] space-y-2">
                        {classes.map((cls, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200 text-xs hover:border-slate-300 transition"
                          >
                            {/* Color Picker */}
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <input
                                type="color"
                                value={cls.color}
                                onChange={(e) => updateClass(idx, "color", e.target.value)}
                                className="w-8 h-8 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                                title="Pilih Warna"
                              />
                              <input
                                type="text"
                                value={cls.color}
                                onChange={(e) => updateClass(idx, "color", e.target.value)}
                                className="w-16 px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded uppercase text-slate-700"
                              />
                            </div>

                            {/* Nilai Piksel */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-[10px] text-slate-400 font-medium">Nilai:</span>
                              <input
                                type="number"
                                value={cls.quantity}
                                onChange={(e) => updateClass(idx, "quantity", e.target.value)}
                                className="w-16 px-1.5 py-1 text-xs border border-slate-200 rounded text-slate-800 font-medium text-center"
                              />
                            </div>

                            {/* Label Keterangan */}
                            <div className="flex-1 min-w-0">
                              <input
                                type="text"
                                value={cls.label}
                                placeholder="Label keterangan (misal: Sangat Tinggi)..."
                                onChange={(e) => updateClass(idx, "label", e.target.value)}
                                className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded text-slate-700"
                              />
                            </div>

                            {/* Opacity Slider */}
                            <div className="flex items-center gap-1.5 flex-shrink-0 w-28">
                              <span className="text-[10px] text-slate-400">Op:</span>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.1"
                                value={cls.opacity}
                                onChange={(e) =>
                                  updateClass(idx, "opacity", parseFloat(e.target.value))
                                }
                                className="w-16 accent-blue-600 cursor-pointer"
                              />
                              <span className="text-[10px] font-mono text-slate-500 w-7">
                                {Math.round(cls.opacity * 100)}%
                              </span>
                            </div>

                            {/* Tombol Hapus */}
                            <button
                              type="button"
                              onClick={() => removeClass(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Hapus Kelas"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preview Legenda Bar */}
                  <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-xs font-semibold text-slate-700 block mb-2">
                      Pratinjau Legenda WMS:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {classes.map((cls, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 text-xs text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-sm"
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full flex-shrink-0 border border-black/10"
                            style={{
                              backgroundColor: cls.opacity === 0 ? "transparent" : cls.color,
                              backgroundImage:
                                cls.opacity === 0
                                  ? "repeating-linear-gradient(45deg, #ccc, #ccc 2px, #fff 2px, #fff 4px)"
                                  : "none",
                            }}
                          />
                          <span className="font-semibold text-slate-800">
                            {cls.label || `Val ${cls.quantity}`}
                          </span>
                          <span className="text-slate-400 text-[10px]">({cls.quantity})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checkbox Terapkan ke Layer yang Ada */}
                  <div className="mb-6">
                    <Checkbox
                      checked={applyToExisting}
                      onChange={(e) => setApplyToExisting(e.target.checked)}
                      className="text-xs text-slate-700 font-medium"
                    >
                      Terapkan juga palet ini ke semua layer raster yang saat ini sudah ada di
                      workspace ini ({layerPagination?.total ?? 0} layer)
                    </Checkbox>
                  </div>

                  {/* Tombol Simpan */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                    <Button
                      type="primary"
                      size="large"
                      onClick={handleSaveDefaultStyle}
                      loading={saveStyleMutation.isPending}
                      icon={<Check className="w-4 h-4" />}
                      className="flex items-center gap-2"
                    >
                      Simpan Palet Default Workspace
                    </Button>
                  </div>
                </div>
              ),
            },
            {
              key: "layers",
              label: (
                <span className="flex items-center gap-2 py-1 font-semibold">
                  <Layers className="w-4 h-4 text-blue-600" />
                  Daftar Layer di Workspace ({layerPagination?.total ?? 0})
                </span>
              ),
              children: (
                <div className="p-6">
                  {/* Search Bar & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                    <div className="relative flex-1 max-w-sm">
                      <SearchOutlined className="text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Cari layer di workspace ini..."
                        value={searchLayer}
                        onChange={(e) => {
                          setSearchLayer(e.target.value);
                          setLayerPage(1);
                        }}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refetchLayers()}
                        size="small"
                        className="text-xs"
                      >
                        Refresh
                      </Button>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => setOpenUploadModal(true)}
                        className="text-xs flex items-center"
                      >
                        Tambah Layer
                      </Button>
                    </div>
                  </div>

                  {/* List Layers */}
                  {isLoadingLayers ? (
                    <div className="py-16 text-center">
                      <Spin tip="Memuat layer di workspace..." />
                    </div>
                  ) : layersList.length === 0 ? (
                    <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                      <Layers className="w-12 h-12 mx-auto mb-2 opacity-30 text-slate-500" />
                      <p className="text-sm font-semibold text-slate-700">
                        Belum ada layer di workspace ini
                      </p>
                      <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                        Unggah file GeoTIFF ke workspace "{workspace?.name}".
                      </p>
                      <Button
                        type="primary"
                        className="mt-4"
                        icon={<PlusOutlined />}
                        onClick={() => setOpenUploadModal(true)}
                      >
                        Unggah Layer Sekarang
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {layersList.map((layer) => (
                        <div
                          key={layer.id}
                          className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-sm transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg flex-shrink-0">
                                  <ImageIcon className="w-4 h-4" />
                                </div>
                                <div>
                                  <h3 className="text-sm font-bold text-slate-800 truncate max-w-[200px]">
                                    {layer.layer_name}
                                  </h3>
                                  <span className="text-[11px] font-mono text-slate-400">
                                    EPSG:{layer.epsg} • {layer.data_type}
                                  </span>
                                </div>
                              </div>
                              <Tag color="green" className="text-[10px] m-0">
                                {layer.status}
                              </Tag>
                            </div>

                            {/* Info dimensions / bbox */}
                            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg">
                              <div>
                                <span className="text-slate-400 block text-[10px]">Tipe:</span>
                                <span className="font-semibold">{layer.layer_type}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">Dimensi:</span>
                                <span className="font-semibold">
                                  {layer.width ? `${layer.width}x${layer.height} px` : "-"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => setSelectedLayerForStyle(layer)}
                                className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1 hover:underline"
                              >
                                <Palette className="w-3.5 h-3.5" />
                                <span>Kustom Warna</span>
                              </button>

                              <Link
                                to="/dashboard/layer"
                                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                              >
                                <span>Lihat di Peta</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>
                            </div>

                            {/* Tombol Hapus Layer */}
                            <Popconfirm
                              title="Hapus Layer?"
                              description={`Apakah Anda yakin ingin menghapus layer "${layer.layer_name}"?`}
                              onConfirm={() => deleteLayerMutation.mutate(layer.id)}
                              okText="Hapus"
                              cancelText="Batal"
                              okButtonProps={{ danger: true, loading: deleteLayerMutation.isPending }}
                            >
                              <button
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                title="Hapus Layer dari Workspace"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Popconfirm>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pagination */}
                  {layerPagination && layerPagination.total > 0 && (
                    <div className="flex justify-center mt-6">
                      <Pagination
                        current={layerPagination.page}
                        pageSize={layerPagination.size}
                        total={layerPagination.total}
                        showSizeChanger
                        pageSizeOptions={["6", "12", "24"]}
                        size="small"
                        showTotal={(total) => `${total} layer ditemukan`}
                        onChange={(newPage, newPageSize) => {
                          setLayerPage(newPage);
                          setLayerPageSize(newPageSize);
                        }}
                      />
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Modal Custom Style untuk layer individual jika diinginkan */}
      {selectedLayerForStyle && (
        <LayerStyleModal
          open={Boolean(selectedLayerForStyle)}
          onClose={() => setSelectedLayerForStyle(null)}
          layer={selectedLayerForStyle}
          onStyleApplied={() => {
            refetchLayers();
            message.success("Style individual layer berhasil diperbarui!");
          }}
        />
      )}

      {/* Modal Upload Layer dengan Workspace & Project Terkunci */}
      <LayerModal
        open={openUploadModal}
        onClose={() => setOpenUploadModal(false)}
        defaultProjectId={workspace?.project_id}
        defaultWorkspaceId={workspace?.id || id_workspace}
        lockWorkspace={true}
        onSuccess={() => {
          refetchLayers();
        }}
      />
    </div>
  );
};

export default Workspace;