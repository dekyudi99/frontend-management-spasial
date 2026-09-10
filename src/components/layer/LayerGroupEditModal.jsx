import React, { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Button, message, Tag, Spin, Empty } from "antd";
import { Layers, X, Plus, GripVertical, AlertCircle, CheckSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import layerApi from "../../api/LayerApi";
import layerGroupApi from "../../api/LayerGroupApi";

const LayerGroupEditModal = ({
  open,
  groupId,
  allLayers = [],
  onClose,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // State urutan layer anggota di dalam grup
  const [memberLayers, setMemberLayers] = useState([]);
  const [selectedLayersToAdd, setSelectedLayersToAdd] = useState([]);

  // Fetch detail group saat modal terbuka
  const { data: detailResponse, isLoading: isLoadingDetail } = useQuery({
    queryKey: ["layer-group-detail", groupId],
    queryFn: () => layerGroupApi.getById(groupId),
    enabled: open && Boolean(groupId),
  });

  const groupData = detailResponse?.data?.data;

  // Fetch semua layer yang ada di workspace layer group ini (agar tidak terbatas pagination)
  const { data: wsLayersResponse, isLoading: isLoadingWsLayers } = useQuery({
    queryKey: ["workspace-all-layers", groupData?.workspace_id],
    queryFn: () => layerApi.list({ workspace_id: groupData.workspace_id, size: 100 }),
    enabled: open && Boolean(groupData?.workspace_id),
  });

  const wsLayers = wsLayersResponse?.data?.data || [];
  const availableSourcePool = wsLayers.length > 0 ? wsLayers : allLayers;

  // Reset selectedLayersToAdd saat modal dibuka/tutup
  useEffect(() => {
    if (!open) {
      setSelectedLayersToAdd([]);
    }
  }, [open]);

  // Isi form saat detail data berhasil diambil
  useEffect(() => {
    if (groupData) {
      form.setFieldsValue({
        title: groupData.title,
        abstract_text: groupData.abstract_text,
        mode: groupData.mode || "single",
      });

      // Sinkronkan daftar layer anggota
      if (Array.isArray(groupData.layers)) {
        setMemberLayers(groupData.layers);
      }
    }
  }, [groupData, form]);

  // Mutation update layer group
  const updateMutation = useMutation({
    mutationFn: (payload) => layerGroupApi.update(groupId, payload),
    onSuccess: (res) => {
      message.success(res?.data?.detail || "Layer Group updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["layer-groups"] });
      queryClient.invalidateQueries({ queryKey: ["layer-group-detail", groupId] });
      onClose();
      if (onSuccess) onSuccess(groupId);
    },
    onError: (err) => {
      message.error(err?.response?.data?.detail || "Failed to update Layer Group!");
    },
  });

  // Handler simpan perubahan
  const onFinish = (values) => {
    if (memberLayers.length === 0) {
      message.warning("Layer Group must have at least 1 member layer!");
      return;
    }

    const payload = {
      title: values.title,
      abstract_text: values.abstract_text || "",
      mode: values.mode || "single",
      layer_ids: memberLayers.map((l) => l.layer_id || l.id),
    };

    updateMutation.mutate(payload);
  };

  // Hapus anggota dari grup
  const handleRemoveMember = (layerId) => {
    setMemberLayers((prev) => prev.filter((l) => (l.layer_id || l.id) !== layerId));
  };

  // Pindahkan urutan layer anggota
  const moveMember = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= memberLayers.length) return;
    const newArr = [...memberLayers];
    const temp = newArr[index];
    newArr[index] = newArr[targetIdx];
    newArr[targetIdx] = temp;
    setMemberLayers(newArr);
  };

  // Tambahkan layer (bisa banyak sekaligus) yang belum ada di grup
  const handleAddMembers = () => {
    if (!selectedLayersToAdd || selectedLayersToAdd.length === 0) return;

    const toAdd = [];
    selectedLayersToAdd.forEach((lid) => {
      const layerObj = availableSourcePool.find((l) => l.id === lid);
      if (layerObj && !memberLayers.some((m) => (m.layer_id || m.id) === layerObj.id)) {
        toAdd.push({
          layer_id: layerObj.id,
          layer_name: layerObj.layer_name || layerObj.name,
          geoserver_name: layerObj.geoserver_name,
          layer_type: layerObj.layer_type,
          data_type: layerObj.data_type,
        });
      }
    });

    if (toAdd.length > 0) {
      setMemberLayers((prev) => [...prev, ...toAdd]);
      setSelectedLayersToAdd([]);
      message.success(`${toAdd.length} layers added to group`);
    }
  };

  // Layers available to add (in the same workspace but not yet in the group)
  const currentMemberIds = memberLayers.map((l) => l.layer_id || l.id);
  const availableLayersToAdd = availableSourcePool.filter(
    (l) =>
      (!groupData?.workspace_id || l.workspace_id === groupData.workspace_id) &&
      !currentMemberIds.includes(l.id)
  );

  const handleSelectAllAvailable = () => {
    setSelectedLayersToAdd(availableLayersToAdd.map((l) => l.id));
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div className="flex items-center gap-2 text-slate-800">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-semibold text-base">Edit Layer Group</h3>
            <p className="text-xs text-slate-400 font-normal">
              Modify title, arrangement order, and add/remove member layers
            </p>
          </div>
        </div>
      }
      width={560}
    >
      {isLoadingDetail ? (
        <div className="py-12 flex justify-center">
          <Spin tip="Loading Layer Group details..." />
        </div>
      ) : (
        <Form form={form} layout="vertical" onFinish={onFinish} className="mt-4">
          {/* Display Title */}
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Layer Group Title</span>}
            name="title"
            rules={[{ required: true, message: "Title is required!" }]}
          >
            <Input placeholder="Layer Group Title" />
          </Form.Item>

          {/* GeoServer WMS Mode */}
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">GeoServer WMS Mode</span>}
            name="mode"
          >
            <Select>
              <Select.Option value="single">Single (Combined WMS visualization)</Select.Option>
              <Select.Option value="named">Named (Group with sublayers)</Select.Option>
              <Select.Option value="container">Container (Logical grouping)</Select.Option>
            </Select>
          </Form.Item>

          {/* Description */}
          <Form.Item
            label={<span className="text-xs font-semibold text-slate-700">Description / Abstract</span>}
            name="abstract_text"
          >
            <Input.TextArea rows={2} placeholder="Layer group description..." />
          </Form.Item>

          {/* Member Layers List & Reordering */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">
                Member Layers ({memberLayers.length})
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl p-2 bg-slate-50/60 max-h-[220px] overflow-y-auto space-y-1.5">
              {memberLayers.length === 0 ? (
                <Empty description="No member layers" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ) : (
                memberLayers.map((layer, idx) => {
                  const lid = layer.layer_id || layer.id;
                  return (
                    <div
                      key={lid}
                      className="flex items-center justify-between p-2 bg-white rounded-lg border border-slate-200/80 text-xs shadow-2xs"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-slate-400 w-5">#{idx + 1}</span>
                        <span className="font-medium text-slate-800 truncate max-w-[210px] sm:max-w-[260px]">
                          {layer.layer_name}
                        </span>
                        {layer.data_type && (
                          <Tag color="amber" className="!text-[10px] !m-0">
                            {layer.data_type}
                          </Tag>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveMember(idx, -1)}
                          className="px-1.5 py-0.5 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          ▲
                        </button>
                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={idx === memberLayers.length - 1}
                          onClick={() => moveMember(idx, 1)}
                          className="px-1.5 py-0.5 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          ▼
                        </button>
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(lid)}
                          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Remove from group"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Add Layer to Group (Multi-select) */}
          {availableLayersToAdd.length > 0 ? (
            <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-700">
                  Add Other Layers to This Group ({availableLayersToAdd.length} available)
                </span>
                {availableLayersToAdd.length > 1 && (
                  <button
                    type="button"
                    onClick={handleSelectAllAvailable}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    Select All ({availableLayersToAdd.length})
                  </button>
                )}
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select
                  mode="multiple"
                  loading={isLoadingWsLayers}
                  value={selectedLayersToAdd}
                  onChange={setSelectedLayersToAdd}
                  placeholder="Select one or more layers to add..."
                  className="flex-1 min-w-0"
                  allowClear
                  maxTagCount="responsive"
                  filterOption={(input, option) =>
                    (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
                  }
                  options={availableLayersToAdd.map((l) => ({
                    value: l.id,
                    label: `${l.layer_name || l.name}${l.data_type ? ` [${l.data_type}]` : ""}`,
                  }))}
                />
                <Button
                  type="default"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={handleAddMembers}
                  disabled={selectedLayersToAdd.length === 0}
                  className="flex items-center justify-center gap-1 shrink-0 !bg-white hover:!bg-slate-50"
                >
                  Add {selectedLayersToAdd.length > 0 ? `(${selectedLayersToAdd.length})` : ""}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-center text-xs text-slate-400">
              All layers in this workspace are already members of this group.
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button onClick={onClose}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={updateMutation.isPending}
              className="!bg-blue-600 hover:!bg-blue-500"
            >
              Save Changes
            </Button>
          </div>
        </Form>
      )}
    </Modal>
  );
};

export default LayerGroupEditModal;
