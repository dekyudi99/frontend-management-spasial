/**
 * Utilitas murni untuk WFS, toleransi spasial, dan pembaruan cache layer.
 */

/**
 * Menghitung toleransi jarak dalam meter berdasarkan latitude, level zoom Leaflet,
 * dan toleransi klik dalam piksel (default 8px).
 *
 * @param {number} lat - Latitude titik tengah dalam derajat
 * @param {number} zoom - Zoom level peta (0 - 22)
 * @param {number} pixelTolerance - Toleransi klik dalam piksel (default: 8.0)
 * @returns {number} Toleransi dalam meter
 */
export function calculateToleranceMeters(lat, zoom, pixelTolerance = 8.0) {
  const safeZoom = Math.max(0, Math.min(24, Number(zoom) || 0));
  const safeLat = Math.max(-85.0511, Math.min(85.0511, Number(lat) || 0));
  const latRad = (safeLat * Math.PI) / 180.0;
  const metersPerPx = (40075016.686 * Math.cos(latRad)) / (256 * Math.pow(2, safeZoom));
  return Math.max(0.1, pixelTolerance * metersPerPx);
}

/**
 * Mendapatkan layer vector teratas yang saat ini berstatus 'visible'
 * dari daftar layer (mengikuti urutan tumpukan render peta).
 *
 * @param {Array} layers - Daftar layer
 * @returns {Object|null} Layer vector teratas atau null jika tidak ada
 */
export function getTopVisibleVectorLayer(layers) {
  if (!Array.isArray(layers)) return null;
  // Item pertama di array list adalah layer teratas di tumpukan UI
  return layers.find((l) => {
    if (!l || !l.visible) return false;
    const isVector = Boolean(
      l.geom_type ||
      l.layer_kind === "vector" ||
      l.layer_type === "vector" ||
      l.layer_type === "GEOJSON" ||
      l.layer_type === "SHP" ||
      l.layer_type === "KML"
    );
    return isVector;
  }) || null;
}

/**
 * Operator filter CQL yang didukung berdasarkan tipe kolom lokal.
 *
 * @param {string} localType - 'string' | 'number' | 'boolean' | 'date'
 * @returns {Array<string>} Daftar operator yang valid
 */
export function filterOperatorsForType(localType) {
  switch (localType) {
    case "string":
      return ["=", "!=", "ILIKE", "LIKE", "IN", "IS NULL", "IS NOT NULL"];
    case "number":
      return ["=", "!=", ">", ">=", "<", "<=", "IN", "IS NULL", "IS NOT NULL"];
    case "boolean":
      return ["=", "!=", "IS NULL", "IS NOT NULL"];
    case "date":
      return ["=", "!=", ">", ">=", "<", "<=", "IS NULL", "IS NOT NULL"];
    default:
      return ["=", "!=", "IS NULL", "IS NOT NULL"];
  }
}

/**
 * Memformat baris filter UI menjadi daftar FeatureFilterItem backend.
 *
 * @param {Array<{column: string, operator: string, value: any}>} rows
 * @returns {Array<Object>|null} Daftar FeatureFilterItem [{ field, op, value }] atau null jika kosong
 */
export function formatFilterPayload(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return null;

  const validConditions = rows
    .filter((r) => r && r.column && r.operator)
    .map((r) => {
      let val = r.value;
      if (r.operator === "IS NULL" || r.operator === "IS NOT NULL") {
        val = null;
      } else if (r.operator === "IN" && typeof val === "string") {
        val = val.split(",").map((s) => s.trim()).filter(Boolean);
      }
      return {
        field: r.column,
        op: r.operator,
        value: val,
      };
    });

  if (validConditions.length === 0) return null;
  return validConditions;
}

/**
 * Fungsi murni untuk memperbarui item layer tertentu di dalam struktur cache TanStack Query.
 * Struktur cache yang didukung: { data: { data: [layer1, layer2, ...] } }
 *
 * @param {Object} oldQueryData - Snapshot cache lama
 * @param {string} layerId - ID layer yang diperbarui
 * @param {Object} updates - Nilai baru (mis. { service_mode, gwc_ready, gwc_url })
 * @returns {Object} Snapshot cache baru yang immutable
 */
export function updateLayerInCacheData(oldQueryData, layerId, updates) {
  if (!oldQueryData || !oldQueryData.data || !Array.isArray(oldQueryData.data.data)) {
    return oldQueryData;
  }

  const updatedLayers = oldQueryData.data.data.map((l) => {
    if (l.id !== layerId) return l;
    return {
      ...l,
      ...updates,
    };
  });

  return {
    ...oldQueryData,
    data: {
      ...oldQueryData.data,
      data: updatedLayers,
    },
  };
}

/**
 * Membentuk payload bersih dan valid untuk endpoint POST /layers/{id}/features/identify.
 *
 * @param {Object} params
 * @param {number} params.lat - Latitude titik klik
 * @param {number} params.lng - Longitude titik klik
 * @param {number} params.zoom - Zoom level Leaflet (mendukung float, mis. 10.5, 12.3)
 * @param {number} [params.pixelTolerance=8.0] - Toleransi klik dalam piksel (default: 8.0)
 * @returns {{lat: number, lng: number, zoom: number, tolerance_px: number}}
 */
export function buildIdentifyPayload({ lat, lng, zoom, pixelTolerance = 8.0 }) {
  const safeLat = Number(lat);
  const safeLng = Number(lng);
  const safeZoom = Number(zoom);
  const safeTol = Number(pixelTolerance) || 8.0;

  if (isNaN(safeLat) || isNaN(safeLng) || isNaN(safeZoom)) {
    throw new Error("Invalid identify parameters: lat, lng, and zoom must be valid numbers.");
  }

  return {
    lat: safeLat,
    lng: safeLng,
    zoom: safeZoom,
    tolerance_px: safeTol,
  };
}

/**
 * Mengekstrak pesan error ramah dari berbagai bentuk respon error API/FastAPI/Axios.
 * Menjamin nilai kembalian SELALU berupa string aman (tidak pernah objek/array yang
 * menyebabkan React crash 'Objects are not valid as a React child').
 *
 * @param {any} err - Error object, Axios error, string, dll.
 * @returns {string} String pesan error tunggal
 */
export function extractApiError(err) {
  if (!err) return "Terjadi kesalahan yang tidak diketahui.";
  if (typeof err === "string") return err;

  const data = err.response?.data;

  // 1. Tangani detail dari FastAPI/Pydantic
  if (data?.detail !== undefined && data?.detail !== null) {
    const detail = data.detail;
    if (typeof detail === "string") return detail;

    // Array of Pydantic validation errors: [{ type, loc: ["body", "lng"], msg: "Field required", input }]
    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => {
          if (!item) return "";
          if (typeof item === "string") return item;
          const locStr = Array.isArray(item.loc)
            ? item.loc.filter((part) => part !== "body").join(".")
            : "";
          const msg = item.msg || item.message || JSON.stringify(item);
          return locStr ? `${locStr}: ${msg}` : msg;
        })
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join("; ");
      }
    }

    if (typeof detail === "object") {
      return detail.message || detail.error || JSON.stringify(detail);
    }
  }

  // 2. Tangani message di level root respon
  if (data?.message && typeof data.message === "string") {
    return data.message;
  }

  // 3. Fallback ke error.message atau toString
  if (err.message && typeof err.message === "string") {
    return err.message;
  }

  return "Terjadi kesalahan saat memproses permintaan.";
}


