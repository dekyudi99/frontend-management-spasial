# AstraGIS Frontend

Frontend platform GIS berbasis web untuk pengelolaan, publikasi, dan visualisasi data spasial.

## Tech Stack

- **Framework:** React 19 + Vite 8
- **UI Library:** Ant Design (antd 6)
- **Styling:** TailwindCSS 4 + CSS custom
- **Routing:** React Router DOM 7
- **State/Fetch:** TanStack React Query 5
- **Peta:** Leaflet + React Leaflet
- **HTTP:** Axios

## Fitur Utama

- 🗺️ **Upload Layer Multi-Format** — GeoTIFF, GeoJSON, Shapefile (ZIP), KML, KMZ, CSV
- 📦 **Batch Upload** — Hingga 10 file sekaligus dengan pemrosesan latar belakang
- 🗂️ **Layer Groups** — Gabungkan beberapa layer untuk overlay WMS
- 🎨 **Style Management** — Terapkan SLD XML atau JSON ColorMap ke layer
- 🔑 **API Key Management** — Generate & kelola API Key untuk integrasi S2S
- 🗑️ **Hapus Otomatis** — Penghapusan layer membersihkan GeoServer, PostGIS, dan storage
- 🌐 **Internasionalisasi** — Dukungan multi-bahasa (ID/EN)
- 📄 **Dokumentasi Terintegrasi** — Panduan API tersedia di halaman `/docs`

## Prasyarat

- Node.js >= 18
- Backend Main API aktif (`VITE_API_BASE_URL`)
- GeoServer Microservice aktif (`VITE_GEOSERVER_MICROSERVICE_URL`)

## Environment Variables

Salin `.env.example` ke `.env.local`:

```bash
cp .env.example .env.local
```

Variabel yang diperlukan:

| Variable | Keterangan |
|---|---|
| `VITE_APP_NAME` | Nama aplikasi (default: AstraGIS) |
| `VITE_API_BASE_URL` | URL Main API (contoh: `http://localhost:8000`) |
| `VITE_GEOSERVER_MICROSERVICE_URL` | URL GeoServer Microservice (contoh: `http://localhost:8005`) |
| `VITE_GEOSERVER_WMS_URL` | URL GeoServer WMS (contoh: `http://localhost:8080/geoserver/wms`) |

## Menjalankan Lokal

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka `http://localhost:5173` di browser.

## Build Produksi

```bash
npm run build
```

Output tersedia di folder `dist/`.

## Docker

```bash
# Build & jalankan dengan Docker Compose
docker compose up --build
```

## Struktur Folder

```
src/
├── api/          # Fungsi HTTP (Axios) untuk setiap service
├── components/   # Komponen reusable (Modal, Card, Header, dsb.)
├── context/      # React Context (Language, Sidebar)
├── i18n/         # File terjemahan (ID/EN)
├── layout/       # Layout wrapper (Dashboard, Auth, Main)
├── pages/        # Halaman utama (Dashboard, Layer, Workspace, dsb.)
└── utils/        # Utility functions (geoUtils, formatTanggal, dsb.)
```

## Dokumentasi API

Buka halaman `/docs` di dalam aplikasi untuk panduan lengkap penggunaan API, termasuk:
- Upload layer via dashboard
- Integrasi S2S (FlowGIS, Laravel, Python)
- Endpoint hapus layer (single & batch)
- Format style (SLD & JSON ColorMap)
- Contoh kode cURL, PHP/Laravel, Python
