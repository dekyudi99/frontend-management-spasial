import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  parseNumberInput,
  formatBound,
  formatClassLabel,
} from "./classificationFormat.js";

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
  normalizeClassificationMethod,
} from "./classificationEngine.js";

import { PRESETS } from "./presets.js";

describe("Classification Format & Number Parsing", () => {
  it("parseNumberInput handles commas, dots, negative numbers, and invalid values", () => {
    assert.equal(parseNumberInput("1,5"), 1.5);
    assert.equal(parseNumberInput("1.5"), 1.5);
    assert.equal(parseNumberInput("-42,75"), -42.75);
    assert.equal(parseNumberInput(" 0 "), 0);
    assert.equal(parseNumberInput(0), 0);
    assert.equal(parseNumberInput(""), null);
    assert.equal(parseNumberInput(null), null);
    assert.equal(parseNumberInput(undefined), null);
    assert.equal(parseNumberInput("abc"), null);
    assert.equal(parseNumberInput(NaN), null);
    assert.equal(parseNumberInput(Infinity), null);
  });

  it("formatBound adapts decimal places to data scale and avoids duplicate labels for tiny floats", () => {
    // 1. Data bulat -> tanpa desimal
    assert.equal(formatBound(5, 1, 10), "5");
    assert.equal(formatBound(0, -100, 0), "0");
    assert.equal(formatBound(-100, -100, 0), "-100");

    // 2. Max = 0 dan min negatif tidak terdistorsi
    assert.equal(formatBound(-50.5, -100, 0), "-50.5");

    // 3. Nilai sangat kecil (0.001 - 0.005) tidak menghasilkan label kembar
    const b1 = formatBound(0.001, 0.001, 0.005);
    const b2 = formatBound(0.002, 0.001, 0.005);
    const b3 = formatBound(0.003, 0.001, 0.005);
    const b4 = formatBound(0.004, 0.001, 0.005);
    const b5 = formatBound(0.005, 0.001, 0.005);

    assert.equal(b1, "0.001");
    assert.equal(b2, "0.002");
    assert.equal(b3, "0.003");
    assert.equal(b4, "0.004");
    assert.equal(b5, "0.005");

    const uniqueSet = new Set([b1, b2, b3, b4, b5]);
    assert.equal(uniqueSet.size, 5);
  });

  it("formatClassLabel generates clean interval string", () => {
    const lbl = formatClassLabel(10, 20, 0, 100);
    assert.equal(lbl, "10 - 20");
    const valLbl = formatClassLabel(3, 3, 1, 5, "unique_values");
    assert.equal(valLbl, "Value 3");
  });
});

describe("Classification Calculation Functions", () => {
  it("equalIntervalBreaks preserves max = 0 and negative min", () => {
    const breaks = equalIntervalBreaks(-100, 0, 4);
    assert.deepEqual(breaks, [-100, -75, -50, -25, 0]);
  });

  it("equalIntervalBreaks handles min == max as single class", () => {
    const breaks = equalIntervalBreaks(42, 42, 5);
    assert.deepEqual(breaks, [42, 42]);
  });

  it("equalIntervalBreaks retains full precision without rounding", () => {
    const breaks = equalIntervalBreaks(0, 1, 3);
    assert.equal(breaks.length, 4);
    assert.equal(breaks[0], 0);
    assert.equal(breaks[1], 1 / 3);
    assert.equal(breaks[2], 2 / 3);
    assert.equal(breaks[3], 1);
  });

  it("uniqueValueClasses creates discrete classes from unique values", () => {
    const uvals = [{ value: 1 }, { value: 2 }, { value: 5 }];
    const classes = uniqueValueClasses(uvals, ["#111111", "#222222"]);
    assert.equal(classes.length, 3);
    assert.equal(classes[0].quantity, 1);
    assert.equal(classes[1].quantity, 2);
    assert.equal(classes[2].quantity, 5);
    assert.equal(classes[0].label, "Value 1");
  });
});

