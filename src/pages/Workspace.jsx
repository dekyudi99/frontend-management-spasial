import { useState, useEffect } from "react";
import {
  DatabaseOutlined,
  FolderOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  GlobalOutlined,
  LockOutlined,
  CopyOutlined,
} from "@ant-design/icons";
import { useParams, Link, useSearchParams } from "react-router-dom";
import {
  Button,
  Spin,
  Tabs,
  Select,
  Pagination,
  Tag,
  message,
  Popconfirm,
  Form,
  Input,
  Table,
  Space,
  Tooltip,
  Alert,
} from "antd";
import {
  Palette,
  Layers,
  Trash2,
  Copy,
  ExternalLink,
  Sliders,
  Image as ImageIcon,
  Shapes,
  Clock,
  Info,
  Check,
  ArrowLeft,
} from "lucide-react";
import { formatDate } from "../utils/formatters";
import { getTypeConfig } from "../utils/geoUtils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import workspaceApi from "../api/WorkspaceApi";
import layerApi from "../api/LayerApi";
import keyApi from "../api/KeyApi";
import LayerStyleModal from "../components/LayerStyleModal";
import LayerModal from "../components/LayerModal";
import WorkspaceModal from "../components/WorkspaceModal";
import BackButton from "../components/BackButton";
import AccessDeniedCard from "../components/AccessDeniedCard";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";

