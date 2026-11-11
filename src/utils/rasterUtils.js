/**
 * Utilitas murni untuk WCS Raster: pembentukan payload request, validasi koordinat,
 * pemformatan nilai piksel, pencocokan simbologi, dan parsing error Blob.
 */

import { extractApiError } from "./wfsUtils.js";

/**
 * Memeriksa apakah layer merupakan layer raster.
 * @param {Object} layer 
 * @returns {boolean}
 */
export function isRasterLayer(layer) {
  if (!layer) return false;
  if (layer.layer_kind === "raster" || layer.layer_type === "raster") return true;
  const typeUpper = String(layer.layer_type || layer.file_format || "").toUpperCase();
  if (typeUpper === "TIF" || typeUpper === "TIFF" || typeUpper === "GEOTIFF") return true;
  if (layer.store_name && !layer.geom_type && !layer.table_name) return true;
  return false;
}

/**
 * Memeriksa apakah layer merupakan layer vector.
 * @param {Object} layer 
 * @returns {boolean}
 */
export function isVectorLayer(layer) {
  if (!layer) return false;
  if (layer.layer_kind === "vector" || layer.layer_type === "vector") return true;
  if (Boolean(layer.geom_type || layer.table_name)) return true;
  const typeUpper = String(layer.layer_type || layer.file_format || "").toUpperCase();
  return ["GEOJSON", "SHP", "SHAPEFILE", "KML", "GPKG"].includes(typeUpper);
}

/**
 * Mengambil hingga maxCount layer (vector dan raster) yang sedang aktif/visible di peta
 * mengikuti urutan tumpukan render (layer teratas di awal array).
 * @param {Array} layers 
 * @param {number} maxCount 
 * @returns {Array}
 */
export function getVisibleLayersForIdentify(layers, maxCount = 5) {
  if (!Array.isArray(layers)) return [];
  const visible = layers.filter((l) => Boolean(l && l.visible));
  return visible.slice(0, Math.max(1, maxCount));
}

/**
 * Membentuk payload identifikasi nilai raster pada titik (lat, lng).
 * Format JSON: { "lat": float, "lng": float }
 * @param {Object} params
 * @param {number} params.lat
 * @param {number} params.lng
 * @returns {Object}
 */
export function buildRasterIdentifyPayload({ lat, lng }) {
  const numLat = Number(lat);
  const numLng = Number(lng);

  if (!Number.isFinite(numLat) || !Number.isFinite(numLng)) {
    throw new Error("Koordinat latitude dan longitude harus berupa angka valid.");
  }

  if (numLat < -90 || numLat > 90) {
    throw new Error("Latitude harus berada dalam rentang [-90, 90].");
  }

  if (numLng < -180 || numLng > 180) {
    throw new Error("Longitude harus berada dalam rentang [-180, 180].");
  }

  return {
    lat: numLat,
    lng: numLng,
  };
}

/**
 * Memvalidasi dan menormalisasi Bounding Box [minLng, minLat, maxLng, maxLat].
 * @param {Array} bbox 
 * @returns {Array<number>}
 */
export function validateBoundingBox(bbox) {
  if (!Array.isArray(bbox) || bbox.length !== 4) {
    throw new Error("BBox harus berupa array dengan 4 angka [minLng, minLat, maxLng, maxLat].");
  }

  const [minLng, minLat, maxLng, maxLat] = bbox.map(Number);

  if ([minLng, minLat, maxLng, maxLat].some((n) => !Number.isFinite(n))) {
    throw new Error("Semua nilai koordinat BBox harus berupa angka finite valid.");
  }

  if (minLng >= maxLng) {
    throw new Error(`minLng (${minLng}) harus lebih kecil dari maxLng (${maxLng}).`);
  }

  if (minLat >= maxLat) {
    throw new Error(`minLat (${minLat}) harus lebih kecil dari maxLat (${maxLat}).`);
  }

  if (minLng < -180 || maxLng > 180) {
    throw new Error("Longitude harus berada dalam rentang [-180, 180].");
  }

  if (minLat < -90 || maxLat > 90) {
    throw new Error("Latitude harus berada dalam rentang [-90, 90].");
  }

  return [minLng, minLat, maxLng, maxLat];
}

/**
 * Membentuk payload kalkulasi statistik area raster.
 * Format JSON: { "bbox": [...], "band": int, "bins": int }
 * @param {Object} params
 * @param {Array<number>} params.bbox
 * @param {number} [params.band=1]
 * @param {number} [params.bins=20]
 * @returns {Object}
 */
