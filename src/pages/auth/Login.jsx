import React, { useState, useEffect } from 'react'
import { Button, Form, Input, message, ConfigProvider } from 'antd'
import { useMutation } from '@tanstack/react-query'
import authApi from '../../api/AuthApi'
import { useNavigate, Link } from 'react-router-dom'
import OtpVerificationModal from '../../components/auth/OtpVerificationModal'
import { useLanguage } from '../../context/LanguageContext'

const appName = import.meta.env.VITE_APP_NAME

const Login = () => {
    const { t, translateApi } = useLanguage()
    const navigate = useNavigate()

    useEffect(() => {
        document.title = `${t('authLoginButton', 'Login')} | ${appName}`

        if (sessionStorage.getItem("SESSION_EXPIRED")) {
            sessionStorage.removeItem("SESSION_EXPIRED")
            message.warning(t('sessionExpired', "Sesi Anda telah berakhir. Silakan login kembali."))
        }
    }, [t])

    // State untuk Modal Verifikasi OTP
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
    const [unverifiedEmail, setUnverifiedEmail] = useState('')

    // Mutation Login Utama
    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: (response) => {
            const data = response?.data
            message.success(translateApi(data?.detail) || t('authLoginSuccess', "Login successful!"))
            localStorage.setItem("JWT_TOKEN", data?.access_token)
            if (data?.s2s_key && data?.is_active) {
                localStorage.setItem("astragis_s2s_key", data.s2s_key)
            } else {
                localStorage.removeItem("astragis_s2s_key")
            }

            const redirectUrl = sessionStorage.getItem("REDIRECT_AFTER_LOGIN")
            if (redirectUrl) {
                sessionStorage.removeItem("REDIRECT_AFTER_LOGIN")
                navigate(redirectUrl)
            } else {
                navigate('/dashboard')
            }
        },
        onError: (error) => {
            const errorData = error.response?.data
            // Jika akun belum diverifikasi, backend mengembalikan requires_verification: true
            if (errorData?.requires_verification) {
                setUnverifiedEmail(errorData?.email || '')
                setIsOtpModalOpen(true)
                message.warning(translateApi(errorData?.detail) || t('authAccountNotVerified', "Your account is not verified. An OTP code has been sent to your email."))
            } else {
                message.error(translateApi(errorData?.detail) || t('authLoginFailed', "Username or password is incorrect."))
            }
        }
    })

    const onFinish = (values) => {
        const formData = new FormData()
        formData.append('username', values.username)
        formData.append('password', values.password)
        loginMutation.mutate(formData)
    }

    return (
        <div className='flex flex-col justify-center items-center gap-1 w-full'>
            <h1 className='text-white font-bold text-xl sm:text-2xl mb-1'>{t('authLoginTitle', 'Welcome Back')}</h1>
            <p className='text-slate-300 text-xs sm:text-sm text-center mb-4'>{t('authLoginSubtitle', 'Enter your credentials to access your spatial workspace')}</p>

            <ConfigProvider
                theme={{
                    components: {
                        Form: {
                            labelColor: '#ffffff'
                        },
                    },
                }}
            >
                <Form layout='vertical' onFinish={onFinish} className='w-full'>
                    <Form.Item
                        name={"username"}
                        label={<span className='text-xs sm:text-sm text-white'>{t('authUsernameLabel', 'Username')}</span>}
                        rules={[{ required: true, message: t('authUsernameRequired', "Please enter your username") }]}
                        className='w-full mb-3 sm:mb-4'
                    >
                        <Input placeholder={t('authUsernamePlaceholder', "Enter username")} size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={<span className='text-xs sm:text-sm text-white'>{t('authPasswordLabel', 'Password')}</span>}
                        rules={[
                            { required: true, message: t('authPasswordRequired', 'Please enter your password') },
                            { min: 8, message: t('authPasswordMin', "Password must be at least 8 characters") }
                        ]}
                        className='w-full mb-2'
                    >
                        <Input.Password placeholder={t('authPasswordPlaceholder', "Enter password")} size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <div className='flex flex-wrap justify-between items-center w-full gap-2 mb-5 text-xs sm:text-sm'>
                        <span className='text-slate-300'>
                            {t('authNoAccount', "Don't have an account?")}{' '}
                            <Link to={"/auth/register"} className='text-teal-400 hover:text-teal-300 font-medium'>
                                {t('authRegisterLink', 'Register')}
                            </Link>
                        </span>
                        <Link to={"/auth/forgot-password"} className='text-teal-400 hover:text-teal-300 font-medium'>
                            {t('authForgotPasswordLink', 'Forgot Password?')}
                        </Link>
                    </div>

                    <Button
                        htmlType="submit"
                        type="primary"
                        size="large"
                        loading={loginMutation.isPending}
                        className='w-full bg-teal-600 hover:bg-teal-500 font-semibold h-11 rounded-lg text-sm sm:text-base'
                    >
                        {t('authLoginButton', 'Login')}
                    </Button>
                </Form>
            </ConfigProvider>

            {/* Modal Input OTP Menggunakan Komponen Reusable */}
            <OtpVerificationModal
                open={isOtpModalOpen}
                onClose={() => setIsOtpModalOpen(false)}
                email={unverifiedEmail}
                onSuccess={() => {
                    setIsOtpModalOpen(false)
                    navigate('/dashboard')
                }}
                title={t('authVerificationRequired', "Account Verification Required")}
                subtitle={t('authAccountNotActive', "Your account is not yet active")}
            />
        </div>
    )
}

export default Login