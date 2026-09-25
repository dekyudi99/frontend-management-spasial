import React, { useState, useEffect } from 'react'
import { Button, Form, Input, message, ConfigProvider } from 'antd'
import { useMutation } from '@tanstack/react-query'
import authApi from '../../api/AuthApi'
import { useNavigate, Link } from 'react-router-dom'
import OtpVerificationModal from '../../components/auth/OtpVerificationModal'

const appName = import.meta.env.VITE_APP_NAME

const Register = () => {
    useEffect(() => {
        document.title = `Register | ${appName}`
    }, [])

    const navigate = useNavigate()

    // State untuk Modal Verifikasi OTP setelah Register
    const [isOtpModalOpen, setIsOtpModalOpen] = useState(false)
    const [registeredEmail, setRegisteredEmail] = useState('')

    // Mutation Register
    const registerMutation = useMutation({
        mutationFn: authApi.register,
        onSuccess: (response) => {
            const data = response?.data
            message.success(data?.detail || "Registration successful! An OTP code has been sent to your email.")
            setIsOtpModalOpen(true)
        },
        onError: (error) => {
            message.error(error.response?.data?.detail || "An error occurred during registration.")
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
            <h1 className='text-white font-bold text-xl sm:text-2xl mb-1'>Create an Account</h1>
            <p className='text-slate-300 text-xs sm:text-sm text-center mb-4'>Join AstraGIS to publish and analyze spatial data</p>

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
                        className='w-full mb-3'
                    >
                        <Input placeholder="Enter username" size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <Form.Item
                        name={"email"}
                        label={<span className='text-xs sm:text-sm text-white'>Email Address</span>}
                        rules={[
                            { required: true, message: "Please enter your email" },
                            { type: 'email', message: "Please enter a valid email address" }
                        ]}
                        className='w-full mb-3'
                    >
                        <Input placeholder="name@example.com" size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        label={<span className='text-xs sm:text-sm text-white'>Password</span>}
                        rules={[
                            { required: true, message: 'Please enter a password' },
                            { min: 8, message: "Password must be at least 8 characters" }
                        ]}
                        className='w-full mb-3'
                    >
                        <Input.Password placeholder="Min 8 characters" size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        label={<span className='text-xs sm:text-sm text-white'>Confirm Password</span>}
                        dependencies={['password']}
                        className='w-full mb-4'
                        rules={[
                            { required: true, message: 'Please confirm your password' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve()
                                    }
                                    return Promise.reject(new Error('The two passwords do not match!'))
                                },
                            }),
                            { min: 8, message: "Password must be at least 8 characters" }
                        ]}
                    >
                        <Input.Password placeholder="Repeat your password" size="large" className='rounded-lg text-sm sm:text-base' />
                    </Form.Item>

                    <p className='text-slate-300 text-xs sm:text-sm mb-4'>
                        Already have an account? <Link to={"/auth/login"} className='text-teal-400 hover:text-teal-300 font-medium'>Login</Link>
                    </p>

                    <Button
                        htmlType="submit"
                        type="primary"
                        size="large"
                        loading={registerMutation.isPending}
                        className='w-full bg-teal-600 hover:bg-teal-500 font-semibold h-11 rounded-lg text-sm sm:text-base'
                    >
                        Register
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
                title="Verify Your Email Address"
                subtitle="Registration Successful!"
            />
        </div>
    )
}

export default Register