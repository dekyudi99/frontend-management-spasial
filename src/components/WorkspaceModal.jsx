import { Modal, Form, Input, Button, message } from "antd";
import workspaceApi from "../api/WorkspaceApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const WorkspaceModal = ({ id, open, onClose }) => {
  const [form] = Form.useForm()
  const queryClient = useQueryClient()

  const createWorkspace = useMutation({
    mutationFn: (data) => workspaceApi.create(id, data),
    onSuccess: (response) => {
      message.success(response?.data?.detail);

      form.resetFields();
      queryClient.invalidateQueries({
        queryKey: ["workspaces", id]
      });

      onClose(); 
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || "Failed to create Workspace!");
    }
  });

  const onFinish = (values) => {
    createWorkspace.mutate({
      name_workspace: values.name,
    });
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title="Create Workspace"
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Workspace name is required!" }]}
          >
            <Input placeholder="Contoh: Flood" />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            block
            loading={createWorkspace.isPending}
          >
            Create Workspace
          </Button>
        </Form>
      </Modal>
    </>
  );
};

export default WorkspaceModal;