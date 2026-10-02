import L from "leaflet";
import proj4 from "proj4";

// Fix Leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Cache definisi proj4 agar tidak fetch berkali-kali untuk EPSG yang sama
const epsgCache = {
  3857: "+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs",
  32647: "+proj=utm +zone=47 +datum=WGS84 +units=m +no_defs",
  32648: "+proj=utm +zone=48 +datum=WGS84 +units=m +no_defs",
  32748: "+proj=utm +zone=48 +south +datum=WGS84 +units=m +no_defs",
  32749: "+proj=utm +zone=49 +south +datum=WGS84 +units=m +no_defs",
  32750: "+proj=utm +zone=50 +south +datum=WGS84 +units=m +no_defs",
};

export function normalizeBbox(bbox) {
  if (!bbox) return null;
  if (Array.isArray(bbox) && bbox.length >= 4) {
    const parsed = bbox.map(Number);
    return parsed.some(isNaN) ? null : parsed;
  }
  if (typeof bbox === "object") {
    const minx = bbox.left ?? bbox.minx ?? bbox.minLng ?? bbox.west;
    const miny = bbox.bottom ?? bbox.miny ?? bbox.minLat ?? bbox.south;
    const maxx = bbox.right ?? bbox.maxx ?? bbox.maxLng ?? bbox.east;
    const maxy = bbox.top ?? bbox.maxy ?? bbox.maxLat ?? bbox.north;
    if (minx != null && miny != null && maxx != null && maxy != null) {
      const arr = [Number(minx), Number(miny), Number(maxx), Number(maxy)];
      return arr.some(isNaN) ? null : arr;
    }
  }
  return null;
}

export async function bboxToWGS84(rawBbox, epsg) {
  const bbox = normalizeBbox(rawBbox);
  if (!bbox) {
    return { minLng: NaN, minLat: NaN, maxLng: NaN, maxLat: NaN };
  }
  const [minx, miny, maxx, maxy] = bbox;

  // Jika sudah dalam rentang WGS84 (-180..180, -90..90) atau EPSG 4326
  if (
    epsg === 4326 ||
    epsg === "4326" ||
    !epsg ||
    (minx >= -180 && maxx <= 180 && miny >= -90 && maxy <= 90)
  ) {
    return { minLng: minx, minLat: miny, maxLng: maxx, maxLat: maxy };
  }

  const epsgKey = String(epsg);
  if (!epsgCache[epsgKey]) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`https://epsg.io/${epsgKey}.proj4`, { signal: controller.signal });
      clearTimeout(timer);
      if (!res.ok) throw new Error(`EPSG:${epsgKey} not found`);
      epsgCache[epsgKey] = await res.text();
    } catch (e) {
      console.warn(`Failed to fetch definition for EPSG:${epsgKey}:`, e);
      return { minLng: NaN, minLat: NaN, maxLng: NaN, maxLat: NaN };
    }
  }

  try {
    proj4.defs(`EPSG:${epsgKey}`, epsgCache[epsgKey]);
    const [minLng, minLat] = proj4(`EPSG:${epsgKey}`, "EPSG:4326", [minx, miny]);
    const [maxLng, maxLat] = proj4(`EPSG:${epsgKey}`, "EPSG:4326", [maxx, maxy]);

    if (minLat < -90 || maxLat > 90 || minLng < -180 || maxLng > 180) {
      return { minLng: NaN, minLat: NaN, maxLng: NaN, maxLat: NaN };
    }
    return { minLng, minLat, maxLng, maxLat };
  } catch (err) {
    console.warn(`Projection error for EPSG:${epsgKey}:`, err);
    return { minLng: NaN, minLat: NaN, maxLng: NaN, maxLat: NaN };
  }
}

export const GEOTIFF_CONFIG = {
  bgColor: "bg-amber-50",
  textColor: "text-amber-700",
  borderColor: "border-amber-200",
  badgeBg: "bg-amber-100",
  badgeText: "text-amber-800",
  dotColor: "bg-amber-500",
  label: "TIF",
  isVector: false,
};

export const SHAPEFILE_CONFIG = {
  bgColor: "bg-emerald-50",
  textColor: "text-emerald-700",
  borderColor: "border-emerald-200",
  badgeBg: "bg-emerald-100",
  badgeText: "text-emerald-800",
  dotColor: "bg-emerald-500",
  label: "SHP",
  isVector: true,
};

export const GEOJSON_CONFIG = {
  bgColor: "bg-blue-50",
  textColor: "text-blue-700",
  borderColor: "border-blue-200",
  badgeBg: "bg-blue-100",
  badgeText: "text-blue-800",
  dotColor: "bg-blue-500",
  label: "GeoJSON",
  isVector: true,
};

export const GEOPACKAGE_CONFIG = {
  bgColor: "bg-purple-50",
  textColor: "text-purple-700",
  borderColor: "border-purple-200",
  badgeBg: "bg-purple-100",
  badgeText: "text-purple-800",
  dotColor: "bg-purple-500",
  label: "GeoPackage",
  isVector: true,
};

export const CSV_CONFIG = {
  bgColor: "bg-pink-50",
  textColor: "text-pink-700",
  borderColor: "border-pink-200",
  badgeBg: "bg-pink-100",
  badgeText: "text-pink-800",
  dotColor: "bg-pink-500",
  label: "CSV",
  isVector: true,
};

export const KML_CONFIG = {
  bgColor: "bg-sky-50",
  textColor: "text-sky-700",
  borderColor: "border-sky-200",
  badgeBg: "bg-sky-100",
  badgeText: "text-sky-800",
  dotColor: "bg-sky-500",
  label: "KML",
  isVector: true,
};

export const KMZ_CONFIG = {
  bgColor: "bg-cyan-50",
  textColor: "text-cyan-700",
  borderColor: "border-cyan-200",
  badgeBg: "bg-cyan-100",
  badgeText: "text-cyan-800",
  dotColor: "bg-cyan-500",
  label: "KMZ",
  isVector: true,
};

export const VECTOR_GENERIC_CONFIG = {
  bgColor: "bg-teal-50",
  textColor: "text-teal-700",
  borderColor: "border-teal-200",
  badgeBg: "bg-teal-100",
  badgeText: "text-teal-800",
  dotColor: "bg-teal-500",
  label: "SHP",
  isVector: true,
};

export const getTypeConfig = (dataType = "", layerType = "", layer = null) => {
  const normData = String(
    dataType || 
    (layer && (layer.file_format || layer.data_type || layer.file_path)) || 
    ""
  ).toLowerCase();
  const normLayer = String(
    layerType || 
    (layer && layer.layer_type) || 
    ""
  ).toLowerCase();

  if (normData.includes("kmz")) {
    return KMZ_CONFIG;
  }
  if (normData.includes("kml")) {
    return KML_CONFIG;
  }
  if (normData.includes("csv")) {
    return CSV_CONFIG;
  }
  if (normData.includes("geojson") || normData.includes("json")) {
    return GEOJSON_CONFIG;
  }
  if (normData.includes("shapefile") || normData.includes("shp") || normData.includes("zip")) {
    return SHAPEFILE_CONFIG;
  }
  if (normData.includes("geopackage") || normData.includes("gpkg")) {
    return GEOPACKAGE_CONFIG;
  }
  if (normData.includes("tif") || normData.includes("tiff") || normLayer === "raster") {
    return GEOTIFF_CONFIG;
  }
  if (normLayer === "vector" || normData.includes("vector")) {
    return SHAPEFILE_CONFIG;
  }
  return GEOTIFF_CONFIG;
};
