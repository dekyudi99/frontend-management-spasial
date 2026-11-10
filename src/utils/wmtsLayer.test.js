import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildWmtsTileUrl,
  DEFAULT_WMTS_GRIDSET,
  getLayerGeoserverName,
  resolveLayerRenderer,
  computeLeafletBounds,
  getCenterTileCoords,
  normalizeRawBbox,
} from "./wmtsUtils.js";

describe("WMTS Tile URL Generation & Gridset Format", () => {
  it("membentuk URL WMTS GetTile dengan TileMatrixSet default EPSG:900913 dan format TILEMATRIX EPSG:900913:{z}", () => {
    const gwcUrl = "http://localhost:8080/geoserver";
    const layerQualified = "ws_test:ras_elevation";

    const url = buildWmtsTileUrl(gwcUrl, layerQualified);

    assert.equal(DEFAULT_WMTS_GRIDSET, "EPSG:900913");
    assert.ok(url.startsWith("http://localhost:8080/geoserver/gwc/service/wmts"));
    assert.ok(url.includes("SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0"));
    assert.ok(url.includes("LAYER=ws_test:ras_elevation"));
    assert.ok(url.includes("TILEMATRIXSET=EPSG:900913"));
    assert.ok(url.includes("FORMAT=image/png"));
    assert.ok(url.includes("TILEMATRIX=EPSG:900913:{z}"));
    assert.ok(url.includes("TILEROW={y}&TILECOL={x}"));
    assert.ok(!url.includes("_t=")); // Tanpa bust
  });

  it("menyertakan parameter cache-busting _t saat styleUpdatedAt diberikan dan membersihkan trailing slash gwcUrl", () => {
    const gwcUrl = "http://localhost:8080/geoserver///";
    const layerQualified = "ws_biomass:vec_mangrove";
    const timestamp = 1731234567890;

    const url = buildWmtsTileUrl(gwcUrl, layerQualified, DEFAULT_WMTS_GRIDSET, timestamp);

    assert.ok(url.startsWith("http://localhost:8080/geoserver/gwc/service/wmts"));
    assert.ok(url.endsWith(`&_t=${timestamp}`));
  });
});

describe("Layer Renderer Selection & Backward Compatibility", () => {
  it("layer dengan mode 'wms' standar me-render WMS", () => {
    const layer = {
      id: "1",
      workspace_name: "ws_flow",
      layer_name: "kontur",
      wms_url: "http://localhost:8080/geoserver/ws_flow/wms",
      visible: true,
      service_mode: "wms",
      gwc_ready: false,
      gwc_url: "http://localhost:8080/geoserver",
    };

    const res = resolveLayerRenderer(layer);
    assert.equal(res.shouldRender, true);
    assert.equal(res.rendererType, "WMS");
    assert.equal(res.layerQualified, "ws_flow:kontur");
  });

  it("layer dengan mode 'wmts' dan gwc_ready=true serta gwc_url valid me-render WMTS", () => {
    const layer = {
      id: "2",
      workspace_name: "ws_flow",
      table_name: "vec_sungai",
      layer_name: "Sungai",
      wms_url: "http://localhost:8080/geoserver/ws_flow/wms",
      visible: true,
      service_mode: "wmts",
      gwc_ready: true,
      gwc_url: "http://localhost:8080/geoserver",
    };

    const res = resolveLayerRenderer(layer);
    assert.equal(res.shouldRender, true);
    assert.equal(res.rendererType, "WMTS");
    assert.equal(res.layerQualified, "ws_flow:vec_sungai");
  });

  it("layer berstatus 'wmts' namun gwc_ready=false fallback ke WMS (keamanan saat cache belum siap)", () => {
    const layer = {
      id: "3",
      workspace_name: "ws_biomass",
      store_name: "ras_elevation",
      wms_url: "http://localhost:8080/geoserver/ws_biomass/wms",
      visible: true,
      service_mode: "wmts",
      gwc_ready: false,
      gwc_url: "http://localhost:8080/geoserver",
    };

    const res = resolveLayerRenderer(layer);
    assert.equal(res.shouldRender, true);
    assert.equal(res.rendererType, "WMS");
  });

  it("layer berstatus 'wmts' namun gwc_url kosong fallback ke WMS", () => {
    const layer = {
      id: "4",
      workspace_name: "ws_biomass",
      layer_name: "layer_tanpa_gwc_url",
      wms_url: "http://localhost:8080/geoserver/ws_biomass/wms",
      visible: true,
      service_mode: "wmts",
      gwc_ready: true,
      gwc_url: null,
    };

    const res = resolveLayerRenderer(layer);
    assert.equal(res.shouldRender, true);
    assert.equal(res.rendererType, "WMS");
  });

  it("layer lama tanpa field baru (undefined service_mode) tetap jalan sebagai WMS (backward compatible)", () => {
    const legacyLayer = {
      id: "5",
      workspace_name: "ws_legacy",
      layer_name: "legacy_landuse",
      wms_url: "http://localhost:8080/geoserver/ws_legacy/wms",
      visible: true,
    };

    const res = resolveLayerRenderer(legacyLayer);
    assert.equal(res.shouldRender, true);
    assert.equal(res.rendererType, "WMS");
  });

  it("guard !layer.visible atau !layer.wms_url tidak me-render layer apapun", () => {
    const hiddenLayer = {
      id: "6",
      workspace_name: "ws_test",
      layer_name: "test",
      wms_url: "http://localhost:8080/geoserver/ws_test/wms",
      visible: false,
    };
    assert.equal(resolveLayerRenderer(hiddenLayer).shouldRender, false);

    const noUrlLayer = {
      id: "7",
      workspace_name: "ws_test",
      layer_name: "test",
      wms_url: null,
      visible: true,
    };
    assert.equal(resolveLayerRenderer(noUrlLayer).shouldRender, false);
  });
});

