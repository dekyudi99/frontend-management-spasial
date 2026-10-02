import axios from "axios";
import keyApi from "./KeyApi";

import { MICROSERVICE_API } from "./microserviceConfig";

const MICROSERVICE_URL = MICROSERVICE_API;

export const getStoredS2SKey = () => {
    return localStorage.getItem("astragis_s2s_key") || "";
};

export const ensureS2SKey = async (customKey) => {
    if (customKey) return customKey;
    try {
        const res = await keyApi.getMyKey();
        if (!res.data || res.data.is_active === false) {
            localStorage.removeItem("astragis_s2s_key");
            const err = new Error("API Key Anda sedang dinonaktifkan oleh Administrator.");
            err.isKeyDisabled = true;
            throw err;
        }
        const key = res.data?.full_key || res.data?.plain_key || res.data?.s2s_key;
        if (key) {
            localStorage.setItem("astragis_s2s_key", key);
            return key;
        }
    } catch (e) {
        if (e.isKeyDisabled) throw e;
        console.warn("Auto-sync S2S Key warning:", e);
        throw e;
    }
    const fallback = getStoredS2SKey();
    if (!fallback) {
        const err = new Error("API Key Anda tidak ditemukan atau sedang dinonaktifkan.");
        err.isKeyDisabled = true;
        throw err;
    }
    return fallback;
};

const getHeaders = async (customKey) => {
    const key = await ensureS2SKey(customKey);
    if (!key) {
        const err = new Error("API Key Anda sedang dinonaktifkan oleh Administrator.");
        err.isKeyDisabled = true;
        throw err;
    }
    return {
        "Content-Type": "application/json",
        "X-API-Key": key
    };
};

const workspaceApi = {
    // 1. List all workspaces from GeoServer Microservice
    list: async (params = {}, customKey) => {
        const headers = await getHeaders(customKey);
        try {
            const res = await axios.get(`${MICROSERVICE_URL}/workspaces`, { headers });
            const list = Array.isArray(res.data) ? res.data : [];
            return {
                data: {
                    success: true,
                    total: list.length,
                    data: list.map(ws => {
                        const technicalName = ws.workspace_name || ws.ws_name || ws.name;
                        const friendlyName = ws.display_name || ws.name || technicalName;
                        const hashedId = ws.id || ws.hashed_id || technicalName;
                        return {
                            id: hashedId,
                            hashed_id: hashedId,
                            raw_id: ws.raw_id,
                            name: friendlyName,
                            display_name: friendlyName,
                            ws_name: technicalName,
                            workspace_name: technicalName,
                            href: ws.href,
                            visibility: ws.visibility || "private",
                            created_at: ws.created_at
                        };
                    })
                }
            };
        } catch (err) {
            console.error("Gagal mengambil workspace dari GeoServer Microservice:", err);
            throw err;
        }
    },

    // 2. Create workspace in GeoServer Microservice
    create: async (data, customKey) => {
        let displayName = "";
        let visibility = "private";

        if (data instanceof FormData) {
            displayName = data.get("display_name") || data.get("name_workspace") || data.get("name") || "";
            visibility = data.get("visibility") || "private";
        } else {
            displayName = data?.display_name || data?.name_workspace || data?.name || "";
            visibility = data?.visibility || "private";
        }

        const headers = await getHeaders(customKey);
        try {
            const res = await axios.post(
                `${MICROSERVICE_URL}/workspaces`, 
                { 
                    display_name: displayName,
                    visibility: visibility
                }, 
                { headers }
            );

            const technicalName = res.data?.workspace_name || displayName;
            const friendlyName = res.data?.display_name || displayName;
            const hashedId = res.data?.id || res.data?.hashed_id || technicalName;

            return {
                data: {
                    success: true,
                    data: {
                        id: hashedId,
                        hashed_id: hashedId,
                        raw_id: res.data?.raw_id,
                        name: friendlyName,
                        display_name: friendlyName,
                        ws_name: technicalName,
                        workspace_name: technicalName,
                        visibility: res.data?.visibility || visibility
                    },
                    detail: res.data?.detail || `Workspace '${friendlyName}' berhasil dibuat.`
                }
            };
        } catch (err) {
            const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Gagal membuat workspace.";
            throw new Error(errMsg);
        }
    },

    // 3. Detail workspace from GeoServer Microservice
    detail: async (workspaceName, customKey) => {
        const headers = await getHeaders(customKey);
        try {
            const res = await axios.get(`${MICROSERVICE_URL}/workspaces/${workspaceName}`, { headers });
            const technicalName = res.data?.workspace_name || res.data?.name || workspaceName;
            const friendlyName = res.data?.display_name || res.data?.name || technicalName;
            const hashedId = res.data?.id || res.data?.hashed_id || technicalName;

            return {
                data: {
                    success: true,
                    data: {
                        id: hashedId,
                        hashed_id: hashedId,
                        raw_id: res.data?.raw_id,
                        name: friendlyName,
                        display_name: friendlyName,
                        ws_name: technicalName,
                        workspace_name: technicalName,
                        visibility: res.data?.visibility || "private",
                        created_at: res.data?.created_at,
                        isolated: res.data?.isolated,
                        dateCreated: res.data?.dateCreated,
                        datastores: res.data?.dataStores,
                        coveragestores: res.data?.coverageStores
                    }
                }
            };
        } catch (err) {
            const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Gagal mengambil detail workspace.";
            throw new Error(errMsg);
        }
    },

    // 4. Delete workspace from GeoServer Microservice
    delete: async (workspaceName, customKey) => {
        const headers = await getHeaders(customKey);
        try {
            const res = await axios.delete(`${MICROSERVICE_URL}/workspaces/${workspaceName}?recurse=true`, { headers });
            if (res.data && res.data.success === false) {
                throw new Error(res.data.detail || `Gagal menghapus workspace '${workspaceName}'.`);
            }
            return {
                data: {
                    success: true,
                    detail: res.data?.detail || `Workspace '${workspaceName}' berhasil dihapus dari GeoServer.`
                }
            };
        } catch (err) {
            const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || `Gagal menghapus workspace '${workspaceName}'.`;
            throw new Error(errMsg);
        }
    },

    // Backward compatibility helpers
    getAll: (customKey) => workspaceApi.list({}, customKey),
    getRecently: (customKey) => workspaceApi.list({}, customKey)
};

export default workspaceApi;
