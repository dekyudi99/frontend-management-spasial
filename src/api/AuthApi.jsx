import axiosClient from "./AxiosClient";

const authApi = {
    register: (credentials) => {
        return axiosClient.post("/auth/register", credentials)
    },
    login: (credentials) => {
        return axiosClient.post("/auth/login", credentials)
    },
    verifyEmail: (data) => {
        return axiosClient.post("/auth/verify-email", data)
    },
    sendRegisterOtp: (data) => {
        return axiosClient.post("/auth/send-register-otp", data)
    },
    sendForgotPasswordOtp: (data) => {
        return axiosClient.post("/auth/forgot-password/send-otp", data)
    },
    resetPassword: (data) => {
        return axiosClient.post("/auth/forgot-password/reset", data)
    },
    getProfile: () => {
        return axiosClient.get("/auth/me")
    },
    updateProfile: (data) => {
        return axiosClient.put("/auth/profile", data)
    },
    sendChangeEmailOtp: (data) => {
        return axiosClient.post("/auth/change-email/send-otp", data)
    },
    verifyChangeEmail: (data) => {
        return axiosClient.post("/auth/change-email/verify", data)
    },
    changePassword: (data) => {
        return axiosClient.post("/auth/change-password", data)
    },
}

export default authApi