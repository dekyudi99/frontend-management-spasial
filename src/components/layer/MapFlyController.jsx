import { useEffect } from "react";
import { useMap } from "react-leaflet";
import { bboxToWGS84 } from "../../utils/geoUtils";

/**
 * Controller di dalam MapContainer untuk melakukan fly-to secara halus
 * ke lokasi layer atau layer group yang sedang dipilih (berdasarkan bbox).
 */
const MapFlyController = ({ selectedLayer, selectedGroup, flyTrigger }) => {
  const map = useMap();

  useEffect(() => {
    const target = selectedLayer || selectedGroup;
    if (!target) return;

    let targetBbox = target.bbox;
    let epsg = target.epsg ?? target.srid ?? 4326;

    // Jika target adalah group dengan daftar layers, pastikan bbox dihitung dari layer anggotanya yang valid
    if (selectedGroup && Array.isArray(selectedGroup.layers) && selectedGroup.layers.length > 0) {
      const validMemberBboxes = selectedGroup.layers
        .map((l) => l.bbox)
        .filter((b) => Array.isArray(b) && b.length >= 4 && b.every((c) => Math.abs(Number(c)) <= 180));
      if (validMemberBboxes.length > 0) {
        targetBbox = [
          Math.min(...validMemberBboxes.map((b) => Number(b[0]))),
          Math.min(...validMemberBboxes.map((b) => Number(b[1]))),
          Math.max(...validMemberBboxes.map((b) => Number(b[2]))),
          Math.max(...validMemberBboxes.map((b) => Number(b[3]))),
        ];
        epsg = 4326;
      }
    }

    if (!targetBbox) return;

    bboxToWGS84(targetBbox, epsg).then(({ minLng, minLat, maxLng, maxLat }) => {
      if (
        [minLng, minLat, maxLng, maxLat].some((v) => v == null || isNaN(v)) ||
        minLng < -180 || maxLng > 180 || minLat < -85 || maxLat > 85
      ) {
        console.warn("MapFlyController: Koordinat bbox di luar batas WGS84 diabaikan:", { minLng, minLat, maxLng, maxLat });
        return;
      }

      const south = Math.min(minLat, maxLat);
      const north = Math.max(minLat, maxLat);
      const west = Math.min(minLng, maxLng);
      const east = Math.max(minLng, maxLng);

      if (west === east && south === north) {
        map.flyTo([south, west], 14, { duration: 1.2 });
      } else {
        // Batasi rentang flyToBounds agar tidak zoom out terlalu ekstrem
        map.flyToBounds(
          [[south, west], [north, east]],
          { duration: 1.2, padding: [45, 45], maxZoom: 16 }
        );
      }
    });
  }, [selectedLayer?.id, selectedGroup?.id, flyTrigger]);

  return null;
};

export default MapFlyController;
