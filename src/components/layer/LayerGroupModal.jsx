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
            <h3 className="font-semibold text-base">Buat Layer Group Baru</h3>
            <p className="text-xs text-slate-400 font-normal">
              Gabungkan beberapa layer GeoServer menjadi satu kesatuan visual WMS
            </p>
          </div>
        </div>
      }
      width={540}
    >
      <Form form={form} layout="vertical" onFinish={onFinish} className="mt-4">
        {/* Workspace info / select */}
        <Form.Item
          label={<span className="text-xs font-semibold text-slate-700">Workspace Target</span>}
          name="workspace_id"
          rules={[{ required: true, message: "Workspace wajib dipilih!" }]}
        >
          <Select placeholder="Pilih Workspace">
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

        {/* Judul Tampilan */}
        <Form.Item
          label={<span className="text-xs font-semibold text-slate-700">Judul Layer Group (Display Title)</span>}
          name="title"
          rules={[{ required: true, message: "Judul Layer Group wajib diisi!" }]}
        >
          <Input
            placeholder="Contoh: Analisis Risiko Banjir & Kontur"
            onChange={handleTitleChange}
          />
        </Form.Item>

        {/* Nama Teknis GeoServer */}
        <Form.Item
          label={
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <span>Nama Teknis GeoServer (WMS Machine Name)</span>
              <span className="text-[10px] text-slate-400 font-normal">(otomatis)</span>
            </span>
          }
          name="name"
          rules={[
            { required: true, message: "Nama teknis wajib diisi!" },
            { pattern: /^[a-zA-Z0-9_-]+$/, message: "Hanya boleh huruf, angka, underscore (_), atau dash (-)" },
          ]}
        >
          <Input placeholder="Contoh: lg_analisis_banjir" />
        </Form.Item>

        {/* Daftar Layer Anggota (Urutan Rendering) */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              Layer Anggota ({chosenLayers.length})
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl p-2 bg-slate-50/60 max-h-[180px] overflow-y-auto space-y-1.5">
            {chosenLayers.length === 0 ? (
              <p className="text-xs text-center py-4 text-slate-400">
                Belum ada layer yang dipilih. Checklist layer terlebih dahulu pada daftar.
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
                      title="Pindah ke atas"
                    >
                      ▲
                    </button>
                    {/* Move Down */}
                    <button
                      type="button"
                      disabled={idx === chosenLayers.length - 1}
                      onClick={() => moveLayer(idx, 1)}
                      className="px-1.5 py-0.5 rounded text-slate-400 hover:text-blue-600 disabled:opacity-30 cursor-pointer"
                      title="Pindah ke bawah"
                    >
                      ▼
                    </button>
                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => handleRemoveLayer(l.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"
                      title="Hapus dari grup"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Mode WMS */}
        <Form.Item
          label={<span className="text-xs font-semibold text-slate-700">Mode GeoServer WMS</span>}
          name="mode"
          initialValue="single"
        >
          <Select>
            <Select.Option value="single">Single (Satu Layer WMS Gabungan - Rekomendasi)</Select.Option>
            <Select.Option value="named">Named (Grup beserta sublayer ditampilkan)</Select.Option>
            <Select.Option value="container">Container (Pengelompokan struktur)</Select.Option>
          </Select>
        </Form.Item>

        {/* Deskripsi */}
        <Form.Item
          label={<span className="text-xs font-semibold text-slate-700">Deskripsi / Abstract (Opsional)</span>}
          name="abstract_text"
        >
          <Input.TextArea rows={2} placeholder="Keterangan mengenai layer group..." />
        </Form.Item>

        {/* Tombol Aksi */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button onClick={onClose}>Batal</Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={createMutation.isPending}
            disabled={chosenLayers.length === 0}
            className="!bg-blue-600 hover:!bg-blue-500"
          >
            Simpan Layer Group
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default LayerGroupModal;
