import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, WMSTileLayer, ZoomControl } from "react-leaflet";
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
  ChevronLeft,
  ChevronRight,
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
import MapLegend from "../components/layer/MapLegend";
import AccessDeniedCard from "../components/AccessDeniedCard";
import PageHeader from "../components/PageHeader";
import { useLanguage } from "../context/LanguageContext";
import { BASE_LAYERS } from "../constants/layers";
import LayerBaseControl from "../components/layer/LayerBaseControl";

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
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);

  // Base layer state
  const [activeBaseLayer, setActiveBaseLayer] = useState(() => {
    try {
      return localStorage.getItem("astragis_base_layer") || "osm";
    } catch {
      return "osm";
    }
  });

  const handleSelectBaseLayer = (layerId) => {
    setActiveBaseLayer(layerId);
    try {
      localStorage.setItem("astragis_base_layer", layerId);
    } catch (e) {
      console.warn("Failed to save base layer preference", e);
    }
  };

  const currentBaseLayer = BASE_LAYERS[activeBaseLayer] || BASE_LAYERS.osm;

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
        styleUpdatedAt: layerSettings[l.id]?.styleUpdatedAt,
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
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden font-sans">
      {/* ── 1. FULLSCREEN MAP CANVAS ────────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full z-0">
        <MapContainer
          zoomControl={false}
          center={[-2.5, 118.0]}
          zoom={5}
          minZoom={3}
          maxZoom={18}
          maxBounds={[[-85, -180], [85, 180]]}
          maxBoundsViscosity={0.9}
          scrollWheelZoom
          className="w-full h-full"
        >
          <ZoomControl position="topright" />

          <TileLayer
            key={currentBaseLayer.id}
            attribution={currentBaseLayer.attribution}
            url={currentBaseLayer.url}
            maxZoom={currentBaseLayer.maxZoom || 19}
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

        {/* Interactive Base Layer Switcher (Standar, Satelit, Medan) */}
        <LayerBaseControl
          activeLayer={activeBaseLayer}
          onSelectLayer={handleSelectBaseLayer}
        />

        {/* Dynamic Map Legend Overlay */}
        <MapLegend
          activeLayers={layers.filter((l) => l.visible)}
          activeGroups={layerGroups.filter((g) => g.visible)}
        />
      </div>

      {/* ── 2. TOP RIGHT FLOATING ENGINE STATUS ───────────────────────────── */}
      <div className="absolute top-3.5 right-14 z-[400] hidden sm:flex items-center gap-2.5 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-lg border border-slate-200/80 pointer-events-auto">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 font-mono">
          {t('wmsLiveEngine', 'WMS Engine')}
        </span>
        {visibleLayerCount > 0 && (
          <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            {visibleLayerCount} {t('activeLayersCount', 'Active')}
          </span>
        )}
        {selectedLayer && (
          <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 truncate max-w-[150px]">
            <Navigation2 className="w-3 h-3 flex-shrink-0" />
            {selectedLayer.display_name || selectedLayer.layer_name}
          </span>
        )}
      </div>

      {/* ── 3. FLOATING COLLAPSIBLE LAYER & GROUP PANEL ───────────────────── */}
      {isPanelCollapsed ? (
        // Mode Terlipat (Compact Floating Pill Button)
        <div className="absolute top-3.5 left-3.5 z-[1000] animate-in fade-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={() => setIsPanelCollapsed(false)}
            className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white/95 hover:bg-white backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl cursor-pointer transition-all hover:scale-102 group"
          >
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="text-xs font-bold text-slate-800 block">
                {t('layerPageTitle', 'Layer & Group')}
              </span>
              <span className="text-[10px] text-slate-400 block font-mono">
                {layers.length} Layers • {layerGroups.length} Groups
              </span>
            </div>
            {visibleLayerCount > 0 && (
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">
                {visibleLayerCount} Aktif
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 ml-0.5 transition-transform" />
          </button>
        </div>
      ) : (
        // Mode Terbuka (Floating Panel Drawer Card)
        <div
          className="absolute top-3.5 left-3.5 z-[1000] w-[370px] sm:w-[430px] max-w-[calc(100vw-28px)] max-h-[calc(100vh-88px)] flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in fade-in slide-in-from-left-4 duration-200 pointer-events-auto"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Header Panel Mengambang */}
          <div className="p-3 bg-gradient-to-r from-slate-50 to-blue-50/20 border-b border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-800 leading-tight">
                  {t('layerPageTitle', 'Layer & Group Management')}
                </h2>
                <span className="text-[10px] text-slate-400 block">
                  {layers.length} Layers • {layerGroups.length} Groups ({visibleLayerCount} Aktif)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="small"
                type="primary"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setOpenLayerModal(true)}
                className="!text-[11px] !bg-blue-600 hover:!bg-blue-500 !h-7 !px-2 rounded-lg font-medium"
              >
                {t('addNewLayer', 'Add Layer')}
              </Button>

              <button
                type="button"
                onClick={() => setIsPanelCollapsed(true)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition cursor-pointer"
                title={t('collapsePanel', 'Ciutkan Panel')}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tab Navigation: Single Layers vs Layer Groups */}
          <div className="px-3 pt-1.5 border-b border-slate-100 bg-white shrink-0">
            <Tabs
              activeKey={activeTab}
              onChange={setActiveTab}
              items={[
                {
                  key: "layers",
                  label: (
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      {t('tabSingleLayers', 'Single Layers')}
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full font-bold">
                        {layers.length}
                      </span>
                    </span>
                  ),
                },
                {
                  key: "groups",
                  label: (
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      {t('tabLayerGroups', 'Layer Groups')}
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-full font-bold">
                        {layerGroups.length}
                      </span>
                    </span>
                  ),
                },
              ]}
            />
          </div>

          {/* Filter & Search Toolbar */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 flex gap-2 shrink-0">
            <Select
              allowClear
              placeholder={t('allWorkspaces', 'All Workspaces')}
              value={selectedWorkspaceId}
              onChange={(val) => {
                setSelectedWorkspaceId(val || null);
                setPage(1);
              }}
              className="w-32 sm:w-36 text-xs shrink-0"
              size="small"
            >
              {userWorkspaces.map((ws) => (
                <Select.Option key={ws.id || ws.ws_name} value={String(ws.id || ws.ws_name)}>
                  {ws.display_name || ws.name || ws.id}
                </Select.Option>
              ))}
            </Select>

            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder={
                  activeTab === "layers"
                    ? t('searchLayerPlaceholder', 'Search layer...')
                    : t('searchGroupPlaceholder', 'Search group...')
                }
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-8 pr-3 py-1 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* TAB CONTENT: Single Layers */}
          {activeTab === "layers" && (
            <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
              {/* Floating Checklist Toolbar when layers are selected */}
              <div className="px-3 py-1.5 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600 shrink-0">
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
                <div className="mx-2.5 mt-2 p-2 bg-indigo-50 border border-indigo-200/80 rounded-xl flex items-center justify-between gap-1.5 animate-in fade-in duration-200 flex-wrap shrink-0">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-900">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{t('layersCountSelected', '{count} layers selected', { count: checkedLayerIds.length })}</span>
                  </div>
                  <div className="flex items-center gap-1 flex-wrap">
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
                        icon={<Trash2 className="w-3 h-3" />}
                        className="!text-xs !font-medium"
                      >
                        {t('deleteSelected', `Hapus (${checkedLayerIds.length})`)}
                      </Button>
                    </Popconfirm>

                    <button
                      onClick={() => setCheckedLayerIds([])}
                      disabled={isBatchDeleting}
                      className="text-xs text-slate-500 hover:text-slate-700 px-1.5 py-0.5 disabled:opacity-50"
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
                <div className="p-2.5 space-y-2">
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
            </div>
          )}

          {/* TAB CONTENT: Layer Group */}
          {activeTab === "groups" && (
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-2">
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[11px] text-slate-400">
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
      )}

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
