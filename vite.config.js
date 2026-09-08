import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // pastikan host true agar listen di semua interface (0.0.0.0)
    port: 5173, // sesuaikan port yang lu pakai
    allowedHosts: [
      'astragis.ikya.my.id' // daftarkan domain tunnel lu di sini
    ],
    hmr: {
    clientPort: 443 // agar WebSocket HMR lewat HTTPS Cloudflare
  }
    // Alternatif jika ingin mengizinkan semua host:
    // allowedHosts: true
  }
})
