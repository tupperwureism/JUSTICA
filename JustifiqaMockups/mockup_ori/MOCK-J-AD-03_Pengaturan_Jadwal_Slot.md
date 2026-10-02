# MOCK-J-AD-03 [ORI]: Pengaturan Jadwal & Slot Ketersediaan Advokat Justica

## 1. METADATA SPESIFIKASI (ENGINEERING EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-AD-03` |
| **Nama Halaman** | Pengaturan Jadwal Ketersediaan & Kalender Praktik Advokat (`advocate.justica.id/schedule`) |
| **Aktor Target** | Mitra Advokat Berlisensi Mahkamah Agung & SIPP |
| **Ref. Use Case** | `J-UC03` (`ST-J-05`: Pengaturan Jadwal & Slot Ketersediaan Konsultasi Online/Offline Advokat) |
| **Peta Navigasi (`from` -> `to`)** | `MOCK-J-AD-02A` -> `MOCK-J-AD-03` -> `MOCK-J-AD-02A` (Command Center) |
| **Kepatuhan Keamanan** | Concurrency Slot Lock (Redis Mutex TTL 15m), Calendar Conflict Prevention Guard, WORM Schedule Audit |

---

## 2. DIAGRAM WIREFRAME LOGIS (PLANTUML SALT)

```plantuml
@startsalt
{+
  {* <b>JUSTICA ADVOCATE PORTAL</b> - Kalender & Ketersediaan | [ Command Center ] | [ ☀ / ☾ ] }
  --
  {
    === MANAJEMEN JADWAL KONSULTASI ONLINE (E2EE) & OFFLINE (DUAL QR)
    "Atur jam praktik harian, batas kuota konsultasi, serta pengecualian hari libur agar terhindar dari penalti SLA Fair-Clock."
  }
  --
  {
    {#
      <b>1. PENGATURAN JAM PRAKTIK HARIAN</b> | <b>2. STATUS SLOT & KUOTA AKTIF</b>
      {
        [X] Senin  | 09:00 - 15:00 WIB (Slot 45m Online E2EE)
        [X] Selasa | 09:00 - 16:00 WIB (Slot 60m Offline Dual QR)
        [X] Rabu   | 10:00 - 14:00 WIB (Slot Pro Bono SKTM)
        [ ] Kamis  | LIBUR PRAKTIK
        [X] Jumat  | 09:00 - 11:30 WIB
      } | {
        Status Sync Kalender: <color:green><b>CONNECTED (Google Calendar API)</b></color>
        Maksimum Sesi Bersamaan: <b>1 Sesi Aktif (Strict Mutex Guard)</b>
        Pengecualian Cuti: <b>17 Agustus 2026</b>
      }
    }
  }
  --
  {
    [  <b>SIMPAN PERUBAHAN JADWAL</b>  ] | [ Reset ke Jadwal Default ]
  }
}
@endsalt
```
