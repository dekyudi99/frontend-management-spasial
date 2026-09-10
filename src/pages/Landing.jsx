import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Layers, 
  Cpu, 
  Palette, 
  Database, 
  ShieldCheck, 
  Terminal, 
  ArrowRight, 
  ExternalLink, 
  BookOpen, 
  Server,
  Activity,
  CheckCircle2,
  Copy,
  Check
} from 'lucide-react';
import BgHome from "../assets/bgHome.jpg";
import Logo from "../assets/logo2.png";

const appName = import.meta.env.VITE_APP_NAME || "AstraGIS";
const docsUrl = import.meta.env.VITE_API_DOCS || "http://localhost:8000/docs";
const apiBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Scalable Configuration: Feature capabilities
const FEATURES = [
  {
    icon: Layers,
    title: "OGC Standard Web Services",
    description: "Instantly serves published raster and vector layers via WMS 1.1.1 / 1.3.0 and WFS with sub-second tile delivery.",
    tag: "GeoServer Powered",
    color: "from-blue-600/20 to-sky-500/20",
    border: "hover:border-blue-500/50",
    iconColor: "text-blue-400"
  },
  {
    icon: Cpu,
    title: "Asynchronous S2S Pipeline",
    description: "Server-to-server API endpoints allowing external services (such as FlowGIS and GEE pipelines) to publish GeoTIFFs without client lag.",
    tag: "Async Workflow",
    color: "from-indigo-600/20 to-blue-600/20",
    border: "hover:border-indigo-500/50",
    iconColor: "text-indigo-400"
  },
  {
    icon: Palette,
    title: "Dynamic Color Mapping & SLD",
    description: "Generate and customize Styled Layer Descriptors (SLD) on the fly with custom color ramps, intervals, and continuous palettes.",
    tag: "Visual Styling",
    color: "from-purple-600/20 to-indigo-600/20",
    border: "hover:border-purple-500/50",
    iconColor: "text-purple-400"
  },
  {
    icon: Database,
    title: "PostGIS Spatial Engine",
    description: "Spatial indexing, bounding box computation, and geometric operations powered by enterprise-grade PostgreSQL with PostGIS.",
    tag: "Spatial Storage",
    color: "from-amber-500/20 to-orange-500/20",
    border: "hover:border-amber-500/50",
    iconColor: "text-amber-400"
  },
  {
    icon: ShieldCheck,
    title: "API Key Management",
    description: "Scoped project credentials with SHA-256 encrypted authentication for secure inter-service communication.",
    tag: "Security",
    color: "from-blue-600/20 to-indigo-600/20",
    border: "hover:border-blue-500/50",
    iconColor: "text-blue-400"
  },
  {
    icon: Terminal,
    title: "Layer Group Composition",
    description: "Merge multiple raster and vector layers into unified composite WMS map services with customizable z-ordering.",
    tag: "Multi-Layer Groups",
    color: "from-sky-500/20 to-blue-600/20",
    border: "hover:border-sky-500/50",
    iconColor: "text-sky-400"
  },
];

// Scalable Metrics / Stats
const SYSTEM_METRICS = [
  { label: "OGC Standards", value: "WMS & WFS" },
  { label: "Engine Integration", value: "GeoServer 2.28" },
  { label: "Database Layer", value: "PostGIS 3.3" },
  { label: "API Protocol", value: "REST & S2S" },
];

