/**
 * Color Ramp definitions, interpolation, and custom ramp localStorage management.
 */

export const COLOR_RAMP_PREVIEWS = [
  {
    id: "cyan_blue_magenta",
    name: "Cyan → Blue → Magenta",
    colors: ["#00e5ff", "#0044ff", "#ff00ee"],
  },
  {
    id: "blues",
    name: "Blues (Precipitation / Hydrology)",
    colors: ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"],
  },
  {
    id: "viridis",
    name: "Viridis (Scientific Perceptual)",
    colors: ["#440154", "#3b528b", "#21908c", "#5dc863", "#fde725"],
  },
  {
    id: "spectral",
    name: "Spectral (Rainbow Multi-Class)",
    colors: ["#2b83ba", "#abdda4", "#ffffbf", "#fdae61", "#d7191c"],
  },
  {
    id: "traffic_light",
    name: "Traffic Light (Green → Yellow → Red)",
    colors: ["#1a9641", "#a6d96a", "#ffffbf", "#fdae61", "#d7191c"],
  },
  {
    id: "magma",
    name: "Magma (Heat / High Contrast)",
    colors: ["#000004", "#51127c", "#b73779", "#fb8861", "#fcfdbf"],
  },
  {
    id: "greens",
    name: "Greens (Vegetation / Biomass)",
    colors: ["#edf8fb", "#b2e2e2", "#66c2a4", "#2ca25f", "#006d2c"],
  },
  {
    id: "reds",
    name: "Reds (Hazard / Extreme Heat)",
    colors: ["#fee5d9", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"],
  },
  {
    id: "terrain",
    name: "Terrain (Topography / Elevation)",
    colors: ["#33a02c", "#b2df8a", "#ffff99", "#fdbf6f", "#ff7f00", "#e31a1c"],
  },
];

// Palet kualitatif kontras tinggi khusus untuk kategori diskrit / Unique Values
export const QUALITATIVE_PALETTES = [
  {
    id: "qualitative_paired",
    name: "Paired (High Contrast Qualitative)",
    colors: [
      "#1f78b4",
      "#33a02c",
      "#e31a1c",
      "#ff7f00",
      "#6a3d9a",
      "#b15928",
      "#a6cee3",
      "#b2df8a",
      "#fb9a99",
      "#fdbf6f",
      "#cab2d6",
      "#ffff99",
    ],
  },
  {
    id: "qualitative_set1",
    name: "Set 1 (Bold Discrete Categories)",
    colors: [
      "#e41a1c",
      "#377eb8",
      "#4daf4a",
      "#984ea3",
      "#ff7f00",
      "#ffff33",
      "#a65628",
      "#f781bf",
      "#999999",
    ],
  },
];

export const STORAGE_CUSTOM_RAMPS_KEY = "gis_custom_color_ramps";

export const loadSavedCustomRamps = () => {
  try {
    const raw = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_CUSTOM_RAMPS_KEY) : null;
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomRampsToStorage = (ramps) => {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(STORAGE_CUSTOM_RAMPS_KEY, JSON.stringify(ramps));
    }
  } catch (e) {
    // ignore or log
  }
};

/**
 * Interpolasi warna hex antara color1 dan color2 dengan faktor 0.0 sampai 1.0.
 */
export function interpolateColor(color1, color2, factor) {
  const c1 = parseInt(color1.replace("#", ""), 16);
  const c2 = parseInt(color2.replace("#", ""), 16);
  const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255;
  const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255;
  const r = Math.round(r1 + factor * (r2 - r1));
  const g = Math.round(g1 + factor * (g2 - g1));
  const b = Math.round(b1 + factor * (b2 - b1));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Mengambil N warna halus dari Color Ramp.
 */
export function sampleRampColors(baseColors, count) {
  if (!baseColors || baseColors.length === 0) return Array(Math.max(1, count)).fill("#00e5ff");
  const n = Math.max(1, count);
  if (n === 1) return [baseColors[0]];
  if (baseColors.length === 1) return Array(n).fill(baseColors[0]);

  const result = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const pos = t * (baseColors.length - 1);
    const idx = Math.floor(pos);
    const frac = pos - idx;
    if (idx >= baseColors.length - 1) {
      result.push(baseColors[baseColors.length - 1]);
    } else {
      result.push(interpolateColor(baseColors[idx], baseColors[idx + 1], frac));
    }
  }
  return result;
}

/**
 * Mencari color ramp yang paling cocok dari daftar ramps berdasarkan array warna hex.
 */
export function findMatchingColorRamp(targetColors, ramps = COLOR_RAMP_PREVIEWS) {
  if (!targetColors || targetColors.length === 0) return null;
  const hexes = targetColors.map((c) => String(c).toLowerCase().trim());
  // 1. Direct exact match
  for (const ramp of ramps) {
    if (ramp.colors.length === hexes.length) {
      const match = ramp.colors.every((c, i) => c.toLowerCase() === hexes[i]);
      if (match) return ramp;
    }
  }
  // 2. Sample match
  for (const ramp of ramps) {
    const sampled = sampleRampColors(ramp.colors, hexes.length).map((c) => c.toLowerCase());
    const match = sampled.every((c, i) => c === hexes[i]);
    if (match) return ramp;
  }
  return null;
}

