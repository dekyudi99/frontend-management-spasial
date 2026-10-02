import axios from "axios";
import { ensureS2SKey } from "./WorkspaceApi";

import { MICROSERVICE_API } from "./microserviceConfig";

const MICROSERVICE_URL = MICROSERVICE_API;

const getAuthHeaders = async () => {
  const key = await ensureS2SKey();
  return {
    "X-API-Key": key,
    "Content-Type": "application/json",
  };
};

const layerGroupApi = {
  list: async (params = {}) => {
    const headers = await getAuthHeaders();
    return axios.get(`${MICROSERVICE_URL}/layer-groups`, { headers, params });
  },

  getById: async (id) => {
    const headers = await getAuthHeaders();
    return axios.get(`${MICROSERVICE_URL}/layer-groups/${id}`, { headers });
  },

  create: async (data) => {
    const headers = await getAuthHeaders();
    return axios.post(`${MICROSERVICE_URL}/layer-groups`, data, { headers });
  },

  update: async (id, data) => {
    const headers = await getAuthHeaders();
    return axios.put(`${MICROSERVICE_URL}/layer-groups/${id}`, data, { headers });
  },

  addLayer: async (groupId, { layer_name, style = null }) => {
    const existing = await layerGroupApi.getById(groupId);
    const layers = existing.data?.layers || [];
    const updatedLayers = [...layers, { layer_name, style }];
    return layerGroupApi.update(groupId, { layers: updatedLayers });
  },

  removeLayer: async (groupId, layerName) => {
    const existing = await layerGroupApi.getById(groupId);
    const layers = existing.data?.layers || [];
    const updatedLayers = layers.filter(
      (l) => (typeof l === "string" ? l : l.layer_name) !== layerName
    );
    return layerGroupApi.update(groupId, { layers: updatedLayers });
  },

  delete: async (groupId) => {
    const headers = await getAuthHeaders();
    return axios.delete(`${MICROSERVICE_URL}/layer-groups/${groupId}`, { headers });
  },
};

export default layerGroupApi;
