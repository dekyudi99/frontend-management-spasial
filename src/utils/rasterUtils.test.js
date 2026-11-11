import test from "node:test";
import assert from "node:assert/strict";
import {
  isRasterLayer,
  isVectorLayer,
  getVisibleLayersForIdentify,
  buildRasterIdentifyPayload,
  validateBoundingBox,
  buildRasterStatsPayload,
  buildRasterClipPayload,
  formatRasterValue,
  matchRasterSymbology,
  parseBlobError,
} from "./rasterUtils.js";

test("isRasterLayer and isVectorLayer correctly classify layer types", () => {
  const raster1 = { layer_type: "TIF", store_name: "store_1" };
  const raster2 = { layer_kind: "raster" };
  const raster3 = { store_name: "ras_elevation", file_format: "GeoTIFF" };

  const vector1 = { layer_type: "GEOJSON", geom_type: "Point" };
  const vector2 = { layer_kind: "vector", table_name: "vec_table" };
  const vector3 = { file_format: "SHP", geom_type: "MultiPolygon" };

  assert.equal(isRasterLayer(raster1), true);
  assert.equal(isRasterLayer(raster2), true);
  assert.equal(isRasterLayer(raster3), true);
  assert.equal(isRasterLayer(vector1), false);

  assert.equal(isVectorLayer(vector1), true);
  assert.equal(isVectorLayer(vector2), true);
  assert.equal(isVectorLayer(vector3), true);
  assert.equal(isVectorLayer(raster1), false);
});

test("getVisibleLayersForIdentify filters visible layers and limits to maxCount", () => {
  const layers = [
    { id: "1", visible: true, name: "Layer 1" },
    { id: "2", visible: false, name: "Layer 2" },
    { id: "3", visible: true, name: "Layer 3" },
    { id: "4", visible: true, name: "Layer 4" },
    { id: "5", visible: true, name: "Layer 5" },
    { id: "6", visible: true, name: "Layer 6" },
  ];

  const visibleTop3 = getVisibleLayersForIdentify(layers, 3);
  assert.equal(visibleTop3.length, 3);
  assert.deepEqual(visibleTop3.map((l) => l.id), ["1", "3", "4"]);

  const visibleDefault = getVisibleLayersForIdentify(layers);
  assert.equal(visibleDefault.length, 5);
  assert.deepEqual(visibleDefault.map((l) => l.id), ["1", "3", "4", "5", "6"]);
});

test("buildRasterIdentifyPayload forms valid payload and rejects invalid inputs", () => {
  const valid = buildRasterIdentifyPayload({ lat: 14.178, lng: 100.216 });
  assert.deepEqual(valid, { lat: 14.178, lng: 100.216 });

  // Boundary coordinates
  assert.doesNotThrow(() => buildRasterIdentifyPayload({ lat: -90, lng: -180 }));
  assert.doesNotThrow(() => buildRasterIdentifyPayload({ lat: 90, lng: 180 }));

  // Rejects out of range
  assert.throws(() => buildRasterIdentifyPayload({ lat: 95, lng: 100 }), /Latitude/);
  assert.throws(() => buildRasterIdentifyPayload({ lat: 10, lng: 185 }), /Longitude/);
  assert.throws(() => buildRasterIdentifyPayload({ lat: NaN, lng: 100 }), /angka valid/);
  assert.throws(() => buildRasterIdentifyPayload({ lat: 10, lng: Infinity }), /angka valid/);
});

test("validateBoundingBox and buildRasterStatsPayload validate bbox strictly", () => {
  const validBbox = [100.0, 13.5, 100.5, 14.0];
  const payload = buildRasterStatsPayload({ bbox: validBbox, band: 1, bins: 25 });
  assert.deepEqual(payload, {
    bbox: [100.0, 13.5, 100.5, 14.0],
    band: 1,
    bins: 25,
  });

  // Rejects inverted bounds
  assert.throws(() => validateBoundingBox([100.5, 13.5, 100.0, 14.0]), /minLng.*lebih kecil/);
  assert.throws(() => validateBoundingBox([100.0, 14.5, 100.5, 14.0]), /minLat.*lebih kecil/);

  // Rejects out of range coordinates
  assert.throws(() => validateBoundingBox([-190, 10, 100, 20]), /Longitude/);
  assert.throws(() => validateBoundingBox([100, -95, 105, 20]), /Latitude/);
  assert.throws(() => validateBoundingBox([100, 10, 105]), /array dengan 4 angka/);
});

