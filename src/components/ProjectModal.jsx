import { useEffect } from "react";
import { Modal, Form, Input, Select, Button, message } from "antd";
import { LockOutlined, GlobalOutlined } from "@ant-design/icons";
import projectApi from "../api/ProjectApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../context/LanguageContext";

const ProjectModal = ({ open, onClose, mode, project }) => {
    const { t } = useLanguage();
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    
    const createProject = useMutation({
        mutationFn: projectApi.create,
        onSuccess: (response) => {
            message.success(response.data.detail);
            form.resetFields();
            onClose();
            queryClient.invalidateQueries({ queryKey: ["project"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-projects"] });
        },
        onError: (error) => {
            message.error(error.response?.data?.detail || t("projectCreateFailed", "Something went wrong!"));
        }
    });

    const updateProject = useMutation({
        mutationFn: ({ id, data }) => projectApi.update(id, data),
        onSuccess: (_, variables) => {
            message.success(t("projectUpdateSuccess", "Project updated successfully"));
            onClose();
            form.resetFields();
            queryClient.invalidateQueries({ queryKey: ["project"] });
            queryClient.invalidateQueries({ queryKey: ["project", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["projectLogs", variables.id] });
            queryClient.invalidateQueries({ queryKey: ["dashboard-projects"] });
        },
        onError: (error) => {
            message.error(error.response?.data?.detail || t("projectUpdateFailed", "Failed to update project!"));
        }
    });

    useEffect(() => {
        if (open) {
            if (mode === "edit" && project) {
                form.setFieldsValue({
                    project_name: project.project_name,
                    description: project.description,
                    visibility: project.visibility || "private"
                });
            } else {
                form.resetFields();
                form.setFieldsValue({ visibility: "private" });
            }
        }
    }, [open, project, mode, form]);

    const onFinish = (values) => {
        if (mode === "create") {
            createProject.mutate({
                project_name: values.project_name,
                description: values.description || "",
                visibility: values.visibility || "private"
            });
        } else {
            updateProject.mutate({
                id: project.id,
                data: {
                    project_name: values.project_name,
                    description: values.description || "",
                    visibility: values.visibility || "private"
                }
            });
        }
    };

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            title={mode === "create" ? t("createProject", "Create Project") : t("editProject", "Edit Project")}
        >
            <Form
                layout="vertical"
                form={form}
                initialValues={{ visibility: "private" }}
                onFinish={onFinish}
            >
                <Form.Item
                    label={t("projectName", "Project Name")}
                    name="project_name"
                    rules={[{ required: true, message: t("projectNameRequired", "Project name is required!") }]}
                >
                    <Input placeholder={t("projectNamePlaceholder", "e.g. Mangrove Analysis")} />
                </Form.Item>

                <Form.Item
                    label={t("description", "Description")}
                    name="description"
                >
                    <Input.TextArea rows={3} placeholder={t("projectDescPlaceholder", "Brief description of the project...")} />
                </Form.Item>

                <Form.Item
                    label={t("visibility", "Visibility")}
                    name="visibility"
                    extra={t("visibilityHelp", "Public projects and their public workspaces can be viewed by anyone on the community Hub.")}
                >
                    <Select>
                        <Select.Option value="private">
                            <span className="flex items-center gap-2">
                                <LockOutlined className="text-slate-400" />
                                <span>{t("visibilityPrivate", "Private")}</span>
                                <span className="text-xs text-slate-400">({t("visibilityPrivateDesc", "Only you can access")})</span>
                            </span>
                        </Select.Option>
                        <Select.Option value="public">
                            <span className="flex items-center gap-2">
                                <GlobalOutlined className="text-emerald-500" />
                                <span className="font-medium text-emerald-700">{t("visibilityPublic", "Public")}</span>
                                <span className="text-xs text-slate-400">({t("visibilityPublicDesc", "Visible in Public Hub")})</span>
                            </span>
                        </Select.Option>
                    </Select>
                </Form.Item>

                <Button
                    htmlType="submit"
                    type="primary"
                    block
                    loading={createProject.isPending || updateProject.isPending}
                    className="mt-2"
                >
                    {mode === "create" ? t("createProject", "Create Project") : t("updateProject", "Update Project")}
                </Button>
            </Form>
        </Modal>
    );
};

export default ProjectModal;