import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message, Tag } from "antd";
import { Layers, Folder, GripVertical, CheckCircle2, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import layerGroupApi from "../../api/LayerGroupApi";

const LayerGroupModal = ({
  open,
  onClose,
  selectedLayerIds = [],
  allLayers = [],
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const [orderedIds, setOrderedIds] = useState(selectedLayerIds);

  // Sinkronkan urutan layer saat modal terbuka
  useEffect(() => {
    if (open) {
      setOrderedIds(selectedLayerIds);

      // Cek workspace dari layer yang dipilih
      const chosenLayers = allLayers.filter((l) => selectedLayerIds.includes(l.id));
      if (chosenLayers.length > 0) {
        const firstWsId = chosenLayers[0].workspace_id;
        form.setFieldValue("workspace_id", String(firstWsId));
      }
    }
  }, [open, selectedLayerIds, allLayers, form]);

  // List layer yang dipilih dan diurutkan
  const chosenLayers = orderedIds
    .map((id) => allLayers.find((l) => l.id === id))
    .filter(Boolean);

  // Auto-generate technical name saat Title diisi
  const handleTitleChange = (e) => {
    const titleVal = e.target.value;
    const autoName = "lg_" + titleVal
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 40);
    form.setFieldValue("name", autoName);
  };

  // Mutation create layer group
  const createMutation = useMutation({
    mutationFn: (payload) => layerGroupApi.create(payload),
    onSuccess: (res) => {
      message.success(res?.data?.detail || "Layer Group created successfully!");
      queryClient.invalidateQueries({ queryKey: ["layer-groups"] });
      queryClient.invalidateQueries({ queryKey: ["layers"] });
      onClose();
      form.resetFields();
      if (onSuccess) onSuccess(res?.data?.data);
    },
    onError: (err) => {
      message.error(err?.response?.data?.detail || "Failed to create Layer Group!");
    },
  });

  const onFinish = (values) => {
    if (orderedIds.length === 0) {
      message.warning("Select at least 1 layer to create a Layer Group!");
      return;
    }

    const payload = {
      workspace_id: String(values.workspace_id),
      name: values.name,
      title: values.title,
      abstract_text: values.abstract_text || "",
      mode: values.mode || "single",
      layer_ids: orderedIds, // diurutkan dari bawah ke atas
      keywords: values.keywords ? values.keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
    };

    createMutation.mutate(payload);
  };

  // Hapus layer dari grup pilihan
  const handleRemoveLayer = (idToRemove) => {
    setOrderedIds((prev) => prev.filter((id) => id !== idToRemove));
  };

  // Pindahkan urutan layer naik/turun
  const moveLayer = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= orderedIds.length) return;
    const newArr = [...orderedIds];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setOrderedIds(newArr);
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        onClose();
        form.resetFields();
      }}
      footer={null}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Create New Layer Group</h3>
            <p className="text-xs text-slate-400 font-normal">
              Combine multiple GeoServer layers into a unified WMS visual
            </p>
          </div>
        </div>
      }
      width={540}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="mt-4">
        {/* Workspace info / select */}
        <Form.Item
          label={<span className="text-xs font-semibold text-slate-700">Target Workspace</span>}
          name="workspace_id"
          rules={[{ required: true, message: "Workspace is required!" }]}
        >
          <Select placeholder="Select Workspace">
            {Array.from(new Set(allLayers.map((l) => l.workspace_id))).map((wsId) => {
              const wsLayer = allLayers.find((l) => l.workspace_id === wsId);
              return (
                <Select.Option key={wsId} value={String(wsId)}>
                  {wsLayer?.workspace_display_name || wsLayer?.workspace_name || `Workspace ID: ${wsId}`}
                </Select.Option>
              );
            })}
          </Select>
        </Form.Item>

        {/* Display Title */}
        <Form.Item
          label={<span className="text-xs font-semibold text-slate-700">Layer Group Title (Display Title)</span>}
          name="title"
          rules={[{ required: true, message: "Layer Group Title is required!" }]}
        >
          <Input
            placeholder="e.g.: Flood Risk Analysis & Contours"
            onChange={handleTitleChange}
          />
        </Form.Item>

        {/* GeoServer Technical Name */}
        <Form.Item
          label={
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>GeoServer Technical Name (WMS Machine Name)</span>
              <span className="text-[10px] text-slate-400 font-normal">(automatic)</span>
            </span>
          }
          name="name"
          rules={[
            { required: true, message: "Technical name is required!" },
            { pattern: /^[a-zA-Z0-9_-]+$/, message: "Only letters, numbers, underscore (_), or dash (-) allowed" },
          ]}
        >
          <Input placeholder="e.g.: lg_flood_risk" />
        </Form.Item>

        {/* Member Layers List (Rendering Order) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              Member Layers ({chosenLayers.length})
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl p-2 bg-slate-50/60 max-h-[180px] overflow-y-auto space-y-1.5">
            {chosenLayers.length === 0 ? (
              <p className="text-xs text-center py-4 text-slate-400">
                No layers selected yet. Check layers in the list first.
              </p>
            ) : (
              chosenLayers.map((l, idx) => (
                <div
                  key={l.id}
                  className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/80 text-xs shadow-2xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-slate-400 w-5">#{idx + 1}</span>
                    <span className="font-medium text-slate-800 truncate max-w-[200px] sm:max-w-[260px]">
                      {l.layer_name}
                    </span>
                    <Tag color="blue" className="!text-[10px] !m-0">
                      {l.workspace_display_name || l.workspace_name}
                    </Tag>
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Move Up */}
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveLayer(idx, -1)}
                      className="px-1.5 py-0.5 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                      title="Move up"
                    >
                      ▲
                    </button>
                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={idx === chosenLayers.length - 1}
                      onClick={() => moveLayer(idx, 1)}
                      className="px-1.5 py-0.5 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                      title="Move down"
                    >
                      ▼
                    </button>
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLayer(l.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Remove from group"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* WMS Mode */}
        <Form.Item
          label={<span className="text-xs font-semibold text-slate-700">GeoServer WMS Mode</span>}
          name="mode"
          initialValue="single"
        >
          <Select>
            <Select.Option value="single">Single (Single Combined WMS Layer - Recommended)</Select.Option>
            <Select.Option value="named">Named (Group with visible sublayers)</Select.Option>
            <Select.Option value="container">Container (Structural grouping)</Select.Option>
          </Select>
        </Form.Item>

        {/* Description */}
        <Form.Item
          label={<span className="text-xs font-semibold text-slate-700">Description / Abstract (Optional)</span>}
          name="abstract_text"
        >
          <Input.TextArea rows={2} placeholder="Description about the layer group..." />
        </Form.Item>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button onClick={onClose}>Cancel</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={createMutation.isPending}
            disabled={chosenLayers.length === 0}
            className="!bg-blue-600 hover:!bg-blue-500"
          >
            Save Layer Group
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default LayerGroupModal;
