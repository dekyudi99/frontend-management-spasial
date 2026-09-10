import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../assets/logo.png'

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


const appName = import.meta.env.VITE_APP_NAME || 'AstraGIS'
const apiBase = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000'
const geoserverWms = import.meta.env.VITE_GEOSERVER_WMS_URL || 'http://localhost:8080/geoserver/wms'

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
      title="Copy to clipboard"
      className="doc-copy-btn"
    >
      {copied ? <FiCheck size={14} /> : <FiCopy size={14} />}
      {copied ? 'Copied!' : 'Copy'}
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
          {required ? 'Required' : 'Optional'}
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
  { id: 'intro',           label: 'Introduction' },
  { id: 'auth',            label: 'Authentication' },
  { id: 'publish-url',     label: 'POST /s2s/publish-from-url' },
  { id: 'publish-file',    label: 'POST /s2s/publish (File)' },
  { id: 'multiuser-query', label: 'GET /s2s/layers (User History)' },
  { id: 'layer-groups',    label: 'Layer Groups (S2S)' },
  { id: 'style',           label: 'Style Formats (SLD & JSON)' },
  { id: 'examples',        label: 'Code Examples (Laravel, Python, cURL)' },
  { id: 'errors',          label: 'Error Codes' },
]

// ── Contoh kode ─────────────────────────────────────────────
const CURL_PUBLISH_URL = `curl -X POST "${apiBase}/s2s/publish-from-url" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workspace_id": "<HASHED_WORKSPACE_ID>",
    "layer_name": "Flood Risk Analysis",
    "description": "Automated flood risk analysis result from FlowGIS",
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
  -F "layer_name=Rainfall Map 2024" \\
  -F "description=Annual precipitation data for Bali Province" \\
  -F "client_user_id=42" \\
  -F "file=@/path/to/rainfall.tif"`

