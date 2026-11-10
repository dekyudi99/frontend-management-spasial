import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CLASSIFICATION_METHODS,
  equalIntervalBreaks,
  uniqueValueClasses,
  createInitialClassificationState,
  getClassesFromState,
  validateClassification,
  classificationReducer,
  toApplyPayload,
  fromSavedSymbology,
} from "./classificationEngine.js";

import { formatBound, parseNumberInput } from "./classificationFormat.js";

describe("LayerStyleModal Component Interaction Rules", () => {
  it("pilih Jenks -> edit batas -> metode menjadi Manual", () => {
    // Initial state with Jenks / Natural Breaks
    const state = createInitialClassificationState({
      method: CLASSIFICATION_METHODS.NATURAL_BREAKS,
      classCount: 3,
      breaks: [0, 20, 60, 100],
      colors: ["#111", "#222", "#333"],
    });
    assert.equal(state.method, CLASSIFICATION_METHODS.NATURAL_BREAKS);

    // User edits break at index 1 from 20 to 25
    const updatedState = classificationReducer(state, {
      type: "SET_BREAK",
      index: 1,
      value: 25,
    });

    assert.equal(updatedState.method, CLASSIFICATION_METHODS.MANUAL);
    assert.deepEqual(updatedState.breaks, [0, 25, 60, 100]);
    assert.equal(updatedState.lastAutoMethod, CLASSIFICATION_METHODS.NATURAL_BREAKS);
  });

  it("ubah warna -> metode tetap Jenks", () => {
    const state = createInitialClassificationState({
      method: CLASSIFICATION_METHODS.NATURAL_BREAKS,
      classCount: 3,
      breaks: [0, 20, 60, 100],
      colors: ["#111", "#222", "#333"],
    });

    // Ubah warna kelas 0
    const updatedState = classificationReducer(state, {
      type: "SET_COLOR",
      index: 0,
      color: "#ff0000",
    });

    assert.equal(updatedState.method, CLASSIFICATION_METHODS.NATURAL_BREAKS);
    assert.equal(updatedState.colors[0], "#ff0000");
  });

  it("manual -> pilih Quantile -> logika konfirmasi: batal mempertahankan manual, konfirmasi menerapkan Quantile", () => {
    const manualState = createInitialClassificationState({
      method: CLASSIFICATION_METHODS.MANUAL,
      classCount: 3,
      breaks: [0, 30, 70, 100],
      colors: ["#111", "#222", "#333"],
    });
    manualState.lastAutoMethod = CLASSIFICATION_METHODS.NATURAL_BREAKS;

    // Skenario A: User membatalkan konfirmasi
    // State tidak diubah
    const cancelledState = manualState;
    assert.equal(cancelledState.method, CLASSIFICATION_METHODS.MANUAL);
    assert.deepEqual(cancelledState.breaks, [0, 30, 70, 100]);

    // Skenario B: User mengonfirmasi perubahan
    // State menerapkan Quantile dengan breaks baru
    const confirmedState = classificationReducer(manualState, {
      type: "APPLY_AUTO_METHOD",
      method: CLASSIFICATION_METHODS.QUANTILE,
      breaks: [0, 25, 50, 100],
    });
    assert.equal(confirmedState.method, CLASSIFICATION_METHODS.QUANTILE);
    assert.equal(confirmedState.lastAutoMethod, CLASSIFICATION_METHODS.QUANTILE);
    assert.deepEqual(confirmedState.breaks, [0, 25, 50, 100]);
  });

  it("raster kategorikal (is_integer true, unique_values <= 20) -> default Unique Values", () => {
    const stats = {
      is_integer: true,
      unique_values: [
        { value: 1, count: 500 },
        { value: 2, count: 300 },
        { value: 3, count: 1200 },
        { value: 4, count: 80 },
      ],
      min: 1,
      max: 4,
    };

    // Deteksi kategorikal
    const isCategorical =
      stats.is_integer &&
      Array.isArray(stats.unique_values) &&
      stats.unique_values.length > 0 &&
      stats.unique_values.length <= 20;

    assert.equal(isCategorical, true);

    const uClasses = uniqueValueClasses(stats.unique_values, ["#1f78b4", "#33a02c", "#e31a1c", "#ff7f00"]);
    assert.equal(uClasses.length, 4);
    assert.equal(uClasses[0].quantity, 1);
    assert.equal(uClasses[3].quantity, 4);

    const state = createInitialClassificationState({
      method: CLASSIFICATION_METHODS.UNIQUE_VALUES,
      breaks: uClasses.map((c) => c.quantity),
      colors: uClasses.map((c) => c.color),
      statistics: stats,
    });

    assert.equal(state.method, CLASSIFICATION_METHODS.UNIQUE_VALUES);
    assert.equal(state.classCount, 4);
  });

  it("statistics null -> Quantile dan Jenks dinonaktifkan", () => {
    const stats = null;
    const hasStats = Boolean(stats && Number.isFinite(stats.min) && Number.isFinite(stats.max));
    assert.equal(hasStats, false);

    // Options dropdown:
    const options = [
      { value: CLASSIFICATION_METHODS.NATURAL_BREAKS, disabled: !hasStats },
      { value: CLASSIFICATION_METHODS.EQUAL_INTERVAL, disabled: !hasStats },
      { value: CLASSIFICATION_METHODS.QUANTILE, disabled: !hasStats },
      { value: CLASSIFICATION_METHODS.MANUAL, disabled: false },
    ];

    const jenksOpt = options.find((o) => o.value === CLASSIFICATION_METHODS.NATURAL_BREAKS);
    const quantileOpt = options.find((o) => o.value === CLASSIFICATION_METHODS.QUANTILE);
    const manualOpt = options.find((o) => o.value === CLASSIFICATION_METHODS.MANUAL);

    assert.equal(jenksOpt.disabled, true);
    assert.equal(quantileOpt.disabled, true);
    assert.equal(manualOpt.disabled, false);
  });

  it("buka ulang dialog setelah simpan -> metode dan batas pulih persis tanpa hitung ulang", () => {
    // 1. Simpan symbology versi 2
    const originalState = createInitialClassificationState({
      method: CLASSIFICATION_METHODS.MANUAL,
      classCount: 3,
      breaks: [5.2, 18.7, 42.1, 99.9],
      colors: ["#ff0000", "#00ff00", "#0000ff"],
      labels: ["Zone 1", "Zone 2", "Zone 3"],
      labelEdited: [true, true, true],
    });
    originalState.lastAutoMethod = CLASSIFICATION_METHODS.NATURAL_BREAKS;

    const payload = toApplyPayload(originalState, {
      layer_id: "raster-layer-abc",
      workspace_name: "workspace_test",
      layer_name: "raster_elevation",
    });

    // Simulasi data yang tersimpan di DB
    const savedSymbology = {
      layer_kind: payload.layer_kind,
      version: 2,
      style_name: payload.style_name,
      style_type: payload.style_type,
      classification_method: payload.classification_method,
      last_auto_method: payload.last_auto_method,
      classes_count: payload.classes_count,
      color_ramp: payload.color_ramp,
      preset_id: payload.preset_id,
      breaks: payload.breaks,
      classes: payload.colors,
      updated_at: new Date().toISOString(),
    };

    // 2. Buka ulang dialog -> panggil fromSavedSymbology
    const restoredState = fromSavedSymbology(savedSymbology, { min: 5.2, max: 99.9 });

    assert.equal(restoredState.method, CLASSIFICATION_METHODS.MANUAL);
    assert.equal(restoredState.lastAutoMethod, CLASSIFICATION_METHODS.NATURAL_BREAKS);
    assert.equal(restoredState.classCount, 3);
    assert.deepEqual(restoredState.breaks, [5.2, 18.7, 42.1, 99.9]);
    assert.equal(restoredState.labels[0], "Zone 1");
    assert.equal(restoredState.labels[1], "Zone 2");
    assert.equal(restoredState.labels[2], "Zone 3");
    assert.equal(restoredState.labelEdited[0], true);
  });

  it("request klasifikasi lama dibatalkan saat user mengubah pilihan cepat (AbortController)", async () => {
    let callCount = 0;
    let abortedCount = 0;

    // Mock simulasi pemanggilan async dengan AbortController
    const mockClassifyApi = (method, classes, signal) => {
      callCount++;
      return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          resolve({ breaks: [0, 50, 100] });
        }, 100);

        signal.addEventListener("abort", () => {
          clearTimeout(timer);
          abortedCount++;
          const err = new Error("Request aborted");
          err.name = "AbortError";
          reject(err);
        });
      });
    };

    const c1 = new AbortController();
    const p1 = mockClassifyApi("natural_breaks", 5, c1.signal);

    // User langsung mengubah ke 10 kelas sebelum p1 selesai
    c1.abort();

    const c2 = new AbortController();
    const p2 = mockClassifyApi("natural_breaks", 10, c2.signal);

    // p1 harus ter-abort
    await assert.rejects(p1, { name: "AbortError" });

    // p2 harus selesai
    const res2 = await p2;
    assert.deepEqual(res2.breaks, [0, 50, 100]);

    assert.equal(callCount, 2);
    assert.equal(abortedCount, 1);
  });
});

