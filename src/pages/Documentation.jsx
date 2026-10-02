import React, { useState, useEffect, useMemo } from 'react'
import DocumentationTemplate from '../docs/components/templates/DocumentationTemplate'
import FeatureSection from '../docs/components/organisms/FeatureSection'
import EndpointCard from '../docs/components/organisms/EndpointCard'
import Callout from '../docs/components/molecules/Callout'
import StepList from '../docs/components/molecules/StepList'
import LanguageTabs from '../docs/components/molecules/LanguageTabs'
import CodeBlock from '../docs/components/atoms/CodeBlock'
import DocBadge from '../docs/components/atoms/DocBadge'
import { useLanguage } from '../context/LanguageContext'

// ── Structured Content Data Getters ──
import { getQuickstartContent } from '../docs/content/quickstart'
import { getDashboardGuideContent } from '../docs/content/dashboardGuide'
import { getFormatsAndLimitsContent } from '../docs/content/formatsAndLimits'
import { getApiReferenceContent } from '../docs/content/apiReference'
import { getCodeExamplesContent } from '../docs/content/codeExamples'
import { getTroubleshootingContent } from '../docs/content/troubleshooting'
import { getChangelogContent } from '../docs/content/changelog'

export default function Documentation() {
  const { currentLanguage, t } = useLanguage()

  const appName = import.meta.env.VITE_APP_NAME || 'AstraGIS'
  const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const microBase = import.meta.env.VITE_GEOSERVER_MICROSERVICE_URL || 'http://localhost:8005'
  const geoserverWms = import.meta.env.VITE_GEOSERVER_WMS_URL || 'http://localhost:8080/geoserver/wms'

  const [activeNavId, setActiveNavId] = useState('quickstart')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    document.title = `${t('officialDocumentation')} | ${appName}`
  }, [appName, currentLanguage, t])

  // Reactive localized content
  const quickstartContent = useMemo(() => getQuickstartContent(currentLanguage), [currentLanguage])
  const dashboardGuideContent = useMemo(() => getDashboardGuideContent(currentLanguage), [currentLanguage])
  const formatsAndLimitsContent = useMemo(() => getFormatsAndLimitsContent(currentLanguage), [currentLanguage])
  const apiReferenceContent = useMemo(() => getApiReferenceContent(currentLanguage), [currentLanguage])
  const codeExamplesContent = useMemo(() => getCodeExamplesContent(currentLanguage), [currentLanguage])
  const troubleshootingContent = useMemo(() => getTroubleshootingContent(currentLanguage), [currentLanguage])
  const changelogContent = useMemo(() => getChangelogContent(currentLanguage), [currentLanguage])

  // Nav Items definition
  const rawNavItems = useMemo(() => [
    {
      id: 'quickstart',
      title: t('navDocQuickstart'),
      badge: t('badgeStart'),
      subItems: [
        { id: 'quickstart-user', title: t('navDocUserTrack') },
        { id: 'quickstart-dev', title: t('navDocDevTrack') }
      ]
    },
    {
      id: 'dashboard-guide',
      title: t('navDocDashboardGuide'),
      subItems: [
        { id: 'guide-workspace', title: t('navDocWorkspaceMgmt') },
        { id: 'guide-upload', title: t('navDocUploadLayer') },
        { id: 'guide-map', title: t('navDocMapVisual') },
        { id: 'guide-delete', title: t('navDocDeleteLayer') }
      ]
    },
    {
      id: 'formats-limits',
      title: t('navDocFormatsLimits'),
      subItems: [
        { id: 'formats-supported', title: t('navDocSupportedFiles') },
        { id: 'formats-crs', title: t('navDocCrs') },
        { id: 'formats-limits-table', title: t('navDocLimitsTable') },
        { id: 'formats-duplicate', title: t('navDocDuplicateNames') }
      ]
    },
    {
      id: 'api-reference',
      title: t('navDocApiRef'),
      badge: 'REST',
      subItems: [
        { id: 'api-ingest-upload', title: 'POST /ingest/uploads' },
        { id: 'api-ingest-batch', title: 'POST /ingest/batch-uploads' },
        { id: 'api-batch-status', title: 'POST /ingest/jobs/batch-status' },
        { id: 'api-layer-list', title: 'GET /layers/my-layers' },
        { id: 'api-layer-delete', title: 'DELETE /layers/{ws}/{layer}' },
        { id: 'api-layer-batch-delete', title: 'POST /layers/batch-delete' },
        { id: 'api-layer-groups', title: 'POST /layer-groups' },
        { id: 'api-styles-apply', title: 'POST /styles/apply' }
      ]
    },
    {
      id: 'code-examples',
      title: t('navDocCodeExamples'),
      badge: t('badgeCode'),
      subItems: [
        { id: 'code-multi-lang', title: t('navDocMultiLangSnippet') },
        { id: 'code-leaflet', title: t('navDocLeafletIntegration') }
      ]
    },
    {
      id: 'troubleshooting',
      title: t('navDocTroubleshooting'),
      subItems: [
        { id: 'trouble-http', title: t('navDocHttpStatus') },
        { id: 'trouble-faq', title: t('navDocFaq') }
      ]
    },
    {
      id: 'changelog',
      title: t('navDocChangelog'),
      badge: 'v2.0'
    }
  ], [t])

  // Filter nav items if search is active
  const filteredNavItems = useMemo(() => {
    if (!searchQuery.trim()) return rawNavItems
    const q = searchQuery.toLowerCase()
    return rawNavItems.filter((item) => {
      const matchMain = item.title.toLowerCase().includes(q)
      const matchSubs = item.subItems?.some(s => s.title.toLowerCase().includes(q))
      return matchMain || matchSubs
    })
  }, [rawNavItems, searchQuery])

  // Scroll spy with IntersectionObserver
  useEffect(() => {
    const allIds = [
      'quickstart', 'quickstart-user', 'quickstart-dev',
      'dashboard-guide', 'guide-workspace', 'guide-upload', 'guide-map', 'guide-delete',
      'formats-limits', 'formats-supported', 'formats-crs', 'formats-limits-table', 'formats-duplicate',
      'api-reference', 'api-ingest-upload', 'api-ingest-batch', 'api-batch-status',
      'api-layer-list', 'api-layer-delete', 'api-layer-batch-delete', 'api-layer-groups', 'api-styles-apply',
      'code-examples', 'code-multi-lang', 'code-leaflet',
      'troubleshooting', 'trouble-http', 'trouble-faq',
      'changelog'
    ]

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveNavId(entry.target.id)
          }
        })
      },
      { rootMargin: '-20% 0px -65% 0px' }
    )

    allIds.forEach((id) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const handleNavSelect = (id) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setActiveNavId(id)
    }
  }

  return (
    <DocumentationTemplate
      appName={appName}
      apiBase={apiBase}
      microBase={microBase}
      geoserverWms={geoserverWms}
      navItems={filteredNavItems}
      activeNavId={activeNavId}
      onNavSelect={handleNavSelect}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
    >
      {/* ── SECTION 1: MULAI CEPAT ── */}
      <section id="quickstart" className="scroll-mt-24 mb-14">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">{t('sectionNum1')}</span>
            <span className="text-xs text-slate-400">•</span>
            <DocBadge variant="info">{t('startHere')}</DocBadge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {quickstartContent.title}
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {quickstartContent.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quickstartContent.tracks.map((track) => (
            <div
              key={track.id}
              id={track.id === 'track-user' ? 'quickstart-user' : 'quickstart-dev'}
              className="scroll-mt-24 p-5 sm:p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">{t('guideTrack')}</span>
                  <DocBadge variant="success">{track.badge}</DocBadge>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-1">{track.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{track.desc}</p>
                <StepList steps={track.steps} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 2: PANDUAN DASHBOARD ── */}
      <section id="dashboard-guide" className="scroll-mt-24 mb-14">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">{t('sectionNum2')}</span>
            <span className="text-xs text-slate-400">•</span>
            <DocBadge variant="info">{t('nonTechnical')}</DocBadge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {dashboardGuideContent.title}
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {dashboardGuideContent.subtitle}
          </p>
        </div>

        <div className="space-y-8">
          {dashboardGuideContent.features.map((feat) => (
            <FeatureSection
              key={feat.id}
              id={feat.id}
              title={feat.title}
              subtitle={feat.subtitle}
              whenToUse={feat.whenToUse}
              inputs={feat.inputs}
              steps={feat.steps}
              output={feat.output}
              commonErrors={feat.commonErrors}
              tips={feat.tips}
            />
          ))}
        </div>
      </section>

      {/* ── SECTION 3: FORMAT & BATASAN SISTEM ── */}
      <section id="formats-limits" className="scroll-mt-24 mb-14">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">{t('sectionNum3')}</span>
            <span className="text-xs text-slate-400">•</span>
            <DocBadge variant="format">{t('specifications')}</DocBadge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {formatsAndLimitsContent.title}
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {formatsAndLimitsContent.subtitle}
          </p>
        </div>

        {/* 3.1 Tabel Format File */}
        <div id="formats-supported" className="scroll-mt-24 mb-8 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-1">{t('titleSupportedFormats')}</h3>
          <p className="text-xs text-slate-600 mb-4">
            {t('descSupportedFormats')}
          </p>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider text-slate-600">
                  <th className="py-2.5 px-3">{t('thFormat')}</th>
                  <th className="py-2.5 px-3">{t('thExtension')}</th>
                  <th className="py-2.5 px-3">{t('thType')}</th>
                  <th className="py-2.5 px-3">{t('thSpecialRequirements')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formatsAndLimitsContent.formats.map((f, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{f.format}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-700">{f.extensions}</td>
                    <td className="py-2.5 px-3">
                      <DocBadge variant={f.type === 'Raster' ? 'info' : 'success'}>{f.type}</DocBadge>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">{f.requirements}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3.2 Sistem Koordinat & Proyeksi */}
        <div id="formats-crs" className="scroll-mt-24 mb-8 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-1">3.2 {formatsAndLimitsContent.crsRules.title}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                {t('vectorRuleTitle')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">{formatsAndLimitsContent.crsRules.vectorRule}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                {t('rasterRuleTitle')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">{formatsAndLimitsContent.crsRules.rasterRule}</p>
            </div>
          </div>
        </div>

        {/* 3.3 Batasan Sistem & Kuota */}
        <div id="formats-limits-table" className="scroll-mt-24 mb-8 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-1">{t('titleSystemLimits')}</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-xl mt-3">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider text-slate-600">
                  <th className="py-2.5 px-3">{t('thParameter')}</th>
                  <th className="py-2.5 px-3">{t('thRule')}</th>
                  <th className="py-2.5 px-3">{t('thTechnicalExplanation')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {formatsAndLimitsContent.systemLimits.map((l, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{l.parameter}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{l.value}</td>
                    <td className="py-2.5 px-3 text-slate-600">{l.detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3.4 Duplikasi Nama */}
        <div id="formats-duplicate" className="scroll-mt-24 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-1">{formatsAndLimitsContent.duplicateNamesRule.title}</h3>
          <p className="text-xs text-slate-600 mb-3 leading-relaxed">{formatsAndLimitsContent.duplicateNamesRule.desc}</p>
          <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 text-xs font-mono leading-relaxed">
            {formatsAndLimitsContent.duplicateNamesRule.mechanism}
          </div>
        </div>
      </section>

      {/* ── SECTION 4: REFERENSI API (S2S) ── */}
      <section id="api-reference" className="scroll-mt-24 mb-14">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">{t('sectionNum4')}</span>
            <span className="text-xs text-slate-400">•</span>
            <DocBadge variant="delete">{t('developerS2s')}</DocBadge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {apiReferenceContent.title}
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {apiReferenceContent.subtitle}
          </p>
        </div>

        {/* Security Warning Notice */}
        <Callout type="danger" title={apiReferenceContent.securityNotice.title} className="mb-8">
          <p>{apiReferenceContent.securityNotice.desc}</p>
        </Callout>

        {/* List of Endpoint Cards */}
        <div className="space-y-6">
          {apiReferenceContent.endpoints.map((ep) => (
            <EndpointCard
              key={ep.id}
              id={ep.id}
              method={ep.method}
              path={ep.path}
              title={ep.title}
              description={ep.description}
              params={ep.params}
              bodyParams={ep.bodyParams}
              examples={ep.examples}
              response={ep.response}
              swaggerUrl={`${microBase}/api/v1/docs`}
            />
          ))}
        </div>
      </section>

      {/* ── SECTION 5: CONTOH KODE ── */}
      <section id="code-examples" className="scroll-mt-24 mb-14">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">{t('sectionNum5')}</span>
            <span className="text-xs text-slate-400">•</span>
            <DocBadge variant="put">{t('multiLanguage')}</DocBadge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {codeExamplesContent.title}
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {codeExamplesContent.subtitle}
          </p>
        </div>

        <div id="code-multi-lang" className="scroll-mt-24 mb-8">
          <h3 className="text-base font-bold text-slate-800 mb-2">{t('titleIngestSnippet')}</h3>
          <p className="text-xs text-slate-600 mb-3">
            {t('descIngestSnippet')}
          </p>
          <LanguageTabs examples={codeExamplesContent.examples} defaultLang="curl" />
        </div>

        <div id="code-leaflet" className="scroll-mt-24 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-1">{t('titleRenderWms')}</h3>
          <p className="text-xs text-slate-600 mb-3">
            {t('descRenderWms')}
          </p>
          <CodeBlock
            code={`// 1. Tampilkan Layer di Leaflet.js
const wmsUrl = "${geoserverWms}";
const layerName = "ws_mitigasi_bencana:ras_peta_curah_hujan_a1b2c3";

const leafletLayer = L.tileLayer.wms(wmsUrl, {
  layers: layerName,
  format: "image/png",
  transparent: true,
  version: "1.1.1",
  attribution: "AstraGIS GeoServer"
}).addTo(map);

// 2. Tampilkan Layer di OpenLayers
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';

const olLayer = new TileLayer({
  source: new TileWMS({
    url: wmsUrl,
    params: { 'LAYERS': layerName, 'TILED': true },
    serverType: 'geoserver',
    transition: 0,
  }),
});
map.addLayer(olLayer);`}
            language="javascript"
            title="Integrasi WebGIS (Leaflet & OpenLayers)"
          />
        </div>
      </section>

      {/* ── SECTION 6: PEMECAHAN MASALAH ── */}
      <section id="troubleshooting" className="scroll-mt-24 mb-14">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">{t('sectionNum6')}</span>
            <span className="text-xs text-slate-400">•</span>
            <DocBadge variant="warning">{t('quickSolutions')}</DocBadge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {troubleshootingContent.title}
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {troubleshootingContent.subtitle}
          </p>
        </div>

        {/* 6.1 HTTP Errors */}
        <div id="trouble-http" className="scroll-mt-24 mb-8 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-1">{t('titleHttpStatusCodes')}</h3>
          <p className="text-xs text-slate-600 mb-4">
            {t('descHttpStatusCodes')}
          </p>
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-semibold uppercase text-[10px] tracking-wider text-slate-600">
                  <th className="py-2.5 px-3">{t('thHttpCode')}</th>
                  <th className="py-2.5 px-3">{t('thCommonCause')}</th>
                  <th className="py-2.5 px-3">{t('thSolutionAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {troubleshootingContent.httpErrors.map((err, i) => (
                  <tr key={i} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3">
                      <span className={`font-mono font-bold px-2 py-0.5 rounded text-xs border ${
                        err.code >= 500
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {err.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{err.cause}</td>
                    <td className="py-2.5 px-3 text-slate-600 leading-relaxed">{err.solution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6.2 FAQ & Pitfalls */}
        <div id="trouble-faq" className="scroll-mt-24 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <h3 className="text-base font-bold text-slate-800 mb-3">{t('titleFaq')}</h3>
          <div className="space-y-4">
            {troubleshootingContent.commonProblems.map((prob, i) => (
              <div key={i} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <h4 className="font-semibold text-xs sm:text-sm text-slate-900 mb-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                  {prob.title}
                </h4>
                <p className="text-xs text-slate-600 mb-2 leading-relaxed">{prob.description}</p>
                <div className="text-xs font-medium text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 inline-block">
                  💡 <strong>{t('solutionLabel')}</strong> {prob.fix}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 7: RIWAYAT PERUBAHAN ── */}
      <section id="changelog" className="scroll-mt-24 mb-14">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-blue-600 tracking-wider uppercase">{t('sectionNum7')}</span>
            <span className="text-xs text-slate-400">•</span>
            <DocBadge variant="info">{t('systemVersion')}</DocBadge>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {changelogContent.title}
          </h2>
          <p className="text-sm text-slate-600 mt-1 leading-relaxed">
            {changelogContent.subtitle}
          </p>
        </div>

        <div className="space-y-6">
          {changelogContent.versions.map((ver, idx) => (
            <div key={idx} className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <span className="text-base sm:text-lg font-bold text-slate-900 font-mono">{ver.version}</span>
                  <DocBadge variant="success">{ver.badge}</DocBadge>
                </div>
                <span className="text-xs text-slate-400 font-medium">{ver.date}</span>
              </div>
              <p className="text-xs sm:text-sm font-semibold text-blue-900 mb-3 bg-blue-50/70 p-2.5 rounded-lg border border-blue-200">
                {ver.highlight}
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600">
                {ver.changes.map((ch, cIdx) => (
                  <li key={cIdx} className="flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                    <span>
                      <strong className="text-slate-800">[{ch.type}]</strong> {ch.desc}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </DocumentationTemplate>
  )
}
