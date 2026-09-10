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

export const GEOTIFF_CONFIG = {
  bgColor: "bg-amber-100",
  textColor: "text-amber-700",
  borderColor: "border-amber-200",
  badgeBg: "bg-amber-100",
  badgeText: "text-amber-700",
  dotColor: "bg-amber-400",
  label: "GeoTIFF",
};

export const getTypeConfig = () => GEOTIFF_CONFIG;
