import axios from "axios";
import { ensureS2SKey } from "./WorkspaceApi";

import { MICROSERVICE_API, GEOSERVER_BASE_URL } from "./microserviceConfig";

const MICROSERVICE_URL = MICROSERVICE_API;
export { GEOSERVER_BASE_URL };

// Cache to map layer ID -> { workspace_name, layer_name } for deletions
let layersCache = new Map();

const getAuthHeaders = async (isMultipart = false) => {
    const key = await ensureS2SKey();
    const headers = {
        "X-API-Key": key
    };
    if (!isMultipart) {
        headers["Content-Type"] = "application/json";
    }
    return headers;
};

const layerApi = {
    // 1. Upload & Publish Layer directly to GeoServer Microservice
    create: async (formData) => {
        const headers = await getAuthHeaders(true);
        const file = formData.get("file");
        const filename = file?.name || "";
        const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
        const isRaster = [".tif", ".tiff"].includes(ext);

        const targetEndpoint = isRaster
            ? `${MICROSERVICE_URL}/layers/publish-raster`
            : `${MICROSERVICE_URL}/layers/publish-vector`;

        // Normalize workspace_name key for microservice
        const wsName = formData.get("workspace_name") || formData.get("workspace_id");
        if (wsName && !formData.has("workspace_name")) {
            formData.append("workspace_name", wsName);
        }

        try {
            const res = await axios.post(targetEndpoint, formData, { headers });
            return {
                data: {
                    success: true,
                    data: res.data,
                    detail: isRaster 
                        ? `Raster layer '${res.data?.title || formData.get("layer_name")}' berhasil dipublikasikan!` 
                        : `Vector layer '${res.data?.title || formData.get("layer_name")}' berhasil dipublikasikan!`
                }
            };
        } catch (err) {
            const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Gagal mempublikasikan layer ke GeoServer.";
            throw new Error(errMsg);
        }
    },

    // 2. List all layers belonging to user API key
    list: async (params = {}) => {
        const headers = await getAuthHeaders(false);
        try {
            const res = await axios.get(`${MICROSERVICE_URL}/layers/my-layers`, { headers });
            let items = Array.isArray(res.data?.data) ? res.data.data : [];

            // Update cache
            items.forEach(item => {
                const info = {
                    id: item.id,
                    workspace_name: item.workspace_name,
                    layer_name: item.layer_name,
                    display_name: item.display_name || item.layer_name,
                    geoserver_name: item.geoserver_name || item.store_name || item.table_name || item.layer_name
                };
                layersCache.set(String(item.id), info);
                layersCache.set(`${item.workspace_name}:${item.layer_name}`, info);
                if (item.geoserver_name) {
                    layersCache.set(`${item.workspace_name}:${item.geoserver_name}`, info);
                }
            });

            // Client-side filter by workspace if requested (supports hashed ID or technical name)
            if (params.workspace_id) {
                const target = String(params.workspace_id).trim();
                items = items.filter(l => 
                    l.workspace_name === target || 
                    l.workspace_id === target || 
                    l.workspace_hashed_id === target
                );
            }
            if (params.search) {
                const q = params.search.toLowerCase();
                items = items.filter(l => 
                    (l.display_name || "").toLowerCase().includes(q) ||
                    (l.layer_name || "").toLowerCase().includes(q) || 
                    (l.workspace_name || "").toLowerCase().includes(q) ||
                    (l.geoserver_name || "").toLowerCase().includes(q)
                );
            }

            // Always sort newest first (created_at DESC) so newly uploaded layers appear on Page 1
            items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

            // Client-side pagination if requested
            const page = Number(params.page) || 1;
            const size = Number(params.size) || 10;
            const total = items.length;
            const start = (page - 1) * size;
            const paginatedItems = items.slice(start, start + size);

            return {
                data: {
                    success: true,
                    total,
                    data: paginatedItems.map(item => {
                        const rawType = String(item.file_format || item.data_type || item.file_path || "").toLowerCase();
                        let fmt = "TIF";
                        if (rawType.includes("kmz")) fmt = "KMZ";
                        else if (rawType.includes("kml")) fmt = "KML";
                        else if (rawType.includes("csv")) fmt = "CSV";
                        else if (rawType.includes("geojson") || rawType.includes(".json")) fmt = "GEOJSON";
                        else if (rawType.includes("shp") || rawType.includes("zip") || rawType.includes("shapefile")) fmt = "SHP";
                        else if (rawType.includes("tif") || rawType.includes("tiff") || item.type === "raster" || item.store_name) fmt = "TIF";
                        else if (item.geom_type || item.table_name || item.type === "vector") fmt = "SHP";

                        return {
                            id: item.id,
                            display_name: item.display_name || item.layer_name,
                            layer_name: item.display_name || item.layer_name,
                            workspace_id: item.workspace_id || item.workspace_hashed_id || item.workspace_name,
                            workspace_hashed_id: item.workspace_hashed_id || item.workspace_id,
                            workspace_name: item.workspace_name,
                            workspace_display_name: item.workspace_display_name || item.workspace_name,
                            geoserver_name: item.geoserver_name || item.table_name || item.store_name || item.layer_name,
                            table_name: item.table_name,
                            store_name: item.store_name,
                            data_type: fmt,
                            file_format: fmt.toLowerCase(),
                            layer_type: (fmt === "TIF" || item.type === "raster") ? "raster" : "vector",
                            geom_type: item.geom_type || item.geometry_type || null,
                            geometry_type: item.geometry_type || item.geom_type || null,
                            symbology: item.symbology || null,
                            style_name: item.style_name || null,
                            wms_url: item.wms_url,
                            created_at: item.created_at,
                            bbox: Array.isArray(item.bbox)
                                ? item.bbox
                                : (item.bbox && typeof item.bbox === "object"
                                    ? [item.bbox.minx ?? item.bbox.left ?? item.bbox.minLng, item.bbox.miny ?? item.bbox.bottom ?? item.bbox.minLat, item.bbox.maxx ?? item.bbox.right ?? item.bbox.maxLng, item.bbox.maxy ?? item.bbox.top ?? item.bbox.maxLat]
                                    : item.bbox),
                            feature_count: item.feature_count,
                            epsg: item.epsg || item.srid || 4326,
                            visible: true
                        };
                    }),
                    pagination: {
                        total,
                        page,
                        size
                    }
                }
            };
        } catch (err) {
            console.error("Gagal mengambil daftar layer:", err);
            return {
                data: {
                    success: false,
                    total: 0,
                    data: [],
                    pagination: { total: 0, page: 1, size: 10 }
                }
            };
        }
    },

    // 3. Delete layer from GeoServer Microservice
    delete: async (idOrObject, optionalLayerName) => {
        const headers = await getAuthHeaders(false);
        let wsName = null;
        let lyrName = null;
        let layerId = null;

        if (typeof idOrObject === "object" && idOrObject !== null) {
            wsName = idOrObject.workspace_name || idOrObject.workspace;
            lyrName = idOrObject.geoserver_name || idOrObject.store_name || idOrObject.table_name || idOrObject.layer_name || idOrObject.name;
            layerId = idOrObject.id;
        } else if (optionalLayerName) {
            wsName = idOrObject;
            lyrName = optionalLayerName;
        } else if (layersCache.has(String(idOrObject))) {
            const cached = layersCache.get(String(idOrObject));
            wsName = cached.workspace_name;
            lyrName = cached.geoserver_name || cached.layer_name;
            layerId = idOrObject;
        }

        if (!wsName || !lyrName) {
            try {
                const res = await axios.get(`${MICROSERVICE_URL}/layers/my-layers`, { headers });
                const found = res.data?.data?.find(l => String(l.id) === String(idOrObject) || l.layer_name === String(idOrObject) || l.geoserver_name === String(idOrObject));
                if (found) {
                    wsName = found.workspace_name;
                    lyrName = found.geoserver_name || found.store_name || found.table_name || found.layer_name;
                    layerId = found.id;
                }
            } catch (e) {}
        }

        if (!wsName || !lyrName) {
            throw new Error(`Data workspace atau layer '${idOrObject}' tidak ditemukan untuk dihapus.`);
        }

        try {
            const queryParams = new URLSearchParams({ recurse: "true" });
            if (layerId) {
                queryParams.append("layer_id", String(layerId));
            }
            const res = await axios.delete(`${MICROSERVICE_URL}/layers/${wsName}/${lyrName}?${queryParams.toString()}`, { headers });
            return {
                data: {
                    success: true,
                    detail: res.data?.detail || `Layer '${lyrName}' berhasil dihapus dari workspace '${wsName}'.`
                }
            };
        } catch (err) {
            const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Gagal menghapus layer di GeoServer.";
            throw new Error(errMsg);
        }
    },

    // 3b. Batch delete multiple layers from GeoServer Microservice
    batchDelete: async (layerIds) => {
        const headers = await getAuthHeaders(false);
        const ids = Array.isArray(layerIds) ? layerIds : [layerIds];
        try {
            const res = await axios.post(
                `${MICROSERVICE_URL}/layers/batch-delete`,
                { layer_ids: ids },
                { headers }
            );
            return res;
        } catch (err) {
            const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Gagal menghapus beberapa layer terpilih.";
            throw new Error(errMsg);
        }
    },

    // 4. Update & Apply Style (Raster & Vector) to GeoServer
    updateStyle: async (payload) => {
        const headers = await getAuthHeaders(false);
        try {
            const res = await axios.post(`${MICROSERVICE_URL}/styles/apply`, payload, { headers });
            return {
                data: {
                    success: true,
                    detail: res.data?.detail || "Style berhasil diterapkan ke GeoServer."
                }
            };
        } catch (err) {
            const errMsg = err?.response?.data?.detail || err?.response?.data?.message || err?.message || "Gagal menerapkan style ke GeoServer.";
            throw new Error(errMsg);
        }
    },

    // 5. Get Raster Info & Statistics
    getRasterInfo: async (layerId) => {
        const headers = await getAuthHeaders(false);
        try {
            const res = await axios.get(`${MICROSERVICE_URL}/styles/raster-info/${layerId}`, { headers });
            return {
                data: res.data
            };
        } catch (err) {
            console.warn("Gagal mengambil raster info:", err);
            return {
                data: {
                    statistics: { min: 0, max: 100, mean: 50, std: 10 },
                    saved_symbology: null
                }
            };
        }
    },

    // 6. Preview Classification Classes (DRY helper on statistical data)
    classifyPreview: async (layerId, params = {}) => {
        try {
            const infoRes = await layerApi.getRasterInfo(layerId);
            const stats = infoRes?.data?.statistics || { min: 0, max: 100, mean: 50, std: 10 };
            const count = Number(params.n_classes) || 10;
            const method = params.method || "jenks";
            const colors = params.custom_colors || ["#00e5ff", "#0044ff", "#ff00ee"];

            const { generateClassificationClasses } = await import("../utils/styleConstants");
            const classes = generateClassificationClasses({
                min: stats.min,
                max: stats.max,
                count,
                method,
                colors
            });

            return {
                data: {
                    success: true,
                    data: {
                        classes,
                        statistics: stats
                    }
                }
            };
        } catch (err) {
            console.warn("classifyPreview fallback to default classes:", err);
            const { generateClassificationClasses } = await import("../utils/styleConstants");
            const count = Number(params.n_classes) || 10;
            const classes = generateClassificationClasses({
                min: 0,
                max: 100,
                count,
                method: params.method || "equal_interval",
                colors: params.custom_colors || ["#00e5ff", "#0044ff", "#ff00ee"]
            });
            return {
                data: {
                    success: true,
                    data: {
                        classes,
                        statistics: { min: 0, max: 100, mean: 50, std: 10 }
                    }
                }
            };
        }
    },

    // 7. Get Available Vector SVG Icons
    getVectorIcons: async () => {
        const headers = await getAuthHeaders(false);
        try {
            const res = await axios.get(`${MICROSERVICE_URL}/styles/icons`, { headers });
            return {
                data: res.data?.data || []
            };
        } catch (err) {
            console.warn("Gagal mengambil vector icons:", err);
            return {
                data: []
            };
        }
    }
};

export default layerApi;