describe("Classification Reducer Actions & State Rules", () => {
  function getSampleState() {
    return createInitialClassificationState({
      method: "equal_interval",
      classCount: 3,
      breaks: [0, 25, 50, 100],
      colors: ["#ff0000", "#00ff00", "#0000ff"],
      statistics: { min: 0, max: 100 },
    });
  }

  it("SET_BREAK changes method to 'manual' and updates neighboring labels", () => {
    const state = getSampleState();
    assert.equal(state.method, CLASSIFICATION_METHODS.EQUAL_INTERVAL);

    // Ubah break[1] dari 25 ke 30 (harus > 0 dan < 50)
    const nextState = classificationReducer(state, {
      type: "SET_BREAK",
      index: 1,
      value: 30,
    });

    assert.equal(nextState.method, CLASSIFICATION_METHODS.MANUAL);
    assert.deepEqual(nextState.breaks, [0, 30, 50, 100]);
    // Label kelas 0 terpengaruh (0 - 30)
    assert.equal(nextState.labels[0], "0 - 30");
    // Label kelas 1 terpengaruh (30 - 50)
    assert.equal(nextState.labels[1], "30 - 50");
    // Label kelas 2 tidak terpengaruh (50 - 100)
    assert.equal(nextState.labels[2], "50 - 100");
  });

  it("SET_BREAK rejects non-ascending values without changing breaks", () => {
    const state = getSampleState();
    // Coba ubah breaks[1] menjadi 60 (padahal breaks[2] adalah 50)
    const rejectedState = classificationReducer(state, {
      type: "SET_BREAK",
      index: 1,
      value: 60,
    });
    // Breaks tidak berubah
    assert.deepEqual(rejectedState.breaks, [0, 25, 50, 100]);
    assert.equal(rejectedState.method, CLASSIFICATION_METHODS.EQUAL_INTERVAL);
  });

  it("SET_COLOR, SET_OPACITY, and APPLY_RAMP do not change classification method", () => {
    const state = getSampleState();
    assert.equal(state.method, CLASSIFICATION_METHODS.EQUAL_INTERVAL);

    // Ubah warna
    const s1 = classificationReducer(state, {
      type: "SET_COLOR",
      index: 0,
      color: "#ffffff",
    });
    assert.equal(s1.method, CLASSIFICATION_METHODS.EQUAL_INTERVAL);
    assert.equal(s1.colors[0], "#ffffff");

    // Ubah opacity
    const s2 = classificationReducer(s1, {
      type: "SET_OPACITY",
      index: 1,
      opacity: 0.5,
    });
    assert.equal(s2.method, CLASSIFICATION_METHODS.EQUAL_INTERVAL);
    assert.equal(s2.opacities[1], 0.5);

    // Apply ramp
    const s3 = classificationReducer(s2, {
      type: "APPLY_RAMP",
      rampId: "viridis",
      baseColors: ["#440154", "#fde725"],
    });
    assert.equal(s3.method, CLASSIFICATION_METHODS.EQUAL_INTERVAL);
    assert.equal(s3.colors.length, 3);
  });

  it("SET_LABEL marks labelEdited as true and preserves custom label on break change", () => {
    const state = getSampleState();
    const s1 = classificationReducer(state, {
      type: "SET_LABEL",
      index: 0,
      label: "Custom Safe Zone",
    });

    assert.equal(s1.labels[0], "Custom Safe Zone");
    assert.equal(s1.labelEdited[0], true);
    assert.equal(s1.method, CLASSIFICATION_METHODS.EQUAL_INTERVAL);

    // Ketika batas kelas 0 diubah (break index 1), label custom TIDAK boleh ditimpa
    const s2 = classificationReducer(s1, {
      type: "SET_BREAK",
      index: 1,
      value: 20,
    });
    assert.equal(s2.labels[0], "Custom Safe Zone");
    assert.equal(s2.labels[1], "20 - 50"); // Tetap terupdate karena belum diedit
  });

  it("ADD_CLASS and REMOVE_CLASS transition to manual and modify classCount", () => {
    const state = getSampleState();
    // Split last class [50, 100] at 75
    const s1 = classificationReducer(state, {
      type: "ADD_CLASS",
      splitIndex: 2,
      splitValue: 75,
    });
    assert.equal(s1.method, CLASSIFICATION_METHODS.MANUAL);
    assert.equal(s1.classCount, 4);
    assert.deepEqual(s1.breaks, [0, 25, 50, 75, 100]);

    // Hapus kelas ke-1 (25 - 50)
    const s2 = classificationReducer(s1, {
      type: "REMOVE_CLASS",
      index: 1,
    });
    assert.equal(s2.method, CLASSIFICATION_METHODS.MANUAL);
    assert.equal(s2.classCount, 3);
    assert.deepEqual(s2.breaks, [0, 25, 75, 100]);
  });

  it("APPLY_AUTO_METHOD updates method, lastAutoMethod, and breaks", () => {
    const state = getSampleState();
    const nextState = classificationReducer(state, {
      type: "APPLY_AUTO_METHOD",
      method: "natural_breaks",
      breaks: [0, 15.5, 45.2, 78.9, 100],
    });

    assert.equal(nextState.method, CLASSIFICATION_METHODS.NATURAL_BREAKS);
    assert.equal(nextState.lastAutoMethod, CLASSIFICATION_METHODS.NATURAL_BREAKS);
    assert.equal(nextState.classCount, 4);
    assert.deepEqual(nextState.breaks, [0, 15.5, 45.2, 78.9, 100]);
  });

  it("APPLY_PRESET sets unique_values for values styleType and isolates nodataClass", () => {
    const state = getSampleState();
    const floodPreset = PRESETS.find((p) => p.id === "flood_risk");
    assert.ok(floodPreset);

    const presetState = classificationReducer(state, {
      type: "APPLY_PRESET",
      preset: floodPreset,
    });

    assert.equal(presetState.method, CLASSIFICATION_METHODS.UNIQUE_VALUES);
    assert.equal(presetState.presetId, "flood_risk");
    // Class 0 (quantity 0, opacity 0) becomes nodataClass
    assert.ok(presetState.nodataClass);
    assert.equal(presetState.nodataClass.quantity, 0);
    assert.equal(presetState.nodataClass.opacity, 0);

    // Remaining classes 1..5 are active classes
    assert.equal(presetState.classCount, 5);
  });

  it("UNDO restores previous state snapshot", () => {
    const state = getSampleState();
    const s1 = classificationReducer(state, {
      type: "SET_BREAK",
      index: 1,
      value: 35,
    });
    assert.equal(s1.breaks[1], 35);

    const s2 = classificationReducer(s1, { type: "UNDO" });
    assert.equal(s2.breaks[1], 25);
    assert.equal(s2.method, CLASSIFICATION_METHODS.EQUAL_INTERVAL);
  });
});

