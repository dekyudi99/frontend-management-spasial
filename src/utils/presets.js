/**
 * Preset klasifikasi cepat untuk styling raster.
 */

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

