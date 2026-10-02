const content = {
  id: {
    id: 'troubleshooting',
    title: 'Pemecahan Masalah & Kode Error',
    subtitle: 'Panduan mendiagnosis masalah unggahan, memecahkan kode kesalahan HTTP, dan tips performa.',
    httpErrors: [
      {
        code: 400,
        meaning: 'Format Berkas / Permintaan Tidak Valid (Bad Request)',
        cause: 'Berkas tidak sesuai magic bytes yang didukung, file CSV tidak memiliki kolom koordinat, atau berkas ZIP Shapefile tidak lengkap.',
        solution: 'Pastikan file berekstensi .tif, .zip (SHP lengkap), .geojson, .kml, .kmz, atau .csv dengan kolom latitude/longitude yang benar.'
      },
      {
        code: 401,
        meaning: 'Tidak Terotentikasi (Unauthorized)',
        cause: 'Header X-API-Key tidak disertakan atau token API Key salah/telah dicabut (revoked).',
        solution: 'Periksa header HTTP pada request. Generate API Key baru di menu dashboard "API Key" jika kunci lama terhapus.'
      },
      {
        code: 403,
        meaning: 'Akses Ditolak (Forbidden)',
        cause: 'API Key mencoba mengakses atau menghapus layer/workspace yang bukan miliknya.',
        solution: 'Pastikan workspace_name atau ID layer sesuai dengan kepemilikan akun API Key Anda.'
      },
      {
        code: 404,
        meaning: 'Sumber Daya Tidak Ditemukan (Not Found)',
        cause: 'Workspace atau geoserver_name layer tidak ditemukan di server.',
        solution: 'Panggil endpoint GET /api/v1/layers/my-layers untuk melihat daftar geoserver_name yang sah sebelum melakukan penghapusan atau query.'
      },
      {
        code: 422,
        meaning: 'Parameter Tidak Lengkap / Validasi Schema Gagal (Unprocessable Entity)',
        cause: 'Terdapat field wajib yang tidak dikirim atau tipe data tidak cocok (misal: JSON body rusak).',
        solution: 'Periksa kembali tabel parameter pada referensi endpoint terkait. Pastikan semua field bertanda "Wajib" telah terisi.'
      },
      {
        code: 500,
        meaning: 'Kesalahan Server Internal (Internal Server Error)',
        cause: 'GeoServer offline, PostGIS tidak dapat dihubungi, atau CRS raster korup.',
        solution: 'Periksa apakah container Docker geoserver-microservice dan database PostGIS berjalan normal. Hubungi administrator sistem jika masalah berlanjut.'
      }
    ],
    commonProblems: [
      {
        title: 'Upload Shapefile (.zip) Selalu Gagal atau Error 400',
        description: 'Format Shapefile terdiri atas kumpulan berkas. Mengunggah berkas .shp saja tanpa berkas pendamping akan ditolak oleh parser.',
        fix: 'Kompres berkas .shp, .shx, .dbf, dan .prj ke dalam satu file .zip (pastikan nama keempat file sama persis, misal batas_desa.shp, batas_desa.dbf, dst.).'
      },
      {
        title: 'File CSV Berhasil Diunggah Tetapi Titik Tidak Muncul',
        description: 'Parser CSV membaca kolom koordinat geografis. Jika nama header tidak dikenali, pembentukan geometri akan gagal.',
        fix: 'Gunakan nama kolom standar: latitude & longitude ATAU lat & lon ATAU kolom WKT geometry berkoordinat desimal (EPSG:4326).'
      },
      {
        title: 'Peta GeoServer Mengalami CORS Error saat Dipanggil dari Domain Eksternal',
        description: 'GeoServer atau Microservice menolak permintaan origin web lain jika domain belum terdaftar.',
        fix: 'Daftarkan domain aplikasi web Anda ke variabel ALLOWED_ORIGINS di konfigurasi microservice backend.'
      },
      {
        title: 'Status Job Berhenti di QUEUED / RUNNING Setelah Server Restart',
        description: 'Jika kontainer server direstart saat proses ingest sedang berlangsung, worker mendeteksi job gantung.',
        fix: 'Sistem startup hook AstraGIS secara otomatis menandai job yang terinterupsi sebagai FAILED sehingga antrean tidak macet. Anda dapat mengunggah ulang berkas tersebut.'
      }
    ]
  },
  en: {
    id: 'troubleshooting',
    title: 'Troubleshooting & Error Codes',
    subtitle: 'Diagnostic guide for upload problems, HTTP status resolution, and system stability tips.',
    httpErrors: [
      {
        code: 400,
        meaning: 'Invalid File Format / Request (Bad Request)',
        cause: 'File magic bytes mismatch, CSV file lacks coordinate columns, or Shapefile ZIP archive is incomplete.',
        solution: 'Ensure your file has valid extensions (.tif, complete .zip SHP, .geojson, .kml, .kmz, or .csv) with correct latitude/longitude columns.'
      },
      {
        code: 401,
        meaning: 'Unauthorized',
        cause: 'Missing X-API-Key HTTP header or token is incorrect/revoked.',
        solution: 'Check your HTTP request headers. Generate a new API Key in the "API Key" dashboard menu if the old key is lost.'
      },
      {
        code: 403,
        meaning: 'Forbidden',
        cause: 'API Key attempted to access or delete layers/workspaces outside its boundary.',
        solution: 'Verify workspace_name or layer ID belongs to your API Key project scope.'
      },
      {
        code: 404,
        meaning: 'Not Found',
        cause: 'Workspace or layer geoserver_name does not exist on the server.',
        solution: 'Call GET /api/v1/layers/my-layers to retrieve valid active geoserver_names before executing queries or deletion.'
      },
      {
        code: 422,
        meaning: 'Missing Parameters / Schema Validation Error (Unprocessable Entity)',
        cause: 'Mandatory fields missing or invalid data types passed (e.g., malformed JSON payload).',
        solution: 'Review parameter tables in the API Reference. Ensure all Required fields are provided with correct types.'
      },
      {
        code: 500,
        meaning: 'Internal Server Error',
        cause: 'GeoServer is offline, PostGIS connection failed, or raster metadata is corrupt.',
        solution: 'Verify Docker containers geoserver-microservice and postgis are healthy. Contact system administrator if problem persists.'
      }
    ],
    commonProblems: [
      {
        title: 'Shapefile (.zip) Upload Fails with Error 400',
        description: 'Shapefile format requires companion files. Uploading only .shp without ancillary files will be rejected by the validation engine.',
        fix: 'Compress .shp, .shx, .dbf, and .prj into a single .zip file (ensure identical basenames, e.g., boundary.shp, boundary.dbf, etc.).'
      },
      {
        title: 'CSV File Uploads Successfully But No Points Appear',
        description: 'The CSV parser scans for geographic coordinates. If headers cannot be detected, geometry creation fails.',
        fix: 'Use standard header column names: latitude & longitude OR lat & lon OR a WKT geometry column in decimal degrees (EPSG:4326).'
      },
      {
        title: 'GeoServer Map Throws CORS Errors When Loaded Externally',
        description: 'GeoServer or Microservice rejects external web origins if the client domain is not whitelisted.',
        fix: 'Add your web client domain to the ALLOWED_ORIGINS configuration in backend microservice environment.'
      },
      {
        title: 'Ingest Job Stays at QUEUED / RUNNING After Server Restart',
        description: 'If server containers restart during active ingestion, orphaned jobs remain stuck.',
        fix: 'AstraGIS startup hooks automatically mark interrupted jobs as FAILED to prevent worker queue blockage. You can safely re-upload the file.'
      }
    ]
  },
  th: {
    id: 'troubleshooting',
    title: 'การแก้ปัญหาและรหัสข้อผิดพลาด',
    subtitle: 'คู่มือการวินิจฉัยปัญหาการอัปโหลด การแก้ไขรหัสข้อผิดพลาด HTTP และคำแนะนำด้านความเสถียร',
    httpErrors: [
      {
        code: 400,
        meaning: 'รูปแบบไฟล์ / คำขอไม่ถูกต้อง (Bad Request)',
        cause: 'Magic bytes ของไฟล์ไม่ตรงกัน, ไฟล์ CSV ไม่มีคอลัมน์พิกัด หรือไฟล์ ZIP Shapefile ไม่สมบูรณ์',
        solution: 'ตรวจสอบให้แน่ใจว่าไฟล์มีนามสกุลที่ถูกต้อง (.tif, .zip SHP ที่สมบูรณ์, .geojson, .kml, .kmz หรือ .csv) พร้อมคอลัมน์ละติจูด/ลองจิจูดที่ถูกต้อง'
      },
      {
        code: 401,
        meaning: 'ไม่ได้รับอนุญาต (Unauthorized)',
        cause: 'ไม่ได้ระบุส่วนหัว X-API-Key หรือโทเค็นคีย์ API ไม่ถูกต้อง/ถูกเพิกถอน',
        solution: 'ตรวจสอบส่วนหัว HTTP ในคำขอ สร้างคีย์ API ใหม่ในเมนูแดชบอร์ด "API Key" หากคีย์เก่าสูญหาย'
      },
      {
        code: 403,
        meaning: 'ถูกปฏิเสธการเข้าถึง (Forbidden)',
        cause: 'คีย์ API พยายามเข้าถึงหรือลบเลเยอร์/เวิร์กสเปซที่ไม่ได้เป็นของตนเอง',
        solution: 'ตรวจสอบให้แน่ใจว่า workspace_name หรือ ID เลเยอร์ตรงกับขอบเขตสิทธิ์ของคีย์ API ของคุณ'
      },
      {
        code: 404,
        meaning: 'ไม่พบทรัพยากร (Not Found)',
        cause: 'ไม่พบเวิร์กสเปซหรือ geoserver_name ของเลเยอร์บนเซิร์ฟเวอร์',
        solution: 'เรียกใช้เอ็นด์พอยต์ GET /api/v1/layers/my-layers เพื่อดูรายชื่อ geoserver_name ที่ถูกต้องก่อนลบหรือสืบค้น'
      },
      {
        code: 422,
        meaning: 'พารามิเตอร์ไม่สมบูรณ์ / การตรวจสอบสกีมาล้มเหลว (Unprocessable Entity)',
        cause: 'ไม่มีฟิลด์ที่จำเป็นหรือประเภทข้อมูลไม่ถูกต้อง (เช่น โครงสร้าง JSON เสียหาย)',
        solution: 'ตรวจสอบตารางพารามิเตอร์ในเอกสารอ้างอิง API อีกครั้ง ตรวจสอบให้แน่ใจว่าฟิลด์ที่ระบุว่า "จำเป็น" ได้รับการกรอกข้อมูลอย่างครบถ้วน'
      },
      {
        code: 500,
        meaning: 'ข้อผิดพลาดภายในเซิร์ฟเวอร์ (Internal Server Error)',
        cause: 'GeoServer ออฟไลน์, ไม่สามารถเชื่อมต่อ PostGIS ได้ หรือข้อมูลเมตาแรสเตอร์เสียหาย',
        solution: 'ตรวจสอบว่าคอนเทนเนอร์ Docker geoserver-microservice และฐานข้อมูล PostGIS ทำงานเป็นปกติ ติดต่อผู้ดูแลระบบหากปัญหายังคงอยู่'
      }
    ],
    commonProblems: [
      {
        title: 'การอัปโหลด Shapefile (.zip) ล้มเหลวด้วยข้อผิดพลาด 400 เสมอ',
        description: 'รูปแบบ Shapefile ประกอบด้วยชุดไฟล์ การอัปโหลดเฉพาะไฟล์ .shp โดยไม่มีไฟล์ประกอบจะถูกปฏิเสธ',
        fix: 'บีบอัดไฟล์ .shp, .shx, .dbf และ .prj ลงในไฟล์ .zip เดียวกัน (ตรวจสอบให้แน่ใจว่าชื่อไฟล์ทั้ง 4 ไฟล์ตรงกันทุกประการ เช่น boundary.shp, boundary.dbf ฯลฯ)'
      },
      {
        title: 'อัปโหลดไฟล์ CSV สำเร็จแต่จุดไม่ปรากฏบนแผนที่',
        description: 'ตัวแยกวิเคราะห์ CSV จะอ่านคอลัมน์พิกัดทางภูมิศาสตร์ หากไม่พบชื่อหัวตาราง การสร้างรูปทรงเรขาคณิตจะล้มเหลว',
        fix: 'ใช้ชื่อคอลัมน์มาตรฐาน: latitude & longitude หรือ lat & lon หรือคอลัมน์เรขาคณิต WKT ในพิกัดทศนิยม (EPSG:4326)'
      },
      {
        title: 'แผนที่ GeoServer เกิดข้อผิดพลาด CORS เมื่อเรียกใช้จากโดเมนภายนอก',
        description: 'GeoServer หรือ Microservice ปฏิเสธคำขอจากเว็บอื่นหากโดเมนไม่ได้อยู่ในรายการที่อนุญาต',
        fix: 'เพิ่มโดเมนของเว็บแอปพลิเคชันของคุณลงในตัวแปร ALLOWED_ORIGINS ในการกำหนดค่าแบ็กเอนด์'
      },
      {
        title: 'สถานะงานค้างอยู่ที่ QUEUED / RUNNING หลังจากการรีสตาร์ทเซิร์ฟเวอร์',
        description: 'หากคอนเทนเนอร์เซิร์ฟเวอร์ถูกรีสตาร์ทในระหว่างกระบวนการนำเข้า งานที่ยังค้างอยู่จะถูกระงับ',
        fix: 'ระบบ startup hook ของ AstraGIS จะทำเครื่องหมายงานที่ถูกขัดจังหวะเป็น FAILED โดยอัตโนมัติเพื่อป้องกันคิวติดขัด คุณสามารถอัปโหลดไฟล์ใหม่อีกครั้งได้อย่างปลอดภัย'
      }
    ]
  }
}

export const getTroubleshootingContent = (lang = 'id') => content[lang] || content.id
export const troubleshootingContent = getTroubleshootingContent('id')
