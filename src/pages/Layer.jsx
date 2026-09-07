import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, WMSTileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import proj4 from "proj4";
import {
  Eye,
  EyeOff,
  Layers,
  Plus,
  Sliders,
  Search,
  Image as ImageIcon,
  Info,
  ChevronUp,
  CheckCircle2,
  Navigation2,
  Palette,
  Folder,
  Trash2,
} from "lucide-react";
import LayerModal from "../components/LayerModal";
import LayerStyleModal from "../components/LayerStyleModal";
import { Button, Spin, Pagination, Popconfirm, message } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import layerApi from "../api/LayerApi";

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// --- Konfigurasi tampilan GeoTIFF ------------------------------------------

const GEOTIFF_CONFIG = {
  icon: <ImageIcon className="w-4 h-4" />,
  bgColor: "bg-amber-100",
  textColor: "text-amber-700",
  borderColor: "border-amber-200",
  badgeBg: "bg-amber-100",
  badgeText: "text-amber-700",
  dotColor: "bg-amber-400",
  label: "GeoTIFF",
};

const getTypeConfig = () => GEOTIFF_CONFIG;

// --- Helper: konversi bbox ke WGS84 berdasarkan EPSG apapun ---------------

// Cache definisi proj4 agar tidak fetch berkali-kali untuk EPSG yang sama
const epsgCache = {};

async function bboxToWGS84(bbox, epsg) {
  const [minx, miny, maxx, maxy] = bbox;

  if (epsg === 4326 || epsg === "4326") {
    return { minLng: minx, minLat: miny, maxLng: maxx, maxLat: maxy };
  }

  if (!epsgCache[epsg]) {
    try {
      const res = await fetch(`https://epsg.io/${epsg}.proj4`);
      if (!res.ok) throw new Error(`EPSG:${epsg} tidak ditemukan`);
      epsgCache[epsg] = await res.text();
    } catch (e) {
      console.warn(`Gagal mengambil definisi EPSG:${epsg}:`, e);
      return { minLng: minx, minLat: miny, maxLng: maxx, maxLat: maxy };
    }
  }

  proj4.defs(`EPSG:${epsg}`, epsgCache[epsg]);

  const [minLng, minLat] = proj4(`EPSG:${epsg}`, "EPSG:4326", [minx, miny]);
  const [maxLng, maxLat] = proj4(`EPSG:${epsg}`, "EPSG:4326", [maxx, maxy]);

  return { minLng, minLat, maxLng, maxLat };
}

// --- Komponen kontrol peta (fly-to saat layer dipilih) ---------------------

/**
 * Komponen ini berada DALAM MapContainer sehingga bisa menggunakan useMap().
 * Ketika selectedLayer berubah dan memiliki bbox, peta akan terbang ke lokasi layer.
 * Mendukung EPSG apapun — koordinat dikonversi ke WGS84 secara otomatis.
 */
const MapFlyController = ({ selectedLayer }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedLayer?.bbox) return;

    const epsg = selectedLayer.epsg ?? 4326;
    const bbox = selectedLayer.bbox;

    // Validasi nilai bbox tidak kosong / NaN
    if (!Array.isArray(bbox) || bbox.some((v) => v == null || isNaN(v))) return;

    bboxToWGS84(bbox, epsg).then(({ minLng, minLat, maxLng, maxLat }) => {
      if ([minLng, minLat, maxLng, maxLat].some((v) => isNaN(v))) return;

      if (minLng === maxLng && minLat === maxLat) {
        // Titik tunggal
        map.flyTo([minLat, minLng], 14, { duration: 1.2 });
      } else {
        // Area bbox
        map.flyToBounds(
          [[minLat, minLng], [maxLat, maxLng]],
          { duration: 1.2, padding: [40, 40], maxZoom: 16 }
        );
      }
    });
  }, [selectedLayer?.id]); // trigger hanya saat ID layer berubah

  return null;
};

// --- Kartu Layer ------------------------------------------------------------

