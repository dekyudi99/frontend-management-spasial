import React from "react";
import { Modal, Button, message, Typography } from "antd";
import { CopyOutlined } from "@ant-design/icons";

const { Text } = Typography;

const ShowApiKeyModal = ({ show, onHide, apiKey }) => {

  const handleCopy = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey);
    message.success("API Key berhasil dicopy ke clipboard!");
  };

  return (
    <Modal
      open={show}
      onCancel={onHide}
      footer={null}
      title="API Key Berhasil Dibuat"
      closable={false}
      maskClosable={false}
    >
      <div className="space-y-4 text-center">
        <p className="text-amber-600 bg-amber-50 p-2.5 rounded border border-amber-200 text-sm font-medium">
          ⚠️ Perhatian! API Key ini <b>hanya ditampilkan sekali</b>. Silakan simpan key ini dengan aman!
        </p>

        <div className="bg-slate-100 p-3 rounded-lg border font-mono text-sm break-all flex items-center justify-between gap-2">
          <Text copyable={{ text: apiKey }} className="font-mono text-blue-600 font-bold">
            {apiKey || "Key tidak ditemukan"}
          </Text>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            icon={<CopyOutlined />} 
            onClick={handleCopy}
            className="flex-1"
          >
            Copy Key
          </Button>

          <Button
            type="primary"
            className="flex-1"
            onClick={() => {
              onHide();
            }}
          >
            Finish
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ShowApiKeyModal;