/**
 * Classification Engine for Raster Symbology.
 * Pure functions and immutable reducer for raster classification state management.
 */

import { sampleRampColors } from "./colorRamps.js";
import { formatBound, formatClassLabel, parseNumberInput } from "./classificationFormat.js";

/**
 * Enum metode klasifikasi (Kontrak Bersama)
 */
export const CLASSIFICATION_METHODS = {
  NATURAL_BREAKS: "natural_breaks",
  EQUAL_INTERVAL: "equal_interval",
  QUANTILE: "quantile",
  UNIQUE_VALUES: "unique_values",
  MANUAL: "manual",
  PRESET: "preset",
};

/**
 * Normalisasi alias metode lama (custom -> manual, jenks -> natural_breaks)
 *
 * @param {string} rawMethod
 * @returns {string}
 */
export function normalizeClassificationMethod(rawMethod) {
  if (!rawMethod) return CLASSIFICATION_METHODS.NATURAL_BREAKS;
  const m = String(rawMethod).toLowerCase().trim();
  if (m === "custom") return CLASSIFICATION_METHODS.MANUAL;
  if (m === "jenks") return CLASSIFICATION_METHODS.NATURAL_BREAKS;
  return m;
}

/**
 * Menghitung titik batas (breaks) equal interval secara lokal (murni di frontend).
 * Membagi rentang [min, max] menjadi n interval dengan lebar sama (max - min) / n.
 *
 * Catatan penting:
 * - Tidak menggunakan pola "Number(x) || default" agar max = 0 dan min negatif tidak terdistorsi.
 * - Nilai batas disimpan dengan presisi float penuh (tanpa toFixed).
 *
 * @param {number} min - Nilai minimum data
 * @param {number} max - Nilai maksimum data
 * @param {number} n - Jumlah kelas (1..50)
 * @returns {number[]} Array titik batas dengan panjang n + 1 (atau [min, min] jika min === max)
 */
export function equalIntervalBreaks(min, max, n) {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return [];
  }
  const count = Math.max(1, Math.floor(n) || 1);

  if (min === max) {
    return [min, min];
  }

  if (count <= 1) {
    return [min, max];
  }

  const step = (max - min) / count;
  const breaks = [min];
  for (let i = 1; i < count; i++) {
    breaks.push(min + i * step);
  }
  breaks.push(max);
  return breaks;
}

/**
 * Menghasilkan kelas untuk unique values dari daftar nilai unik dan palet warna.
 *
 * @param {Array<{value: number, count?: number}|number>} uniqueValues
 * @param {string[]} colors - Base colors untuk sampling ramp
 * @returns {Array<Object>}
 */
export function uniqueValueClasses(uniqueValues, colors) {
  if (!Array.isArray(uniqueValues) || uniqueValues.length === 0) {
    return [];
  }

  // Ekstrak dan urutkan nilai numerik secara ascending
  const sortedValues = uniqueValues
    .map((item) => (typeof item === "object" && item !== null ? item.value : item))
    .filter((val) => Number.isFinite(val))
    .sort((a, b) => a - b);

  const rampColors = sampleRampColors(colors, sortedValues.length);

  return sortedValues.map((val, idx) => ({
    min: val,
    max: val,
    quantity: val,
    color: rampColors[idx] || "#00e5ff",
    opacity: 1.0,
    label: `Value ${formatBound(val)}`,
    label_edited: false,
  }));
}

