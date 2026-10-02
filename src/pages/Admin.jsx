import React, { useState, useEffect } from "react";
import { 
  Tabs, Table, Tag, Button, Modal, Form, Input, Select, Switch, 
  message, Popconfirm, Card, Statistic, Spin, Tooltip 
} from "antd";
import { 
  UserGroupIcon, 
  ServerStackIcon, 
  DocumentTextIcon, 
  KeyIcon, 
  PencilSquareIcon, 
  TrashIcon, 
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  CpuChipIcon,
  SignalIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon
} from "@heroicons/react/24/outline";
import adminApi from "../api/AdminApi";
import { formatDate } from "../utils/formatters";
import { useLanguage } from "../context/LanguageContext";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

const Admin = () => {
  const { t, language, translateApi } = useLanguage();
  const [activeTab, setActiveTab] = useState("users");

  useEffect(() => {
    document.title = `${t('adminPanelTitle', 'Panel Administrasi AstraGIS')} | AstraGIS`;
  }, [language, t]);

  // State: Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userTotal, setUserTotal] = useState(0);
  const [userPage, setUserPage] = useState(1);
  const [editUserModal, setEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editForm] = Form.useForm();
  const [userActionLoading, setUserActionLoading] = useState(false);

  // State: GeoServer Overview
  const [geoOverview, setGeoOverview] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [retestingGeo, setRetestingGeo] = useState(false);

  // State: Audit Logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);

  // State: Refreshed / Generated Key Display Modal
  const [refreshedKeyModal, setRefreshedKeyModal] = useState({ open: false, key: "", username: "", isNew: false });
  const [copiedKeyModal, setCopiedKeyModal] = useState(false);

  // 1. Fetch Users
  const fetchUsers = async (page = 1) => {
    setUsersLoading(true);
    try {
      const res = await adminApi.getUsers({ page, size: 10 });
      setUsers(res.data.data);
      setUserTotal(res.data.total);
      setUserPage(page);
    } catch (err) {
      message.error(err.response?.data?.detail || "Gagal memuat daftar pengguna.");
    } finally {
      setUsersLoading(false);
    }
  };

  // 2. Fetch GeoServer Overview
  const fetchGeoOverview = async (isManual = false) => {
    if (isManual) {
      setRetestingGeo(true);
    } else {
      setGeoLoading(true);
    }
    try {
      const res = await adminApi.getGeoServerOverview();
      setGeoOverview(res.data);
      if (isManual) {
        if (res.data?.status?.geoserver_connected) {
          message.success(t('connectionSuccess', "Koneksi ke GeoServer Microservice berhasil! (Online)"));
        } else {
          message.warning(t('connectionFailed', "GeoServer Microservice tidak dapat terhubung ke GeoServer Backend."));
        }
      }
    } catch (err) {
      message.error("Gagal menghubungkan ke GeoServer Microservice.");
    } finally {
      if (isManual) {
        setRetestingGeo(false);
      } else {
        setGeoLoading(false);
      }
    }
  };

  // 3. Fetch Audit Logs
  const fetchLogs = async (page = 1) => {
    setLogsLoading(true);
    try {
      const offset = (page - 1) * 20;
      const res = await adminApi.getLogs({ limit: 20, offset });
      setLogs(res.data.data || []);
      setLogsTotal(res.data.total || 0);
      setLogsPage(page);
    } catch (err) {
      message.error("Gagal memuat log aktivitas.");
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "users") fetchUsers(1);
    if (activeTab === "geoserver") fetchGeoOverview();
    if (activeTab === "logs") fetchLogs(1);
  }, [activeTab]);

  // Edit User Handler
  const handleEditClick = (record) => {
    setSelectedUser(record);
    editForm.setFieldsValue({
      username: record.username,
      email: record.email,
      role: record.role,
      is_verified: record.is_verified
    });
    setEditUserModal(true);
  };

  const handleUpdateUser = async (values) => {
    setUserActionLoading(true);
    try {
      await adminApi.updateUser(selectedUser.id, values);
      message.success("Data pengguna berhasil diperbarui!");
      setEditUserModal(false);
      fetchUsers(userPage);
    } catch (err) {
      message.error(err.response?.data?.detail || "Gagal memperbarui pengguna.");
    } finally {
      setUserActionLoading(false);
    }
  };

  // Delete User Handler
  const handleDeleteUser = async (userId) => {
    try {
      await adminApi.deleteUser(userId);
      message.success("Pengguna berhasil dihapus.");
      fetchUsers(userPage);
    } catch (err) {
      message.error(err.response?.data?.detail || "Gagal menghapus pengguna.");
    }
  };

  // Toggle API Key Handler (User ID)
  const handleToggleKey = async (userId) => {
    try {
      const res = await adminApi.toggleUserKey(userId);
      message.success(res.data.detail || "Status API Key pengguna diperbarui.");
      fetchUsers(userPage);
      if (activeTab === "geoserver") fetchGeoOverview();
    } catch (err) {
      message.error(err.response?.data?.detail || "Gagal mengubah status key.");
    }
  };

  // Toggle Microservice API Key Directly
  const handleToggleMicroserviceKey = async (keyId) => {
    try {
      const res = await adminApi.toggleKeyByMicroserviceId(keyId);
      message.success(res.data.detail || "Status API Key microservice diperbarui.");
      fetchGeoOverview();
      fetchUsers(userPage);
    } catch (err) {
      message.error(err.response?.data?.detail || "Gagal mengubah status key.");
    }
  };

  // Generate or Refresh User's Key Handler
  const handleGenerateOrRefreshKey = async (user) => {
    const hasKey = Boolean(user.api_key && user.api_key.id);
    const title = hasKey 
      ? `Terbitkan Ulang API Key untuk ${user.username}?`
      : `Buatkan API Key untuk ${user.username}?`;
    const content = hasKey
      ? "API Key lama pengguna akan segera dinonaktifkan di GeoServer dan kunci baru akan diterbitkan."
      : `Sistem akan membuatkan 1 API Key resmi (${user.role === 'admin' ? 'PRIMARY' : 'STANDARD'}) untuk ${user.username} di GeoServer dan database AstraGIS.`;

    Modal.confirm({
      title,
      content,
      okText: hasKey ? "Ya, Terbitkan Kunci Baru" : "Ya, Buatkan API Key",
      okType: hasKey ? "danger" : "primary",
      onOk: async () => {
        try {
          const res = await adminApi.generateUserKey(user.id);
          const newKey = res.data.full_key || res.data.api_key;
          setRefreshedKeyModal({
            open: true,
            key: newKey,
            username: user.username,
            isNew: !hasKey
          });
          message.success(res.data.detail || (hasKey ? "API Key baru berhasil diterbitkan." : "API Key baru berhasil dibuatkan."));
          fetchUsers(userPage);
          if (activeTab === "geoserver") fetchGeoOverview();
        } catch (err) {
          message.error(err.response?.data?.detail || "Gagal membuat/me-refresh key.");
        }
      }
    });
  };

  const handleCopyExistingKey = (keyText, username) => {
    if (!keyText) {
      message.warning("Secret key tidak tersimpan atau terenkripsi. Silakan terbitkan kunci baru.");
      return;
    }
    navigator.clipboard.writeText(keyText);
    message.success(`API Key milik ${username} berhasil disalin ke clipboard!`);
  };

  // Columns: Users
  const userColumns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
      width: 55,
      render: (id) => <span className="font-mono text-xs text-slate-500">{id}</span>
    },
    {
      title: "Pengguna",
      key: "user",
      minWidth: 160,
      render: (_, r) => (
        <div className="min-w-[140px]">
          <span className="font-semibold text-slate-800 block text-xs sm:text-sm">{r.username}</span>
          <span className="text-xs text-slate-400 block truncate max-w-[180px]">{r.email}</span>
        </div>
      )
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      width: 100,
      render: (role) => (
        <Tag color={role === "admin" ? "purple" : "blue"} className="uppercase text-xs font-semibold px-2 py-0.5 whitespace-nowrap">
          {role}
        </Tag>
      )
    },
    {
      title: t('accountStatus', "Status Akun"),
      dataIndex: "is_verified",
      key: "is_verified",
      width: 110,
      render: (verified) => (
        <Tag color={verified ? "green" : "orange"} className="text-xs whitespace-nowrap">
          {verified ? t('otpVerified', "Terverifikasi") : t('otpPending', "Belum OTP")}
        </Tag>
      )
    },
    {
      title: "API Key",
      key: "api_key",
      minWidth: 230,
      render: (_, r) => {
        const keyInfo = r.api_key;
        if (!keyInfo || !keyInfo.id) {
          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Tag color="default" className="text-slate-500 bg-slate-100 border-dashed text-xs whitespace-nowrap m-0">
                {t('noApiKeyFound', 'Belum Ada Kunci')}
              </Tag>
              <Tooltip title={t('generateApiKeyTooltip', 'Buatkan API Key baru untuk pengguna ini')}>
                <Button
                  size="small"
                  type="primary"
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs font-medium flex items-center gap-1 shadow-xs h-6 px-2"
                  icon={<KeyIcon className="w-3.5 h-3.5" />}
                  onClick={() => handleGenerateOrRefreshKey(r)}
                >
                  {t('generateApiKey', 'Buatkan Kunci')}
                </Button>
              </Tooltip>
            </div>
          );
        }

        return (
          <div className="space-y-1 py-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <code className="text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold tracking-tight border border-slate-200">
                {keyInfo.masked_key || `${keyInfo.key_prefix || 'gsvc_'}...`}
              </code>
              <Tag color={keyInfo.is_active ? "green" : "red"} className="text-[10px] font-mono font-bold px-1.5 py-0 whitespace-nowrap m-0">
                {keyInfo.is_active ? t('keyActive', 'AKTIF') : t('keyInactive', 'NONAKTIF')}
              </Tag>
            </div>
            
            <div className="flex items-center gap-1 pt-0.5 flex-wrap">
              {keyInfo.full_key && (
                <Tooltip title={t('copyKeyTooltip', 'Salin Full API Key ke Clipboard')}>
                  <Button
                    size="small"
                    type="text"
                    className="h-6 px-1.5 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-1"
                    icon={<ClipboardDocumentIcon className="w-3.5 h-3.5" />}
                    onClick={() => handleCopyExistingKey(keyInfo.full_key, r.username)}
                  >
                    {t('copyApiKey', 'Salin')}
                  </Button>
                </Tooltip>
              )}

              <Tooltip title={keyInfo.is_active ? t('deactivateKey', 'Nonaktifkan Kunci') : t('activateKey', 'Aktifkan Kunci')}>
                <Button
                  size="small"
                  type="text"
                  className={`h-6 px-1.5 text-xs flex items-center gap-1 ${
                    keyInfo.is_active
                      ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                      : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                  }`}
                  onClick={() => handleToggleKey(r.id)}
                >
                  {keyInfo.is_active ? t('deactivateKey', 'Nonaktifkan') : t('activateKey', 'Aktifkan')}
                </Button>
              </Tooltip>

              <Tooltip title={t('reissueKeyTooltip', 'Terbitkan Kunci Baru')}>
                <Button
                  size="small"
                  type="text"
                  className="h-6 px-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 flex items-center gap-1"
                  icon={<ArrowPathIcon className="w-3.5 h-3.5" />}
                  onClick={() => handleGenerateOrRefreshKey(r)}
                >
                  {t('reissueApiKey', 'Ganti')}
                </Button>
              </Tooltip>
            </div>
          </div>
        );
      }
    },
    {
      title: "Workspaces",
      dataIndex: "workspaces_count",
      key: "workspaces_count",
      width: 90,
      align: "center",
      render: (count) => (
        <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-full text-xs whitespace-nowrap">
          {count}
        </span>
      )
    },
    {
      title: t('actions', "Aksi"),
      key: "actions",
      width: 95,
      render: (_, r) => (
        <div className="flex items-center gap-1.5 whitespace-nowrap">
          <Tooltip title={t('editUserTooltip', "Edit Pengguna")}>
            <Button
              size="small"
              className="text-emerald-600 hover:text-emerald-700 border-emerald-300 hover:border-emerald-500 bg-emerald-50"
              icon={<PencilSquareIcon className="w-4 h-4" />}
              onClick={() => handleEditClick(r)}
            />
          </Tooltip>

          <Popconfirm
            title={t('deleteUserConfirmTitle', "Hapus pengguna ini?")}
            description={t('deleteUserConfirmDesc', "Semua workspace dan data terkait akan dihapus permanen.")}
            onConfirm={() => handleDeleteUser(r.id)}
            okText={t('delete', "Ya, Hapus")}
            cancelText={t('cancel', "Batal")}
            okType="danger"
          >
            <Button 
              size="small" 
              className="text-rose-600 hover:text-rose-700 border-rose-300 hover:border-rose-500 bg-rose-50"
              icon={<TrashIcon className="w-4 h-4" />} 
            />
          </Popconfirm>
        </div>
      )
    }
  ];

  // Columns: Registered API Keys in GeoServer Microservice
  const keyColumns = [
    {
      title: t('keyName', "Nama Kunci"),
      dataIndex: "name",
      key: "name",
      minWidth: 160,
      render: (name, r) => (
        <div className="min-w-[140px]">
          <span className="font-bold text-slate-800 text-xs sm:text-sm block">{name}</span>
          <span className="text-[11px] font-mono text-slate-400 block truncate max-w-[200px]" title={r.id}>{r.id}</span>
        </div>
      )
    },
    {
      title: t('keyType', "Tipe Kunci"),
      dataIndex: "key_type",
      key: "key_type",
      width: 140,
      render: (type) => (
        <Tag color={type === "PRIMARY" ? "gold" : "blue"} className="font-bold font-mono text-xs px-2.5 py-0.5 whitespace-nowrap">
          {type === "PRIMARY" ? "PRIMARY (Admin)" : "STANDARD (User)"}
        </Tag>
      )
    },
    {
      title: "Prefix",
      dataIndex: "key_prefix",
      key: "key_prefix",
      width: 105,
      render: (p) => <code className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono font-semibold whitespace-nowrap">{p}</code>
    },
    {
      title: t('keyOwner', "Pemilik / Metadata"),
      dataIndex: "owner_info",
      key: "owner_info",
      minWidth: 150,
      render: (info) => {
        if (!info) return <span className="text-xs text-slate-400 italic">Sistem Internal AstraGIS</span>;
        try {
          const parsed = JSON.parse(info);
          return (
            <div className="text-xs min-w-[130px]">
              <span className="font-semibold text-slate-800 block truncate max-w-[180px]">{parsed.username || parsed.client || parsed.system || "System"}</span>
              {parsed.email && <span className="text-slate-400 block text-[11px] truncate max-w-[180px]">{parsed.email}</span>}
              {parsed.description && <span className="text-slate-400 italic block text-[11px] truncate max-w-[180px]">{parsed.description}</span>}
            </div>
          );
        } catch {
          return <span className="text-xs text-slate-500 font-mono block truncate max-w-[180px]">{info}</span>;
        }
      }
    },
    {
      title: t('diskUsage', "Disk Terpakai"),
      key: "disk_usage",
      width: 160,
      render: (_, r) => (
        <div className="whitespace-nowrap">
          <span className="font-mono font-bold text-xs text-slate-800 block">
            {r.disk_usage?.total_readable || "0 B"}
          </span>
          <span className="text-[11px] text-slate-400">
            {r.disk_usage?.total_layers || 0} Layers ({r.disk_usage?.raster_count || 0} ras, {r.disk_usage?.vector_count || 0} vec)
          </span>
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      width: 100,
      render: (act) => (
        <Tag color={act ? "green" : "red"} className="font-bold text-xs font-mono whitespace-nowrap">
          {act ? t('keyActive', "AKTIF") : t('keyInactive', "NONAKTIF")}
        </Tag>
      )
    },
    {
      title: t('createdDate', "Dibuat"),
      dataIndex: "created_at",
      key: "created_at",
      width: 115,
      render: (time) => <span className="text-xs text-slate-500 font-mono whitespace-nowrap">{formatDate(time, language)}</span>
    },
    {
      title: t('columnAction', "Aksi"),
      key: "action",
      width: 125,
      render: (_, r) => (
        r.key_type === "PRIMARY" ? (
          <Tag color="purple" className="text-[11px] font-semibold whitespace-nowrap">Protected (Admin)</Tag>
        ) : (
          <Tooltip title={r.is_active ? t('deactivateKey', "Nonaktifkan Kunci") : t('activateKey', "Aktifkan Kunci")}>
            <Button
              size="small"
              className={r.is_active 
                ? "text-rose-600 hover:text-rose-700 border-rose-300 hover:border-rose-500 bg-rose-50/80 font-medium text-xs flex items-center gap-1 whitespace-nowrap" 
                : "text-emerald-600 hover:text-emerald-700 border-emerald-300 hover:border-emerald-500 bg-emerald-50/80 font-medium text-xs flex items-center gap-1 whitespace-nowrap"}
              icon={r.is_active ? <XCircleIcon className="w-4 h-4" /> : <CheckCircleIcon className="w-4 h-4" />}
              onClick={() => handleToggleMicroserviceKey(r.id)}
            >
              {r.is_active ? t('deactivateKey', "Nonaktifkan") : t('activateKey', "Aktifkan")}
            </Button>
          </Tooltip>
        )
      )
    }
  ];

  // Columns: Audit Logs
  const logColumns = [
    {
      title: t('timeColumn', "Waktu"),
      dataIndex: "performed_at",
      key: "performed_at",
      width: 150,
      render: (timeVal) => (
        <span className="text-xs text-slate-500 font-mono whitespace-nowrap">
          {timeVal ? formatDate(timeVal, language) : "-"}
        </span>
      )
    },
    {
      title: t('actorColumn', "Kredensial / Aktor"),
      key: "actor",
      width: 160,
      render: (_, r) => (
        <div className="min-w-[130px]">
          <span className="font-semibold text-xs text-slate-800 block truncate">{r.api_key_name || "Sistem"}</span>
          <Tag color={r.api_key_type === "PRIMARY" ? "gold" : "cyan"} className="text-[10px] uppercase font-mono whitespace-nowrap">
            {r.api_key_type || "UNKNOWN"}
          </Tag>
        </div>
      )
    },
    {
      title: t('actionColumn', "Aksi"),
      dataIndex: "action",
      key: "action",
      width: 150,
      render: (a) => (
        <span className="font-mono text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded whitespace-nowrap">
          {a}
        </span>
      )
    },
    {
      title: t('targetResourceColumn', "Target Resource"),
      key: "resource",
      minWidth: 150,
      render: (_, r) => (
        <div className="text-xs min-w-[120px]">
          <span className="text-slate-400 font-medium">{r.resource_type || "SYSTEM"}: </span>
          <span className="font-semibold text-slate-700 block truncate max-w-[160px]">{r.resource_name || r.resource_id || "-"}</span>
        </div>
      )
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 90,
      render: (s) => (
        <Tag color={s === "SUCCESS" ? "green" : "red"} className="font-semibold text-xs whitespace-nowrap">
          {s}
        </Tag>
      )
    },
    {
      title: t('detailColumn', "Detail"),
      dataIndex: "detail",
      key: "detail",
      ellipsis: true,
      minWidth: 160,
      render: (d) => <span className="text-xs text-slate-500">{d || "-"}</span>
    }
  ];

  return (
    <div className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6">
      {/* Header (DRY PageHeader Component) */}
      <PageHeader
        icon={ShieldCheckIcon}
        title={t('adminPanelTitle', "Panel Administrasi AstraGIS")}
        subtitle={t('adminPanelSubtitle', "Kendali terpusat untuk pengguna, isolasi API Key, dan pemantauan langsung GeoServer Microservice.")}
        iconBgColor="bg-indigo-600"
        iconColor="text-white"
      />

      {/* Main Tabs */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        type="card"
        className="admin-tabs"
        items={[
          {
            key: "users",
            label: (
              <span className="flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm px-1 sm:px-2 py-0.5 sm:py-1">
                <UserGroupIcon className="w-4 h-4 shrink-0" />
                <span>{t('tabUsers', 'Pengguna & Kredensial')}</span>
              </span>
            ),
            children: (
              <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-xs border border-slate-200 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mb-1">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">{t('allUsersTitle', 'Daftar Seluruh Pengguna')}</h3>
                    <p className="text-xs text-slate-400">{t('allUsersSubtitle', { total: userTotal })}</p>
                  </div>
                  <Button
                    icon={<ArrowPathIcon className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} />}
                    onClick={() => fetchUsers(userPage)}
                    className="w-full sm:w-auto"
                  >
                    {t('reloadBtn', 'Muat Ulang')}
                  </Button>
                </div>

                <div className="sm:hidden text-[11px] text-slate-400 flex items-center justify-end gap-1 px-1">
                  <span>👉 Geser tabel secara horizontal</span>
                </div>

                <Table
                  dataSource={users}
                  columns={userColumns}
                  rowKey="id"
                  loading={usersLoading}
                  scroll={{ x: 650 }}
                  pagination={{
                    current: userPage,
                    total: userTotal,
                    pageSize: 10,
                    size: "small",
                    responsive: true,
                    onChange: (page) => fetchUsers(page)
                  }}
                  className="rounded-xl overflow-hidden border border-slate-100"
                />
              </div>
            )
          },
          {
            key: "geoserver",
            label: (
              <span className="flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm px-1 sm:px-2 py-0.5 sm:py-1">
                <ServerStackIcon className="w-4 h-4 shrink-0" />
                <span>{t('tabGeoServerLive', 'GeoServer Microservice Live')}</span>
              </span>
            ),
            children: (
              <div className="space-y-4 sm:space-y-6">
                {geoLoading ? (
                  <div className="flex justify-center py-20"><Spin size="large" /></div>
                ) : (
                  <>
                    {/* Status Overview Cards */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2.5 sm:gap-4">
                      <div>
                        <h3 className="text-sm sm:text-base font-bold text-slate-800">{t('geoMonitoringTitle', 'Pemantauan GeoServer Microservice')}</h3>
                        <p className="text-xs text-slate-500">{t('geoMonitoringSubtitle', 'Status koneksi real-time dan manajemen seluruh API Key terdaftar')}</p>
                      </div>
                      <Button
                        htmlType="button"
                        icon={<ArrowPathIcon className={`w-4 h-4 ${retestingGeo ? "animate-spin" : ""}`} />}
                        loading={retestingGeo}
                        onClick={(e) => {
                          e.preventDefault();
                          fetchGeoOverview(true);
                        }}
                        className="w-full sm:w-auto rounded-xl font-medium text-xs h-9 px-4 hover:!border-blue-500 hover:!text-blue-600"
                      >
                        {retestingGeo ? t('testingConnection', 'Menguji...') : t('testConnection', 'Uji Koneksi Ulang')}
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5">
                      <StatCard
                        title={t('microserviceEngine', 'Microservice Engine')}
                        value={geoOverview?.status?.service || "geoserver-microservice"}
                        valueColor="text-blue-600"
                        icon={CpuChipIcon}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                      />

                      <StatCard
                        title={t('geoConnection', 'Koneksi GeoServer')}
                        value={geoOverview?.status?.geoserver_connected ? t('connected', 'TERHUBUNG') : t('disconnected', 'TIDAK TERHUBUNG')}
                        subvalue={geoOverview?.status?.geoserver_connected && geoOverview?.status?.latency_ms ? `${geoOverview.status.latency_ms} ms` : null}
                        valueColor={geoOverview?.status?.geoserver_connected ? "text-emerald-600" : "text-rose-600"}
                        icon={geoOverview?.status?.geoserver_connected ? CheckCircleIcon : XCircleIcon}
                        iconBg={geoOverview?.status?.geoserver_connected ? "bg-emerald-50" : "bg-rose-50"}
                        iconColor={geoOverview?.status?.geoserver_connected ? "text-emerald-600" : "text-rose-600"}
                      />

                      <StatCard
                        title={t('registeredApiKeys', 'Total API Keys')}
                        value={`${geoOverview?.registered_api_keys?.length || 0} Kunci`}
                        subvalue="1 Primary • 2 Standard"
                        valueColor="text-purple-600"
                        icon={KeyIcon}
                        iconBg="bg-purple-50"
                        iconColor="text-purple-600"
                      />
                    </div>

                    {/* Table of All Registered API Keys in GeoServer Microservice */}
                    <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-xs border border-slate-200 space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-800">
                            {t('registeredApiKeys', 'Daftar Seluruh API Key Terdaftar di GeoServer Microservice')}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Menampilkan seluruh kunci yang ada di database spasial microservice (PRIMARY &amp; STANDARD) beserta kuota disk terpakai.
                          </p>
                        </div>
                      </div>

                      <div className="sm:hidden text-[11px] text-slate-400 flex items-center justify-end gap-1 px-1">
                        <span>👉 Geser tabel secara horizontal</span>
                      </div>

                      <Table
                        dataSource={geoOverview?.registered_api_keys || []}
                        columns={keyColumns}
                        rowKey="id"
                        pagination={false}
                        scroll={{ x: 860 }}
                        className="rounded-xl overflow-hidden border border-slate-100"
                      />
                    </div>

                    {/* GeoServer Workspaces Table */}
                    <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-xs border border-slate-200 space-y-3 sm:space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm sm:text-base font-bold text-slate-800">Workspace Terdaftar di GeoServer</h3>
                        <span className="text-xs text-slate-400 font-mono">
                          {geoOverview?.workspaces?.length || 0} workspaces
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                        {geoOverview?.workspaces?.map((ws, i) => (
                          <div key={i} className="bg-slate-50 hover:bg-slate-100/80 transition-colors border border-slate-200 rounded-xl p-3 font-mono text-xs text-slate-800 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="shrink-0 text-sm">📁</span>
                              <span className="font-semibold text-slate-800 truncate" title={ws.display_name || ws.workspace_name || ws.name}>
                                {ws.display_name || ws.workspace_name || ws.name}
                              </span>
                            </div>
                            <span className="block text-[10px] text-slate-400 truncate mt-1 pl-5" title={ws.workspace_name || ws.name}>
                              {ws.workspace_name || ws.name}
                            </span>
                          </div>
                        ))}
                        {(!geoOverview?.workspaces || geoOverview.workspaces.length === 0) && (
                          <div className="col-span-full py-4 text-center text-xs text-slate-400 italic">
                            Belum ada workspace di GeoServer.
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          },
          {
            key: "logs",
            label: (
              <span className="flex items-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm px-1 sm:px-2 py-0.5 sm:py-1">
                <DocumentTextIcon className="w-4 h-4 shrink-0" />
                <span>{t('tabAuditLogs', 'Audit Logs')}</span>
              </span>
            ),
            children: (
              <div className="bg-white rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 shadow-xs border border-slate-200 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 mb-1">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-800">{t('auditLogsTitle', 'Jejak Audit Aktivitas Sistem')}</h3>
                    <p className="text-xs text-slate-400">{t('auditLogsSubtitle', 'Merekam aksi S2S dan manajemen layer secara real-time')}</p>
                  </div>
                  <Button
                    icon={<ArrowPathIcon className={`w-4 h-4 ${logsLoading ? "animate-spin" : ""}`} />}
                    onClick={() => fetchLogs(logsPage)}
                    className="w-full sm:w-auto"
                  >
                    {t('reloadBtn', 'Muat Ulang')}
                  </Button>
                </div>

                <div className="sm:hidden text-[11px] text-slate-400 flex items-center justify-end gap-1 px-1">
                  <span>👉 Geser tabel secara horizontal</span>
                </div>

                <Table
                  dataSource={logs}
                  columns={logColumns}
                  rowKey="id"
                  loading={logsLoading}
                  scroll={{ x: 750 }}
                  pagination={{
                    current: logsPage,
                    total: logsTotal,
                    pageSize: 20,
                    size: "small",
                    responsive: true,
                    onChange: (page) => fetchLogs(page)
                  }}
                  className="rounded-xl overflow-hidden border border-slate-100"
                />
              </div>
            )
          }
        ]}
      />

      {/* Edit User Modal */}
      <Modal
        title={`Edit Pengguna: ${selectedUser?.username}`}
        open={editUserModal}
        onCancel={() => setEditUserModal(false)}
        footer={null}
        destroyOnClose
        className="max-w-md w-full"
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateUser}
          className="pt-3"
        >
          <Form.Item name="username" label="Username" rules={[{ required: true, message: "Username wajib diisi" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="email" label="Email" rules={[{ required: true, type: "email", message: "Email tidak valid" }]}>
            <Input />
          </Form.Item>

          <Form.Item name="role" label="Role Hak Akses" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="user">User Biasa</Select.Option>
              <Select.Option value="admin">Administrator</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="is_verified" label="Status Verifikasi Akun" valuePropName="checked">
            <Switch />
          </Form.Item>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button onClick={() => setEditUserModal(false)}>Batal</Button>
            <Button type="primary" htmlType="submit" loading={userActionLoading}>Simpan Perubahan</Button>
          </div>
        </Form>
      </Modal>

      {/* Refreshed / Generated Key Display Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <KeyIcon className="w-5 h-5 text-indigo-600" />
            <span>
              {refreshedKeyModal.isNew
                ? `API Key Berhasil Dibuat untuk ${refreshedKeyModal.username}`
                : `API Key Berhasil Diterbitkan Ulang untuk ${refreshedKeyModal.username}`}
            </span>
          </div>
        }
        open={refreshedKeyModal.open}
        onCancel={() => {
          setRefreshedKeyModal({ open: false, key: "", username: "", isNew: false });
          setCopiedKeyModal(false);
        }}
        className="max-w-lg w-full"
        footer={[
          <Button 
            key="copy" 
            className="border-indigo-300 text-indigo-600 hover:bg-indigo-50 font-medium"
            icon={copiedKeyModal ? <ClipboardDocumentCheckIcon className="w-4 h-4 text-emerald-600" /> : <ClipboardDocumentIcon className="w-4 h-4" />}
            onClick={() => {
              if (refreshedKeyModal.key) {
                navigator.clipboard.writeText(refreshedKeyModal.key);
                setCopiedKeyModal(true);
                message.success("API Key berhasil disalin ke clipboard!");
                setTimeout(() => setCopiedKeyModal(false), 3000);
              }
            }}
          >
            {copiedKeyModal ? "Tersalin!" : "Salin Kunci"}
          </Button>,
          <Button 
            key="close" 
            type="primary" 
            className="bg-indigo-600 hover:bg-indigo-700"
            onClick={() => {
              setRefreshedKeyModal({ open: false, key: "", username: "", isNew: false });
              setCopiedKeyModal(false);
            }}
          >
            Selesai
          </Button>
        ]}
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-600">
            Berikut adalah API Key resmi untuk akun <b>{refreshedKeyModal.username}</b>. Kunci ini siap digunakan untuk otentikasi REST API dan GeoServer Service:
          </p>
          <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs select-all break-all border border-slate-800 shadow-inner flex items-center justify-between gap-2">
            <span>{refreshedKeyModal.key}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2">
            <span className="text-amber-600 text-sm">⚠️</span>
            <p className="text-xs text-amber-800 leading-relaxed m-0">
              Salin dan berikan kunci ini secara aman kepada pengguna bersangkutan. Pengguna juga dapat melihat atau mengunduh kunci ini dari menu <b>API Key (S2S)</b> di akun mereka.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Admin;
