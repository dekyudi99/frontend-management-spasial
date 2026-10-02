const baseEndpoints = [
  {
    id: 'api-ingest-upload',
    tag: 'Data Ingestion',
    method: 'POST',
    path: '/api/v1/ingest/uploads',
    bodyParams: [
      { name: 'file', type: 'file (binary)', required: true, example: 'peta_analisis.tif' },
      { name: 'workspace_name', type: 'string', required: true, example: 'ws_proyek_risiko' },
      { name: 'layer_name', type: 'string', required: true, example: 'Peta Risiko Genangan' },
      { name: 'description', type: 'string', required: false, example: 'Hasil analisis GEE tahun 2024' }
    ],
    examples: {
      curl: `curl -X POST "http://localhost:8005/api/v1/ingest/uploads" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -F "workspace_name=ws_proyek_risiko" \\
  -F "layer_name=Peta Risiko Genangan" \\
  -F "file=@/data/banjir.tif"`,
      python: `import requests

url = "http://localhost:8005/api/v1/ingest/uploads"
headers = {"X-API-Key": "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}

data = {
    "workspace_name": "ws_proyek_risiko",
    "layer_name": "Peta Risiko Genangan",
    "description": "Hasil ingest via Python"
}

with open("/data/banjir.tif", "rb") as f:
    files = {"file": ("banjir.tif", f, "image/tiff")}
    response = requests.post(url, headers=headers, data=data, files=files)

print("Status:", response.status_code)
print("Data:", response.json())`
    },
    response: {
      statusCode: 202,
      jsonCode: `{
  "id": "e4f8d9b1-7a6c-4820-9831-25c7e8a9f012",
  "status": "QUEUED",
  "progress": 0,
  "layer_name": "Peta Risiko Genangan",
  "workspace_name": "ws_proyek_risiko",
  "created_at": "2026-10-01T10:00:00Z"
}`,
      fieldDescriptions: [
        { field: 'id' },
        { field: 'status' },
        { field: 'progress' }
      ]
    }
  },
  {
    id: 'api-ingest-batch',
    tag: 'Data Ingestion',
    method: 'POST',
    path: '/api/v1/ingest/batch-uploads',
    bodyParams: [
      { name: 'files', type: 'file[] (array)', required: true, example: '[file1.shp.zip, file2.csv]' },
      { name: 'workspace_name', type: 'string', required: true, example: 'ws_proyek_risiko' },
      { name: 'display_names', type: 'string (JSON array)', required: false, example: '["Layer Poligon", "Layer Titik CSV"]' },
      { name: 'description', type: 'string', required: false, example: 'Unggahan survei lapangan tim B' }
    ],
    examples: {
      curl: `curl -X POST "http://localhost:8005/api/v1/ingest/batch-uploads" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -F "workspace_name=ws_proyek_risiko" \\
  -F 'display_names=["Layer Poligon","Layer Titik CSV"]' \\
  -F "files=@/data/poligon.zip" \\
  -F "files=@/data/titik.csv"`,
      python: `import requests
import json

url = "http://localhost:8005/api/v1/ingest/batch-uploads"
headers = {"X-API-Key": "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}

data = {
    "workspace_name": "ws_proyek_risiko",
    "display_names": json.dumps(["Layer Poligon", "Layer Titik CSV"])
}

files = [
    ("files", ("poligon.zip", open("/data/poligon.zip", "rb"), "application/zip")),
    ("files", ("titik.csv", open("/data/titik.csv", "rb"), "text/csv"))
]

resp = requests.post(url, headers=headers, data=data, files=files)
print(resp.json())`
    },
    response: {
      statusCode: 202,
      jsonCode: `{
  "success": true,
  "batch_id": "batch_91a82bc3-4d5e-6f7a-8b9c",
  "job_ids": [
    "c1a2b3d4-e5f6-7890-abcd-111122223333",
    "f9e8d7c6-b5a4-3210-fedc-444455556666"
  ],
  "total_submitted": 2
}`,
      fieldDescriptions: [
        { field: 'batch_id' },
        { field: 'job_ids' },
        { field: 'total_submitted' }
      ]
    }
  },
  {
    id: 'api-batch-status',
    tag: 'Data Ingestion',
    method: 'POST',
    path: '/api/v1/ingest/jobs/batch-status',
    bodyParams: [
      { name: 'job_ids', type: 'string[] (array)', required: true, example: '["uuid-1", "uuid-2"]' }
    ],
    examples: {
      curl: `curl -X POST "http://localhost:8005/api/v1/ingest/jobs/batch-status" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{"job_ids": ["c1a2b3d4-e5f6-7890-abcd-111122223333"]}'`,
      python: `import requests

url = "http://localhost:8005/api/v1/ingest/jobs/batch-status"
headers = {
    "X-API-Key": "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
    "Content-Type": "application/json"
}

resp = requests.post(url, headers=headers, json={"job_ids": ["c1a2b3d4-e5f6-7890-abcd-111122223333"]})
print(resp.json())`
    },
    response: {
      statusCode: 200,
      jsonCode: `{
  "jobs": [
    {
      "id": "c1a2b3d4-e5f6-7890-abcd-111122223333",
      "status": "COMPLETED",
      "progress": 100,
      "layer_name": "Layer Poligon",
      "display_name": "Layer Poligon",
      "geoserver_name": "vec_usr_layer_poligon_a7b8c9",
      "wms_url": "http://localhost:8080/geoserver/wms",
      "error_message": null
    }
  ]
}`,
      fieldDescriptions: [
        { field: 'status' },
        { field: 'geoserver_name' },
        { field: 'wms_url' }
      ]
    }
  },
  {
    id: 'api-layer-list',
    tag: 'Layer Management',
    method: 'GET',
    path: '/api/v1/layers/my-layers',
    params: [
      { name: 'page', type: 'integer', required: false, example: '1' },
      { name: 'size', type: 'integer', required: false, example: '50' }
    ],
    examples: {
      curl: `curl -X GET "http://localhost:8005/api/v1/layers/my-layers" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"`,
      python: `import requests

url = "http://localhost:8005/api/v1/layers/my-layers"
headers = {"X-API-Key": "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}

resp = requests.get(url, headers=headers)
layers = resp.json().get("data", [])
for l in layers:
    print(l["display_name"], "->", l["geoserver_name"])`
    },
    response: {
      statusCode: 200,
      jsonCode: `{
  "success": true,
  "data": [
    {
      "id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
      "display_name": "Peta Risiko Genangan",
      "layer_name": "Peta Risiko Genangan",
      "geoserver_name": "ras_peta_risiko_genangan_f7a29c",
      "workspace_name": "ws_proyek_risiko",
      "data_type": "tif",
      "type": "raster",
      "epsg": 4326,
      "bbox": [115.12, -8.75, 115.34, -8.55],
      "wms_url": "http://localhost:8080/geoserver/wms",
      "created_at": "2026-10-01T10:05:00Z"
    }
  ],
  "total": 1
}`,
      fieldDescriptions: [
        { field: 'display_name' },
        { field: 'geoserver_name' },
        { field: 'bbox' }
      ]
    }
  },
  {
    id: 'api-layer-delete',
    tag: 'Layer Management',
    method: 'DELETE',
    path: '/api/v1/layers/{workspace_name}/{layer_name}',
    params: [
      { name: 'workspace_name', type: 'string (path)', required: true, example: 'ws_proyek_risiko' },
      { name: 'layer_name', type: 'string (path)', required: true, example: 'ras_peta_risiko_genangan_f7a29c' },
      { name: 'recurse', type: 'boolean (query)', required: false, example: 'true' },
      { name: 'layer_id', type: 'string (query)', required: false, example: '7a8b9c0d-1e2f-3a4b...' }
    ],
    examples: {
      curl: `curl -X DELETE "http://localhost:8005/api/v1/layers/ws_proyek_risiko/ras_peta_risiko_genangan_f7a29c?recurse=true" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"`
    },
    response: {
      statusCode: 200,
      jsonCode: `{
  "success": true,
  "detail": "Layer 'ras_peta_risiko_genangan_f7a29c' berhasil dihapus dari workspace 'ws_proyek_risiko'."
}`,
      fieldDescriptions: []
    }
  },
  {
    id: 'api-layer-batch-delete',
    tag: 'Layer Management',
    method: 'POST',
    path: '/api/v1/layers/batch-delete',
    bodyParams: [
      { name: 'layer_ids', type: 'string[] (array)', required: true, example: '["uuid-1", "uuid-2"]' }
    ],
    examples: {
      curl: `curl -X POST "http://localhost:8005/api/v1/layers/batch-delete" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{"layer_ids": ["7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d"]}'`
    },
    response: {
      statusCode: 200,
      jsonCode: `{
  "success": true,
  "detail": "Berhasil menghapus 1 dari 1 layer.",
  "results": [
    {
      "layer_id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
      "status": "DELETED",
      "layer_name": "ras_peta_risiko_genangan_f7a29c"
    }
  ]
}`,
      fieldDescriptions: []
    }
  },
  {
    id: 'api-layer-groups',
    tag: 'Layer Groups',
    method: 'POST',
    path: '/api/v1/layer-groups',
    bodyParams: [
      { name: 'workspace_name', type: 'string', required: true, example: 'ws_proyek_risiko' },
      { name: 'name', type: 'string', required: true, example: 'grp_analisis_gabungan' },
      { name: 'title', type: 'string', required: false, example: 'Komposit Analisis Banjir & Vegetasi' },
      { name: 'layers', type: 'string[] (array)', required: true, example: '["vec_layer_1", "ras_layer_2"]' }
    ],
    examples: {
      curl: `curl -X POST "http://localhost:8005/api/v1/layer-groups" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workspace_name": "ws_proyek_risiko",
    "name": "grp_analisis_gabungan",
    "title": "Komposit Analisis Banjir & Vegetasi",
    "layers": ["vec_usr_batas_desa_1a2b", "ras_curah_hujan_3c4d"]
  }'`
    },
    response: {
      statusCode: 201,
      jsonCode: `{
  "success": true,
  "id": "grp-uuid-1234",
  "name": "grp_analisis_gabungan",
  "wms_layers_param": "ws_proyek_risiko:grp_analisis_gabungan"
}`,
      fieldDescriptions: [
        { field: 'wms_layers_param' }
      ]
    }
  },
  {
    id: 'api-workspaces-list',
    tag: 'Workspaces',
    method: 'GET',
    path: '/api/v1/workspaces',
    params: [],
    examples: {
      curl: `curl -X GET "http://localhost:8005/api/v1/workspaces" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"`,
      python: `import requests

url = "http://localhost:8005/api/v1/workspaces"
headers = {"X-API-Key": "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
res = requests.get(url, headers=headers)
print(res.json())`
    },
    response: {
      statusCode: 200,
      jsonCode: `[
  {
    "id": "bM7xK2pL9qAaBbCc",
    "name": "Proyek Pesisir 2026",
    "display_name": "Proyek Pesisir 2026",
    "workspace_name": "ws_dc4c8fa5",
    "visibility": "private",
    "created_at": "2026-10-01T10:00:00Z"
  }
]`,
      fieldDescriptions: [
        { field: 'id' },
        { field: 'workspace_name' },
        { field: 'display_name' }
      ]
    }
  },
  {
    id: 'api-workspaces-create',
    tag: 'Workspaces',
    method: 'POST',
    path: '/api/v1/workspaces',
    bodyParams: [
      { name: 'display_name', type: 'string', required: true, example: 'Proyek Risiko Banjir' },
      { name: 'workspace_name', type: 'string', required: false, example: 'ws_proyek_risiko' },
      { name: 'visibility', type: 'string', required: false, example: 'private' }
    ],
    examples: {
      curl: `curl -X POST "http://localhost:8005/api/v1/workspaces" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{"display_name": "Proyek Risiko Banjir", "visibility": "private"}'`,
      python: `import requests

url = "http://localhost:8005/api/v1/workspaces"
headers = {"X-API-Key": "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
payload = {"display_name": "Proyek Risiko Banjir", "visibility": "private"}
res = requests.post(url, json=payload, headers=headers)
print(res.json())`
    },
    response: {
      statusCode: 201,
      jsonCode: `{
  "success": true,
  "id": "bM7xK2pL9qAaBbCc",
  "workspace_name": "ws_proyek_risiko",
  "display_name": "Proyek Risiko Banjir",
  "visibility": "private"
}`,
      fieldDescriptions: [
        { field: 'id' },
        { field: 'workspace_name' }
      ]
    }
  },
  {
    id: 'api-workspaces-delete',
    tag: 'Workspaces',
    method: 'DELETE',
    path: '/api/v1/workspaces/{identifier}',
    params: [
      { name: 'identifier', type: 'string (path)', required: true, example: 'bM7xK2pL9qAaBbCc' },
      { name: 'recurse', type: 'boolean (query)', required: false, example: 'true' }
    ],
    examples: {
      curl: `curl -X DELETE "http://localhost:8005/api/v1/workspaces/bM7xK2pL9qAaBbCc?recurse=true" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"`,
      python: `import requests

url = "http://localhost:8005/api/v1/workspaces/bM7xK2pL9qAaBbCc?recurse=true"
headers = {"X-API-Key": "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
res = requests.delete(url, headers=headers)
print(res.json())`
    },
    response: {
      statusCode: 200,
      jsonCode: `{
  "success": true,
  "detail": "Workspace 'ws_dc4c8fa5' beserta seluruh layer dan tabel terkait berhasil dihapus permanen."
}`,
      fieldDescriptions: []
    }
  },
  {
    id: 'api-ingest-job-detail',
    tag: 'Data Ingestion',
    method: 'GET',
    path: '/api/v1/ingest/jobs/{job_id}',
    params: [
      { name: 'job_id', type: 'string (path)', required: true, example: 'e4f8d9b1-7a6c-4820-9831-25c7e8a9f012' }
    ],
    examples: {
      curl: `curl -X GET "http://localhost:8005/api/v1/ingest/jobs/e4f8d9b1-7a6c-4820-9831-25c7e8a9f012" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"`,
      python: `import requests

url = "http://localhost:8005/api/v1/ingest/jobs/e4f8d9b1-7a6c-4820-9831-25c7e8a9f012"
headers = {"X-API-Key": "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
res = requests.get(url, headers=headers)
print(res.json())`
    },
    response: {
      statusCode: 200,
      jsonCode: `{
  "id": "e4f8d9b1-7a6c-4820-9831-25c7e8a9f012",
  "status": "COMPLETED",
  "progress": 100,
  "layer_name": "Peta Risiko Genangan",
  "geoserver_name": "ras_peta_risiko_genangan_f7a29c",
  "wms_url": "http://localhost:8080/geoserver/wms"
}`,
      fieldDescriptions: [
        { field: 'status' },
        { field: 'progress' },
        { field: 'geoserver_name' }
      ]
    }
  },
  {
    id: 'api-layer-publish-vector',
    tag: 'Layers',
    method: 'POST',
    path: '/api/v1/layers/publish-vector',
    bodyParams: [
      { name: 'file', type: 'file (binary)', required: true, example: 'batas_desa.zip' },
      { name: 'workspace_name', type: 'string', required: true, example: 'ws_proyek_risiko' },
      { name: 'layer_name', type: 'string', required: true, example: 'Batas Wilayah Desa' }
    ],
    examples: {
      curl: `curl -X POST "http://localhost:8005/api/v1/layers/publish-vector" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -F "file=@batas_desa.zip" \\
  -F "workspace_name=ws_proyek_risiko" \\
  -F "layer_name=Batas Wilayah Desa"`,
      python: `import requests

url = "http://localhost:8005/api/v1/layers/publish-vector"
headers = {"X-API-Key": "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
with open("batas_desa.zip", "rb") as f:
    files = {"file": f}
    data = {"workspace_name": "ws_proyek_risiko", "layer_name": "Batas Wilayah Desa"}
    res = requests.post(url, headers=headers, files=files, data=data)
print(res.json())`
    },
    response: {
      statusCode: 201,
      jsonCode: `{
  "success": true,
  "layer_name": "vec_usr_batas_wilayah_desa_3b81d4",
  "wms_url": "http://localhost:8080/geoserver/wms"
}`,
      fieldDescriptions: [
        { field: 'layer_name' },
        { field: 'wms_url' }
      ]
    }
  },
  {
    id: 'api-layer-publish-raster',
    tag: 'Layers',
    method: 'POST',
    path: '/api/v1/layers/publish-raster',
    bodyParams: [
      { name: 'file', type: 'file (binary)', required: true, example: 'dem_nasional.tif' },
      { name: 'workspace_name', type: 'string', required: true, example: 'ws_proyek_risiko' },
      { name: 'layer_name', type: 'string', required: true, example: 'Elevasi Digital DEM' }
    ],
    examples: {
      curl: `curl -X POST "http://localhost:8005/api/v1/layers/publish-raster" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -F "file=@dem_nasional.tif" \\
  -F "workspace_name=ws_proyek_risiko" \\
  -F "layer_name=Elevasi Digital DEM"`,
      python: `import requests

url = "http://localhost:8005/api/v1/layers/publish-raster"
headers = {"X-API-Key": "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
with open("dem_nasional.tif", "rb") as f:
    files = {"file": f}
    data = {"workspace_name": "ws_proyek_risiko", "layer_name": "Elevasi Digital DEM"}
    res = requests.post(url, headers=headers, files=files, data=data)
print(res.json())`
    },
    response: {
      statusCode: 201,
      jsonCode: `{
  "success": true,
  "layer_name": "ras_elevasi_digital_dem_9c2a1e",
  "wms_url": "http://localhost:8080/geoserver/wms"
}`,
      fieldDescriptions: [
        { field: 'layer_name' },
        { field: 'wms_url' }
      ]
    }
  },
  {
    id: 'api-layer-groups-list',
    tag: 'Layer Groups',
    method: 'GET',
    path: '/api/v1/layer-groups',
    params: [
      { name: 'workspace_id', type: 'string (query)', required: false, example: 'bM7xK2pL9qAaBbCc' }
    ],
    examples: {
      curl: `curl -X GET "http://localhost:8005/api/v1/layer-groups" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"`,
      python: `import requests

url = "http://localhost:8005/api/v1/layer-groups"
headers = {"X-API-Key": "agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
res = requests.get(url, headers=headers)
print(res.json())`
    },
    response: {
      statusCode: 200,
      jsonCode: `[
  {
    "id": "grp-uuid-1234",
    "name": "grp_analisis_gabungan",
    "title": "Komposit Analisis",
    "wms_layers_param": "ws_proyek_risiko:grp_analisis_gabungan",
    "layers": ["ras_peta_1", "vec_peta_2"]
  }
]`,
      fieldDescriptions: [
        { field: 'wms_layers_param' }
      ]
    }
  },
  {
    id: 'api-styles-apply',
    tag: 'Styles',
    method: 'POST',
    path: '/api/v1/styles/apply',
    bodyParams: [
      { name: 'layer_id', type: 'string', required: true, example: '7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d' },
      { name: 'style_sld', type: 'string (XML)', required: false, example: '<?xml version="1.0" ...?>' },
      { name: 'style_json', type: 'array of ColorEntry', required: false, example: '[{"quantity": 1, "color": "#00ff00", "opacity": 1.0}]' }
    ],
    examples: {
      curl: `curl -X POST "http://localhost:8005/api/v1/styles/apply" \\
  -H "X-API-Key: agis_sk_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" \\
  -H "Content-Type: application/json" \\
  -d '{
    "layer_id": "7a8b9c0d-1e2f-3a4b-5c6d-7e8f9a0b1c2d",
    "style_json": [
      {"quantity": 0, "color": "#2166ac", "opacity": 1.0, "label": "Rendah"},
      {"quantity": 50, "color": "#ffffbf", "opacity": 1.0, "label": "Sedang"},
      {"quantity": 100, "color": "#b2182b", "opacity": 1.0, "label": "Tinggi"}
    ]
  }'`
    },
    response: {
      statusCode: 200,
      jsonCode: `{
  "success": true,
  "detail": "Style berhasil dikaitkan ke layer."
}`,
      fieldDescriptions: []
    }
  }
]

