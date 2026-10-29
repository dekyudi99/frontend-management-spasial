import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Spin, Alert, Button } from 'antd'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import useAuth from '../../hooks/useAuth'
import { validateReturnTo } from '../../utils/ssoSecurity'

const SsoStartPage = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const oidcAuth = useOidcAuth()
  const { isAuthenticated, isLoading, user, signinRedirect } = useAuth()
  const [errorMsg, setErrorMsg] = useState(null)
  const isInitiatedRef = useRef(false)

  const rawReturnTo = searchParams.get('returnTo')
  const safeReturnTo = validateReturnTo(rawReturnTo, '/dashboard')

  useEffect(() => {
    // 1. Cek error dari parameter URL atau error OIDC
    const urlError = searchParams.get('error')
    const urlErrorDesc = searchParams.get('error_description')
    if (urlError) {
      setErrorMsg(urlErrorDesc || urlError)
      return
    }
    if (oidcAuth.error) {
      setErrorMsg(oidcAuth.error.message || 'Gagal memulai sesi SSO.')
      return
    }

    // 2. Jika user SUDAH login lokal -> langsung navigasi ke tujuan tanpa ke Keycloak
    if (!isLoading && (isAuthenticated || user)) {
      navigate(safeReturnTo, { replace: true })
      return
    }

    // 3. Jika belum login dan belum memulai redirect -> mulai signinRedirect ke Keycloak
    if (!isLoading && !isAuthenticated && !user && !isInitiatedRef.current) {
      isInitiatedRef.current = true
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('SSO_RETURN_TO', safeReturnTo)
      }

      signinRedirect({ state: { returnTo: safeReturnTo } }).catch((err) => {
        setErrorMsg(err.message || 'Tidak dapat mengalihkan ke Keycloak.')
      })
    }
  }, [isLoading, isAuthenticated, user, safeReturnTo, searchParams, oidcAuth.error, signinRedirect, navigate])

  // Cegah redirect loop jika login dibatalkan atau ditolak
  if (errorMsg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
        <div className="max-w-md w-full p-6 bg-slate-800 rounded-2xl shadow-xl space-y-4 text-center border border-slate-700">
          <Alert
            type="error"
            showIcon
            message="Gagal Masuk via SSO"
            description={errorMsg}
            className="text-left text-slate-900"
          />
          <div className="flex space-x-3">
            <Button
              type="primary"
              className="flex-1 bg-teal-600 hover:bg-teal-500 font-semibold h-10"
              onClick={() => {
                setErrorMsg(null)
                isInitiatedRef.current = false
                signinRedirect({ state: { returnTo: safeReturnTo } })
              }}
            >
              Coba Lagi
            </Button>
            <Button
              className="flex-1 h-10"
              onClick={() => navigate('/', { replace: true })}
            >
              Ke Halaman Utama
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Tampilkan layar memuat sederhana
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center space-y-4">
        <Spin size="large" />
        <p className="text-sm text-slate-300 font-medium">
          Redirecting to VoxaGIS Dashboard...
        </p>
      </div>
    </div>
  )
}

export default SsoStartPage