const CURL_WITH_STYLE = `curl -X POST "${apiBase}/s2s/publish" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -F "workspace_id=<HASHED_WORKSPACE_ID>" \\
  -F "layer_name=Drought Index" \\
  -F "client_user_id=42" \\
  -F "file=@/path/to/drought_index.tif" \\
  -F 'style=[
    {"quantity":0,   "color":"#2166ac","opacity":1.0,"label":"Very Wet"},
    {"quantity":25,  "color":"#74add1","opacity":1.0,"label":"Wet"},
    {"quantity":50,  "color":"#ffffbf","opacity":1.0,"label":"Normal"},
    {"quantity":75,  "color":"#f46d43","opacity":1.0,"label":"Dry"},
    {"quantity":100, "color":"#a50026","opacity":1.0,"label":"Very Dry"}
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
     * 1. Save FlowGIS / GEE analysis result directly via Download URL
     */
    public function publishAnalysisLayer(array $flowgisResult, string $workspaceId, string $layerName)
    {
        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
        ])->timeout(180)->post("{$this->baseUrl}/s2s/publish-from-url", [
            'workspace_id'      => $workspaceId,
            'layer_name'        => $layerName,
            'description'       => 'Automated flood analysis for user ' . auth()->user()->name,
            'download_url'      => $flowgisResult['download_url'], // 1-band GeoTIFF URL from GEE
            'style_sld'         => $flowgisResult['style_sld'],    // Full XML SLD from FlowGIS
            'client_user_id'    => (string) auth()->id(),          // Laravel user ownership tag
            'client_user_email' => auth()->user()->email,
            'client_user_name'  => auth()->user()->name,
            'statistics'        => $flowgisResult['statistics'] ?? null,
            'legends'           => $flowgisResult['legends'] ?? null,
            'maps'              => $flowgisResult['maps'] ?? null,
        ]);

        if ($response->successful()) {
            return $response->json()['data'];
        }

        throw new \\Exception('Failed to publish to AstraGIS: ' . $response->body());
    }

    /**
     * 2. Fetch entire layer history owned by logged-in user for FlowGIS right sidebar
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
    "description": "Automated flood risk analysis result from FlowGIS",
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
  "detail": "Layer 'Flood Risk Analysis' published successfully from URL via S2S.",
  "data": {
    "id": 65,
    "layer_name": "Flood Risk Analysis",
    "geoserver_name": "s2s_7f8a9b0c...",
    "workspace": "ws_flowgis_project",
    "workspace_display_name": "FlowGIS Workspace",
    "client_user_id": "42",
    "wms_url": "${geoserverWms}",
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
      "description": "Flood risk analysis result",
      "workspace_id": 7,
      "workspace_name": "ws_flowgis_project",
      "workspace_display_name": "FlowGIS Workspace",
      "client_user_id": "42",
      "data_type": "GeoTiff",
      "epsg": 4326,
      "bbox": [100.45, 13.68, 100.65, 13.88],
      "wms_url": "${geoserverWms}",
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
    "name": "Combined_Flood_Rainfall",
    "title": "Combined Flood & Rainfall",
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
    "wms_url": "${geoserverWms}",
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
# URL: \${geoserverWms}

# Leaflet Javascript Example:
L.tileLayer.wms("\${geoserverWms}", {
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
        {/* ── Brand Header (matches Dashboard theme) ── */}
        <header className="bg-blue-950 shadow-md border-b border-blue-900 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
            <Link to="/" className="flex items-center gap-3">
              <img src={Logo} alt="Logo" className="h-8" />
              <span className="text-xl font-bold text-white tracking-wide">AstraGIS</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-900/80 text-blue-200 border border-blue-700/60">
                Documentation
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/"
                className="hidden sm:inline-block text-xs sm:text-sm font-medium text-slate-300 hover:text-white transition px-2 py-1"
              >
                Home
              </Link>
              <Link
                to="/dashboard"
                className="px-3.5 py-1.5 text-xs sm:text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-sm transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* ── Top Hero Banner (matches Dashboard banner) ── */}
        <div className="doc-hero">
          <div className="doc-hero-glow" />
          <div className="doc-hero-content">
            <div className="doc-hero-badge"><FiGlobe size={13} /> REST API Gateway</div>
            <h1 className="doc-hero-title">API Documentation</h1>
            <p className="doc-hero-subtitle">
              System-to-System (S2S) integration guide for <strong>{appName}</strong> with FlowGIS, Laravel, and external systems.
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
        </div>

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
            <Section id="intro" icon={FiGlobe} title="Introduction" defaultOpen>
              <p className="doc-p">
                <strong>{appName}</strong> provides a REST API for System-to-System (S2S) integrations.
                External systems such as <strong>FlowGIS</strong> and <strong>Laravel</strong> backends
                can automatically publish GeoTIFF layers to GeoServer, both via <strong>direct Download URLs from Google Earth Engine (GEE)</strong>{' '}
                and direct file uploads.
              </p>
              <div className="doc-info-box">
                <strong>API Base URL:</strong>
                <br />
                <code>{apiBase}</code>
              </div>
              <div className="doc-grid-2">
                <div className="doc-feature-card">
                  <div className="doc-feature-icon">🌐</div>
                  <h3>Direct URL Publishing</h3>
                  <p>Publish layers directly from Google Earth Engine download URLs without manual file uploads.</p>
                </div>
                <div className="doc-feature-card">
                  <div className="doc-feature-icon">👥</div>
                  <h3>Multi-User Support</h3>
                  <p>Supports <code>client_user_id</code> tagging so Laravel can display layer history per user.</p>
                </div>
                <div className="doc-feature-card">
                  <div className="doc-feature-icon">🎨</div>
                  <h3>Raw XML SLD &amp; JSON Style</h3>
                  <p>Full XML SLD support from FlowGIS or JSON-based color mapping rules.</p>
                </div>
                <div className="doc-feature-card">
                  <div className="doc-feature-icon">📊</div>
                  <h3>Metadata &amp; Logging</h3>
                  <p>Store spatial analysis statistics, legends, and audit logs in the database.</p>
                </div>
              </div>
            </Section>

            {/* Auth */}
            <Section id="auth" icon={FiKey} title="Authentication" badge="API Key">
              <p className="doc-p">
                All S2S endpoints use an <strong>API Key</strong> sent via the HTTP
                header <code>X-API-Key</code>. API Keys are per-project and can be managed in the{' '}
                <em>Project → API Keys</em> tab on the dashboard.
              </p>
              <div className="doc-step-list">
                <div className="doc-step">
                  <span className="doc-step-num">1</span>
                  <div>
                    <strong>Generate API Key</strong>
                    <p>Go to dashboard → open your Project → <em>API Keys</em> tab → click Generate API Key.</p>
                  </div>
                </div>
                <div className="doc-step">
                  <span className="doc-step-num">2</span>
                  <div>
                    <strong>Copy API Key</strong>
                    <p>The API Key is only shown <strong>once</strong> upon creation. Save it in your environment variables (e.g. in Laravel <code>.env</code>).</p>
                  </div>
                </div>
                <div className="doc-step">
                  <span className="doc-step-num">3</span>
                  <div>
                    <strong>Send in Request Header</strong>
                    <p>Include the API Key in every request using header <code>X-API-Key: agis_sk_...</code>.</p>
                  </div>
                </div>
              </div>
              <CodeBlock code={`X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`} language="http" />
              <div className="doc-warning-box">
                <FiAlertTriangle size={15} />
                <span>
                  Keep your API Key secure in your backend (e.g. in Laravel or FlowGIS services). Never
                  expose it in client-side / browser code.
                </span>
              </div>
            </Section>

            {/* Endpoint 1: POST /s2s/publish-from-url */}
            <Section id="publish-url" icon={FiUploadCloud} title="POST /s2s/publish-from-url" badge="Recommended (GEE Ready)">
              <p className="doc-p">
                This endpoint is designed specifically for integration with <strong>FlowGIS</strong> and systems that produce
                direct GeoTIFF download URLs from <strong>Google Earth Engine</strong>. The {appName} backend streams
                the file, publishes it to GeoServer, applies XML SLD styling, and saves analysis metadata.
              </p>

              <div className="doc-endpoint-card">
                <span className="doc-method-badge">POST</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/publish-from-url</code>
              </div>

              <h3 className="doc-subtitle">Request Body (application/json)</h3>
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Field</th><th>Type</th><th>Status</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    <ParamRow name="workspace_id"      type="string" required desc="Target workspace Hashed ID or integer." />
                    <ParamRow name="layer_name"        type="string" required desc="Display layer name (e.g. 'Flood Risk Analysis')." />
                    <ParamRow name="download_url"      type="string" required desc="Direct 1-band GeoTIFF download URL (from GEE getDownloadURL / getPixels)." />
                    <ParamRow name="style_sld"         type="string" required={false} desc="Ready-to-use XML SLD document generated by FlowGIS." />
                    <ParamRow name="client_user_id"    type="string" required={false} desc="User ID in client system (e.g. Laravel user ID) for multi-user data isolation." />
                    <ParamRow name="client_user_email" type="string" required={false} desc="Client user email (optional, for audit logs)." />
                    <ParamRow name="description"       type="string" required={false} desc="Short layer description." />
                    <ParamRow name="statistics"        type="object" required={false} desc="Spatial analysis statistics (avg_elevation, risk_distribution, etc)." />
                    <ParamRow name="legends"           type="object" required={false} desc="Color and category legend object." />
                    <ParamRow name="maps"              type="object" required={false} desc="Complementary tile URL from GEE." />
                  </tbody>
                </table>
              </div>

              <h3 className="doc-subtitle">Response Example (201 Created)</h3>
              <CodeBlock code={SUCCESS_RESPONSE_URL} language="json" />
            </Section>

            {/* Endpoint 2: POST /s2s/publish */}
            <Section id="publish-file" icon={FiUploadCloud} title="POST /s2s/publish (File Upload)" badge="Multipart">
              <p className="doc-p">
                Conventional endpoint for uploading 1-band binary GeoTIFF files directly
                using <code>multipart/form-data</code>.
              </p>

              <div className="doc-endpoint-card">
                <span className="doc-method-badge">POST</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/publish</code>
              </div>

              <h3 className="doc-subtitle">Request Parameters (multipart/form-data)</h3>
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Field</th><th>Type</th><th>Status</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    <ParamRow name="workspace_id"   type="string" required desc="Target workspace Hashed ID." />
                    <ParamRow name="layer_name"     type="string" required desc="Layer display name." />
                    <ParamRow name="file"           type="file"   required desc="GeoTIFF file (.tif / .tiff), must be 1-band (single-band)." />
                    <ParamRow name="client_user_id" type="string" required={false} desc="Client system user ID (Laravel user ID)." />
                    <ParamRow name="description"    type="string" required={false} desc="Layer description." />
                    <ParamRow name="style"          type="JSON string" required={false} desc="Array of ColorEntry in JSON string format." />
                    <ParamRow name="style_sld"      type="string" required={false} desc="Full XML SLD document (optional)." />
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Endpoint 3: GET /s2s/layers */}
            <Section id="multiuser-query" icon={FiCode} title="GET /s2s/layers (Multi-User History Query)" badge="Multi-User">
              <p className="doc-p">
                This endpoint is used by systems like <strong>Laravel (`flowgis-business-process`)</strong> to
                fetch analysis layer history owned by a specific user. Results can be directly displayed
                in the <strong>Layers</strong> popup in FlowGIS.
              </p>

              <div className="doc-endpoint-card">
                <span className="doc-method-badge" style={{ background: '#238636', borderColor: '#2ea043' }}>GET</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/layers</code>
              </div>

              <h3 className="doc-subtitle">Query Parameters</h3>
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Parameter</th><th>Type</th><th>Status</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    <ParamRow name="client_user_id" type="string" required={false} desc="Filter only layers belonging to this user ID in Laravel. If empty, returns all layers in the API Key's project." />
                    <ParamRow name="workspace_id"   type="string" required={false} desc="Filter by a specific workspace." />
                    <ParamRow name="page"           type="number" required={false} desc="Page number (default: 1)." />
                    <ParamRow name="size"           type="number" required={false} desc="Number of items per page (default: 50, max: 500)." />
                  </tbody>
                </table>
              </div>

              <h3 className="doc-subtitle">Response Example (200 OK)</h3>
              <CodeBlock code={SUCCESS_RESPONSE_LAYERS} language="json" />
            </Section>

            {/* Endpoint 4: S2S Layer Groups */}
            <Section id="layer-groups" icon={FiCode} title="S2S Layer Groups (Composite Layer Groups)" badge="S2S Multi-User">
              <p className="doc-p">
                This endpoint allows external systems like <strong>FlowGIS</strong> to combine multiple analysis layers
                into a single <strong>Layer Group</strong> in GeoServer. The layer group can be rendered on the map
                using a single WMS layer call, complete with delete controls and per-user filtering (<code>client_user_id</code>).
              </p>

              <h3 className="doc-subtitle">1. Create Layer Group (POST /s2s/layer-groups)</h3>
              <div className="doc-endpoint-card">
                <span className="doc-method-badge">POST</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/layer-groups</code>
              </div>
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Field</th><th>Type</th><th>Status</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    <ParamRow name="workspace_id"   type="string / int" required desc="Target workspace ID." />
                    <ParamRow name="name"           type="string"       required desc="Layer group name (no spaces / special symbols, e.g. 'Flood_Rainfall_Group')." />
                    <ParamRow name="title"          type="string"       required={false} desc="Layer group display title." />
                    <ParamRow name="client_user_id" type="string"       required={false} desc="User ID in client system (Laravel auth user ID)." />
                    <ParamRow name="layer_ids"      type="array[int]"   required desc="List of member layer IDs to combine." />
                  </tbody>
                </table>
              </div>
              <CodeBlock code={CURL_CREATE_GROUP} language="bash" />
              <CodeBlock code={SUCCESS_RESPONSE_GROUPS} language="json" />

              <h3 className="doc-subtitle">2. List Layer Groups (GET /s2s/layer-groups)</h3>
              <div className="doc-endpoint-card">
                <span className="doc-method-badge" style={{ background: '#238636', borderColor: '#2ea043' }}>GET</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/layer-groups?client_user_id=42</code>
              </div>
              <CodeBlock code={CURL_GET_GROUPS} language="bash" />

              <h3 className="doc-subtitle">3. Delete Layer Group (DELETE /s2s/layer-groups/:id)</h3>
              <div className="doc-endpoint-card">
                <span className="doc-method-badge" style={{ background: '#da3633', borderColor: '#f85149' }}>DELETE</span>
                <code className="doc-endpoint-path">{apiBase}/s2s/layer-groups/12</code>
              </div>
            </Section>

            {/* Style */}
            <Section id="style" icon={FiCode} title="Style Formats (ColorMap &amp; SLD)" badge="Optional">
              <p className="doc-p">
                You can provide styles in two ways:
                <br />
                1. <strong>Full XML SLD</strong> (field <code>style_sld</code>): standard OpenGIS format applied directly to GeoServer.
                <br />
                2. <strong>JSON ColorMap Array</strong> (field <code>style</code>): array of color rules based on quantity values.
              </p>

              <h3 className="doc-subtitle">ColorEntry Structure (JSON Style)</h3>
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Field</th><th>Type</th><th>Status</th><th>Description</th></tr>
                  </thead>
                  <tbody>
                    <ParamRow name="quantity" type="number" required desc="Raster pixel value (e.g. 1, 2, 3, 4, 5)." />
                    <ParamRow name="color"    type="string (hex)" required desc='Color in HEX format (e.g. "#FF0000").' />
                    <ParamRow name="opacity"  type="number (0–1)" required desc="Color opacity (1.0 = opaque, 0.0 = transparent)." />
                    <ParamRow name="label"    type="string" required={false} desc='Descriptive label (e.g. "Critical Risk").' />
                  </tbody>
                </table>
              </div>
            </Section>

            {/* Examples */}
            <Section id="examples" icon={FiCode} title="Complete Code Examples" defaultOpen>
              <h3 className="doc-subtitle">PHP / Laravel (flowgis-business-process)</h3>
              <p className="doc-p text-sm text-slate-400 mb-2">
                Example service implementation in Laravel to publish GEE analysis results and fetch user layer history:
              </p>
              <CodeBlock code={LARAVEL_CODE} language="php" />

              <h3 className="doc-subtitle">Python — Publish from Google Earth Engine URL</h3>
              <CodeBlock code={PYTHON_PUBLISH_URL_CODE} language="python" />

              <h3 className="doc-subtitle">cURL — Publish from URL (FlowGIS JSON)</h3>
              <CodeBlock code={CURL_PUBLISH_URL} language="bash" />

              <h3 className="doc-subtitle">cURL — Fetch Layers for Specific User</h3>
              <CodeBlock code={CURL_GET_LAYERS} language="bash" />

              <h3 className="doc-subtitle">Display Layer on Leaflet Map (WMS GetMap)</h3>
              <CodeBlock code={WMS_USAGE} language="javascript" />
            </Section>

            {/* Errors */}
            <Section id="errors" icon={FiAlertTriangle} title="Error Codes">
              <div className="doc-table-wrapper">
                <table className="doc-table">
                  <thead>
                    <tr><th>Code</th><th>Meaning</th><th>Solution</th></tr>
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
                Need help? Open{' '}
                <a href={`${apiBase}/docs`} target="_blank" rel="noreferrer">
                  Swagger UI
                </a>{' '}
                to explore and test endpoints interactively.
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
    background: #f1f5f9;
    color: #1e293b;
    font-family: 'Inter', system-ui, sans-serif;
    font-size: 15px;
    line-height: 1.7;
  }

  /* Hero */
  .doc-hero {
    position: relative;
    overflow: hidden;
    padding: 56px 40px 48px;
    background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #312e81 100%);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  .doc-hero-glow {
    position: absolute;
    top: -80px;
    right: -80px;
    width: 450px;
    height: 450px;
    background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
    pointer-events: none;
  }
  .doc-hero-content { position: relative; max-width: 900px; margin: 0 auto; }
  .doc-hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 255, 255, 0.12);
    color: #bfdbfe;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 20px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .5px;
    margin-bottom: 16px;
    backdrop-blur: 4px;
  }
  .doc-hero-title {
    font-size: clamp(28px, 5vw, 42px);
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 12px;
    line-height: 1.15;
    letter-spacing: -0.5px;
  }
  .doc-hero-subtitle {
    color: #dbeafe;
    font-size: 15px;
    margin: 0 0 22px;
    max-width: 650px;
    line-height: 1.6;
  }
  .doc-hero-subtitle strong { color: #ffffff; }
  .doc-hero-meta { display: flex; gap: 8px; flex-wrap: wrap; }
  .doc-hero-pill {
    background: rgba(255, 255, 255, 0.12);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    padding: 4px 12px;
    font-size: 12px;
    color: #e0e7ff;
    text-decoration: none;
    backdrop-blur: 4px;
  }
  .doc-hero-pill-link { 
    background: #2563eb; 
    border-color: #3b82f6; 
    color: #ffffff; 
    font-weight: 600; 
    cursor: pointer; 
  }
  .doc-hero-pill-link:hover { background: #1d4ed8; color: #ffffff; }

  /* Layout */
  .doc-layout {
    display: flex;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px 80px;
    gap: 32px;
  }

  /* Sidebar Nav */
  .doc-nav {
    flex-shrink: 0;
    width: 220px;
    padding-top: 32px;
    position: sticky;
    top: 72px;
    height: fit-content;
  }
  .doc-nav-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .5px;
    text-transform: uppercase;
    color: #64748b;
    margin: 0 0 12px;
  }
  .doc-nav-item {
    display: block;
    width: 100%;
    text-align: left;
    background: none;
    border: none;
    border-left: 2px solid transparent;
    padding: 8px 14px;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 0 8px 8px 0;
    transition: all .15s ease;
  }
  .doc-nav-item:hover { color: #1e40af; border-left-color: #93c5fd; background: rgba(226, 232, 240, 0.6); }
  .doc-nav-active { 
    color: #1d4ed8 !important; 
    border-left-color: #2563eb !important; 
    background: #dbeafe !important; 
    font-weight: 600; 
  }

  /* Main content */
  .doc-main {
    flex: 1;
    min-width: 0;
    padding-top: 32px;
  }

  /* Sections */
  .doc-section {
    margin-bottom: 24px;
    background: #ffffff;
    border: 1px solid #cbd5e1;
    border-radius: 16px;
    overflow: hidden;
    scroll-margin-top: 90px;
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
  }
  .doc-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 18px 24px;
    background: #ffffff;
    border: none;
    color: #0f172a;
    cursor: pointer;
    border-bottom: 1px solid #e2e8f0;
    gap: 12px;
    transition: background-color .15s ease;
  }
  .doc-section-header:hover { background: #f8fafc; }
  .doc-section-title {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .doc-section-title h2 {
    font-size: 16px;
    font-weight: 700;
    margin: 0;
    color: #0f172a;
  }
  .doc-section-icon {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: #eff6ff;
    color: #2563eb;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid #dbeafe;
  }
  .doc-badge {
    background: #ecfdf5;
    color: #047857;
    border: 1px solid #a7f3d0;
    border-radius: 6px;
    font-size: 11px;
    font-weight: 700;
    padding: 2px 8px;
    letter-spacing: .5px;
    text-transform: uppercase;
  }
  .doc-section-body { padding: 24px; }

  /* Typography */
  .doc-p { color: #475569; margin: 0 0 16px; font-size: 14.5px; }
  .doc-p strong { color: #0f172a; }
  .doc-p em { color: #2563eb; font-style: normal; }
  .doc-subtitle {
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    letter-spacing: .5px;
    text-transform: uppercase;
    margin: 24px 0 10px;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 6px;
  }
  .doc-list {
    color: #475569;
    padding-left: 20px;
    margin: 0 0 16px;
  }
  .doc-list li { margin-bottom: 6px; }
  .doc-list strong, .doc-list code { color: #0f172a; }

  /* Code blocks */
  .doc-code-wrapper {
    border: 1px solid #334155;
    border-radius: 12px;
    overflow: hidden;
    margin: 14px 0;
    background: #0f172a;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  }
  .doc-code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: #1e293b;
    border-bottom: 1px solid #334155;
  }
  .doc-code-lang {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: #94a3b8;
    letter-spacing: 1px;
  }
  .doc-copy-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    background: #334155;
    border: 1px solid #475569;
    border-radius: 6px;
    color: #cbd5e1;
    font-size: 12px;
    padding: 3px 10px;
    cursor: pointer;
    transition: all .15s;
  }
  .doc-copy-btn:hover { background: #475569; color: #ffffff; }
  .doc-code-block {
    margin: 0;
    padding: 16px 20px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.75;
    color: #e2e8f0;
    font-family: 'Fira Code', 'Cascadia Code', 'JetBrains Mono', monospace;
  }
  code {
    background: #eff6ff;
    color: #1d4ed8;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: .9em;
    font-family: 'Fira Code', monospace;
    border: 1px solid #dbeafe;
  }
  .doc-code-block code {
    background: none;
    padding: 0;
    color: inherit;
    border: none;
  }

  /* Tables */
  .doc-table-wrapper { 
    overflow-x: auto; 
    margin: 10px 0 16px; 
    border-radius: 12px; 
    border: 1px solid #e2e8f0; 
    background: #ffffff;
  }
  .doc-table { width: 100%; border-collapse: collapse; font-size: 13.5px; }
  .doc-table th {
    background: #f8fafc;
    color: #475569;
    font-weight: 700;
    font-size: 11px;
    letter-spacing: .5px;
    text-transform: uppercase;
    padding: 12px 16px;
    text-align: left;
    border-bottom: 1px solid #e2e8f0;
  }
  .doc-table-row td { 
    padding: 12px 16px; 
    border-top: 1px solid #f1f5f9; 
    vertical-align: top; 
    color: #334155;
  }
  .doc-table-row:hover td { background: #f8fafc; }
  .doc-param-name { 
    color: #1e40af; 
    font-weight: 600; 
    background: #eff6ff; 
    padding: 2px 6px; 
    border-radius: 4px; 
    border: 1px solid #dbeafe; 
  }
  .doc-param-desc { color: #475569; font-size: 13px; }
  .doc-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; }
  .doc-tag-type { background: #eff6ff; color: #2563eb; border: 1px solid #dbeafe; }
  .doc-tag-required { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
  .doc-tag-optional { background: #f1f5f9; color: #64748b; border: 1px solid #e2e8f0; }
  .doc-error-code { 
    font-size: 13px; 
    font-weight: 700; 
    color: #b91c1c; 
    background: #fef2f2; 
    border: 1px solid #fecaca; 
    padding: 2px 8px; 
    border-radius: 4px; 
  }

  /* Info/Warning boxes */
  .doc-info-box {
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 12px;
    padding: 14px 18px;
    color: #1e40af;
    font-size: 13.5px;
    margin: 16px 0;
  }
  .doc-info-box code { color: #1d4ed8; background: #dbeafe; }
  .doc-warning-box {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    background: #fffbeb;
    border: 1px solid #fde68a;
    border-radius: 12px;
    padding: 14px 18px;
    color: #92400e;
    font-size: 13.5px;
    margin: 16px 0;
  }
  .doc-warning-box svg { flex-shrink: 0; margin-top: 2px; }

  /* Endpoint card */
  .doc-endpoint-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 12px 18px;
    margin: 10px 0 20px;
    font-family: 'Fira Code', monospace;
  }
  .doc-method-badge {
    background: #2563eb;
    color: #ffffff;
    font-size: 12px;
    font-weight: 800;
    padding: 3px 10px;
    border-radius: 6px;
    letter-spacing: 1px;
    flex-shrink: 0;
  }
  .doc-endpoint-path {
    background: none;
    color: #0f172a;
    font-size: 13.5px;
    padding: 0;
    word-break: break-all;
    border: none;
  }

  /* Feature grid */
  .doc-grid-2 {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
    margin: 18px 0;
  }
  .doc-feature-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 18px;
    transition: all .2s ease;
  }
  .doc-feature-card:hover { 
    border-color: #93c5fd; 
    background: #f0f9ff;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    transform: translateY(-1px);
  }
  .doc-feature-icon { font-size: 22px; margin-bottom: 8px; }
  .doc-feature-card h3 { font-size: 14px; font-weight: 700; color: #0f172a; margin: 0 0 6px; }
  .doc-feature-card p { font-size: 13px; color: #64748b; margin: 0; line-height: 1.5; }

  /* Steps */
  .doc-step-list { display: flex; flex-direction: column; gap: 12px; margin: 12px 0 16px; }
  .doc-step { display: flex; gap: 14px; align-items: flex-start; }
  .doc-step-num {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    background: #eff6ff;
    color: #2563eb;
    font-weight: 800;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1px solid #bfdbfe;
  }
  .doc-step strong { color: #0f172a; display: block; margin-bottom: 2px; }
  .doc-step p { color: #64748b; margin: 0; font-size: 13.5px; }

  /* Footer */
  .doc-footer {
    margin-top: 32px;
    padding: 24px;
    text-align: center;
    color: #64748b;
    font-size: 13px;
    border-top: 1px solid #e2e8f0;
  }
  .doc-footer a { color: #2563eb; text-decoration: none; font-weight: 600; }
  .doc-footer a:hover { text-decoration: underline; }

  @media (max-width: 768px) {
    .doc-hero { padding: 40px 20px 32px; }
    .doc-layout { flex-direction: column; padding: 0 16px 60px; }
    .doc-nav { display: flex; width: 100%; overflow-x: auto; padding: 12px 0 0; position: static; }
    .doc-nav-label { display: none; }
    .doc-nav-item { flex-shrink: 0; border-left: none; border-bottom: 2px solid transparent; border-radius: 6px 6px 0 0; }
    .doc-nav-active { border-left-color: transparent !important; border-bottom-color: #2563eb !important; }
  }
`

export default Documentation