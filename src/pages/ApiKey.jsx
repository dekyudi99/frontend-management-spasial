import React, { useState, useEffect } from "react";
import { message, Modal, Button, Tag, Spin, Tooltip, Statistic } from "antd";
import { 
  KeyIcon, 
  ArrowPathIcon, 
  ClipboardDocumentCheckIcon, 
  ClipboardDocumentIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  CodeBracketIcon,
  ExclamationTriangleIcon,
  CircleStackIcon,
  SignalIcon
} from "@heroicons/react/24/outline";
import keyApi from "../api/KeyApi";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/PageHeader";

import { GEOSERVER_API_V1 } from "../api/microserviceConfig";

const geoService = GEOSERVER_API_V1;

const ApiKey = () => {
  const { t, language, translateApi } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyData, setKeyData] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = `${t('apiKeys', 'API Key & Akses Sistem (S2S)')} | AstraGIS`;
  }, [language, t]);

  // Connection Test State
  const [connStatus, setConnStatus] = useState({
    tested: false,
    connected: true,
    version: "2.28.2",
    latency_ms: 12,
    service_status: "ok",
    testing: false
  });

  const fetchKey = async () => {
    setLoading(true);
    try {
      const res = await keyApi.getMyKey();
      setKeyData(res.data);
      const secret = res.data?.full_key || res.data?.plain_key;
      if (secret && res.data?.is_active) {
        localStorage.setItem("astragis_s2s_key", secret);
      } else if (res.data?.is_active === false) {
        localStorage.removeItem("astragis_s2s_key");
      }
    } catch (err) {
      message.error(translateApi(err.response?.data?.detail) || t('loadKeyFailed', "Gagal memuat API Key."));
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (isManual = false) => {
    setConnStatus(prev => ({ ...prev, testing: true }));
    try {
      const res = await keyApi.testConnection();
      const isOk = res.data?.connected ?? true;
      setConnStatus({
        tested: true,
        connected: isOk,
        version: res.data?.geoserver_version || "2.28.2",
        latency_ms: res.data?.latency_ms || 15,
        service_status: res.data?.service_status || "ok",
        testing: false
      });
      if (isManual) {
        if (isOk) {
          message.success(t('connectionSuccess', "Koneksi ke GeoServer Microservice berhasil! (Online)"));
        } else {
          message.warning(t('connectionFailed', "GeoServer Microservice tidak dapat terhubung ke GeoServer Backend."));
        }
      }
    } catch (err) {
      setConnStatus({
        tested: true,
        connected: false,
        version: null,
        latency_ms: 0,
        service_status: "error",
        testing: false
      });
      if (isManual) {
        message.error(t('connectionFailed', "Koneksi gagal: GeoServer Microservice tidak merespons."));
      }
    }
  };

  useEffect(() => {
    fetchKey();
    handleTestConnection(false); // Silent check on initial load, no duplicate toast!
  }, []);

  // Salin full plain key ke clipboard (metode Cloudflare)
  const handleCopyFullKey = () => {
    const fullSecret = keyData?.full_key || keyData?.plain_key || localStorage.getItem("astragis_s2s_key");
    if (!fullSecret) {
      message.warning(t('keyUnavailable', "Kunci rahasia belum tersedia atau sedang dinonaktifkan."));
      return;
    }
    navigator.clipboard.writeText(fullSecret);
    setCopied(true);
    message.success(t('keyCopied', "API Key lengkap berhasil disalin ke clipboard!"));
    setTimeout(() => setCopied(false), 2500);
  };

  const confirmRefresh = () => {
    Modal.confirm({
      title: t('refreshKeyConfirm', "Refresh API Key Anda?"),
      content: (
        <div className="space-y-2 mt-2">
          <p className="text-slate-600 text-sm">
            {t('refreshKeyDesc', "Tindakan ini akan menonaktifkan kunci sebelumnya secara permanen di GeoServer Microservice.")}
          </p>
          <p className="text-amber-600 text-xs font-medium">
            {t('refreshKeyWarningNotice', "Koneksi pihak ketiga atau skrip S2S yang menggunakan kunci lama harus diperbarui dengan kunci baru.")}
          </p>
        </div>
      ),
      okText: t('refreshKey', "Ya, Refresh Kunci"),
      okType: "danger",
      cancelText: t('cancel', "Batal"),
      onOk: async () => {
        setRefreshing(true);
        try {
          const res = await keyApi.refreshKey();
          const newSecret = res.data?.full_key || res.data?.api_key || res.data?.plain_key;
          setKeyData(prev => ({
            ...prev,
            masked_key: res.data.masked_key,
            full_key: newSecret,
            plain_key: newSecret,
            is_active: res.data.is_active
          }));
          if (newSecret) {
            localStorage.setItem("astragis_s2s_key", newSecret);
          }
          message.success(t('keyRefreshedSuccess', "API Key baru berhasil diterbitkan dan disinkronkan!"));
        } catch (err) {
          message.error(translateApi(err.response?.data?.detail) || t('keyRefreshFailed', "Gagal me-refresh API Key."));
        } finally {
          setRefreshing(false);
        }
      }
    });
  };

  const fullSecretForCode = keyData?.full_key || keyData?.plain_key || localStorage.getItem("astragis_s2s_key") || "gsvc_sk_your_key_here";
  const diskUsage = keyData?.disk_usage;

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6">
      {/* Header (DRY PageHeader Component) */}
      <PageHeader
        icon={KeyIcon}
        title={t('apiKeys', 'API Key & Akses Sistem (S2S)')}
        subtitle={t('apiKeySubtitle', "Kelola kredensial akses modular untuk microservice AstraGIS terisolasi.")}
        iconBgColor="bg-blue-600"
        iconColor="text-white"
      />

      {/* 1. Microservice Connection & Heartbeat Card */}
                <div className="bg-white rounded-2xl p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${connStatus.connected ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                      <SignalIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          {t('microserviceStatus', 'Status Microservice')}
                        </span>
                        <Tag 
                          color={connStatus.connected ? "green" : "red"} 
                          className="font-mono font-bold text-[11px] px-2 py-0.5 rounded-full"
                        >
                          <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${connStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                          {connStatus.connected ? t('connected', 'TERHUBUNG') : t('disconnected', 'TIDAK TERHUBUNG')}
                        </Tag>
                        {connStatus.connected && (
                          <span className="text-xs font-mono text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                            {connStatus.latency_ms} ms {connStatus.version ? `(GeoServer v${connStatus.version})` : ''}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">
                        Endpoint: <span className="text-blue-600">{geoService}</span>
                      </p>
                    </div>
                  </div>

                  <Button
                    htmlType="button"
                    icon={<ArrowPathIcon className={`w-4 h-4 ${connStatus.testing ? "animate-spin" : ""}`} />}
                    loading={connStatus.testing}
                    onClick={(e) => {
                      e.preventDefault();
                      handleTestConnection(true);
                    }}
                    className="self-start sm:self-auto rounded-xl font-medium text-xs h-9 px-4 hover:!border-blue-500 hover:!text-blue-600"
                  >
                    {connStatus.testing ? t('testingConnection', 'Menguji...') : t('testConnection', 'Uji Koneksi Ulang')}
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center items-center py-20">
                    <Spin size="large" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Key Box (Cloudflare Style) & Disk Usage */}
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">{keyData?.name || t('standardApiKey', "Standard API Key")}</h3>
                            <p className="text-xs text-slate-400 mt-0.5">{t('boundaryDesc', "Boundary kepemilikan data spasial GeoServer akun Anda")}</p>
                          </div>
                          <Tag color={keyData?.is_active ? "green" : "red"} className="px-3 py-1 text-xs font-semibold rounded-full flex items-center gap-1">
                            {keyData?.is_active ? (
                              <div className="flex items-center gap-1 font-mono">
                                <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                                {t('keyActive', 'AKTIF')}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 font-mono">
                                <XCircleIcon className="w-4 h-4 text-rose-600" />
                                {t('keyInactive', 'NONAKTIF')}
                              </div>
                            )}
                          </Tag>
                        </div>

                        {/* Cloudflare-style Key Display Box */}
                        <div className="space-y-2">
                          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                            {t('apiKeyCredentials', 'API Key Kredensial')}
                          </label>
                          
                          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5 shadow-inner">
                            <code className="text-emerald-400 font-mono text-sm tracking-wider select-all font-semibold">
                              {keyData?.masked_key || "gsvc_sk_••••••••••••"}
                            </code>

                            <Tooltip title={t('copyKeyTooltip', "Salin Full API Key ke Clipboard")}>
                              <Button
                                type="primary"
                                size="small"
                                disabled={!keyData?.is_active}
                                onClick={handleCopyFullKey}
                                icon={copied ? <ClipboardDocumentCheckIcon className="w-4 h-4" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
                                className={`flex items-center text-xs font-medium ${copied ? "!bg-emerald-600" : "!bg-blue-600 hover:!bg-blue-500"} border-none`}
                              >
                                {copied ? t('copied', "Tersalin!") : t('copyFullKey', 'Salin Kunci')}
                              </Button>
                            </Tooltip>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {t('keyMaskedNotice', 'Format kunci disamarkan sebagian demi keamanan. Klik tombol Salin Kunci untuk mendapatkan string API key lengkap.')}
                          </p>
                        </div>

                        {/* Total Disk Usage Stats Card (Real-time Calculation) */}
                        <div className="bg-slate-50/80 border border-slate-200/90 rounded-2xl p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                                <CircleStackIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                                  {t('totalDiskUsed', 'Total Disk Digunakan')}
                                </span>
                                <span className="text-xl font-extrabold text-slate-800 font-mono">
                                  {diskUsage?.total_readable || "0 B"}
                                </span>
                              </div>
                            </div>
                            <Tag color="blue" className="text-xs font-semibold px-2.5 py-0.5 rounded-full">
                              {diskUsage?.total_layers || 0} Layers
                            </Tag>
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                            <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                                {t('diskRasterCount', 'Raster (GeoTIFF)')}
                              </span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-sm font-bold text-slate-700 font-mono">
                                  {diskUsage?.raster_readable || "0 B"}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {diskUsage?.raster_count || 0} {t('filesUnit', 'file')}
                                </span>
                              </div>
                            </div>

                            <div className="bg-white p-3 rounded-xl border border-slate-200/70">
                              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block">
                                {t('diskVectorCount', 'Vector (PostGIS)')}
                              </span>
                              <div className="flex items-baseline justify-between mt-1">
                                <span className="text-sm font-bold text-slate-700 font-mono">
                                  {diskUsage?.vector_readable || "0 B"}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {diskUsage?.vector_count || 0} {t('tablesUnit', 'tabel')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-500 leading-relaxed italic">
                            {t('diskQuotaNote', '* Setiap kali Anda mempublikasikan layer raster (GeoTIFF) atau vektor ke GeoServer, ukuran file dihitung dan diakumulasikan ke kuota API Key ini secara real-time.')}
                          </p>
                        </div>

                        {/* Refresh Key Box */}
                        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3">
                          <div className="flex items-start gap-2.5">
                            <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="space-y-1 text-xs">
                              <span className="font-bold text-amber-900 block">{t('refreshKey', 'Refresh API Key')}</span>
                              <p className="text-amber-800 leading-relaxed">
                                {t('refreshKeyRotationDesc', 'Anda dapat merotasi kunci baru sewaktu-waktu demi alasan keamanan. Tindakan ini akan menonaktifkan kunci sebelumnya secara permanen.')}
                              </p>
                            </div>
                          </div>
                          <div className="pt-1">
                            <Button
                              danger
                              size="small"
                              disabled={!keyData?.is_active}
                              loading={refreshing}
                              icon={<ArrowPathIcon className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />}
                              onClick={confirmRefresh}
                              className="font-medium text-xs"
                            >
                              {t('refreshKey', 'Refresh API Key')}
                            </Button>
                            {!keyData?.is_active && (
                              <p className="text-[11px] text-rose-600 font-medium mt-2">
                                {t('keyDisabledNotice', 'Kunci sedang dinonaktifkan oleh Administrator. Anda tidak dapat memperbarui kunci ini.')}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* S2S Integration Documentation Panel */}
                    <div className="space-y-6">
                      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 space-y-4">
                        <div className="flex items-center space-x-2">
                          <CodeBracketIcon className="w-5 h-5 text-blue-600" />
                          <h4 className="font-bold text-slate-800 text-sm">{t('s2sIntegrationTitle', 'Integrasi System-to-System (S2S)')}</h4>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {t('s2sIntegrationDesc', 'Sertakan API Key ini pada Header setiap HTTP request ke endpoint GeoServer Microservice:')}
                        </p>

                        <div className="bg-slate-900 rounded-xl p-3 text-slate-200 font-mono text-xs overflow-x-auto">
                          <span className="text-slate-400">{t('authHeaderComment', '# Header Autentikasi')}</span><br/>
                          <span className="text-indigo-400">X-API-Key</span>: <span className="text-emerald-400">{keyData?.is_active ? fullSecretForCode : "gsvc_sk_your_key_here"}</span>
                        </div>

                        <div className="pt-2">
                          <span className="text-xs font-semibold text-slate-700 block mb-2">{t('curlExampleTitle', 'Contoh Penggunaan cURL:')}</span>
                          <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
{`curl -X GET "${geoService}/workspaces" \\
  -H "X-API-Key: ${keyData?.is_active ? fullSecretForCode : "gsvc_sk_your_key_here"}"`}
                          </pre>
                        </div>

                        <div className="pt-2">
                          <span className="text-xs font-semibold text-slate-700 block mb-2">{t('pythonExampleTitle', 'Contoh Python Requests:')}</span>
                          <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto">
{`import requests

headers = {
    "X-API-Key": "${keyData?.is_active ? fullSecretForCode : "gsvc_sk_your_key_here"}"
}
res = requests.get("${geoService}/workspaces", headers=headers)
print(res.json())`}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
        )}
      </div>
  );
};

export default ApiKey;
