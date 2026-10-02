import { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Row,
  Col,
  Card,

  Button,
  Tag,
  Tabs,
  Timeline,
  Empty,
  Spin,
  message,
} from 'antd'
import {
  Folder,
  Layers,
  Globe,
  Key,
  Plus,
  ArrowUpRight,
  Activity,
  Server,
  CheckCircle2,
  ExternalLink,
  FileCode,
  ShieldCheck,
  UploadCloud,
  Clock,
  Eye,
  Sparkles,
  Lock,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import workspaceApi from '../api/WorkspaceApi'
import keyApi from '../api/KeyApi'
import layerApi from '../api/LayerApi'
import infoApi from '../api/InfoApi'
import WorkspaceModal from '../components/WorkspaceModal'
import LayerModal from '../components/LayerModal'
import { formatDate } from '../utils/formatters'
import CardCountDashboard from '../components/CardCountDashboard'
import QuickActionsCard from '../components/QuickActionsCard'
import RecentWorkspaceList from '../components/RecentWorkspaceList'
import { useLanguage } from '../context/LanguageContext'

const appName = import.meta.env.VITE_APP_NAME || 'AstraGIS'
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const apiDocsUrl = import.meta.env.VITE_API_DOCS || 'http://localhost:8000/docs'
const geoserverWmsUrl = import.meta.env.VITE_GEOSERVER_WMS_URL || 'http://localhost:8080/geoserver/wms'

const Dashboard = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { t, language } = useLanguage()

  // Modal states
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false)
  const [layerModalOpen, setLayerModalOpen] = useState(false)

  useEffect(() => {
    document.title = `${t('dashboardTitle', 'Dashboard')} | ${appName}`
  }, [language, t])

  // 1. Fetch My API Key
  const {
    data: keyResponse,
    isLoading: isLoadingKey,
  } = useQuery({
    queryKey: ['dashboard-my-key'],
    queryFn: () => keyApi.getMyKey(),
    staleTime: 1000 * 60,
  })

  const keyData = keyResponse?.data
  const isApiKeyActive = Boolean(keyData?.is_active)
  const isKeyDisabled = !isLoadingKey && keyData && keyData.is_active === false

  // 2. Fetch Workspaces dari GeoServer Microservice (hanya jika key AKTIF)
  const {
    data: workspaceResponse,
    isLoading: isLoadingWorkspaces,
    isError: isErrorWorkspaces,
  } = useQuery({
    queryKey: ['dashboard-workspaces', isApiKeyActive],
    queryFn: () => workspaceApi.list(),
    enabled: isApiKeyActive,
    staleTime: 1000 * 30,
  })

  // 3. Fetch Layers (hanya jika key AKTIF)
  const {
    data: layerResponse,
    isLoading: isLoadingLayers,
    isError: isErrorLayers,
  } = useQuery({
    queryKey: ['dashboard-layers', isApiKeyActive],
    queryFn: () => layerApi.list({ page: 1, size: 5 }),
    enabled: isApiKeyActive,
    staleTime: 1000 * 30,
  })

  // 4. Fetch GeoServer Version / Info
  const {
    data: infoResponse,
    isLoading: isLoadingInfo,
  } = useQuery({
    queryKey: ['dashboard-system-info'],
    queryFn: () => infoApi.getVersion(),
    retry: 1,
    staleTime: 1000 * 60,
  })

  // Kalkulasi agregat data
  const workspaces = useMemo(() => workspaceResponse?.data?.data || [], [workspaceResponse])
  const totalWorkspaces = useMemo(() => workspaceResponse?.data?.total ?? workspaces.length, [workspaceResponse, workspaces])
  const recentWorkspaces = useMemo(() => workspaces.slice(0, 5), [workspaces])

  const recentLayers = useMemo(() => layerResponse?.data?.data || [], [layerResponse])
  const totalLayers = layerResponse?.data?.pagination?.total ?? recentLayers.length

  const geoVersion = infoResponse?.data || null

  // Refresh all dashboard queries on create
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-workspaces'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-layers'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-my-key'] })
    queryClient.invalidateQueries({ queryKey: ['workspaces-list'] })
    queryClient.invalidateQueries({ queryKey: ['layers'] })
  }

  // Generate Activity Timeline dari recent layers & workspaces
  const activityItems = useMemo(() => {
    const items = []

    recentLayers.forEach((l) => {
      items.push({
        time: l.created_at,
        dot: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        content: (
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-slate-800">{l.layer_name}</span>{' '}
            {t('publishedToWorkspace', 'dipublikasikan ke workspace')}{' '}
            <Tag color="blue" className="!text-xs">{l.workspace_name}</Tag>
            <div className="text-slate-400 text-xs mt-0.5">{formatDate(l.created_at, language)}</div>
          </div>
        ),
      })
    })

    recentWorkspaces.forEach((w) => {
      items.push({
        time: w.created_at || w.dateCreated,
        dot: <Folder className="w-4 h-4 text-blue-500" />,
        content: (
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-slate-800">{w.name || w.ws_name}</span>{' '}
            {t('workspaceCreatedActivity', 'workspace dibuat')}
            <div className="text-slate-400 text-xs mt-0.5">{formatDate(w.created_at || w.dateCreated, language)}</div>
          </div>
        ),
      })
    })

    // Urutkan berdasarkan waktu descending
    return items
      .sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0))
      .slice(0, 6)
      .map((item) => ({
        dot: item.dot,
        children: item.content,
      }))
  }, [recentLayers, recentWorkspaces, language, t])

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 text-slate-800">
      {/* ── 1. HEADER & WELCOME BANNER ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute right-0 -bottom-10 opacity-10 pointer-events-none">
          <Globe className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-blue-200 mb-3 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('commandCenterBadge', 'Spatial Command Center & API Gateway')}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              {t('welcomeToApp', { app: appName })}
            </h1>
            <p className="text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
              {t('dashboardHeroDesc', 'Spatial management command center: manage GeoServer workspaces, publish raster/vector layers, and automate System-to-System (S2S) integrations.')}
            </p>
          </div>

          {/* Action buttons in Header */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="primary"
              icon={isKeyDisabled ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              size="large"
              disabled={isKeyDisabled}
              className={`!border-none !font-medium !shadow-md !h-11 !px-5 ${isKeyDisabled ? '!bg-slate-400 !cursor-not-allowed text-white' : '!bg-blue-600 hover:!bg-blue-500'}`}
              onClick={() => {
                if (isKeyDisabled) {
                  message.warning(t('accessGeoServerDeactivated', "Akses GeoServer dinonaktifkan. Hubungi Admin."));
                  return;
                }
                setWorkspaceModalOpen(true);
              }}
            >
              {t('newWorkspaceBtn', 'New Workspace')}
            </Button>
            <Button
              icon={isKeyDisabled ? <Lock className="w-4 h-4" /> : <UploadCloud className="w-4 h-4" />}
              size="large"
              disabled={isKeyDisabled}
              className={`!text-white !backdrop-blur-md !font-medium !h-11 !px-5 ${isKeyDisabled ? '!bg-white/10 !border-white/10 !cursor-not-allowed opacity-60' : '!bg-white/15 hover:!bg-white/25 !border-white/30'}`}
              onClick={() => {
                if (isKeyDisabled) {
                  message.warning(t('accessGeoServerDeactivated', "Akses GeoServer dinonaktifkan. Hubungi Admin."));
                  return;
                }
                setLayerModalOpen(true);
              }}
            >
              {t('publishLayerBtn', 'Publish Layer')}
            </Button>
          </div>
        </div>
      </div>

      {/* ── 1.5. WARNING BANNER JIKA API KEY NONAKTIF ───────────────────────── */}
      {isKeyDisabled && (
        <div className="bg-rose-50 border-2 border-rose-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950">{t('accessGeoServerDeactivated', 'Akses GeoServer Microservice Dinonaktifkan')}</h3>
              <p className="text-xs sm:text-sm text-rose-700 mt-0.5">
                {t('accessDeactivatedHeroDesc', 'API Key Anda saat ini berstatus Nonaktif. Seluruh operasi (melihat & menghitung workspace, publishing layer, dan integrasi S2S) ditangguhkan hingga Administrator mengaktifkannya kembali.')}
              </p>
            </div>
          </div>
          <Button
            type="primary"
            danger
            onClick={() => navigate('/dashboard/api-key')}
            className="!font-medium shrink-0"
          >
            {t('checkApiKey', 'Periksa API Key')}
          </Button>
        </div>
      )}

      {/* ── 2. TOP STATS CARDS (3 Cards filling grid evenly) ───────────────────── */}
      <Row gutter={[16, 16]}>
        {/* Card 1: Workspace */}
        <CardCountDashboard
          name={t('menuWorkspace', 'Workspaces')}
          icon={<Layers className="w-5 h-5" />}
          count={totalWorkspaces}
          isLoading={isLoadingWorkspaces || isLoadingKey}
          isLocked={isKeyDisabled}
          navigate={navigate}
          linkTo={isKeyDisabled ? "/dashboard/api-key" : "/dashboard/workspace"}
          description={isKeyDisabled ? t('workspaceCountDescLocked', "Akses ke GeoServer dinonaktifkan oleh Admin") : t('workspaceCountDesc', "Ruang kerja aktif di GeoServer Microservice")}
          color="indigo"
          lg={8}
        />

        {/* Card 2: Spatial Layers */}
        <CardCountDashboard
          name={t('layers', 'Layers')}
          icon={<Globe className="w-5 h-5" />}
          count={totalLayers}
          isLoading={isLoadingLayers || isLoadingKey}
          isLocked={isKeyDisabled}
          navigate={navigate}
          linkTo={isKeyDisabled ? "/dashboard/api-key" : "/dashboard/layer"}
          description={isKeyDisabled ? t('workspaceCountDescLocked', "Akses ke GeoServer dinonaktifkan oleh Admin") : t('layerCountDesc', "Published GeoTIFF & WMS layers")}
          color="emerald"
          lg={8}
        />

        {/* Card 3: API Key (Status: True/False) */}
        <CardCountDashboard
          name={t('menuApiKey', 'API Key (S2S)')}
          icon={<Key className="w-5 h-5" />}
          isStatus={true}
          statusValue={isApiKeyActive}
          isLoading={isLoadingKey}
          navigate={navigate}
          linkTo="/dashboard/api-key"
          description={t('apiKeyCountDesc', "Kredensial akses GeoServer Microservice")}
          color="amber"
          lg={8}
        />
      </Row>

      {/* ── 3. MIDDLE SECTION: RECENT ACTIVITY & QUICK ACTIONS ──────────────── */}
      <Row gutter={[20, 20]}>
        {/* Kolom Kiri (16 Col): Tabs Data Terbaru & Aktivitas */}
        <Col xs={24} lg={16}>
          <Card
            className="!rounded-2xl !border-slate-200/80 !shadow-xs h-full"
            styles={{ body: { padding: '20px 24px' } }}
          >
            <Tabs
              defaultActiveKey="layers"
              tabBarExtraContent={
                <Link
                  to="/dashboard/layer"
                  className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  {t('viewAllLayers', 'View All Layers')} <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              }
              items={[
                {
                  key: 'layers',
                  label: (
                    <span className="flex items-center gap-2 font-medium">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      {t('recentLayers', 'Recent Layers')}
                    </span>
                  ),
                  children: (
                    <div className="pt-2">
                      {isKeyDisabled ? (
                        <div className="py-10 text-center">
                          <Empty
                            description={
                              <span className="text-slate-500 font-medium">
                                {t('accessDeactivatedHeroDesc', 'Akses GeoServer Microservice ditangguhkan (API Key Nonaktif).')}
                              </span>
                            }
                          />
                        </div>
                      ) : isLoadingLayers ? (
                        <div className="py-12 flex justify-center">
                          <Spin tip={t('loadingRecentLayers', 'Loading recent layers...')} />
                        </div>
                      ) : recentLayers.length === 0 ? (
                        <div className="py-10 text-center">
                          <Empty description={t('noLayersPublishedYet', 'No layers published yet')}>
                            <Button
                              type="primary"
                              icon={<Plus className="w-4 h-4" />}
                              onClick={() => setLayerModalOpen(true)}
                              className="!bg-blue-600 mt-2"
                            >
                              {t('publishFirstLayer', 'Publish First Layer')}
                            </Button>
                          </Empty>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {recentLayers.map((layer) => (
                            <div
                              key={layer.id}
                              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/75 rounded-lg px-2 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0 mt-0.5">
                                  <Layers className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-semibold text-slate-900 text-sm">
                                      {layer.layer_name}
                                    </span>
                                    <Tag color="blue" className="!text-xs !rounded-md">
                                      {layer.workspace_display_name || layer.workspace_name}
                                    </Tag>
                                    <Tag
                                      color={
                                        layer.data_type?.toLowerCase().includes("shapefile") || layer.data_type?.toLowerCase().includes("shp") ? "green" :
                                        layer.data_type?.toLowerCase().includes("geojson") ? "blue" :
                                        layer.data_type?.toLowerCase().includes("geopackage") ? "purple" :
                                        layer.data_type?.toLowerCase().includes("csv") ? "magenta" :
                                        layer.data_type?.toLowerCase().includes("kml") || layer.data_type?.toLowerCase().includes("kmz") ? "geekblue" :
                                        layer.layer_type === "vector" ? "cyan" : "gold"
                                      }
                                      className="!text-xs !rounded-md"
                                    >
                                      {layer.data_type || (layer.layer_type === "vector" ? "Vector" : "GeoTIFF")}
                                    </Tag>
                                    {layer.epsg && (
                                      <Tag className="!text-xs !rounded-md text-slate-600 bg-slate-100">
                                        EPSG:{layer.epsg}
                                      </Tag>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatDate(layer.created_at, language)}
                                  </p>
                                </div>
                              </div>

                              <Button
                                type="default"
                                size="small"
                                icon={<Eye className="w-3.5 h-3.5" />}
                                onClick={() => navigate('/dashboard/layer')}
                                className="!text-xs !font-medium self-start sm:self-auto hover:!border-blue-500 hover:!text-blue-600"
                              >
                                {t('viewOnMap', 'View on Map')}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'workspaces',
                  label: (
                    <span className="flex items-center gap-2 font-medium">
                      <Folder className="w-4 h-4 text-blue-600" />
                      {t('recentWorkspacesTab', 'Recent Workspaces')}
                    </span>
                  ),
                  children: (
                    <div className="pt-2">
                      <RecentWorkspaceList
                        workspaces={recentWorkspaces}
                        isLoading={isLoadingWorkspaces}
                        isKeyDisabled={isKeyDisabled}
                        onOpenCreateModal={() => setWorkspaceModalOpen(true)}
                        navigate={navigate}
                      />
                    </div>
                  ),
                },
                {
                  key: 'activity',
                  label: (
                    <span className="flex items-center gap-2 font-medium">
                      <Activity className="w-4 h-4 text-purple-600" />
                      {t('activityLog', 'Activity Log')}
                    </span>
                  ),
                  children: (
                    <div className="pt-4 px-2">
                      {activityItems.length === 0 ? (
                        <Empty description={t('noActivityRecorded', 'No activity recorded yet')} />
                      ) : (
                        <Timeline items={activityItems} />
                      )}
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </Col>

        {/* Kolom Kanan (8 Col): Quick Actions & S2S Integration Box */}
        <Col xs={24} lg={8}>
          <div className="space-y-4">
            {/* Quick Actions Card (DRY Component) */}
            <QuickActionsCard
              onOpenWorkspaceModal={() => setWorkspaceModalOpen(true)}
              onOpenLayerModal={() => setLayerModalOpen(true)}
              navigate={navigate}
              apiDocsUrl={apiDocsUrl}
              isKeyDisabled={isKeyDisabled}
            />

          </div>
        </Col>
      </Row>

      {/* ── 4. BOTTOM SECTION: SYSTEM STATUS & INTEGRATION GUIDES ───────────── */}
      <Row gutter={[20, 20]}>
        {/* Card Status Sistem (12 Col) */}
        <Col xs={24} md={12}>
          <Card
            title={
              <span className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Server className="w-4.5 h-4.5 text-blue-600" />
                {t('systemStatusTitle', 'System & Service Status')}
              </span>
            }
            className="!rounded-2xl !border-slate-200/80 !shadow-xs h-full"
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div className="space-y-4">
              {/* Service 1: FastAPI Backend */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">FastAPI Spatial Core</div>
                    <div className="text-xs text-slate-400">{apiBaseUrl}</div>
                  </div>
                </div>
                <Tag color="success" className="!m-0 !font-semibold">
                  OPERATIONAL
                </Tag>
              </div>

              {/* Service 2: GeoServer Engine */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">GeoServer Spatial Engine</div>
                    <div className="text-xs text-slate-400">
                      {geoVersion ? `Version ${geoVersion}` : 'WMS & WFS Service Active'}
                    </div>
                  </div>
                </div>
                <Tag color="processing" className="!m-0 !font-semibold">
                  CONNECTED
                </Tag>
              </div>

              {/* Service 3: Raster Storage Volume */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">Storage Volume (/data_raster)</div>
                    <div className="text-xs text-slate-400">Docker Shared Persistent Storage</div>
                  </div>
                </div>
                <Tag color="blue" className="!m-0 !font-semibold">
                  MOUNTED
                </Tag>
              </div>

              {/* Service 4: S2S Authentication Gateway */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/60">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">API Key Gateway (S2S)</div>
                    <div className="text-xs text-slate-400">Header X-API-Key Verification</div>
                  </div>
                </div>
                <Tag color="cyan" className="!m-0 !font-semibold">
                  READY
                </Tag>
              </div>
            </div>
          </Card>
        </Col>

        {/* Card Panduan & Integrasi Pengembang (12 Col) */}
        <Col xs={24} md={12}>
          <Card
            title={
              <span className="font-bold text-slate-800 text-base flex items-center gap-2">
                <FileCode className="w-4.5 h-4.5 text-indigo-600" />
                {t('integrationGuideTitle', 'Integration Guide & API')}
              </span>
            }
            extra={
              <Link
                to="/documentation"
                className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                {t('fullDocumentation', 'Full Documentation')} <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
            className="!rounded-2xl !border-slate-200/80 !shadow-xs h-full"
            styles={{ body: { padding: '20px 24px' } }}
          >
            <div className="space-y-3">
              {/* Item 1 */}
              <div className="p-3 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-colors bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    1. API Key Authentication
                  </span>
                  <Tag color="default" className="!text-[11px]">Header</Tag>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Send header <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">X-API-Key: agis_sk_...</code> on every S2S endpoint request without needing email &amp; password login.
                </p>
              </div>

              {/* Item 2 */}
              <div className="p-3 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-colors bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    2. Single-Band GeoTIFF Validation
                  </span>
                  <Tag color="amber" className="!text-[11px]">1-Band Required</Tag>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Raster files must be single-band (grayscale / continuous values like DEM, NDVI, Slope) for optimal SLD styling on GeoServer.
                </p>
              </div>

              {/* Item 3 */}
              <div className="p-3 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-colors bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    3. GeoServer WMS URL Format
                  </span>
                  <a
                    href={apiDocsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    API Docs <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-mono break-all bg-slate-50 p-1.5 rounded text-[11px] border border-slate-200/60">
                  {geoserverWmsUrl} (Layer: {'{workspace}:{layer_name}'})
                </p>
              </div>

              {/* Action link */}
              <div className="pt-2">
                <Button
                  block
                  type="primary"
                  className="!bg-blue-600 hover:!bg-blue-500 !font-medium"
                  onClick={() => navigate('/documentation')}
                >
                  {t('openDocPlayground', 'Open Documentation & Playground')}
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── 5. MODAL CREATE WORKSPACE & PUBLISH LAYER ───────────────────────── */}
      <WorkspaceModal
        open={workspaceModalOpen}
        onClose={() => {
          setWorkspaceModalOpen(false)
          handleRefresh()
        }}
      />

      <LayerModal
        open={layerModalOpen}
        onClose={() => {
          setLayerModalOpen(false)
          handleRefresh()
        }}
        page={1}
        pageSize={5}
        onSuccess={() => {
          handleRefresh()
          message.success('Layer added to dashboard successfully!')
        }}
      />
    </div>
  )
}

export default Dashboard