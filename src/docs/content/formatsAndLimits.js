const content = {
  id: {
    id: 'formats-limits',
    title: 'Format Data & Batasan Sistem',
    subtitle: 'Spesifikasi teknis berkas spasial yang diterima, sistem proyeksi CRS, dan mekanisme isolasi nama layer.',
    formats: [
      {
        format: 'GeoTIFF',
        extensions: '.tif, .tiff',
        type: 'Raster',
        requirements: 'Wajib memiliki metadata CRS/Spatial Reference System yang valid. Didukung 1-band (DEM/elevasi, indeks vegetasi) maupun multi-band (RGB/satelit).',
        magicBytes: 'II*\\0 (Little-endian) atau MM\\0* (Big-endian)'
      },
      {
        format: 'Shapefile (ESRI)',
        extensions: '.zip',
        type: 'Vektor',
        requirements: 'Wajib diunggah sebagai berkas .zip yang berisi setidaknya 4 berkas dengan nama stem sama: .shp (geometri), .shx (indeks), .dbf (tabel atribut), dan .prj (definisi proyeksi).',
        magicBytes: 'PK\\x03\\x04 (ZIP Archive)'
      },
      {
        format: 'GeoJSON',
        extensions: '.geojson, .json',
        type: 'Vektor',
        requirements: 'Format standar RFC 7946 berbasis teks JSON yang mendefinisikan Feature atau FeatureCollection berkoordinat geografis.',
        magicBytes: '{ atau [ (Valid JSON)'
      },
      {
        format: 'KML (Keyhole Markup Language)',
        extensions: '.kml',
        type: 'Vektor',
        requirements: 'Format XML berbasis standar OGC (Open Geospatial Consortium). Harus memuat tag <kml> atau <Document> dengan elemen Placemark geometri.',
        magicBytes: '<?xml... atau <kml'
      },
      {
        format: 'KMZ (KML Terkompresi)',
        extensions: '.kmz',
        type: 'Vektor',
        requirements: 'Berkas arsip ZIP yang memuat berkas .kml di dalamnya. Sistem AstraGIS mengekstrak dan memproses KML secara otomatis.',
        magicBytes: 'PK\\x03\\x04 (ZIP Archive)'
      },
      {
        format: 'CSV (Delimited Text)',
        extensions: '.csv',
        type: 'Vektor (Titik/WKT)',
        requirements: 'Berkas tabular teks yang wajib memiliki kolom koordinat: latitude/longitude (atau lat/lon) ATAU kolom WKT geometry/wkt.',
        magicBytes: 'Teks berpemisah koma / titik koma'
      }
    ],
    crsRules: {
      title: 'Sistem Koordinat & Proyeksi Spasial (CRS / EPSG)',
      vectorRule: 'Semua data vektor (Shapefile, GeoJSON, KML, KMZ, CSV) secara otomatis ditransformasikan ke sistem koordinat standar global WGS84 (EPSG:4326) sebelum ditulis ke tabel PostGIS. Khusus Shapefile, berkas .prj wajib ada dan terbaca agar sistem dapat mendeteksi proyeksi asal dan melakukan reproyeksi secara presisi.',
      rasterRule: 'Data raster (GeoTIFF) mempertahankan koordinat aslinya (Native CRS) di GeoServer CoverageStore untuk mencegah distorsi piksel citra. Namun, batas geografis (Bounding Box) otomatis dihitung dan dikonversi ke EPSG:4326 untuk keperluan pratinjau peta dan integrasi web.'
    },
    systemLimits: [
      { parameter: 'Jumlah Berkas per Pengiriman Batch', value: 'Maksimal 10 berkas', detail: 'Form submission dan endpoint API /batch-uploads membatasi 10 file per batch untuk menjaga keandalan antrean worker.' },
      { parameter: 'Batas Ukuran Berkas', value: 'Tidak Terbatas (Unlimited)', detail: 'Konfigurasi MAX_UPLOAD_SIZE_MB = 0 (unlimited). Tidak ada batasan artifisial 500 MB. Berkas di-stream langsung ke staging disk.' },
      { parameter: 'Maksimum Antrean Paralel per Akun', value: '10 Pekerjaan Serentak', detail: 'Setiap akun API Key dapat memproses hingga 10 background ingest jobs secara simultan.' },
      { parameter: 'Maksimum Total Beban Server', value: '20 Pekerjaan Serentak', detail: 'Batas proteksi global server untuk menjamin GeoServer dan PostGIS tetap responsif.' }
    ],
    duplicateNamesRule: {
      title: 'Penanganan Duplikasi Nama Layer (Collision Isolation)',
      desc: 'Di AstraGIS, dua layer atau lebih diizinkan memiliki Display Name yang sama persis (misal: "Peta Banjir 2024"). Sistem TIDAK akan menolak maupun menimpa berkas lama.',
      mechanism: 'Di tingkat mesin GeoServer dan PostGIS, sistem selalu menggenerasi geoserver_name unik dengan format:\n• Raster: ras_<slug>_<hex_6_karakter> (contoh: ras_peta_banjir_f7a29c)\n• Vektor: vec_<owner>_<slug>_<hex_6_karakter> (contoh: vec_usr_peta_banjir_3b81d4)\nDengan pola ini, setiap layer terisolasi sempurna dan tidak saling mengganggu.'
    }
  },
  en: {
    id: 'formats-limits',
    title: 'Data Formats & System Limits',
    subtitle: 'Technical specifications for accepted spatial files, projection systems (CRS), and collision isolation mechanisms.',
    formats: [
      {
        format: 'GeoTIFF',
        extensions: '.tif, .tiff',
        type: 'Raster',
        requirements: 'Valid CRS/Spatial Reference System metadata is required. Supports single-band (DEM/elevation, vegetation indices) and multi-band (RGB/satellite).',
        magicBytes: 'II*\\0 (Little-endian) or MM\\0* (Big-endian)'
      },
      {
        format: 'Shapefile (ESRI)',
        extensions: '.zip',
        type: 'Vector',
        requirements: 'Must be uploaded as a .zip archive containing at least 4 companion files with identical basenames: .shp (geometry), .shx (index), .dbf (attributes), and .prj (projection).',
        magicBytes: 'PK\\x03\\x04 (ZIP Archive)'
      },
      {
        format: 'GeoJSON',
        extensions: '.geojson, .json',
        type: 'Vector',
        requirements: 'RFC 7946 standard JSON-based spatial format defining Features or FeatureCollections in geographic coordinates.',
        magicBytes: '{ or [ (Valid JSON)'
      },
      {
        format: 'KML (Keyhole Markup Language)',
        extensions: '.kml',
        type: 'Vector',
        requirements: 'XML-based OGC standard format. Must contain <kml> or <Document> root tags with Placemark geometry elements.',
        magicBytes: '<?xml... or <kml'
      },
      {
        format: 'KMZ (Compressed KML)',
        extensions: '.kmz',
        type: 'Vector',
        requirements: 'ZIP archive packaging .kml content. AstraGIS automatically uncompresses and processes the inner KML file.',
        magicBytes: 'PK\\x03\\x04 (ZIP Archive)'
      },
      {
        format: 'CSV (Delimited Text)',
        extensions: '.csv',
        type: 'Vector (Point/WKT)',
        requirements: 'Tabular text file with coordinate columns: latitude/longitude (or lat/lon) OR a WKT geometry/wkt column.',
        magicBytes: 'Comma or semicolon delimited text'
      }
    ],
    crsRules: {
      title: 'Coordinate Reference Systems & Projection (CRS / EPSG)',
      vectorRule: 'All vector datasets (Shapefile, GeoJSON, KML, KMZ, CSV) are automatically transformed to the global standard WGS84 (EPSG:4326) prior to being committed to PostGIS tables. For Shapefiles, a valid .prj file is mandatory for accurate origin detection and reprojection.',
      rasterRule: 'Raster layers (GeoTIFF) retain their Native CRS in GeoServer CoverageStores to avoid pixel distortion and resampling degradation. However, geographic bounding boxes are computed and published in EPSG:4326 for map viewer display and web integration.'
    },
    systemLimits: [
      { parameter: 'Maximum Files per Batch Submission', value: 'Up to 10 files', detail: 'The upload form and API /batch-uploads endpoint limit uploads to 10 files per batch to ensure worker queue stability.' },
      { parameter: 'File Size Limit', value: 'Unlimited (0 MB)', detail: 'Engine MAX_UPLOAD_SIZE_MB = 0 (unlimited). Artificial 500 MB caps are removed. Files stream directly to staging storage.' },
      { parameter: 'Max Concurrent Ingest Jobs per Key', value: '10 Concurrent Jobs', detail: 'Each API Key can process up to 10 background ingest tasks simultaneously.' },
      { parameter: 'Global Server Ingest Concurrency', value: '20 Concurrent Jobs', detail: 'System-wide protection threshold ensuring GeoServer and PostGIS remain responsive.' }
    ],
    duplicateNamesRule: {
      title: 'Duplicate Layer Name Handling (Collision Isolation)',
      desc: 'In AstraGIS, two or more layers can share the exact same Display Name (e.g. "Flood Risk Analysis 2024"). The engine will NOT reject or overwrite previous layers.',
      mechanism: 'At the GeoServer and PostGIS layers, the system automatically assigns unique geoserver_names formatted as:\n• Raster: ras_<slug>_<hex_6_chars> (e.g. ras_flood_risk_f7a29c)\n• Vector: vec_<owner>_<slug>_<hex_6_chars> (e.g. vec_usr_flood_risk_3b81d4)\nThis guarantees absolute isolation between all published assets.'
    }
  },
  th: {
    id: 'formats-limits',
    title: 'รูปแบบข้อมูลและข้อจำกัดของระบบ',
    subtitle: 'ข้อกำหนดทางเทคนิคสำหรับไฟล์เชิงพื้นที่ที่ยอมรับ ระบบพิกัด (CRS) และกลไกการแยกชื่อเลเยอร์',
    formats: [
      {
        format: 'GeoTIFF',
        extensions: '.tif, .tiff',
        type: 'แรสเตอร์',
        requirements: 'ต้องมีข้อมูลเมตา CRS/Spatial Reference System ที่ถูกต้อง รองรับทั้ง 1 แบนด์ (DEM/ระดับความสูง, ดัชนีพืชพรรณ) และหลายแบนด์ (RGB/ภาพถ่ายดาวเทียม)',
        magicBytes: 'II*\\0 (Little-endian) หรือ MM\\0* (Big-endian)'
      },
      {
        format: 'Shapefile (ESRI)',
        extensions: '.zip',
        type: 'เวกเตอร์',
        requirements: 'ต้องอัปโหลดเป็นไฟล์ .zip ที่มีไฟล์อย่างน้อย 4 ไฟล์ที่มีชื่อหลักเดียวกัน: .shp (เรขาคณิต), .shx (ดัชนี), .dbf (ตารางแอตทริบิวต์) และ .prj (คำจำกัดความการฉายภาพ)',
        magicBytes: 'PK\\x03\\x04 (ZIP Archive)'
      },
      {
        format: 'GeoJSON',
        extensions: '.geojson, .json',
        type: 'เวกเตอร์',
        requirements: 'รูปแบบเชิงพื้นที่ตามมาตรฐาน RFC 7946 แบบ JSON ที่กำหนด Feature หรือ FeatureCollection ในพิกัดทางภูมิศาสตร์',
        magicBytes: '{ หรือ [ (Valid JSON)'
      },
      {
        format: 'KML (Keyhole Markup Language)',
        extensions: '.kml',
        type: 'เวกเตอร์',
        requirements: 'รูปแบบมาตรฐาน OGC ที่ใช้ XML ต้องมีแท็ก <kml> หรือ <Document> พร้อมองค์ประกอบเรขาคณิต Placemark',
        magicBytes: '<?xml... หรือ <kml'
      },
      {
        format: 'KMZ (Compressed KML)',
        extensions: '.kmz',
        type: 'เวกเตอร์',
        requirements: 'ไฟล์ ZIP ที่มีไฟล์ .kml อยู่ภายใน ระบบ AstraGIS จะแตกไฟล์และประมวลผล KML โดยอัตโนมัติ',
        magicBytes: 'PK\\x03\\x04 (ZIP Archive)'
      },
      {
        format: 'CSV (Delimited Text)',
        extensions: '.csv',
        type: 'เวกเตอร์ (จุด/WKT)',
        requirements: 'ไฟล์ข้อความตารางที่ต้องมีคอลัมน์พิกัด: latitude/longitude (หรือ lat/lon) หรือคอลัมน์เรขาคณิต WKT geometry/wkt',
        magicBytes: 'ข้อความคั่นด้วยเครื่องหมายจุลภาคหรือเซมิโคลอน'
      }
    ],
    crsRules: {
      title: 'ระบบพิกัดอ้างอิงและการฉายภาพเชิงพื้นที่ (CRS / EPSG)',
      vectorRule: 'ข้อมูลเวกเตอร์ทั้งหมด (Shapefile, GeoJSON, KML, KMZ, CSV) จะถูกแปลงเป็นระบบพิกัดมาตรฐานสากล WGS84 (EPSG:4326) โดยอัตโนมัติก่อนที่จะบันทึกลงในตาราง PostGIS สำหรับ Shapefile จำเป็นต้องมีไฟล์ .prj เพื่อให้สามารถตรวจจับการฉายภาพต้นฉบับและแปลงพิกัดได้อย่างแม่นยำ',
      rasterRule: 'ข้อมูลแรสเตอร์ (GeoTIFF) จะคงพิกัดดั้งเดิม (Native CRS) ไว้ใน GeoServer CoverageStore เพื่อป้องกันความผิดเพี้ยนของพิกเซลภาพ อย่างไรก็ตาม ขอบเขตทางภูมิศาสตร์ (Bounding Box) จะถูกคำนวณและเผยแพร่ในรูปแบบ EPSG:4326 เพื่อใช้ในการแสดงผลแผนที่และการผสานรวมเว็บ'
    },
    systemLimits: [
      { parameter: 'จำนวนไฟล์สูงสุดต่อการส่งแบบกลุ่ม', value: 'สูงสุด 10 ไฟล์', detail: 'แบบฟอร์มและเอ็นด์พอยต์ API /batch-uploads จำกัดไว้ที่ 10 ไฟล์ต่อชุดเพื่อรักษาเสถียรภาพของคิวการประมวลผล' },
      { parameter: 'ขีดจำกัดขนาดไฟล์', value: 'ไม่จำกัด (Unlimited)', detail: 'การกำหนดค่า MAX_UPLOAD_SIZE_MB = 0 (ไม่จำกัด) นำขีดจำกัด 500 MB ออกแล้ว ไฟล์จะถูกสตรีมโดยตรงไปยังพื้นที่จัดเก็บ' },
      { parameter: 'งานที่ประมวลผลพร้อมกันสูงสุดต่อบัญชี', value: '10 งานพร้อมกัน', detail: 'แต่ละคีย์ API สามารถประมวลผลงานนำเข้าในเบื้องหลังได้สูงสุด 10 งานพร้อมกัน' },
      { parameter: 'ภาระงานรวมสูงสุดของเซิร์ฟเวอร์', value: '20 งานพร้อมกัน', detail: 'ขีดจำกัดการป้องกันระดับเซิร์ฟเวอร์เพื่อให้มั่นใจว่า GeoServer และ PostGIS ตอบสนองได้อย่างรวดเร็วเสมอ' }
    ],
    duplicateNamesRule: {
      title: 'การจัดการชื่อเลเยอร์ที่ซ้ำกัน (Collision Isolation)',
      desc: 'ใน AstraGIS เลเยอร์ตั้งแต่สองเลเยอร์ขึ้นไปสามารถมีชื่อที่แสดงเหมือนกันทุกประการได้ (เช่น "แผนที่น้ำท่วม 2024") ระบบจะไม่ปฏิเสธหรือเขียนทับไฟล์เดิม',
      mechanism: 'ในระดับ GeoServer และ PostGIS ระบบจะสร้าง geoserver_name ที่ไม่ซ้ำกันเสมอในรูปแบบ:\n• แรสเตอร์: ras_<slug>_<hex_6_ตัวอักษร> (เช่น ras_peta_banjir_f7a29c)\n• เวกเตอร์: vec_<owner>_<slug>_<hex_6_ตัวอักษร> (เช่น vec_usr_peta_banjir_3b81d4)\nด้วยรูปแบบนี้ ทุกเลเยอร์จะถูกแยกออกจากกันอย่างสมบูรณ์และไม่รบกวนซึ่งกันและกัน'
    }
  }
}

export const getFormatsAndLimitsContent = (lang = 'id') => content[lang] || content.id
export const formatsAndLimitsContent = getFormatsAndLimitsContent('id')
