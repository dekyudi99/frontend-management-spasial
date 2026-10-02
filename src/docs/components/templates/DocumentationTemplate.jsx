import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../../../assets/logo.png'
import SidebarNav from '../organisms/SidebarNav'
import { useLanguage } from '../../../context/LanguageContext'

export default function DocumentationTemplate({
  appName = 'AstraGIS',
  apiBase = 'http://localhost:8000',
  microBase = 'http://localhost:8005',
  geoserverWms = 'http://localhost:8080/geoserver/wms',
  navItems = [],
  activeNavId = '',
  onNavSelect,
  searchQuery = '',
  onSearchChange,
  children
}) {
  const { t } = useLanguage()
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="min-h-screen bg-slate-50/60 font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white">
      {/* ── Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 bg-blue-950/95 backdrop-blur-md border-b border-blue-900/80 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          <Link to="/" className="flex items-center gap-3">
            <img src={Logo} alt="Logo" className="h-8 w-auto object-contain" />
            <span className="text-xl font-extrabold text-white tracking-tight">{appName}</span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-900/90 text-blue-200 border border-blue-700/60">
              {t("officialDocumentation", "Official Documentation")}
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href={`${microBase}/api/v1/docs`}
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1 text-xs font-semibold text-blue-200 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-blue-900/50"
            >
              <span>Swagger v1</span>
              <span>↗</span>
            </a>
            <Link
              to="/"
              className="hidden sm:inline-block text-xs font-medium text-slate-300 hover:text-white transition px-2 py-1"
            >
              {t("home", "Home")}
            </Link>
            <Link
              to="/dashboard"
              className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition-all"
            >
              {t("openDashboard", "Open Dashboard")}
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 text-white py-12 px-4 sm:px-6 border-b border-blue-900/60 shadow-inner">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-blue-200 text-xs font-semibold tracking-wide mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            {t("docKnowledgeCenter", "Knowledge Center & Technical Guide")} {appName}
          </div>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-3">
            {t("docHeroTitle", "Spatial System Documentation & Integration")}
          </h1>
          <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl mx-auto leading-relaxed mb-6 font-normal">
            {t("docHeroSubtitle", "Comprehensive guide for Dashboard Users (layer management, batch upload, map visualization) and System Developers (S2S API integration, automated publishing, and CRS standardization).")}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-slate-200 font-medium">
              {t("docBadgeArch", "v2.0 — Microservice Architecture")}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-slate-200 font-medium">
              {t("docBadgeBatch", "Batch Ingest (Max 10 Files)")}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-slate-200 font-medium">
              {t("docBadgeCrs", "EPSG:4326 & PostGIS Ready")}
            </span>
            <a
              href={`${microBase}/api/v1/docs`}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 rounded-md bg-blue-600/90 hover:bg-blue-600 text-white font-semibold transition inline-flex items-center gap-1"
            >
              <span>{t("docGeoServerDocs", "GeoServer API Docs")}</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </section>

      {/* ── Main Layout (Sidebar + Content) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col lg:flex-row gap-8 items-start">
        {/* Sidebar Nav */}
        <SidebarNav
          items={navItems}
          activeId={activeNavId}
          onSelect={onNavSelect}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        {/* Content Body */}
        <main className="flex-1 min-w-0 w-full">{children}</main>
      </div>

      {/* ── Floating Back To Top ── */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          type="button"
          title={t("backToTop", "Back to top")}
          className="fixed bottom-6 right-6 z-40 p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      )}

      {/* ── Footer ── */}
      <footer className="mt-16 border-t border-slate-200 bg-white py-8 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto space-y-2">
          <p>© {new Date().getFullYear()} {appName} — {t("docFooterPlatform", "Integrated Spatial Data Management & Visualization Platform.")}</p>
          <p>
            {t("docFooterSupport", "Supports GeoServer WMS/WFS integration, PostGIS raster & vector, and self-service API Key Management.")}
          </p>
        </div>
      </footer>
    </div>
  )
}

