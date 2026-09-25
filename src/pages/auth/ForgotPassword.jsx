import React, { useState, useEffect } from 'react'
import { Button, Form, Input, message, ConfigProvider } from 'antd'
import { useMutation } from '@tanstack/react-query'
import authApi from '../../api/AuthApi'
import { useNavigate, Link } from 'react-router-dom'

const appName = import.meta.env.VITE_APP_NAME

const ForgotPassword = () => {
    useEffect(() => {
        document.title = `Forgot Password | ${appName}`
    }, [])

    const navigate = useNavigate()
    const [step, setStep] = useState(1) // 1: Input Email, 2: Input OTP & New Password
    const [email, setEmail] = useState('')
    const [countdown, setCountdown] = useState(0)

    useEffect(() => {
        let timer
        if (countdown > 0) {
            timer = setTimeout(() => setCountdown(countdown - 1), 1000)
        }
        return () => clearTimeout(timer)
    }, [countdown])

    // Mutation 1: Kirim OTP Reset Password
    const sendOtpMutation = useMutation({
        mutationFn: authApi.sendForgotPasswordOtp,
        onSuccess: (response) => {
            message.success(response?.data?.detail || "OTP code has been sent to your email!")
            setStep(2)
            setCountdown(60) // Cooldown 60 detik sebelum kirim ulang
        },
        onError: (error) => {
            message.error(error.response?.data?.detail || "Failed to send OTP code")
        }
    })

    // Mutation 2: Verifikasi OTP & Simpan Password Baru
    const resetPasswordMutation = useMutation({
        mutationFn: authApi.resetPassword,
        onSuccess: (response) => {
            message.success(response?.data?.detail || "Password has been successfully updated! Please log in.")
            navigate('/auth/login')
        },
        onError: (error) => {
            message.error(error.response?.data?.detail || "Failed to reset password")
        }
    })

    const onSendOtp = (values) => {
        const formData = new FormData()
        formData.append('email', values.email)
        setEmail(values.email)
        sendOtpMutation.mutate(formData)
    }

    const onResendOtp = () => {
        if (countdown > 0) return
        const formData = new FormData()
        formData.append('email', email)
        sendOtpMutation.mutate(formData)
    }

    const onResetPassword = (values) => {
        const formData = new FormData()
        formData.append('email', email)
        formData.append('otp', values.otp)
        formData.append('new_password', values.new_password)
        resetPasswordMutation.mutate(formData)
    }

    return (
        <div className='flex flex-col justify-center items-center gap-2 m-4 w-full'>
            <h1 className='text-white font-bold text-2xl'>Reset Password</h1>
            <p className='text-slate-300 text-sm text-center max-w-md'>
                {step === 1 
                    ? "Enter your registered email address and we'll send you an OTP code to reset your password."
                    : `Enter the 6-digit OTP code sent to ${email} along with your new password.`
                }
            </p>

            <ConfigProvider
                theme={{
                    components: {
                        Form: {
                            labelColor: '#ffffff'
                        },
                    },
                }}
            >
                {step === 1 ? (
                    <Form
                        layout='vertical'
                        onFinish={onSendOtp}
                        className='flex flex-col justify-center items-start w-full max-w-md mt-2'
                    >
                        <Form.Item
                            name="email"
                            label="Email Address"
                            rules={[
                                { required: true, message: "Please input your email" },
                                { type: 'email', message: "Please enter a valid email address" }
                            ]}
                            className='w-full'
                        >
                            <Input placeholder="name@example.com" size="large" />
                        </Form.Item>

                        <div className='flex justify-between items-center w-full mb-4'>
                            <Link to="/auth/login" className='text-teal-400 hover:text-teal-300 text-sm'>
                                ← Back to Login
                            </Link>
                        </div>

                        <Button
                            htmlType="submit"
                            type="primary"
                            size="large"
                            loading={sendOtpMutation.isPending}
                            className='w-full bg-teal-600 hover:bg-teal-500'
                        >
                            Send OTP Code
                        </Button>
                    </Form>
                ) : (
                    <Form
                        layout='vertical'
                        onFinish={onResetPassword}
                        className='flex flex-col justify-center items-start w-full max-w-md mt-2'
                    >
                        <Form.Item
                            name="otp"
                            label="6-Digit OTP Code"
                            rules={[
                                { required: true, message: "Please input the 6-digit OTP" },
                                { len: 6, message: "OTP must be exactly 6 digits" }
                            ]}
                            className='w-full'
                        >
                            <Input 
                                placeholder="123456" 
                                size="large" 
                                maxLength={6} 
                                className='tracking-widest text-center font-mono text-xl'
                            />
                        </Form.Item>

                        <Form.Item
                            name="new_password"
                            label="New Password"
                            rules={[
                                { required: true, message: 'Please input your new password' },
                                { min: 8, message: "Password must be at least 8 characters" }
                            ]}
                            className='w-full'
                        >
                            <Input.Password size="large" placeholder="Minimum 8 characters" />
                        </Form.Item>

                        <Form.Item
                            name="confirm_password"
                            label="Confirm New Password"
                            dependencies={['new_password']}
                            className='w-full'
                            rules={[
                                { required: true, message: 'Please confirm your new password' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('new_password') === value) {
                                            return Promise.resolve()
                                        }
                                        return Promise.reject(new Error('The two passwords do not match!'))
                                    },
                                }),
                            ]}
                        >
                            <Input.Password size="large" placeholder="Repeat your new password" />
                        </Form.Item>

                        <div className='flex justify-between items-center w-full mb-4'>
                            <button
                                type="button"
                                onClick={onResendOtp}
                                disabled={countdown > 0 || sendOtpMutation.isPending}
                                className={`text-sm ${countdown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-teal-400 hover:text-teal-300 underline cursor-pointer'}`}
                            >
                                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP Code'}
                            </button>
                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className='text-sm text-slate-300 hover:text-white cursor-pointer'
                            >
                                Change Email
                            </button>
                        </div>

                        <Button
                            htmlType="submit"
                            type="primary"
                            size="large"
                            loading={resetPasswordMutation.isPending}
                            className='w-full bg-teal-600 hover:bg-teal-500'
                        >
                            Update Password
                        </Button>
                    </Form>
                )}
            </ConfigProvider>
        </div>
    )
}

export default ForgotPassword
