import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Row,
  Col,
  Card,
  Typography,
  Button,
  Tag,
  Tabs,
  Timeline,
  Empty,
  Spin,
  message,
  Tooltip,
  Badge,
} from 'antd'
import {
  FolderKanban,
  Layers,
  Globe,
  Key,
  Plus,
  ArrowUpRight,
  Activity,
  Server,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  FileCode,
  Terminal,
  ShieldCheck,
  UploadCloud,
  Clock,
  Eye,
  Database,
  Sparkles,
  Info,
} from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

import projectApi from '../api/ProjectApi'
import layerApi from '../api/LayerApi'
import infoApi from '../api/InfoApi'
import ProjectModal from '../components/ProjectModal'
import LayerModal from '../components/LayerModal'
import formatTanggal from '../utils/formatTanggal'

const { Title, Text, Paragraph } = Typography
const appName = import.meta.env.VITE_APP_NAME || 'AstraGIS'
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const apiDocsUrl = import.meta.env.VITE_API_DOCS || 'http://localhost:8000/docs'
const geoserverWmsUrl = import.meta.env.VITE_GEOSERVER_WMS_URL || 'http://localhost:8080/geoserver/wms'

const Dashboard = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Modal states
  const [projectModalOpen, setProjectModalOpen] = useState(false)
  const [layerModalOpen, setLayerModalOpen] = useState(false)
  const [copiedSnippet, setCopiedSnippet] = useState(false)

  useEffect(() => {
    document.title = `Dashboard | ${appName}`
  }, [])

  // 1. Fetch Projects (ambil hingga 100 project untuk kalkulasi statistik & list terbaru)
  const {
    data: projectResponse,
    isLoading: isLoadingProjects,
    isError: isErrorProjects,
  } = useQuery({
    queryKey: ['dashboard-projects'],
    queryFn: () => projectApi.getall({ page: 1, size: 100 }),
    staleTime: 1000 * 30,
  })

  // 2. Fetch Layers (ambil 5 layer terbaru)
  const {
    data: layerResponse,
    isLoading: isLoadingLayers,
    isError: isErrorLayers,
  } = useQuery({
    queryKey: ['dashboard-layers'],
    queryFn: () => layerApi.list({ page: 1, size: 5 }),
    staleTime: 1000 * 30,
  })

  // 3. Fetch GeoServer Version / Info
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
  const projects = useMemo(() => projectResponse?.data?.data || [], [projectResponse])
  const totalProjects = projectResponse?.data?.pagination?.total ?? projects.length

  const totalWorkspaces = useMemo(() => {
    return projects.reduce((acc, curr) => acc + (Number(curr.workspace_count) || 0), 0)
  }, [projects])

  const totalApiKeys = useMemo(() => {
    return projects.reduce((acc, curr) => acc + (Number(curr.api_key_count) || 0), 0)
  }, [projects])

  const recentLayers = useMemo(() => layerResponse?.data?.data || [], [layerResponse])
  const totalLayers = layerResponse?.data?.pagination?.total ?? recentLayers.length

  const recentProjects = useMemo(() => projects.slice(0, 5), [projects])

  const geoVersion = infoResponse?.data || null

  // Handler Copy S2S Snippet
  const handleCopySnippet = () => {
    const snippet = `curl -X POST "${apiBaseUrl}/s2s/publish" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -F "workspace_id=YOUR_WORKSPACE_ID" \\
  -F "layer_name=nama_layer" \\
  -F "file=@raster_1band.tif"`

    navigator.clipboard.writeText(snippet)
    setCopiedSnippet(true)
    message.success('S2S cURL snippet copied to clipboard!')
    setTimeout(() => setCopiedSnippet(false), 2500)
  }

  // Refresh all dashboard queries on create
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['dashboard-projects'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard-layers'] })
    queryClient.invalidateQueries({ queryKey: ['project'] })
    queryClient.invalidateQueries({ queryKey: ['layers'] })
  }

  // Generate Activity Timeline dari recent layers & projects
  const activityItems = useMemo(() => {
    const items = []

    recentLayers.forEach((l) => {
      items.push({
        time: l.created_at,
        dot: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
        content: (
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-slate-800">{l.layer_name}</span> dipublish pada workspace{' '}
            <Tag color="blue" className="!text-xs">{l.workspace_name}</Tag>
            <div className="text-slate-400 text-xs mt-0.5">{formatTanggal(l.created_at)}</div>
          </div>
        ),
      })
    })

    recentProjects.forEach((p) => {
      items.push({
        time: p.created_at,
        dot: <FolderKanban className="w-4 h-4 text-blue-500" />,
        content: (
          <div className="text-xs sm:text-sm">
            <span className="font-semibold text-slate-800">{p.project_name}</span> dibuat
            <div className="text-slate-400 text-xs mt-0.5">{formatTanggal(p.created_at)}</div>
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
  }, [recentLayers, recentProjects])

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 text-slate-800">
      {/* ── 1. HEADER & WELCOME BANNER ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        {/* Dekorasi background */}
        <div className="absolute right-0 -bottom-10 opacity-10 pointer-events-none">
          <Globe className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-blue-200 mb-3 border border-white/15">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Spatial Command Center & API Gateway</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
              Selamat Datang di {appName}
            </h1>
            <p className="text-blue-100 text-sm sm:text-base max-w-2xl leading-relaxed">
              Pusat kendali manajemen spasial: kelola project, workspace GeoServer, publikasi layer raster/vektor,
              serta integrasi System-to-System (S2S) otomatis.
            </p>
          </div>

          {/* Action buttons di Header */}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="primary"
              icon={<Plus className="w-4 h-4" />}
              size="large"
              className="!bg-blue-600 hover:!bg-blue-500 !border-none !font-medium !shadow-md !h-11 !px-5"
              onClick={() => setProjectModalOpen(true)}
            >
              New Project
            </Button>
            <Button
              icon={<UploadCloud className="w-4 h-4" />}
              size="large"
              className="!bg-white/15 hover:!bg-white/25 !text-white !border-white/30 !backdrop-blur-md !font-medium !h-11 !px-5"
              onClick={() => setLayerModalOpen(true)}
            >
              Publish Layer
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. TOP STATS CARDS (4 Cards) ──────────────────────────────────────── */}
      <Row gutter={[16, 16]}>
        {/* Card 1: Total Project */}
        <Col xs={24} sm={12} lg={6}>
          <div
            onClick={() => navigate('/dashboard/project')}
            className="group bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Project
              </span>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <FolderKanban className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {isLoadingProjects ? <Spin size="small" /> : totalProjects}
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Project integrasi aktif terdaftar
            </p>
          </div>
        </Col>

        {/* Card 2: Workspace */}
        <Col xs={24} sm={12} lg={6}>
          <div
            onClick={() => navigate('/dashboard/project')}
            className="group bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Workspaces
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {isLoadingProjects ? <Spin size="small" /> : totalWorkspaces}
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Workspace terhubung ke GeoServer
            </p>
          </div>
        </Col>

        {/* Card 3: Layer */}
        <Col xs={24} sm={12} lg={6}>
          <div
            onClick={() => navigate('/dashboard/layer')}
            className="group bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Spatial Layers
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Globe className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {isLoadingLayers ? <Spin size="small" /> : totalLayers}
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              GeoTIFF & Layer WMS terpublikasi
            </p>
          </div>
        </Col>

        {/* Card 4: API Key */}
        <Col xs={24} sm={12} lg={6}>
          <div
            onClick={() => navigate('/documentation')}
            className="group bg-white rounded-xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-amber-300 transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                API Keys (S2S)
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Key className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold text-slate-900 tracking-tight">
                {isLoadingProjects ? <Spin size="small" /> : totalApiKeys}
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Kredensial aktif integrasi FlowGIS
            </p>
          </div>
        </Col>
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
                  Lihat Semua Layer <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              }
              items={[
                {
                  key: 'layers',
                  label: (
                    <span className="flex items-center gap-2 font-medium">
                      <Globe className="w-4 h-4 text-emerald-600" />
                      Layer Terbaru
                      {/* {recentLayers.length > 0 && (
                        <Badge count={recentLayers.length} className="!bg-emerald-100 !text-emerald-700 font-semibold" />
                      )} */}
                    </span>
                  ),
                  children: (
                    <div className="pt-2">
                      {isLoadingLayers ? (
                        <div className="py-12 flex justify-center">
                          <Spin tip="Memuat layer terbaru..." />
                        </div>
                      ) : recentLayers.length === 0 ? (
                        <div className="py-10 text-center">
                          <Empty description="Belum ada layer yang dipublish">
                            <Button
                              type="primary"
                              icon={<Plus className="w-4 h-4" />}
                              onClick={() => setLayerModalOpen(true)}
                              className="!bg-blue-600 mt-2"
                            >
                              Publish Layer Pertama
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
                                    <Tag color="amber" className="!text-xs !rounded-md">
                                      {layer.data_type || 'GeoTIFF'}
                                    </Tag>
                                    {layer.epsg && (
                                      <Tag className="!text-xs !rounded-md text-slate-600 bg-slate-100">
                                        EPSG:{layer.epsg}
                                      </Tag>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5" />
                                    {formatTanggal(layer.created_at)}
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
                                Lihat di Peta
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'projects',
                  label: (
                    <span className="flex items-center gap-2 font-medium">
                      <FolderKanban className="w-4 h-4 text-blue-600" />
                      Project Terbaru
                    </span>
                  ),
                  children: (
                    <div className="pt-2">
                      {isLoadingProjects ? (
                        <div className="py-12 flex justify-center">
                          <Spin tip="Memuat project..." />
                        </div>
                      ) : recentProjects.length === 0 ? (
                        <div className="py-10 text-center">
                          <Empty description="Belum ada project dibuat">
                            <Button
                              type="primary"
                              icon={<Plus className="w-4 h-4" />}
                              onClick={() => setProjectModalOpen(true)}
                              className="!bg-blue-600 mt-2"
                            >
                              Buat Project Sekarang
                            </Button>
                          </Empty>
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {recentProjects.map((proj) => (
                            <div
                              key={proj.id}
                              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/75 rounded-lg px-2 transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/60 flex items-center justify-center shrink-0 mt-0.5">
                                  <FolderKanban className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-900 text-sm mb-1">
                                    {proj.project_name}
                                  </h4>
                                  <p className="text-xs text-slate-500 line-clamp-1 max-w-md">
                                    {proj.description || 'Tidak ada deskripsi'}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    <Tag color="cyan" className="!text-xs">
                                      {proj.workspace_count || 0} Workspaces
                                    </Tag>
                                    <Tag color="orange" className="!text-xs">
                                      {proj.api_key_count || 0} API Keys
                                    </Tag>
                                    <span className="text-slate-400 text-xs">
                                      {formatTanggal(proj.created_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <Button
                                type="primary"
                                ghost
                                size="small"
                                onClick={() => navigate(`/dashboard/project/detail/${proj.id}`)}
                                className="!text-xs !font-medium self-start sm:self-auto"
                              >
                                Kelola
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ),
                },
                {
                  key: 'activity',
                  label: (
                    <span className="flex items-center gap-2 font-medium">
                      <Activity className="w-4 h-4 text-purple-600" />
                      Log Aktivitas
                    </span>
                  ),
                  children: (
                    <div className="pt-4 px-2">
                      {activityItems.length === 0 ? (
                        <Empty description="Belum ada aktivitas terekam" />
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
            {/* Quick Actions Card */}
            <Card
              title={
                <span className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  Aksi Cepat
                </span>
              }
              className="!rounded-2xl !border-slate-200/80 !shadow-xs"
              styles={{ body: { padding: '16px 20px' } }}
            >
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  onClick={() => setProjectModalOpen(true)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-600">
                        Buat Project Baru
                      </div>
                      <div className="text-xs text-slate-400">Kelola workspace & API Key</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => setLayerModalOpen(true)}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <UploadCloud className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-emerald-600">
                        Publish Layer GeoTIFF
                      </div>
                      <div className="text-xs text-slate-400">Upload raster 1-band langsung</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/dashboard/layer')}
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-purple-400 hover:bg-purple-50/50 transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-purple-600">
                        Buka Visualisasi Peta
                      </div>
                      <div className="text-xs text-slate-400">Preview WMS & atur SLD style</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>

                <Link
                  to="/documentation"
                  className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <FileCode className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-amber-700">
                        Dokumentasi Integrasi S2S
                      </div>
                      <div className="text-xs text-slate-400">Spesifikasi API & contoh kode</div>
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              </div>
            </Card>

            {/* S2S Quick Snippet Widget */}
            {/* <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
                  <Terminal className="w-3.5 h-3.5" /> S2S Endpoint (FlowGIS)
                </span>
                <button
                  onClick={handleCopySnippet}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded transition cursor-pointer"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" /> Tersalin
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Salin cURL
                    </>
                  )}
                </button>
              </div>

              <div className="bg-slate-950 p-2.5 rounded-lg font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800/80">
                <span className="text-emerald-400 font-bold">POST</span> /s2s/publish
                <br />
                <span className="text-slate-500">Header:</span> X-API-Key: agis_sk_...
                <br />
                <span className="text-slate-500">Body:</span> workspace_id, layer_name, file
              </div>

              <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-400/90">
                <Info className="w-3.5 h-3.5 shrink-0" />
                <span>Wajib file GeoTIFF 1-band untuk publish otomatis.</span>
              </div>
            </div> */}
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
                Status Sistem & Layanan
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
                      {geoVersion ? `Versi ${geoVersion}` : 'WMS & WFS Service Active'}
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
                Panduan Integrasi & API
              </span>
            }
            extra={
              <Link
                to="/documentation"
                className="text-xs font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                Dokumentasi Lengkap <ArrowUpRight className="w-3.5 h-3.5" />
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
                    1. Autentikasi API Key
                  </span>
                  <Tag color="default" className="!text-[11px]">Header</Tag>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Kirim header <code className="bg-slate-100 text-slate-800 px-1 py-0.5 rounded font-mono">X-API-Key: agis_sk_...</code> pada setiap request endpoint S2S tanpa perlu login email & password.
                </p>
              </div>

              {/* Item 2 */}
              <div className="p-3 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-colors bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-blue-600" />
                    2. Validasi Single-Band GeoTIFF
                  </span>
                  <Tag color="amber" className="!text-[11px]">Wajib 1-Band</Tag>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  File raster wajib berupa 1 band (grayscale / continuous value seperti DEM, NDVI, Slope) agar GeoServer dapat melakukan styling SLD secara optimal.
                </p>
              </div>

              {/* Item 3 */}
              <div className="p-3 rounded-xl border border-slate-200/80 hover:border-blue-300 transition-colors bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-600" />
                    3. Format URL WMS GeoServer
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
                  Buka Portal Dokumentasi & Playground
                </Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── 5. MODAL CREATE PROJECT & PUBLISH LAYER ─────────────────────────── */}
      <ProjectModal
        open={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false)
          handleRefresh()
        }}
        mode="create"
        project={null}
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