const LayerCard = ({ layer, isSelected, onSelect, onToggleVisibility, onOpacityChange, onOpenStyle, onDelete }) => {
  const [showDetail, setShowDetail] = useState(false);
  const cfg = getTypeConfig(layer.data_type);

  return (
    <div
      onClick={() => onSelect(layer.id)}
      className={`rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        isSelected
          ? "border-blue-500 shadow-md shadow-blue-100 ring-1 ring-blue-400/30"
          : "border-slate-200 hover:border-slate-300 hover:shadow-sm bg-white"
      }`}
    >
      {/* Garis warna atas */}
      <div className={`h-1 w-full ${cfg.dotColor}`} />

      <div className="p-4 bg-white">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {/* Ikon tipe */}
            <div className={`p-2 rounded-lg flex-shrink-0 ${cfg.bgColor} ${cfg.textColor}`}>
              {cfg.icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800 text-sm truncate">{layer.layer_name}</h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {/* Badge Workspace */}
                {(layer.workspace_display_name || layer.workspace_name) && (
                  <span
                    className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 max-w-[130px] truncate"
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
                    <CheckCircle2 className="w-3 h-3" /> Published
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Tombol aksi */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Fly-to indicator saat dipilih */}
            {isSelected && layer.bbox && (
              <span title="Peta berpindah ke lokasi layer ini" className="p-1.5 text-blue-500">
                <Navigation2 className="w-3.5 h-3.5" />
              </span>
            )}
            {/* Style palette toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); onOpenStyle?.(layer); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
              title="Atur Warna & Simbologi Layer"
            >
              <Palette className="w-4 h-4" />
            </button>
            {/* Detail toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); setShowDetail((p) => !p); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Detail"
            >
              {showDetail ? <ChevronUp className="w-4 h-4" /> : <Info className="w-4 h-4" />}
            </button>
            {/* Visibility toggle */}
            <button
              onClick={(e) => { e.stopPropagation(); onToggleVisibility(layer.id); }}
              className={`p-1.5 rounded-lg transition ${
                layer.visible ? "text-blue-600 hover:bg-blue-50" : "text-slate-400 hover:bg-slate-100"
              }`}
              title={layer.visible ? "Sembunyikan Layer" : "Tampilkan Layer"}
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

        {/* Panel detail (collapsible) */}
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
              <InfoRow label="Dimensi" value={`${layer.width} � ${layer.height} px`} />
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

        {/* Opacity slider */}
        {layer.visible && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-3">
            <Sliders className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="text-[11px] text-slate-500 font-medium w-12 flex-shrink-0">Opacity</span>
            <input
              type="range"
              min="0.05"
              max="1"
              step="0.05"
              value={layer.opacity}
              onChange={(e) => onOpacityChange(layer.id, e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 accent-blue-600 h-1.5 rounded-full cursor-pointer"
            />
            <span className="text-[11px] font-mono text-slate-600 w-8 text-right flex-shrink-0">
              {Math.round(layer.opacity * 100)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div>
    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
    <p className="text-xs text-slate-700 mt-0.5 truncate">{value ?? "�"}</p>
  </div>
);

// --- Halaman Utama -----------------------------------------------------------

const Layer = () => {
  const [open, setOpen] = useState(false);
  const [stylingLayer, setStylingLayer] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [layerSettings, setLayerSettings] = useState({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id) => layerApi.delete(id),
    onSuccess: (res) => {
      message.success(res?.data?.detail || "Layer berhasil dihapus!");
      queryClient.invalidateQueries({ queryKey: ["layers"] });
    },
    onError: (err) => {
      message.error(err.response?.data?.detail || "Gagal menghapus layer");
    },
  });

  const handleStyleApplied = (layerId) => {
    // Pastikan layer terlihat dan perbarui timestamp agar WMS tile langsung refetch
    setLayerSettings((prev) => ({
      ...prev,
      [layerId]: {
        ...prev[layerId],
        visible: true,
        styleUpdatedAt: Date.now(),
      },
    }));
  };

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["layers", page, pageSize],
    queryFn: () => layerApi.list({ page, size: pageSize }),
  });

  const rawLayers = responseData?.data?.data || [];
  const pagination = responseData?.data?.pagination;

  const layers = useMemo(
    () =>
      rawLayers.map((l) => ({
        ...l,
        visible: layerSettings[l.id]?.visible ?? false,  // default: tersembunyi
        opacity: layerSettings[l.id]?.opacity ?? 0.8,
      })),
    [rawLayers, layerSettings]
  );

  // Layer yang sedang dipilih (untuk fly-to)
  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId) ?? null,
    [layers, selectedLayerId]
  );

  const toggleVisibility = (id) => {
    setLayerSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: !(prev[id]?.visible ?? false) },
    }));
  };

  // Klik kartu layer: tampilkan layer + fly-to lokasinya
  const handleSelectLayer = (id) => {
    setSelectedLayerId(id);
    // Aktifkan visibility layer yang diklik jika belum terlihat
    setLayerSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], visible: true },
    }));
  };

  const handleOpacityChange = (id, value) => {
    setLayerSettings((prev) => ({
      ...prev,
      [id]: { ...prev[id], opacity: parseFloat(value) },
    }));
  };

  const filteredLayers = layers.filter((layer) =>
    layer.layer_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleCount = layers.filter((l) => l.visible).length;

  return (
    <div className="p-6 bg-slate-50 min-h-[calc(100vh-64px)] font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Layers className="w-7 h-7 text-blue-600" />
            Layer Management &amp; Preview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola, atur transparansi, dan pratinjau layer GIS secara realtime via GeoServer WMS.
            Klik layer untuk melihat lokasinya di peta.
          </p>
        </div>
        <Button
          onClick={() => setOpen(true)}
          type="primary"
          icon={<Plus className="w-4 h-4" />}
          className="flex items-center gap-1.5"
        >
          Tambah Layer Baru
        </Button>
      </div>

      {/* Stat chip - GeoTIFF only */}
      {/* <div className="flex flex-wrap gap-3 mb-5">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${GEOTIFF_CONFIG.badgeBg} ${GEOTIFF_CONFIG.badgeText} ${GEOTIFF_CONFIG.borderColor}`}>
          {GEOTIFF_CONFIG.icon}
          <span>{GEOTIFF_CONFIG.label}</span>
          <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/60 ${GEOTIFF_CONFIG.textColor}`}>
            {layers.length}
          </span>
        </div>
      </div> */}

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Layer List */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Search */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Cari nama layer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Hint fly-to */}
            <div className="px-4 pt-3 pb-0 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Navigation2 className="w-3 h-3" />
              <span>Klik kartu layer untuk berpindah ke lokasinya di peta</span>
            </div>

            {/* List */}
            <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-10"><Spin tip="Memuat daftar layer..." /></div>
              ) : filteredLayers.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Layers className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Tidak ada layer ditemukan</p>
                  <p className="text-xs mt-1">Klik "Tambah Layer Baru" untuk mengunggah file GIS</p>
                </div>
              ) : (
                filteredLayers.map((layer) => (
                  <LayerCard
                    key={layer.id}
                    layer={layer}
                    isSelected={selectedLayerId === layer.id}
                    onSelect={handleSelectLayer}
                    onToggleVisibility={toggleVisibility}
                    onOpacityChange={handleOpacityChange}
                    onOpenStyle={setStylingLayer}
                    onDelete={(id) => deleteMutation.mutate(id)}
                  />
                ))
              )}

              {pagination && pagination.total > 0 && (
                <div className="flex justify-center mt-4 pb-1">
                  <Pagination
                    current={pagination.page}
                    pageSize={pagination.size}
                    total={pagination.total}
                    showSizeChanger
                    pageSizeOptions={["3", "6", "12"]}
                    size="small"
                    showTotal={(total) => `${total} layer`}
                    onChange={(newPage, newPageSize) => {
                      setPage(newPage);
                      setPageSize(newPageSize);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Peta */}
        <div className="lg:col-span-7">
          <div
            className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col"
            style={{ height: 580 }}
          >
            {/* Map header */}
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white z-10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Live Preview Engine
                </span>
                {/* Nama layer yang sedang difokuskan */}
                {selectedLayer && (
                  <span className="text-[11px] text-blue-600 font-medium flex items-center gap-1 ml-1">
                    <Navigation2 className="w-3 h-3" />
                    {selectedLayer.layer_name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  {layers.filter((l) => l.visible).slice(0, 3).map((l) => {
                    const cfg = getTypeConfig(l.data_type);
                    return (
                      <span key={l.id} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}>
                        {l.layer_name}
                      </span>
                    );
                  })}
                  {visibleCount > 3 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-500">
                      +{visibleCount - 3}
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-400">{visibleCount}/{layers.length} aktif</span>
              </div>
            </div>

            {/* Map Canvas */}
            <div className="flex-1 relative z-0">
              <MapContainer
                center={[-2.5, 118.0]}
                zoom={5}
                scrollWheelZoom
                className="w-full h-full"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Controller fly-to � harus di dalam MapContainer */}
                <MapFlyController selectedLayer={selectedLayer} />

                {/* WMS layers */}
                {layers.map((layer) => {
                  if (!layer.visible || !layer.wms_url) return null;
                  return (
                    <WMSTileLayer
                      key={`${layer.id}-${layer.opacity}-${layerSettings[layer.id]?.styleUpdatedAt || 0}`}
                      url={layer.wms_url}
                      params={{
                        layers: `${layer.workspace_name}:${layer.geoserver_name}`,
                        format: "image/png",
                        transparent: true,
                        version: "1.1.1",
                        _t: layerSettings[layer.id]?.styleUpdatedAt || undefined,
                      }}
                      opacity={layer.opacity}
                    />
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Modal upload */}
      <LayerModal
        open={open}
        onClose={() => setOpen(false)}
        page={page}
        pageSize={pageSize}
      />

      {/* Modal Kustomisasi Gaya & Warna SLD */}
      <LayerStyleModal
        open={Boolean(stylingLayer)}
        onClose={() => setStylingLayer(null)}
        layer={stylingLayer}
        onStyleApplied={handleStyleApplied}
      />
    </div>
  );
};

export default Layer;