export function buildRasterStatsPayload({ bbox, band = 1, bins = 20 }) {
  const cleanBbox = validateBoundingBox(bbox);
  const cleanBand = Math.max(1, Math.round(Number(band) || 1));
  const cleanBins = Math.max(2, Math.min(100, Math.round(Number(bins) || 20)));

  return {
    bbox: cleanBbox,
    band: cleanBand,
    bins: cleanBins,
  };
}

/**
 * Membentuk payload pemotongan (clip) GeoTIFF raster.
 * Format JSON: { "bbox": [...], "max_pixels": int }
 * @param {Object} params
 * @param {Array<number>} params.bbox
 * @param {number} [params.maxPixels=4000000]
 * @returns {Object}
 */
export function buildRasterClipPayload({ bbox, styled = true, mask_polygon = null, maxPixels = 4000000 }) {
  const cleanBbox = validateBoundingBox(bbox);
  const cleanMax = Math.max(100, Math.round(Number(maxPixels) || 4000000));

  const payload = {
    bbox: cleanBbox,
    styled: Boolean(styled),
    max_pixels: cleanMax,
  };

  if (Array.isArray(mask_polygon) && mask_polygon.length >= 3) {
    payload.mask_polygon = mask_polygon;
  }

  return payload;
}

/**
 * Memformat nilai angka raster secara adaptif untuk tampilan UI yang rapi.
 * @param {number|null|undefined} val 
 * @param {number} [decimals=2] 
 * @returns {string}
 */
export function formatRasterValue(val, decimals = 2) {
  if (val === null || val === undefined) return "-";
  const num = Number(val);
  if (!Number.isFinite(num)) return "-";

  // Jika integer murni
  if (Number.isInteger(num)) {
    return num.toLocaleString();
  }

  // Jika angka sangat kecil di luar toleransi floating point biasa
  const abs = Math.abs(num);
  if (abs > 0 && abs < 0.001) {
    return num.toExponential(2);
  }

  // Desimal adaptif
  const formatted = num.toFixed(decimals);
  // Hilangkan trailing .00 jika pas
  return formatted.replace(/\.?0+$/, "");
}

/**
 * Mencocokkan nilai piksel raster terhadap simbologi kelas warna dan labelnya.
 * Mendukung intervals dan unique_values.
 * @param {number|null|undefined} value 
 * @param {Object} symbology 
 * @returns {Object|null} { color: string, label: string }
 */
export function matchRasterSymbology(value, symbology) {
  if (value === null || value === undefined || !symbology) return null;
  const num = Number(value);
  if (!Number.isFinite(num)) return null;

  const classes = symbology.classes || symbology.rules || symbology.color_map;
  if (!Array.isArray(classes) || classes.length === 0) return null;

  // 1. Coba pencocokan unique values / discrete classes
  const exactMatch = classes.find((c) => {
    if (c.value !== undefined && c.value !== null) {
      return Number(c.value) === num || Math.abs(Number(c.value) - num) < 1e-5;
    }
    return false;
  });
  if (exactMatch) {
    return {
      color: exactMatch.color || exactMatch.hex || "#94a3b8",
      label: exactMatch.label || exactMatch.title || String(exactMatch.value),
    };
  }

  // 2. Coba pencocokan interval [min, max)
  for (let i = 0; i < classes.length; i++) {
    const c = classes[i];
    const min = c.min !== undefined ? Number(c.min) : c.from !== undefined ? Number(c.from) : -Infinity;
    const max = c.max !== undefined ? Number(c.max) : c.to !== undefined ? Number(c.to) : Infinity;
    const isLast = i === classes.length - 1;

    // Untuk interval terakhir, batas atas inklusif
    if (isLast ? (num >= min && num <= max) : (num >= min && num < max)) {
      return {
        color: c.color || c.hex || "#94a3b8",
        label: c.label || c.title || `${formatRasterValue(min)} - ${formatRasterValue(max)}`,
      };
    }
  }

  return null;
}

/**
 * Mengurai error dari respons Axios bertipe Blob menjadi pesan teks error yang ramah.
 * Kompatibel dengan format Pydantic FastAPI validation array [{loc, msg}].
 * @param {Error} err 
 * @returns {Promise<string>}
 */
export async function parseBlobError(err) {
  if (!err) return "Terjadi kesalahan tidak diketahui.";

  const respData = err.response?.data;
  if (respData && typeof Blob !== "undefined" && respData instanceof Blob) {
    try {
      const text = await respData.text();
      try {
        const json = JSON.parse(text);
        return extractApiError({ response: { data: json, status: err.response.status } });
      } catch (_e) {
        if (text && text.trim().length > 0 && text.length < 500) {
          return text.trim();
        }
      }
    } catch (_readErr) {
      // Fallback
    }
  }

  return extractApiError(err) || err.message || "Gagal memproses data GeoTIFF.";
}