const Workspace = () => {
  const { id, id_workspace } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { t, language, translateApi } = useLanguage();

  const activeWsId = id_workspace || id || searchParams.get("id");

  useEffect(() => {
    document.title = `${t('workspaceTitle', 'Workspace Spasial')} | AstraGIS`;
  }, [language, t]);

  // State: Workspace List Mode
  const [wsPage, setWsPage] = useState(1);
  const [wsPageSize, setWsPageSize] = useState(10);
  const [openCreateWsModal, setOpenCreateWsModal] = useState(false);
  const [searchWs, setSearchWs] = useState("");

  // Tab State: default ke "layers"
  const [activeTab, setActiveTab] = useState("layers");

  // Layers in Workspace State
  const [layerPage, setLayerPage] = useState(1);
  const [layerPageSize, setLayerPageSize] = useState(6);
  const [searchLayer, setSearchLayer] = useState("");
  const [selectedLayerForStyle, setSelectedLayerForStyle] = useState(null);
  const [openUploadModal, setOpenUploadModal] = useState(false);
  const [openWorkspaceStyleModal, setOpenWorkspaceStyleModal] = useState(false);

  // Settings Forms
  const [workspaceForm] = Form.useForm();

  // 0. Fetch API Key status to verify active permission
  const {
    data: keyRes,
    isLoading: isLoadingKey,
    refetch: refetchKey
  } = useQuery({
    queryKey: ["my-api-key"],
    queryFn: () => keyApi.getMyKey(),
    staleTime: 5000,
  });

  const keyData = keyRes?.data;
  const isKeyActive = Boolean(keyData?.is_active);
  const isKeyDisabled = !isLoadingKey && keyData && keyData.is_active === false;

  // 1. Fetch Workspaces List (hanya jika key aktif)
  const {
    data: workspacesListRes,
    isLoading: isLoadingList,
    refetch: refetchList
  } = useQuery({
    queryKey: ["workspaces-list", wsPage, wsPageSize, isKeyActive],
    queryFn: () => workspaceApi.list({ page: wsPage, size: wsPageSize }),
    enabled: !activeWsId && isKeyActive,
  });

  useEffect(() => {
    if (keyData?.plain_key && keyData?.is_active) {
      localStorage.setItem("astragis_s2s_key", keyData.plain_key);
    } else if (keyData && keyData.is_active === false) {
      localStorage.removeItem("astragis_s2s_key");
    }
  }, [keyData]);

  // 2. Fetch Workspace Detail (hanya jika key aktif)
  const {
    data: workspaceRes,
    isLoading: isLoadingWorkspace,
    isError,
    error,
  } = useQuery({
    queryKey: ["workspace-detail", activeWsId, isKeyActive],
    queryFn: () => workspaceApi.detail(activeWsId),
    enabled: !!activeWsId && isKeyActive,
  });

  const workspace = workspaceRes?.data?.data;

  // Sync form values when workspace details load
  useEffect(() => {
    if (workspace) {
      workspaceForm.setFieldsValue({
        name: workspace.name,
        visibility: workspace.visibility || "private",
      });
    }
  }, [workspace, workspaceForm]);

  // 3. Fetch Layers in this Workspace (hanya jika key aktif)
  const {
    data: layersRes,
    isLoading: isLoadingLayers,
    refetch: refetchLayers,
  } = useQuery({
    queryKey: ["workspace-layers", activeWsId, layerPage, layerPageSize, searchLayer, isKeyActive],
    queryFn: () =>
      layerApi.list({
        workspace_id: activeWsId,
        page: layerPage,
        size: layerPageSize,
        search: searchLayer || undefined,
      }),
    enabled: !!activeWsId && isKeyActive,
  });

  const layersList = layersRes?.data?.data || [];
  const layerPagination = layersRes?.data?.pagination;
  const rasterLayers = layersList.filter((l) => l.layer_type === "raster");

  // Mutation Hapus Workspace
  const deleteWorkspaceMutation = useMutation({
    mutationFn: (wsId) => workspaceApi.delete(wsId),
    onSuccess: (res) => {
      message.success(translateApi(res?.data?.detail) || "Workspace berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["workspaces-list"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      if (activeWsId) {
        setSearchParams({});
      }
    },
    onError: (err) => {
      const errorMsg = translateApi(err?.response?.data?.detail) || err?.message || "Gagal menghapus workspace.";
      message.error(errorMsg);
    }
  });

  // Mutation Hapus Layer
  const deleteLayerMutation = useMutation({
    mutationFn: (layerId) => layerApi.delete(layerId),
    onSuccess: (res) => {
      message.success(translateApi(res?.data?.detail) || "Layer deleted successfully!");
      refetchLayers();
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-layers"] });
    },
    onError: (err) => {
      const errorMsg = translateApi(err?.response?.data?.detail) || err?.message || "Failed to delete layer";
      message.error(errorMsg);
    },
  });

  // 0. Loading check untuk otorisasi API Key
  if (isLoadingKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spin size="large" />
        <span className="text-sm text-slate-500 font-medium">{t('verifyingAuthGeoServer', 'Memverifikasi status otorisasi GeoServer Microservice...')}</span>
      </div>
    );
  }

  // =========================================================================
  // BLOKIR AKSES WORKSPACE JIKA API KEY DINONAKTIFKAN OLEH ADMIN (DRY Component)
  // =========================================================================
  if (isKeyDisabled || !isKeyActive) {
    return (
      <AccessDeniedCard
        featureName={t('menuWorkspace', 'Workspace')}
        description={t('accessDeniedWorkspaceDesc', 'Seluruh akses ke ruang kerja spasial GeoServer, layer raster, dan vektor ditangguhkan sementara hingga Administrator mengaktifkan kembali status API Key Anda.')}
        keyData={keyData}
        onRefresh={refetchKey}
        isRefreshing={isLoadingKey}
      />
    );
  }

  // =========================================================================
  // MODE 1: WORKSPACE LIST VIEW (Ketika activeWsId tidak ada)
  // =========================================================================
  if (!activeWsId) {
    const rawData = workspacesListRes?.data?.data || [];
    const filteredWorkspaces = searchWs 
      ? rawData.filter(w => 
          w.display_name?.toLowerCase().includes(searchWs.toLowerCase()) || 
          w.name?.toLowerCase().includes(searchWs.toLowerCase()) || 
          w.ws_name?.toLowerCase().includes(searchWs.toLowerCase())
        )
      : rawData;

    const columns = [
      {
        title: t('columnWorkspaceDisplay', "Workspace (Display & GeoServer)"),
        key: "name",
        render: (_, r) => (
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex-shrink-0">
              <FolderOutlined className="text-lg" />
            </div>
            <div className="min-w-0">
              {/* Display Name Wajib Tampil Jelas */}
              <span 
                onClick={() => setSearchParams({ id: r.id })}
                className="font-bold text-slate-800 hover:text-blue-600 cursor-pointer transition block text-sm truncate"
                title={r.display_name || r.name}
              >
                {r.display_name || r.name}
              </span>
              {/* Nama Teknis di GeoServer (digunakan untuk memanggil WMS Layer) */}
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[11px] text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
                  <span className="text-slate-400 font-sans font-medium">GeoServer / WMS:</span>
                  <span className="font-semibold text-slate-700 select-all">{r.ws_name || r.workspace_name || r.id}</span>
                </span>
                <Tooltip title={t('copyGeoServerName', "Salin Nama GeoServer / WMS")}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(r.ws_name || r.workspace_name || r.id);
                      message.success(t('geoServerNameCopied', "Nama GeoServer berhasil disalin!"));
                    }}
                    className="text-slate-400 hover:text-blue-600 p-0.5 rounded hover:bg-slate-100 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        )
      },
      {
        title: t('columnWorkspaceId', "Workspace ID"),
        dataIndex: "id",
        key: "id",
        width: 140,
        render: (id) => (
          <Space size="small">
            <code className="text-xs bg-slate-100 text-blue-700 font-mono px-2 py-0.5 rounded border border-slate-200 font-semibold">
              {id}
            </code>
            <Tooltip title={t('copyId', "Salin ID")}>
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined className="text-slate-400 hover:text-blue-600 text-xs" />}
                onClick={() => {
                  navigator.clipboard.writeText(id);
                  message.success(t('workspaceIdCopied', "ID Workspace tersalin!"));
                }}
              />
            </Tooltip>
          </Space>
        )
      },
      {
        title: t('createdAt', "Dibuat Pada"),
        dataIndex: "created_at",
        key: "created_at",
        width: 150,
        render: (dateVal) => <span className="text-xs text-slate-500">{formatDate(dateVal, language)}</span>
      },
      {
        title: t('actions', "Aksi"),
        key: "actions",
        width: 180,
        render: (_, r) => {
          const isDeleting = deleteWorkspaceMutation.isPending && deleteWorkspaceMutation.variables === r.id;
          return (
            <div className="flex items-center gap-2">
              <Button
                type="primary"
                size="small"
                onClick={() => setSearchParams({ id: r.id })}
                className="text-xs bg-blue-600"
              >
                {t('openLayers', "Buka Layer")}
              </Button>
              <Popconfirm
                title={t('deleteWorkspaceConfirmTitle', "Hapus Workspace ini?")}
                description={t('deleteWorkspaceConfirmDesc', { name: r.display_name || r.name })}
                onConfirm={async () => {
                  try {
                    await deleteWorkspaceMutation.mutateAsync(r.ws_name || r.workspace_name || r.id);
                  } catch (e) {
                    // Handled in onError callback
                  }
                }}
                okText={t('delete', "Hapus")}
                cancelText={t('cancel', "Batal")}
                okType="danger"
                okButtonProps={{ loading: isDeleting }}
              >
                <Button 
                  size="small" 
                  danger 
                  loading={isDeleting}
                  icon={<Trash2 className="w-3.5 h-3.5" />} 
                />
              </Popconfirm>
            </div>
          );
        }
      }
    ];

    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        {/* Header (DRY PageHeader Component) */}
        <PageHeader
          icon={FolderOutlined}
          title={t('workspaceTitle', 'Workspace Spasial')}
          subtitle={t('workspaceSubtitle', 'Kelola ruang kerja GeoServer Anda untuk mengorganisir data raster dan vektor.')}
          iconBgColor="bg-blue-50"
          iconColor="text-blue-600"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpenCreateWsModal(true)}
              className="flex items-center shadow-sm"
            >
              {t('newWorkspace', 'Buat Workspace Baru')}
            </Button>
          }
        />

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <SearchOutlined className="text-slate-400 absolute left-3 top-3 text-sm" />
            <input
              type="text"
              placeholder={t('searchWorkspacePlaceholder', "Cari workspace...")}
              value={searchWs}
              onChange={(e) => setSearchWs(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
          <Button icon={<ReloadOutlined />} onClick={() => refetchList()}>
            {t('reloadBtn', "Muat Ulang")}
          </Button>
        </div>

        {/* Table List */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
          <Table
            dataSource={filteredWorkspaces}
            columns={columns}
            rowKey="id"
            loading={isLoadingList}
            pagination={{
              current: wsPage,
              pageSize: wsPageSize,
              total: workspacesListRes?.data?.total || 0,
              onChange: (p, s) => {
                setWsPage(p);
                setWsPageSize(s);
              }
            }}
          />
        </div>

        {/* Create Modal */}
        <WorkspaceModal
          open={openCreateWsModal}
          onClose={() => {
            setOpenCreateWsModal(false);
            refetchList();
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // MODE 2: WORKSPACE DETAIL VIEW (Ketika activeWsId dipilih)
  // =========================================================================
  if (isLoadingWorkspace) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Back to List Button */}
      <div>
        <Button
          type="text"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => setSearchParams({})}
          className="text-slate-600 hover:text-blue-600 font-medium flex items-center gap-1.5 px-0"
        >
          {t('backToWorkspacesList', "Kembali ke Daftar Workspace")}
        </Button>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 flex-shrink-0">
              <FolderOutlined className="text-2xl" />
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">
                  {workspace?.display_name || workspace?.name}
                </h1>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-mono font-medium shadow-2xs">
                  <span className="text-slate-500 font-sans font-normal">{t('columnWorkspaceId', 'Workspace ID')}:</span>
                  <span className="font-semibold select-all">{workspace?.id || activeWsId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(workspace?.id || activeWsId);
                      message.success(t('workspaceIdCopied', "ID Workspace tersalin!"));
                    }}
                    title={t('copyId', "Salin ID Workspace")}
                    className="hover:text-blue-900 text-blue-600 transition-colors cursor-pointer p-0.5 rounded hover:bg-blue-100"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="font-mono text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md border border-slate-200 flex items-center gap-1">
                  <span className="text-slate-400 font-sans">GeoServer / WMS:</span>
                  <span className="font-semibold text-slate-700 select-all">{workspace?.ws_name || workspace?.workspace_name || activeWsId}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(workspace?.ws_name || workspace?.workspace_name || activeWsId);
                      message.success(t('geoServerNameCopied', "Nama GeoServer berhasil disalin!"));
                    }}
                    title={t('copyGeoServerName', "Salin Nama GeoServer / WMS")}
                    className="hover:text-blue-900 text-slate-500 transition-colors cursor-pointer p-0.5 rounded hover:bg-slate-200 ml-0.5"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {t('createdAt', 'Dibuat')}: {formatDate(workspace?.created_at, language)}
                </span>
                <span className="flex items-center gap-1">
                  <DatabaseOutlined /> {layerPagination?.total ?? 0} {t('layers', 'Layer')}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setOpenUploadModal(true)}
              className="flex items-center"
            >
              {t('uploadLayer', 'Upload Layer Baru')}
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-5 p-3.5 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center gap-3 text-xs text-blue-800">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0" />
          <span>
            {t('workspaceBannerHint', "Workspace ini terhubung langsung ke GeoServer Microservice. Seluruh layer raster & vektor yang dipublish di bawah workspace ini dikelola di sini.")}
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
              key: "layers",
              label: (
                <span className="flex items-center gap-2 py-1 font-semibold text-sm">
                  <Layers className="w-4 h-4 text-blue-600" />
                  {t('layersInWorkspace', { count: layerPagination?.total ?? 0 })}
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
                        placeholder={t('searchLayersInWorkspace', "Cari layer dalam workspace...")}
                        value={searchLayer}
                        onChange={(e) => {
                          setSearchLayer(e.target.value);
                          setLayerPage(1);
                        }}
                        className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refetchLayers()}
                        size="small"
                        className="text-xs"
                      >
                        {t('refresh', 'Refresh')}
                      </Button>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => setOpenUploadModal(true)}
                        className="text-xs flex items-center"
                      >
                        {t('addLayer', 'Tambah Layer')}
                      </Button>
                    </div>
                  </div>

                  {/* Layers List Cards */}
                  {isLoadingLayers ? (
                    <div className="flex justify-center items-center py-20">
                      <Spin size="large" />
                    </div>
                  ) : layersList.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                      <Layers className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-sm font-semibold text-slate-700">{t('noLayersInWorkspaceYet', 'Belum Ada Layer')}</h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        {t('noLayersInWorkspaceDesc', 'Workspace ini belum memiliki layer spasial. Upload file Shapefile, GeoJSON, atau GeoTIFF untuk memulai.')}
                      </p>
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        size="small"
                        onClick={() => setOpenUploadModal(true)}
                        className="mt-4 text-xs"
                      >
                        {t('uploadLayer', 'Upload Layer Sekarang')}
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {layersList.map((layer) => {
                        const typeConfig = getTypeConfig(layer.layer_type);
                        return (
                          <div
                            key={layer.id}
                            className="bg-white border border-slate-200 rounded-xl p-4.5 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold tracking-wider ${typeConfig.bgColor} ${typeConfig.color} border ${typeConfig.borderColor}`}>
                                  {typeConfig.icon}
                                  {typeConfig.label}
                                </span>

                                <Popconfirm
                                  title={t('deleteLayerConfirmTitle', "Hapus layer ini?")}
                                  description={t('deleteLayerConfirmDesc', "Layer akan dihapus dari GeoServer.")}
                                  onConfirm={() => deleteLayerMutation.mutate(layer.id)}
                                  okText={t('delete', "Hapus")}
                                  cancelText={t('cancel', "Batal")}
                                  okType="danger"
                                >
                                  <button className="text-slate-400 hover:text-red-600 transition p-1 rounded-md hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </Popconfirm>
                              </div>

                              <div>
                                <h4 className="font-bold text-sm text-slate-800 truncate" title={layer.layer_name}>
                                  {layer.layer_name}
                                </h4>
                                <span className="text-xs text-slate-400 font-mono block truncate">
                                  {layer.geoserver_layer_name}
                                </span>
                              </div>
                            </div>

                            <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                              <span>EPSG: {layer.srid || "4326"}</span>
                              <Link
                                to={`/dashboard/layer?id=${layer.id}`}
                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                              >
                                {t('detailAndPreview', 'Detail & Pratinjau →')}
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Pagination */}
                  {layerPagination && layerPagination.total > 0 && (
                    <div className="flex justify-end mt-6">
                      <Pagination
                        current={layerPage}
                        pageSize={layerPageSize}
                        total={layerPagination.total}
                        onChange={(p, s) => {
                          setLayerPage(p);
                          setLayerPageSize(s);
                        }}
                        showSizeChanger
                        pageSizeOptions={["6", "12", "24"]}
                      />
                    </div>
                  )}
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Modal Upload Layer */}
      <LayerModal
        open={openUploadModal}
        onClose={() => setOpenUploadModal(false)}
        defaultWorkspaceId={workspace?.id || activeWsId}
        lockWorkspace={true}
        onSuccess={() => {
          refetchLayers();
          queryClient.invalidateQueries({ queryKey: ["workspace-detail", activeWsId] });
        }}
      />
    </div>
  );
};

export default Workspace;