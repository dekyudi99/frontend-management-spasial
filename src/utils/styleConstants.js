/**
 * Backward compatibility facade for style and classification constants.
 * Re-exports modularized utilities to ensure existing imports across AstraGIS remain functional.
 */

export * from "./colorRamps.js";
export * from "./presets.js";
export * from "./classificationFormat.js";
export * from "./classificationEngine.js";

import { equalIntervalBreaks } from "./classificationEngine.js";
import { sampleRampColors } from "./colorRamps.js";

/**
 * Backward-compatible helper for generating classification classes.
 * Uses pure equalIntervalBreaks without artificial math approximations.
 *
 * @param {Object} params
 * @returns {Array<Object>}
 */
export function generateClassificationClasses({ min, max, count, colors }) {
  const n = Math.max(1, Number(count) || 5);
  const dataMin = Number.isFinite(Number(min)) ? Number(min) : 0;
  const dataMax = Number.isFinite(Number(max)) ? Number(max) : 100;
  const breaks = equalIntervalBreaks(dataMin, dataMax, n);
  const rampColors = sampleRampColors(colors, n);
  const classes = [];

  for (let i = 0; i < n; i++) {
    const minVal = breaks[i];
    const maxVal = breaks[i + 1] !== undefined ? breaks[i + 1] : minVal;
    classes.push({
      min: minVal,
      max: maxVal,
      quantity: maxVal,
      color: rampColors[i] || "#00e5ff",
      opacity: 1.0,
      label: `${minVal} - ${maxVal}`,
      label_edited: false,
    });
  }
  return classes;
}