describe("Validation Rules (validateClassification)", () => {
  it("detects non-ascending breaks, NaN, and class count errors", () => {
    // 1. Non-ascending breaks
    const badBreaksState = {
      breaks: [0, 30, 20, 100],
      method: "manual",
      classCount: 3,
      statistics: null,
    };
    const res1 = validateClassification(badBreaksState);
    assert.equal(res1.valid, false);
    assert.ok(res1.errors.some((e) => e.field === "breaks" && e.index === 2));

    // 2. NaN in breaks
    const nanState = {
      breaks: [0, NaN, 100],
      method: "manual",
      classCount: 2,
      statistics: null,
    };
    const res2 = validateClassification(nanState);
    assert.equal(res2.valid, false);
    assert.ok(res2.errors.some((e) => e.index === 1));

    // 3. Class count exceeded
    const tooManyState = {
      breaks: Array(60).fill(0).map((_, i) => i),
      method: "manual",
      classCount: 59,
      statistics: null,
    };
    const res3 = validateClassification(tooManyState);
    assert.equal(res3.valid, false);
    assert.ok(res3.errors.some((e) => e.field === "classCount"));

    // 4. Out of range warnings
    const outOfRangeState = {
      breaks: [-10, 50, 120],
      method: "manual",
      classCount: 2,
      statistics: { min: 0, max: 100 },
    };
    const res4 = validateClassification(outOfRangeState);
    assert.equal(res4.valid, true);
    assert.equal(res4.warnings.length, 2);
  });
});

