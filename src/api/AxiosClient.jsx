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

let isRedirecting = false

axiosClient.interceptors.response.use(
    (response) => {
        const s2s = response.data?.s2s_key || response.data?.data?.s2s_key || response.data?.full_key || response.data?.data?.full_key;
        if (s2s) {
            localStorage.setItem("astragis_s2s_key", s2s);
        }
        return response;
    },

    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("JWT_TOKEN")

            const currentPath = window.location.pathname
            const isAuthPage = currentPath.startsWith("/auth") || currentPath === "/"

            // Cegah redirect loop jika sedang di halaman login/register
            if (!isAuthPage && !isRedirecting) {
                isRedirecting = true

                // Tandai bahwa sesi telah berakhir untuk notifikasi di Login.jsx
                sessionStorage.setItem("SESSION_EXPIRED", "true")

                // Simpan URL terakhir agar bisa dikembalikan setelah login
                const currentFullUrl = window.location.pathname + window.location.search
                if (currentFullUrl && !currentFullUrl.startsWith("/auth")) {
                    sessionStorage.setItem("REDIRECT_AFTER_LOGIN", currentFullUrl)
                }

                // Langsung arahkan pengguna ke halaman login tanpa perlu refresh manual
                window.location.replace("/auth/login")
            }
        }

        return Promise.reject(error)
    }
)

export default axiosClient