# MOCK-J-AD-07 [ORI]: Pusat Penanganan & Pelaporan Kewajiban Pro Bono Advokat Justica

## 1. METADATA SPESIFIKASI (ENGINEERING EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-AD-07` |
| **Nama Halaman** | Manajemen Kasus Pro Bono & Pelaporan Kegiatan Hukum (`advocate.justica.id/probono`) |
| **Aktor Target** | Mitra Advokat Berlisensi Mahkamah Agung & SIPP |
| **Ref. Use Case** | `J-UC15` (`ST-J-13`: Penanganan Kasus Pro Bono SKTM/DTKS), `J-UC20` (`ST-J-18`: Pelaporan Kewajiban Pro Bono Advokat) |
| **Peta Navigasi (`from` -> `to`)** | `MOCK-J-AD-02A` -> `MOCK-J-AD-07` -> `MOCK-J-AD-04` (Masuk Sesi Pro Bono), `MOCK-J-AD-02A` (Command Center) |
| **Kepatuhan Keamanan** | Automated SKTM/DTKS Hash Verification, WORM Pro Bono Activity Certificate |

---

## 2. DIAGRAM WIREFRAME LOGIS (PLANTUML SALT)

```plantuml
@startsalt
{+
  {* <b>JUSTICA ADVOCATE</b> - Manajemen Pro Bono | [ Command Center ] | [ ☀ / ☾ ] }
  --
  {
    === PENANGANAN KASUS PRO BONO & PELAPORAN KEWAJIBAN ADVOKAT (ST-J-13 / ST-J-18)
    "Wujudkan pengabdian profesi dengan menangani klien penerima bantuan hukum gratis (berbasis verifikasi SKTM/DTKS Kemensos). Sistem menerbitkan sertifikat kepatuhan pro bono tahunan."
  }
  --
  {
    {#
      <b>STATISTIK JAM PRO BONO TAHUN 2026</b> | <b>VERIFIKASI SKTM / DTKS KEMENSOS</b>
      {
        Jam Terpenuhi : <b>48 / 50 Jam Tahunan</b>
        Status Kepatuhan: <color:green><b>MEMENUHI STANDAR PERADI/MA</b></color>
      } | {
        Verifikasi Otomatis SKTM : <color:green><b>VALID (Dukcapil & DTKS Synced)</b></color>
        Subsidi Biaya Escrow     : <b>100% Ditanggung Justica Care</b>
      }
    }
  }
  --
  {
    <b>DAFTAR PERKARA PRO BONO AKTIF & SIAP DILAYANI</b>
    {#
      <b>ID Perkara</b> | <b>Klien Pro Bono</b> | <b>Jenis Bantuan</b> | <b>Verifikasi SKTM</b> | <b>Tindakan Advokat</b>
      #PB-7719 | Klien Terverifikasi #1102 | Pendampingan Ketenagakerjaan | <color:green>VALID (DTKS)</color> | [ <b>MASUK RUANG E2EE</b> ]
      #PB-7724 | Klien Terverifikasi #3301 | Sengketa Tanah Waris | <color:green>VALID (SKTM)</color> | [ <b>TERIMA KASUS</b> ]
    }
  }
  --
  {
    [  <b>UNDUH SERTIFIKAT KEPATUHAN PRO BONO SHA-256</b>  ]
  }
}
@endsalt
```
