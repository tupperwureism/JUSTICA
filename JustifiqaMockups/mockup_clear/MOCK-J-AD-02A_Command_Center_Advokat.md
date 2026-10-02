# MOCK-J-AD-02A [CLEAR]: Command Center & Dasbor Manajemen Perkara Advokat Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-AD-02A` |
| **Nama Halaman** | Command Center Advokat, Fair-Clock SLA Monitor, & Saldo Escrow |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Mitra Advokat Berlisensi Mahkamah Agung |
| **Ref. Use Case** | `J-UC03` (`ST-J-05`), `J-UC04` (`ST-J-08`), `J-UC10` (`ST-J-09`), `J-UC18` (`ST-J-16`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA ADVOCATE COMMAND CENTER</b> | [ Perkara Aktif ] | [ Jadwal Booking ] | [ Dompet Escrow ] | [ Keluar ] | [ ☀ Light / ☾ Dark ] }
  --
  {
    === INFORMASI ADVOKAT & RINGKASAN REPUTASI SIPP
    "Selamat datang, Dr. Mahendra Kusuma, S.H., M.H. Seluruh aktivitas sesi Anda diawasi oleh Fair-Clock SLA Monitor."
  }
  --
  {
    {#
      <b>Status Verifikasi MA</b> | <b>SLA Respons E2EE</b> | <b>Perkara Selesai</b> | <b>Saldo Escrow Siap Cair</b>
      [ <color:green><b>ACTIVE SIPP VERIFIED</b></color> ] | <b>99.4% (< 2 Menit)</b> | <b>318 Perkara</b> | <b>Rp 14.850.000</b>
    }
  }
  --
  {
    <b>DAFTAR PERKARA HUKUM AKTIF & JADWAL KONSULTASI HARI INI</b>
    --
    {#
      <b>ID Perkara</b> | <b>Nama Klien</b> | <b>Layanan & Tier</b> | <b>Jadwal / Batas Waktu</b> | <b>Status Fair-Clock</b> | <b>Aksi Langsung</b>
      REQ-202607-001 | PT Mitra Jaya (Klien) | Tier 2 (E2EE 45m) | 10:30 - 11:15 WIB | <color:green><b>READY (SLA OK)</b></color> | [ <b>MASUK RUANG CHAT</b> ]
      REQ-202607-002 | Bpk. Hendra S.        | Tier 3 (Drafting) | Deadline: 11 Juli 2026| <color:blue><b>DRAFTING IN PROGRESS</b></color>| [ <b>UNGGAH DELIVERABLE</b> ]
      REQ-202607-003 | Ibu Kartika           | Tier 2 (E2EE 45m) | 09 Juli 2026          | <color:red><b>ESCROW FROZEN (DISPUTE)</b></color>| [ <b>LIHAT MEDIASI</b> ]
    }
  }
  --
  {
    <b>PENCAIRAN SALDO ESCROW TERVERIFIKASI KE REKENING BANK MANDIRI</b>
    [  <b>TARIK SALDO ESCROW (Rp 14.850.000) VIA BI-FAST</b>  ] | [ Unduh Laporan Audit Pajak PPh 21 ]
  }
}
@endsalt
```