const Landing = () => {
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const isAuthenticated = Boolean(localStorage.getItem("JWT_TOKEN"));

  useEffect(() => {
    document.title = `${appName} - Spatial Data Management System`;
  }, []);

  const sampleCurl = `curl -X POST "${apiBase}/s2s/publish-url" \\
  -H "X-API-Key: YOUR_S2S_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workspace_id": "YOUR_WORKSPACE_ID",
    "layer_name": "flood_risk_analysis",
    "url": "http://minio:9000/raster/output.tif"
  }'`;

  const copySampleCode = () => {
    navigator.clipboard.writeText(sampleCurl);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 selection:bg-blue-600 selection:text-white overflow-x-hidden">
      {/* Background Image with Ambient Glow Overlays matching Dashboard Blue/Indigo */}
      <div 
        className="fixed inset-0 bg-cover bg-center blur-xs scale-105 opacity-25 pointer-events-none"
        style={{ backgroundImage: `url(${BgHome})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-blue-950/80 via-slate-950/90 to-slate-950 pointer-events-none" />
      <div className="fixed -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed top-1/3 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Header (matching Dashboard bg-blue-950) */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-blue-950/90 border-b border-blue-900/60 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src={Logo} alt="AstraGIS Logo" className="h-9 w-auto object-contain transition-transform group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                AstraGIS <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-blue-900/80 text-blue-200 border border-blue-700/60">Server</span>
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-blue-400 transition-colors">Features</a>
            <a href="#integration" className="hover:text-blue-400 transition-colors">Integration</a>
            <Link to="/documentation" className="hover:text-blue-400 transition-colors">Documentation</Link>
            <a href={docsUrl} target="_blank" rel="noreferrer" className="hover:text-blue-400 transition-colors flex items-center gap-1">
              API Reference <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-md shadow-blue-600/30 transition-all flex items-center gap-1.5"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <Link 
                to="/auth/login" 
                className="px-4 py-2 text-sm font-medium bg-blue-900/60 hover:bg-blue-900 text-white rounded-lg border border-blue-700/60 transition-all hover:border-blue-500"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-16 pb-20 sm:pt-24 sm:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-900/50 border border-blue-500/40 text-blue-200 text-xs font-medium mb-8 backdrop-blur-sm shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span>OGC Compliant Geospatial Server • GeoServer Integrated</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-tight">
            Automate, Integrate, and Publish{' '}
            <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
              Spatial Data Services
            </span>
          </h1>

          {/* Subtitle Description */}
          <p className="mt-6 text-base sm:text-lg lg:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed">
            An enterprise geospatial data infrastructure engineered to instantly transform raw raster and vector outputs into OGC-standard Web Map Services (WMS). Powered by an asynchronous S2S pipeline that eliminates client-side lag.
          </p>

          {/* Primary Action Buttons (matching Dashboard royal blue buttons) */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <Link 
                to="/dashboard" 
                className="px-6 py-3.5 text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                Open Dashboard <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <Link 
                to="/auth/login" 
                className="px-6 py-3.5 text-base font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-xl shadow-blue-600/30 transition-all flex items-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
            )}

            <Link 
              to="/documentation" 
              className="px-6 py-3.5 text-base font-semibold bg-blue-950/80 hover:bg-blue-900/80 text-blue-100 rounded-xl border border-blue-800/80 hover:border-blue-600 transition-all flex items-center gap-2 backdrop-blur-sm"
            >
              <BookOpen className="w-5 h-5 text-blue-400" />
              Learn About AstraGIS
            </Link>

            <a 
              href={docsUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="px-5 py-3.5 text-base font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <Server className="w-4 h-4 text-sky-400" />
              API Docs <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Metrics Bar */}
          <div className="mt-16 pt-10 border-t border-blue-900/50 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {SYSTEM_METRICS.map((metric, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-xl sm:text-2xl font-bold text-white tracking-tight">{metric.value}</span>
                <span className="text-xs sm:text-sm text-slate-400 mt-1">{metric.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-blue-950/40 border-y border-blue-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Engineered for Geospatial Workflows</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">Comprehensive Spatial Infrastructure</h2>
              <p className="text-slate-400 text-sm sm:text-base mt-3">
                Everything required to ingest, store, style, and broadcast spatial layers across web and mobile GIS clients.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feat, idx) => {
                const IconComponent = feat.icon;
                return (
                  <div 
                    key={idx} 
                    className={`p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 transition-all duration-300 hover:-translate-y-1 ${feat.border} flex flex-col justify-between`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${feat.color} text-white`}>
                          <IconComponent className={`w-6 h-6 ${feat.iconColor || 'text-blue-400'}`} />
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700/50">
                          {feat.tag}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{feat.title}</h3>
                      <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* S2S Quick Integration Section */}
        <section id="integration" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-5 space-y-5">
              <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">Developer Friendly S2S API</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">
                Integrate Spatial Publishing in Minutes
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Connect your analytical pipelines (e.g., Google Earth Engine, Python backend, or FlowGIS) directly to AstraGIS via secure REST endpoints. Published layers are immediately accessible via Leaflet, MapLibre, OpenLayers, or QGIS.
              </p>

              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Instant WMS URL & Layer parameter generation</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Custom ColorMap palette injection via JSON</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>Automatic Bounding Box (BBox) spatial calculation</span>
                </div>
              </div>

              <div className="pt-3">
                <Link 
                  to="/documentation" 
                  className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 hover:text-blue-300"
                >
                  View complete S2S Documentation <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Code Snippet Card */}
            <div className="lg:col-span-7">
              <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 bg-slate-800/80 border-b border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="text-xs text-slate-400 font-mono ml-2">POST /s2s/publish-url</span>
                  </div>
                  <button 
                    onClick={copySampleCode}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-slate-700/50"
                  >
                    {copiedSnippet ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet ? "Copied" : "Copy cURL"}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-sky-300 overflow-x-auto leading-relaxed bg-slate-950/90">
                  <code>{sampleCurl}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-blue-900/60 bg-blue-950/90 py-8 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-slate-300">AstraGIS Spatial Infrastructure Server</span>
          </div>
          <p>© {new Date().getFullYear()} AstraGIS. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <Link to="/documentation" className="hover:text-white transition-colors">Docs</Link>
            <a href={docsUrl} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">API</a>
            <Link to="/dashboard" className="hover:text-white transition-colors">Console</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;