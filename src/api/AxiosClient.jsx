import axios from "axios"
import { getOidcAccessToken, setOidcAccessToken, getOidcUserManager } from "../services/oidcTokenService"
import { terminateLocalSession } from "../services/sessionTerminationService"

const apiURL = import.meta.env.VITE_API_BASE_URL

const axiosClient = axios.create({
    baseURL: apiURL,
    headers: {
        // "Content-Type": "application/json",
    },
})

axiosClient.interceptors.request.use(
    (config) => {
        const oidcToken = getOidcAccessToken()
        const legacyToken = localStorage.getItem('JWT_TOKEN')
        const token = oidcToken || legacyToken

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`
        }

        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

let isRefreshing = false
let refreshPromise = null

axiosClient.interceptors.response.use(
    (response) => {
        const s2s = response.data?.s2s_key || response.data?.data?.s2s_key || response.data?.full_key || response.data?.data?.full_key;
        if (s2s) {
            localStorage.setItem("astragis_s2s_key", s2s);
        }
        return response;
    },

    async (error) => {
        const originalRequest = error.config

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true
            const userManager = getOidcUserManager()

            // Jika sesi OIDC aktif, coba perbarui token sekali
            if (userManager && getOidcAccessToken()) {
                try {
                    if (!isRefreshing) {
                        isRefreshing = true
                        refreshPromise = userManager.signinSilent().then((newUser) => {
                            if (newUser?.access_token) {
                                setOidcAccessToken(newUser.access_token)
                                return newUser.access_token
                            }
                            return null
                        }).finally(() => {
                            isRefreshing = false
                            refreshPromise = null
                        })
                    }

                    const newToken = await refreshPromise
                    if (newToken) {
                        originalRequest.headers = originalRequest.headers || {}
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`
                        return axiosClient(originalRequest)
                    }
                } catch {
                    // Token renewal gagal (misal sesi Keycloak sudah berakhir di server)
                }
            }

            // Jika perbaruan token gagal atau bukan sesi OIDC yang valid
            await terminateLocalSession('Sesi berakhir')
        } else if (error.response?.status === 401) {
            await terminateLocalSession('Sesi berakhir')
        }

        return Promise.reject(error)
    }
)

export default axiosClient