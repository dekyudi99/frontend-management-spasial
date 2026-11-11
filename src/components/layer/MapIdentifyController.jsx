import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { useMap, useMapEvents, GeoJSON, CircleMarker } from "react-leaflet";
import L from "leaflet";
import { Card, Typography, Spin, Tag } from "antd";
import { X, MapPin, Layers, ChevronLeft, ChevronRight, Activity, Image as ImageIcon } from "lucide-react";
import layerApi from "../../api/LayerApi";
import {
  calculateToleranceMeters,
  buildIdentifyPayload,
  extractApiError,
} from "../../utils/wfsUtils";
import {
  isRasterLayer,
  isVectorLayer,
  getVisibleLayersForIdentify,
  formatRasterValue,
  matchRasterSymbology,
} from "../../utils/rasterUtils";
import { useLanguage } from "../../context/LanguageContext";

const { Text } = Typography;

const MapIdentifyController = ({
  isActive,
  onDeactivate,
  layers,
  selectedFeature,
  onClearSelectedFeature,
}) => {
  const map = useMap();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [lazyLoadingGeom, setLazyLoadingGeom] = useState(false);
  const [layerResults, setLayerResults] = useState([]);
  const [activeLayerIndex, setActiveLayerIndex] = useState(0);
  const [activeVectorFeatureIndex, setActiveVectorFeatureIndex] = useState(0);
  const [clickLatLng, setClickLatLng] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const abortControllerRef = useRef(null);
  const cardRef = useRef(null);

  // Mencegah Leaflet membajak klik/scroll pada floating card identify
  useEffect(() => {
    if (cardRef.current) {
      L.DomEvent.disableClickPropagation(cardRef.current);
      L.DomEvent.disableScrollPropagation(cardRef.current);
    }
  });

  // Ubah cursor peta saat mode identify aktif
  useEffect(() => {
    const container = map.getContainer();
    if (isActive) {
      container.style.cursor = "crosshair";
    } else {
      container.style.cursor = "";
    }
    return () => {
      container.style.cursor = "";
    };
  }, [isActive, map]);

  // Escape key untuk keluar dari mode identify
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isActive) {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        onDeactivate?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onDeactivate]);

  // Lazy load geometri fitur vektor jika belum ada
  const handleSelectVectorFeature = async (layerItem, newIdx) => {
    if (!layerItem || !layerItem.features) return;
    const targetFeat = layerItem.features[newIdx];
    if (!targetFeat) return;

    if (!targetFeat.geometry && targetFeat.id) {
      setLazyLoadingGeom(true);
      try {
        const full = await layerApi.getFeatureById(layerItem.layerId, targetFeat.id);
        const updatedFeatures = [...layerItem.features];
        updatedFeatures[newIdx] = full;

        setLayerResults((prev) => {
          const next = [...prev];
          next[activeLayerIndex] = {
            ...layerItem,
            features: updatedFeatures,
          };
          return next;
        });
      } catch (_err) {
        // Fallback
      } finally {
        setLazyLoadingGeom(false);
      }
    }
    setActiveVectorFeatureIndex(newIdx);
  };

  // Handle map click
  const handleMapClick = useCallback(async (e) => {
    if (!isActive) return;

    const { lat, lng } = e.latlng;
    setClickLatLng([lat, lng]);

    const targetLayers = getVisibleLayersForIdentify(layers, 5);
    if (!targetLayers || targetLayers.length === 0) {
      setLayerResults([]);
      setErrorMessage(t('noVisibleLayer', 'Tidak ada layer yang aktif/terlihat di peta.'));
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setLoading(true);
    setErrorMessage(null);
    setLayerResults([]);
    setActiveLayerIndex(0);
    setActiveVectorFeatureIndex(0);

    const zoom = map.getZoom();
    const toleranceMeters = calculateToleranceMeters(lat, zoom, 8.0);
    const vectorPayload = buildIdentifyPayload({ lat, lng, zoom, pixelTolerance: 8.0 });
    const rasterPayload = { lat, lng };

    try {
      const promises = targetLayers.map(async (layer) => {
        const layerDisplayName = layer.display_name || layer.layer_name || layer.store_name || layer.table_name;
        if (isRasterLayer(layer)) {
          try {
            const data = await layerApi.identifyRaster(layer.id, rasterPayload, signal);
            return {
              layerId: layer.id,
              layerName: layerDisplayName,
              kind: "raster",
              layer,
              data,
            };
          } catch (err) {
            if (signal.aborted) throw err;
            return {
              layerId: layer.id,
              layerName: layerDisplayName,
              kind: "raster",
              layer,
              error: extractApiError(err) || t('identifyFailed', 'Gagal membaca raster'),
            };
          }
        } else {
          // Vector layer
          try {
            const res = await layerApi.identifyFeatures(layer.id, vectorPayload, signal);
            return {
              layerId: layer.id,
              layerName: layerDisplayName,
              kind: "vector",
              layer,
              features: res?.features || [],
            };
          } catch (err) {
            if (signal.aborted) throw err;
            return {
              layerId: layer.id,
              layerName: layerDisplayName,
              kind: "vector",
              layer,
              features: [],
              error: extractApiError(err) || t('identifyFailed', 'Gagal mengidentifikasi fitur'),
            };
          }
        }
      });

      const settled = await Promise.allSettled(promises);
      if (signal.aborted) return;

      const successfulResults = settled
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => r.value);

      if (successfulResults.length === 0) {
        setErrorMessage(t('noFeaturesAtClick', 'Tidak ada data/fitur ditemukan pada titik klik ini.'));
      } else {
        setLayerResults(successfulResults);
      }
    } catch (err) {
      if (err.name !== "CanceledError" && err.name !== "AbortError" && !signal.aborted) {
        setErrorMessage(extractApiError(err) || t('identifyFailed', 'Gagal mengidentifikasi fitur.'));
      }
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  }, [isActive, map, layers, t]);

  useMapEvents({
    click: handleMapClick,
  });

  const handleCloseCard = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setLayerResults([]);
    setErrorMessage(null);
    setClickLatLng(null);
    onClearSelectedFeature?.();
  };

  const currentResult = layerResults[activeLayerIndex] || null;

  // Active feature to highlight for vector layer
  const currentVectorFeature =
    currentResult?.kind === "vector" && currentResult.features?.length > 0
      ? currentResult.features[activeVectorFeatureIndex]
      : selectedFeature;

  return (
    <>
      {/* High-contrast highlight overlay untuk fitur vektor terpilih */}
      {currentVectorFeature && (
        <GeoJSON
          key={`highlight-${currentVectorFeature.id || JSON.stringify(currentVectorFeature.geometry?.coordinates?.[0] || Date.now())}`}
          data={currentVectorFeature}
          style={{
            color: "#06b6d4",
            weight: 3.5,
            opacity: 1,
            fillColor: "#22d3ee",
            fillOpacity: 0.35,
            dashArray: "4, 4",
          }}
          pointToLayer={(_feature, latlng) => {
            return L.circleMarker(latlng, {
              radius: 8,
              fillColor: "#06b6d4",
              color: "#ffffff",
              weight: 2,
              opacity: 1,
              fillOpacity: 0.8,
            });
          }}
        />
      )}

      {/* Marker titik klik untuk hasil raster atau identify aktif */}
      {clickLatLng && (
        <CircleMarker
          center={clickLatLng}
          radius={6}
          pathOptions={{
            color: "#0891b2",
            fillColor: "#38bdf8",
            fillOpacity: 0.9,
            weight: 2,
          }}
        />
      )}

      {/* Floating Card Hasil Identify Multi-Layer (dirender ke document.body via Portal) */}
      {(layerResults.length > 0 || loading || errorMessage) &&
        createPortal(
          <div
            ref={cardRef}
            className="fixed bottom-6 right-4 z-[2000] pointer-events-auto max-w-sm w-88 animate-in fade-in slide-in-from-bottom-4 duration-200"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
          >
            <Card
              size="small"
              className="shadow-2xl border border-cyan-300 bg-white/95 backdrop-blur-md rounded-xl overflow-hidden"
              styles={{ body: { padding: "10px 14px" } }}
            >
            {/* Header Card */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                <span className="font-semibold text-xs text-slate-800 truncate">
                  {currentResult?.layerName
                    ? currentResult.layerName
                    : t('identifyFeature', 'Identifikasi Fitur & Nilai Raster')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseCard}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Layer Tabs jika ada > 1 layer hasil identify */}
            {layerResults.length > 1 && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-2 scrollbar-thin">
                {layerResults.map((item, idx) => (
                  <button
                    key={item.layerId || idx}
                    type="button"
                    onClick={() => {
                      setActiveLayerIndex(idx);
                      setActiveVectorFeatureIndex(0);
                    }}
                    className={`px-2 py-0.5 text-[11px] font-medium rounded-full shrink-0 transition cursor-pointer flex items-center gap-1 ${
                      activeLayerIndex === idx
                        ? "bg-cyan-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.kind === "raster" ? (
                      <ImageIcon className="w-3 h-3 shrink-0" />
                    ) : (
                      <Layers className="w-3 h-3 shrink-0" />
                    )}
                    <span className="truncate max-w-[110px]">{item.layerName}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Loading Spinner */}
            {loading ? (
              <div className="py-5 flex flex-col items-center justify-center gap-2">
                <Spin size="small" />
                <span className="text-xs text-slate-500">
                  {t('identifying', 'Mengidentifikasi fitur & membaca piksel...')}
                </span>
              </div>
            ) : errorMessage ? (
              <div className="py-3 text-center text-xs text-slate-500">
                {errorMessage}
              </div>
            ) : currentResult?.kind === "raster" ? (
              /* HASIL RASTER LAYER */
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-50 pb-1">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-cyan-600" />
                    {t('rasterPixel', 'Piksel Raster (WCS)')}
                  </span>
                  {currentResult.data?.native_crs && (
                    <span className="font-mono text-slate-400 text-[10px]">
                      {currentResult.data.native_crs}
                    </span>
                  )}
                </div>

                {currentResult.data?.outside ? (
                  <div className="py-2 text-center">
                    <Tag color="warning" className="text-xs px-2 py-0.5">
                      {t('outsideExtent', 'Di Luar Area Cakupan')}
                    </Tag>
                  </div>
                ) : currentResult.data?.nodata ? (
                  <div className="py-2 text-center">
                    <Tag className="text-xs px-2 py-0.5 text-slate-500">
                      {t('nodata', 'Nilai NoData')}
                    </Tag>
                  </div>
                ) : currentResult.data?.bands && currentResult.data.bands.length > 0 ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {currentResult.data.bands.map((band) => {
                      const match = matchRasterSymbology(band.value, currentResult.layer?.symbology);
                      const isBandNodata = band.value === null || band.value === undefined;

                      return (
                        <div
                          key={band.band}
                          className="flex items-center justify-between text-xs py-1 px-1.5 bg-slate-50/80 rounded border border-slate-100"
                        >
                          <span className="font-medium text-slate-600">
                            {t('band', 'Band')} {band.band}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {match && (
                              <div className="flex items-center gap-1 text-[11px] text-slate-600">
                                <span
                                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10"
                                  style={{ backgroundColor: match.color }}
                                />
                                <span className="truncate max-w-[80px]" title={match.label}>
                                  {match.label}
                                </span>
                              </div>
                            )}
                            <span className="font-mono font-semibold text-slate-800">
                              {isBandNodata ? "NoData" : formatRasterValue(band.value, 4)}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {currentResult.data?.coords && (
                      <div className="pt-1 border-t border-slate-100 text-[10px] font-mono text-slate-400 flex justify-between">
                        <span>Lat/Lng: {clickLatLng?.[0]?.toFixed(5)}, {clickLatLng?.[1]?.toFixed(5)}</span>
                        {currentResult.data.coords.x !== undefined && (
                          <span>X/Y: {Math.round(currentResult.data.coords.x)}, {Math.round(currentResult.data.coords.y)}</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs text-slate-500">
                    {currentResult.error || t('noData', 'Tidak ada nilai piksel')}
                  </div>
                )}
              </div>
            ) : currentResult?.kind === "vector" ? (
              /* HASIL VECTOR LAYER */
              <div>
                {/* Selector jika fitur > 1 */}
                {currentResult.features?.length > 1 && (
                  <div className="flex items-center justify-between bg-slate-100/80 px-2 py-1 rounded mb-2 text-xs">
                    <span className="text-slate-600 font-medium">
                      {activeVectorFeatureIndex + 1} / {currentResult.features.length} {t('features', 'fitur')}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={activeVectorFeatureIndex === 0 || lazyLoadingGeom}
                        onClick={() => handleSelectVectorFeature(currentResult, activeVectorFeatureIndex - 1)}
                        className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={activeVectorFeatureIndex === currentResult.features.length - 1 || lazyLoadingGeom}
                        onClick={() => handleSelectVectorFeature(currentResult, activeVectorFeatureIndex + 1)}
                        className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {currentVectorFeature ? (
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    <div className="text-[11px] font-mono text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded w-fit mb-1">
                      FID: {currentVectorFeature.id || "-"}
                    </div>
                    {Object.entries(currentVectorFeature.properties || {}).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex items-start justify-between text-xs py-0.5 border-b border-slate-50 gap-2"
                      >
                        <span className="text-slate-500 font-medium truncate max-w-[45%]">{key}:</span>
                        <span className="text-slate-800 font-mono text-right truncate max-w-[55%]">
                          {val === null || val === undefined
                            ? "-"
                            : typeof val === "object"
                            ? JSON.stringify(val)
                            : String(val)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-2 text-center text-xs text-slate-500">
                    {currentResult.error || t('noFeaturesAtClick', 'Tidak ada fitur ditemukan')}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-slate-500">
                {t('noData', 'Tidak ada data')}
              </div>
            )}
          </Card>
        </div>,
        document.body
      )}
    </>
  );
};

export default MapIdentifyController;
