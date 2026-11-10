import proj4 from "proj4";

/** Gridset default GeoWebCache untuk standar Web Mercator (Leaflet/OSM) */
export const DEFAULT_WMTS_GRIDSET = "EPSG:900913";

/**
 * Membentuk URL GetTile WMTS 1.0.0 GeoWebCache sesuai spesifikasi OGC.
 *
 * @param {string} gwcUrl - Base GeoServer URL (misal: 'http://localhost:8080/geoserver')
 * @param {string} layerQualified - Nama layer ber-workspace (misal: 'workspace:layer')
 * @param {string} [gridset=DEFAULT_WMTS_GRIDSET] - Nama TileMatrixSet
 * @param {string|number} [bust] - Timestamp cache busting
 * @returns {string} Template URL untuk Leaflet TileLayer
 */
export function buildWmtsTileUrl(
  gwcUrl,
  layerQualified,
  gridset = DEFAULT_WMTS_GRIDSET,
  bust = null
) {
  const cleanBase = String(gwcUrl || "").replace(/\/+$/, "");
  const timeQuery = bust ? `&_t=${bust}` : "";
  return `${cleanBase}/gwc/service/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layerQualified}&STYLE=&TILEMATRIXSET=${gridset}&FORMAT=image/png&TILEMATRIX=${gridset}:{z}&TILEROW={y}&TILECOL={x}${timeQuery}`;
}

/**
 * Helper bersama untuk mendapatkan nama layer GeoServer yang konsisten.
 * @param {Object} layer
 * @returns {string}
 */
export function getLayerGeoserverName(layer) {
  if (!layer) return "";
  return layer.geoserver_name || layer.table_name || layer.store_name || layer.layer_name || "";
}

/**
 * Pure decision function pemilihan renderer layer pada Layer.jsx
 * Menjamin kesesuaian aturan: jika service_mode === 'wmts' && gwc_ready && gwc_url -> WMTS, selain itu WMS.
 *
 * @param {Object} layer
 * @returns {{ shouldRender: boolean, isWmts: boolean, rendererType: string|null, layerName: string, layerQualified: string }}
 */
export function resolveLayerRenderer(layer) {
  if (!layer || !layer.visible || !layer.wms_url) {
    return {
      shouldRender: false,
      isWmts: false,
      rendererType: null,
      layerName: "",
      layerQualified: "",
    };
  }

  const isWmts =
    layer.service_mode === "wmts" &&
    Boolean(layer.gwc_ready) &&
    Boolean(layer.gwc_url);

  const layerName = getLayerGeoserverName(layer);
  const layerQualified = `${layer.workspace_name}:${layerName}`;

  return {
    shouldRender: true,
    isWmts,
    rendererType: isWmts ? "WMTS" : "WMS",
    layerName,
    layerQualified,
  };
}

/**
 * Mendapatkan definisi proj4 string untuk proyeksi umum / UTM zones 1-60 N/S.
 * @param {number|string} epsg
 * @returns {string|null}
 */
export function getProj4Definition(epsg) {
  const code = Number(epsg);
  if (code === 4326) return "+proj=longlat +datum=WGS84 +no_defs";
  if (code === 3857 || code === 900913) {
    return "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs";
  }
  // UTM WGS84 Northern Hemisphere (EPSG 32601 - 32660)
  if (code >= 32601 && code <= 32660) {
    return `+proj=utm +zone=${code - 32600} +datum=WGS84 +units=m +no_defs`;
  }
  // UTM WGS84 Southern Hemisphere (EPSG 32701 - 32760)
  if (code >= 32701 && code <= 32760) {
    return `+proj=utm +zone=${code - 32700} +south +datum=WGS84 +units=m +no_defs`;
  }
  return null;
}

/**
 * Normalisasi rawBbox dari berbagai format (array atau object) ke [minx, miny, maxx, maxy].
 * @param {Array|Object} rawBbox
 * @returns {Array<number>|null}
 */
