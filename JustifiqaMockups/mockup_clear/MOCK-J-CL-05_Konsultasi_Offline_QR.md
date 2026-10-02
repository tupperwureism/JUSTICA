# MOCK-J-CL-05 [CLEAR]: Konsultasi Tatap Muka Resmi Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-05` |
| **Nama Halaman** | Check-in Konsultasi Offline (`client.justica.id/offline-handshake`) |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Klien Hukum |
| **Ref. Use Case** | `J-UC03, J-UC04` (`ST-J-08B`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Platform Hukum Profesional | [ Dasbor Saya ] | [ ☀ / ☾ ] }
  --
  {
    === VERIFIKASI KEHADIRAN KONSULTASI TATAP MUKA
    "Tunjukkan Kode QR di bawah ini kepada staf atau Advokat Anda saat tiba di lokasi konsultasi."
  }
  --
  {
    {
      [   KODE QR CHECK-IN   ]
      "Diperbarui otomatis setiap 30 detik"
    } | {
      Advokat Mitra    | "Dr. Mahendra Kusuma, S.H., M.H."
      Lokasi Pertemuan | "Gedung Equity Tower Lt. 24, SCBD Jakarta"
      Jadwal Konsultasi| "Hari Ini — Pukul 14:00 WIB"
      Status Kehadiran | <b>MENUNGGU PEMINDAIAN</b>
    }
  }
  --
  {
    <b>SELESAIKAN KONSULTASI</b>
    [  <b>PINDAI KODE QR DARI ADVOKAT UNTUK SELESAI</b>  ]
  }
}
@endsalt
```

---

## 3. SPESIFIKASI PENGALAMAN PENGGUNA (*UX FLOW*)
1. **Verifikasi Kehadiran:** Klien tidak perlu mengisi dokumen fisik rumit, cukup memindai QR untuk memulai dan mengakhiri sesi konsultasi tatap muka.
