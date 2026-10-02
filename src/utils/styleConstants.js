// Standard Color Ramp palettes
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

// Presets untuk template klasifikasi cepat
export const PRESETS = [
  {
    id: "flood_risk",
    name: "Flood Risk (5 Classes)",
    description: "Blue to Red standard risk assessment",
    styleType: "values",
    classes: [
      { quantity: 0, color: "#000000", opacity: 0.0, label: "No Data" },
      { quantity: 1, color: "#2b83ba", opacity: 1.0, label: "Very Low" },
      { quantity: 2, color: "#abdda4", opacity: 1.0, label: "Low" },
      { quantity: 3, color: "#ffffbf", opacity: 1.0, label: "Moderate" },
      { quantity: 4, color: "#fdae61", opacity: 1.0, label: "High" },
      { quantity: 5, color: "#d7191c", opacity: 1.0, label: "Very High" },
    ],
  },
  {
    id: "flood_event",
    name: "Inundation / Flood Detection",
    description: "Highlight flood-affected areas",
    styleType: "values",
    classes: [
      { quantity: 0, color: "#000000", opacity: 0.0, label: "Non-Flooded" },
      { quantity: 1, color: "#e31a1c", opacity: 1.0, label: "Inundated Area" },
    ],
  },
  {
    id: "rainfall",
    name: "Precipitation / Rainfall (Blues)",
    description: "Rainfall intensity gradation from light to extreme",
    styleType: "intervals",
    classes: [
      { quantity: 0, color: "#000000", opacity: 0.0, label: "0 mm" },
      { quantity: 20, color: "#c6dbef", opacity: 0.8, label: "Light (<20)" },
      { quantity: 50, color: "#6baed6", opacity: 0.85, label: "Moderate (20-50)" },
      { quantity: 100, color: "#2171b5", opacity: 0.9, label: "Heavy (50-100)" },
      { quantity: 150, color: "#08306b", opacity: 1.0, label: "Very Heavy (>100)" },
    ],
  },
  {
    id: "traffic_light",
    name: "Traffic Light (Green - Red)",
    description: "Hazard alert scheme",
    styleType: "values",
    classes: [
      { quantity: 0, color: "#000000", opacity: 0.0, label: "Safe" },
      { quantity: 1, color: "#1a9641", opacity: 1.0, label: "Safe / Green" },
      { quantity: 2, color: "#a6d96a", opacity: 1.0, label: "Low Alert" },
      { quantity: 3, color: "#ffffbf", opacity: 1.0, label: "Alert" },
      { quantity: 4, color: "#fdae61", opacity: 1.0, label: "Warning" },
      { quantity: 5, color: "#d7191c", opacity: 1.0, label: "Critical" },
    ],
  },
  {
    id: "viridis",
    name: "Viridis (Scientific)",
    description: "Perceptually uniform, colorblind-friendly",
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

export const STORAGE_CUSTOM_RAMPS_KEY = "gis_custom_color_ramps";

export const loadSavedCustomRamps = () => {
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_RAMPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
};

export const saveCustomRampsToStorage = (ramps) => {
  try {
    localStorage.setItem(STORAGE_CUSTOM_RAMPS_KEY, JSON.stringify(ramps));
  } catch (e) {
    console.error("Gagal menyimpan custom color ramps:", e);
  }
};

// Interpolasi warna hex
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

// Mengambil N warna halus dari Color Ramp
export function sampleRampColors(baseColors, count) {
  if (!baseColors || baseColors.length === 0) return Array(count).fill("#00e5ff");
  if (count <= 1) return [baseColors[0]];
  if (baseColors.length === 1) return Array(count).fill(baseColors[0]);

  const result = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
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

// Menghitung titik batas (breaks) statistik
export function calculateBreaks(min, max, count, method = "jenks") {
  const c = Math.max(1, Number(count) || 5);
  const start = Number(min) || 0;
  const end = Number(max) || 100;
  const range = end - start;

  if (range <= 0) {
    const breaks = [];
    for (let i = 0; i <= c; i++) {
      breaks.push(Number((start + i).toFixed(2)));
    }
    return breaks;
  }

  const breaks = [start];
  for (let i = 1; i < c; i++) {
    const t = i / c;
    let val;
    if (method === "jenks") {
      const curved = Math.pow(t, 1.25);
      val = start + curved * range;
    } else if (method === "quantile") {
      const curved = 0.5 * (1 + Math.sin((t - 0.5) * Math.PI));
      val = start + curved * range;
    } else {
      // equal_interval
      val = start + t * range;
    }
    breaks.push(Number(val.toFixed(2)));
  }
  breaks.push(Number(end.toFixed(2)));
  return breaks;
}

// DRY Classification Engine
export function generateClassificationClasses({ min, max, count, method = "jenks", colors }) {
  const n = Math.max(1, Number(count) || 5);
  const breaks = calculateBreaks(min, max, n, method);
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
    });
  }
  return classes;
}
