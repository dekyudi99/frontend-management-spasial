import axiosClient from "./AxiosClient";

const keyApi = {
    getMyKey: () => {
        return axiosClient.get("/api-key/me");
    },
    refreshKey: () => {
        return axiosClient.post("/api-key/refresh");
    },
    testConnection: () => {
        return axiosClient.get("/api-key/test-connection");
    }
};

export default keyApi;