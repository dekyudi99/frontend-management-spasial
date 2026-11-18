const baseExamples = {
  curl: `# 1. Unggah berkas GeoTIFF atau Shapefile (.zip)
curl -X POST "http://localhost:8005/api/v1/ingest/uploads" \\
  -H "X-API-Key: agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0" \\
  -F "workspace_name=ws_mitigasi_bencana" \\
  -F "layer_name=Peta Risiko Curah Hujan" \\
  -F "file=@/path/to/curah_hujan.tif"

# 2. Cek status Ingest Job (ganti <JOB_ID> dengan UUID dari respons upload)
curl -X GET "http://localhost:8005/api/v1/ingest/jobs/<JOB_ID>" \\
  -H "X-API-Key: agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0"

# 3. Ambil daftar layer milik API Key
curl -X GET "http://localhost:8005/api/v1/layers/my-layers" \\
  -H "X-API-Key: agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0"`,

  python: `import os
import time
import requests

API_KEY = os.getenv("ASTRAGIS_API_KEY", "agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0")
BASE_URL = os.getenv("ASTRAGIS_MICRO_URL", "http://localhost:8005/api/v1")
HEADERS = {"X-API-Key": API_KEY}

def upload_and_wait(file_path: str, workspace_name: str, display_name: str):
    """Mengunggah berkas spasial dan menunggu hingga status COMPLETED."""
    upload_url = f"{BASE_URL}/ingest/uploads"
    
    with open(file_path, "rb") as f:
        files = {"file": (os.path.basename(file_path), f, "application/octet-stream")}
        data = {
            "workspace_name": workspace_name,
            "layer_name": display_name
        }
        res = requests.post(upload_url, headers=HEADERS, data=data, files=files)
        res.raise_for_status()
        job = res.json()
        job_id = job["id"]
        print(f"Pekerjaan diterima! Job ID: {job_id}")

    # Polling status berkala
    status_url = f"{BASE_URL}/ingest/jobs/{job_id}"
    while True:
        s_res = requests.get(status_url, headers=HEADERS)
        s_data = s_res.json()
        status = s_data.get("status")
        progress = s_data.get("progress", 0)
        print(f"Status: {status} ({progress}%)")

        if status == "COMPLETED":
            print("Publikasi Berhasil!")
            print("WMS URL:", s_data.get("wms_url"))
            print("GeoServer Name:", s_data.get("result_layer_name"))
            return s_data
        elif status == "FAILED":
            raise RuntimeError(f"Ingest gagal: {s_data.get('error_message')}")

        time.sleep(2)

if __name__ == "__main__":
    upload_and_wait("data/curah_hujan.tif", "ws_mitigasi_bencana", "Peta Curah Hujan 2024")`,

  javascript: `import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const API_KEY = process.env.ASTRAGIS_API_KEY || 'agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0';
const BASE_URL = process.env.ASTRAGIS_MICRO_URL || 'http://localhost:8005/api/v1';

async function uploadSpatialFile(filePath, workspaceName, layerName) {
  const form = new FormData();
  form.append('workspace_name', workspaceName);
  form.append('layer_name', layerName);
  form.append('file', fs.createReadStream(filePath));

  try {
    const response = await axios.post(\`\${BASE_URL}/ingest/uploads\`, form, {
      headers: {
        'X-API-Key': API_KEY,
        ...form.getHeaders()
      }
    });

    console.log('Ingest Job Berhasil Dibuat:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error saat upload:', error.response?.data || error.message);
    throw error;
  }
}

// Menampilkan Layer di Web Peta (Leaflet.js)
export function addLayerToLeaflet(map, geoserverWmsUrl, workspaceName, geoserverName) {
  // L.tileLayer.wms adalah fungsi bawaan Leaflet
  const wmsLayer = L.tileLayer.wms(geoserverWmsUrl, {
    layers: \`\${workspaceName}:\${geoserverName}\`,
    format: 'image/png',
    transparent: true,
    version: '1.1.1',
    attribution: 'AstraGIS GeoServer'
  });

  wmsLayer.addTo(map);
}`,

  php: `<?php

namespace App\\Services;

use Illuminate\\Support\\Facades\\Http;

class AstraGisClient
{
    protected string $baseUrl;
    protected string $apiKey;

    public function __construct()
    {
        $this->baseUrl = config('services.astragis.microservice_url', 'http://localhost:8005/api/v1');
        $this->apiKey  = config('services.astragis.api_key', 'gsvc_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0');
    }

    /**
     * Upload berkas spasial ke antrean Ingest AstraGIS
     */
    public function uploadLayer(string $filePath, string $workspaceName, string $displayName): array
    {
        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
        ])->attach(
            'file', file_get_contents($filePath), basename($filePath)
        )->post("{$this->baseUrl}/ingest/uploads", [
            'workspace_name' => $workspaceName,
            'layer_name'     => $displayName,
        ]);

        if ($response->successful()) {
            return $response->json();
        }

        throw new \\Exception('AstraGIS Ingest Gagal: ' . $response->body());
    }

    /**
     * Mengambil daftar layer aktif milik API Key
     */
    public function getMyLayers(): array
    {
        $response = Http::withHeaders([
            'X-API-Key' => $this->apiKey,
        ])->get("{$this->baseUrl}/layers/my-layers");

        return $response->successful() ? $response->json()['data'] ?? [] : [];
    }
}`
}

