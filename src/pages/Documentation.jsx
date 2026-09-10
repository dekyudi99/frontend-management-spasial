import { useEffect, useState } from 'react'

// ── Inline SVG Icons (tanpa dependency eksternal) ───────────
const FiCopy       = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
const FiCheck      = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const FiKey        = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>
const FiUploadCloud= ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
const FiCode       = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
const FiAlertTriangle = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const FiChevronDown= ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
const FiChevronUp  = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
const FiGlobe      = ({ size = 16 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>


const appName = import.meta.env.VITE_APP_NAME || 'Management Spatial'
const apiBase = import.meta.env.VITE_API_URL || 'https://api-astragis.ikya.my.id'

// ── Helpers ────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button
      onClick={handleCopy}
      title="Salin ke clipboard"
      className="doc-copy-btn"
    >
      {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
      {copied ? 'Disalin!' : 'Salin'}
    </button>
  )
}

function CodeBlock({ code, language = 'bash' }) {
  return (
    <div className="doc-code-wrapper">
      <div className="doc-code-header">
        <span className="doc-code-lang">{language}</span>
        <CopyButton text={code} />
      </div>
      <pre className="doc-code-block"><code>{code}</code></pre>
    </div>
  )
}

function Section({ id, icon: Icon, title, badge, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section id={id} className="doc-section">
      <button className="doc-section-header" onClick={() => setOpen(v => !v)}>
        <div className="doc-section-title">
          <span className="doc-section-icon"><Icon size={18} /></span>
          <h2>{title}</h2>
          {badge && <span className="doc-badge">{badge}</span>}
        </div>
        {open ? <FiChevronUp size={18} /> : <FiChevronDown size={18} />}
      </button>
      {open && <div className="doc-section-body">{children}</div>}
    </section>
  )
}

function ParamRow({ name, type, required, desc }) {
  return (
    <tr className="doc-table-row">
      <td><code className="doc-param-name">{name}</code></td>
      <td><span className="doc-tag doc-tag-type">{type}</span></td>
      <td>
        <span className={`doc-tag ${required ? 'doc-tag-required' : 'doc-tag-optional'}`}>
          {required ? 'Wajib' : 'Opsional'}
        </span>
      </td>
      <td className="doc-param-desc">{desc}</td>
    </tr>
  )
}

function ErrorRow({ code, meaning, solution }) {
  return (
    <tr className="doc-table-row">
      <td><span className="doc-error-code">{code}</span></td>
      <td>{meaning}</td>
      <td className="doc-param-desc">{solution}</td>
    </tr>
  )
}

// ── Sidebar nav ─────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'intro',           label: 'Pengantar' },
  { id: 'auth',            label: 'Autentikasi' },
  { id: 'publish-url',     label: 'POST /s2s/publish-from-url' },
  { id: 'publish-file',    label: 'POST /s2s/publish (File)' },
  { id: 'multiuser-query', label: 'GET /s2s/layers (Histori User)' },
  { id: 'layer-groups',    label: 'Layer Groups (S2S)' },
  { id: 'style',           label: 'Format Style (SLD & JSON)' },
  { id: 'examples',        label: 'Contoh Kode (Laravel, Python, cURL)' },
  { id: 'errors',          label: 'Error Codes' },
]

// ── Contoh kode ─────────────────────────────────────────────
const CURL_PUBLISH_URL = `curl -X POST "${apiBase}/s2s/publish-from-url" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workspace_id": "<HASHED_WORKSPACE_ID>",
    "layer_name": "Flood Risk Analysis",
    "description": "Hasil analisis risiko banjir otomatis dari FlowGIS",
    "download_url": "https://earthengine.googleapis.com/v1/projects/earthengine-legacy/thumbnails/...:getPixels",
    "style_sld": "<?xml version=\\"1.0\\" encoding=\\"UTF-8\\"?>\\n<StyledLayerDescriptor ...>...</StyledLayerDescriptor>",
    "client_user_id": "42",
    "client_user_email": "user@flowgis.com",
    "statistics": {
      "avg_elevation_m": 18.01,
      "avg_rainfall_mm": 367.13,
      "risk_distribution": {"4.0": 14774.98, "5.0": 410.16}
    },
    "legends": {
      "FloodRisk": {
        "title": "Flood Risk",
        "items": [
          {"color": "#00FF00", "label": "Moderate (3)"},
          {"color": "#FFFF00", "label": "High (4)"},
          {"color": "#FF0000", "label": "Critical (5)"}
        ]
      }
    }
  }'`

const CURL_GET_LAYERS = `curl -X GET "${apiBase}/s2s/layers?client_user_id=42" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"`

const CURL_BASIC = `curl -X POST "${apiBase}/s2s/publish" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -F "workspace_id=<HASHED_WORKSPACE_ID>" \\
  -F "layer_name=Peta Curah Hujan 2024" \\
  -F "description=Data curah hujan tahunan Provinsi Bali" \\
  -F "client_user_id=42" \\
  -F "file=@/path/to/curah_hujan.tif"`

