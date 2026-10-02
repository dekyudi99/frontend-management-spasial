import React, { useState, useEffect } from 'react'
import { Button, Form, Input, message, ConfigProvider } from 'antd'
import { useMutation } from '@tanstack/react-query'
import authApi from '../../api/AuthApi'
import { useNavigate, Link } from 'react-router-dom'
import OtpVerificationModal from '../../components/auth/OtpVerificationModal'
import { useLanguage } from '../../context/LanguageContext'

const appName = import.meta.env.VITE_APP_NAME

const Register = () => {
    const { t, translateApi } = useLanguage()

    useEffect(() => {
        document.title = `${t('authRegisterButton', 'Register')} | ${appName}`
    }, [t])

    const navigate = useNavigate()

    // State untuk Modal Verifikasi OTP setelah Register
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState('')

    // Mutation Register
    const registerMutation = useMutation({
        mutationFn: authApi.register,
        onSuccess: (response) => {
            const data = response?.data
            message.success(translateApi(data?.detail) || t('authRegisterSuccess', "Registration successful! An OTP code has been sent to your email."))
            setIsOtpModalOpen(true)
        },
        onError: (error) => {
            message.error(translateApi(error) || t('authRegisterFailed', "An error occurred during registration."))
        }
    })

    const onFinish = (values) => {
        const formData = new FormData()
        formData.append('username', values.username)
        formData.append('email', values.email)
        formData.append('password', values.password)

        setRegisteredEmail(values.email)
        registerMutation.mutate(formData)
    }

    return (
        <div className='flex flex-col justify-center items-center gap-1 w-full'>
            <h1 className='text-white font-bold text-xl sm:text-2xl mb-1'>{t('authRegisterTitle', 'Create an Account')}</h1>
            <p className='text-slate-300 text-xs sm:text-sm text-center mb-4'>{t('authRegisterSubtitle', 'Join AstraGIS to publish and analyze spatial data')}</p>

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
                        className='w-full mb-3'
                    >
                        <Input placeholder={t('authUsernamePlaceholder', "Enter username")} size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <Form.Item
                        name={"email"}
                        label={<span className='text-xs sm:text-sm text-white'>{t('authEmailLabel', 'Email Address')}</span>}
                        rules={[
                            { required: true, message: t('authEmailRequired', "Please enter your email") },
                            { type: 'email', message: t('authEmailInvalid', "Please enter a valid email address") }
                        ]}
                        className='w-full mb-3'
                    >
                        <Input placeholder={t('authEmailPlaceholder', "name@example.com")} size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={<span className='text-xs sm:text-sm text-white'>{t('authPasswordLabel', 'Password')}</span>}
                        rules={[
                            { required: true, message: t('authPasswordRequired', 'Please enter a password') },
                            { min: 8, message: t('authPasswordMin', "Password must be at least 8 characters") }
                        ]}
                        className='w-full mb-3'
                    >
                        <Input.Password placeholder={t('newPasswordPlaceholder', "Min 8 characters")} size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label={<span className='text-xs sm:text-sm text-white'>{t('authConfirmPasswordLabel', 'Confirm Password')}</span>}
                        dependencies={['password']}
                        className='w-full mb-4'
                        rules={[
                            { required: true, message: t('authConfirmPasswordRequired', 'Please confirm your password') },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(new Error(t('authPasswordMismatch', 'The two passwords do not match!')))
                                },
                            }),
                            { min: 8, message: t('authPasswordMin', "Password must be at least 8 characters") }
                        ]}
                    >
                        <Input.Password placeholder={t('authConfirmPasswordPlaceholder', "Repeat your password")} size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <p className='text-slate-300 text-xs sm:text-sm mb-4'>
                        {t('authAlreadyHaveAccount', 'Already have an account?')}{' '}
                        <Link to={"/auth/login"} className='text-teal-400 hover:text-teal-300 font-medium'>
                            {t('authLoginButton', 'Login')}
                        </Link>
                    </p>

                    <Button
                        htmlType="submit"
                        type="primary"
                        size="large"
                        loading={registerMutation.isPending}
                        className='w-full bg-teal-600 hover:bg-teal-500 font-semibold h-11 rounded-lg text-sm sm:text-base'
                    >
                        {t('authRegisterButton', 'Register')}
                    </Button>
                </Form>
            </ConfigProvider>

            {/* Modal Input OTP Menggunakan Komponen Reusable */}
            <OtpVerificationModal
                open={isOtpModalOpen}
                onClose={() => {
                    setIsOtpModalOpen(false)
                    navigate('/auth/login')
                }}
                email={registeredEmail}
                onSuccess={() => {
                    setIsOtpModalOpen(false)
                    navigate('/dashboard')
                }}
                title={t('authVerificationRequired', "Verify Your Email Address")}
                subtitle={t('authRegisterSuccess', "Registration Successful!")}
            />
        </div>
    )
}

export default Register