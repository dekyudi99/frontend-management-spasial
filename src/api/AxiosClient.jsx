import axios from "axios"

const apiURL = import.meta.env.VITE_API_BASE_URL

const axiosClient = axios.create({
    baseURL: apiURL,
    headers: {
        // "Content-Type": "application/json",
    },
})

axiosClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('JWT_TOKEN')

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

axiosClient.interceptors.response.use(
    (response) => response,

    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("JWT_TOKEN");

            // kalau punya API KEY jangan dihapus
            // localStorage.removeItem("API_KEY")

            // window.location.href = "/auth/login";
        }

        return Promise.reject(error);
    }
)

export default axiosClient