test("buildRasterClipPayload formats clip contract correctly", () => {
  const validBbox = [99.5, 13.0, 100.5, 14.0];
  const payload = buildRasterClipPayload({ bbox: validBbox, maxPixels: 2000000 });
  assert.deepEqual(payload, {
    bbox: [99.5, 13.0, 100.5, 14.0],
    styled: true,
    max_pixels: 2000000,
  });

  const styledFalsePayload = buildRasterClipPayload({
    bbox: validBbox,
    styled: false,
    mask_polygon: [[99.5, 13.0], [100.5, 13.0], [100.0, 14.0]]
  });
  assert.equal(styledFalsePayload.styled, false);
  assert.equal(styledFalsePayload.mask_polygon.length, 3);
});

test("formatRasterValue formats numbers, integers, and edge cases gracefully", () => {
  assert.equal(formatRasterValue(null), "-");
  assert.equal(formatRasterValue(undefined), "-");
  assert.equal(formatRasterValue(NaN), "-");
  assert.equal(formatRasterValue(Infinity), "-");

  // Integer
  assert.equal(formatRasterValue(5), "5");
  assert.equal(formatRasterValue(1000), "1,000");

  // Float
  assert.equal(formatRasterValue(3.14159, 2), "3.14");
  assert.equal(formatRasterValue(3.100, 2), "3.1");

  // Tiny float
  assert.equal(formatRasterValue(0.000045), "4.50e-5");
});

test("matchRasterSymbology matches interval and discrete classes correctly", () => {
  const intervalSymbology = {
    classes: [
      { min: 0, max: 10, color: "#00ff00", label: "Rendah" },
      { min: 10, max: 20, color: "#ffff00", label: "Sedang" },
      { min: 20, max: 30, color: "#ff0000", label: "Tinggi" },
    ],
  };

  const match1 = matchRasterSymbology(5, intervalSymbology);
  assert.deepEqual(match1, { color: "#00ff00", label: "Rendah" });

  const match2 = matchRasterSymbology(15, intervalSymbology);
  assert.deepEqual(match2, { color: "#ffff00", label: "Sedang" });

  // Last interval includes upper bound
  const match3 = matchRasterSymbology(30, intervalSymbology);
  assert.deepEqual(match3, { color: "#ff0000", label: "Tinggi" });

  // Out of range
  assert.equal(matchRasterSymbology(50, intervalSymbology), null);

  // Unique values
  const uniqueSymbology = {
    classes: [
      { value: 1, color: "#111111", label: "Air" },
      { value: 2, color: "#222222", label: "Hutan" },
      { value: 3, color: "#333333", label: "Sawah" },
    ],
  };
  const matchUnique = matchRasterSymbology(2, uniqueSymbology);
  assert.deepEqual(matchUnique, { color: "#222222", label: "Hutan" });
});

test("parseBlobError parses Blob error containing FastAPI JSON validation error", async () => {
  const pydanticErrorObj = {
    detail: [
      { loc: ["body", "bbox", 0], msg: "minLng must be less than maxLng", type: "value_error" },
    ],
  };
  const errorJsonStr = JSON.stringify(pydanticErrorObj);
  const blob = new Blob([errorJsonStr], { type: "application/json" });

  const axiosError = {
    response: {
      status: 422,
      data: blob,
    },
  };

  const errorMsg = await parseBlobError(axiosError);
  assert.ok(errorMsg.includes("minLng must be less than maxLng"));
  assert.ok(!errorMsg.includes("[object Object]")); // Prevents React crash
});

