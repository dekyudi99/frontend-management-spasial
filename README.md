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

## Autentikasi SSO & Logout Terpusat

Aplikasi ini menggunakan Keycloak OpenID Connect (OIDC) berbasis Authorization Code Flow dengan PKCE (S256). Logout terpusat didukung secara otomatis melalui mekanisme OP Session Monitoring (`check_session_iframe`) dengan interval 2 detik, event listener OIDC (`addUserSignedOut`, `addSilentRenewError`, `addAccessTokenExpired`), interceptor respons HTTP 401 (dengan retry silent renewal satu kali), serta pengecekan saat tab kembali aktif (`visibilitychange`/`focus` dengan throttle 15 detik). Ketika sesi Keycloak diakhiri di aplikasi lain (misal Grovia) atau di konsol admin Keycloak, sesi lokal VoxaGIS akan dibersihkan tanpa memicu loop redirect. Batasan: Pada browser yang memblokir third-party cookies / iframe partition secara agresif, deteksi via iframe mungkin terhambat, namun sesi tetap dijamin keluar saat tab difokuskan kembali atau paling lambat saat masa berlaku token (5 menit) habis.

### Rute Masuk Terpusat SSO (`/sso/start`)

Aplikasi menyediakan rute masuk khusus `/sso/start?returnTo=<path>` yang memungkinkan Portal SSO langsung mengarahkan user ke dashboard atau path tujuan tanpa melalui landing page dan tanpa klik tombol manual. Rute ini memvalidasi parameter `returnTo` melalui `validateReturnTo` (`src/utils/ssoSecurity.js`) guna mencegah kerentanan Open Redirect. Parameter `returnTo` hanya diterima bila berupa path relatif internal yang diawali satu slash `/`, bukan protocol-relative (`//`), tidak mengandung skema URI (`http:`, `javascript:`, dsb.), dan bukan rute `/sso/start` itu sendiri. Jika user sudah memiliki sesi Keycloak aktif, proses login berjalan otomatis dan user langsung diarahkan ke path tujuan (default: `/dashboard`). Landing page publik (`/`) tetap berfungsi seperti biasa bagi pengguna umum.

## Dokumentasi API

Buka halaman `/docs` di dalam aplikasi untuk panduan lengkap penggunaan API, termasuk:
- Upload layer via dashboard
- Integrasi S2S (FlowGIS, Laravel, Python)
- Endpoint hapus layer (single & batch)
- Format style (SLD & JSON ColorMap)
- Contoh kode cURL, PHP/Laravel, Python
