import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import authApi from '../api/AuthApi'
import keyApi from '../api/KeyApi'
import AuthContext from './AuthContext'
import { setOidcAccessToken, setOidcUserManager, getOidcAccessToken } from '../services/oidcTokenService'
import { terminateLocalSession } from '../services/sessionTerminationService'

const AuthProvider = ({ children }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const oidcAuth = useOidcAuth()

  const [user, setUser] = useState(null)
  const [authType, setAuthType] = useState(null) // 'keycloak' | 'legacy' | null
  const [isLoading, setIsLoading] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

  // Simpan userManager OIDC ke service global untuk penanganan interceptor 401
  useEffect(() => {
    if (oidcAuth) {
      setOidcUserManager(oidcAuth)
    }
  }, [oidcAuth])

  // Daftarkan listener event OIDC: OP Signout (iframe), Silent Renew Error, dan Token Expired
  useEffect(() => {
    if (!oidcAuth?.events) return

    const handleSessionEnded = async () => {
      setUser(null)
      setAuthType(null)
      await terminateLocalSession('Sesi berakhir')
    }

    oidcAuth.events.addUserSignedOut(handleSessionEnded)
    oidcAuth.events.addSilentRenewError(handleSessionEnded)
    oidcAuth.events.addAccessTokenExpired(handleSessionEnded)

    return () => {
      oidcAuth.events.removeUserSignedOut(handleSessionEnded)
      oidcAuth.events.removeSilentRenewError(handleSessionEnded)
      oidcAuth.events.removeAccessTokenExpired(handleSessionEnded)
    }
  }, [oidcAuth?.events])

  // Pengecekan sesi saat tab kembali aktif (visibilitychange & focus) dengan throttle 15 detik
  useEffect(() => {
    let lastCheckTime = 0
    const CHECK_THROTTLE_MS = 15000 // Paling sering 15 detik sekali

    const handleVisibilityOrFocus = async () => {
      if (typeof document !== 'undefined' && document.visibilityState && document.visibilityState !== 'visible') {
        return
      }

      const now = Date.now()
      if (now - lastCheckTime < CHECK_THROTTLE_MS) {
        return
      }
      lastCheckTime = now

      // Hanya verifikasi jika sesi OIDC aktif
      if (oidcAuth.isAuthenticated || getOidcAccessToken()) {
        try {
          // Lakukan silent verification ke OP Keycloak
          await oidcAuth.signinSilent()
        } catch {
          // Jika sesi di Keycloak sudah berakhir di tab lain
          setUser(null)
          setAuthType(null)
          await terminateLocalSession('Sesi berakhir')
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', handleVisibilityOrFocus)
      document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', handleVisibilityOrFocus)
        document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      }
    }
  }, [oidcAuth])

  // Sinkronisasi status autentikasi Keycloak vs Legacy
  useEffect(() => {
    let cancelled = false

    const syncAuth = async () => {
      // 1. Jalur Keycloak SSO
      if (oidcAuth.isAuthenticated && oidcAuth.user?.access_token) {
        setOidcAccessToken(oidcAuth.user.access_token)
        try {
          const profileRes = await authApi.getProfile()
          if (!cancelled && profileRes?.data?.data) {
            setUser(profileRes.data.data)
            setAuthType('keycloak')
          }
          // Ambil dan simpan S2S key untuk operasi spasial GeoServer
          try {
            const keyRes = await keyApi.getMyKey()
            const key = keyRes.data?.full_key || keyRes.data?.plain_key || keyRes.data?.s2s_key
            if (key) {
              localStorage.setItem('astragis_s2s_key', key)
            }
          } catch (keyErr) {
            console.warn('Could not auto-fetch S2S key for Keycloak user:', keyErr)
          }
        } catch (err) {
          if (!cancelled) {
            console.error('Failed to resolve Keycloak user profile:', err)
            if (err.response?.status === 403) {
              setAccessDenied(true)
            }
            setUser(null)
            setAuthType(null)
            setOidcAccessToken(null)
          }
        } finally {
          if (!cancelled) setIsLoading(false)
        }
        return
      }

      // 2. Jalur Legacy Auth (jika OIDC tidak sedang login dan legacy diizinkan)
      if (!oidcAuth.isLoading) {
        setOidcAccessToken(null)
        const legacyToken = localStorage.getItem('JWT_TOKEN')
        const isLegacyEnabled = import.meta.env.VITE_LEGACY_LOGIN_ENABLED !== 'false'

        if (legacyToken && isLegacyEnabled) {
          try {
            const profileRes = await authApi.getProfile()
            if (!cancelled && profileRes?.data?.data) {
              setUser(profileRes.data.data)
              setAuthType('legacy')
            }
          } catch {
            if (!cancelled) {
              localStorage.removeItem('JWT_TOKEN')
              localStorage.removeItem('astragis_s2s_key')
              setUser(null)
              setAuthType(null)
            }
          } finally {
            if (!cancelled) setIsLoading(false)
          }
        } else {
          setUser(null)
          setAuthType(null)
          setIsLoading(false)
        }
      }
    }

    syncAuth()

    return () => {
      cancelled = true
    }
  }, [oidcAuth.isAuthenticated, oidcAuth.isLoading, oidcAuth.user?.access_token])

  // Login dengan Keycloak SSO (Authorization Code + PKCE)
  const signinRedirect = useCallback((args) => {
    return oidcAuth.signinRedirect(args)
  }, [oidcAuth])

  // Logout terpadu (RP-initiated logout ke Keycloak end_session)
  const logout = useCallback(async () => {
    const portalUrl = import.meta.env.VITE_PORTAL_URL || 'http://localhost:5170'
    const postLogoutUri = import.meta.env.VITE_KEYCLOAK_POST_LOGOUT_REDIRECT_URI || portalUrl

    if (authType === 'keycloak' || oidcAuth.isAuthenticated || oidcAuth.user) {
      const idToken = oidcAuth.user?.id_token
      try {
        await oidcAuth.signoutRedirect({
          id_token_hint: idToken,
          post_logout_redirect_uri: postLogoutUri,
        })
      } catch (err) {
        console.warn('OIDC signoutRedirect failed:', err)
        window.location.href = postLogoutUri
      } finally {
        localStorage.removeItem('JWT_TOKEN')
        localStorage.removeItem('astragis_s2s_key')
        setOidcAccessToken(null)
        setUser(null)
        setAuthType(null)
      }
      return
    }

    localStorage.removeItem('JWT_TOKEN')
    localStorage.removeItem('astragis_s2s_key')
    setOidcAccessToken(null)
    setUser(null)
    setAuthType(null)
    window.location.href = portalUrl
  }, [authType, oidcAuth])

  const value = useMemo(
    () => ({
      user,
      role: user?.role || 'user',
      isLoading: oidcAuth.isLoading || isLoading,
      isAuthenticated: Boolean(user) || oidcAuth.isAuthenticated || Boolean(localStorage.getItem('JWT_TOKEN')),
      authType,
      accessDenied,
      signinRedirect,
      logout,
      oidcAuth,
    }),
    [user, isLoading, authType, accessDenied, signinRedirect, logout, oidcAuth],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
