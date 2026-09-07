import axiosClient from "./AxiosClient";

const authApi = {
    register: (credentials) => {
        return axiosClient.post("/auth/register", credentials)
    },
    login: (credentials) => {
        return axiosClient.post("/auth/login", credentials)
    },
}

export default authApi