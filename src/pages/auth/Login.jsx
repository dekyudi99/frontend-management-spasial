import React from 'react'
import { useEffect } from 'react'
import { Button, Form, Input, message, ConfigProvider } from 'antd'
import { useMutation } from '@tanstack/react-query'
import authApi from '../../api/AuthApi'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

const appName = import.meta.env.VITE_APP_NAME

const Login = () => {
    useEffect(()=>{
        document.title = `Login | ${appName}`
    },[])

    const navigate = useNavigate()

    const loginMutation = useMutation({
        mutationFn: authApi.login,
        onSuccess: (response) => {
            const data = response?.data
            message.success(data?.detail)
            localStorage.setItem("JWT_TOKEN", data?.access_token)
            navigate('/dashboard')
        },
        onError: (error) => {
            message.error(error.response?.data?.detail || "An error occurred")
        }
    })

    const onFinish = (values) => {
        const formData = new FormData()

        formData.append('username', values.username)
        formData.append('password', values.password)

        loginMutation.mutate(formData)
    }
  return (
    <div className='flex flex-col justify-center items-center gap-2 m-4 w-full'>
        <h1 className='text-white font-bold text-2xl'>Login</h1>
        <ConfigProvider
            theme={{
                components: {
                    Form: {
                        labelColor: '#ffffff'
                    },
                },
            }}
        >
            <Form layout='vertical' onFinish={onFinish} className='flex flex-col justify-center items-start w-full  max-w-md'>
                <Form.Item
                    name={"username"}
                    label="Username"
                    rules={[{required: true, message: "Insert Username"}]}
                    className='w-full'
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="password"
                    label="Password"
                    rules={[
                        { required: true, message: 'Insert Password' },
                        { min: 8, message: "Password Minimum 8 Characters"}
                    ]}
                    className='w-full'
                >
                    <Input.Password />
                </Form.Item>

                <p className='text-white'>Don't have an account? <Link to={"/auth/register"}>Register</Link></p>

                <Button
                    htmlType="submit"
                    type="primary"
                    loading={loginMutation.isPending}
                    className={`w-full`}
                >
                    Submit
                </Button>
            </Form>
        </ConfigProvider>
    </div>
  )
}

export default Login