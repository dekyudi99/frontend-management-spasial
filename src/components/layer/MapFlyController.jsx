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
    if (!target?.bbox) return;

    const epsg = target.epsg ?? 4326;
    const bbox = target.bbox;

    bboxToWGS84(bbox, epsg).then(({ minLng, minLat, maxLng, maxLat }) => {
      if (!minLng || !minLat || [minLng, minLat, maxLng, maxLat].some((v) => v == null || isNaN(v))) return;

      if (minLng === maxLng && minLat === maxLat) {
        map.flyTo([minLat, minLng], 14, { duration: 1.2 });
      } else {
        map.flyToBounds(
          [[minLat, minLng], [maxLat, maxLng]],
          { duration: 1.2, padding: [40, 40], maxZoom: 16 }
        );
      }
    });
  }, [selectedLayer?.id, selectedGroup?.id, flyTrigger]);

  return null;
};

export default MapFlyController;
