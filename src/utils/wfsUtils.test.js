import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateToleranceMeters,
  getTopVisibleVectorLayer,
  filterOperatorsForType,
  formatFilterPayload,
  updateLayerInCacheData,
  buildIdentifyPayload,
  extractApiError,
} from "./wfsUtils.js";

test("calculateToleranceMeters computes realistic ground meters per pixel", () => {
  // At equator (lat 0), zoom 0: ~156,543 m/px * 8 = ~1,252,344 m
  const tolZ0 = calculateToleranceMeters(0, 0, 8);
  assert.ok(tolZ0 > 1000000);

  // At equator, zoom 10: 156543 / 1024 * 8 ≈ 1223 m
  const tolZ10 = calculateToleranceMeters(0, 10, 8);
  assert.ok(tolZ10 > 1100 && tolZ10 < 1400);

  // Zoom 18: high resolution, tolerance should be small (few meters)
  const tolZ18 = calculateToleranceMeters(0, 18, 8);
  assert.ok(tolZ18 > 2 && tolZ18 < 10);
});

test("getTopVisibleVectorLayer picks top visible vector layer", () => {
  const layers = [
    { id: "1", visible: false, layer_type: "GEOJSON" },
    { id: "2", visible: true, layer_type: "TIF" }, // raster
    { id: "3", visible: true, layer_type: "GEOJSON", geom_type: "MultiPolygon" }, // vector top visible
    { id: "4", visible: true, layer_type: "SHP" },
  ];

  const top = getTopVisibleVectorLayer(layers);
  assert.equal(top?.id, "3");

  const noVector = getTopVisibleVectorLayer([{ id: "2", visible: true, layer_type: "TIF" }]);
  assert.equal(noVector, null);
});

test("filterOperatorsForType returns expected operators per type", () => {
  const strOps = filterOperatorsForType("string");
  assert.ok(strOps.includes("ILIKE"));
  assert.ok(strOps.includes("LIKE"));

  const numOps = filterOperatorsForType("number");
  assert.ok(numOps.includes(">="));
  assert.ok(numOps.includes("<="));
  assert.ok(!numOps.includes("ILIKE"));

  const boolOps = filterOperatorsForType("boolean");
  assert.deepEqual(boolOps, ["=", "!=", "IS NULL", "IS NOT NULL"]);
});

test("formatFilterPayload constructs valid backend filter payload", () => {
  const rows = [
    { column: "site_name", operator: "ILIKE", value: "Bridge%" },
    { column: "category", operator: "IN", value: "A, B, C" },
    { column: "geom", operator: "IS NOT NULL", value: "" },
  ];

  const payload = formatFilterPayload(rows);
  assert.equal(Array.isArray(payload), true);
  assert.equal(payload.length, 3);
  assert.equal(payload[0].field, "site_name");
  assert.equal(payload[0].op, "ILIKE");
  assert.deepEqual(payload[1].value, ["A", "B", "C"]);
  assert.equal(payload[2].value, null);

  assert.equal(formatFilterPayload([]), null);
  assert.equal(formatFilterPayload(null), null);
});

test("updateLayerInCacheData immutably updates matching layer", () => {
  const oldCache = {
    code: 200,
    data: {
      data: [
        { id: "layer-1", name: "Layer 1", service_mode: "wms", gwc_ready: false },
        { id: "layer-2", name: "Layer 2", service_mode: "wms", gwc_ready: false },
      ],
      pagination: { total: 2 },
    },
  };

  const newCache = updateLayerInCacheData(oldCache, "layer-1", {
    service_mode: "wmts",
    gwc_ready: true,
    gwc_url: "http://example.com/geoserver/gwc/service/wmts",
  });

  assert.notEqual(oldCache, newCache);
  assert.equal(oldCache.data.data[0].service_mode, "wms"); // unchanged old cache
  assert.equal(newCache.data.data[0].service_mode, "wmts");
  assert.equal(newCache.data.data[0].gwc_ready, true);
  assert.equal(newCache.data.data[1].service_mode, "wms"); // other layer untouched
});

test("buildIdentifyPayload creates contract-compliant identify payload with fractional zoom", () => {
  const p1 = buildIdentifyPayload({ lat: 13.66119, lng: 100.22843, zoom: 10.5, pixelTolerance: 8.0 });
  assert.deepEqual(p1, {
    lat: 13.66119,
    lng: 100.22843,
    zoom: 10.5,
    tolerance_px: 8.0,
  });

  const p2 = buildIdentifyPayload({ lat: -7.1, lng: 110.2, zoom: 12.33 });
  assert.equal(p2.zoom, 12.33);
  assert.equal(p2.tolerance_px, 8.0); // default
});

test("extractApiError safely formats Pydantic validation error array without crashing React", () => {
  // Exact structure produced by FastAPI 422:
  const pydanticErr = {
    response: {
      status: 422,
      data: {
        detail: [
          { type: "missing", loc: ["body", "lng"], msg: "Field required", input: { lat: 13.6 } },
          { type: "missing", loc: ["body", "zoom"], msg: "Field required", input: { lat: 13.6 } },
        ],
      },
    },
  };

  const errStr = extractApiError(pydanticErr);
  assert.equal(typeof errStr, "string");
  assert.equal(errStr, "lng: Field required; zoom: Field required");

  // String detail
  const strErr = { response: { data: { detail: "Layer not found" } } };
  assert.equal(extractApiError(strErr), "Layer not found");

  // Object detail with message
  const objErr = { response: { data: { detail: { message: "Internal GeoServer error" } } } };
  assert.equal(extractApiError(objErr), "Internal GeoServer error");

  // Generic Error object
  const genErr = new Error("Network timeout");
  assert.equal(extractApiError(genErr), "Network timeout");
});

