import { useState, useEffect } from "react";
import { Modal, Button, Select, message, Slider } from "antd";
import {
  Palette,
  Plus,
  Trash2,
  Sparkles,
  Eye,
  Check,
  Undo2
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import layerApi from "../api/LayerApi";

// Preset palet warna populer untuk analisis GIS
export const PRESETS = [
  {
    id: "flood_risk",
    name: "Risiko Banjir (5 Kelas)",
    description: "Biru ke Merah standar penilaian risiko",
    styleType: "values",
    classes: [
      { quantity: 0, color: "#000000", opacity: 0.0, label: "No Data" },
      { quantity: 1, color: "#2b83ba", opacity: 1.0, label: "Sangat Rendah" },
      { quantity: 2, color: "#abdda4", opacity: 1.0, label: "Rendah" },
      { quantity: 3, color: "#ffffbf", opacity: 1.0, label: "Sedang" },
      { quantity: 4, color: "#fdae61", opacity: 1.0, label: "Tinggi" },
      { quantity: 5, color: "#d7191c", opacity: 1.0, label: "Sangat Tinggi" },
    ],
  },
  {
    id: "flood_event",
    name: "Deteksi Genangan / Banjir",
    description: "Highlight area terdampak banjir",
    styleType: "values",
    classes: [
      { quantity: 0, color: "#000000", opacity: 0.0, label: "Bukan Banjir" },
      { quantity: 1, color: "#e31a1c", opacity: 1.0, label: "Area Tergenang" },
    ],
  },
  {
    id: "rainfall",
    name: "Curah Hujan (Blues)",
    description: "Gradasi intensitas hujan dari rendah ke ekstrim",
    styleType: "intervals",
    classes: [
      { quantity: 0, color: "#000000", opacity: 0.0, label: "0 mm" },
      { quantity: 20, color: "#c6dbef", opacity: 0.8, label: "Ringan (<20)" },
      { quantity: 50, color: "#6baed6", opacity: 0.85, label: "Sedang (20-50)" },
      { quantity: 100, color: "#2171b5", opacity: 0.9, label: "Lebat (50-100)" },
      { quantity: 150, color: "#08306b", opacity: 1.0, label: "Sangat Lebat (>100)" },
    ],
  },
  {
    id: "traffic_light",
    name: "Traffic Light (Hijau - Merah)",
    description: "Skema peringatan bahaya",
    styleType: "values",
    classes: [
      { quantity: 0, color: "#000000", opacity: 0.0, label: "Aman" },
      { quantity: 1, color: "#1a9641", opacity: 1.0, label: "Aman / Hijau" },
      { quantity: 2, color: "#a6d96a", opacity: 1.0, label: "Waspada Ringan" },
      { quantity: 3, color: "#ffffbf", opacity: 1.0, label: "Waspada" },
      { quantity: 4, color: "#fdae61", opacity: 1.0, label: "Siaga" },
      { quantity: 5, color: "#d7191c", opacity: 1.0, label: "Awas / Kritis" },
    ],
  },
  {
    id: "viridis",
    name: "Viridis (Saintifik)",
    description: "Perseptual seragam, ramah buta warna",
    styleType: "ramp",
    classes: [
      { quantity: 0, color: "#000000", opacity: 0.0, label: "0" },
      { quantity: 1, color: "#440154", opacity: 1.0, label: "Level 1" },
      { quantity: 2, color: "#3b528b", opacity: 1.0, label: "Level 2" },
      { quantity: 3, color: "#21908c", opacity: 1.0, label: "Level 3" },
      { quantity: 4, color: "#5dc863", opacity: 1.0, label: "Level 4" },
      { quantity: 5, color: "#fde725", opacity: 1.0, label: "Level 5" },
    ],
  },
];

const LayerStyleModal = ({ open, onClose, layer, onStyleApplied }) => {
  const queryClient = useQueryClient();
  const [styleType, setStyleType] = useState("values");
  const [classes, setClasses] = useState(PRESETS[0].classes);

  useEffect(() => {
    if (open && layer) {
      // Sesuaikan default preset berdasarkan nama layer jika ada indikasi nama
      const name = layer.layer_name?.toLowerCase() || "";
      if (name.includes("event") || name.includes("genangan")) {
        applyPreset(PRESETS[1]);
      } else if (name.includes("rain") || name.includes("hujan")) {
        applyPreset(PRESETS[2]);
      } else {
        applyPreset(PRESETS[0]);
      }
    }
  }, [open, layer]);

  const applyPreset = (preset) => {
    setStyleType(preset.styleType);
    setClasses(JSON.parse(JSON.stringify(preset.classes)));
  };

  const updateClass = (index, field, value) => {
    setClasses((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addClass = () => {
    const lastQty = classes.length > 0 ? classes[classes.length - 1].quantity : 0;
    setClasses((prev) => [
      ...prev,
      {
        quantity: lastQty + 1,
        color: "#3b82f6",
        opacity: 1.0,
        label: `Kelas ${lastQty + 1}`,
      },
    ]);
  };

  const removeClass = (index) => {
    if (classes.length <= 1) {
      message.warning("At least 1 color class is required!");
      return;
    }
    setClasses((prev) => prev.filter((_, i) => i !== index));
  };

  const mutation = useMutation({
    mutationFn: (data) => layerApi.updateStyle(data),
    onSuccess: (res) => {
      message.success(res?.data?.detail || "Layer style updated successfully!");
      if (onStyleApplied && layer) {
        onStyleApplied(layer.id);
      }
      onClose();
    },
    onError: (err) => {
      message.error(err.response?.data?.detail || "Failed to apply style to GeoServer");
    },
  });

  const handleSubmit = () => {
    if (!layer) return;
    mutation.mutate({
      layer_id: layer.id,
      style_type: styleType,
      colors: classes.map((c) => ({
        quantity: Number(c.quantity),
        color: c.color,
        opacity: Number(c.opacity),
        label: c.label || "",
      })),
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
      centered
      className="rounded-2xl overflow-hidden"
    >
      <div className="pt-2">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">
              Pengaturan Warna &amp; Simbologi Layer
            </h2>
            <p className="text-xs text-slate-500">
              Layer: <span className="font-semibold text-slate-700">{layer?.layer_name}</span> ({layer?.workspace_name})
            </p>
          </div>
        </div>

        {/* Preset Section */}
        <div className="mt-4">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Pilih Preset Palet Warna Populer:
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p)}
                className="flex flex-col text-left p-2.5 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-slate-800 group-hover:text-blue-600">
                    {p.name}
                  </span>
                </div>
                {/* Bar warna preview kecil */}
                <div className="flex h-2.5 w-full rounded overflow-hidden shadow-inner my-1">
                  {p.classes.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        backgroundColor: c.opacity === 0 ? "transparent" : c.color,
                        flex: 1,
                      }}
                      className={c.opacity === 0 ? "border border-dashed border-slate-300" : ""}
                    />
                  ))}
                </div>
                <span className="text-[10px] text-slate-400 truncate">{p.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pengaturan Tipe Style */}
        <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-700 block">Metode Pewarnaan SLD</span>
            <span className="text-[11px] text-slate-400">
              {styleType === "values" && "Nilai eksak / kategori diskrit (sangat pas untuk kelas 1-5)"}
              {styleType === "intervals" && "Rentang interval bertahap (kurang dari / sama dengan)"}
              {styleType === "ramp" && "Gradien mulus berkelanjutan antar nilai piksel"}
            </span>
          </div>
          <Select
            value={styleType}
            onChange={setStyleType}
            className="w-36"
            options={[
              { value: "values", label: "Diskrit (Values)" },
              { value: "intervals", label: "Interval (Rentang)" },
              { value: "ramp", label: "Gradien (Ramp)" },
            ]}
          />
        </div>

        {/* Tabel / Editor Kelas Warna */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-700">
              Kustomisasi Kelas &amp; Warna ({classes.length} kelas):
            </span>
            <Button
              type="dashed"
              size="small"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={addClass}
              className="text-xs flex items-center"
            >
              Tambah Kelas
            </Button>
          </div>

          <div className="max-h-[260px] overflow-y-auto overflow-x-auto pr-1">
            <div className="min-w-[500px] space-y-2 py-1">
            {classes.map((cls, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs hover:border-slate-300 transition"
              >
                {/* Input Color Picker */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="color"
                    value={cls.color}
                    onChange={(e) => updateClass(idx, "color", e.target.value)}
                    className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
                    title="Pilih Warna"
                  />
                  <input
                    type="text"
                    value={cls.color}
                    onChange={(e) => updateClass(idx, "color", e.target.value)}
                    className="w-16 px-1.5 py-1 text-[11px] font-mono border border-slate-200 rounded uppercase text-slate-700"
                  />
                </div>

                {/* Nilai Piksel / Quantity */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[10px] text-slate-400 font-medium">Nilai:</span>
                  <input
                    type="number"
                    value={cls.quantity}
                    onChange={(e) => updateClass(idx, "quantity", e.target.value)}
                    className="w-14 px-1.5 py-1 text-xs border border-slate-200 rounded text-slate-800 font-medium text-center"
                  />
                </div>

                {/* Label Keterangan */}
                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={cls.label}
                    placeholder="Keterangan (opsional)..."
                    onChange={(e) => updateClass(idx, "label", e.target.value)}
                    className="w-full px-2 py-1 text-xs border border-slate-200 rounded text-slate-700"
                  />
                </div>

                {/* Opacity */}
                <div className="flex items-center gap-1 flex-shrink-0 w-24">
                  <span className="text-[10px] text-slate-400">Op:</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={cls.opacity}
                    onChange={(e) => updateClass(idx, "opacity", parseFloat(e.target.value))}
                    className="w-12 accent-blue-600 cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-slate-500 w-6">
                    {Math.round(cls.opacity * 100)}%
                  </span>
                </div>

                {/* Hapus */}
                <button
                  type="button"
                  onClick={() => removeClass(idx)}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                  title="Hapus Kelas"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Live Preview Legenda Bar */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-600 block mb-1.5">
            Pratinjau Legenda WMS:
          </span>
          <div className="flex flex-wrap gap-2">
            {classes.map((cls, idx) => (
              <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-700 bg-white px-2 py-1 rounded-md border border-slate-100 shadow-sm">
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0 border border-black/10"
                  style={{
                    backgroundColor: cls.opacity === 0 ? "transparent" : cls.color,
                    backgroundImage: cls.opacity === 0 ? "repeating-linear-gradient(45deg, #ccc, #ccc 2px, #fff 2px, #fff 4px)" : "none"
                  }}
                />
                <span className="font-semibold text-slate-800">{cls.label || `Val ${cls.quantity}`}</span>
                <span className="text-slate-400 text-[10px]">({cls.quantity})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button onClick={onClose} disabled={mutation.isPending}>
            Batal
          </Button>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={mutation.isPending}
            icon={<Check className="w-4 h-4" />}
            className="flex items-center gap-1"
          >
            Terapkan ke GeoServer
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LayerStyleModal;
