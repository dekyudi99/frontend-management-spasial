import axiosClient from "./AxiosClient";

const infoApi = {
  getVersion: () => axiosClient.get("/info/version"),
  getStatus: () => axiosClient.get("/info/status"),
};

export default infoApi;
