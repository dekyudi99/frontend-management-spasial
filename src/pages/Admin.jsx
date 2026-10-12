import React, { useState, useEffect } from "react";
import { 
  Tabs, Table, Tag, Button, Modal, Form, Input, InputNumber, Select, Switch, Space, 
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
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  CircleStackIcon
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
  const watchedRole = Form.useWatch("role", editForm);
  const [userActionLoading, setUserActionLoading] = useState(false);

  // State: GeoServer Overview
  const [geoOverview, setGeoOverview] = useState(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [retestingGeo, setRetestingGeo] = useState(false);

  // State: Custom Quota Modal
  const [quotaModal, setQuotaModal] = useState({ open: false, keyId: null, keyName: "", currentMb: 500 });
  const [quotaLoading, setQuotaLoading] = useState(false);
  const [quotaForm] = Form.useForm();

  // State: Audit Logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);

  // State: Refreshed / Generated Key Display Modal
  const [refreshedKeyModal, setRefreshedKeyModal] = useState({ open: false, key: "", username: "", isNew: false });
  const [copiedKeyModal, setCopiedKeyModal] = useState(false);
  const [createKeyModal, setCreateKeyModal] = useState({ open: false, userId: null });
  const [createKeyLoading, setCreateKeyLoading] = useState(false);
  const [createKeyForm] = Form.useForm();

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

  // Toggle Microservice API Key Directly (with special caution for PRIMARY keys)
  const handleToggleMicroserviceKey = (record) => {
    const isPrimary = record.key_type === "PRIMARY";
    const willDeactivate = record.is_active;

    if (isPrimary && willDeactivate) {
      Modal.confirm({
        title: t('primaryKeyDeactivateWarningTitle', "Perhatian Khusus: Menonaktifkan PRIMARY API Key"),
        icon: <ExclamationTriangleIcon className="w-6 h-6 text-amber-500" />,
        content: (
          <div className="space-y-2 mt-2">
            <p className="text-slate-700 text-sm">
              {t('keyIsPrimaryKeyNotice', { name: record.name }, `Kunci ${record.name} adalah PRIMARY KEY (Admin).`)}
            </p>
            <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-xs text-amber-900 leading-relaxed">
              ⚠️ {t('primaryKeyDeactivateWarningDesc', 'Menonaktifkan kunci ini akan mencabut seluruh hak akses administratif pada GeoServer Microservice sampai diaktifkan kembali.')}
            </div>
            <p className="text-xs text-slate-500">
              {t('confirmDeactivatePrimaryKeyQuestion', 'Apakah Anda yakin ingin menonaktifkan kunci Primary ini?')}
            </p>
          </div>
        ),
        okText: t('confirmDeactivatePrimaryKey', "Ya, Nonaktifkan Kunci Primary"),
        okType: "danger",
        cancelText: t('cancel', "Batal"),
        onOk: async () => {
          await executeToggleMicroserviceKey(record.id);
        }
      });
      return;
    }

    executeToggleMicroserviceKey(record.id);
  };

  const executeToggleMicroserviceKey = async (keyId) => {
    try {
      const res = await adminApi.toggleKeyByMicroserviceId(keyId);
      message.success(res.data.detail || "Status API Key microservice diperbarui.");
      fetchGeoOverview();
      fetchUsers(userPage);
    } catch (err) {
      message.error(err.response?.data?.detail || "Gagal mengubah status key.");
    }
  };

  // Quota Customization Handlers
  const handleOpenQuotaModal = (keyRecord) => {
    const currentMb = keyRecord.quota_mb || (keyRecord.disk_usage?.max_quota_mb) || 500;
    setQuotaModal({
      open: true,
      keyId: keyRecord.id,
      keyName: keyRecord.name,
      currentMb
    });
    quotaForm.setFieldsValue({ quota_mb: currentMb });
  };

  const handleUpdateQuotaSubmit = async (values) => {
    setQuotaLoading(true);
    try {
      await adminApi.updateKeyQuota(quotaModal.keyId, Number(values.quota_mb));
      message.success(t('quotaSuccessUpdate', 'Batas kuota penyimpanan berhasil diperbarui!'));
      setQuotaModal({ open: false, keyId: null, keyName: "", currentMb: 500 });
      fetchGeoOverview();
    } catch (err) {
      message.error(err.response?.data?.detail || t('quotaFailedUpdate', "Gagal mengubah batas kuota API Key."));
    } finally {
      setQuotaLoading(false);
    }
  };

  // Generate or Refresh User's Key Handler
  const handleGenerateOrRefreshKey = async (user) => {
    const hasKey = Boolean(user.api_key && user.api_key.id);
    const title = hasKey 
      ? t('reissueKeyConfirmTitle', { username: user.username }, `Terbitkan Ulang API Key untuk ${user.username}?`)
      : t('generateKeyConfirmTitle', { username: user.username }, `Buatkan API Key untuk ${user.username}?`);
    const content = hasKey
      ? t('reissueKeyConfirmDesc', "API Key lama pengguna akan segera dinonaktifkan di GeoServer dan kunci baru akan diterbitkan.")
      : t('generateKeyConfirmDesc', { role: user.role === 'admin' ? 'PRIMARY' : 'STANDARD', username: user.username }, `Sistem akan membuatkan 1 API Key resmi (${user.role === 'admin' ? 'PRIMARY' : 'STANDARD'}) untuk ${user.username} di GeoServer dan database AstraGIS.`);

    Modal.confirm({
      title,
      content,
      okText: hasKey ? t('reissueKeyOkBtn', "Ya, Terbitkan Kunci Baru") : t('generateKeyOkBtn', "Ya, Buatkan API Key"),
      okType: hasKey ? "danger" : "primary",
      cancelText: t('cancel', "Batal"),
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
          message.success(res.data.detail || (hasKey ? t('newKeyReissuedSuccess', "API Key baru berhasil diterbitkan ulang!") : t('newKeyCreatedSuccess', "API Key baru berhasil dibuatkan!")));
          fetchUsers(userPage);
          if (activeTab === "geoserver") fetchGeoOverview();
        } catch (err) {
          message.error(err.response?.data?.detail || t('keyOperationFailed', "Gagal membuat/me-refresh key."));
        }
      }
    });
  };

  // Rotate Microservice Key Handler (In-Place Rotation)
  const handleRotateKeyFromMicroservice = (keyRecord) => {
    Modal.confirm({
      title: t('refreshKeyConfirm', "Perbarui Nilai API Key?"),
      content: (
        <div className="space-y-2 mt-2">
          <p className="text-slate-600 text-sm">
            {t('refreshKeyDesc', "Tindakan ini akan mengganti token/string rahasia API Key demi alasan keamanan.")}
          </p>
          <p className="text-emerald-700 text-xs font-semibold bg-emerald-50 border border-emerald-200 p-2 rounded-lg">
            {t('refreshKeyDataSafeNotice', "✓ Seluruh layer spasial, workspace, dan tabel PostGIS pengguna tetap aman dan TIDAK AKAN HILANG karena ID kepemilikan akun tidak berubah.")}
          </p>
          <p className="text-amber-600 text-xs font-medium">
            {t('refreshKeyWarningNotice', "Pastikan untuk memperbarui token pada skrip integrasi S2S atau aplikasi luar yang menggunakan kunci lama.")}
          </p>
        </div>
      ),
      okText: t('refreshKey', "Ya, Perbarui Kunci"),
      okType: "primary",
      cancelText: t('cancel', "Batal"),
      onOk: async () => {
        try {
          const res = await adminApi.rotateKeyByMicroserviceId(keyRecord.id);
          const newKey = res.data.full_key || res.data.api_key;
          setRefreshedKeyModal({
            open: true,
            key: newKey,
            username: keyRecord.name,
            isNew: false
          });
          message.success(res.data.detail || "API Key berhasil dirotasi!");
          fetchGeoOverview();
          fetchUsers(userPage);
        } catch (err) {
          message.error(err.response?.data?.detail || "Gagal memperbarui API Key.");
        }
      }
    });
  };

  // Create Key for User Handler
  const handleCreateKeySubmit = async (values) => {
    setCreateKeyLoading(true);
    try {
      const targetUser = users.find(u => u.id === values.userId);
      const res = await adminApi.generateUserKey(values.userId);
      const newKey = res.data.full_key || res.data.api_key;
      setCreateKeyModal({ open: false, userId: null });
      setRefreshedKeyModal({
        open: true,
        key: newKey,
        username: targetUser?.username || "Pengguna",
        isNew: true
      });
      message.success(res.data.detail || t('newKeyCreatedSuccess', "API Key baru berhasil dibuatkan!"));
      fetchGeoOverview();
      fetchUsers(userPage);
    } catch (err) {
      message.error(err.response?.data?.detail || t('keyOperationFailed', "Gagal membuat API Key."));
    } finally {
      setCreateKeyLoading(false);
    }
  };

  const handleCopyExistingKey = (keyText, username) => {
    if (!keyText) {
      message.warning("Secret key tidak tersimpan atau terenkripsi. Silakan terbitkan kunci baru.");
      return;
    }
    navigator.clipboard.writeText(keyText);
    message.success(`API Key milik ${username} berhasil disalin ke clipboard!`);
  };

  // Filter user yang belum memiliki API Key sama sekali (Aturan: 1 User = 1 API Key)
  const usersWithoutKey = (geoOverview?.users_without_key && geoOverview.users_without_key.length > 0)
    ? geoOverview.users_without_key
    : users.filter(u => {
        const hasKeyInMicroservice = geoOverview?.registered_api_keys?.some(k => {
          if (k.user_id && k.user_id === u.id) return true;
          if (k.owner_info) {
            try {
              const parsed = typeof k.owner_info === "string" ? JSON.parse(k.owner_info) : k.owner_info;
              if (String(parsed.user_id) === String(u.id)) return true;
            } catch {}
          }
          return false;
        });
        return !hasKeyInMicroservice;
      });

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
      title: t('user', "Pengguna"),
      dataIndex: "username",
      key: "username",
      minWidth: 130,
      render: (username) => (
        <span className="font-semibold text-slate-800 text-xs sm:text-sm">{username}</span>
      )
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      minWidth: 200,
      render: (email) => (
        <span className="text-xs text-slate-600 font-mono select-all">{email}</span>
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
      title: t('keyName', "Nama Kunci & Token"),
      key: "name_token",
      minWidth: 200,
      render: (_, r) => (
        <div className="space-y-1 py-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-800 text-xs sm:text-sm block">{r.name}</span>
            <code className="text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-bold tracking-tight border border-slate-200">
              {r.masked_key || `${r.key_prefix || 'gsvc_'}••••••••`}
            </code>
          </div>
          <span className="text-[10px] font-mono text-slate-400 block truncate max-w-[220px]" title={r.id}>
            ID: {r.id}
          </span>
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
      title: t('keyOwner', "Pemilik / Akun"),
      dataIndex: "owner_info",
      key: "owner_info",
      minWidth: 150,
      render: (info) => {
        if (!info) return <span className="text-xs text-slate-400 italic">Sistem Internal AstraGIS</span>;
        try {
          const parsed = typeof info === "string" ? JSON.parse(info) : info;
          return (
            <div className="text-xs min-w-[130px]">
              <span className="font-semibold text-slate-800 block truncate max-w-[180px]">
                {parsed.username || parsed.client || parsed.system || "System"}
              </span>
              {parsed.email && <span className="text-slate-400 block text-[11px] truncate max-w-[180px]">{parsed.email}</span>}
            </div>
          );
        } catch {
          return <span className="text-xs text-slate-500 font-mono block truncate max-w-[180px]">{info}</span>;
        }
      }
    },
    {
      title: t('diskAndQuota', "Disk & Kuota"),
      key: "disk_usage",
      width: 200,
      render: (_, r) => (
        <div className="whitespace-nowrap">
          <div className="flex items-center gap-1.5">
            <span className="font-mono font-bold text-xs text-slate-800">
              {r.disk_usage?.total_readable || "0 B"}
            </span>
            <span className="text-slate-400 text-xs font-mono">/</span>
            <span className="text-xs font-semibold text-indigo-600 font-mono">
              {r.disk_usage?.max_quota_readable || `${r.quota_mb || 500} MB`}
            </span>
            <Tooltip title={t('changeQuotaTooltip', "Ubah Batas Kuota Penyimpanan (MB)")}>
              <button
                type="button"
                onClick={() => handleOpenQuotaModal(r)}
                className="text-slate-400 hover:text-indigo-600 transition-colors p-0.5 rounded cursor-pointer"
              >
                <PencilSquareIcon className="w-3.5 h-3.5" />
              </button>
            </Tooltip>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5">
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
      width: 220,
      render: (_, r) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {r.full_key && (
            <Tooltip title={t('copyKeyTooltip', "Salin Full API Key ke Clipboard")}>
              <Button
                size="small"
                type="text"
                className="h-7 px-2 text-xs text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 flex items-center gap-1"
                icon={<ClipboardDocumentIcon className="w-3.5 h-3.5" />}
                onClick={() => handleCopyExistingKey(r.full_key, r.name)}
              >
                {t('copyApiKey', "Salin")}
              </Button>
            </Tooltip>
          )}

          <Tooltip title={r.is_active ? t('deactivateKey', "Nonaktifkan Kunci") : t('activateKey', "Aktifkan Kunci")}>
            <Button
              size="small"
              className={r.is_active 
                ? "h-7 px-2 text-xs text-amber-700 hover:text-amber-800 border-amber-300 hover:border-amber-500 bg-amber-50 flex items-center gap-1"
                : "h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 border-emerald-300 hover:border-emerald-500 bg-emerald-50 flex items-center gap-1"}
              icon={r.is_active ? <XCircleIcon className="w-3.5 h-3.5" /> : <CheckCircleIcon className="w-3.5 h-3.5" />}
              onClick={() => handleToggleMicroserviceKey(r)}
            >
              {r.is_active ? t('deactivateKey', "Nonaktifkan") : t('activateKey', "Aktifkan")}
            </Button>
          </Tooltip>

          <Tooltip title={t('reissueKeyTooltip', "Perbarui Token Kunci (In-Place Rotation)")}>
            <Button
              size="small"
              className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700 border-rose-300 hover:border-rose-500 bg-rose-50 flex items-center gap-1"
              icon={<ArrowPathIcon className="w-3.5 h-3.5" />}
              onClick={() => handleRotateKeyFromMicroservice(r)}
            >
              {t('reissueApiKey', "Perbarui")}
            </Button>
          </Tooltip>
        </div>
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
                  scroll={{ x: 750 }}
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
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-800">
                            {t('registeredApiKeys', 'Daftar Seluruh API Key Terdaftar di GeoServer Microservice')}
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {t('registeredApiKeysDesc', 'Kelola seluruh kredensial akses modular, rotasi token, dan pantau penggunaan disk spasial PostGIS.')}
                          </p>
                        </div>
                        <Button
                          type="primary"
                          icon={<KeyIcon className="w-4 h-4" />}
                          onClick={() => setCreateKeyModal({ open: true, userId: geoOverview?.users_without_key?.[0]?.id || users?.[0]?.id || null })}
                          className="bg-indigo-600 hover:bg-indigo-700 text-xs font-medium self-start sm:self-auto h-8 px-3 flex items-center gap-1.5 shadow-xs"
                        >
                          {t('generateApiKey', 'Terbitkan Kunci Baru')}
                        </Button>
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

          {watchedRole === "admin" && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 mb-4 flex gap-2.5 items-start animate-fade-in">
              <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold block text-amber-950">Peringatan Kenaikan Hak Akses (Admin)</span>
                <p className="m-0 leading-relaxed text-amber-800">
                  Mengubah role pengguna menjadi <b>ADMIN</b> akan secara otomatis meningkatkan API Key mereka di GeoServer Microservice menjadi <b>PRIMARY KEY</b> (<code className="text-purple-700 font-bold">gsvc_pk_...</code>).
                  Pengguna ini akan memiliki hak istimewa penuh untuk mengelola atau menonaktifkan API Key lain, serta mengatur batas kuota penyimpanan spasial.
                </p>
              </div>
            </div>
          )}

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
                ? t('keyGeneratedSuccessTitle', { username: refreshedKeyModal.username }, `API Key Berhasil Dibuat untuk ${refreshedKeyModal.username}`)
                : t('keyReissuedSuccessTitle', { username: refreshedKeyModal.username }, `API Key Berhasil Diterbitkan Ulang untuk ${refreshedKeyModal.username}`)}
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
                message.success(t('keyCopied', "API Key berhasil disalin ke clipboard!"));
                setTimeout(() => setCopiedKeyModal(false), 3000);
              }
            }}
          >
            {copiedKeyModal ? t('copied', "Tersalin!") : t('copyKeyBtn', "Salin Kunci")}
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
            {t('close', "Tutup")}
          </Button>
        ]}
      >
        <div className="space-y-4 pt-2">
          <p className="text-sm text-slate-600">
            {t('refreshedKeyNoticeDesc', "Kunci rahasia berikut telah digenerate. Simpan atau berikan kunci ini secara aman ke pengguna:")}
          </p>
          <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs select-all break-all border border-slate-800 shadow-inner flex items-center justify-between gap-2">
            <span>{refreshedKeyModal.key}</span>
          </div>
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2">
            <span className="text-amber-600 text-sm">⚠️</span>
            <p className="text-xs text-amber-800 leading-relaxed m-0">
              {t('keySecureNoticeWarning', 'Salin dan berikan kunci ini secara aman kepada pengguna bersangkutan. Pengguna juga dapat melihat atau mengunduh kunci ini dari menu API Key (S2S) di akun mereka.')}
            </p>
          </div>
        </div>
      </Modal>

      {/* Modal Terbitkan Kunci Baru untuk Pengguna */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <KeyIcon className="w-5 h-5 text-indigo-600" />
            <span>{t('generateApiKeyTitle', 'Terbitkan API Key Baru untuk Pengguna')}</span>
          </div>
        }
        open={createKeyModal.open}
        onCancel={() => setCreateKeyModal({ open: false, userId: null })}
        footer={null}
        destroyOnClose
        className="max-w-md w-full"
      >
        {usersWithoutKey.length === 0 ? (
          <div className="space-y-4 pt-2">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center space-y-2">
              <CheckCircleIcon className="w-9 h-9 text-emerald-600 mx-auto" />
              <span className="font-bold text-emerald-900 text-sm block">
                {t('allUsersHaveKeysTitle', 'Seluruh Pengguna Telah Memiliki API Key')}
              </span>
              <p className="text-xs text-emerald-700 m-0 leading-relaxed">
                {t('allUsersHaveKeysDesc', 'Aturan sistem menegakkan 1 Pengguna = 1 API Key. Setiap akun pengguna terdaftar saat ini telah memiliki API Key aktif. Jika Anda ingin memperbarui nilai token untuk seorang pengguna, silakan gunakan tombol Perbarui (Reissue) pada tabel di bawah.')}
              </p>
            </div>
            <div className="flex justify-end pt-2">
              <Button type="primary" onClick={() => setCreateKeyModal({ open: false, userId: null })}>
                {t('close', 'Tutup')}
              </Button>
            </div>
          </div>
        ) : (
          <Form
            form={createKeyForm}
            layout="vertical"
            initialValues={{ userId: createKeyModal.userId || usersWithoutKey[0]?.id }}
            onFinish={handleCreateKeySubmit}
            className="pt-2 space-y-4"
          >
            <Form.Item
              name="userId"
              label={t('selectUser', 'Pilih Pengguna')}
              rules={[{ required: true, message: t('selectUserRequired', 'Harap pilih pengguna yang akan dibuatkan kunci') }]}
            >
              <Select
                placeholder={t('selectUserPlaceholder', 'Pilih pengguna...')}
                showSearch
                optionFilterProp="label"
                className="w-full"
              >
                {usersWithoutKey.map(u => (
                  <Select.Option key={u.id} value={u.id} label={`${u.username} (${u.email})`}>
                    <div className="flex items-center justify-between py-0.5">
                      <span>
                        <span className="font-semibold text-slate-800">{u.username}</span>{" "}
                        <span className="text-xs text-slate-400 font-mono">({u.email})</span>
                      </span>
                      <Tag color={u.role === "admin" ? "purple" : "blue"} className="text-[10px] m-0 uppercase font-mono">
                        {u.role}
                      </Tag>
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>

            <p className="text-xs text-slate-500 leading-relaxed">
              {t('generateKeyDescAdmin', 'Sistem akan mendaftarkan 1 API Key resmi (PRIMARY jika Admin, STANDARD jika User) di database GeoServer Microservice dan menautkannya ke akun pengguna ini.')}
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button onClick={() => setCreateKeyModal({ open: false, userId: null })}>
                {t('cancel', 'Batal')}
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={createKeyLoading}
                className="bg-indigo-600 hover:bg-indigo-700 font-medium"
              >
                {t('generateApiKey', 'Terbitkan Kunci')}
              </Button>
            </div>
          </Form>
        )}
      </Modal>

      {/* Modal Ubah Batas Kuota Penyimpanan Spasial */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-slate-800">
            <CircleStackIcon className="w-5 h-5 text-indigo-600" />
            <span>{t('setStorageQuotaTitle', 'Atur Batas Kuota Penyimpanan')}: {quotaModal.keyName}</span>
          </div>
        }
        open={quotaModal.open}
        onCancel={() => setQuotaModal({ open: false, keyId: null, keyName: "", currentMb: 500 })}
        footer={null}
        destroyOnClose
        className="max-w-md w-full"
      >
        <Form
          form={quotaForm}
          layout="vertical"
          onFinish={handleUpdateQuotaSubmit}
          initialValues={{ quota_mb: quotaModal.currentMb }}
          className="pt-2 space-y-4"
        >
          <Form.Item
            label={t('storageQuotaLimit', 'Batas Kuota Disk Spasial (MB)')}
            extra={t('quotaExtraDesc', 'Setiap layer raster (GeoTIFF) dan tabel vektor (PostGIS) milik API Key ini akan dibatasi oleh batas kuota ini.')}
          >
            <Space.Compact className="w-full">
              <Form.Item
                name="quota_mb"
                noStyle
                rules={[
                  { required: true, message: t('quotaRequired', 'Batas kuota wajib diisi') },
                  { type: "number", min: 1, max: 102400, message: t('quotaRangeError', 'Batas kuota harus antara 1 MB hingga 102.400 MB (100 GB)') }
                ]}
              >
                <InputNumber 
                  className="w-full text-sm font-mono" 
                  step={100}
                  min={1}
                  max={102400}
                />
              </Form.Item>
              <Button disabled className="bg-slate-50 text-slate-500 font-mono text-xs">
                MB
              </Button>
            </Space.Compact>
          </Form.Item>

          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-600">{t('quickPresets', 'Pilihan Cepat (Presets):')}</span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: `500 MB (${t('defaultPreset', 'Default')})`, mb: 500 },
                { label: "1 GB", mb: 1024 },
                { label: "2 GB", mb: 2048 },
                { label: "5 GB", mb: 5120 },
                { label: "10 GB", mb: 10240 }
              ].map(preset => (
                <button
                  key={preset.mb}
                  type="button"
                  onClick={() => quotaForm.setFieldsValue({ quota_mb: preset.mb })}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 text-slate-700 hover:text-indigo-600 transition-colors font-medium cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button onClick={() => setQuotaModal({ open: false, keyId: null, keyName: "", currentMb: 500 })}>
              {t('cancel', 'Batal')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={quotaLoading}
              className="bg-indigo-600 hover:bg-indigo-700 font-medium"
            >
              {t('saveQuotaBtn', 'Simpan Kuota')}
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default Admin;
