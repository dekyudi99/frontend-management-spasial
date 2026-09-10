import React from 'react'
import { useEffect } from 'react'
import { Button, Form, Input, message, ConfigProvider } from 'antd'
import { useMutation } from '@tanstack/react-query'
import authApi from '../../api/AuthApi'
import { useNavigate } from 'react-router-dom'
import { Link } from 'react-router-dom'

const appName = import.meta.env.VITE_APP_NAME

const Register = () => {
    useEffect(()=>{
        document.title = `Register | ${appName}`
    },[])

    const navigate = useNavigate()

    const registerMutation = useMutation({
        mutationFn: authApi.register,
        onSuccess: (response) => {
            const apiMess = response?.data?.detail
            message.success(apiMess)
            navigate('/auth/login')
        },
        onError: (error) => {
            message.error(error.response?.data?.detail || "An error occurred")
        }
    })

    const onFinish = (values) => {
        const formData = new FormData()

        formData.append('username', values.username)
        formData.append('email', values.email)
        formData.append('password', values.password)

        registerMutation.mutate(formData)
    }
  return (
    <div className='flex flex-col justify-center items-center gap-2 m-4 w-full'>
        <h1 className='text-white font-bold text-2xl'>Register</h1>
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
                    name={"email"}
                    label="Email"
                    rules={[
                        {required: true, message: "Insert Email"},
                        {type: 'email', message: "Your email is not valid"}
                    ]}
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

                <Form.Item
                    name="confirmPassword"
                    label="Confirm Password"
                    dependencies={['password']}
                    className='w-full'
                    rules={[
                        { required: true, message: 'Confirm Password' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) {
                                    return Promise.resolve()
                                }
                                return Promise.reject(new Error('The two passwords do not match!'))
                            },
                        }),
                        { min: 8, message: "Password Minimum 8 Characters"}
                    ]}
                >
                    <Input.Password />
                </Form.Item>

                <p className='text-white'>Already have an account? <Link to={"/auth/login"}>Login</Link></p>

                <Button
                    htmlType="submit"
                    type="primary"
                    loading={registerMutation.isPending}
                    className={`w-full`}
                >
                    Submit
                </Button>
            </Form>
        </ConfigProvider>
    </div>
  )
}

export default Register