import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin, Alert, Button } from 'antd'
import { useAuth as useOidcAuth } from 'react-oidc-context'
import useAuth from '../../hooks/useAuth'
import { validateReturnTo } from '../../utils/ssoSecurity'

const AuthCallbackPage = () => {
  const oidcAuth = useOidcAuth()
  const { isAuthenticated, isLoading, user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && (isAuthenticated || user)) {
      // Ambil returnTo dari OIDC user state atau sessionStorage
      const rawReturnTo = oidcAuth.user?.state?.returnTo || 
        (typeof window !== 'undefined' ? (sessionStorage.getItem('SSO_RETURN_TO') || sessionStorage.getItem('REDIRECT_AFTER_LOGIN')) : null)

      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('SSO_RETURN_TO')
        sessionStorage.removeItem('REDIRECT_AFTER_LOGIN')
      }

      const targetPath = validateReturnTo(rawReturnTo, '/dashboard')
      navigate(targetPath, { replace: true })
    }
  }, [isLoading, isAuthenticated, user, oidcAuth.user?.state?.returnTo, navigate])

  if (oidcAuth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-900 text-white">
        <div className="max-w-md w-full p-6 bg-slate-800 rounded-2xl shadow-xl space-y-4 text-center border border-slate-700">
          <Alert
            type="error"
            showIcon
            message="Keycloak SSO Login Failed"
            description={oidcAuth.error.message || 'An error occurred while validating authorization from Keycloak.'}
            className="text-left text-slate-900"
          />
          <Button
            type="primary"
            className="w-full bg-teal-600 hover:bg-teal-500 font-semibold h-10"
            onClick={() => navigate('/auth/login', { replace: true })}
          >
            Back to Login Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">
      <div className="text-center space-y-4">
        <Spin size="large" />
        <p className="text-sm text-slate-300 font-medium">
          Verifying Keycloak SSO session...
        </p>
      </div>
    </div>
  )
}

export default AuthCallbackPage
