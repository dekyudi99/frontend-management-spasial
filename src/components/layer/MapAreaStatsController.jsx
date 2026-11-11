import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useMap, useMapEvents, Polygon, Polyline, CircleMarker } from "react-leaflet";
import {
  Card,
  Button,
  Select,
  Spin,
  Typography,
  message,
  Tag,
  Tooltip,
  Segmented,
} from "antd";
import {
  BarChart2,
  Download,
  X,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  PenTool,
  Check,
} from "lucide-react";
import layerApi from "../../api/LayerApi";
import {
  isRasterLayer,
  formatRasterValue,
  validateBoundingBox,
} from "../../utils/rasterUtils";
import { extractApiError } from "../../utils/wfsUtils";
import { useLanguage } from "../../context/LanguageContext";

const { Text } = Typography;

const MapAreaStatsController = ({
  isActive,
  onDeactivate,
  layers,
}) => {
  const map = useMap();
  const { t } = useLanguage();

  // State drawing poligon bebas
  const [isDrawing, setIsDrawing] = useState(false);
  const [polygonPoints, setPolygonPoints] = useState([]); // array of [lat, lng]
  const [mouseLatLng, setMouseLatLng] = useState(null);

  // Area aktif yang telah selesai digambar
  const [activeBbox, setActiveBbox] = useState(null); // [minLng, minLat, maxLng, maxLat]
  const [activePolygon, setActivePolygon] = useState(null); // array of [lat, lng]

  // Format unduhan: styled (RGB) vs raw (data asli)
  const [clipStyled, setClipStyled] = useState(true);

  // Stats & download state
  const [selectedLayerId, setSelectedLayerId] = useState(null);
  const [selectedBand, setSelectedBand] = useState(1);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statsData, setStatsData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const abortControllerRef = useRef(null);
  const clipAbortRef = useRef(null);
  const cardRef = useRef(null);

  // Ambil semua layer raster yang saat ini visible
  const visibleRasters = useMemo(() => {
    if (!Array.isArray(layers)) return [];
    return layers.filter((l) => l && l.visible && isRasterLayer(l));
  }, [layers]);

  // Set default selected layer saat visible rasters berubah atau saat activeBbox dibuat
  useEffect(() => {
    if (visibleRasters.length > 0) {
      if (activeBbox) {
        const intersecting = visibleRasters.find((r) => {
          const b = r.bbox || r.bounds;
          if (!b) return false;
          const minLng2 = b[0] !== undefined ? b[0] : (b.minx ?? b.left);
          const minLat2 = b[1] !== undefined ? b[1] : (b.miny ?? b.bottom);
          const maxLng2 = b[2] !== undefined ? b[2] : (b.maxx ?? b.right);
          const maxLat2 = b[3] !== undefined ? b[3] : (b.maxy ?? b.top);
          return !(
            activeBbox[2] < minLng2 ||
            activeBbox[0] > maxLng2 ||
            activeBbox[3] < minLat2 ||
            activeBbox[1] > maxLat2
          );
        });
        if (intersecting) {
          setSelectedLayerId(intersecting.id);
          return;
        }
      }

      if (!selectedLayerId || !visibleRasters.some((r) => r.id === selectedLayerId)) {
        setSelectedLayerId(visibleRasters[0].id);
      }
    } else {
      setSelectedLayerId(null);
    }
  }, [visibleRasters, selectedLayerId, activeBbox]);

  // Nonaktifkan map drag & double click zoom saat drawing aktif
  useEffect(() => {
    const container = map.getContainer();
    if (isActive) {
      container.style.cursor = "crosshair";
      map.dragging.disable();
      map.doubleClickZoom.disable();
      setIsDrawing(true);
      setPolygonPoints([]);
      setMouseLatLng(null);
    } else {
      container.style.cursor = "";
      map.dragging.enable();
      map.doubleClickZoom.enable();
      setIsDrawing(false);
      setPolygonPoints([]);
      setMouseLatLng(null);
    }
    return () => {
      container.style.cursor = "";
      map.dragging.enable();
      map.doubleClickZoom.enable();
    };
  }, [isActive, map]);

  // Selesaikan poligon dan hitung bounding box-nya
  const finalizePolygon = useCallback((pts) => {
    if (!pts || pts.length < 3) return;
    const lats = pts.map((p) => p[0]);
    const lngs = pts.map((p) => p[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    if (Math.abs(maxLat - minLat) > 1e-5 && Math.abs(maxLng - minLng) > 1e-5) {
      const cleanBbox = [minLng, minLat, maxLng, maxLat];
      setActiveBbox(cleanBbox);
      setActivePolygon(pts);
      setPolygonPoints([]);
      setMouseLatLng(null);
      setIsDrawing(false);
      map.dragging.enable();
      map.doubleClickZoom.enable();
      map.getContainer().style.cursor = "";
      onDeactivate?.();
    }
  }, [map, onDeactivate]);

  // Escape key untuk membatalkan drawing atau menutup panel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (isDrawing || isActive) {
          if (abortControllerRef.current) abortControllerRef.current.abort();
          setIsDrawing(false);
          setPolygonPoints([]);
          setMouseLatLng(null);
          map.dragging.enable();
          map.doubleClickZoom.enable();
          map.getContainer().style.cursor = "";
          if (!activeBbox) {
            onDeactivate?.();
          }
        } else if (activeBbox) {
          setActiveBbox(null);
          setActivePolygon(null);
          setStatsData(null);
          setErrorMsg(null);
          onDeactivate?.();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDrawing, isActive, activeBbox, onDeactivate, map]);

  // Map mouse events untuk drawing poligon Leaflet murni
  useMapEvents({
    mousemove: (e) => {
      if (!isActive && !isDrawing) return;
      const { lat, lng } = e.latlng;
      setMouseLatLng([lat, lng]);
    },
    click: (e) => {
      if (!isActive && !isDrawing) return;
      const { lat, lng } = e.latlng;
      const clickPx = map.latLngToContainerPoint([lat, lng]);

      // Cek apakah poligon sudah memiliki minimal 3 titik untuk penutupan
      if (polygonPoints.length >= 3) {
        // 1. Cek jika klik kembali titik terakhir (titik yang sama persis / sangat dekat di layar < 15px)
        const lastPt = polygonPoints[polygonPoints.length - 1];
        const lastPx = map.latLngToContainerPoint(lastPt);
        const distLast = Math.hypot(clickPx.x - lastPx.x, clickPx.y - lastPx.y);
        if (distLast < 15) {
          finalizePolygon(polygonPoints);
          return;
        }

        // 2. Cek jika klik titik awal (menutup loop poligon di titik awal < 20px)
        const firstPt = polygonPoints[0];
        const firstPx = map.latLngToContainerPoint(firstPt);
        const distFirst = Math.hypot(clickPx.x - firstPx.x, clickPx.y - firstPx.y);
        if (distFirst < 20) {
          finalizePolygon(polygonPoints);
          return;
        }
      }

      // Cegah accidental click jitter jika klik terlalu dekat dengan titik terakhir (< 8px)
      if (polygonPoints.length > 0) {
        const lastPt = polygonPoints[polygonPoints.length - 1];
        const lastPx = map.latLngToContainerPoint(lastPt);
        const distLast = Math.hypot(clickPx.x - lastPx.x, clickPx.y - lastPx.y);
        if (distLast < 8) {
          return;
        }
      }

      setPolygonPoints((prev) => [...prev, [lat, lng]]);
    },
    dblclick: (e) => {
      if (!isActive && !isDrawing) return;
      if (polygonPoints.length >= 3) {
        finalizePolygon(polygonPoints);
      }
    },
  });

  // Mencegah klik di dalam floating card merembes ke map
  useEffect(() => {
    if (!cardRef.current) return;
    const el = cardRef.current;
    import("leaflet").then((L) => {
      if (L?.DomEvent) {
        L.DomEvent.disableClickPropagation(el);
        L.DomEvent.disableScrollPropagation(el);
      }
    });
  }, [activeBbox]);

  // Request statistik raster via WCS ke backend
  const fetchStats = useCallback(async () => {
    if (!activeBbox || !selectedLayerId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setErrorMsg(null);
    setStatsData(null);

    try {
      const data = await layerApi.rasterStats(
        selectedLayerId,
        {
          bbox: activeBbox,
          band: selectedBand,
          bins: 20,
        },
        signal
      );
      if (!signal.aborted) {
        setStatsData(data);
      }
    } catch (err) {
      if (err.name !== "CanceledError" && err.name !== "AbortError" && !signal.aborted) {
        setErrorMsg(extractApiError(err) || t('statsFailed', 'Gagal menghitung statistik area raster.'));
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [activeBbox, selectedLayerId, selectedBand, t]);

  useEffect(() => {
    if (activeBbox && selectedLayerId) {
      fetchStats();
    }
  }, [activeBbox, selectedLayerId, selectedBand, fetchStats]);

  // Handler unduh GeoTIFF hasil clip (Styled RGB atau Raw Data)
  const handleDownloadClip = async () => {
    if (!activeBbox || !selectedLayerId) return;

    const currentLayer = visibleRasters.find((r) => r.id === selectedLayerId);
    const layerName = currentLayer?.layer_name || currentLayer?.display_name || "raster";
    const modeSuffix = clipStyled ? "styled" : "raw";
    const filename = `${layerName}_clip_${modeSuffix}.tif`;

    if (clipAbortRef.current) clipAbortRef.current.abort();
    clipAbortRef.current = new AbortController();

    setDownloading(true);
    try {
      const payload = {
        bbox: activeBbox,
        styled: clipStyled,
      };

      if (activePolygon && activePolygon.length >= 3) {
        // Konversi [lat, lng] -> [lng, lat] GeoJSON format
        payload.mask_polygon = activePolygon.map(([lat, lng]) => [lng, lat]);
      }

      await layerApi.clipRaster(
        selectedLayerId,
        payload,
        filename,
        clipAbortRef.current.signal
      );
      message.success(t('downloadSuccess', `GeoTIFF '${filename}' berhasil diunduh.`));
    } catch (err) {
      message.error(extractApiError(err) || t('downloadFailed', 'Gagal mengunduh GeoTIFF terpotong.'));
    } finally {
      setDownloading(false);
    }
  };

  const handleClose = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    if (clipAbortRef.current) clipAbortRef.current.abort();
    setActiveBbox(null);
    setActivePolygon(null);
    setStatsData(null);
    setErrorMsg(null);
    setIsDrawing(false);
    setPolygonPoints([]);
    setMouseLatLng(null);
    map.dragging.enable();
    map.doubleClickZoom.enable();
    map.getContainer().style.cursor = "";
    onDeactivate?.();
  };

  // Mulai gambar poligon baru langsung dari floating panel
  const handleStartRedraw = () => {
    setActiveBbox(null);
    setActivePolygon(null);
    setStatsData(null);
    setErrorMsg(null);
    setPolygonPoints([]);
    setMouseLatLng(null);
    setIsDrawing(true);
    map.dragging.disable();
    map.doubleClickZoom.disable();
    map.getContainer().style.cursor = "crosshair";
  };

  const selectedLayerObj = useMemo(
    () => visibleRasters.find((r) => r.id === selectedLayerId),
    [visibleRasters, selectedLayerId]
  );

  return (
    <>
      {/* 1. Visualisasi saat user sedang menggambar poligon (garis terbuka, belum tertutup) */}
      {isDrawing && polygonPoints.length > 0 && (
        <>
          {/* Garis solid menghubungkan titik-titik yang sudah diklik */}
          <Polyline
            positions={polygonPoints}
            pathOptions={{
              color: "#0284c7",
              weight: 3,
            }}
          />
          {/* Garis putus-putus interaktif dari titik terakhir ke posisi kursor mouse */}
          {mouseLatLng && (
            <Polyline
              positions={[polygonPoints[polygonPoints.length - 1], mouseLatLng]}
              pathOptions={{
                color: "#0284c7",
                weight: 2,
                dashArray: "4, 4",
              }}
            />
          )}
          {/* Titik-titik sudut yang telah dibuat */}
          {polygonPoints.map((pt, idx) => (
            <CircleMarker
              key={idx}
              center={pt}
              radius={idx === 0 ? 6 : 4}
              pathOptions={{
                color: idx === 0 ? "#059669" : "#0284c7",
                fillColor: idx === 0 ? "#10b981" : "#ffffff",
                fillOpacity: 1,
                weight: 2,
              }}
            />
          ))}
        </>
      )}

      {/* 2. Visualisasi area aktif: Poligon Bebas */}
      {activePolygon && activePolygon.length >= 3 && (
        <Polygon
          positions={activePolygon}
          pathOptions={{
            color: "#0891b2",
            weight: 2.5,
            fillColor: "#06b6d4",
            fillOpacity: 0.2,
          }}
        />
      )}

      {/* 3. Banner petunjuk saat mode Poligon aktif di atas peta */}
      {isDrawing &&
        createPortal(
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[2000] pointer-events-auto bg-slate-900/90 text-white backdrop-blur-md px-4 py-2 rounded-full shadow-xl border border-slate-700 flex items-center gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-150">
            <span className="flex items-center gap-1.5 font-medium">
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              {polygonPoints.length >= 3
                ? t('polygonCloseTip', "Klik titik yang sama atau titik awal untuk menutup poligon")
                : t('polygonDrawTip', "Klik di peta untuk membentuk titik sudut poligon")}
            </span>
            {polygonPoints.length >= 3 && (
              <Button
                type="primary"
                size="small"
                icon={<Check className="w-3 h-3" />}
                className="bg-cyan-600 hover:bg-cyan-500 text-xs h-6 px-2.5 rounded-full"
                onClick={() => finalizePolygon(polygonPoints)}
              >
                {t('finishPolygon', 'Selesai')}
              </Button>
            )}
            <button
              type="button"
              className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer transition"
              onClick={() => {
                setIsDrawing(false);
                setPolygonPoints([]);
                setMouseLatLng(null);
                map.dragging.enable();
                map.doubleClickZoom.enable();
                map.getContainer().style.cursor = "";
                if (!activeBbox) onDeactivate?.();
              }}
              title="Batal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>,
          document.body
        )}

      {/* 4. Floating Card Hasil Statistik Area & Clip (Dirender via Portal ke document.body) */}
      {activeBbox &&
        !isDrawing &&
        createPortal(
          <div
            ref={cardRef}
            className="fixed bottom-6 right-4 z-[2000] pointer-events-auto max-w-md w-96 animate-in fade-in slide-in-from-bottom-4 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <Card
              size="small"
              className="shadow-2xl border border-cyan-300 bg-white/95 backdrop-blur-md rounded-xl overflow-hidden"
              styles={{ body: { padding: "12px 16px" } }}
            >
              {/* Header Card */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2.5">
                <div className="flex items-center gap-1.5 truncate">
                  <BarChart2 className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span className="font-semibold text-xs text-slate-800 truncate">
                    {t('areaStatistics', 'Draw Area (Clip & Stats)')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Tooltip title={t('drawNewArea', 'Gambar Area Baru')}>
                    <button
                      type="button"
                      onClick={handleStartRedraw}
                      className="text-cyan-600 hover:text-cyan-700 bg-cyan-50 hover:bg-cyan-100 p-1 rounded-md transition cursor-pointer flex items-center gap-1 text-[11px] font-medium"
                    >
                      <PenTool className="w-3 h-3" />
                      <span>{t('drawNewArea', 'Draw Area')}</span>
                    </button>
                  </Tooltip>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-slate-400 hover:text-slate-600 p-1 rounded transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Info Layer Aktif (Bukan Dropdown) */}
              <div className="flex items-center justify-between gap-2 mb-2.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                  <span
                    className="font-semibold text-xs text-slate-800 truncate"
                    title={selectedLayerObj?.layer_name}
                  >
                    {selectedLayerObj?.display_name ||
                      selectedLayerObj?.layer_name ||
                      selectedLayerObj?.store_name ||
                      "Raster Layer"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {selectedLayerObj?.bands && selectedLayerObj.bands > 1 && (
                    <Select
                      size="small"
                      className="w-20 text-xs"
                      value={selectedBand}
                      onChange={(b) => setSelectedBand(b)}
                      options={Array.from({ length: selectedLayerObj.bands }, (_, i) => ({
                        label: `Band ${i + 1}`,
                        value: i + 1,
                      }))}
                    />
                  )}
                  <Button
                    size="small"
                    icon={<RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />}
                    onClick={fetchStats}
                    disabled={loading}
                    title={t('refresh', 'Hitung Ulang')}
                  />
                </div>
              </div>

              {/* Status / Loading / Content */}
              {loading ? (
                <div className="py-8 flex flex-col items-center justify-center gap-2.5">
                  <Spin size="small" />
                  <span className="text-xs text-slate-500">
                    {t('calculatingStats', 'Menghitung statistik piksel via WCS...')}
                  </span>
                </div>
              ) : errorMsg ? (
                <div className="py-4 text-center text-xs text-rose-500 bg-rose-50 rounded p-2 border border-rose-100">
                  {errorMsg}
                </div>
              ) : statsData ? (
                <div className="space-y-2.5">
                  {/* Approximate Badge & Resolution Indicator */}
                  <div className="flex items-center justify-between text-xs">
                    {statsData.approximate ? (
                      <Tag
                        color="warning"
                        className="flex items-center gap-1 font-medium border-amber-300 text-amber-700 bg-amber-50 m-0"
                      >
                        <AlertTriangle className="w-3 h-3" />
                        {t('approximateBadge', 'Perkiraan (Resampled)')}
                      </Tag>
                    ) : (
                      <Tag
                        color="success"
                        className="flex items-center gap-1 font-medium border-emerald-300 text-emerald-700 bg-emerald-50 m-0"
                      >
                        <CheckCircle className="w-3 h-3" />
                        {t('exactStats', 'Presisi Penuh (Asli)')}
                      </Tag>
                    )}
                    {statsData.resolution && (
                      <span className="text-[11px] font-mono text-slate-400">
                        Res: {statsData.resolution.x < 1 ? statsData.resolution.x.toFixed(6) : statsData.resolution.x.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {/* Metrics Summary Grid */}
                  <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-2 rounded-lg border border-slate-100 text-center">
                    <div className="p-1 bg-white rounded shadow-2xs">
                      <div className="text-[10px] text-slate-400 font-medium">Min</div>
                      <div className="text-xs font-mono font-semibold text-slate-800">
                        {formatRasterValue(statsData.min, 3)}
                      </div>
                    </div>
                    <div className="p-1 bg-white rounded shadow-2xs">
                      <div className="text-[10px] text-slate-400 font-medium">Max</div>
                      <div className="text-xs font-mono font-semibold text-slate-800">
                        {formatRasterValue(statsData.max, 3)}
                      </div>
                    </div>
                    <div className="p-1 bg-white rounded shadow-2xs">
                      <div className="text-[10px] text-slate-400 font-medium">Mean</div>
                      <div className="text-xs font-mono font-semibold text-slate-800">
                        {formatRasterValue(statsData.mean, 3)}
                      </div>
                    </div>
                    <div className="p-1 bg-white rounded shadow-2xs">
                      <div className="text-[10px] text-slate-400 font-medium">Std Dev</div>
                      <div className="text-xs font-mono font-semibold text-slate-800">
                        {formatRasterValue(statsData.std, 3)}
                      </div>
                    </div>
                    <div className="p-1 bg-white rounded shadow-2xs">
                      <div className="text-[10px] text-slate-400 font-medium">Valid Px</div>
                      <div className="text-xs font-mono font-semibold text-emerald-600">
                        {statsData.valid_count?.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-1 bg-white rounded shadow-2xs">
                      <div className="text-[10px] text-slate-400 font-medium">NoData Px</div>
                      <div className="text-xs font-mono font-semibold text-slate-400">
                        {statsData.nodata_count?.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Percentiles Bar */}
                  {statsData.percentiles && (
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {t('percentiles', 'Persentil')}
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-600">
                        <span>P5: {formatRasterValue(statsData.percentiles.p5, 2)}</span>
                        <span>P25: {formatRasterValue(statsData.percentiles.p25, 2)}</span>
                        <span className="font-semibold text-cyan-700">P50: {formatRasterValue(statsData.percentiles.p50, 2)}</span>
                        <span>P75: {formatRasterValue(statsData.percentiles.p75, 2)}</span>
                        <span>P95: {formatRasterValue(statsData.percentiles.p95, 2)}</span>
                      </div>
                    </div>
                  )}

                  {/* SVG Histogram Chart */}
                  {statsData.histogram && statsData.histogram.counts && statsData.histogram.counts.length > 0 && (
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                        {t('histogram', 'Histogram Distribusi Frekuensi')}
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                        {(() => {
                          const counts = statsData.histogram.counts;
                          const edges = statsData.histogram.bin_edges;
                          const maxCount = Math.max(...counts, 1);
                          const chartHeight = 44;

                          return (
                            <div className="relative">
                              <svg className="w-full h-11" preserveAspectRatio="none" viewBox={`0 0 ${counts.length * 10} ${chartHeight}`}>
                                {counts.map((count, i) => {
                                  const barH = Math.max(1, (count / maxCount) * chartHeight);
                                  const x = i * 10;
                                  const y = chartHeight - barH;
                                  const fromVal = edges[i] !== undefined ? edges[i].toFixed(1) : "";
                                  const toVal = edges[i + 1] !== undefined ? edges[i + 1].toFixed(1) : "";

                                  return (
                                    <g key={i}>
                                      <rect
                                        x={x + 1}
                                        y={y}
                                        width={8}
                                        height={barH}
                                        fill="#06b6d4"
                                        opacity={0.8}
                                        rx={1}
                                        className="hover:opacity-100 transition-opacity cursor-pointer"
                                      >
                                        <title>{`${count.toLocaleString()} piksel (${fromVal} - ${toVal})`}</title>
                                      </rect>
                                    </g>
                                  );
                                })}
                              </svg>
                              <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-0.5">
                                <span>{formatRasterValue(edges[0], 1)}</span>
                                <span>{formatRasterValue(edges[edges.length - 1], 1)}</span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Opsi & Tombol Unduh GeoTIFF */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-slate-600">{t('downloadFormat', 'Format Unduh:')}</span>
                      <Segmented
                        size="small"
                        value={clipStyled ? "styled" : "raw"}
                        onChange={(val) => setClipStyled(val === "styled")}
                        options={[
                          { label: t('styledRgba', '🎨 Berwarna (Styled)'), value: "styled" },
                          { label: t('rawData', '📊 Nilai Asli (Raw)'), value: "raw" },
                        ]}
                      />
                    </div>
                    <Button
                      type="primary"
                      block
                      size="small"
                      className="bg-cyan-600 hover:bg-cyan-500 text-xs flex items-center justify-center gap-1.5 h-8 font-medium shadow-xs"
                      onClick={handleDownloadClip}
                      loading={downloading}
                      icon={<Download className="w-3.5 h-3.5" />}
                    >
                      {downloading
                        ? t('downloading', 'Mengunduh...')
                        : clipStyled
                        ? t('downloadStyledGeoTiff', 'Unduh GeoTIFF Berwarna (RGB)')
                        : t('downloadRawGeoTiff', 'Unduh GeoTIFF Nilai Asli (Raw)')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center text-xs text-slate-500">
                  {t('noData', 'Tidak ada data untuk area yang dipilih')}
                </div>
              )}
            </Card>
          </div>,
          document.body
        )}
    </>
  );
};

export default MapAreaStatsController;
