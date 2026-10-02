const content = {
  id: {
    id: 'quickstart',
    title: 'Mulai Cepat (Quick Start)',
    subtitle: 'Pilih panduan sesuai peran Anda: Pengguna Dashboard atau Developer Sistem (S2S).',
    tracks: [
      {
        id: 'track-user',
        title: 'Jalur 1: Pengguna Dashboard (Non-Teknis)',
        badge: '3 Menit',
        desc: 'Panduan langkah demi langkah mengunggah data spasial pertama Anda dan menampilkannya di peta tanpa mengetik baris kode.',
        steps: [
          {
            step: 1,
            title: 'Buka Halaman Layer',
            desc: 'Masuk ke dashboard AstraGIS, lalu klik menu "Layer" pada bilah navigasi kiri.',
            hint: 'URL: /dashboard atau klik menu Layer di sidebar'
          },
          {
            step: 2,
            title: 'Klik Tombol "+ Tambah Layer"',
            desc: 'Klik tombol biru "+ Tambah Layer" di pojok kanan atas untuk membuka jendela upload berkas.',
            hint: 'Mendukung drag-and-drop berkas langsung dari file manager komputer Anda'
          },
          {
            step: 3,
            title: 'Pilih Workspace & Berkas Data',
            desc: 'Pilih workspace target (misal: "Default Workspace"). Masukkan berkas (.tif, .zip Shapefile, .geojson, .kml, .kmz, atau .csv). Anda dapat memilih hingga 10 berkas sekaligus (batch upload).',
            hint: 'Nama tampilan (Display Name) dapat disesuaikan per berkas sebelum diunggah'
          },
          {
            step: 4,
            title: 'Klik "Upload" & Pantau Progress',
            desc: 'Sistem memproses berkas di latar belakang (background worker). Setelah status berganti hijau "Selesai", klik tombol tutup jendela.',
            hint: 'Layer langsung muncul di urutan paling atas daftar dan siap diaktifkan di peta'
          }
        ]
      },
      {
        id: 'track-dev',
        title: 'Jalur 2: Developer Integrasi (S2S & API)',
        badge: 'API Ready',
        desc: 'Panduan membuat API Key dan melakukan publikasi data pertama secara terprogram dari backend sistem Anda.',
        steps: [
          {
            step: 1,
            title: 'Dapatkan API Key di Dashboard',
            desc: 'Buka menu "API Key" di dashboard → klik "Generate API Key". Salin token yang dihasilkan dan simpan di file .env backend Anda.',
            hint: 'Format token: agis_sk_... atau gsvc_sk_... (hanya ditampilkan sekali saat pembuatan)'
          },
          {
            step: 2,
            title: 'Salin Workspace ID Target',
            desc: 'Buka menu "Workspace" di dashboard. Salin Hashed ID workspace (contoh: bM7xK2pL9qAa...) atau nama teknis workspace.',
            hint: 'Hashed ID aman disimpan di konfigurasi aplikasi Anda'
          },
          {
            step: 3,
            title: 'Kirim Request Ingest via cURL / Backend',
            desc: 'Kirim HTTP POST multipart ke endpoint /api/v1/ingest/uploads dengan menyertakan header X-API-Key.',
            hint: 'Header wajib: X-API-Key: <token_rahasia>'
          }
        ]
      }
    ]
  },
  en: {
    id: 'quickstart',
    title: 'Quick Start',
    subtitle: 'Choose the guide that matches your role: Dashboard User or System Developer (S2S).',
    tracks: [
      {
        id: 'track-user',
        title: 'Track 1: Dashboard User (Non-Technical)',
        badge: '3 Minutes',
        desc: 'Step-by-step guide to uploading your first spatial data and visualizing it on the map without writing any code.',
        steps: [
          {
            step: 1,
            title: 'Open Layers Page',
            desc: 'Log in to the AstraGIS dashboard, then click the "Layers" menu on the left sidebar navigation.',
            hint: 'URL: /dashboard or click the Layers menu in sidebar'
          },
          {
            step: 2,
            title: 'Click "+ Add Layer" Button',
            desc: 'Click the blue "+ Add Layer" button at the top right to open the file upload modal.',
            hint: 'Supports drag-and-drop files directly from your computer file explorer'
          },
          {
            step: 3,
            title: 'Select Workspace & Data Files',
            desc: 'Select the target workspace (e.g., "Default Workspace"). Select files (.tif, .zip Shapefile, .geojson, .kml, .kmz, or .csv). You can select up to 10 files simultaneously (batch upload).',
            hint: 'Display Name can be customized per file before uploading'
          },
          {
            step: 4,
            title: 'Click "Upload" & Monitor Progress',
            desc: 'The system processes files in the background worker. Once the status turns green "Completed", click the close button.',
            hint: 'Layers appear instantly at the top of the list and are ready to be activated on the map'
          }
        ]
      },
      {
        id: 'track-dev',
        title: 'Track 2: Integration Developer (S2S & API)',
        badge: 'API Ready',
        desc: 'Guide to generating an API Key and programmatically publishing your first spatial layer from your backend system.',
        steps: [
          {
            step: 1,
            title: 'Obtain API Key in Dashboard',
            desc: 'Open "API Key" menu in dashboard → click "Generate API Key". Copy the resulting secret token and save it in your backend .env file.',
            hint: 'Token format: agis_sk_... or gsvc_sk_... (displayed only once upon creation)'
          },
          {
            step: 2,
            title: 'Copy Target Workspace ID',
            desc: 'Open "Workspace" menu in dashboard. Copy the Hashed Workspace ID (e.g. bM7xK2pL9qAa...) or technical workspace name.',
            hint: 'Hashed ID is safe to store in your application configuration'
          },
          {
            step: 3,
            title: 'Send Ingest Request via cURL / Backend',
            desc: 'Send an HTTP multipart POST request to the /api/v1/ingest/uploads endpoint with the X-API-Key header.',
            hint: 'Mandatory header: X-API-Key: <secret_token>'
          }
        ]
      }
    ]
  },
  th: {
    id: 'quickstart',
    title: 'เริ่มต้นอย่างรวดเร็ว (Quick Start)',
    subtitle: 'เลือกคู่มือตามบทบาทของคุณ: ผู้ใช้แดชบอร์ด หรือ นักพัฒนาระบบ (S2S)',
    tracks: [
      {
        id: 'track-user',
        title: 'เส้นทางที่ 1: ผู้ใช้แดชบอร์ด (ไม่ใช่เชิงเทคนิค)',
        badge: '3 นาที',
        desc: 'คำแนะนำทีละขั้นตอนในการอัปโหลดข้อมูลเชิงพื้นที่ชุดแรกของคุณและแสดงบนแผนที่โดยไม่ต้องเขียนโค้ด',
        steps: [
          {
            step: 1,
            title: 'เปิดหน้าเลเยอร์',
            desc: 'เข้าสู่ระบบแดชบอร์ด AstraGIS จากนั้นคลิกเมนู "เลเยอร์" บนแถบนำทางด้านซ้าย',
            hint: 'URL: /dashboard หรือคลิกเมนูเลเยอร์ในแถบด้านข้าง'
          },
          {
            step: 2,
            title: 'คลิกปุ่ม "+ เพิ่มเลเยอร์"',
            desc: 'คลิกปุ่มสีน้ำเงิน "+ เพิ่มเลเยอร์" ที่มุมขวาบนเพื่อเปิดหน้าต่างอัปโหลดไฟล์',
            hint: 'รองรับการลากและวางไฟล์โดยตรงจากตัวจัดการไฟล์ของคุณ'
          },
          {
            step: 3,
            title: 'เลือกเวิร์กสเปซและไฟล์ข้อมูล',
            desc: 'เลือกเวิร์กสเปซเป้าหมาย (เช่น "Default Workspace") ใส่ไฟล์ (.tif, .zip Shapefile, .geojson, .kml, .kmz หรือ .csv) คุณสามารถเลือกได้สูงสุด 10 ไฟล์พร้อมกัน (การอัปโหลดแบบกลุ่ม)',
            hint: 'ชื่อที่แสดงสามารถปรับแต่งแยกตามไฟล์ได้ก่อนอัปโหลด'
          },
          {
            step: 4,
            title: 'คลิก "อัปโหลด" และติดตามความคืบหน้า',
            desc: 'ระบบจะประมวลผลไฟล์ในเบื้องหลัง เมื่อสถานะเปลี่ยนเป็นสีเขียว "เสร็จสมบูรณ์" ให้คลิกปุ่มปิดหน้าต่าง',
            hint: 'เลเยอร์จะปรากฏที่ด้านบนสุดของรายการทันทีและพร้อมเปิดใช้งานบนแผนที่'
          }
        ]
      },
      {
        id: 'track-dev',
        title: 'เส้นทางที่ 2: นักพัฒนาการผสานรวม (S2S & API)',
        badge: 'API พร้อมใช้งาน',
        desc: 'คำแนะนำในการสร้างคีย์ API และเผยแพร่ข้อมูลเชิงพื้นที่ชุดแรกของคุณโดยใช้โปรแกรมจากระบบแบ็กเอนด์',
        steps: [
          {
            step: 1,
            title: 'รับคีย์ API ในแดชบอร์ด',
            desc: 'เปิดเมนู "API Key" ในแดชบอร์ด → คลิก "สร้างคีย์ API" คัดลอกโทเค็นที่ได้และบันทึกลงในไฟล์ .env ของแบ็กเอนด์ของคุณ',
            hint: 'รูปแบบโทเค็น: agis_sk_... หรือ gsvc_sk_... (แสดงเพียงครั้งเดียวเมื่อสร้าง)'
          },
          {
            step: 2,
            title: 'คัดลอก ID เวิร์กสเปซเป้าหมาย',
            desc: 'เปิดเมนู "Workspace" ในแดชบอร์ด คัดลอก Hashed ID ของเวิร์กสเปซ (เช่น bM7xK2pL9qAa...) หรือชื่อทางเทคนิคของเวิร์กสเปซ',
            hint: 'Hashed ID ปลอดภัยที่จะจัดเก็บไว้ในการกำหนดค่าแอปพลิเคชันของคุณ'
          },
          {
            step: 3,
            title: 'ส่งคำขอ Ingest ผ่าน cURL / แบ็กเอนด์',
            desc: 'ส่งคำขอ HTTP POST multipart ไปยังเอ็นด์พอยต์ /api/v1/ingest/uploads โดยระบุส่วนหัว X-API-Key',
            hint: 'ส่วนหัวที่จำเป็น: X-API-Key: <secret_token>'
          }
        ]
      }
    ]
  }
}

export const getQuickstartContent = (lang = 'id') => content[lang] || content.id
export const quickstartContent = getQuickstartContent('id')
