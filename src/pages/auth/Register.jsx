import React, { useEffect } from 'react'
import { Spin } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import useAuth from '../../hooks/useAuth'

const Register = () => {
    const { t } = useLanguage()
    const navigate = useNavigate()
    const { signinRedirect, isAuthenticated, isLoading: isAuthLoading } = useAuth()

    useEffect(() => {
        if (!isAuthLoading) {
            if (isAuthenticated) {
                navigate('/dashboard', { replace: true })
            } else {
                signinRedirect()
            }
        }
    }, [isAuthLoading, isAuthenticated, navigate, signinRedirect])

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3 text-slate-500">
            <Spin size="large" />
            <p className="text-sm font-medium">{t('redirectingToSso', 'Mengalihkan ke Keycloak SSO...')}</p>
        </div>
    )
}

export default Register