const CURL_WITH_STYLE = `curl -X POST "${apiBase}/s2s/publish" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -F "workspace_id=<HASHED_WORKSPACE_ID>" \\
  -F "layer_name=Indeks Kekeringan" \\
  -F "client_user_id=42" \\
  -F "file=@/path/to/drought_index.tif" \\
  -F 'style=[
    {"quantity":0,   "color":"#2166ac","opacity":1.0,"label":"Sangat Basah"},
    {"quantity":25,  "color":"#74add1","opacity":1.0,"label":"Basah"},
    {"quantity":50,  "color":"#ffffbf","opacity":1.0,"label":"Normal"},
    {"quantity":75,  "color":"#f46d43","opacity":1.0,"label":"Kering"},
    {"quantity":100, "color":"#a50026","opacity":1.0,"label":"Sangat Kering"}
  ]'`

const LARAVEL_CODE = `<?php

namespace App\\Services;

use Illuminate\\Support\\Facades\\Http;

class AstraGisService
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.astragis.base_url', '${apiBase}');
        $this->apiKey  = config('services.astragis.api_key');
    }

    /**
     * 1. Simpan hasil analisis FlowGIS / GEE langsung via Download URL
     */
    public function publishAnalysisLayer(array $flowgisResult, string $workspaceId, string $layerName)
    {
        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
        ])->timeout(180)->post("{$this->baseUrl}/s2s/publish-from-url", [
            'workspace_id'      => $workspaceId,
            'layer_name'        => $layerName,
            'description'       => 'Analisis banjir otomatis pengguna ' . auth()->user()->name,
            'download_url'      => $flowgisResult['download_url'], // URL GeoTIFF 1-band dari GEE
            'style_sld'         => $flowgisResult['style_sld'],    // XML SLD utuh dari FlowGIS
            'client_user_id'    => (string) auth()->id(),          // Tag kepemilikan user Laravel
            'client_user_email' => auth()->user()->email,
            'client_user_name'  => auth()->user()->name,
            'statistics'        => $flowgisResult['statistics'] ?? null,
            'legends'           => $flowgisResult['legends'] ?? null,
            'maps'              => $flowgisResult['maps'] ?? null,
        ]);

        if ($response->successful()) {
            return $response->json()['data'];
        }

        throw new \\Exception('Gagal publish ke AstraGIS: ' . $response->body());
    }

    /**
     * 2. Ambil seluruh histori layer milik user yang sedang login untuk sidebar kanan FlowGIS
     */
    public function getUserAnalysisLayers(?string $workspaceId = null)
    {
        $params = [
            'client_user_id' => (string) auth()->id(),
        ];
        if ($workspaceId) {
            $params['workspace_id'] = $workspaceId;
        }

        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
        ])->get("{$this->baseUrl}/s2s/layers", $params);

        return $response->json()['data'] ?? [];
    }
}
`

const PYTHON_PUBLISH_URL_CODE = `import requests

API_KEY = "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
API_URL = "${apiBase}/s2s/publish-from-url"
WORKSPACE_ID = "<HASHED_WORKSPACE_ID>"

payload = {
    "workspace_id": WORKSPACE_ID,
    "layer_name": "Flood Risk Analysis",
    "description": "Hasil analisis risiko banjir otomatis dari FlowGIS",
    "download_url": "https://earthengine.googleapis.com/v1/projects/...:getPixels",
    "style_sld": """<?xml version="1.0" encoding="UTF-8"?>
<StyledLayerDescriptor version="1.0.0" ...>
  <NamedLayer>
    ...
  </NamedLayer>
</StyledLayerDescriptor>""",
    "client_user_id": "42",
    "client_user_email": "user@flowgis.com",
    "statistics": {
        "avg_elevation_m": 18.01,
        "avg_rainfall_mm": 367.13,
        "risk_distribution": {"4.0": 14774.98, "5.0": 410.16}
    },
    "legends": {
        "FloodRisk": {
            "title": "Flood Risk",
            "items": [
                {"color": "#00FF00", "label": "Moderate (3)"},
                {"color": "#FFFF00", "label": "High (4)"},
                {"color": "#FF0000", "label": "Critical (5)"}
            ]
        }
    }
}

response = requests.post(
    API_URL,
    headers={"X-API-Key": API_KEY},
    json=payload
)

if response.status_code == 201:
    res_data = response.json()["data"]
    print("Published Successfully:", res_data["layer_name"])
    print("WMS URL:", res_data["wms_url"])
    print("Layer Param:", res_data["wms_layers_param"])
else:
    print("Error:", response.status_code, response.text)
`

const PYTHON_CODE = `import requests
import json

API_KEY = "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
API_URL = "${apiBase}/s2s/publish"
WORKSPACE_ID = "<HASHED_WORKSPACE_ID>"

# Style ColorMap (optional)
style = [
    {"quantity": 0,   "color": "#313695", "opacity": 1.0, "label": "Very Low"},
    {"quantity": 25,  "color": "#74add1", "opacity": 1.0, "label": "Low"},
    {"quantity": 50,  "color": "#ffffbf", "opacity": 1.0, "label": "Medium"},
    {"quantity": 75,  "color": "#f46d43", "opacity": 1.0, "label": "High"},
    {"quantity": 100, "color": "#a50026", "opacity": 1.0, "label": "Very High"},
]

with open("/path/to/layer.tif", "rb") as tif_file:
    response = requests.post(
        API_URL,
        headers={"X-API-Key": API_KEY},
        data={
            "workspace_id": WORKSPACE_ID,
            "layer_name": "Python Layer Example",
            "description": "Sent from Python script",
            "client_user_id": "42",
            "style": json.dumps(style),  # Optional
        },
        files={"file": ("layer.tif", tif_file, "image/tiff")},
    )

if response.status_code == 201:
    data = response.json()
    print("Success!", data["detail"])
    print("WMS URL:", data["data"]["wms_url"])
else:
    print("Error:", response.status_code, response.json())
`