describe("API Payload Mapping & Roundtrip (toApplyPayload & fromSavedSymbology)", () => {
  it("toApplyPayload generates contract-compliant payload", () => {
    const state = createInitialClassificationState({
      method: "equal_interval",
      classCount: 2,
      breaks: [10, 20, 30],
      colors: ["#ff0000", "#00ff00"],
      labels: ["Low", "High"],
    });

    const payload = toApplyPayload(state, {
      layer_id: "layer-123",
      workspace_name: "ws",
      layer_name: "raster_demo",
    });

    assert.equal(payload.layer_id, "layer-123");
    assert.equal(payload.layer_kind, "raster");
    assert.equal(payload.style_type, "intervals");
    assert.equal(payload.classification_method, "equal_interval");
    assert.equal(payload.classes_count, 2);
    assert.deepEqual(payload.breaks, [10, 20, 30]);
    assert.equal(payload.colors[0].quantity, 20);
    assert.equal(payload.colors[0].min, 10);
    assert.equal(payload.colors[0].max, 20);
    assert.equal(payload.colors[1].quantity, 30);
    assert.equal(payload.colors[1].min, 20);
    assert.equal(payload.colors[1].max, 30);
  });

  it("fromSavedSymbology restores version 2 state faithfully", () => {
    const saved = {
      layer_kind: "raster",
      version: 2,
      style_name: "style_demo",
      style_type: "intervals",
      classification_method: "natural_breaks",
      last_auto_method: "natural_breaks",
      classes_count: 2,
      color_ramp: "viridis",
      preset_id: null,
      breaks: [5.5, 12.3, 24.8],
      classes: [
        { min: 5.5, max: 12.3, quantity: 12.3, color: "#440154", opacity: 1.0, label: "Low", label_edited: true },
        { min: 12.3, max: 24.8, quantity: 24.8, color: "#fde725", opacity: 1.0, label: "High", label_edited: false },
      ],
    };

    const state = fromSavedSymbology(saved);
    assert.equal(state.method, CLASSIFICATION_METHODS.NATURAL_BREAKS);
    assert.equal(state.lastAutoMethod, CLASSIFICATION_METHODS.NATURAL_BREAKS);
    assert.equal(state.classCount, 2);
    assert.deepEqual(state.breaks, [5.5, 12.3, 24.8]);
    assert.equal(state.colors[0], "#440154");
    assert.equal(state.labels[0], "Low");
    assert.equal(state.labelEdited[0], true);
    assert.equal(state.labelEdited[1], false);
  });

  it("fromSavedSymbology restores legacy data without version (values -> unique_values, others -> manual)", () => {
    const legacyValues = {
      style_type: "values",
      classes: [
        { quantity: 1, color: "#111111", label: "Val 1" },
        { quantity: 2, color: "#222222", label: "Val 2" },
      ],
    };
    const s1 = fromSavedSymbology(legacyValues);
    assert.equal(s1.method, CLASSIFICATION_METHODS.UNIQUE_VALUES);

    const legacyIntervals = {
      style_type: "intervals",
      classification_method: "custom", // Normalizes to manual
      classes: [
        { min: 0, max: 10, quantity: 10, color: "#111111" },
        { min: 10, max: 20, quantity: 20, color: "#222222" },
      ],
    };
    const s2 = fromSavedSymbology(legacyIntervals);
    assert.equal(s2.method, CLASSIFICATION_METHODS.MANUAL);
    assert.deepEqual(s2.breaks, [0, 10, 20]);
  });
});

