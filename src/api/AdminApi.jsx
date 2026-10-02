import axiosClient from "./AxiosClient";
import axios from "axios";

import { MICROSERVICE_API } from "./microserviceConfig";

const MICROSERVICE_URL = MICROSERVICE_API;

const adminApi = {
    // 1. User Management
    getUsers: (params) => axiosClient.get("/admin/users", { params }),
    updateUser: (userId, data) => axiosClient.put(`/admin/users/${userId}`, data),
    deleteUser: (userId) => axiosClient.delete(`/admin/users/${userId}`),

    // 2. User API Key Management (Admin override)
    toggleUserKey: (userId) => axiosClient.post(`/admin/users/${userId}/api-key/toggle`),
    toggleKeyByMicroserviceId: (keyId) => axiosClient.post(`/admin/keys/${keyId}/toggle`),
    refreshUserKey: (userId) => axiosClient.post(`/admin/users/${userId}/api-key/refresh`),
    generateUserKey: (userId) => axiosClient.post(`/admin/users/${userId}/api-key/generate`),

    // 3. System Logs (via Backend Admin Proxy)
    getLogs: (params) => axiosClient.get("/admin/logs", { params }),

    // 4. GeoServer Overview
    getGeoServerOverview: () => axiosClient.get("/admin/geoserver/overview"),

    // Direct GeoServer Microservice calls (using user/admin api key if needed)
    directMicroservice: {
        getHealth: () => axios.get(`${MICROSERVICE_URL}/health`),
        getWorkspaces: (apiKey) => axios.get(`${MICROSERVICE_URL}/workspaces`, {
            headers: { "X-API-Key": apiKey }
        }),
        getMyLayers: (apiKey, type) => axios.get(`${MICROSERVICE_URL}/layers/my-layers`, {
            params: type ? { layer_type: type } : {},
            headers: { "X-API-Key": apiKey }
        }),
        getLogs: (apiKey, params) => axios.get(`${MICROSERVICE_URL}/logs`, {
            params,
            headers: { "X-API-Key": apiKey }
        })
    }
};

export default adminApi;
