import axiosClient from "./AxiosClient";

const layerGroupApi = {
  list: (params) => axiosClient.get("/layer-group/list", { params }),
  getById: (id) => axiosClient.get(`/layer-group/${id}`),
  create: (data) => axiosClient.post("/layer-group/create", data),
  update: (id, data) => axiosClient.put(`/layer-group/${id}`, data),
  addLayer: (groupId, data) => axiosClient.post(`/layer-group/${groupId}/add-layer`, data),
  removeLayer: (groupId, layerId) => axiosClient.delete(`/layer-group/${groupId}/remove-layer/${layerId}`),
  delete: (groupId) => axiosClient.delete(`/layer-group/${groupId}`),
};

export default layerGroupApi;