export const s2sOgcExamples = {
  wmts: {
    curl: `# 1. Aktifkan mode WMTS (GeoWebCache Tile Caching) via S2S API
curl -X PATCH "http://localhost:8005/api/v1/layers/<LAYER_UUID>/service-mode" \\
  -H "X-API-Key: agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0" \\
  -H "Content-Type: application/json" \\
  -d '{"mode": "wmts", "layer_kind": "raster"}'

# 2. Template URL Tile GeoWebCache untuk Klien Web:
# http://localhost:8080/geoserver/gwc/service/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=<WORKSPACE>:<STORE_OR_TABLE>&STYLE=&TILEMATRIXSET=EPSG:900913&TILEMATRIX=EPSG:900913:{z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png`,

    python: `import requests

API_KEY = "agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0"
BASE_URL = "http://localhost:8005/api/v1"
HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

def enable_wmts_caching(layer_id: str, layer_kind: str = "raster"):
    """
    Mengubah mode layer ke WMTS (GeoWebCache tile-caching).
    Backend secara otomatis mendaftarkan gridset EPSG:900913
    dan memvalidasi kesehatan tile GeoServer.
    """
    url = f"{BASE_URL}/layers/{layer_id}/service-mode"
    res = requests.patch(url, headers=HEADERS, json={"mode": "wmts", "layer_kind": layer_kind})
    res.raise_for_status()
    data = res.json()
    print("WMTS Berhasil Diaktifkan!")
    print("GWC Ready:", data.get("gwc_ready"))
    print("Template Tile URL:", data.get("gwc_url"))
    return data

# enable_wmts_caching("e4f8d9b1-7a6c-4820-9831-25c7e8a9f012", "raster")`,

    javascript: `// Integrasi Tile WMTS di Leaflet.js
// Template URL GeoWebCache menggunakan format EPSG:900913:{z} dengan {x} dan {y}
export function addWmtsToLeaflet(map, workspaceName, layerName) {
  const gwcUrl = \`http://localhost:8080/geoserver/gwc/service/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=\${workspaceName}:\${layerName}&STYLE=&TILEMATRIXSET=EPSG:900913&TILEMATRIX=EPSG:900913:{z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png\`;

  const wmtsLayer = L.tileLayer(gwcUrl, {
    maxZoom: 19,
    tileSize: 256,
    attribution: 'GeoWebCache AstraGIS',
    crossOrigin: true
  });

  wmtsLayer.addTo(map);
  return wmtsLayer;
}`
  },

  wcs: {
    curl: `# 1. Potong Raster (BBox) via S2S API dan simpan GeoTIFF biner
curl -X POST "http://localhost:8005/api/v1/raster/clip" \\
  -H "X-API-Key: agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0" \\
  -H "Content-Type: application/json" \\
  -d '{
    "layer_id": "e4f8d9b1-7a6c-4820-9831-25c7e8a9f012",
    "bbox": [100.15, 13.95, 100.35, 14.15],
    "styled": false
  }' \\
  --output hasil_potong_curah_hujan.tif

# 2. Akses Langsung GeoServer WCS 2.0.1 GetCoverage:
# http://localhost:8080/geoserver/<WORKSPACE>/wcs?service=WCS&version=2.0.1&request=GetCoverage&coverageId=<WORKSPACE>:<COVERAGE_ID>&subset=Long(100.15,100.35)&subset=Lat(13.95,14.15)&format=image/tiff`,

    python: `import requests

API_KEY = "agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0"
BASE_URL = "http://localhost:8005/api/v1"
HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

def clip_geotiff_by_aoi(layer_id: str, aoi_polygon: list, output_filepath: str):
    """
    Memotong GeoTIFF langsung di server berbasis poligon AOI (WCS 2.0.1)
    dan mengunduh stream biner GeoTIFF hasil potongan.
    """
    url = f"{BASE_URL}/raster/clip"
    payload = {
        "layer_id": layer_id,
        "mask_polygon": aoi_polygon,
        "styled": False  # Nilai mentah band untuk analisis lanjutan
    }

    res = requests.post(url, headers=HEADERS, json=payload, stream=True)
    res.raise_for_status()

    with open(output_filepath, "wb") as f:
        for chunk in res.iter_content(chunk_size=16384):
            f.write(chunk)

    print(f"GeoTIFF berhasil dipotong dan disimpan ke: {output_filepath}")

polygon_aoi = [
    [100.15, 13.95],
    [100.35, 13.95],
    [100.35, 14.15],
    [100.15, 14.15],
    [100.15, 13.95]
]
# clip_geotiff_by_aoi("e4f8d9b1-7a6c-4820-9831-25c7e8a9f012", polygon_aoi, "output_aoi.tif")`
  },

  wfs: {
    curl: `# 1. Kueri data atribut layer vektor via S2S API dengan filter CQL & paginasi
curl -X POST "http://localhost:8005/api/v1/features/<LAYER_UUID>/query" \\
  -H "X-API-Key: agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0" \\
  -H "Content-Type: application/json" \\
  -d '{
    "page": 1,
    "page_size": 25,
    "filters": [
      {"field": "luas_ha", "operator": ">=", "value": 100},
      {"field": "kategori", "operator": "ILIKE", "value": "%pertanian%"}
    ],
    "sort": [{"field": "gid", "direction": "ASC"}]
  }'

# 2. Akses Langsung GeoServer WFS 2.0.0 GetFeature (GeoJSON):
# http://localhost:8080/geoserver/<WORKSPACE>/wfs?service=WFS&version=2.0.0&request=GetFeature&typeNames=<WORKSPACE>:<TABLE_NAME>&outputFormat=application/json&cql_filter=luas_ha>=100&count=50`,

    python: `import requests

API_KEY = "agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0"
BASE_URL = "http://localhost:8005/api/v1"
HEADERS = {"X-API-Key": API_KEY, "Content-Type": "application/json"}

def query_vector_attributes(layer_id: str, kategori: str, min_luas: float):
    """
    Kueri atribut tabular spasial via WFS 2.0.0 GetFeature.
    Mendukung paginasi deterministik dan penyaringan filter multi-kolom.
    """
    url = f"{BASE_URL}/features/{layer_id}/query"
    payload = {
        "page": 1,
        "page_size": 50,
        "filters": [
            {"field": "kategori", "operator": "=", "value": kategori},
            {"field": "luas_ha", "operator": ">=", "value": min_luas}
        ],
        "sort": [{"field": "gid", "direction": "ASC"}]
    }

    res = requests.post(url, headers=HEADERS, json=payload)
    res.raise_for_status()
    result = res.json()

    print(f"Total fitur cocok: {result['total']}")
    for item in result["features"]:
        props = item["properties"]
        print(f"[{props.get('gid')}] {props.get('nama')}: {props.get('luas_ha')} Ha")

    return result["features"]

# query_vector_attributes("320d5625-7831-419b-a01f-0e42f6e9b418", "pertanian", 50.0)`
  },

  pipeline: {
    python: `"""
End-to-End Server-to-Server (S2S) Pipeline:
Otomasi penuh untuk layanan eksternal (FlowGIS / Biomass / Flood Worker).
Alur: Ingest File -> Cek Status -> Aktifkan WMTS -> Potong AOI (WCS) -> Analisis Fitur (WFS).
"""
import os
import time
import requests

API_KEY = os.getenv("ASTRAGIS_API_KEY", "agis_sk_DEMO_KEY_f8a9b2c3d4e5f6a7b8c9d0")
BASE_URL = os.getenv("ASTRAGIS_MICRO_URL", "http://localhost:8005/api/v1")
HEADERS = {"X-API-Key": API_KEY}

def run_s2s_pipeline():
    # 1. INGEST: Upload berkas raster hasil model prediksi
    print("[1/4] Mengunggah GeoTIFF hasil analisis ke AstraGIS...")
    with open("data/prediksi_banjir.tif", "rb") as f:
        res = requests.post(
            f"{BASE_URL}/ingest/uploads",
            headers=HEADERS,
            data={"workspace_name": "ws_flowgis", "layer_name": "Prediksi Genangan 2026"},
            files={"file": ("prediksi_banjir.tif", f, "image/tiff")}
        )
        res.raise_for_status()
        job_id = res.json()["id"]

    # 2. POLLING: Tunggu publish GeoServer selesai
    while True:
        status_data = requests.get(f"{BASE_URL}/ingest/jobs/{job_id}", headers=HEADERS).json()
        status = status_data.get("status")
        if status == "COMPLETED":
            layer_id = status_data.get("layer_id")
            print(f"[2/4] Layer sukses dipublish! ID: {layer_id}")
            break
        elif status == "FAILED":
            raise RuntimeError(f"Ingest gagal: {status_data.get('error_message')}")
        time.sleep(2)

    # 3. WMTS: Ubah mode ke WMTS untuk visualisasi WebGIS kecepatan tinggi
    print("[3/4] Mengaktifkan tile caching GeoWebCache (WMTS)...")
    patch_res = requests.patch(
        f"{BASE_URL}/layers/{layer_id}/service-mode",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={"mode": "wmts", "layer_kind": "raster"}
    ).json()
    print(f"      GWC Tile URL: {patch_res.get('gwc_url')}")

    # 4. WCS: Potong AOI tertentu untuk diekspor ke tim mitigasi
    print("[4/4] Memotong data raster via WCS 2.0.1...")
    clip_res = requests.post(
        f"{BASE_URL}/raster/clip",
        headers={**HEADERS, "Content-Type": "application/json"},
        json={"layer_id": layer_id, "bbox": [100.1, 13.8, 100.4, 14.2], "styled": False},
        stream=True
    )
    with open("aoi_ekspor_final.tif", "wb") as f:
        for chunk in clip_res.iter_content(chunk_size=16384):
            f.write(chunk)
    print("Selesai! Pipeline S2S berhasil dieksekusi tanpa intervensi manual.")

if __name__ == "__main__":
    run_s2s_pipeline()`
  }
}

const titles = {
  id: {
    title: 'Contoh Kode Siap Pakai',
    subtitle: 'Snippet implementasi dalam berbagai bahasa pemrograman untuk mengunggah berkas, memeriksa status, dan merender peta.'
  },
  en: {
    title: 'Ready-to-Use Code Examples',
    subtitle: 'Implementation snippets across multiple languages to upload files, monitor status, and render maps.'
  },
  th: {
    title: 'ตัวอย่างโค้ดพร้อมใช้งาน',
    subtitle: 'ข้อมูลโค้ดการนำไปใช้ในภาษาโปรแกรมต่างๆ สำหรับการอัปโหลดไฟล์ การตรวจสอบสถานะ และการแสดงผลแผนที่'
  }
}

export const getCodeExamplesContent = (lang = 'id') => {
  const meta = titles[lang] || titles.id
  return {
    id: 'code-examples',
    title: meta.title,
    subtitle: meta.subtitle,
    examples: baseExamples,
    s2sOgc: s2sOgcExamples
  }
}

export const codeExamplesContent = getCodeExamplesContent('id')
