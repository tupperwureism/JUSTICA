# MOCK-J-AD-04 [ORI]: Ruang Konsultasi Hukum E2EE & SLA Respons Advokat Justica

## 1. METADATA SPESIFIKASI (ENGINEERING EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-AD-04` |
| **Nama Halaman** | Ruang Konsultasi Advokat E2EE & SLA Respons Monitor (`advocate.justica.id/room/{id}`) |
| **Aktor Target** | Mitra Advokat Berlisensi Mahkamah Agung & SIPP |
| **Ref. Use Case** | `J-UC04` (`ST-J-08`: Konsultasi E2EE Chat/Call), `J-UC10` (`ST-J-09`: SLA Respons & AFK Auto-Refund Guard) |
| **Peta Navigasi (`from` -> `to`)** | `MOCK-J-AD-02A` -> `MOCK-J-AD-04` -> `MOCK-J-AD-05` (Buat Deliverable), `MOCK-J-AD-02A` (Command Center) |
| **Kepatuhan Keamanan** | Client-Side Signal AES-GCM Enkripsi, Inline DLP Guard (~30ms), SLA Respons Guard (<5m / <15m AFK Auto-Refund) |

---

## 2. DIAGRAM WIREFRAME LOGIS (PLANTUML SALT)

```plantuml
@startsalt
{+
  {* <b>JUSTICA ADVOCATE</b> - Ruang Sesi E2EE | [ Command Center ] | [ Akhiri Sesi ] | [ Fair-Clock: 44:12 ] | [ ☀ / ☾ ] }
  --
  {
    === SESI KONSULTASI HUKUM TERENKRIPSI (E2EE — ADVOCATE VIEW)
    "Percakapan diamankan dengan enkripsi ujung-ke-ujung AES-GCM 256-Bit. Pantau waktu respons agar memenuhi SLA Justica."
  }
  --
  {
    {#
      <b>Informasi Klien Terverifikasi</b> | <b>Status SLA Respons & AFK Guard (ST-J-09)</b> | <b>Waktu Tersedia (Fair-Clock)</b>
      {
        ID Klien: #CL-882910 (Verified)
        Perkara: Perjanjian NDA & Lisensi
        Tier Layanan: Tier 2 (45m E2EE)
      } | {
        SLA Respons Terkini: <color:green><b>1m 12s (MEMENUHI SLA < 5m)</b></color>
        AFK Auto-Refund Guard: <color:blue><b>ACTIVE (Trigger pada >15m AFK)</b></color>
        Inline DLP Guard: <color:green><b>ACTIVE (~30ms Scan)</b></color>
      } | {
        Sisa Waktu: <b>44:12 / 45:00 Menit</b>
        [ <b>JEDA WAKTU SESI (FAIR-CLOCK)</b> ]
      }
    }
  }
  --
  {
    <b>RIWAYAT OBROLAN E2EE & PANEL TINDAKAN ADVOKAT</b>
    --
    {
      [10:30] <b>Klien:</b> Selamat pagi Pak Advokat, saya ingin konsultasi perjanjian NDA.
      [10:31] <b>Dr. Mahendra (Anda):</b> Selamat pagi, siap. Silakan lampirkan draf klausul kerahasiaannya.
    }
  }
  --
  {
    [  <b>BUAT & UNGGAH DELIVERABLE OPINI HUKUM (MOCK-J-AD-05)</b>  ] | [ Akhiri Sesi Konsultasi ]
  }
}
@endsalt
```
