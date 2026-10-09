import { useState, useRef, useEffect } from "react";
import L from "leaflet";
import { BASE_LAYERS } from "../../constants/layers";
import { useLanguage } from "../../context/LanguageContext";

const LayerBaseControl = ({ activeLayer = "osm", onSelectLayer }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const mainThumbLayer =
    BASE_LAYERS[activeLayer] || BASE_LAYERS.osm;

  const getLayerDisplayName = (layerId) => {
    switch (layerId) {
      case "osm":
        return t("baseLayerStandard", "Standar");
      case "satellite":
        return t("baseLayerSatellite", "Satelit");
      case "terrain":
        return t("baseLayerTerrain", "Medan");
      default:
        return layerId;
    }
  };

  const activeLayerName = getLayerDisplayName(mainThumbLayer.id);

  // Nonaktifkan propagasi event klik/scroll ke Leaflet map di baliknya
  useEffect(() => {
    if (containerRef.current) {
      L.DomEvent.disableClickPropagation(containerRef.current);
      L.DomEvent.disableScrollPropagation(containerRef.current);
    }
  }, []);

  // Tutup popup jika user klik di luar area kontrol (termasuk tap di mobile)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("pointerdown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Hanya jalankan hover pada desktop mouse (bukan touch device / mobile)
  const handlePointerEnter = (e) => {
    if (e.pointerType === "touch") return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover)").matches
    ) {
      setIsOpen(true);
    }
  };

  const handlePointerLeave = (e) => {
    if (e.pointerType === "touch") return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(hover: hover)").matches
    ) {
      setIsOpen(false);
    }
  };

  // Klik thumbnail selalu membuka/menutup menu (wajib untuk mobile touchscreen)
  const handleThumbnailClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (layerId) => {
    if (onSelectLayer) {
      onSelectLayer(layerId);
    }
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className="absolute bottom-5 left-4 z-[950] flex items-end gap-1.5 sm:gap-2 max-w-[calc(100vw-1.5rem)] pointer-events-auto select-none"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
    >
      {/* Tombol Utama (Thumbnail Kotak persis Google Maps) */}
      <button
        type="button"
        onClick={handleThumbnailClick}
        className={`relative group w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden border-2 shadow-xl cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none shrink-0 ${
          isOpen
            ? "border-blue-600 ring-2 ring-blue-500/40 shadow-blue-500/20"
            : "border-white hover:border-blue-400"
        }`}
        title={`${t("switchBaseLayer", "Ganti peta dasar:")} ${activeLayerName}`}
        aria-label={t("switchBaseLayer", "Ganti peta dasar")}
      >
        <img
          src={mainThumbLayer.preview}
          alt={activeLayerName}
          className="w-full h-full object-cover group-hover:brightness-95 transition-all pointer-events-none"
        />
        {/* Label di bawah thumbnail */}
        <span className="absolute inset-x-0 bottom-0 py-0.5 text-center text-[9px] sm:text-[10px] font-semibold text-white bg-black/60 backdrop-blur-xs truncate px-1">
          {activeLayerName}
        </span>
      </button>

      {/* Menu Pop-up Pilihan Layer yang Muncul Saat di-Klik atau di-Hover */}
      <div
        className={`flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200/80 transition-all duration-300 origin-left overflow-x-auto max-w-[calc(100vw-5.5rem)] sm:max-w-none ${
          isOpen
            ? "opacity-100 scale-100 pointer-events-auto translate-x-0"
            : "opacity-0 scale-95 pointer-events-none -translate-x-2"
        }`}
      >
        {Object.values(BASE_LAYERS).map((layer) => {
          const isActive = activeLayer === layer.id;
          const displayName = getLayerDisplayName(layer.id);
          return (
            <button
              key={layer.id}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect(layer.id);
              }}
              className="flex flex-col items-center gap-1 group cursor-pointer focus:outline-none shrink-0 p-0.5"
            >
              <div
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                  isActive
                    ? "border-blue-600 ring-2 ring-blue-500/40 scale-105 shadow-md"
                    : "border-transparent group-hover:border-slate-300 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                }`}
              >
                <img
                  src={layer.preview}
                  alt={displayName}
                  className="w-full h-full object-cover pointer-events-none"
                />
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-medium transition-colors truncate max-w-[56px] text-center ${
                  isActive
                    ? "text-blue-700 font-bold"
                    : "text-slate-600 group-hover:text-slate-900"
                }`}
              >
                {displayName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LayerBaseControl;
