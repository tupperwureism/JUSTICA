# MOCK-J-GATEWAY-01 [CLEAR]: Gerbang Utama & Pemilihan Peran Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-GATEWAY-01` |
| **Nama Halaman** | Beranda Utama Justica (`justica.id`) |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Pengguna Publik & Calon Klien |
| **Ref. Use Case** | `J-UC01` (`ST-J-01`), `J-UC02` (`ST-J-02`), `J-UC07` (`ST-J-03`), `J-UC08` (`ST-J-04`), `J-UC14` (`ST-J-12`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Platform Konsultasi & Layanan Hukum Profesional | [ ☀ Light / ☾ Dark ] | [ Verifikasi Dokumen ] }
  --
  {
    === SOLUSI HUKUM TERPERCAYA UNTUK ANDA
    "Konsultasikan masalah hukum Anda bersama advokat terverifikasi resmi Mahkamah Agung dengan mudah dan aman."
  }
  --
  {
    [ Kendala hukum apa yang sedang Anda hadapi? (misal: Perdata, Ketenagakerjaan)...         ] | [  <b>CARI ADVOKAT</b>  ]
  }
  --
  {
    <b>PILIH AKSES PORTAL</b>
    --
    {
      <b>KLIEN HUKUM</b>
      Temukan advokat, mulai konsultasi daring/luring,
      atau ajukan bantuan hukum Pro Bono.
      --
      [ <b>Masuk / Daftar sebagai Klien</b> ]
    } |
    {
      <b>MITRA ADVOKAT</b>
      Kelola praktik profesional, jadwalkan sesi,
      dan tangani konsultasi klien.
      --
      [ <b>Masuk / Daftar Mitra Advokat</b> ]
    }
  }
  --
  {
    <b>KEUNGGULAN LAYANAN JUSTICA</b>
    [ Advokat Berlisensi Resmi ] • [ Rekening Bersama (Escrow) Aman ] • [ Kerahasiaan Sesi Terjamin ]
  }
  --
  {
    © 2026 JUSTICA Legal Platform • Seluruh sesi konsultasi dilindungi kerahasiaan hubungan advokat-klien.
  }
}
@endsalt
```

---

## 3. SPESIFIKASI PENGALAMAN PENGGUNA (*UX FLOW*)
1. **Navigasi Intuitif:** Pengunjung langsung memahami fungsi platform dan dapat memilih jalurnya secara tepat (Klien atau Advokat).
2. **Pencarian Cepat:** Memudahkan calon klien langsung mengetik masalah hukum sebelum mendaftar akun.
