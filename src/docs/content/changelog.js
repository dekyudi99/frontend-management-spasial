const content = {
  id: {
    id: 'changelog',
    title: 'Riwayat Perubahan (Changelog)',
    subtitle: 'Catatan pembaruan fitur, arsitektur, dan perbaikan performa pada platform AstraGIS.',
    versions: [
      {
        version: 'v2.0.0',
        date: 'Oktober 2026',
        badge: 'Versi Terkini',
        highlight: 'Arsitektur GeoServer Microservice & Batch Ingestion Multi-Format',
        changes: [
          {
            type: 'Fitur Baru',
            desc: 'Fitur Batch Upload hingga 10 file sekaligus dengan pemrosesan paralel di antrean background worker.'
          },
          {
            type: 'Fitur Baru',
            desc: 'Dukungan format berkas baru: KML (.kml), KMZ (.kmz), dan CSV berkoordinat geografis.'
          },
          {
            type: 'Arsitektur',
            desc: 'Pemisahan penuh spatial layer management ke GeoServer Microservice terisolasi (/api/v1) dengan API Key mandiri.'
          },
          {
            type: 'Perbaikan',
            desc: 'Penghapusan layer terpadu: menghapus layer GeoServer, Store/FeatureType, tabel PostGIS, dan file fisik storage dalam satu aksi atomik.'
          },
          {
            type: 'Performa',
            desc: 'Batas ukuran berkas diubah menjadi unlimited (0 MB) dengan streaming chunked disk I/O.'
          },
          {
            type: 'Pembersihan',
            desc: 'Pembersihan ketergantungan lawas: penghapusan provider Nextcloud, Google Drive, dan autentikasi OAuth usang.'
          }
        ]
      },
      {
        version: 'v1.0.0',
        date: 'September 2026',
        badge: 'Rilis Awal',
        highlight: 'Peluncuran Platform Manajemen Data Spasial AstraGIS',
        changes: [
          {
            type: 'Fitur Dasar',
            desc: 'Unggah layer GeoTIFF dan Shapefile ke GeoServer.'
          },
          {
            type: 'Visualisasi',
            desc: 'Integrasi peta Leaflet untuk pratinjau layer spasial.'
          },
          {
            type: 'Autentikasi',
            desc: 'Sistem API Key dasar dan manajemen akun pengguna.'
          }
        ]
      }
    ]
  },
  en: {
    id: 'changelog',
    title: 'Changelog',
    subtitle: 'Release notes covering new features, architecture evolution, and performance optimizations in AstraGIS.',
    versions: [
      {
        version: 'v2.0.0',
        date: 'October 2026',
        badge: 'Latest Version',
        highlight: 'GeoServer Microservice Architecture & Multi-Format Batch Ingestion',
        changes: [
          {
            type: 'New Feature',
            desc: 'Batch Upload capability up to 10 files simultaneously with parallel background worker queue processing.'
          },
          {
            type: 'New Feature',
            desc: 'Support for new spatial formats: KML (.kml), KMZ (.kmz), and coordinate-enabled CSV.'
          },
          {
            type: 'Architecture',
            desc: 'Complete separation of spatial layer management into isolated GeoServer Microservice (/api/v1) with dedicated API Keys.'
          },
          {
            type: 'Improvement',
            desc: 'Atomic cascading layer deletion: removes GeoServer layer, Store/FeatureType, PostGIS table, and disk storage in one transaction.'
          },
          {
            type: 'Performance',
            desc: 'File size limits raised to unlimited (0 MB) backed by streaming chunked disk I/O.'
          },
          {
            type: 'Refactoring',
            desc: 'Legacy dependency cleanup: removed Nextcloud, Google Drive providers, and deprecated OAuth mechanisms.'
          }
        ]
      },
      {
        version: 'v1.0.0',
        date: 'September 2026',
        badge: 'Initial Release',
        highlight: 'Launch of AstraGIS Spatial Data Infrastructure Platform',
        changes: [
          {
            type: 'Core Feature',
            desc: 'Upload GeoTIFF raster and Shapefile vector layers to GeoServer.'
          },
          {
            type: 'Visualization',
            desc: 'Leaflet web map integration for spatial layer previews.'
          },
          {
            type: 'Security',
            desc: 'Baseline API Key system and user account management.'
          }
        ]
      }
    ]
  },
  th: {
    id: 'changelog',
    title: 'บันทึกการเปลี่ยนแปลง (Changelog)',
    subtitle: 'บันทึกการอัปเดตฟีเจอร์ สถาปัตยกรรม และการเพิ่มประสิทธิภาพบนแพลตฟอร์ม AstraGIS',
    versions: [
      {
        version: 'v2.0.0',
        date: 'ตุลาคม 2026',
        badge: 'เวอร์ชันล่าสุด',
        highlight: 'สถาปัตยกรรม GeoServer Microservice และการนำเข้าแบบกลุ่มหลายรูปแบบ',
        changes: [
          {
            type: 'ฟีเจอร์ใหม่',
            desc: 'ฟีเจอร์การอัปโหลดแบบกลุ่มสูงสุด 10 ไฟล์พร้อมกันด้วยการประมวลผลคิวในเบื้องหลังแบบขนาน'
          },
          {
            type: 'ฟีเจอร์ใหม่',
            desc: 'รองรับรูปแบบไฟล์ใหม่: KML (.kml), KMZ (.kmz) และ CSV ที่มีพิกัดทางภูมิศาสตร์'
          },
          {
            type: 'สถาปัตยกรรม',
            desc: 'แยกการจัดการเลเยอร์เชิงพื้นที่ไปยัง GeoServer Microservice แบบแยกส่วนอย่างสมบูรณ์ (/api/v1) พร้อมคีย์ API เฉพาะ'
          },
          {
            type: 'การปรับปรุง',
            desc: 'การลบเลเยอร์แบบบูรณาการ: ลบเลเยอร์ GeoServer, Store/FeatureType, ตาราง PostGIS และไฟล์จริงในพื้นที่จัดเก็บในคำสั่งเดียว'
          },
          {
            type: 'ประสิทธิภาพ',
            desc: 'ขีดจำกัดขนาดไฟล์ไม่จำกัด (0 MB) รองรับการสตรีม I/O ของดิสก์แบบแยกส่วน'
          },
          {
            type: 'การปรับปรุงโค้ด',
            desc: 'ล้างการอ้างอิงเดิม: นำผู้ให้บริการ Nextcloud, Google Drive และกลไก OAuth ที่เลิกใช้ออก'
          }
        ]
      },
      {
        version: 'v1.0.0',
        date: 'กันยายน 2026',
        badge: 'เวอร์ชันแรก',
        highlight: 'การเปิดตัวแพลตฟอร์มการจัดการข้อมูลเชิงพื้นที่ AstraGIS',
        changes: [
          {
            type: 'ฟังก์ชันหลัก',
            desc: 'อัปโหลดเลเยอร์แรสเตอร์ GeoTIFF และเลเยอร์เวกเตอร์ Shapefile ไปยัง GeoServer'
          },
          {
            type: 'การแสดงภาพ',
            desc: 'การผสานรวมแผนที่เว็บ Leaflet สำหรับดูตัวอย่างเลเยอร์เชิงพื้นที่'
          },
          {
            type: 'ความปลอดภัย',
            desc: 'ระบบคีย์ API พื้นฐานและการจัดการบัญชีผู้ใช้'
          }
        ]
      }
    ]
  }
}

export const getChangelogContent = (lang = 'id') => content[lang] || content.id
export const changelogContent = getChangelogContent('id')