const localizedOverlays = {
  id: {
    title: 'Referensi API (S2S & Ingest)',
    subtitle: 'Spesifikasi endpoint RESTful GeoServer Microservice v2.0 untuk integrasi sistem-ke-sistem.',
    securityNotice: {
      title: 'Peringatan Keamanan API Key',
      desc: 'Semua endpoint S2S memerlukan header otentikasi X-API-Key. Kunci API ini memberikan akses penuh atas data workspace Anda. JANGAN PERNAH menyertakan API Key pada kode frontend publik (React, Vue, mobile app), repository git publik, atau berkas HTML sisi klien. Simpan API Key hanya di environment variable server backend Anda (contoh: .env pada Laravel, Node.js, atau FastAPI).'
    },
    endpoints: {
      'api-ingest-upload': {
        title: 'Upload Berkas Spasial Tunggal (Single File Ingest)',
        description: 'Menerima satu berkas spasial, menyimpannya ke disk staging, memvalidasi CRS & format, dan mendaftarkan pekerjaan ingest ke antrean worker latar belakang (asinkron).',
        paramDescs: {
          file: 'Berkas spasial (.tif, .tiff, .zip SHP, .geojson, .json, .kml, .kmz, .csv).',
          workspace_name: 'Hashed ID atau nama teknis workspace target di GeoServer.',
          layer_name: 'Nama tampilan layer (Display Name) yang ramah dibaca pengguna.',
          description: 'Catatan ringkas mengenai layer.'
        },
        responseDesc: 'Pekerjaan ingest diterima dan masuk antrean pemrosesan worker.',
        fieldDescs: {
          id: 'UUID unik pekerjaan ingest (Job ID) untuk mengecek status',
          status: 'Status awal: QUEUED (antrean) atau RUNNING (sedang berjalan)',
          progress: 'Persentase progres pekerjaan (0-100%)'
        }
      },
      'api-ingest-batch': {
        title: 'Batch Upload Banyak Berkas Spasial (Multi-File Ingest)',
        description: 'Menerima hingga 10 berkas spasial sekaligus dalam satu form submission multipart, menghasilkan IngestJob independen untuk tiap berkas.',
        paramDescs: {
          files: 'Daftar berkas spasial (maksimum 10 file per batch).',
          workspace_name: 'Hashed ID atau nama teknis workspace target.',
          display_names: 'Array JSON string berisi nama tampilan sesuai urutan files.',
          description: 'Deskripsi batch unggahan.'
        },
        responseDesc: 'Batch upload berhasil diterima.',
        fieldDescs: {
          batch_id: 'Pengenal grup batch unggahan',
          job_ids: 'Daftar Job UUID yang dapat dipantau statusnya di endpoint /jobs/batch-status',
          total_submitted: 'Jumlah total berkas yang berhasil dimasukkan ke antrean'
        }
      },
      'api-batch-status': {
        title: 'Pantau Status Sekumpulan Job Ingest Sekaligus',
        description: 'Mengecek status dan progress dari daftar Job UUID secara serentak.',
        paramDescs: {
          job_ids: 'Array berisi UUID pekerjaan ingest.'
        },
        responseDesc: 'Daftar status tiap job yang diminta.',
        fieldDescs: {
          status: 'QUEUED, RUNNING, COMPLETED, atau FAILED',
          geoserver_name: 'Nama layer unik yang terdaftar di GeoServer dan tabel PostGIS',
          wms_url: 'URL endpoint WMS GeoServer untuk merender layer di peta web'
        }
      },
      'api-layer-list': {
        title: 'Ambil Daftar Semua Layer Milik API Key',
        description: 'Mengembalikan daftar layer yang dipublikasikan oleh akun API Key pemanggil, lengkap dengan metadata WMS, tipe format, batas wilayah (bbox), dan status.',
        paramDescs: {
          page: 'Nomor halaman (default: 1).',
          size: 'Jumlah data per halaman (default: 50).'
        },
        responseDesc: 'Daftar layer berhasil dimuat.',
        fieldDescs: {
          display_name: 'Nama ramah pembaca yang ditampilkan di dashboard',
          geoserver_name: 'Identifier teknis internal di GeoServer dan PostGIS',
          bbox: 'Batas koordinat geografis WGS84 [minX, minY, maxX, maxY]'
        }
      },
      'api-layer-delete': {
        title: 'Hapus Layer Tunggal Terpadu',
        description: 'Menghapus satu layer dari GeoServer (Layer + Store/FeatureType), tabel PostGIS (untuk vektor), file fisik di media storage, dan record database secara terpadu.',
        paramDescs: {
          workspace_name: 'Nama workspace GeoServer.',
          layer_name: 'Field geoserver_name dari layer (bukan display_name).',
          recurse: 'Hapus semua dependensi di GeoServer (default: true).',
          layer_id: 'UUID layer untuk pencarian data yang lebih cepat.'
        },
        responseDesc: 'Layer berhasil dihapus tuntas dari GeoServer dan PostGIS.'
      },
      'api-layer-batch-delete': {
        title: 'Hapus Banyak Layer Sekaligus (Batch Delete)',
        description: 'Menerima array UUID layer yang ingin dihapus. Setiap layer diproses secara terisolasi tanpa memblokir layer lain jika salah satu gagal.',
        paramDescs: {
          layer_ids: 'Daftar UUID layer yang ingin dihapus.'
        },
        responseDesc: 'Laporan hasil penghapusan per layer.'
      },
      'api-layer-groups': {
        title: 'Buat Layer Group di GeoServer',
        description: 'Menggabungkan beberapa layer menjadi satu Layer Group resmi di GeoServer. Dapat ditampilkan di peta Leaflet/OpenLayers dengan satu permintaan tile WMS komposit.',
        paramDescs: {
          workspace_name: 'Nama teknis workspace target.',
          name: 'Nama pengenal grup (hanya huruf, angka, underscore).',
          title: 'Judul tampilan ramah pembaca.',
          layers: 'Daftar geoserver_name layer anggota.'
        },
        responseDesc: 'Layer Group berhasil dibuat di GeoServer.',
        fieldDescs: {
          wms_layers_param: 'Nilai parameter LAYERS yang digunakan di Leaflet L.tileLayer.wms'
        }
      },
      'api-workspaces-list': {
        title: 'Ambil Daftar Workspace',
        description: 'Mengembalikan daftar seluruh workspace yang dimiliki oleh akun API Key pemanggil.',
        paramDescs: {},
        responseDesc: 'Daftar workspace berhasil diambil.',
        fieldDescs: {
          id: 'Hashed ID unik workspace untuk referensi API',
          workspace_name: 'Nama teknis workspace di GeoServer',
          display_name: 'Nama tampilan ramah pengguna'
        }
      },
      'api-workspaces-create': {
        title: 'Buat Workspace Baru',
        description: 'Mendaftarkan workspace baru di GeoServer dan basis data spasial.',
        paramDescs: {
          display_name: 'Nama tampilan workspace yang mudah dibaca.',
          workspace_name: 'Nama teknis opsional (jika kosong, di-generate otomatis).',
          visibility: 'Visibilitas: private atau public.'
        },
        responseDesc: 'Workspace berhasil dibuat di GeoServer.'
      },
      'api-workspaces-delete': {
        title: 'Hapus Workspace & Seluruh Isinya (Cascade Delete)',
        description: 'Menghapus permanen workspace dari GeoServer beserta seluruh store, feature type, layer, tabel PostGIS, dan berkas fisik terkait.',
        paramDescs: {
          identifier: 'Hashed ID atau nama teknis workspace yang akan dihapus.',
          recurse: 'Hapus rekursif seluruh dependensi (default: true).'
        },
        responseDesc: 'Workspace dan seluruh dependensi berhasil dihapus.'
      },
      'api-ingest-job-detail': {
        title: 'Detail Status Pekerjaan Ingest',
        description: 'Memeriksa progres persentase dan status akhir pemrosesan berkas spasial.',
        paramDescs: {
          job_id: 'UUID pekerjaan ingest yang ingin diperiksa.'
        },
        responseDesc: 'Informasi status pekerjaan ingest.',
        fieldDescs: {
          status: 'QUEUED, RUNNING, COMPLETED, atau FAILED',
          progress: 'Persentase progres pekerjaan (0 - 100%)',
          geoserver_name: 'Nama teknis layer di GeoServer setelah sukses diproses'
        }
      },
      'api-layer-publish-vector': {
        title: 'Publikasi Berkas Vektor Langsung (Synchronous)',
        description: 'Mengunggah dan mempublikasikan data vektor secara langsung ke PostGIS dan GeoServer tanpa antrean worker.',
        paramDescs: {
          file: 'Berkas arsip vektor (.zip Shapefile, .geojson, .kml, .kmz, .csv).',
          workspace_name: 'Hashed ID atau nama teknis workspace.',
          layer_name: 'Nama layer yang diinginkan.'
        },
        responseDesc: 'Layer vektor berhasil dipublikasikan.',
        fieldDescs: {
          layer_name: 'Nama layer unik di GeoServer',
          wms_url: 'URL layanan WMS untuk rendering'
        }
      },
      'api-layer-publish-raster': {
        title: 'Publikasi Berkas Raster Langsung (Synchronous)',
        description: 'Mengunggah dan meregistrasikan citra GeoTIFF secara langsung ke CoverageStore GeoServer.',
        paramDescs: {
          file: 'Berkas citra GeoTIFF (.tif atau .tiff).',
          workspace_name: 'Hashed ID atau nama teknis workspace.',
          layer_name: 'Nama layer yang diinginkan.'
        },
        responseDesc: 'Layer raster berhasil dipublikasikan.',
        fieldDescs: {
          layer_name: 'Nama layer unik di GeoServer',
          wms_url: 'URL layanan WMS untuk rendering'
        }
      },
      'api-layer-groups-list': {
        title: 'Daftar Layer Group',
        description: 'Mengambil seluruh layer group gabungan milik pengguna untuk WMS multi-layer.',
        paramDescs: {
          workspace_id: 'Filter berdasarkan Hashed ID atau nama workspace.'
        },
        responseDesc: 'Daftar layer group berhasil diambil.',
        fieldDescs: {
          wms_layers_param: 'Nilai parameter LAYERS pada WMS Leaflet'
        }
      },
      'api-styles-apply': {
        title: 'Terapkan Style SLD / ColorMap JSON ke Layer',
        description: 'Membuat dan mengaitkan style simbologi (SLD XML atau JSON ColorMap) ke layer yang ada di GeoServer.',
        paramDescs: {
          layer_id: 'UUID layer target yang akan diwarnai.',
          style_sld: 'Dokumen lengkap XML OGC StyledLayerDescriptor.',
          style_json: 'Array aturan klasifikasi piksel raster JSON.'
        },
        responseDesc: 'Style berhasil diterapkan.'
      }
    }
  },
  en: {
    title: 'API Reference (S2S & Ingest)',
    subtitle: 'RESTful GeoServer Microservice v2.0 endpoint specifications for system-to-system integration.',
    securityNotice: {
      title: 'API Key Security Notice',
      desc: 'All S2S endpoints require the X-API-Key authentication header. This API Key grants full access to your workspace spatial data. NEVER expose your API Key in public frontend code (React, Vue, mobile apps), public git repositories, or client-side HTML. Store API Keys exclusively in backend server environment variables (e.g. .env in Laravel, Node.js, or FastAPI).'
    },
    endpoints: {
      'api-ingest-upload': {
        title: 'Single Spatial File Upload (Single File Ingest)',
        description: 'Accepts a single spatial file, saves it to staging storage, validates CRS & format, and registers the ingest job into the background worker queue (asynchronous).',
        paramDescs: {
          file: 'Spatial file (.tif, .tiff, .zip SHP, .geojson, .json, .kml, .kmz, .csv).',
          workspace_name: 'Hashed ID or technical name of the target workspace in GeoServer.',
          layer_name: 'User-friendly layer display name.',
          description: 'Brief notes regarding the layer.'
        },
        responseDesc: 'Ingest job accepted and queued in the background worker.',
        fieldDescs: {
          id: 'Unique UUID of the ingest job (Job ID) to track progress',
          status: 'Initial status: QUEUED or RUNNING',
          progress: 'Job progress percentage (0-100%)'
        }
      },
      'api-ingest-batch': {
        title: 'Batch Upload Multiple Spatial Files (Multi-File Ingest)',
        description: 'Accepts up to 10 spatial files simultaneously in a single multipart form submission, generating independent IngestJobs for each file.',
        paramDescs: {
          files: 'List of spatial files (maximum 10 files per batch).',
          workspace_name: 'Hashed ID or technical name of the target workspace.',
          display_names: 'JSON string array of display names matching files order.',
          description: 'Batch upload description.'
        },
        responseDesc: 'Batch upload accepted successfully.',
        fieldDescs: {
          batch_id: 'Batch upload group identifier',
          job_ids: 'List of Job UUIDs trackable via the /jobs/batch-status endpoint',
          total_submitted: 'Total number of files successfully enqueued'
        }
      },
      'api-batch-status': {
        title: 'Track Batch Ingest Job Statuses',
        description: 'Poll status and progress for an array of Ingest Job UUIDs concurrently.',
        paramDescs: {
          job_ids: 'Array of ingest job UUIDs.'
        },
        responseDesc: 'Status list for each requested job.',
        fieldDescs: {
          status: 'QUEUED, RUNNING, COMPLETED, or FAILED',
          geoserver_name: 'Unique layer identifier registered in GeoServer and PostGIS table',
          wms_url: 'GeoServer WMS endpoint URL to render layer on web maps'
        }
      },
      'api-layer-list': {
        title: 'Retrieve All Layers Belonging to API Key',
        description: 'Returns all layers published by the calling API Key account, complete with WMS metadata, format type, bounding box (bbox), and status.',
        paramDescs: {
          page: 'Page number (default: 1).',
          size: 'Items per page (default: 50).'
        },
        responseDesc: 'Layer list loaded successfully.',
        fieldDescs: {
          display_name: 'User-friendly name shown on the dashboard',
          geoserver_name: 'Internal technical identifier in GeoServer and PostGIS',
          bbox: 'WGS84 geographic coordinate bounds [minX, minY, maxX, maxY]'
        }
      },
      'api-layer-delete': {
        title: 'Unified Single Layer Deletion',
        description: 'Purges a single layer from GeoServer (Layer + Store/FeatureType), PostGIS table (for vector), physical media storage, and database records comprehensively.',
        paramDescs: {
          workspace_name: 'GeoServer workspace name.',
          layer_name: 'Layer geoserver_name field (not display_name).',
          recurse: 'Purge all dependencies in GeoServer (default: true).',
          layer_id: 'Layer UUID for faster data indexing.'
        },
        responseDesc: 'Layer thoroughly deleted from GeoServer and PostGIS.'
      },
      'api-layer-batch-delete': {
        title: 'Batch Delete Multiple Layers',
        description: 'Accepts an array of layer UUIDs to delete. Each layer is processed in isolation without blocking other layers if one fails.',
        paramDescs: {
          layer_ids: 'List of layer UUIDs to delete.'
        },
        responseDesc: 'Deletion outcome report per layer.'
      },
      'api-layer-groups': {
        title: 'Create Layer Group in GeoServer',
        description: 'Combines multiple layers into an official GeoServer Layer Group. Renders on Leaflet/OpenLayers via a single composite WMS tile request.',
        paramDescs: {
          workspace_name: 'Technical name of the target workspace.',
          name: 'Group identifier name (letters, numbers, underscores only).',
          title: 'User-friendly group title.',
          layers: 'List of member layer geoserver_names.'
        },
        responseDesc: 'Layer Group created successfully in GeoServer.',
        fieldDescs: {
          wms_layers_param: 'LAYERS parameter value used in Leaflet L.tileLayer.wms'
        }
      },
      'api-workspaces-list': {
        title: 'List Workspaces',
        description: 'Returns all workspaces associated with the caller API Key.',
        paramDescs: {},
        responseDesc: 'Workspace list retrieved successfully.',
        fieldDescs: {
          id: 'Unique hashed workspace ID for API references',
          workspace_name: 'Technical workspace name in GeoServer',
          display_name: 'User-friendly workspace display name'
        }
      },
      'api-workspaces-create': {
        title: 'Create Workspace',
        description: 'Registers a new workspace in GeoServer and the spatial database.',
        paramDescs: {
          display_name: 'Friendly workspace title.',
          workspace_name: 'Optional technical name (auto-generated if omitted).',
          visibility: 'Workspace visibility: private or public.'
        },
        responseDesc: 'Workspace created successfully in GeoServer.'
      },
      'api-workspaces-delete': {
        title: 'Cascading Workspace Deletion',
        description: 'Permanently deletes a workspace from GeoServer along with all associated stores, layers, PostGIS tables, and physical files.',
        paramDescs: {
          identifier: 'Hashed ID or technical name of the workspace to delete.',
          recurse: 'Recursively remove all dependent resources (default: true).'
        },
        responseDesc: 'Workspace and all dependent resources deleted.'
      },
      'api-ingest-job-detail': {
        title: 'Ingest Job Status Detail',
        description: 'Checks progress percentage and execution status of a background ingest job.',
        paramDescs: {
          job_id: 'UUID of the ingest job to query.'
        },
        responseDesc: 'Ingest job status information.',
        fieldDescs: {
          status: 'QUEUED, RUNNING, COMPLETED, or FAILED',
          progress: 'Processing progress percentage (0 - 100%)',
          geoserver_name: 'Published GeoServer layer identifier upon completion'
        }
      },
      'api-layer-publish-vector': {
        title: 'Direct Vector Layer Publishing (Synchronous)',
        description: 'Directly uploads and registers a vector dataset into PostGIS and GeoServer without background queuing.',
        paramDescs: {
          file: 'Vector archive file (.zip Shapefile, .geojson, .kml, .kmz, .csv).',
          workspace_name: 'Hashed ID or technical workspace name.',
          layer_name: 'Target layer display name.'
        },
        responseDesc: 'Vector layer published successfully.',
        fieldDescs: {
          layer_name: 'Unique GeoServer layer name',
          wms_url: 'WMS service URL for map rendering'
        }
      },
      'api-layer-publish-raster': {
        title: 'Direct Raster Layer Publishing (Synchronous)',
        description: 'Directly uploads and registers a GeoTIFF raster dataset into GeoServer CoverageStore.',
        paramDescs: {
          file: 'GeoTIFF raster file (.tif or .tiff).',
          workspace_name: 'Hashed ID or technical workspace name.',
          layer_name: 'Target layer display name.'
        },
        responseDesc: 'Raster layer published successfully.',
        fieldDescs: {
          layer_name: 'Unique GeoServer layer name',
          wms_url: 'WMS service URL for map rendering'
        }
      },
      'api-layer-groups-list': {
        title: 'List Layer Groups',
        description: 'Retrieves all composite layer groups belonging to the user for unified WMS rendering.',
        paramDescs: {
          workspace_id: 'Filter by Hashed ID or technical workspace name.'
        },
        responseDesc: 'Layer groups list retrieved successfully.',
        fieldDescs: {
          wms_layers_param: 'Value for Leaflet WMS LAYERS parameter'
        }
      },
      'api-styles-apply': {
        title: 'Apply SLD Style / ColorMap JSON to Layer',
        description: 'Creates and binds a symbology style (SLD XML or JSON ColorMap) to an existing GeoServer layer.',
        paramDescs: {
          layer_id: 'Target layer UUID to style.',
          style_sld: 'Full OGC StyledLayerDescriptor XML document.',
          style_json: 'JSON raster pixel classification rules array.'
        },
        responseDesc: 'Style applied successfully.'
      }
    }
  },
  th: {
    title: 'ข้อมูลอ้างอิง API (S2S และการนำเข้าข้อมูล)',
    subtitle: 'ข้อกำหนดเอ็นด์พอยต์ RESTful GeoServer Microservice v2.0 สำหรับการผสานรวมระบบสู่ระบบ',
    securityNotice: {
      title: 'คำเตือนความปลอดภัยของคีย์ API',
      desc: 'เอ็นด์พอยต์ S2S ทั้งหมดต้องใช้ส่วนหัวการตรวจสอบสิทธิ์ X-API-Key คีย์ API นี้ให้สิทธิ์การเข้าถึงข้อมูลเชิงพื้นที่ในเวิร์กสเปซของคุณอย่างสมบูรณ์ อย่ารวมคีย์ API ไว้ในโค้ดส่วนหน้าสาธารณะ (React, Vue, แอปมือถือ) ที่เก็บ git สาธารณะ หรือไฟล์ HTML ฝั่งไคลเอ็นต์ จัดเก็บคีย์ API เฉพาะในตัวแปรสภาพแวดล้อมเซิร์ฟเวอร์แบ็กเอนด์ของคุณเท่านั้น (เช่น .env ใน Laravel, Node.js หรือ FastAPI)'
    },
    endpoints: {
      'api-ingest-upload': {
        title: 'อัปโหลดไฟล์เชิงพื้นที่เดี่ยว (Single File Ingest)',
        description: 'รับไฟล์เชิงพื้นที่หนึ่งไฟล์ บันทึกลงในที่จัดเก็บชั่วคราว ตรวจสอบความถูกต้องของ CRS & รูปแบบ และลงทะเบียนงานนำเข้าลงในคิวการทำงานเบื้องหลัง (แบบอะซิงโครนัส)',
        paramDescs: {
          file: 'ไฟล์เชิงพื้นที่ (.tif, .tiff, .zip SHP, .geojson, .json, .kml, .kmz, .csv)',
          workspace_name: 'Hashed ID หรือชื่อทางเทคนิคของเวิร์กสเปซเป้าหมายใน GeoServer',
          layer_name: 'ชื่อที่แสดงของเลเยอร์ที่อ่านง่าย',
          description: 'หมายเหตุสั้นๆ เกี่ยวกับเลเยอร์'
        },
        responseDesc: 'รับงานนำเข้าแล้วและเข้าสู่คิวการประมวลผลของผู้ปฏิบัติงาน',
        fieldDescs: {
          id: 'UUID เฉพาะของงานนำเข้า (Job ID) สำหรับตรวจสอบสถานะ',
          status: 'สถานะเริ่มต้น: QUEUED (เข้าคิว) หรือ RUNNING (กำลังทำงาน)',
          progress: 'เปอร์เซ็นต์ความคืบหน้าของงาน (0-100%)'
        }
      },
      'api-ingest-batch': {
        title: 'อัปโหลดไฟล์เชิงพื้นที่แบบกลุ่ม (Multi-File Ingest)',
        description: 'รับไฟล์เชิงพื้นที่สูงสุด 10 ไฟล์พร้อมกันในการส่งแบบฟอร์มแบบมัลติพาร์ตเดียว สร้าง IngestJob อิสระสำหรับแต่ละไฟล์',
        paramDescs: {
          files: 'รายการไฟล์เชิงพื้นที่ (สูงสุด 10 ไฟล์ต่อกลุ่ม)',
          workspace_name: 'Hashed ID หรือชื่อทางเทคนิคของเวิร์กสเปซเป้าหมาย',
          display_names: 'อาร์เรย์สตริง JSON ที่มีชื่อที่แสดงตามลำดับของไฟล์',
          description: 'คำอธิบายการอัปโหลดแบบกลุ่ม'
        },
        responseDesc: 'ยอมรับการอัปโหลดแบบกลุ่มเรียบร้อยแล้ว',
        fieldDescs: {
          batch_id: 'ตัวระบุกลุ่มการอัปโหลดแบบกลุ่ม',
          job_ids: 'รายการ Job UUID ที่สามารถตรวจสอบสถานะได้ที่เอ็นด์พอยต์ /jobs/batch-status',
          total_submitted: 'จำนวนไฟล์ทั้งหมดที่เข้าคิวสำเร็จ'
        }
      },
      'api-batch-status': {
        title: 'ติดตามสถานะงานนำเข้าแบบกลุ่มพร้อมกัน',
        description: 'ตรวจสอบสถานะและความคืบหน้าของรายการ Job UUID พร้อมกัน',
        paramDescs: {
          job_ids: 'อาร์เรย์ที่มี UUID งานนำเข้า'
        },
        responseDesc: 'รายการสถานะของแต่ละงานที่ร้องขอ',
        fieldDescs: {
          status: 'QUEUED, RUNNING, COMPLETED หรือ FAILED',
          geoserver_name: 'ชื่อเลเยอร์เฉพาะที่ลงทะเบียนใน GeoServer และตาราง PostGIS',
          wms_url: 'URL เอ็นด์พอยต์ WMS ของ GeoServer สำหรับแสดงผลเลเยอร์บนเว็บแผนที่'
        }
      },
      'api-layer-list': {
        title: 'ดึงรายการเลเยอร์ทั้งหมดที่เป็นของคีย์ API',
        description: 'ส่งกลับรายการเลเยอร์ที่เผยแพร่โดยบัญชีคีย์ API ของผู้เรียก พร้อมด้วยข้อมูลเมตา WMS, ประเภทรูปแบบ, ขอบเขตเชิงพื้นที่ (bbox) และสถานะ',
        paramDescs: {
          page: 'หมายเลขหน้า (ค่าเริ่มต้น: 1)',
          size: 'จำนวนข้อมูลต่อหน้า (ค่าเริ่มต้น: 50)'
        },
        responseDesc: 'โหลดรายการเลเยอร์สำเร็จ',
        fieldDescs: {
          display_name: 'ชื่อที่อ่านง่ายซึ่งแสดงบนแดชบอร์ด',
          geoserver_name: 'ตัวระบุทางเทคนิคภายในใน GeoServer และ PostGIS',
          bbox: 'ขอบเขตพิกัดทางภูมิศาสตร์ WGS84 [minX, minY, maxX, maxY]'
        }
      },
      'api-layer-delete': {
        title: 'ลบเลเยอร์เดี่ยวแบบครบวงจร',
        description: 'ลบหนึ่งเลเยอร์ออกจาก GeoServer (เลเยอร์ + Store/FeatureType), ตาราง PostGIS (สำหรับเวกเตอร์), ไฟล์จริงในที่จัดเก็บข้อมูล และระเบียนฐานข้อมูลแบบครบวงจร',
        paramDescs: {
          workspace_name: 'ชื่อเวิร์กสเปซ GeoServer',
          layer_name: 'ฟิลด์ geoserver_name ของเลเยอร์ (ไม่ใช่ display_name)',
          recurse: 'ลบการพึ่งพาทั้งหมดใน GeoServer (ค่าเริ่มต้น: true)',
          layer_id: 'UUID ของเลเยอร์สำหรับการค้นหาข้อมูลที่เร็วขึ้น'
        },
        responseDesc: 'ลบเลเยอร์ออกจาก GeoServer และ PostGIS สำเร็จอย่างสมบูรณ์'
      },
      'api-layer-batch-delete': {
        title: 'ลบหลายเลเยอร์พร้อมกัน (Batch Delete)',
        description: 'รับอาร์เรย์ UUID ของเลเยอร์ที่ต้องการลบ แต่ละเลเยอร์จะได้รับการประมวลผลแบบแยกส่วนโดยไม่บล็อกเลเยอร์อื่นหากมีรายการใดล้มเหลว',
        paramDescs: {
          layer_ids: 'รายการ UUID ของเลเยอร์ที่ต้องการลบ'
        },
        responseDesc: 'รายงานผลการลบสำหรับแต่ละเลเยอร์'
      },
      'api-layer-groups': {
        title: 'สร้างกลุ่มเลเยอร์ใน GeoServer',
        description: 'รวมหลายเลเยอร์เข้าเป็นกลุ่มเลเยอร์ทางการใน GeoServer สามารถแสดงผลบน Leaflet/OpenLayers ได้ด้วยคำขอไทล์ WMS คอมโพสิตเดียว',
        paramDescs: {
          workspace_name: 'ชื่อทางเทคนิคของเวิร์กสเปซเป้าหมาย',
          name: 'ชื่อตัวระบุกลุ่ม (ตัวอักษร ตัวเลข ขีดล่างเท่านั้น)',
          title: 'ชื่อกลุ่มที่อ่านง่าย',
          layers: 'รายการ geoserver_name ของเลเยอร์สมาชิก'
        },
        responseDesc: 'สร้างกลุ่มเลเยอร์ใน GeoServer สำเร็จ',
        fieldDescs: {
          wms_layers_param: 'ค่าพารามิเตอร์ LAYERS ที่ใช้ใน Leaflet L.tileLayer.wms'
        }
      },
      'api-workspaces-list': {
        title: 'ดึงรายการเวิร์กสเปซ',
        description: 'ส่งกลับรายการเวิร์กสเปซทั้งหมดที่เป็นของบัญชีคีย์ API ของผู้เรียก',
        paramDescs: {},
        responseDesc: 'ดึงรายการเวิร์กสเปซสำเร็จ',
        fieldDescs: {
          id: 'Hashed ID เฉพาะของเวิร์กสเปซสำหรับการอ้างอิง API',
          workspace_name: 'ชื่อทางเทคนิคของเวิร์กสเปซใน GeoServer',
          display_name: 'ชื่อที่แสดงของเวิร์กสเปซที่อ่านง่าย'
        }
      },
      'api-workspaces-create': {
        title: 'สร้างเวิร์กสเปซใหม่',
        description: 'ลงทะเบียนเวิร์กสเปซใหม่ใน GeoServer และฐานข้อมูลเชิงพื้นที่',
        paramDescs: {
          display_name: 'ชื่อที่แสดงของเวิร์กสเปซที่อ่านง่าย',
          workspace_name: 'ชื่อทางเทคนิคที่เลือกได้ (สร้างอัตโนมัติหากเว้นว่าง)',
          visibility: 'การมองเห็น: private หรือ public'
        },
        responseDesc: 'สร้างเวิร์กสเปซใน GeoServer สำเร็จ'
      },
      'api-workspaces-delete': {
        title: 'ลบเวิร์กสเปซแบบต่อเนื่อง (Cascade Delete)',
        description: 'ลบเวิร์กสเปซออกจาก GeoServer อย่างถาวรพร้อมกับ Store, เลเยอร์, ตาราง PostGIS และไฟล์จริงทั้งหมดที่เกี่ยวข้อง',
        paramDescs: {
          identifier: 'Hashed ID หรือชื่อทางเทคนิคของเวิร์กสเปซที่ต้องการลบ',
          recurse: 'ลบการพึ่งพาทั้งหมดซ้ำ (ค่าเริ่มต้น: true)'
        },
        responseDesc: 'ลบเวิร์กสเปซและการพึ่งพาทั้งหมดสำเร็จ'
      },
      'api-ingest-job-detail': {
        title: 'รายละเอียดสถานะงานนำเข้า',
        description: 'ตรวจสอบเปอร์เซ็นต์ความคืบหน้าและสถานะการประมวลผลของงานนำเข้าในเบื้องหลัง',
        paramDescs: {
          job_id: 'UUID ของงานนำเข้าที่ต้องการตรวจสอบ'
        },
        responseDesc: 'ข้อมูลสถานะของงานนำเข้า',
        fieldDescs: {
          status: 'QUEUED, RUNNING, COMPLETED หรือ FAILED',
          progress: 'เปอร์เซ็นต์ความคืบหน้าของการประมวลผล (0 - 100%)',
          geoserver_name: 'ชื่อเลเยอร์ใน GeoServer เมื่อประมวลผลสำเร็จ'
        }
      },
      'api-layer-publish-vector': {
        title: 'เผยแพร่ไฟล์เวกเตอร์โดยตรง (แบบซิงโครนัส)',
        description: 'อัปโหลดและลงทะเบียนชุดข้อมูลเวกเตอร์ลงใน PostGIS และ GeoServer โดยตรงโดยไม่ต้องเข้าคิวผู้ปฏิบัติงาน',
        paramDescs: {
          file: 'ไฟล์เอกสารเวกเตอร์ (.zip Shapefile, .geojson, .kml, .kmz, .csv)',
          workspace_name: 'Hashed ID หรือชื่อทางเทคนิคของเวิร์กสเปซ',
          layer_name: 'ชื่อเลเยอร์ที่ต้องการ'
        },
        responseDesc: 'เผยแพร่เลเยอร์เวกเตอร์สำเร็จ',
        fieldDescs: {
          layer_name: 'ชื่อเลเยอร์เฉพาะใน GeoServer',
          wms_url: 'URL บริการ WMS สำหรับแสดงผลแผนที่'
        }
      },
      'api-layer-publish-raster': {
        title: 'เผยแพร่ไฟล์แรสเตอร์โดยตรง (แบบซิงโครนัส)',
        description: 'อัปโหลดและลงทะเบียนภาพ GeoTIFF ลงใน CoverageStore ของ GeoServer โดยตรง',
        paramDescs: {
          file: 'ไฟล์ภาพ GeoTIFF (.tif หรือ .tiff)',
          workspace_name: 'Hashed ID หรือชื่อทางเทคนิคของเวิร์กสเปซ',
          layer_name: 'ชื่อเลเยอร์ที่ต้องการ'
        },
        responseDesc: 'เผยแพร่เลเยอร์แรสเตอร์สำเร็จ',
        fieldDescs: {
          layer_name: 'ชื่อเลเยอร์เฉพาะใน GeoServer',
          wms_url: 'URL บริการ WMS สำหรับแสดงผลแผนที่'
        }
      },
      'api-layer-groups-list': {
        title: 'ดึงรายการกลุ่มเลเยอร์',
        description: 'ดึงกลุ่มเลเยอร์คอมโพสิตทั้งหมดของผู้ใช้สำหรับการแสดงผล WMS หลายเลเยอร์',
        paramDescs: {
          workspace_id: 'กรองตาม Hashed ID หรือชื่อเวิร์กสเปซทางเทคนิค'
        },
        responseDesc: 'ดึงรายการกลุ่มเลเยอร์สำเร็จ',
        fieldDescs: {
          wms_layers_param: 'ค่าพารามิเตอร์ LAYERS บน WMS ของ Leaflet'
        }
      },
      'api-styles-apply': {
        title: 'ใช้สไตล์ SLD / ColorMap JSON กับเลเยอร์',
        description: 'สร้างและเชื่อมโยงสไตล์สัญลักษณ์ (SLD XML หรือ JSON ColorMap) เข้ากับเลเยอร์ที่มีอยู่ใน GeoServer',
        paramDescs: {
          layer_id: 'UUID ของเลเยอร์เป้าหมายที่จะกำหนดสไตล์',
          style_sld: 'เอกสาร XML OGC StyledLayerDescriptor ฉบับสมบูรณ์',
          style_json: 'อาร์เรย์กฎการจำแนกประเภทพิกเซลแรสเตอร์ JSON'
        },
        responseDesc: 'ใช้สไตล์สำเร็จ'
      }
    }
  }
}

export function getApiReferenceContent(lang = 'id') {
  const overlay = localizedOverlays[lang] || localizedOverlays.id

  const endpoints = baseEndpoints.map((ep) => {
    const epOverlay = overlay.endpoints?.[ep.id] || {}

    const params = ep.params?.map((p) => ({
      ...p,
      description: epOverlay.paramDescs?.[p.name] || p.name
    }))

    const bodyParams = ep.bodyParams?.map((p) => ({
      ...p,
      description: epOverlay.paramDescs?.[p.name] || p.name
    }))

    const fieldDescriptions = ep.response.fieldDescriptions?.map((fd) => ({
      ...fd,
      desc: epOverlay.fieldDescs?.[fd.field] || ''
    })) || []

    return {
      ...ep,
      title: epOverlay.title || ep.id,
      description: epOverlay.description || '',
      params,
      bodyParams,
      response: {
        ...ep.response,
        description: epOverlay.responseDesc || '',
        fieldDescriptions
      }
    }
  })

  return {
    id: 'api-reference',
    title: overlay.title,
    subtitle: overlay.subtitle,
    securityNotice: overlay.securityNotice,
    endpoints
  }
}

export const apiReferenceContent = getApiReferenceContent('id')
