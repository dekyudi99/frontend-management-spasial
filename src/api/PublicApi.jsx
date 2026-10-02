import axiosClient from "./AxiosClient";

const publicApi = {
  getProjects: (params) => {
    return axiosClient.get("/public/projects", { params });
  },
  getProjectDetail: (id) => {
    return axiosClient.get(`/public/projects/${id}`);
  },
  getWorkspaces: (params) => {
    return axiosClient.get("/public/workspaces", { params });
  },
  getWorkspaceLayers: (id, params) => {
    return axiosClient.get(`/public/workspaces/${id}/layers`, { params });
  },
  cloneWorkspace: (id, data) => {
    return axiosClient.post(`/public/workspaces/${id}/clone`, data);
  },
  forkWorkspace: (id, data) => {
    return axiosClient.post(`/public/workspaces/${id}/clone`, data);
  },
};

export default publicApi;