/**
 * @typedef {Object} ClassificationState
 * @property {'natural_breaks'|'equal_interval'|'quantile'|'unique_values'|'manual'|'preset'} method
 * @property {'natural_breaks'|'equal_interval'|'quantile'|null} lastAutoMethod
 * @property {number} classCount
 * @property {number[]} breaks - Satu-satunya sumber rentang kelas: kelas i = [breaks[i], breaks[i+1]]
 * @property {string[]} colors - HEX warna per kelas
 * @property {string[]} labels - Label per kelas
 * @property {number[]} opacities - Opacity per kelas (0.0 - 1.0)
 * @property {boolean[]} labelEdited - Boolean apakah label diedit manual oleh user
 * @property {string|null} presetId - ID preset jika sedang menggunakan preset
 * @property {string|null} rampId - ID color ramp aktif
 * @property {Object|null} statistics - Statistik raster dari backend { min, max, mean, std, nodata, is_integer, unique_values, pixel_count }
 * @property {Object|null} nodataClass - Entry khusus nodata preset (quantity 0, opacity 0)
 * @property {ClassificationState|null} _undo - Snapshot state sebelumnya
 */

/**
 * Membuat state awal klasifikasi.
 *
 * @param {Object} [params]
 * @returns {ClassificationState}
 */
export function createInitialClassificationState(params = {}) {
  const method = normalizeClassificationMethod(params.method || CLASSIFICATION_METHODS.EQUAL_INTERVAL);
  const classCount = Math.max(1, params.classCount || 5);
  const statistics = params.statistics || null;
  const min = statistics && Number.isFinite(statistics.min) ? statistics.min : 0;
  const max = statistics && Number.isFinite(statistics.max) ? statistics.max : 100;

  const breaks = params.breaks || equalIntervalBreaks(min, max, classCount);
  const rampId = params.rampId || "traffic_light";
  const colors = params.colors || sampleRampColors(["#1a9641", "#ffffbf", "#d7191c"], classCount);
  const opacities = params.opacities || Array(classCount).fill(1.0);
  const labelEdited = params.labelEdited || Array(classCount).fill(false);

  const labels =
    params.labels ||
    Array.from({ length: classCount }, (_, i) => {
      const bMin = breaks[i] !== undefined ? breaks[i] : min;
      const bMax = breaks[i + 1] !== undefined ? breaks[i + 1] : bMin;
      return formatClassLabel(bMin, bMax, min, max, method);
    });

  return {
    method,
    lastAutoMethod:
      params.lastAutoMethod !== undefined
        ? params.lastAutoMethod
        : [
            CLASSIFICATION_METHODS.NATURAL_BREAKS,
            CLASSIFICATION_METHODS.EQUAL_INTERVAL,
            CLASSIFICATION_METHODS.QUANTILE,
          ].includes(method)
        ? method
        : null,
    classCount:
      method === CLASSIFICATION_METHODS.UNIQUE_VALUES
        ? (params.classCount || breaks.length)
        : breaks.length > 1
        ? breaks.length - 1
        : classCount,
    breaks,
    colors,
    labels,
    opacities,
    labelEdited,
    presetId: params.presetId || null,
    rampId,
    statistics,
    nodataClass: params.nodataClass || null,
    _undo: null,
  };
}

/**
 * Menurunkan array classes dari state (single source of truth: breaks).
 *
 * @param {ClassificationState} state
 * @returns {Array<Object>}
 */
export function getClassesFromState(state) {
  if (!state || !state.breaks) return [];
  const { breaks, colors, labels, opacities, labelEdited, classCount } = state;
  const count = classCount || Math.max(1, breaks.length - 1);
  const result = [];

  for (let i = 0; i < count; i++) {
    const minVal = breaks[i];
    const maxVal = breaks[i + 1] !== undefined ? breaks[i + 1] : minVal;
    result.push({
      min: minVal,
      max: maxVal,
      quantity: maxVal,
      color: colors[i] || "#00e5ff",
      opacity: opacities[i] !== undefined ? opacities[i] : 1.0,
      label: labels[i] !== undefined ? labels[i] : `${minVal} - ${maxVal}`,
      label_edited: Boolean(labelEdited[i]),
    });
  }
  return result;
}

/**
 * Salin state untuk snapshot undo (tanpa nested _undo berulang).
 */
