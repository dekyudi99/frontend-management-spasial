import { useEffect } from 'react'
import { Card, Form, Input, Space, Button, message } from 'antd'
import { DeleteOutlined } from '@ant-design/icons'
import projectApi from '../../api/ProjectApi'
import { useMutation, useQueryClient } from '@tanstack/react-query'

const appName = import.meta.env.VITE_APP_NAME

const Settings = ({ id, projectName, description }) => {
    useEffect(()=>{
        document.title = `Detail Project | ${appName}`
    },[])

    const [form] = Form.useForm()
    const queryClient = useQueryClient()

    const updateProject = useMutation({
        mutationFn: ({ id, data }) => projectApi.update(id, data),
        onSuccess: (response) => {
            message.success(response?.data?.detail)

            queryClient.invalidateQueries({
                queryKey: ["project"]
            })
        },
        onError: (err) => {
            message.error(err?.response?.data?.detail)
        }
    })

    useEffect(()=>{
        if (projectName || description) {
            form.setFieldsValue({
                project_name: projectName,
                description: description
            })
        }
    },[projectName, description, form])

    const onFinish = (values) => {
        updateProject.mutate({
            id: id,
            data: {
                project_name: values.project_name,
                description: values.description
            }
        })
    }

  return (
    <>
        <Card>
            <Form
                layout="vertical"
                form={form}
                onFinish={onFinish}
            >
                <Form.Item
                    label="Project Name"
                    name="project_name"
                >
                    <Input/>
                </Form.Item>
                <Form.Item
                    label="Description"
                    name="description"
                >
                    <Input.TextArea
                        rows={4}
                    />
                </Form.Item>
                <Space>
                    <Button
                        type="primary"
                        htmlType='submit'
                    >
                        Update Project
                    </Button>
                    <Button
                        danger
                        icon={<DeleteOutlined/>}
                        loading={updateProject.isPending}
                    >
                        Delete Project
                    </Button>
                </Space>
            </Form>
        </Card>
    </>
  )
}

export default Settings