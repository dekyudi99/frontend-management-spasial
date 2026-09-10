import {useEffect} from "react";

import { Modal, Form, Input, Button, message } from "antd";

import projectApi from "../api/ProjectApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const ProjectModal = ({ open, onClose, mode, project })=>{
    const [form]=Form.useForm()
    const queryClient = useQueryClient()
    
    const createProject = useMutation({
        mutationFn: projectApi.create,
        onSuccess: (response) => {
            message.success(response.data.detail);

            form.resetFields();

            onClose();

            queryClient.invalidateQueries({
                queryKey: ["project"]
            });
        },
        onError: (error) => {
            message.error(error.response?.data?.detail || "Something went wrong!")
        }
    })

    const updateProject = useMutation({
        mutationFn: ({id,data}) =>
            projectApi.update(id,data),

        onSuccess: (_, variables) => {
            message.success("Project updated successfully");
            onClose();

            form.resetFields();

            queryClient.invalidateQueries({
                queryKey: ["project"],
            });

            queryClient.invalidateQueries({
                queryKey: ["project", variables.id],
            });
        },
        onError: (error) => {
            message.error(error.response?.data?.detail || "Failed update project!");
        }
    });

    useEffect(()=>{
        if(mode==="edit" && project){
            form.setFieldsValue({
                project_name:project.project_name,
                description:project.description
            });
        }else{
            form.resetFields();
        }
    },[project,mode]);

    const onFinish = (values) => {
        if (mode=="create") {
            createProject.mutate({
                project_name: values.project_name,
                description: values.description
            })
        } else {
            updateProject.mutate({
                id: project.id,
                data: {
                    project_name: values.project_name,
                    description: values.description
                }
            })
        }
    }

    return(
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={
                mode==="create"
                ?
                "Create Project"
                :
                "Edit Project"
            }
        >
            <Form
                layout="vertical"
                form={form}
                onFinish={onFinish}
            >
                <Form.Item
                    label="Project Name"
                    name="project_name"
                    rules={[{required:true}]}
                >
                    <Input/>
                </Form.Item>

                <Form.Item
                    label="Description"
                    name="description"
                >
                    <Input.TextArea rows={4}/>
                </Form.Item>

                <Button
                    htmlType="submit"
                    type="primary"
                    block
                >
                    {
                        mode==="create"
                        ?
                        "Create Project"
                        :
                        "Update Project"
                    }
                </Button>
            </Form>
        </Modal>
    )
}

export default ProjectModal;