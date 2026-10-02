const dashboardGuideTranslations = {
  id: {
    id: 'dashboard-guide',
    title: 'Panduan Dashboard (Pengguna Non-Teknis)',
    subtitle: 'Langkah praktis mengelola workspace, layer spasial, visualisasi peta, dan pembersihan data di antarmuka web.',
    features: [
      {
        id: 'guide-workspace',
        title: '1. Manajemen Workspace (Folder Proyek)',
        subtitle: 'Mengelompokkan data spasial per departemen, proyek penelitian, atau wilayah kerja.',
        whenToUse: 'Gunakan fitur Workspace sebelum mengunggah layer agar data tertata rapi. Satu workspace bertindak sebagai wadah terisolasi di GeoServer dan database PostGIS.',
        inputs: [
          { name: 'Nama Workspace', type: 'string', required: true, description: 'Nama label proyek yang mudah dikenali (boleh ada spasi).', example: 'Proyek Mitigasi Banjir Bali' },
          { name: 'Deskripsi', type: 'string', required: false, description: 'Catatan tambahan terkait tujuan pengumpulan data spasial.', example: 'Kumpulan layer raster curah hujan dan sebaran genangan air 2024.' }
        ],
        steps: [
          { step: 1, title: 'Buka Menu Workspace', desc: 'Klik "Workspace" pada sidebar dashboard kiri.' },
          { step: 2, title: 'Klik "+ Tambah Workspace"', desc: 'Tekan tombol di kanan atas untuk memunculkan modal pembuatan workspace.' },
          { step: 3, title: 'Isi Nama & Simpan', desc: 'Ketik nama workspace dan deskripsi singkat, lalu klik "Simpan". Workspace baru langsung aktif dan memiliki Workspace ID unik.' }
        ],
        output: {
          text: 'Workspace baru terbentuk di dashboard dan otomatis terdaftar sebagai workspace resmi di GeoServer.',
          response: null
        },
        commonErrors: [
          { problem: 'Nama workspace kosong', solution: 'Pastikan mengisi nama minimal 3 karakter sebelum menekan tombol simpan.' }
        ],
        tips: [
          'Setiap workspace memiliki Hashed ID (ikon kunci). Anda dapat menyalin ID ini untuk dibagikan kepada rekan developer yang mengintegrasikan sistem.'
        ]
      },
      {
        id: 'guide-upload',
        title: '2. Upload Layer (Single & Batch Upload)',
        subtitle: 'Mengunggah hingga 10 file sekaligus dengan pemrosesan otomatis di latar belakang.',
        whenToUse: 'Gunakan saat Anda memiliki file spasial hasil survei lapangan, citra drone/satelit, data tabular CSV koordinat, atau batas poligon yang ingin ditampilkan di peta web.',
        inputs: [
          { name: 'Workspace Target', type: 'pilihan', required: true, description: 'Pilih workspace tempat layer akan disimpan.', example: 'Default Workspace' },
          { name: 'File Spasial', type: 'file / files[]', required: true, description: 'Mendukung .tif, .tiff, .zip (Shapefile), .geojson, .json, .kml, .kmz, .csv (maks. 10 file per batch).', example: 'banjir_2024.zip, curah_hujan.tif' },
          { name: 'Display Name (Per Berkas)', type: 'string', required: false, description: 'Nama layer tampilan ramah pengguna (otomatis terisi dari nama file jika dikosongkan).', example: 'Peta Risiko Banjir Wilayah A' }
        ],
        steps: [
          { step: 1, title: 'Buka Halaman Layer & Klik "+ Tambah Layer"', desc: 'Buka menu Layer lalu klik tombol biru "+ Tambah Layer".' },
          { step: 2, title: 'Pilih Berkas File', desc: 'Drag-and-drop satu atau beberapa file (maksimal 10 file). Nama tampilan otomatis diekstrak dan dapat Anda edit langsung di kotak input masing-masing file.' },
          { step: 3, title: 'Klik "Upload" & Pantau Antrean', desc: 'Proses konversi format dan registrasi GeoServer berlangsung otomatis. Indikator persentase loading menunjukkan progress per berkas.' },
          { step: 4, title: 'Selesai & Tutup Modal', desc: 'Saat semua item bertanda centang hijau "Selesai", klik "Tutup". Layer langsung muncul di halaman pertama daftar layer.' }
        ],
        output: {
          text: 'Layer terdaftar di dashboard dengan badge tipe format (TIF, SHP, GEOJSON, KML, KMZ, CSV) dan langsung memiliki URL GeoServer WMS aktif.',
          response: null
        },
        commonErrors: [
          { problem: 'Upload Shapefile gagal', solution: 'Shapefile harus diarsipkan ke dalam format .zip yang berisi berkas .shp, .shx, .dbf, dan .prj sekaligus.' },
          { problem: 'CSV ditolak', solution: 'Pastikan file CSV memiliki kolom header latitude & longitude atau kolom WKT geometry.' },
          { problem: 'KMZ kosong', solution: 'Pastikan file KMZ berisi setidaknya satu berkas .kml yang valid di dalamnya.' }
        ],
        tips: [
          'Ukuran file tidak dibatasi (unlimited). Namun untuk file berukuran sangat besar (misal raster > 1 GB), pastikan koneksi internet stabil selama proses transfer berlangsung.',
          'Jika mengunggah file dengan nama yang sama, sistem tidak akan menolak atau menimpa file lama. Sistem otomatis memberikan pengenal internal unik di GeoServer.'
        ]
      },
      {
        id: 'guide-map',
        title: '3. Visualisasi & Interaksi Peta',
        subtitle: 'Menampilkan layer di atas peta dasar (basemap), mengatur urutan tumpukan, dan memeriksa informasi fitur.',
        whenToUse: 'Gunakan peta interaktif untuk menganalisis tumpang tindih data spasial, zoom ke cakupan layer (*zoom to extent*), dan membandingkan beberapa wilayah.',
        inputs: [
          { name: 'Layer Toggle', type: 'checkbox', required: true, description: 'Centang kotak layer di panel daftar layer untuk menampilkan atau menyembunyikan.', example: 'Aktif / Nonaktif' },
          { name: 'Transparansi (Opacity)', type: 'slider (0-100%)', required: false, description: 'Mengatur tingkat tembus pandang layer raster/vektor terhadap basemap.', example: '80%' }
        ],
        steps: [
          { step: 1, title: 'Buka Halaman Peta / Workspace', desc: 'Pilih workspace dan buka tampilan peta terintegrasi.' },
          { step: 2, title: 'Aktifkan Layer', desc: 'Centang sakelar di samping nama layer. Peta akan me-render data dari GeoServer secara otomatis.' },
          { step: 3, title: 'Zoom to Extent', desc: 'Klik ikon teropong atau tombol fokus di samping layer untuk langsung mengarahkan tampilan peta ke koordinat wilayah layer tersebut.' }
        ],
        output: {
          text: 'Visualisasi peta menampilkan render tile WMS beresolusi tinggi dengan legenda warna yang sesuai.',
          response: null
        },
        commonErrors: [
          { problem: 'Peta tampak kosong setelah layer dicentang', solution: 'Gunakan tombol "Zoom to Extent" untuk melompat ke posisi geografis layer berada, atau periksa apakah layer berada di luar koordinat basemap.' }
        ],
        tips: [
          'Layer raster berat dirender via caching tile GeoServer sehingga navigasi pan dan zoom tetap mulus.'
        ]
      },
      {
        id: 'guide-delete',
        title: '4. Penghapusan Layer (Tunggal & Batch)',
        subtitle: 'Membersihkan layer dari dashboard, GeoServer, dan tabel PostGIS secara tuntas.',
        whenToUse: 'Gunakan saat layer sudah tidak dibutuhkan, usang, atau terjadi kesalahan upload berkas.',
        inputs: [
          { name: 'Pilihan Layer', type: 'checkbox / tombol', required: true, description: 'Pilih tombol hapus pada kartu layer tunggal atau centang beberapa layer untuk hapus massal.', example: '1 atau lebih layer' }
        ],
        steps: [
          { step: 1, title: 'Pilih Layer yang Ingin Dihapus', desc: 'Arahkan kursor ke kartu layer untuk melihat ikon tempat sampah, atau centang kotak di beberapa kartu layer.' },
          { step: 2, title: 'Konfirmasi Penghapusan', desc: 'Klik tombol "Hapus" atau "Hapus Terpilih". Dialog konfirmasi akan meminta persetujuan Anda.' },
          { step: 3, title: 'Pembersihan Otomatis Berjalan', desc: 'Sistem secara otomatis menghapus layer di GeoServer, menghapus tabel PostGIS, menghapus file fisik di penyimpanan server, serta membersihkan riwayat job.' }
        ],
        output: {
          text: 'Layer terhapus sepenuhnya tanpa meninggalkan berkas sisa (*garbage files*) di server GeoServer.',
          response: null
        },
        commonErrors: [
          { problem: 'Penghapusan tidak dapat dibatalkan', solution: 'Pastikan layer yang akan dihapus benar-benar tidak lagi digunakan oleh proyek atau aplikasi web klien.' }
        ],
        tips: [
          'Gunakan fitur batch delete dengan mencentang "Pilih Semua" jika ingin merapikan banyak layer sekaligus dalam satu kali klik.'
        ]
      }
    ]
  },
  en: {
    id: 'dashboard-guide',
    title: 'Dashboard Guide (Non-Technical Users)',
    subtitle: 'Practical steps to manage workspaces, spatial layers, map visualizations, and clean up data through the web console.',
    features: [
      {
        id: 'guide-workspace',
        title: '1. Workspace Management (Project Folders)',
        subtitle: 'Group spatial data by department, research project, or operational jurisdiction.',
        whenToUse: 'Use Workspaces prior to uploading layers to keep your spatial data organized. A workspace acts as an isolated container in both GeoServer and the PostGIS database.',
        inputs: [
          { name: 'Workspace Name', type: 'string', required: true, description: 'A recognizable project label (spaces allowed).', example: 'Bali Flood Mitigation Project' },
          { name: 'Description', type: 'string', required: false, description: 'Additional notes regarding the purpose of the spatial data collection.', example: 'Rainfall raster layers and flood inundation extent 2024.' }
        ],
        steps: [
          { step: 1, title: 'Open Workspace Menu', desc: 'Click "Workspace" on the dashboard left sidebar.' },
          { step: 2, title: 'Click "+ Add Workspace"', desc: 'Press the top-right button to open the workspace creation modal.' },
          { step: 3, title: 'Enter Name & Save', desc: 'Type workspace name and a brief description, then click "Save". The new workspace activates immediately with a unique Workspace ID.' }
        ],
        output: {
          text: 'A new workspace is created on the dashboard and automatically registered as an official workspace in GeoServer.',
          response: null
        },
        commonErrors: [
          { problem: 'Empty workspace name', solution: 'Ensure the name contains at least 3 characters before clicking save.' }
        ],
        tips: [
          'Each workspace has a Hashed ID (key icon). You can copy this ID to share with developers integrating with your system.'
        ]
      },
      {
        id: 'guide-upload',
        title: '2. Layer Upload (Single & Batch Ingest)',
        subtitle: 'Upload up to 10 files simultaneously with automated background processing.',
        whenToUse: 'Use when you have spatial files from field surveys, drone/satellite imagery, tabular CSV coordinates, or polygon boundaries to display on a web map.',
        inputs: [
          { name: 'Target Workspace', type: 'select', required: true, description: 'Select the workspace where layers will be stored.', example: 'Default Workspace' },
          { name: 'Spatial File', type: 'file / files[]', required: true, description: 'Supports .tif, .tiff, .zip (Shapefile), .geojson, .json, .kml, .kmz, .csv (max 10 files per batch).', example: 'flood_2024.zip, rainfall.tif' },
          { name: 'Display Name (Per File)', type: 'string', required: false, description: 'User-friendly layer display name (auto-filled from filename if omitted).', example: 'Flood Hazard Map Region A' }
        ],
        steps: [
          { step: 1, title: 'Open Layers Page & Click "+ Add Layer"', desc: 'Navigate to the Layer menu and click the blue "+ Add Layer" button.' },
          { step: 2, title: 'Select Files', desc: 'Drag-and-drop one or multiple files (max 10 files). Display names are extracted automatically and can be edited inline.' },
          { step: 3, title: 'Click "Upload" & Monitor Queue', desc: 'Format conversion and GeoServer registration run automatically. Loading percentages indicate per-file progress.' },
          { step: 4, title: 'Complete & Close Modal', desc: 'When all items show green checkmarks "Completed", click "Close". Layers immediately appear on the first page of the layer list.' }
        ],
        output: {
          text: 'Layers are registered in the dashboard with format badges (TIF, SHP, GEOJSON, KML, KMZ, CSV) and activate an active GeoServer WMS URL immediately.',
          response: null
        },
        commonErrors: [
          { problem: 'Shapefile upload failed', solution: 'Shapefiles must be zipped into a .zip archive containing .shp, .shx, .dbf, and .prj files together.' },
          { problem: 'CSV rejected', solution: 'Ensure the CSV file contains latitude & longitude header columns or a WKT geometry column.' },
          { problem: 'Empty KMZ', solution: 'Ensure the KMZ archive contains at least one valid .kml file inside.' }
        ],
        tips: [
          'File size is unlimited. However, for extremely large files (e.g. raster > 1 GB), ensure a stable internet connection during transfer.',
          'Uploading files with identical names will not overwrite existing layers; the system generates unique internal identifiers in GeoServer automatically.'
        ]
      },
      {
        id: 'guide-map',
        title: '3. Map Visualization & Interaction',
        subtitle: 'Overlay layers onto base maps, manage render z-index order, and inspect feature details.',
        whenToUse: 'Use the interactive map to analyze spatial overlaps, zoom to layer extents, and compare multi-temporal regions.',
        inputs: [
          { name: 'Layer Toggle', type: 'checkbox', required: true, description: 'Check layer boxes in the layer list panel to show or hide.', example: 'Active / Inactive' },
          { name: 'Opacity', type: 'slider (0-100%)', required: false, description: 'Adjust layer transparency (0-100%) against base maps.', example: '80%' }
        ],
        steps: [
          { step: 1, title: 'Open Map / Workspace Page', desc: 'Select a workspace and access the integrated map view.' },
          { step: 2, title: 'Activate Layers', desc: 'Toggle the switch next to any layer name. The map renders tiles from GeoServer automatically.' },
          { step: 3, title: 'Zoom to Extent', desc: 'Click the telescope/focus icon beside a layer to immediately pan and zoom the map to its bounding coordinates.' }
        ],
        output: {
          text: 'Map visualizer renders crisp WMS tiles with corresponding color legends.',
          response: null
        },
        commonErrors: [
          { problem: 'Map appears blank after layer is enabled', solution: 'Use "Zoom to Extent" to jump to where the layer coordinates are located, or verify if the layer lies outside the current viewport.' }
        ],
        tips: [
          'Heavy raster layers are served via GeoServer tile caching for smooth pan and zoom performance.'
        ]
      },
      {
        id: 'guide-delete',
        title: '4. Layer Deletion (Single & Batch)',
        subtitle: 'Thoroughly purge layers from the dashboard, GeoServer, and PostGIS tables.',
        whenToUse: 'Use when layers are obsolete, unneeded, or uploaded with incorrect parameters.',
        inputs: [
          { name: 'Layer Selection', type: 'checkbox / button', required: true, description: 'Click the trash icon on single layer cards or check multiple layers for batch deletion.', example: '1 or more layers' }
        ],
        steps: [
          { step: 1, title: 'Select Layers to Delete', desc: 'Hover over a layer card to reveal the trash button, or check boxes across multiple cards.' },
          { step: 2, title: 'Confirm Deletion', desc: 'Click "Delete" or "Delete Selected". A confirmation modal will request authorization.' },
          { step: 3, title: 'Automated Cleanup Runs', desc: 'The engine removes the GeoServer layer, drops PostGIS tables, deletes physical disk files, and purges ingest job records.' }
        ],
        output: {
          text: 'Layers are completely purged without leaving orphaned files on the GeoServer instance.',
          response: null
        },
        commonErrors: [
          { problem: 'Deletion cannot be undone', solution: 'Ensure layers to be deleted are no longer referenced by downstream projects or client web applications.' }
        ],
        tips: [
          'Use batch deletion with "Select All" to clean up multiple layers simultaneously in a single click.'
        ]
      }
    ]
  },
  th: {
    id: 'dashboard-guide',
    title: 'คู่มือแดชบอร์ด (ผู้ใช้ทั่วไปที่ไม่ใช่เชิงเทคนิค)',
    subtitle: 'ขั้นตอนที่ใช้งานได้จริงในการจัดการเวิร์กสเปซ เลเยอร์เชิงพื้นที่ การแสดงผลแผนที่ และการล้างข้อมูลผ่านเว็บคอนโซล',
    features: [
      {
        id: 'guide-workspace',
        title: '1. การจัดการเวิร์กสเปซ (โฟลเดอร์โครงการ)',
        subtitle: 'จัดกลุ่มข้อมูลเชิงพื้นที่ตามแผนก โครงการวิจัย หรือพื้นที่ปฏิบัติการ',
        whenToUse: 'ใช้ฟีเจอร์เวิร์กสเปซก่อนอัปโหลดเลเยอร์เพื่อให้ข้อมูลเป็นระเบียบ หนึ่งเวิร์กสเปซทำหน้าที่เป็นคอนเทนเนอร์แยกเฉพาะใน GeoServer และฐานข้อมูล PostGIS',
        inputs: [
          { name: 'ชื่อเวิร์กสเปซ', type: 'string', required: true, description: 'ชื่อป้ายกำกับโครงการที่จำได้ง่าย (มีช่องว่างได้)', example: 'โครงการบรรเทาอุทกภัยบาหลี' },
          { name: 'คำอธิบาย', type: 'string', required: false, description: 'หมายเหตุเพิ่มเติมเกี่ยวกับวัตถุประสงค์ของการรวบรวมข้อมูลเชิงพื้นที่', example: 'เลเยอร์แรสเตอร์ปริมาณน้ำฝนและขอบเขตน้ำท่วมขังปี 2024' }
        ],
        steps: [
          { step: 1, title: 'เปิดเมนูเวิร์กสเปซ', desc: 'คลิก "เวิร์กสเปซ" ที่แถบด้านข้างของแดชบอร์ดด้านซ้าย' },
          { step: 2, title: 'คลิก "+ เพิ่มเวิร์กสเปซ"', desc: 'กดปุ่มที่มุมขวาบนเพื่อเปิดหน้าต่างสร้างเวิร์กสเปซ' },
          { step: 3, title: 'กรอกชื่อและบันทึก', desc: 'พิมพ์ชื่อเวิร์กสเปซและคำอธิบายสั้นๆ แล้วคลิก "บันทึก" เวิร์กสเปซใหม่จะเปิดใช้งานทันทีพร้อมรหัสเวิร์กสเปซเฉพาะ' }
        ],
        output: {
          text: 'เวิร์กสเปซใหม่ถูกสร้างขึ้นบนแดชบอร์ดและลงทะเบียนเป็นเวิร์กสเปซทางการใน GeoServer โดยอัตโนมัติ',
          response: null
        },
        commonErrors: [
          { problem: 'ชื่อเวิร์กสเปซว่างเปล่า', solution: 'ตรวจสอบให้แน่ใจว่าได้ป้อนชื่ออย่างน้อย 3 ตัวอักษรก่อนกดปุ่มบันทึก' }
        ],
        tips: [
          'แต่ละเวิร์กสเปซมี Hashed ID (ไอคอนกุญแจ) คุณสามารถคัดลอกรหัสนี้เพื่อแชร์กับนักพัฒนาที่ผสานรวมระบบ'
        ]
      },
      {
        id: 'guide-upload',
        title: '2. อัปโหลดเลเยอร์ (นำเข้าเดี่ยวและแบบกลุ่ม)',
        subtitle: 'อัปโหลดสูงสุด 10 ไฟล์พร้อมกันด้วยการประมวลผลพื้นหลังอัตโนมัติ',
        whenToUse: 'ใช้เมื่อคุณมีไฟล์เชิงพื้นที่จากการสำรวจภาคสนาม ภาพถ่ายโดรน/ดาวเทียม พิกัด CSV หรือขอบเขตโพลิกอนที่ต้องการแสดงบนเว็บแผนที่',
        inputs: [
          { name: 'เวิร์กสเปซเป้าหมาย', type: 'เลือก', required: true, description: 'เลือกเวิร์กสเปซที่จะจัดเก็บเลเยอร์', example: 'เวิร์กสเปซเริ่มต้น' },
          { name: 'ไฟล์เชิงพื้นที่', type: 'file / files[]', required: true, description: 'รองรับ .tif, .tiff, .zip (Shapefile), .geojson, .json, .kml, .kmz, .csv (สูงสุด 10 ไฟล์ต่อกลุ่ม)', example: 'flood_2024.zip, rainfall.tif' },
          { name: 'ชื่อที่แสดง (ต่อไฟล์)', type: 'string', required: false, description: 'ชื่อที่แสดงของเลเยอร์ที่อ่านง่าย (กรอกอัตโนมัติจากชื่อไฟล์หากเว้นว่าง)', example: 'แผนที่เสี่ยงน้ำท่วมพื้นที่ A' }
        ],
        steps: [
          { step: 1, title: 'เปิดหน้าเลเยอร์และคลิก "+ เพิ่มเลเยอร์"', desc: 'ไปที่เมนูเลเยอร์แล้วคลิกปุ่มสีน้ำเงิน "+ เพิ่มเลเยอร์"' },
          { step: 2, title: 'เลือกไฟล์', desc: 'ลากและวางไฟล์หนึ่งหรือหลายไฟล์ (สูงสุด 10 ไฟล์) ชื่อที่แสดงจะถูกดึงโดยอัตโนมัติและสามารถแก้ไขได้โดยตรง' },
          { step: 3, title: 'คลิก "อัปโหลด" และติดตามคิว', desc: 'การแปลงรูปแบบและการลงทะเบียน GeoServer จะทำงานโดยอัตโนมัติ เปอร์เซ็นต์การโหลดจะแสดงความคืบหน้าของแต่ละไฟล์' },
          { step: 4, title: 'เสร็จสิ้นและปิดหน้าต่าง', desc: 'เมื่อทุกรายการมีเครื่องหมายถูกสีเขียว "เสร็จสิ้น" ให้คลิก "ปิด" เลเยอร์จะปรากฏในหน้ารายการเลเยอร์ทันที' }
        ],
        output: {
          text: 'เลเยอร์จะได้รับการลงทะเบียนในแดชบอร์ดพร้อมป้ายกำกับรูปแบบ (TIF, SHP, GEOJSON, KML, KMZ, CSV) และมี URL GeoServer WMS ที่ใช้งานได้ทันที',
          response: null
        },
        commonErrors: [
          { problem: 'อัปโหลด Shapefile ล้มเหลว', solution: 'Shapefile ต้องถูกบีบอัดเป็นไฟล์ .zip ที่มีไฟล์ .shp, .shx, .dbf และ .prj พร้อมกัน' },
          { problem: 'CSV ถูกปฏิเสธ', solution: 'ตรวจสอบให้แน่ใจว่าไฟล์ CSV มีคอลัมน์ส่วนหัว latitude & longitude หรือคอลัมน์เรขาคณิต WKT' },
          { problem: 'KMZ ว่างเปล่า', solution: 'ตรวจสอบให้แน่ใจว่าไฟล์ KMZ มีไฟล์ .kml ที่ถูกต้องอย่างน้อยหนึ่งไฟล์อยู่ภายใน' }
        ],
        tips: [
          'ขนาดไฟล์ไม่จำกัด อย่างไรก็ตาม สำหรับไฟล์ขนาดใหญ่มาก (เช่น แรสเตอร์ > 1 GB) โปรดรักษาการเชื่อมต่ออินเทอร์เน็ตให้เสถียรระหว่างการถ่ายโอน',
          'การอัปโหลดไฟล์ที่มีชื่อเดียวกันจะไม่เขียนทับเลเยอร์เดิม ระบบจะกำหนดตัวระบุภายในเฉพาะใน GeoServer โดยอัตโนมัติ'
        ]
      },
      {
        id: 'guide-map',
        title: '3. การแสดงผลและการโต้ตอบบนแผนที่',
        subtitle: 'แสดงเลเยอร์ซ้อนทับบนแผนที่ฐาน จัดลำดับการซ้อนทับ และตรวจสอบข้อมูลฟีเจอร์',
        whenToUse: 'ใช้แผนที่แบบโต้ตอบเพื่อวิเคราะห์การซ้อนทับของข้อมูลเชิงพื้นที่ ซูมไปยังขอบเขตของเลเยอร์ (Zoom to Extent) และเปรียบเทียบหลายพื้นที่',
        inputs: [
          { name: 'สลับเปิด/ปิดเลเยอร์', type: 'checkbox', required: true, description: 'ทำเครื่องหมายในช่องเลเยอร์ในแผงรายการเลเยอร์เพื่อแสดงหรือซ่อน', example: 'เปิดใช้งาน / ปิดใช้งาน' },
          { name: 'ความโปร่งใส (Opacity)', type: 'slider (0-100%)', required: false, description: 'ปรับความโปร่งแสงของเลเยอร์ (0-100%) เมื่อเทียบกับแผนที่ฐาน', example: '80%' }
        ],
        steps: [
          { step: 1, title: 'เปิดหน้าแผนที่ / เวิร์กสเปซ', desc: 'เลือกเวิร์กสเปซและเปิดมุมมองแผนที่แบบรวม' },
          { step: 2, title: 'เปิดใช้งานเลเยอร์', desc: 'เปิดสวิตช์ข้างชื่อเลเยอร์ แผนที่จะแสดงผลไทล์จาก GeoServer โดยอัตโนมัติ' },
          { step: 3, title: 'ซูมไปยังขอบเขต (Zoom to Extent)', desc: 'คลิกไอคอนกล้องส่องทางไกล/โฟกัสข้างเลเยอร์เพื่อเลื่อนและซูมมุมมองแผนที่ไปยังพิกัดของเลเยอร์นั้นทันที' }
        ],
        output: {
          text: 'การแสดงภาพแผนที่จะแสดงไทล์ WMS ความละเอียดสูงพร้อมคำอธิบายสัญลักษณ์สีที่เกี่ยวข้อง',
          response: null
        },
        commonErrors: [
          { problem: 'แผนที่ดูว่างเปล่าหลังจากเปิดใช้งานเลเยอร์', solution: 'ใช้ปุ่ม "Zoom to Extent" เพื่อข้ามไปยังตำแหน่งพิกัดของเลเยอร์ หรือตรวจสอบว่าเลเยอร์อยู่นอกพิกัดแผนที่ฐานหรือไม่' }
        ],
        tips: [
          'เลเยอร์แรสเตอร์ขนาดใหญ่จะแสดงผลผ่านระบบแคชไทล์ของ GeoServer เพื่อให้การแพนและซูมราบรื่น'
        ]
      },
      {
        id: 'guide-delete',
        title: '4. การลบเลเยอร์ (เดี่ยวและแบบกลุ่ม)',
        subtitle: 'ล้างเลเยอร์ออกจากแดชบอร์ด GeoServer และตาราง PostGIS อย่างสมบูรณ์',
        whenToUse: 'ใช้เมื่อไม่ต้องการเลเยอร์แล้ว ล้าสมัย หรือเกิดข้อผิดพลาดในการอัปโหลดไฟล์',
        inputs: [
          { name: 'การเลือกเลเยอร์', type: 'checkbox / ปุ่ม', required: true, description: 'คลิกปุ่มลบบนการ์ดเลเยอร์เดี่ยว หรือเลือกหลายเลเยอร์เพื่อลบแบบกลุ่ม', example: '1 เลเยอร์ขึ้นไป' }
        ],
        steps: [
          { step: 1, title: 'เลือกเลเยอร์ที่ต้องการลบ', desc: 'ชี้เมาส์ไปที่การ์ดเลเยอร์เพื่อดูไอคอนถังขยะ หรือเลือกช่องบนการ์ดหลายใบ' },
          { step: 2, title: 'ยืนยันการลบ', desc: 'คลิกปุ่ม "ลบ" หรือ "ลบที่เลือก" กล่องโต้ตอบการยืนยันจะขอการอนุมัติจากคุณ' },
          { step: 3, title: 'การล้างข้อมูลอัตโนมัติทำงาน', desc: 'ระบบจะลบเลเยอร์ใน GeoServer ลบตาราง PostGIS ลบไฟล์ในที่จัดเก็บเซิร์ฟเวอร์ และล้างประวัติงานโดยอัตโนมัติ' }
        ],
        output: {
          text: 'เลเยอร์ถูกลบอย่างสมบูรณ์โดยไม่ทิ้งไฟล์ตกค้างบนเซิร์ฟเวอร์ GeoServer',
          response: null
        },
        commonErrors: [
          { problem: 'การลบไม่สามารถยกเลิกได้', solution: 'ตรวจสอบให้แน่ใจว่าเลเยอร์ที่จะลบไม่ได้ถูกใช้งานโดยโปรเจกต์หรือแอปพลิเคชันเว็บไคลเอ็นต์แล้ว' }
        ],
        tips: [
          'ใช้ฟีเจอร์ลบแบบกลุ่มโดยเลือก "เลือกทั้งหมด" หากต้องการล้างหลายเลเยอร์พร้อมกันในคลิกเดียว'
        ]
      }
    ]
  }
}

export function getDashboardGuideContent(lang = 'id') {
  return dashboardGuideTranslations[lang] || dashboardGuideTranslations.id
}

export const dashboardGuideContent = getDashboardGuideContent('id')
