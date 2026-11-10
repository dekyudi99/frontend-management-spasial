import React, { useMemo, useEffect } from "react";
import { TileLayer } from "react-leaflet";
import {
  buildWmtsTileUrl,
  DEFAULT_WMTS_GRIDSET,
  computeLeafletBounds,
  getCenterTileCoords,
} from "../../utils/wmtsUtils";

/**
 * WMTSTileLayer: Komponen perender layer peta cepat berbasis GeoWebCache tile cache.
 * Menghitung Leaflet LatLngBounds secara SINKRON tanpa padding agar Leaflet
 * tidak meminta tile di luar rentang extent GeoWebCache.
 */
const WMTSTileLayer = ({
  gwcUrl,
  layerQualified,
  zIndex = 10,
  opacity = 1,
  bust = null,
  gridset = DEFAULT_WMTS_GRIDSET,
  rawBbox = null,
  epsg = 4326,
  onProbeResult = null,
}) => {
  // 1. Hitung bounds SINKRON (useMemo) sehingga L.TileLayer diinstansiasi langsung dengan options.bounds yang valid
  const leafletBounds = useMemo(() => {
    return computeLeafletBounds(rawBbox, epsg);
  }, [rawBbox, epsg]);

  // Hash bounds untuk key: remount hanya terjadi jika bbox benar-benar berubah
  const boundsHash = useMemo(() => {
    if (!leafletBounds) return "nobounds";
    return `${leafletBounds[0][0].toFixed(5)},${leafletBounds[0][1].toFixed(5)}:${leafletBounds[1][0].toFixed(5)},${leafletBounds[1][1].toFixed(5)}`;
  }, [leafletBounds]);

  const tileUrl = buildWmtsTileUrl(gwcUrl, layerQualified, gridset, bust);

  // 2. Lakukan SATU probe fetch ke tile di tengah bbox layer pada zoom moderat (z=10).
  // Banner peringatan hanya dimunculkan jika probe ini gagal (bukan berdasarkan tileerror Leaflet).
  useEffect(() => {
    if (!gwcUrl || !layerQualified) return;
    const tileCoords = getCenterTileCoords(leafletBounds, 10);
    if (!tileCoords) return;

    const probeUrl = buildWmtsTileUrl(gwcUrl, layerQualified, gridset, bust)
      .replace("{z}", tileCoords.z)
      .replace("{x}", tileCoords.x)
      .replace("{y}", tileCoords.y);

    const controller = new AbortController();
    fetch(probeUrl, { method: "GET", signal: controller.signal })
      .then((res) => {
        const cType = res.headers.get("content-type") || "";
        const isHealthy = res.ok && cType.includes("image");
        onProbeResult?.(isHealthy);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          onProbeResult?.(false);
        }
      });

    return () => controller.abort();
  }, [gwcUrl, layerQualified, gridset, bust, boundsHash]);

  return (
    <TileLayer
      key={`${layerQualified}-${boundsHash}-${bust || 0}`}
      url={tileUrl}
      zIndex={zIndex}
      opacity={opacity}
      bounds={leafletBounds || undefined}
    />
  );
};

export default WMTSTileLayer;
