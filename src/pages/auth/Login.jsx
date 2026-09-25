import React, { useState, useEffect } from 'react'
import { Button, Form, Input, message, ConfigProvider } from 'antd'
import { useMutation } from '@tanstack/react-query'
import authApi from '../../api/AuthApi'
import { useNavigate, Link } from 'react-router-dom'
import OtpVerificationModal from '../../components/auth/OtpVerificationModal'

const appName = import.meta.env.VITE_APP_NAME

const Login = () => {
    useEffect(() => {
        document.title = `Login | ${appName}`
    }, [])

    const navigate = useNavigate()

    // State untuk Modal Verifikasi OTP
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
    const [unverifiedEmail, setUnverifiedEmail] = useState('')

    // Mutation Login Utama
    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: (response) => {
            const data = response?.data
            message.success(data?.detail || "Login successful!")
            localStorage.setItem("JWT_TOKEN", data?.access_token)
            navigate('/dashboard')
        },
        onError: (error) => {
            const errorData = error.response?.data
            // Jika akun belum diverifikasi, backend mengembalikan requires_verification: true
            if (errorData?.requires_verification) {
                setUnverifiedEmail(errorData?.email || '')
                setIsOtpModalOpen(true)
                message.warning(errorData?.detail || "Your account is not verified. An OTP code has been sent to your email.")
            } else {
                message.error(errorData?.detail || "Username or password is incorrect.")
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
            <h1 className='text-white font-bold text-xl sm:text-2xl mb-1'>Welcome Back</h1>
            <p className='text-slate-300 text-xs sm:text-sm text-center mb-4'>Enter your credentials to access your spatial workspace</p>

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
                        label={<span className='text-xs sm:text-sm text-white'>Username</span>}
                        rules={[{ required: true, message: "Please enter your username" }]}
                        className='w-full mb-3 sm:mb-4'
                    >
                        <Input placeholder="Enter username" size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={<span className='text-xs sm:text-sm text-white'>Password</span>}
                        rules={[
                            { required: true, message: 'Please enter your password' },
                            { min: 8, message: "Password must be at least 8 characters" }
                        ]}
                        className='w-full mb-2'
                    >
                        <Input.Password placeholder="Enter password" size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <div className='flex flex-wrap justify-between items-center w-full gap-2 mb-5 text-xs sm:text-sm'>
                        <span className='text-slate-300'>
                            Don't have an account? <Link to={"/auth/register"} className='text-teal-400 hover:text-teal-300 font-medium'>Register</Link>
                        </span>
                        <Link to={"/auth/forgot-password"} className='text-teal-400 hover:text-teal-300 font-medium'>
                            Forgot Password?
                        </Link>
                    </div>

                    <Button
                        htmlType="submit"
                        type="primary"
                        size="large"
                        loading={loginMutation.isPending}
                        className='w-full bg-teal-600 hover:bg-teal-500 font-semibold h-11 rounded-lg text-sm sm:text-base'
                    >
                        Login
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
                title="Account Verification Required"
                subtitle="Your account is not yet active"
            />
        </div>
    )
}

export default Login