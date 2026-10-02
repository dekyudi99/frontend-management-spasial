import { Modal, Form, Input, Button, message } from "antd";
import workspaceApi from "../api/WorkspaceApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "../context/LanguageContext";

const WorkspaceModal = ({ id, open, onClose }) => {
  const { t } = useLanguage();
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const createWorkspace = useMutation({
    mutationFn: (data) => workspaceApi.create(data),
    onSuccess: (response) => {
      message.success(response?.data?.detail || t("workspaceCreateSuccess", "Workspace created successfully!"));

      form.resetFields();
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces-list"] });
      queryClient.invalidateQueries({ queryKey: ["user-workspaces"] });

      onClose(); 
    },
    onError: (error) => {
      message.error(error?.message || error?.response?.data?.detail || t("workspaceCreateFailed", "Failed to create Workspace!"));
    }
  });

  const onFinish = (values) => {
    createWorkspace.mutate({
      display_name: values.name,
      name_workspace: values.name,
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={t("createWorkspace", "Create Workspace")}
    >
      <Form
        layout="vertical"
        form={form}
        onFinish={onFinish}
      >
        <Form.Item
          label={t("workspaceName", "Workspace Name")}
          name="name"
          rules={[{ required: true, message: t("workspaceNameRequired", "Workspace name is required!") }]}
        >
          <Input placeholder={t("workspaceNamePlaceholder", "e.g. Mangrove Analysis 2026")} />
        </Form.Item>

        <Button
          htmlType="submit"
          type="primary"
          block
          loading={createWorkspace.isPending}
          className="mt-2"
        >
          {t("createWorkspaceBtn", "Create Workspace")}
        </Button>
      </Form>
    </Modal>
  );
};

export default WorkspaceModal;