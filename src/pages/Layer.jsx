import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, WMSTileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import {
  Layers,
  Plus,
  Search,
  CheckCircle2,
  Navigation2,
  FolderPlus,
  CheckSquare,
  Square,
  ArrowDownUp,
  Trash2,
} from "lucide-react";
import { Button, Spin, Pagination, message, Tabs, Badge, Select, Tag, Popconfirm } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import keyApi from "../api/KeyApi";
import layerApi from "../api/LayerApi";
import layerGroupApi from "../api/LayerGroupApi";
import workspaceApi from "../api/WorkspaceApi";
import LayerModal from "../components/LayerModal";
import LayerStyleModal from "../components/LayerStyleModal";
import LayerCard from "../components/layer/LayerCard";
import LayerGroupCard from "../components/layer/LayerGroupCard";
import LayerGroupModal from "../components/layer/LayerGroupModal";
import LayerGroupEditModal from "../components/layer/LayerGroupEditModal";
import MapFlyController from "../components/layer/MapFlyController";
import AccessDeniedCard from "../components/AccessDeniedCard";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";

const appName = import.meta.env.VITE_APP_NAME

const Layer = () => {
  const { t } = useLanguage();
  useEffect(()=>{
    document.title = `Layer | ${appName}`
  },[])

  const queryClient = useQueryClient();

  // Modal states
  const [openLayerModal, setOpenLayerModal] = useState(false);
  const [openGroupModal, setOpenGroupModal] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [stylingLayer, setStylingLayer] = useState(null);

  // Filter & selection states
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [checkedLayerIds, setCheckedLayerIds] = useState([]);
  const [activeTab, setActiveTab] = useState("layers");
  const [flyTrigger, setFlyTrigger] = useState(0);

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);

  // Drag & drop state
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [customOrderIds, setCustomOrderIds] = useState([]);

  // Layer settings (visibility, opacity, cache bust)
  const [layerSettings, setLayerSettings] = useState({});

  // Group settings (visibility, opacity)
  const [groupSettings, setGroupSettings] = useState({});
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [groupSublayerSettings, setGroupSublayerSettings] = useState({});
  const [deletingLayerId, setDeletingLayerId] = useState(null);

  // 0. Cek Status API Key
  const {
    data: keyRes,
    isLoading: isLoadingKey,
  } = useQuery({
    queryKey: ["my-api-key"],
    queryFn: () => keyApi.getMyKey(),
    staleTime: 5000,
  });

  const keyData = keyRes?.data;
  const isKeyActive = Boolean(keyData?.is_active);
  const isKeyDisabled = !isLoadingKey && keyData && keyData.is_active === false;

  // 0. Fetch Workspaces milik user untuk filter dropdown (hanya jika key aktif)
  const { data: workspacesResponse } = useQuery({
    queryKey: ["user-workspaces", isKeyActive],
    queryFn: () => workspaceApi.getAll(),
    enabled: isKeyActive,
  });
  const userWorkspaces = workspacesResponse?.data?.data || [];

  // 1. Fetch Layers Query (hanya jika key aktif)
  const { data: responseData, isLoading: isLoadingLayers } = useQuery({
    queryKey: ["layers", page, pageSize, selectedWorkspaceId, searchQuery, isKeyActive],
    queryFn: () =>
      layerApi.list({
        page,
        size: pageSize,
        workspace_id: selectedWorkspaceId || undefined,
        search: searchQuery.trim() || undefined,
      }),
    enabled: isKeyActive,
  });

  // 2. Fetch Layer Groups Query (hanya jika key aktif)
  const { data: groupResponse, isLoading: isLoadingGroups } = useQuery({
    queryKey: ["layer-groups", selectedWorkspaceId, isKeyActive],
    queryFn: () =>
      layerGroupApi.list({
        workspace_id: selectedWorkspaceId || undefined,
      }),
    enabled: isKeyActive,
  });

  // Delete layer mutation
  const deleteLayerMutation = useMutation({
    mutationFn: (layerOrId) => {
      const id = typeof layerOrId === "object" ? layerOrId.id : layerOrId;
      setDeletingLayerId(id);
      return layerApi.delete(layerOrId);
    },
    onSuccess: (res) => {
      message.success(res?.data?.detail || "Layer deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      queryClient.invalidateQueries({ queryKey: ["layer-groups"] });
    },
    onError: (err) => {
      message.error(err.response?.data?.detail || err.message || "Failed to delete layer");
    },
    onSettled: () => {
      setDeletingLayerId(null);
    },
  });

  // Batch delete layers mutation
  const [isBatchDeleting, setIsBatchDeleting] = useState(false);
  const batchDeleteMutation = useMutation({
    mutationFn: (ids) => {
      setIsBatchDeleting(true);
      return layerApi.batchDelete(ids);
    },
    onSuccess: (res) => {
      message.success(res?.data?.detail || `${checkedLayerIds.length} layers deleted successfully!`);
      setCheckedLayerIds([]);
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      queryClient.invalidateQueries({ queryKey: ["layer-groups"] });
    },
    onError: (err) => {
      message.error(err.response?.data?.detail || err.message || "Failed to delete selected layers");
    },
    onSettled: () => {
      setIsBatchDeleting(false);
    },
  });

  // Delete group mutation
  const deleteGroupMutation = useMutation({
    mutationFn: (id) => layerGroupApi.delete(id),
    onSuccess: (res) => {
      message.success(res?.data?.detail || "Layer Group deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["layer-groups"] });
    },
    onError: (err) => {
      message.error(err.response?.data?.detail || "Failed to delete Layer Group");
    },
  });

  const rawLayers = responseData?.data?.data || [];
  const pagination = responseData?.data?.pagination;
  const rawGroups = groupResponse?.data?.data || [];

  // Sinkronkan custom order saat data layer berubah
  useEffect(() => {
    if (rawLayers.length > 0) {
      const incomingIds = rawLayers.map((l) => l.id);
      setCustomOrderIds((prev) => {
        // Pertahankan urutan sebelumnya jika ada, tambahkan yang baru
        const existing = prev.filter((id) => incomingIds.includes(id));
        const added = incomingIds.filter((id) => !existing.includes(id));
        return [...existing, ...added];
      });
    }
  }, [rawLayers]);

  // Urutkan layer berdasarkan customOrderIds (drag & drop order)
  const orderedRawLayers = useMemo(() => {
    if (customOrderIds.length === 0) return rawLayers;
    const map = new Map(rawLayers.map((l) => [l.id, l]));
    const result = [];
    customOrderIds.forEach((id) => {
      if (map.has(id)) {
        result.push(map.get(id));
        map.delete(id);
      }
    });
    // Tambahkan sisa jika ada
    map.forEach((val) => result.push(val));
    return result;
  }, [rawLayers, customOrderIds]);

  // Layer dengan state visibility
  const layers = useMemo(
    () =>
      orderedRawLayers.map((l) => ({
        ...l,
        visible: layerSettings[l.id]?.visible ?? false,
      })),
    [orderedRawLayers, layerSettings]
  );

  // Group dengan state visibility
  const layerGroups = useMemo(
    () =>
      rawGroups.map((g) => ({
        ...g,
        visible: groupSettings[g.id]?.visible ?? false,
      })),
    [rawGroups, groupSettings]
  );

  // Layer yang sedang dipilih untuk fly-to
  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId) ?? null,
    [layers, selectedLayerId]
  );

  // Group yang sedang dipilih untuk fly-to (acuan layer teratas)
  const selectedGroup = useMemo(
    () => layerGroups.find((g) => g.id === selectedGroupId) ?? null,
    [layerGroups, selectedGroupId]
  );

  // Filter layer: Karena search & filter workspace sudah dilakukan langsung di database backend,
  // filteredLayers langsung menggunakan `layers` dari response backend!
  const filteredLayers = layers;

  // Filter group berdasarkan search
  const filteredGroups = useMemo(() => {
    return layerGroups.filter((g) =>
      g.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [layerGroups, searchQuery]);

  // ── Drag and Drop Handlers ───────────────────────────────────────────────────

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newOrder = [...customOrderIds];
    const draggedItemId = newOrder[draggedIndex];
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, draggedItemId);

    setCustomOrderIds(newOrder);
    setDraggedIndex(null);
    message.info("Layer order updated (rendering stack changed)");
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // ── Checklist Handlers ───────────────────────────────────────────────────────

  const handleToggleCheck = (id) => {
    setCheckedLayerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (checkedLayerIds.length === filteredLayers.length) {
      setCheckedLayerIds([]);
    } else {
      setCheckedLayerIds(filteredLayers.map((l) => l.id));
    }
  };

  // ── Visibility & Opacity Handlers ───────────────────────────────────────────

  const toggleLayerVisibility = (id) => {
    setLayerSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: !(prev[id]?.visible ?? false) },
    }));
  };

  const handleSelectLayer = (id) => {
    setSelectedLayerId(id);
    setSelectedGroupId(null);
    setFlyTrigger((prev) => prev + 1);
    setLayerSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: true },
    }));
  };

  const toggleGroupVisibility = (groupId) => {
    setGroupSettings((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], visible: !(prev[groupId]?.visible ?? false) },
    }));
  };

  const handleSelectGroup = (groupId) => {
    setSelectedGroupId(groupId);
    setSelectedLayerId(null);
    setFlyTrigger((prev) => prev + 1);
    setGroupSettings((prev) => ({
      ...prev,
      [groupId]: { ...prev[groupId], visible: true },
    }));
  };

  const handleToggleGroupSublayer = (groupId, sublayerId) => {
    setGroupSublayerSettings((prev) => {
      const group = layerGroups.find((g) => g.id === groupId);
      const allIds = (group?.layers || []).map((l) => l.id || l.layer_id);
      const currentSelected = prev[groupId] !== undefined ? prev[groupId] : allIds;
      const isSelected = currentSelected.includes(sublayerId);
      const updated = isSelected
        ? currentSelected.filter((id) => id !== sublayerId)
        : [...currentSelected, sublayerId];
      return { ...prev, [groupId]: updated };
    });
  };

  const handleStyleApplied = (layerId) => {
    setLayerSettings((prev) => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        visible: true,
        styleUpdatedAt: Date.now(),
      },
    }));
  };

  const visibleLayerCount = layers.filter((l) => l.visible).length;
  const visibleGroupCount = layerGroups.filter((g) => g.visible).length;

  if (isLoadingKey) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Spin size="large" />
        <span className="text-sm text-slate-500 font-medium">{t('verifyingAuthGeoServer', 'Memverifikasi status otorisasi GeoServer Microservice...')}</span>
      </div>
    );
  }

  if (isKeyDisabled || !isKeyActive) {
    return (
      <AccessDeniedCard
        featureName={t('menuLayer', 'Layer & Peta')}
        description={t('accessDeniedLayerDesc', 'Seluruh akses ke visualisasi layer peta GeoServer, upload raster/vektor, dan styling ditangguhkan sementara hingga Administrator mengaktifkan kembali status API Key Anda.')}
        keyData={keyData}
        onRefresh={refetchKey}
        isRefreshing={isLoadingKey}
      />
    );
  }

  return (
    <div className="p-3 sm:p-5 md:p-6 bg-slate-50 min-h-[calc(100vh-64px)] font-sans">
      {/* ── Header (DRY PageHeader Component) ─────────────────────────── */}
      <PageHeader
        icon={Layers}
        title={t('layerPageTitle', 'Layer & Group Management')}
        subtitle={t('layerPageSubtitle', 'Manage, reorder layers (drag & drop), create Layer Groups, and preview via GeoServer WMS.')}
        iconBgColor="bg-blue-50"
        iconColor="text-blue-600"
        className="mb-4 sm:mb-6"
        extra={
          <Button
            onClick={() => setOpenLayerModal(true)}
            type="primary"
            icon={<Plus className="w-4 h-4" />}
            className="flex items-center gap-1.5 !bg-blue-600 hover:!bg-blue-500"
          >
            {t('addNewLayer', 'Add New Layer')}
          </Button>
        }
      />

      {/* ── Main Grid Layout ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* LEFT COLUMN: Layer & Group List (col-span-5) */}
        <div className="order-2 lg:order-1 lg:col-span-5 space-y-3">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            {/* Tab Navigation: Single Layers vs Layer Groups */}
            <div className="px-4 pt-3 border-b border-slate-100 bg-white">
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  {
                    key: "layers",
                    label: (
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {t('tabSingleLayers', 'Single Layers')}
                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                          {layers.length}
                        </span>
                      </span>
                    ),
                  },
                  {
                    key: "groups",
                    label: (
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {t('tabLayerGroups', 'Layer Groups')}
                        <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">
                          {layerGroups.length}
                        </span>
                      </span>
                    ),
                  },
                ]}
              />
            </div>

            {/* Filter & Search Toolbar */}
            <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2">
              {/* Workspace Filter Dropdown */}
              <Select
                allowClear
                placeholder={t('allWorkspaces', 'All Workspaces')}
                value={selectedWorkspaceId}
                onChange={(val) => {
                  setSelectedWorkspaceId(val || null);
                  setPage(1);
                }}
                className="w-full sm:w-44 text-xs shrink-0"
              >
                {userWorkspaces.map((ws) => (
                  <Select.Option key={ws.id || ws.ws_name} value={String(ws.id || ws.ws_name)}>
                    {ws.display_name || ws.name || ws.id}
                  </Select.Option>
                ))}
              </Select>

              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={
                    activeTab === "layers"
                      ? t('searchLayerPlaceholder', 'Search layer name...')
                      : t('searchGroupPlaceholder', 'Search layer group name...')
                  }
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* TAB CONTENT: Single Layers */}
            {activeTab === "layers" && (
              <>
                {/* Floating Checklist Toolbar when layers are selected */}
                <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-medium cursor-pointer"
                    >
                      {checkedLayerIds.length > 0 && checkedLayerIds.length === filteredLayers.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400" />
                      )}
                      <span>{t('selectAll', 'Select All')} ({checkedLayerIds.length}/{filteredLayers.length})</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <ArrowDownUp className="w-3.5 h-3.5" />
                    <span>{t('dragToReorder', 'Drag handle to reorder')}</span>
                  </div>
                </div>

                {/* Banner CTA when layers are checked */}
                {checkedLayerIds.length > 0 && (
                  <div className="mx-3 mt-3 p-2.5 bg-indigo-50 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-2 animate-in fade-in duration-200 flex-wrap">
                    <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
                      <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      <span>{t('layersCountSelected', '{count} layers selected', { count: checkedLayerIds.length })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Button
                        size="small"
                        type="primary"
                        onClick={() => setOpenGroupModal(true)}
                        disabled={isBatchDeleting}
                        className="!bg-indigo-600 hover:!bg-indigo-500 !text-xs !font-medium"
                      >
                        {t('saveToGroup', 'Save to Group')}
                      </Button>

                      <Popconfirm
                        title={t('deleteSelectedLayersTitle', `Hapus ${checkedLayerIds.length} Layer Terpilih?`)}
                        description={t(
                          'deleteSelectedLayersDesc',
                          `Apakah Anda yakin ingin menghapus ${checkedLayerIds.length} layer terpilih secara permanen? Data di GeoServer dan database akan dihapus.`
                        )}
                        onConfirm={() => batchDeleteMutation.mutate(checkedLayerIds)}
                        okText={t('delete', 'Hapus')}
                        cancelText={t('cancel', 'Batal')}
                        okButtonProps={{ danger: true, loading: isBatchDeleting }}
                      >
                        <Button
                          size="small"
                          danger
                          loading={isBatchDeleting}
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          className="!text-xs !font-medium"
                        >
                          {t('deleteSelected', `Hapus (${checkedLayerIds.length})`)}
                        </Button>
                      </Popconfirm>

                      <button
                        onClick={() => setCheckedLayerIds([])}
                        disabled={isBatchDeleting}
                        className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1 disabled:opacity-50"
                      >
                        {t('cancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Layers (Drag & Drop enabled) */}
                <Spin
                  spinning={isBatchDeleting}
                  tip={t('deletingSelectedLayers', `Sedang menghapus ${checkedLayerIds.length} layer terpilih...`)}
                >
                  <div className="p-3 space-y-2.5 max-h-[520px] overflow-y-auto">
                    {isLoadingLayers ? (
                      <div className="text-center py-10">
                        <Spin tip={t('loadingLayers', 'Loading layers list...')} />
                      </div>
                    ) : filteredLayers.length === 0 ? (
                      <div className="text-center py-10 text-slate-400">
                        <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">{t('noLayersFound', 'No layers found')}</p>
                        <p className="text-xs mt-1">{t('clickAddLayerHint', 'Click "Add New Layer" to upload GIS data')}</p>
                      </div>
                    ) : (
                      filteredLayers.map((layer, idx) => (
                        <LayerCard
                          key={layer.id}
                          layer={layer}
                          index={idx}
                          isSelected={selectedLayerId === layer.id}
                          isChecked={checkedLayerIds.includes(layer.id)}
                          onSelect={handleSelectLayer}
                          onToggleCheck={handleToggleCheck}
                          onToggleVisibility={toggleLayerVisibility}
                          onOpenStyle={setStylingLayer}
                          onDelete={(layerOrId) => deleteLayerMutation.mutate(layerOrId)}
                          isDeleting={deletingLayerId === layer.id || (isBatchDeleting && checkedLayerIds.includes(layer.id))}
                          // Drag & Drop
                          onDragStart={handleDragStart}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onDragEnd={handleDragEnd}
                          isDragging={draggedIndex === idx}
                        />
                      ))
                    )}

                    {/* Pagination */}
                    {pagination && pagination.total > 0 && (
                      <div className="flex justify-center mt-3 pt-2 border-t border-slate-100">
                        <Pagination
                          current={pagination.page}
                          pageSize={pagination.size}
                          total={pagination.total}
                          showSizeChanger
                          pageSizeOptions={["3", "6", "12"]}
                          size="small"
                          showTotal={(total) => `${total} ${t('layersAvailable', 'layers')}`}
                          onChange={(newPage, newPageSize) => {
                            setPage(newPage);
                            setPageSize(newPageSize);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </Spin>
              </>
            )}

            {/* TAB CONTENT: Layer Group */}
            {activeTab === "groups" && (
              <div className="p-3 space-y-2.5 max-h-[540px] overflow-y-auto">
                <div className="flex items-center justify-between px-1 pb-1">
                  <span className="text-xs text-slate-400">
                    {t('groupInfoHint', 'Layer Group combines multi-layers into a single WMS request')}
                  </span>
                  <Button
                    size="small"
                    type="link"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      if (checkedLayerIds.length === 0) {
                        message.info(t('selectLayersToGroupFirst', "Check layers in the 'Single Layers' tab to create a group"));
                        setActiveTab("layers");
                      } else {
                        setOpenGroupModal(true);
                      }
                    }}
                    className="!p-0 !text-xs text-blue-600"
                  >
                    {t('newGroup', 'New Group')}
                  </Button>
                </div>

                {isLoadingGroups ? (
                  <div className="text-center py-10">
                    <Spin tip={t('loadingGroups', 'Loading layer groups...')} />
                  </div>
                ) : filteredGroups.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <FolderPlus className="w-10 h-10 mx-auto mb-2 opacity-40 text-indigo-400" />
                    <p className="text-sm font-medium">{t('noGroupsYet', 'No Layer Groups Yet')}</p>
                    <p className="text-xs mt-1 max-w-xs mx-auto">
                      {t('createGroupHint', 'Check layers in the "Single Layers" tab, then click "Save to Group".')}
                    </p>
                  </div>
                ) : (
                  filteredGroups.map((group) => (
                    <LayerGroupCard
                      key={group.id}
                      group={group}
                      isSelected={selectedGroupId === group.id}
                      isVisible={group.visible}
                      onSelect={handleSelectGroup}
                      onToggleVisibility={toggleGroupVisibility}
                      onEdit={(id) => setEditingGroupId(id)}
                      onDelete={(id) => deleteGroupMutation.mutate(id)}
                      selectedSublayerIds={groupSublayerSettings[group.id]}
                      onToggleSublayer={handleToggleGroupSublayer}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Peta WMS Live Preview (col-span-7) */}
        <div className="order-1 lg:order-2 lg:col-span-7">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col h-[360px] sm:h-[480px] lg:h-[620px]">
            {/* Map Header Indicator */}
            <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-white z-10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  {t('wmsLiveEngine', 'WMS Live Engine')}
                </span>
                {selectedLayer && (
                  <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 ml-1 truncate max-w-[160px]">
                    <Navigation2 className="w-3 h-3 flex-shrink-0" />
                    {selectedLayer.display_name || selectedLayer.layer_name}
                  </span>
                )}
                {selectedGroup && (
                  <span className="text-[11px] text-indigo-600 font-medium flex items-center gap-1 ml-1 truncate max-w-[160px]">
                    <Navigation2 className="w-3 h-3 flex-shrink-0" />
                    {selectedGroup.title}
                  </span>
                )}
              </div>

              {/* Active Layer & Group Status */}
              <div className="flex items-center gap-2">
                {visibleLayerCount > 0 && (
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                    {visibleLayerCount} {t('activeLayersCount', 'Active Layers')}
                  </span>
                )}
                {visibleGroupCount > 0 && (
                  <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                    {visibleGroupCount} {t('activeGroupsCount', 'Active Groups')}
                  </span>
                )}
                {visibleLayerCount === 0 && visibleGroupCount === 0 && (
                  <span className="text-xs text-slate-400">{t('mapStandby', 'Map standby')}</span>
                )}
              </div>
            </div>

            {/* Map Canvas */}
            <div className="flex-1 relative z-0">
              <MapContainer
                center={[-2.5, 118.0]}
                zoom={5}
                minZoom={3}
                maxBounds={[[-85, -180], [85, 180]]}
                maxBoundsViscosity={0.9}
                scrollWheelZoom
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  noWrap={true}
                />

                {/* Controller fly-to ke bbox layer / group terpilih */}
                <MapFlyController
                  selectedLayer={selectedLayer}
                  selectedGroup={selectedGroup}
                  flyTrigger={flyTrigger}
                />

                {/* Render Individual WMS Layers:
                    Array di-reverse agar item teratas di list (#1) dirender terakhir di DOM
                    dan memiliki zIndex paling tinggi, sehingga tampil di tumpukan paling atas pada peta */}
                {[...layers].reverse().map((layer, revIdx) => {
                  if (!layer.visible || !layer.wms_url) return null;
                  const lyrName = layer.geoserver_name || layer.table_name || layer.store_name || layer.layer_name;
                  return (
                    <WMSTileLayer
                      key={`layer-${layer.id}-${layerSettings[layer.id]?.styleUpdatedAt || 0}`}
                      url={layer.wms_url}
                      zIndex={10 + revIdx}
                      params={{
                        layers: `${layer.workspace_name}:${lyrName}`,
                        format: "image/png",
                        transparent: true,
                        version: "1.1.1",
                        _t: layerSettings[layer.id]?.styleUpdatedAt || undefined,
                      }}
                      opacity={1}
                    />
                  );
                })}

                {/* Render Layer Groups WMS (Group visual dengan instant cache-busting _t dan penanganan mode GeoServer) */}
                {layerGroups.map((group) => {
                  if (!group.visible || !group.wms_url) return null;
                  const groupTs = groupSettings[group.id]?.updatedAt || 0;
                  const mode = String(group.mode || "SINGLE").toUpperCase();
                  const allLayers = Array.isArray(group.layers) ? group.layers : [];
                  const activeSublayerIds = groupSublayerSettings[group.id];

                  let layersParam = group.wms_layers_param;

                  if (mode === "CONTAINER") {
                    // GeoServer WMS tidak mengizinkan request GetMap langsung pada container group
                    const selectedList = activeSublayerIds !== undefined
                      ? allLayers.filter((l) => activeSublayerIds.includes(l.id || l.layer_id))
                      : allLayers;
                    if (selectedList.length === 0) return null;
                    layersParam = selectedList
                      .map((l) => `${l.workspace_name || group.workspace_name}:${l.geoserver_name}`)
                      .join(",");
                  } else if (mode === "NAMED" && activeSublayerIds !== undefined && activeSublayerIds.length < allLayers.length) {
                    // Jika pengguna memilih sebagian sublayer dalam mode NAMED
                    const selectedList = allLayers.filter((l) => activeSublayerIds.includes(l.id || l.layer_id));
                    if (selectedList.length === 0) return null;
                    layersParam = selectedList
                      .map((l) => `${l.workspace_name || group.workspace_name}:${l.geoserver_name}`)
                      .join(",");
                  }

                  if (!layersParam) return null;

                  return (
                    <WMSTileLayer
                      key={`group-${group.id}-${groupTs}-${layersParam}`}
                      url={group.wms_url}
                      zIndex={50}
                      params={{
                        layers: layersParam,
                        format: "image/png",
                        transparent: true,
                        version: "1.1.1",
                        _t: groupTs || undefined,
                      }}
                      opacity={1}
                    />
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Upload Layer */}
      <LayerModal
        open={openLayerModal}
        onClose={() => setOpenLayerModal(false)}
        onSuccess={() => {
          setPage(1);
          queryClient.invalidateQueries({ queryKey: ["layers"] });
          queryClient.refetchQueries({ queryKey: ["layers"] });
          queryClient.invalidateQueries({ queryKey: ["layer-groups"] });
        }}
        page={page}
        pageSize={pageSize}
      />

      {/* Modal Custom Style SLD */}
      <LayerStyleModal
        open={Boolean(stylingLayer)}
        onClose={() => setStylingLayer(null)}
        layer={stylingLayer}
        onStyleApplied={handleStyleApplied}
      />

      {/* Modal Buat Layer Group dari Checklist */}
      <LayerGroupModal
        open={openGroupModal}
        onClose={() => setOpenGroupModal(false)}
        selectedLayerIds={checkedLayerIds}
        allLayers={layers}
        onSuccess={() => {
          setCheckedLayerIds([]);
          setActiveTab("groups");
        }}
      />

      {/* Modal Edit Layer Group (lihat layer, ubah urutan, tambah/hapus anggota) */}
      <LayerGroupEditModal
        open={Boolean(editingGroupId)}
        groupId={editingGroupId}
        allLayers={rawLayers}
        onClose={() => setEditingGroupId(null)}
        onSuccess={(updatedGid) => {
          const targetId = updatedGid || editingGroupId;
          setEditingGroupId(null);
          // Set cache-busting timestamp agar WMS tile langsung me-refresh secara instan di peta
          setGroupSettings((prev) => ({
            ...prev,
            [targetId]: {
              ...prev[targetId],
              visible: true,
              updatedAt: Date.now(),
            },
          }));
          queryClient.invalidateQueries({ queryKey: ["layer-groups"] });
        }}
      />
    </div>
  );
};

export default Layer;