export function normalizeRawBbox(rawBbox) {
  if (!rawBbox) return null;
  if (Array.isArray(rawBbox) && rawBbox.length >= 4) {
    const parsed = rawBbox.slice(0, 4).map(Number);
    return parsed.some(isNaN) ? null : parsed;
  }
  if (typeof rawBbox === "object") {
    const minx = rawBbox.left ?? rawBbox.minx ?? rawBbox.minLng ?? rawBbox.west;
    const miny = rawBbox.bottom ?? rawBbox.miny ?? rawBbox.minLat ?? rawBbox.south;
    const maxx = rawBbox.right ?? rawBbox.maxx ?? rawBbox.maxLng ?? rawBbox.east;
    const maxy = rawBbox.top ?? rawBbox.maxy ?? rawBbox.maxLat ?? rawBbox.north;
    if (minx != null && miny != null && maxx != null && maxy != null) {
      const arr = [Number(minx), Number(miny), Number(maxx), Number(maxy)];
      return arr.some(isNaN) ? null : arr;
    }
  }
  return null;
}

/**
 * Menghitung Leaflet LatLngBounds [[south, west], [north, east]] secara SINKRON.
 * Jelas membedakan koordinat derajat vs meter proyeksi.
 * Menggunakan batas persis (TANPA padding) agar tidak meloloskan tile di luar extent GWC.
 *
 * @param {Array|Object} rawBbox - [minx, miny, maxx, maxy] atau object bounds
 * @param {number|string} [epsg=4326] - Kode EPSG spasial
 * @returns {Array<[number, number]>|null} [[south, west], [north, east]] dalam [lat, lng]
 */
export function computeLeafletBounds(rawBbox, epsg = 4326) {
  const norm = normalizeRawBbox(rawBbox);
  if (!norm) return null;

  const [minx, miny, maxx, maxy] = norm;

  // 1. Cek apakah koordinat sudah berupa derajat WGS84:
  // Bujur antara -180 dan 180, Lintang antara -90 dan 90.
  // Data derajat TIDAK BOLEH diproyeksikan ulang sebagai UTM meskipun epsg bernilai 32647.
  const isDegree =
    minx >= -180 &&
    maxx <= 180 &&
    miny >= -90 &&
    maxy <= 90;

  if (isDegree || epsg === 4326 || epsg === "4326" || !epsg) {
    const south = Math.min(miny, maxy);
    const north = Math.max(miny, maxy);
    const west = Math.min(minx, maxx);
    const east = Math.max(minx, maxx);
    return [
      [south, west],
      [north, east],
    ];
  }

  // 2. Koordinat berupa meter proyeksi (misal UTM 32647)
  const epsgCode = Number(epsg);
  const def = getProj4Definition(epsgCode);
  if (def) {
    try {
      proj4.defs(`EPSG:${epsgCode}`, def);
      const [minLng, minLat] = proj4(`EPSG:${epsgCode}`, "EPSG:4326", [minx, miny]);
      const [maxLng, maxLat] = proj4(`EPSG:${epsgCode}`, "EPSG:4326", [maxx, maxy]);

      if (
        [minLng, minLat, maxLng, maxLat].every((v) => v != null && !isNaN(v)) &&
        minLng >= -180 &&
        maxLng <= 180 &&
        minLat >= -90 &&
        maxLat <= 90
      ) {
        const south = Math.min(minLat, maxLat);
        const north = Math.max(minLat, maxLat);
        const west = Math.min(minLng, maxLng);
        const east = Math.max(minLng, maxLng);
        return [
          [south, west],
          [north, east],
        ];
      }
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Menghitung koordinat tile (z, x, y) di titik tengah Leaflet LatLngBounds untuk probe verifikasi.
 * @param {Array<[number, number]>} bounds - [[south, west], [north, east]]
 * @param {number} [zoom=10]
 * @returns {{ z: number, x: number, y: number }|null}
 */
export function getCenterTileCoords(bounds, zoom = 10) {
  if (!bounds || bounds.length < 2) return null;
  const [south, west] = bounds[0];
  const [north, east] = bounds[1];
  const centerLat = (south + north) / 2;
  const centerLng = (west + east) / 2;

  const n = Math.pow(2, zoom);
  const col = Math.floor(((centerLng + 180) / 360) * n);
  const clampedLat = Math.max(Math.min(centerLat, 85.0511), -85.0511);
  const rad = (clampedLat * Math.PI) / 180;
  const row = Math.floor(
    ((1 - Math.asinh(Math.tan(rad)) / Math.PI) / 2) * n
  );

  return { z: zoom, x: col, y: row };
}
