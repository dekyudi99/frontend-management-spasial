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
const epsgCache = {};

export async function bboxToWGS84(bbox, epsg) {
  const [minx, miny, maxx, maxy] = bbox;

  if (epsg === 4326 || epsg === "4326") {
    return { minLng: minx, minLat: miny, maxLng: maxx, maxLat: maxy };
  }

  if (!epsgCache[epsg]) {
    try {
      const res = await fetch(`https://epsg.io/${epsg}.proj4`);
      if (!res.ok) throw new Error(`EPSG:${epsg} not found`);
      epsgCache[epsg] = await res.text();
    } catch (e) {
      console.warn(`Failed to fetch definition for EPSG:${epsg}:`, e);
      return { minLng: minx, minLat: miny, maxLng: maxx, maxLat: maxy };
    }
  }

  proj4.defs(`EPSG:${epsg}`, epsgCache[epsg]);

  const [minLng, minLat] = proj4(`EPSG:${epsg}`, "EPSG:4326", [minx, miny]);
  const [maxLng, maxLat] = proj4(`EPSG:${epsg}`, "EPSG:4326", [maxx, maxy]);

  return { minLng, minLat, maxLng, maxLat };
}

export const GEOTIFF_CONFIG = {
  bgColor: "bg-amber-50",
  textColor: "text-amber-700",
  borderColor: "border-amber-200",
  badgeBg: "bg-amber-100",
  badgeText: "text-amber-800",
  dotColor: "bg-amber-500",
  label: "GeoTIFF",
  isVector: false,
};

export const SHAPEFILE_CONFIG = {
  bgColor: "bg-emerald-50",
  textColor: "text-emerald-700",
  borderColor: "border-emerald-200",
  badgeBg: "bg-emerald-100",
  badgeText: "text-emerald-800",
  dotColor: "bg-emerald-500",
  label: "Shapefile",
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
  label: "Vector",
  isVector: true,
};

export const getTypeConfig = (dataType = "", layerType = "") => {
  const normData = String(dataType || "").toLowerCase();
  const normLayer = String(layerType || "").toLowerCase();

  if (normData.includes("shapefile") || normData.includes("shp") || normData.includes("zip")) {
    return SHAPEFILE_CONFIG;
  }
  if (normData.includes("geojson") || normData === "json") {
    return GEOJSON_CONFIG;
  }
  if (normData.includes("geopackage") || normData.includes("gpkg")) {
    return GEOPACKAGE_CONFIG;
  }
  if (normData.includes("kmz")) {
    return KMZ_CONFIG;
  }
  if (normData.includes("kml")) {
    return KML_CONFIG;
  }
  if (normData.includes("csv")) {
    return CSV_CONFIG;
  }
  if (normLayer === "vector" || normData.includes("vector")) {
    return VECTOR_GENERIC_CONFIG;
  }
  return GEOTIFF_CONFIG;
};
