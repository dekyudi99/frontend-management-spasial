import React, { useState } from "react";
import { Modal, Form, Input, Button, message } from "antd";
import keyApi from "../api/KeyApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import ShowApiKeyModal from "./ShowApiKeyModal";

const ApiKeyModal = ({ id, open, onClose }) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [generatedApiKey, setGeneratedApiKey] = useState("");

  const createApiKey = useMutation({
    mutationFn: (data) => keyApi.create(id, data),
    onSuccess: (response) => {
      message.success("API Key berhasil dibuat!");

      const newKey = response?.data?.api_key || response?.data?.data?.api_key;
      setGeneratedApiKey(newKey);

      form.resetFields();
      queryClient.invalidateQueries({
        queryKey: ["api-key", id]
      });

      onClose(); 
      setShowKeyModal(true);
    },
    onError: (error) => {
      message.error(error.response?.data?.detail || "Gagal membuat API Key!");
    }
  });

  const onFinish = (values) => {
    createApiKey.mutate({
      name: values.name,
    });
  };

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        title="Create API Key"
      >
        <Form
          layout="vertical"
          form={form}
          onFinish={onFinish}
        >
          <Form.Item
            label="Name"
            name="name"
            rules={[{ required: true, message: "Nama API Key wajib diisi!" }]}
          >
            <Input placeholder="Contoh: Production Key" />
          </Form.Item>

          <Button
            htmlType="submit"
            type="primary"
            block
            loading={createApiKey.isPending}
          >
            Create API Key
          </Button>
        </Form>
      </Modal>

      <ShowApiKeyModal
        show={showKeyModal}
        onHide={() => setShowKeyModal(false)}
        apiKey={generatedApiKey}
      />
    </>
  );
};

export default ApiKeyModal;