function cloneStateForUndo(state) {
  const { _undo, ...rest } = state;
  return {
    ...rest,
    breaks: [...rest.breaks],
    colors: [...rest.colors],
    labels: [...rest.labels],
    opacities: [...rest.opacities],
    labelEdited: [...rest.labelEdited],
    _undo: null,
  };
}

/**
 * Validasi klasifikasi raster.
 *
 * Aturan:
 * - breaks naik ketat (strictly ascending)
 * - semua angka finit
 * - jumlah kelas 1..50 (values: 1..256)
 * - peringatan jika batas di luar [min, max] data
 *
 * @param {ClassificationState} state
 * @returns {{ valid: boolean, errors: Array<{ index: number, field: string, message: string }>, warnings: Array<{ index: number, message: string }> }}
 */
export function validateClassification(state) {
  const errors = [];
  const warnings = [];

  if (!state || !Array.isArray(state.breaks)) {
    return {
      valid: false,
      errors: [{ index: 0, field: "breaks", message: "Breaks tidak terdefinisi." }],
      warnings: [],
    };
  }

  const { breaks, method, classCount, statistics } = state;

  // Validasi jumlah kelas
  const maxClasses = method === CLASSIFICATION_METHODS.UNIQUE_VALUES ? 256 : 50;
  if (classCount < 1 || classCount > maxClasses) {
    errors.push({
      index: 0,
      field: "classCount",
      message: `Jumlah kelas harus antara 1 dan ${maxClasses} (saat ini ${classCount}).`,
    });
  }

  // Validasi angka finit dan naik ketat
  for (let i = 0; i < breaks.length; i++) {
    const val = breaks[i];
    if (!Number.isFinite(val)) {
      errors.push({
        index: i,
        field: "breaks",
        message: `Batas ke-${i} bernilai tidak valid (NaN atau tak hingga).`,
      });
      continue;
    }

    if (i > 0) {
      const prev = breaks[i - 1];
      if (val <= prev) {
        errors.push({
          index: i,
          field: "breaks",
          message: `Batas ke-${i} (${val}) harus lebih besar dari batas sebelumnya (${prev}).`,
        });
      }
    }
  }

  // Peringatan jika batas di luar data min/max
  if (statistics && Number.isFinite(statistics.min) && Number.isFinite(statistics.max)) {
    if (breaks.length > 0) {
      if (breaks[0] < statistics.min) {
        warnings.push({
          index: 0,
          message: `Batas bawah (${breaks[0]}) lebih kecil dari minimum data (${statistics.min}).`,
        });
      }
      const lastIdx = breaks.length - 1;
      if (breaks[lastIdx] > statistics.max) {
        warnings.push({
          index: lastIdx,
          message: `Batas atas (${breaks[lastIdx]}) lebih besar dari maksimum data (${statistics.max}).`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Reducer murni untuk manajemen state klasifikasi raster.
 *
 * @param {ClassificationState} state
 * @param {Object} action
 * @returns {ClassificationState}
 */
export function classificationReducer(state, action) {
  if (!state || !action) return state;

  const dataMin = state.statistics && Number.isFinite(state.statistics.min) ? state.statistics.min : undefined;
  const dataMax = state.statistics && Number.isFinite(state.statistics.max) ? state.statistics.max : undefined;

  switch (action.type) {
    case "SET_BREAK": {
      const { index, value } = action;
      const numValue = parseNumberInput(value);
      if (numValue === null || !Number.isFinite(numValue)) {
        return state;
      }

      // Validasi strictly ascending: batas ke-i harus > breaks[i-1] dan < breaks[i+1]
      if (index > 0 && numValue <= state.breaks[index - 1]) {
        return state;
      }
      if (index < state.breaks.length - 1 && numValue >= state.breaks[index + 1]) {
        return state;
      }

      const snapshot = cloneStateForUndo(state);
      const newBreaks = [...state.breaks];
      newBreaks[index] = numValue;

      // Update labels yang terpengaruh jika belum diedit manual
      const newLabels = [...state.labels];

      // Kelas sebelumnya (index - 1): min = breaks[index - 1], max = newBreaks[index]
      if (index - 1 >= 0 && !state.labelEdited[index - 1]) {
        newLabels[index - 1] = formatClassLabel(
          newBreaks[index - 1],
          newBreaks[index],
          dataMin,
          dataMax,
          CLASSIFICATION_METHODS.MANUAL
        );
      }

      // Kelas saat ini (index): min = newBreaks[index], max = breaks[index + 1]
      if (index < state.classCount && !state.labelEdited[index]) {
        newLabels[index] = formatClassLabel(
          newBreaks[index],
          newBreaks[index + 1],
          dataMin,
          dataMax,
          CLASSIFICATION_METHODS.MANUAL
        );
      }

      return {
        ...state,
        method: CLASSIFICATION_METHODS.MANUAL,
        breaks: newBreaks,
        labels: newLabels,
        _undo: snapshot,
      };
    }

    case "ADD_CLASS": {
      // Membelah kelas (split) menjadi 2 kelas baru -> method 'manual'
      const snapshot = cloneStateForUndo(state);
      const targetIdx = action.splitIndex !== undefined ? action.splitIndex : state.classCount - 1;
      const safeIdx = Math.max(0, Math.min(state.classCount - 1, targetIdx));

      const bMin = state.breaks[safeIdx];
      const bMax = state.breaks[safeIdx + 1];
      const splitVal =
        action.splitValue !== undefined && Number.isFinite(action.splitValue)
          ? action.splitValue
          : (bMin + bMax) / 2;

      // Sisipkan splitVal di antara safeIdx dan safeIdx + 1
      const newBreaks = [
        ...state.breaks.slice(0, safeIdx + 1),
        splitVal,
        ...state.breaks.slice(safeIdx + 1),
      ];

      const newColors = [...state.colors];
      newColors.splice(safeIdx + 1, 0, state.colors[safeIdx] || "#00e5ff");

      const newOpacities = [...state.opacities];
      newOpacities.splice(safeIdx + 1, 0, 1.0);

      const newLabelEdited = [...state.labelEdited];
      newLabelEdited.splice(safeIdx, 1, false);
      newLabelEdited.splice(safeIdx + 1, 0, false);

      const newLabels = [...state.labels];
      newLabels.splice(
        safeIdx,
        1,
        formatClassLabel(bMin, splitVal, dataMin, dataMax, CLASSIFICATION_METHODS.MANUAL)
      );
      newLabels.splice(
        safeIdx + 1,
        0,
        formatClassLabel(splitVal, bMax, dataMin, dataMax, CLASSIFICATION_METHODS.MANUAL)
      );

      return {
        ...state,
        method: CLASSIFICATION_METHODS.MANUAL,
        classCount: state.classCount + 1,
        breaks: newBreaks,
        colors: newColors,
        opacities: newOpacities,
        labels: newLabels,
        labelEdited: newLabelEdited,
        _undo: snapshot,
      };
    }

    case "REMOVE_CLASS": {
      // Menghapus kelas -> method 'manual'. Tidak boleh mengurangi jika kelas tersisa 1
      if (state.classCount <= 1) return state;

      const snapshot = cloneStateForUndo(state);
      const targetIdx = Math.max(0, Math.min(state.classCount - 1, action.index));

      // Hapus batas atas kelas jika bukan kelas terakhir, atau batas bawah jika kelas terakhir
      const newBreaks = [...state.breaks];
      if (targetIdx === state.classCount - 1) {
        newBreaks.splice(targetIdx, 1);
      } else {
        newBreaks.splice(targetIdx + 1, 1);
      }

      const newColors = [...state.colors];
      newColors.splice(targetIdx, 1);

      const newOpacities = [...state.opacities];
      newOpacities.splice(targetIdx, 1);

      const newLabelEdited = [...state.labelEdited];
      newLabelEdited.splice(targetIdx, 1);

      const newLabels = [...state.labels];
      newLabels.splice(targetIdx, 1);

      // Perbarui label kelas yang tersisa di posisi targetIdx jika belum diedit manual
      const affectedIdx = Math.min(targetIdx, newLabels.length - 1);
      if (affectedIdx >= 0 && !newLabelEdited[affectedIdx]) {
        newLabels[affectedIdx] = formatClassLabel(
          newBreaks[affectedIdx],
          newBreaks[affectedIdx + 1],
          dataMin,
          dataMax,
          CLASSIFICATION_METHODS.MANUAL
        );
      }

      return {
        ...state,
        method: CLASSIFICATION_METHODS.MANUAL,
        classCount: state.classCount - 1,
        breaks: newBreaks,
        colors: newColors,
        opacities: newOpacities,
        labels: newLabels,
        labelEdited: newLabelEdited,
        _undo: snapshot,
      };
    }

    case "MERGE_CLASSES": {
      // Menggabungkan kelas idx1 dan idx2 yang bersebelahan
      const { index1, index2 } = action;
      const lower = Math.min(index1, index2);
      const upper = Math.max(index1, index2);
      if (upper !== lower + 1 || lower < 0 || upper >= state.classCount) {
        return state;
      }
      return classificationReducer(state, { type: "REMOVE_CLASS", index: upper });
    }

    case "SET_COLOR": {
      // Method tidak berubah
      const { index, color } = action;
      if (index < 0 || index >= state.classCount) return state;
      const snapshot = cloneStateForUndo(state);
      const newColors = [...state.colors];
      newColors[index] = color;
      return {
        ...state,
        colors: newColors,
        _undo: snapshot,
      };
    }

    case "SET_OPACITY": {
      // Method tidak berubah
      const { index, opacity } = action;
      if (index < 0 || index >= state.classCount) return state;
      const numOp = Number.isFinite(Number(opacity)) ? Math.max(0, Math.min(1, Number(opacity))) : 1.0;
      const snapshot = cloneStateForUndo(state);
      const newOpacities = [...state.opacities];
      newOpacities[index] = numOp;
      return {
        ...state,
        opacities: newOpacities,
        _undo: snapshot,
      };
    }

    case "SET_LABEL": {
      // Method tidak berubah, tandai labelEdited[index] = true
      const { index, label } = action;
      if (index < 0 || index >= state.classCount) return state;
      const snapshot = cloneStateForUndo(state);
      const newLabels = [...state.labels];
      newLabels[index] = String(label);
      const newLabelEdited = [...state.labelEdited];
      newLabelEdited[index] = true;
      return {
        ...state,
        labels: newLabels,
        labelEdited: newLabelEdited,
        _undo: snapshot,
      };
    }

    case "APPLY_RAMP": {
      // Hanya warna yang berubah, method tidak berubah
      const { rampId, baseColors } = action;
      const snapshot = cloneStateForUndo(state);
      const newColors = sampleRampColors(baseColors, state.classCount);
      return {
        ...state,
        rampId: rampId || state.rampId,
        colors: newColors,
        _undo: snapshot,
      };
    }

    case "APPLY_AUTO_METHOD": {
      // Dipanggil saat hasil endpoint backend /styles/raster-classify diterima
      const { method, breaks, rampColors } = action;
      if (!Array.isArray(breaks) || breaks.length < 2) return state;

      const snapshot = cloneStateForUndo(state);
      const normMethod = normalizeClassificationMethod(method);
      const newCount = breaks.length - 1;

      const newColors =
        rampColors && rampColors.length === newCount
          ? rampColors
          : sampleRampColors(state.colors, newCount);

      const newOpacities = Array(newCount).fill(1.0);
      const newLabelEdited = Array(newCount).fill(false);

      const newLabels = Array.from({ length: newCount }, (_, i) =>
        formatClassLabel(breaks[i], breaks[i + 1], dataMin, dataMax, normMethod)
      );

      return {
        ...state,
        method: normMethod,
        lastAutoMethod: normMethod,
        classCount: newCount,
        breaks: [...breaks],
        colors: newColors,
        opacities: newOpacities,
        labels: newLabels,
        labelEdited: newLabelEdited,
        presetId: null,
        _undo: snapshot,
      };
    }

    case "APPLY_PRESET": {
      // Preset application rules:
      // styleType "values" -> method 'unique_values'
      // "intervals"/"ramp" -> method 'manual'
      // Entry nodata (quantity 0 dan opacity 0) disimpan sebagai kelas khusus
      const { preset } = action;
      if (!preset || !Array.isArray(preset.classes)) return state;

      const snapshot = cloneStateForUndo(state);
      const rawClasses = preset.classes;

      const nodataEntry = rawClasses.find((c) => Number(c.quantity) === 0 && Number(c.opacity) === 0);
      const regularClasses = rawClasses.filter((c) => !(Number(c.quantity) === 0 && Number(c.opacity) === 0));

      const isValues = preset.styleType === "values";
      const targetMethod = isValues ? CLASSIFICATION_METHODS.UNIQUE_VALUES : CLASSIFICATION_METHODS.MANUAL;

      const count = regularClasses.length;
      const colors = regularClasses.map((c) => c.color || "#00e5ff");
      const opacities = regularClasses.map((c) => (c.opacity !== undefined ? Number(c.opacity) : 1.0));
      const labels = regularClasses.map((c) => c.label || `Class ${c.quantity}`);
      const labelEdited = Array(count).fill(true);

      let breaks = [];
      if (isValues) {
        breaks = regularClasses.map((c) => Number(c.quantity));
      } else {
        const b0 = dataMin !== undefined ? dataMin : 0;
        breaks = [b0, ...regularClasses.map((c) => Number(c.quantity))];
      }

      return {
        ...state,
        method: targetMethod,
        presetId: preset.id || null,
        classCount: count,
        breaks,
        colors,
        opacities,
        labels,
        labelEdited,
        nodataClass: nodataEntry
          ? {
              quantity: 0,
              color: nodataEntry.color || "#000000",
              opacity: 0,
              label: nodataEntry.label || "No Data",
            }
          : null,
        _undo: snapshot,
      };
    }

    case "UNDO": {
      if (!state._undo) return state;
      return {
        ...state._undo,
        _undo: null,
      };
    }

    default:
      return state;
  }
}

/**
 * Pemetaan state klasifikasi ke payload request POST /styles/apply (Kontrak bersama poin 4).
 *
 * @param {ClassificationState} state
 * @param {Object} [options]
 * @returns {Object}
 */
export function toApplyPayload(state, options = {}) {
  const derivedClasses = getClassesFromState(state);
  const colorEntries = [];

  // Jika ada nodataClass khusus preset, sertakan di awal
  if (state.nodataClass) {
    colorEntries.push({
      min: 0,
      max: 0,
      quantity: 0,
      color: state.nodataClass.color || "#000000",
      opacity: 0.0,
      label: state.nodataClass.label || "No Data",
      label_edited: true,
    });
  }

  for (const c of derivedClasses) {
    colorEntries.push({
      min: c.min,
      max: c.max,
      quantity: c.quantity,
      color: c.color,
      opacity: c.opacity,
      label: c.label,
      label_edited: c.label_edited,
    });
  }

  const isValues = state.method === CLASSIFICATION_METHODS.UNIQUE_VALUES;
  const styleType = isValues ? "values" : options.style_type || "intervals";

  return {
    layer_id: options.layer_id,
    workspace_name: options.workspace_name,
    layer_name: options.layer_name,
    layer_kind: "raster",
    style_name: options.style_name || (options.layer_name ? `style_${options.layer_name}` : undefined),
    style_type: styleType,
    classification_method: state.method,
    last_auto_method: state.lastAutoMethod,
    classes_count: colorEntries.length,
    color_ramp: state.rampId === "layer_style" ? "custom" : (state.rampId || "custom"),
    preset_id: state.presetId || null,
    breaks: state.breaks,
    label_edited: colorEntries.map((c) => Boolean(c.label_edited)),
    colors: colorEntries,
  };
}

/**
 * Memulihkan state klasifikasi dari format symbology tersimpan di database.
 * Mendukung symbology versi 2 maupun format warisan lama tanpa version.
 *
 * @param {Object} saved - Objek symbology yang disimpan di DB
 * @param {Object} [statistics] - Statistik raster
 * @returns {ClassificationState}
 */
export function fromSavedSymbology(saved, statistics = null) {
  if (!saved || typeof saved !== "object") {
    return createInitialClassificationState({ statistics });
  }

  const rawClasses = Array.isArray(saved.classes) ? saved.classes : [];
  const nodataEntry = rawClasses.find((c) => Number(c.quantity) === 0 && Number(c.opacity) === 0);
  const regularClasses = rawClasses.filter((c) => !(Number(c.quantity) === 0 && Number(c.opacity) === 0));

  // Tentukan metode klasifikasi
  let method = CLASSIFICATION_METHODS.MANUAL;
  if (saved.version === 2) {
    method = normalizeClassificationMethod(saved.classification_method);
  } else {
    // Data lama tanpa version: style_type values -> unique_values, lainnya -> manual
    const stType = saved.style_type || "intervals";
    if (stType === "values") {
      method = CLASSIFICATION_METHODS.UNIQUE_VALUES;
    } else if (saved.classification_method) {
      method = normalizeClassificationMethod(saved.classification_method);
    } else {
      method = CLASSIFICATION_METHODS.MANUAL;
    }
  }

  const lastAutoMethod = saved.last_auto_method
    ? normalizeClassificationMethod(saved.last_auto_method)
    : null;

  // Pulihkan titik batas (breaks)
  let breaks = [];
  if (Array.isArray(saved.breaks) && saved.breaks.length > 0) {
    breaks = saved.breaks.map(Number);
  } else if (regularClasses.length > 0) {
    if (method === CLASSIFICATION_METHODS.UNIQUE_VALUES) {
      breaks = regularClasses.map((c) => Number(c.quantity !== undefined ? c.quantity : c.max));
    } else {
      const firstMin =
        regularClasses[0].min !== undefined && regularClasses[0].min !== null
          ? Number(regularClasses[0].min)
          : statistics && Number.isFinite(statistics.min)
          ? statistics.min
          : Number(regularClasses[0].quantity || 0);

      breaks = [
        firstMin,
        ...regularClasses.map((c) => Number(c.max !== undefined ? c.max : c.quantity)),
      ];
    }
  }

  const count = regularClasses.length;
  const colors = regularClasses.map((c) => c.color || "#00e5ff");
  const opacities = regularClasses.map((c) => (c.opacity !== undefined ? Number(c.opacity) : 1.0));
  const labels = regularClasses.map((c) => c.label || "");
  const labelEdited = regularClasses.map((c) => Boolean(c.label_edited));

  return {
    method,
    lastAutoMethod,
    classCount: count,
    breaks,
    colors,
    labels,
    opacities,
    labelEdited,
    presetId: saved.preset_id || null,
    rampId: saved.color_ramp || "custom",
    statistics,
    nodataClass: nodataEntry
      ? {
          quantity: 0,
          color: nodataEntry.color || "#000000",
          opacity: 0,
          label: nodataEntry.label || "No Data",
        }
      : null,
    _undo: null,
  };
}