const SUCCESS_RESPONSE_URL = `{
  "success": true,
  "detail": "Layer 'Flood Risk Analysis' berhasil dipublikasikan dari URL via S2S.",
  "data": {
    "id": 65,
    "layer_name": "Flood Risk Analysis",
    "geoserver_name": "s2s_7f8a9b0c...",
    "workspace": "ws_flowgis_project",
    "workspace_display_name": "FlowGIS Workspace",
    "client_user_id": "42",
    "wms_url": "https://geoserver.ikya.my.id/geoserver/ws_flowgis_project/wms",
    "wms_layers_param": "ws_flowgis_project:s2s_7f8a9b0c...",
    "epsg": 4326,
    "bbox": [100.45, 13.68, 100.65, 13.88],
    "width": 1280,
    "height": 960,
    "metadata": {
      "download_url": "https://earthengine.googleapis.com/...",
      "statistics": { "avg_elevation_m": 18.01, "avg_rainfall_mm": 367.13 },
      "legends": { ... }
    },
    "created_at": "2026-09-09T16:24:00Z"
  }
}`

const SUCCESS_RESPONSE_LAYERS = `{
  "success": true,
  "data": [
    {
      "id": 65,
      "layer_name": "Flood Risk Analysis",
      "description": "Hasil analisis risiko banjir",
      "workspace_id": 7,
      "workspace_name": "ws_flowgis_project",
      "workspace_display_name": "FlowGIS Workspace",
      "client_user_id": "42",
      "data_type": "GeoTiff",
      "epsg": 4326,
      "bbox": [100.45, 13.68, 100.65, 13.88],
      "wms_url": "https://geoserver.ikya.my.id/geoserver/ws_flowgis_project/wms",
      "wms_layers_param": "ws_flowgis_project:s2s_7f8a9b0c...",
      "metadata": {
        "statistics": { "avg_elevation_m": 18.01 },
        "legends": { ... }
      },
      "created_at": "2026-09-09T16:24:00Z"
    }
  ],
  "pagination": {
    "total": 1,
    "page": 1,
    "size": 50,
    "total_pages": 1
  }
}`

const CURL_CREATE_GROUP = `curl -X POST "${apiBase}/s2s/layer-groups" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workspace_id": "<HASHED_WORKSPACE_ID>",
    "name": "Banjir & Curah Hujan Gabungan",
    "title": "Banjir & Curah Hujan",
    "client_user_id": "42",
    "layer_ids": [65, 66]
  }'`

const CURL_GET_GROUPS = `curl -X GET "${apiBase}/s2s/layer-groups?client_user_id=42" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"`

const SUCCESS_RESPONSE_GROUPS = `{
  "success": true,
  "detail": "Layer Group 'Combined Flood & Rainfall' created successfully.",
  "data": {
    "id": 12,
    "name": "Combined Flood & Rainfall",
    "workspace_id": 7,
    "workspace_name": "ws_flowgis_project",
    "client_user_id": "42",
    "wms_url": "https://geoserver.ikya.my.id/geoserver/ws_flowgis_project/wms",
    "wms_layers_param": "ws_flowgis_project:Combined Flood & Rainfall",
    "layers_count": 2,
    "layers": [
      { "id": 65, "layer_name": "Flood Risk Analysis", "order": 0 },
      { "id": 66, "layer_name": "Rainfall Analysis", "order": 1 }
    ],
    "bbox": [100.45, 13.68, 100.65, 13.88],
    "created_at": "2026-09-09T17:00:00Z"
  }
}`

const WMS_USAGE = `# After publishing successfully, use wms_url & wms_layers_param from response for Leaflet:
# URL: https://geoserver.ikya.my.id/geoserver/<workspace>/wms

# Contoh Leaflet Javascript:
L.tileLayer.wms("https://geoserver.ikya.my.id/geoserver/ws_flowgis/wms", {
  layers: "ws_flowgis:s2s_7f8a9b0c...",
  format: "image/png",
  transparent: true,
  version: "1.1.1"
}).addTo(map);`