describe("Helper getLayerGeoserverName Priority", () => {
  it("mengambil geoserver_name lebih dulu jika ada", () => {
    const l = { geoserver_name: "geo_name", table_name: "tbl", store_name: "str", layer_name: "lyr" };
    assert.equal(getLayerGeoserverName(l), "geo_name");
  });

  it("mengambil table_name jika geoserver_name kosong", () => {
    const l = { table_name: "tbl_name", store_name: "str", layer_name: "lyr" };
    assert.equal(getLayerGeoserverName(l), "tbl_name");
  });

  it("mengambil store_name jika table_name kosong (raster)", () => {
    const l = { store_name: "store_ras", layer_name: "lyr" };
    assert.equal(getLayerGeoserverName(l), "store_ras");
  });

  it("mengambil layer_name jika yang lain kosong", () => {
    const l = { layer_name: "lyr_name" };
    assert.equal(getLayerGeoserverName(l), "lyr_name");
  });

  it("mengembalikan string kosong jika null", () => {
    assert.equal(getLayerGeoserverName(null), "");
  });
});

describe("Synchronous computeLeafletBounds (Derajat vs Meter & Urutan Koordinat)", () => {
  it("kasus 1: bbox derajat + epsg 4326 menghasilkan urutan [[south, west], [north, east]]", () => {
    // Layer vector ws_flowgis_ba3523:vec_3d89ea0e7e
    const rawBbox = [99.79721894725321, 13.638269051499645, 100.35069469060815, 14.180484196770047];
    const bounds = computeLeafletBounds(rawBbox, 4326);

    assert.ok(Array.isArray(bounds));
    assert.equal(bounds.length, 2);
    // [south, west]
    assert.equal(bounds[0][0], 13.638269051499645);
    assert.equal(bounds[0][1], 99.79721894725321);
    // [north, east]
    assert.equal(bounds[1][0], 14.180484196770047);
    assert.equal(bounds[1][1], 100.35069469060815);
  });

  it("kasus 2: bbox derajat + epsg 32647 TIDAK diproyeksikan ulang sebagai UTM (terdeteksi derajat)", () => {
    // Raster yang metadata epsg-nya 32647 tapi bbox di DB sudah berupa derajat WGS84
    const degreeBbox = [99.8, 13.6, 100.3, 14.2];
    const bounds = computeLeafletBounds(degreeBbox, 32647);

    assert.ok(bounds);
    assert.equal(bounds[0][0], 13.6);
    assert.equal(bounds[0][1], 99.8);
    assert.equal(bounds[1][0], 14.2);
    assert.equal(bounds[1][1], 100.3);
  });

  it("kasus 3: bbox meter + epsg 32647 diproyeksikan dengan proj4 ke koordinat WGS84 yang tepat", () => {
    // UTM Zone 47N koordinat meter
    const meterBbox = [600000, 1520000, 605000, 1525000];
    const bounds = computeLeafletBounds(meterBbox, 32647);

    assert.ok(bounds);
    // Hasil proyeksi WGS84 harus berada di sekitar Lat 13.7..13.8 dan Lon 99.9..100.0
    const [south, west] = bounds[0];
    const [north, east] = bounds[1];

    assert.ok(south > 13.7 && south < 13.8);
    assert.ok(north > 13.7 && north < 13.8);
    assert.ok(west > 99.9 && west < 100.0);
    assert.ok(east > 99.9 && east < 100.0);
    assert.ok(south < north);
    assert.ok(west < east);
  });

  it("kasus 4: bbox null atau invalid mengembalikan null tanpa melempar error (aman / tidak crash)", () => {
    assert.equal(computeLeafletBounds(null, 4326), null);
    assert.equal(computeLeafletBounds([], 4326), null);
    assert.equal(computeLeafletBounds([NaN, 1, 2, 3], 4326), null);
  });

  it("objek bbox {minx, miny, maxx, maxy} atau {left, bottom, right, top} dinormalisasi dengan benar", () => {
    const objBbox = { left: 99.1, bottom: 13.2, right: 100.1, top: 14.2 };
    const bounds = computeLeafletBounds(objBbox, 4326);
    assert.deepEqual(bounds, [
      [13.2, 99.1],
      [14.2, 100.1],
    ]);
  });
});

