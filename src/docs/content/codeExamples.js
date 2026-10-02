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
    examples: baseExamples
  }
}

export const codeExamplesContent = getCodeExamplesContent('id')
