import React, { useEffect, useRef, useState, useCallback } from "react";
import { useMap, useMapEvents, GeoJSON } from "react-leaflet";
import L from "leaflet";
import { Card, Button, Typography, Spin, Tag, Empty } from "antd";
import { X, MapPin, EyeOff, Layers, ChevronLeft, ChevronRight } from "lucide-react";
import layerApi from "../../api/LayerApi";
import {
  calculateToleranceMeters,
  getTopVisibleVectorLayer,
  buildIdentifyPayload,
  extractApiError,
} from "../../utils/wfsUtils";
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
  const [identifyResult, setIdentifyResult] = useState(null);
  const abortControllerRef = useRef(null);

  const handleSelectIndex = async (newIdx) => {
    if (!identifyResult || !identifyResult.features) return;
    const targetFeat = identifyResult.features[newIdx];
    if (!targetFeat) return;

    if (!targetFeat.geometry && targetFeat.id) {
      setLazyLoadingGeom(true);
      try {
        const full = await layerApi.getFeatureById(identifyResult.layerId, targetFeat.id);
        const updatedFeatures = [...identifyResult.features];
        updatedFeatures[newIdx] = full;
        setIdentifyResult((prev) => ({
          ...prev,
          features: updatedFeatures,
          selectedIndex: newIdx,
          feature: full,
        }));
      } catch (_err) {
        setIdentifyResult((prev) => ({
          ...prev,
          selectedIndex: newIdx,
          feature: targetFeat,
        }));
      } finally {
        setLazyLoadingGeom(false);
      }
      return;
    }

    setIdentifyResult((prev) => ({
      ...prev,
      selectedIndex: newIdx,
      feature: targetFeat,
    }));
  };

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
        onDeactivate?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, onDeactivate]);

  // Handle map click
  const handleMapClick = useCallback(async (e) => {
    if (!isActive) return;

    const { lat, lng } = e.latlng;
    const zoom = map.getZoom();
    const toleranceMeters = calculateToleranceMeters(lat, zoom, 8.0);

    const targetLayer = getTopVisibleVectorLayer(layers);
    if (!targetLayer) {
      setIdentifyResult({
        layerName: null,
        feature: null,
        message: t('noVisibleVectorLayer', 'Tidak ada layer vector yang aktif/terlihat di peta.'),
      });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setIdentifyResult(null);

    try {
      const payload = buildIdentifyPayload({
        lat,
        lng,
        zoom: map.getZoom(),
        pixelTolerance: 8.0,
      });

      const res = await layerApi.identifyFeatures(
        targetLayer.id,
        payload,
        abortControllerRef.current.signal
      );

      const features = res?.features || [];
      const layerDisplayName = targetLayer.display_name || targetLayer.layer_name || targetLayer.store_name;

      if (features.length > 0) {
        setIdentifyResult({
          layerName: layerDisplayName,
          layerId: targetLayer.id,
          features: features,
          selectedIndex: 0,
          feature: features[0],
          latlng: [lat, lng],
        });
      } else {
        setIdentifyResult({
          layerName: layerDisplayName,
          layerId: targetLayer.id,
          features: [],
          selectedIndex: 0,
          feature: null,
          message: t('noFeaturesAtClick', 'Tidak ada fitur ditemukan pada titik klik ini.'),
        });
      }
    } catch (err) {
      if (err.name !== "CanceledError" && err.name !== "AbortError") {
        setIdentifyResult({
          layerName: targetLayer.display_name || targetLayer.layer_name,
          features: [],
          selectedIndex: 0,
          feature: null,
          message: extractApiError(err) || t('identifyFailed', 'Gagal mengidentifikasi fitur.'),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [isActive, map, layers, t]);

  useMapEvents({
    click: handleMapClick,
  });

  // Feature yang di-highlight: baik dari hasil identify atau pilihan dari AttributeTableModal
  const activeHighlight = identifyResult?.feature || selectedFeature;

  const handleCloseCard = () => {
    setIdentifyResult(null);
    onClearSelectedFeature?.();
  };

  return (
    <>
      {/* High-contrast highlight overlay untuk fitur terpilih */}
      {activeHighlight && (
        <GeoJSON
          key={`highlight-${activeHighlight.id || JSON.stringify(activeHighlight.geometry?.coordinates?.[0] || Date.now())}`}
          data={activeHighlight}
          style={{
            color: "#06b6d4",
            weight: 3.5,
            opacity: 1,
            fillColor: "#22d3ee",
            fillOpacity: 0.35,
            dashArray: "4, 4",
          }}
          pointToLayer={(feature, latlng) => {
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

      {/* Floating Card Hasil Identify */}
      {(identifyResult || loading) && (
        <div className="leaflet-bottom leaflet-right !mb-12 !mr-4 z-[1000] pointer-events-auto max-w-sm w-80">
          <Card
            size="small"
            className="shadow-xl border border-cyan-300 bg-white/95 backdrop-blur-sm rounded-xl overflow-hidden"
            styles={{ body: { padding: "10px 14px" } }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                <span className="font-semibold text-xs text-slate-800 truncate">
                  {identifyResult?.layerName ? `${identifyResult.layerName}` : t('identifyFeature', 'Identifikasi Fitur')}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCloseCard}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Multiple features selector bar */}
            {identifyResult?.features?.length > 1 && (
              <div className="flex items-center justify-between bg-slate-100/80 px-2 py-1 rounded mb-2 text-xs">
                <span className="text-slate-600 font-medium">
                  {identifyResult.selectedIndex + 1} / {identifyResult.features.length} {t('features', 'fitur')}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={identifyResult.selectedIndex === 0 || lazyLoadingGeom}
                    onClick={() => handleSelectIndex(identifyResult.selectedIndex - 1)}
                    className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={identifyResult.selectedIndex === identifyResult.features.length - 1 || lazyLoadingGeom}
                    onClick={() => handleSelectIndex(identifyResult.selectedIndex + 1)}
                    className="p-0.5 rounded hover:bg-slate-200 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-4 flex flex-col items-center justify-center gap-2">
                <Spin size="small" />
                <span className="text-xs text-slate-500">{t('identifying', 'Mengidentifikasi fitur...')}</span>
              </div>
            ) : identifyResult?.feature ? (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                <div className="text-[11px] font-mono text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded w-fit mb-1">
                  FID: {identifyResult.feature.id || "-"}
                </div>
                {Object.entries(identifyResult.feature.properties || {}).map(([key, val]) => (
                  <div key={key} className="flex items-start justify-between text-xs py-0.5 border-b border-slate-50 gap-2">
                    <span className="text-slate-500 font-medium truncate max-w-[45%]">{key}:</span>
                    <span className="text-slate-800 font-mono text-right truncate max-w-[55%]">
                      {val === null || val === undefined ? "-" : typeof val === "object" ? JSON.stringify(val) : String(val)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-2 text-center text-xs text-slate-500">
                {identifyResult?.message || t('noData', 'Tidak ada data')}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
};

export default MapIdentifyController;