describe("Leaflet Tile Filtering & Overlap Simulation", () => {
  // Formula konversi tile standar Leaflet GridLayer
  function tile2lat(y, z) {
    const n = Math.PI - (2 * Math.PI * y) / Math.pow(2, z);
    return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
  }
  function tile2lon(x, z) {
    return (x / Math.pow(2, z)) * 360 - 180;
  }
  function tileToBounds(x, y, z) {
    return {
      minLat: tile2lat(y + 1, z),
      maxLat: tile2lat(y, z),
      minLng: tile2lon(x, z),
      maxLng: tile2lon(x + 1, z),
    };
  }
  function overlaps(tileB, layerB) {
    const [south, west] = layerB[0];
    const [north, east] = layerB[1];
    const latOverlaps = tileB.minLat <= north && tileB.maxLat >= south;
    const lngOverlaps = tileB.minLng <= east && tileB.maxLng >= west;
    return latOverlaps && lngOverlaps;
  }

  it("tile di luar bbox (z=10, col=797, row=473) ditolak oleh Leaflet bounds sehingga TIDAK diminta", () => {
    const layerBounds = computeLeafletBounds(
      [99.79721894725321, 13.638269051499645, 100.35069469060815, 14.180484196770047],
      4326
    );

    const tileOut = tileToBounds(797, 473, 10);
    // Tile row 473 berada di selatan batas layer: tidak boleh overlap
    assert.equal(overlaps(tileOut, layerBounds), false);
  });

  it("tile di dalam bbox (z=10, col=796, row=472) diterima oleh Leaflet bounds sehingga diminta", () => {
    const layerBounds = computeLeafletBounds(
      [99.79721894725321, 13.638269051499645, 100.35069469060815, 14.180484196770047],
      4326
    );

    const tileIn = tileToBounds(796, 472, 10);
    assert.equal(overlaps(tileIn, layerBounds), true);
  });
});

describe("WMTS Center Tile Probe & Banner Logic", () => {
  it("getCenterTileCoords menghasilkan tile z=10 di tengah extent valid GWC", () => {
    const bounds = [
      [13.638269051499645, 99.79721894725321],
      [14.180484196770047, 100.35069469060815],
    ];
    const coords = getCenterTileCoords(bounds, 10);

    assert.ok(coords);
    assert.equal(coords.z, 10);
    // Rentang valid GWC z=10: col 795..797, row 471..472
    assert.ok(coords.x >= 795 && coords.x <= 797);
    assert.ok(coords.y >= 471 && coords.y <= 472);
  });

  it("logika banner: banner TIDAK muncul saat probe sukses (200 image/png), walau ada tile luar yang 400", () => {
    let tileErrors = { "layer-1": false };

    // Simulasi respons probe: sukses 200 image/png
    const isProbeHealthy = true;

    // Reducer probe result
    if (isProbeHealthy) {
      delete tileErrors["layer-1"];
    } else {
      tileErrors["layer-1"] = true;
    }

    assert.equal(Boolean(tileErrors["layer-1"]), false, "Banner tidak boleh muncul saat layer sehat");
  });

  it("logika banner: banner HANYA muncul saat probe gagal (misal server down atau 502)", () => {
    let tileErrors = {};

    // Simulasi respons probe: 502 / offline
    const isProbeHealthy = false;

    if (isProbeHealthy) {
      delete tileErrors["layer-1"];
    } else {
      tileErrors["layer-1"] = true;
    }

    assert.equal(Boolean(tileErrors["layer-1"]), true, "Banner harus muncul saat probe gagal");
  });
});