// ── Main Component ───────────────────────────────────────────
const Documentation = () => {
  const [activeNav, setActiveNav] = useState('intro')

  useEffect(() => {
    document.title = `API Documentation | ${appName}`
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) setActiveNav(e.target.id)
        })
      },
      { rootMargin: '-30% 0px -60% 0px' }
    )
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      <style>{DOC_CSS}</style>
      <div className="doc-root">

        {/* ── Top Hero ── */}
        <header className="doc-hero">
          <div className="doc-hero-glow" />
          <div className="doc-hero-content">
            <div className="doc-hero-badge"><FiGlobe size={13} /> REST API</div>
            <h1 className="doc-hero-title">API Documentation</h1>
            <p className="doc-hero-subtitle">
              Panduan integrasi System-to-System (S2S) <strong>{appName}</strong> untuk FlowGIS, Laravel, dan sistem eksternal.
            </p>
            <div className="doc-hero-meta">
              <span className="doc-hero-pill">v2.0 (Multi-User &amp; GEE Ready)</span>
              <span className="doc-hero-pill">OpenAPI / FastAPI</span>
              <a
                href={`${apiBase}/docs`}
                target="_blank"
                rel="noreferrer"
                className="doc-hero-pill doc-hero-pill-link"
              >
                Swagger UI ↗
              </a>
            </div>
          </div>
        </header>

        <div className="doc-layout">
          {/* ── Sidebar Nav ── */}
          <nav className="doc-nav">
            <p className="doc-nav-label">On this page</p>
            {NAV_ITEMS.map(({ id, label }) => (
              <button
                key={id}
                className={`doc-nav-item ${activeNav === id ? 'doc-nav-active' : ''}`}
                onClick={() => scrollTo(id)}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* ── Content ── */}
          <main className="doc-main">

            {/* Intro */}
            <Section id="intro" icon={FiGlobe} title="Pengantar" defaultOpen>
              <p className="doc-p">
                <strong>{appName}</strong> menyediakan REST API untuk keperluan integrasi sistem
                (System-to-System / S2S). Sistem eksternal seperti <strong>FlowGIS</strong> dan backend{' '}
                <strong>Laravel</strong> dapat mempublikasikan layer GeoTIFF ke GeoServer secara
                otomatis, baik melalui <strong>Download URL langsung dari Google Earth Engine (GEE)</strong>{' '}
                maupun melalui file upload.
              </p>
              <div className="doc-info-box">
                <strong>Base URL API:</strong>
                <br />
                <code>{apiBase}</code>
              </div>
              <div className="doc-grid-2">
                <div className="doc-feature-card">
                  <div className="doc-feature-icon">🌐</div>
                  <h3>Direct URL Publishing</h3>
                  <p>Publish layer langsung dari Google Earth Engine download URL tanpa perlu upload file manual.</p>
                </div>
                <div className="doc-feature-card">
                  <div className="doc-feature-icon">👥</div>
                  <h3>Multi-User Support</h3>
                  <p>Mendukung tag <code>client_user_id</code> agar Laravel dapat menampilkan histori layer per pengguna.</p>
                </div>
                <div className="doc-feature-card">
                  <div className="doc-feature-icon">🎨</div>
                  <h3>Raw XML SLD &amp; JSON Style</h3>
                  <p>Dukungan dokumen XML SLD utuh dari FlowGIS atau aturan pewarnaan berbasis JSON.</p>
                </div>
                <div className="doc-feature-card">
                  <div className="doc-feature-icon">📊</div>
                  <h3>Metadata &amp; Logging</h3>
                  <p>Menyimpan statistik analisis spasial, legenda, serta mencatat log audit ke database.</p>
                </div>
              </div>
            </Section>

            {/* Auth */}
            <Section id="auth" icon={FiKey} title="Autentikasi" badge="API Key">
              <p className="doc-p">
                Semua endpoint S2S menggunakan <strong>API Key</strong> yang dikirim melalui
                HTTP header <code>X-API-Key</code>. API Key bersifat per-project dan dapat dibuat/dikelola melalui
                halaman <em>Project → API Keys</em> di dashboard.
              </p>
              <div className="doc-step-list">
                <div className="doc-step">
                  <span className="doc-step-num">1</span>
                  <div>
                    <strong>Buat API Key</strong>
                    <p>Masuk ke dashboard → buka Project Anda → tab <em>API Keys</em> → klik Buat API Key.</p>
                  </div>
                </div>
                <div className="doc-step">
                  <span className="doc-step-num">2</span>
                  <div>
                    <strong>Salin API Key</strong>
                    <p>API Key hanya ditampilkan <strong>sekali</strong> saat dibuat. Simpan di environment variable (misal di <code>.env</code> Laravel).</p>
                  </div>
                </div>
                <div className="doc-step">
                  <span className="doc-step-num">3</span>
                  <div>
                    <strong>Kirim di Header Request</strong>
                    <p>Sertakan API Key di setiap request menggunakan header <code>X-API-Key: agis_sk_...</code>.</p>
                  </div>
                </div>
              </div>
              <CodeBlock code={`X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`} language="http" />
              <div className="doc-warning-box">
                <FiAlertTriangle size={15} />
                <span>
                  Simpan API Key di backend Anda (misal di Laravel atau service FlowGIS). Jangan pernah
                  membocorkannya di frontend/client browser.
                </span>
              </div>
            </Section>

            {/* Endpoint 1: POST /s2s/publish-from-url */}
            <Section id="publish-url" icon={FiUploadCloud} title="POST /s2s/publish-from-url" badge="Direkomendasikan (GEE Ready)">
              <p className="doc-p">
                Endpoint ini dirancang khusus untuk integrasi dengan <strong>FlowGIS</strong> dan sistem yang menghasilkan
                URL download GeoTIFF langsung dari <strong>Google Earth Engine</strong>. Backend {appName} akan
                mengunduh file secara streaming, mempublikasikan ke GeoServer, menerapkan SLD XML, serta menyimpan
                metadata analisis.
              </p>

              <div className="doc-endpoint-card">
                <span className="doc-method-badge">POST</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/publish-from-url</code>
              </div>

              <h3 className="doc-subtitle">Request Body (application/json)</h3>
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Field</th><th>Tipe</th><th>Status</th><th>Keterangan</th></tr>
                  </thead>
                  <tbody>
                    <ParamRow name="workspace_id"      type="string" required desc="Hashed ID atau integer workspace tujuan." />
                    <ParamRow name="layer_name"        type="string" required desc="Nama layer tampilan (contoh: 'Flood Risk Analysis')." />
                    <ParamRow name="download_url"      type="string" required desc="URL langsung download GeoTIFF 1-band (dari GEE getDownloadURL / getPixels)." />
                    <ParamRow name="style_sld"         type="string" required={false} desc="Dokumen XML SLD siap pakai yang dihasilkan FlowGIS." />
                    <ParamRow name="client_user_id"    type="string" required={false} desc="ID user di sistem klien (contoh: ID pengguna Laravel) untuk isolasi data multi-user." />
                    <ParamRow name="client_user_email" type="string" required={false} desc="Email user klien (opsional, untuk audit log)." />
                    <ParamRow name="description"       type="string" required={false} desc="Deskripsi singkat layer." />
                    <ParamRow name="statistics"        type="object" required={false} desc="Data statistik analisis spasial (avg_elevation, risk_distribution, dll)." />
                    <ParamRow name="legends"           type="object" required={false} desc="Objek legenda warna dan kategori." />
                    <ParamRow name="maps"              type="object" required={false} desc="Tile URL pelengkap dari GEE." />
                  </tbody>
                </table>
              </div>

              <h3 className="doc-subtitle">Contoh Response (201 Created)</h3>
              <CodeBlock code={SUCCESS_RESPONSE_URL} language="json" />
            </Section>

            {/* Endpoint 2: POST /s2s/publish */}
            <Section id="publish-file" icon={FiUploadCloud} title="POST /s2s/publish (File Upload)" badge="Multipart">
              <p className="doc-p">
                Endpoint konvensional untuk mengunggah file binary GeoTIFF 1-band secara langsung
                menggunakan <code>multipart/form-data</code>.
              </p>

              <div className="doc-endpoint-card">
                <span className="doc-method-badge">POST</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/publish</code>
              </div>

              <h3 className="doc-subtitle">Request Parameters (multipart/form-data)</h3>
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Field</th><th>Tipe</th><th>Status</th><th>Keterangan</th></tr>
                  </thead>
                  <tbody>
                    <ParamRow name="workspace_id"   type="string" required desc="Hashed ID workspace tujuan." />
                    <ParamRow name="layer_name"     type="string" required desc="Nama tampilan layer." />
                    <ParamRow name="file"           type="file"   required desc="File GeoTIFF (.tif / .tiff) wajib 1-band (single-band)." />
                    <ParamRow name="client_user_id" type="string" required={false} desc="ID user di sistem klien (Laravel user ID)." />
                    <ParamRow name="description"    type="string" required={false} desc="Deskripsi layer." />
                    <ParamRow name="style"          type="JSON string" required={false} desc="Array ColorEntry dalam format JSON string." />
                    <ParamRow name="style_sld"      type="string" required={false} desc="Dokumen XML SLD utuh (opsional)." />
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Endpoint 3: GET /s2s/layers */}
            <Section id="multiuser-query" icon={FiCode} title="GET /s2s/layers (Query Histori Multi-User)" badge="Multi-User">
              <p className="doc-p">
                Endpoint ini digunakan oleh sistem seperti <strong>Laravel (`flowgis-business-process`)</strong> untuk
                mengambil histori hasil analisis layer yang dimiliki oleh pengguna tertentu. Hasilnya dapat langsung
                ditampilkan pada popup <strong>Layer</strong> di antarmuka FlowGIS.
              </p>

              <div className="doc-endpoint-card">
                <span className="doc-method-badge" style={{ background: '#238636', borderColor: '#2ea043' }}>GET</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/layers</code>
              </div>

              <h3 className="doc-subtitle">Query Parameters</h3>
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Parameter</th><th>Tipe</th><th>Status</th><th>Keterangan</th></tr>
                  </thead>
                  <tbody>
                    <ParamRow name="client_user_id" type="string" required={false} desc="Filter hanya layer milik ID user ini di Laravel. Jika dikosongkan, mengambil semua layer di project API Key." />
                    <ParamRow name="workspace_id"   type="string" required={false} desc="Filter berdasarkan workspace tertentu." />
                    <ParamRow name="page"           type="number" required={false} desc="Nomor halaman (default: 1)." />
                    <ParamRow name="size"           type="number" required={false} desc="Jumlah item per halaman (default: 50, max: 500)." />
                  </tbody>
                </table>
              </div>

              <h3 className="doc-subtitle">Contoh Response (200 OK)</h3>
              <CodeBlock code={SUCCESS_RESPONSE_LAYERS} language="json" />
            </Section>

            {/* Endpoint 4: S2S Layer Groups */}
            <Section id="layer-groups" icon={FiCode} title="S2S Layer Groups (Grup Layer Gabungan)" badge="S2S Multi-User">
              <p className="doc-p">
                Endpoint ini memungkinkan sistem eksternal seperti <strong>FlowGIS</strong> menggabungkan beberapa layer analisis
                menjadi satu <strong>Layer Group</strong> di GeoServer. Hasil layer group dapat dirender langsung di peta
                menggunakan satu WMS layer call, lengkap dengan kontrol hapus dan filter per pengguna (<code>client_user_id</code>).
              </p>

              <h3 className="doc-subtitle">1. Membuat Layer Group (POST /s2s/layer-groups)</h3>
              <div className="doc-endpoint-card">
                <span className="doc-method-badge">POST</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/layer-groups</code>
              </div>
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Field</th><th>Tipe</th><th>Status</th><th>Keterangan</th></tr>
                  </thead>
                  <tbody>
                    <ParamRow name="workspace_id"   type="string / int" required desc="ID workspace tujuan." />
                    <ParamRow name="name"           type="string"       required desc="Nama layer group (tanpa spasi / simbol khusus, contoh: 'Flood_Rainfall_Group')." />
                    <ParamRow name="title"          type="string"       required={false} desc="Judul tampilan layer group." />
                    <ParamRow name="client_user_id" type="string"       required={false} desc="ID pengguna di sistem klien (Laravel auth user ID)." />
                    <ParamRow name="layer_ids"      type="array[int]"   required desc="Daftar ID layer anggota yang akan digabungkan." />
                  </tbody>
                </table>
              </div>
              <CodeBlock code={CURL_CREATE_GROUP} language="bash" />
              <CodeBlock code={SUCCESS_RESPONSE_GROUPS} language="json" />

              <h3 className="doc-subtitle">2. Mengambil Daftar Layer Group (GET /s2s/layer-groups)</h3>
              <div className="doc-endpoint-card">
                <span className="doc-method-badge" style={{ background: '#238636', borderColor: '#2ea043' }}>GET</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/layer-groups?client_user_id=42</code>
              </div>
              <CodeBlock code={CURL_GET_GROUPS} language="bash" />

              <h3 className="doc-subtitle">3. Menghapus Layer Group (DELETE /s2s/layer-groups/:id)</h3>
              <div className="doc-endpoint-card">
                <span className="doc-method-badge" style={{ background: '#da3633', borderColor: '#f85149' }}>DELETE</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/layer-groups/12</code>
              </div>
            </Section>

            {/* Style */}
            <Section id="style" icon={FiCode} title="Format Style (ColorMap &amp; SLD)" badge="Opsional">
              <p className="doc-p">
                Anda dapat mengirimkan style menggunakan dua cara:
                <br />
                1. <strong>XML SLD Utuh</strong> (field <code>style_sld</code>): format standar OpenGIS yang langsung diterapkan ke GeoServer.
                <br />
                2. <strong>JSON ColorMap Array</strong> (field <code>style</code>): array aturan warna berbasis nilai kuantitas.
              </p>

              <h3 className="doc-subtitle">Struktur ColorEntry (JSON Style)</h3>
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Field</th><th>Tipe</th><th>Status</th><th>Keterangan</th></tr>
                  </thead>
                  <tbody>
                    <ParamRow name="quantity" type="number" required desc="Nilai piksel raster (contoh: 1, 2, 3, 4, 5)." />
                    <ParamRow name="color"    type="string (hex)" required desc='Warna dalam format HEX (contoh: "#FF0000").' />
                    <ParamRow name="opacity"  type="number (0–1)" required desc="Opasitas warna (1.0 = penuh, 0.0 = transparan)." />
                    <ParamRow name="label"    type="string" required={false} desc='Label deskriptif (contoh: "Critical Risk").' />
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Examples */}
            <Section id="examples" icon={FiCode} title="Contoh Kode Lengkap" defaultOpen>
              <h3 className="doc-subtitle">PHP / Laravel (flowgis-business-process)</h3>
              <p className="doc-p text-sm text-slate-400 mb-2">
                Contoh implementasi service di Laravel untuk mem-publish hasil analisis GEE dan mengambil histori layer user:
              </p>
              <CodeBlock code={LARAVEL_CODE} language="php" />

              <h3 className="doc-subtitle">Python — Publish dari URL Google Earth Engine</h3>
              <CodeBlock code={PYTHON_PUBLISH_URL_CODE} language="python" />

              <h3 className="doc-subtitle">cURL — Publish dari URL (FlowGIS JSON)</h3>
              <CodeBlock code={CURL_PUBLISH_URL} language="bash" />

              <h3 className="doc-subtitle">cURL — Ambil Layer Milik User Tertentu</h3>
              <CodeBlock code={CURL_GET_LAYERS} language="bash" />

              <h3 className="doc-subtitle">Menampilkan Layer di Peta Leaflet (WMS GetMap)</h3>
              <CodeBlock code={WMS_USAGE} language="javascript" />
            </Section>

            {/* Errors */}
            <Section id="errors" icon={FiAlertTriangle} title="Error Codes">
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Kode</th><th>Arti</th><th>Solusi</th></tr>
                  </thead>
                  <tbody>
                    <ErrorRow code="400" meaning="Invalid file format" solution="Ensure file is in .tif or .tiff format." />
                    <ErrorRow code="400" meaning="Multi-band GeoTIFF" solution="Convert file to single-band using GDAL: gdal_translate -b 1 input.tif output.tif" />
                    <ErrorRow code="400" meaning="Invalid style format" solution="Ensure the style field is a valid JSON array. Use json.dumps() in Python." />
                    <ErrorRow code="401" meaning="Invalid or missing API Key" solution="Check the X-API-Key header. Ensure the API Key is active and not revoked." />
                    <ErrorRow code="403" meaning="Workspace access denied" solution="API Key must belong to the project associated with the target workspace_id." />
                    <ErrorRow code="500" meaning="Failed to publish to GeoServer" solution="Ensure GeoServer is running and the TIFF file path is accessible by the GeoServer container." />
                  </tbody>
                </table>
              </div>
            </Section>

            <div className="doc-footer">
              <p>
                Butuh bantuan? Buka{' '}
                <a href={`${apiBase}/docs`} target="_blank" rel="noreferrer">
                  Swagger UI
                </a>{' '}
                untuk mencoba endpoint secara interaktif.
              </p>
            </div>
          </main>
        </div>
      </div>
    </>
  )
}

