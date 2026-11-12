import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Modal } from 'antd';
import { 
  Layers, 
  Scissors, 
  Palette, 
  Table2, 
  KeyRound, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Sparkles, 
  CheckCircle2, 
  Play, 
  Pause,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

// Import 5 Asset Screenshots
import imgDisplayLayer from '../../assets/display_layer_wms_wmts.PNG';
import imgClipGeotiff from '../../assets/clip_geotiff.PNG';
import imgSld from '../../assets/sld.PNG';
import imgAttributeTable from '../../assets/attribute_table_filter_coq.PNG';
import imgS2sApiKey from '../../assets/s2s_api_key.PNG';

const SLIDE_DURATION = 6000; // 6 detik per slide

const slidesData = [
  {
    id: 'display_layer',
    image: imgDisplayLayer,
    icon: Layers,
    tabKey: 'previewSlideTab1',
    badgeKey: 'previewSlide1Badge',
    titleKey: 'previewSlide1Title',
    descKey: 'previewSlide1Desc',
    featureKeys: ['previewSlide1Feat1', 'previewSlide1Feat2', 'previewSlide1Feat3'],
    mockUrl: 'console/map-viewer?service=WMS&wmts=active&z=12',
    accentColor: 'from-blue-500/20 to-sky-500/20',
    borderGlow: 'hover:border-blue-500/60',
    tagColor: 'bg-blue-500/10 text-blue-300 border-blue-500/30'
  },
  {
    id: 'clip_geotiff',
    image: imgClipGeotiff,
    icon: Scissors,
    tabKey: 'previewSlideTab2',
    badgeKey: 'previewSlide2Badge',
    titleKey: 'previewSlide2Title',
    descKey: 'previewSlide2Desc',
    featureKeys: ['previewSlide2Feat1', 'previewSlide2Feat2', 'previewSlide2Feat3'],
    mockUrl: 'analysis/raster-clip?mode=polygon_aoi&format=GeoTIFF',
    accentColor: 'from-indigo-500/20 to-teal-500/20',
    borderGlow: 'hover:border-teal-500/60',
    tagColor: 'bg-teal-500/10 text-teal-300 border-teal-500/30'
  },
  {
    id: 'sld_styler',
    image: imgSld,
    icon: Palette,
    tabKey: 'previewSlideTab3',
    badgeKey: 'previewSlide3Badge',
    titleKey: 'previewSlide3Title',
    descKey: 'previewSlide3Desc',
    featureKeys: ['previewSlide3Feat1', 'previewSlide3Feat2', 'previewSlide3Feat3'],
    mockUrl: 'symbology/vector-style?marker=svg&palette=dynamic',
    accentColor: 'from-purple-500/20 to-indigo-500/20',
    borderGlow: 'hover:border-purple-500/60',
    tagColor: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
  },
  {
    id: 'attribute_table',
    image: imgAttributeTable,
    icon: Table2,
    tabKey: 'previewSlideTab4',
    badgeKey: 'previewSlide4Badge',
    titleKey: 'previewSlide4Title',
    descKey: 'previewSlide4Desc',
    featureKeys: ['previewSlide4Feat1', 'previewSlide4Feat2', 'previewSlide4Feat3'],
    mockUrl: 'wfs/attribute-table?filter=col_query&page=1&limit=20',
    accentColor: 'from-sky-500/20 to-blue-500/20',
    borderGlow: 'hover:border-sky-500/60',
    tagColor: 'bg-sky-500/10 text-sky-300 border-sky-500/30'
  },
  {
    id: 's2s_api_key',
    image: imgS2sApiKey,
    icon: KeyRound,
    tabKey: 'previewSlideTab5',
    badgeKey: 'previewSlide5Badge',
    titleKey: 'previewSlide5Title',
    descKey: 'previewSlide5Desc',
    featureKeys: ['previewSlide5Feat1', 'previewSlide5Feat2', 'previewSlide5Feat3'],
    mockUrl: 'security/s2s-keys?auth=sha256&scope=project',
    accentColor: 'from-amber-500/20 to-blue-500/20',
    borderGlow: 'hover:border-amber-500/60',
    tagColor: 'bg-amber-500/10 text-amber-300 border-amber-500/30'
  }
];

const SystemPreviewCarousel = () => {
  const { t } = useLanguage();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const currentSlide = slidesData[activeIndex];

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % slidesData.length);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + slidesData.length) % slidesData.length);
    setProgress(0);
    startTimeRef.current = Date.now();
  }, []);

  const handleSelectTab = (idx) => {
    setActiveIndex(idx);
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  // Timer loop with smooth progress bar
  useEffect(() => {
    if (isPaused || isZoomModalOpen) return;

    startTimeRef.current = Date.now() - (progress / 100) * SLIDE_DURATION;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(pct);

      if (pct >= 100) {
        handleNext();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPaused, isZoomModalOpen, handleNext, progress]);

  return (
    <section id="preview" className="py-20 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/50 border border-blue-500/40 text-blue-300 text-xs font-semibold mb-4 backdrop-blur-sm shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>{t("previewBadge", "SYSTEM SHOWCASE")}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {t("previewTitle", "Interactive Spatial Operations in Action")}
          </h2>
          <p className="mt-4 text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed">
            {t("previewSubtitle", "Experience how the platform seamlessly manages, styles, analyzes, and broadcasts high-volume geospatial data.")}
          </p>
        </div>

        {/* Slide Feature Tabs (1-Click Switchers) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
          {slidesData.map((slide, idx) => {
            const Icon = slide.icon;
            const isActive = idx === activeIndex;
            return (
              <button
                key={slide.id}
                onClick={() => handleSelectTab(idx)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 cursor-pointer border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 scale-105'
                    : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:bg-slate-800/80 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{t(slide.tabKey, slide.id)}</span>
              </button>
            );
          })}
        </div>

        {/* Main Mockup Frame */}
        <div 
          className="relative rounded-2xl bg-slate-900/90 border border-slate-800/90 shadow-2xl overflow-hidden backdrop-blur-md group"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Top Window Bar (Mac/Browser Shell Mockup) */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-950/80 border-b border-slate-800/80">
            {/* Traffic lights */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500/80" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>

            {/* Simulated Address Pill */}
            <div className="hidden sm:flex items-center gap-2 px-4 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-slate-500">https://</span>
              <span className="text-slate-300">{currentSlide.mockUrl}</span>
            </div>

            {/* Quick Actions / Status */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsPaused(!isPaused)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title={isPaused ? "Play" : "Pause"}
              >
                {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-blue-600 text-slate-300 hover:text-white text-xs font-medium border border-slate-700/80 transition-all cursor-pointer"
                title={t("previewViewFullscreen", "View Fullscreen")}
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t("previewViewFullscreen", "Fullscreen")}</span>
              </button>
            </div>
          </div>

          {/* Carousel Image Canvas */}
          <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-950 overflow-hidden flex items-center justify-center">
            {slidesData.map((slide, idx) => {
              const isActive = idx === activeIndex;
              return (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out cursor-pointer ${
                    isActive ? 'opacity-100 z-10 pointer-events-auto' : 'opacity-0 z-0 pointer-events-none'
                  }`}
                  onClick={() => setIsZoomModalOpen(true)}
                >
                  <img
                    src={slide.image}
                    alt={t(slide.titleKey, slide.id)}
                    className="w-full h-full object-contain sm:object-cover sm:object-top transition-transform duration-700 hover:scale-[1.01]"
                    loading="lazy"
                  />
                  {/* Subtle inner dark gradient bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />
                </div>
              );
            })}

            {/* Arrow Nav Buttons (Floating) */}
            <button
              onClick={handlePrev}
              type="button"
              className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white border border-slate-700/80 backdrop-blur-md shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer"
              aria-label="Previous Slide"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              type="button"
              className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 p-2.5 sm:p-3 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white border border-slate-700/80 backdrop-blur-md shadow-xl transition-all duration-200 hover:scale-110 cursor-pointer"
              aria-label="Next Slide"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Slide Description & Key Features Bar */}
          <div className="p-5 sm:p-7 bg-slate-900/95 border-t border-slate-800/90">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              
              {/* Text Info */}
              <div className="space-y-2 max-w-3xl">
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${currentSlide.tagColor}`}>
                    {t(currentSlide.badgeKey, "Feature")}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">
                    {activeIndex + 1} / {slidesData.length}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {t(currentSlide.titleKey, currentSlide.id)}
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                  {t(currentSlide.descKey, "")}
                </p>
              </div>

              {/* Feature Bullet Points */}
              <div className="shrink-0 space-y-2 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
                {currentSlide.featureKeys.map((fk, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{t(fk, "")}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

          {/* Autoplay Progress Line Bar */}
          <div className="h-1 w-full bg-slate-800">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-teal-400 transition-[width] duration-75 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Bottom Pagination Dots */}
        <div className="flex items-center justify-center gap-2 mt-6">
          {slidesData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectTab(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === activeIndex 
                  ? 'w-8 bg-blue-500 shadow-sm shadow-blue-500/50' 
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

      </div>

      {/* Lightbox Modal for High-Resolution View */}
      <Modal
        open={isZoomModalOpen}
        onCancel={() => setIsZoomModalOpen(false)}
        footer={null}
        width="94vw"
        centered
        destroyOnClose
        styles={{
          content: {
            backgroundColor: '#020617',
            border: '1px solid #1e293b',
            borderRadius: '16px',
            padding: '16px',
            color: '#f8fafc'
          }
        }}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentSlide.tagColor}`}>
                {t(currentSlide.badgeKey, "Feature")}
              </span>
              <h4 className="text-base sm:text-lg font-bold text-white">
                {t(currentSlide.titleKey, currentSlide.id)}
              </h4>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {activeIndex + 1} / {slidesData.length}
            </span>
          </div>

          <div className="relative max-h-[82vh] overflow-auto rounded-lg bg-slate-950 flex items-center justify-center p-2">
            <img
              src={currentSlide.image}
              alt={t(currentSlide.titleKey, currentSlide.id)}
              className="max-w-full max-h-[78vh] object-contain rounded shadow-2xl"
            />
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
            <p className="line-clamp-1">{t(currentSlide.descKey, "")}</p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrev}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                &larr; Prev
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              >
                Next &rarr;
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </section>
  );
};

export default SystemPreviewCarousel;