// ── CSS in JS ────────────────────────────────────────────────
const DOC_CSS = `
  /* Root & Layout */
  .doc-root {
    min-height: 100vh;
    background: #0d0f14;
    color: #c9d1d9;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.7;
  }

  /* Hero */
  .doc-hero {
    position: relative;
    overflow: hidden;
    padding: 64px 40px 48px;
    border-bottom: 1px solid #21262d;
    background: linear-gradient(135deg, #0d1117 0%, #161b22 100%);
  }
  .doc-hero-glow {
    position: absolute;
    top: -80px;
    left: -80px;
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(88,166,255,0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .doc-hero-content { position: relative; max-width: 860px; }
  .doc-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(88,166,255,0.12);
    color: #58a6ff;
    border: 1px solid rgba(88,166,255,0.3);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .5px;
    margin-bottom: 16px;
  }
  .doc-hero-title {
    font-size: clamp(28px, 5vw, 44px);
    font-weight: 800;
    background: linear-gradient(135deg, #e6edf3 30%, #58a6ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 12px;
    line-height: 1.15;
  }
  .doc-hero-subtitle {
    color: #8b949e;
    font-size: 16px;
    margin: 0 0 20px;
    max-width: 560px;
  }
  .doc-hero-subtitle strong { color: #c9d1d9; }
  .doc-hero-meta { display: flex; gap: 8px; flex-wrap: wrap; }
  .doc-hero-pill {
    background: #21262d;
    border: 1px solid #30363d;
    border-radius: 6px;
    padding: 4px 10px;
    font-size: 12px;
    color: #8b949e;
    text-decoration: none;
  }
  .doc-hero-pill-link { color: #58a6ff; cursor: pointer; }
  .doc-hero-pill-link:hover { background: #1f6feb22; }

  /* Layout */
  .doc-layout {
    display: flex;
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 20px 80px;
    gap: 32px;
  }

  /* Sidebar Nav */
  .doc-nav {
    flex-shrink: 0;
    width: 180px;
    padding-top: 32px;
    position: sticky;
    top: 80px;
    height: fit-content;
  }
  .doc-nav-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: #484f58;
    margin: 0 0 10px;
  }
  .doc-nav-item {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-left: 2px solid transparent;
    padding: 6px 12px;
    color: #8b949e;
    font-size: 13px;
    cursor: pointer;
    border-radius: 0 6px 6px 0;
    transition: all .15s ease;
  }
  .doc-nav-item:hover { color: #c9d1d9; border-left-color: #30363d; }
  .doc-nav-active { color: #58a6ff !important; border-left-color: #58a6ff !important; background: rgba(88,166,255,.06); font-weight: 600; }

  /* Main content */
  .doc-main {
    flex: 1;
    min-width: 0;
    padding-top: 32px;
  }

  /* Sections */
  .doc-section {
    margin-bottom: 24px;
    background: #161b22;
    border: 1px solid #21262d;
    border-radius: 12px;
    overflow: hidden;
    scroll-margin-top: 100px;
  }
  .doc-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 18px 24px;
    background: none;
    border: none;
    color: #e6edf3;
    cursor: pointer;
    border-bottom: 1px solid #21262d;
    gap: 12px;
  }
  .doc-section-header:hover { background: rgba(255,255,255,.02); }
  .doc-section-title {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .doc-section-title h2 {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    color: #e6edf3;
  }
  .doc-section-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: rgba(88,166,255,.12);
    color: #58a6ff;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .doc-badge {
    background: rgba(63,185,80,.12);
    color: #3fb950;
    border: 1px solid rgba(63,185,80,.3);
    border-radius: 4px;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 7px;
    letter-spacing: .5px;
    text-transform: uppercase;
  }
  .doc-section-body { padding: 24px; }

  /* Typography */
  .doc-p { color: #8b949e; margin: 0 0 16px; }
  .doc-p strong { color: #c9d1d9; }
  .doc-p em { color: #58a6ff; font-style: normal; }
  .doc-subtitle {
    font-size: 13px;
    font-weight: 700;
    color: #8b949e;
    letter-spacing: .5px;
    text-transform: uppercase;
    margin: 24px 0 10px;
    border-bottom: 1px solid #21262d;
    padding-bottom: 6px;
  }
  .doc-list {
    color: #8b949e;
    padding-left: 20px;
    margin: 0 0 16px;
  }
  .doc-list li { margin-bottom: 6px; }
  .doc-list strong, .doc-list code { color: #c9d1d9; }

  /* Code blocks */
  .doc-code-wrapper {
    border: 1px solid #21262d;
    border-radius: 8px;
    overflow: hidden;
    margin: 12px 0;
    background: #0d1117;
  }
  .doc-code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 14px;
    background: #161b22;
    border-bottom: 1px solid #21262d;
  }
  .doc-code-lang {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: #484f58;
    letter-spacing: 1px;
  }
  .doc-copy-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: none;
    border: 1px solid #30363d;
    border-radius: 6px;
    color: #8b949e;
    font-size: 12px;
    padding: 3px 10px;
    cursor: pointer;
    transition: all .15s;
  }
  .doc-copy-btn:hover { background: #21262d; color: #c9d1d9; }
  .doc-code-block {
    margin: 0;
    padding: 16px 20px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.75;
    color: #c9d1d9;
    font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  }
  code {
    background: rgba(88,166,255,.1);
    color: #79c0ff;
    padding: 1px 5px;
    border-radius: 4px;
    font-size: .9em;
    font-family: 'Fira Code', monospace;
  }
  .doc-code-block code {
    background: none;
    padding: 0;
    color: inherit;
  }

  /* Tables */
  .doc-table-wrapper { overflow-x: auto; margin: 10px 0 16px; border-radius: 8px; border: 1px solid #21262d; }
  .doc-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .doc-table th {
    background: #21262d;
    color: #8b949e;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: .5px;
    text-transform: uppercase;
    padding: 10px 14px;
    text-align: left;
  }
  .doc-table-row td { padding: 10px 14px; border-top: 1px solid #21262d; vertical-align: top; }
  .doc-table-row:hover td { background: rgba(255,255,255,.02); }
  .doc-param-name { color: #79c0ff; font-weight: 600; }
  .doc-param-desc { color: #8b949e; font-size: 13px; }
  .doc-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  .doc-tag-type { background: rgba(88,166,255,.1); color: #58a6ff; }
  .doc-tag-required { background: rgba(255,123,114,.1); color: #ff7b72; }
  .doc-tag-optional { background: rgba(139,148,158,.1); color: #8b949e; }
  .doc-error-code { font-size: 13px; font-weight: 700; color: #ff7b72; background: rgba(255,123,114,.1); padding: 2px 8px; border-radius: 4px; }

  /* Info/Warning boxes */
  .doc-info-box {
    background: rgba(88,166,255,.08);
    border: 1px solid rgba(88,166,255,.25);
    border-radius: 8px;
    padding: 14px 16px;
    color: #8b949e;
    font-size: 13.5px;
    margin: 12px 0;
  }
  .doc-info-box code { color: #79c0ff; }
  .doc-warning-box {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: rgba(210,153,34,.08);
    border: 1px solid rgba(210,153,34,.25);
    border-radius: 8px;
    padding: 12px 16px;
    color: #e3b341;
    font-size: 13.5px;
    margin: 16px 0 0;
  }
  .doc-warning-box svg { flex-shrink: 0; margin-top: 2px; }

  /* Endpoint card */
  .doc-endpoint-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #0d1117;
    border: 1px solid #21262d;
    border-radius: 8px;
    padding: 12px 16px;
    margin: 10px 0 20px;
    font-family: 'Fira Code', monospace;
  }
  .doc-method-badge {
    background: rgba(63,185,80,.15);
    color: #3fb950;
    font-size: 12px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 6px;
    letter-spacing: 1px;
    flex-shrink: 0;
  }
  .doc-endpoint-path {
    background: none;
    color: #c9d1d9;
    font-size: 14px;
    padding: 0;
    word-break: break-all;
  }

  /* Feature grid */
  .doc-grid-2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin: 16px 0;
  }
  .doc-feature-card {
    background: #0d1117;
    border: 1px solid #21262d;
    border-radius: 10px;
    padding: 16px;
    transition: border-color .2s;
  }
  .doc-feature-card:hover { border-color: #30363d; }
  .doc-feature-icon { font-size: 22px; margin-bottom: 8px; }
  .doc-feature-card h3 { font-size: 14px; font-weight: 700; color: #e6edf3; margin: 0 0 6px; }
  .doc-feature-card p { font-size: 13px; color: #8b949e; margin: 0; }

  /* Steps */
  .doc-step-list { display: flex; flex-direction: column; gap: 12px; margin: 12px 0 16px; }
  .doc-step { display: flex; gap: 14px; align-items: flex-start; }
  .doc-step-num {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: rgba(88,166,255,.15);
    color: #58a6ff;
    font-weight: 800;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid rgba(88,166,255,.3);
  }
  .doc-step strong { color: #c9d1d9; display: block; margin-bottom: 2px; }
  .doc-step p { color: #8b949e; margin: 0; font-size: 13.5px; }

  /* Footer */
  .doc-footer {
    margin-top: 32px;
    padding: 20px;
    text-align: center;
    color: #484f58;
    font-size: 13px;
  }
  .doc-footer a { color: #58a6ff; text-decoration: none; }
  .doc-footer a:hover { text-decoration: underline; }

  @media (max-width: 768px) {
    .doc-hero { padding: 40px 20px 32px; }
    .doc-layout { flex-direction: column; padding: 0 16px 60px; }
    .doc-nav { display: flex; width: 100%; overflow-x: auto; padding: 12px 0 0; position: static; }
    .doc-nav-label { display: none; }
    .doc-nav-item { flex-shrink: 0; border-left: none; border-bottom: 2px solid transparent; border-radius: 6px 6px 0 0; }
    .doc-nav-active { border-left-color: transparent !important; border-bottom-color: #58a6ff !important; }
  }
`

export default Documentation