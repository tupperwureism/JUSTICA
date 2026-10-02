# MOCK-J-PUBLIC-VERIFY [CLEAR]: Portal Verifikasi Dokumen Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-PUBLIC-VERIFY` |
| **Nama Halaman** | Verifikasi Dokumen (`verify.justica.id`) |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Pengguna Publik |
| **Ref. Use Case** | `J-UC14` (`ST-J-12`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Portal Verifikasi Keaslian Dokumen | [ < Kembali ke Beranda ] | [ ☀ / ☾ ] }
  --
  {
    === VERIFIKASI KEASLIAN DOKUMEN HUKUM
    "Pastikan keabsahan dokumen hukum atau kontrak resmi yang diterbitkan melalui platform Justica."
  }
  --
  {
    Masukkan Kode Dokumen / Hash | "e8f9a0c2b4d6e8f0a2c4e6f8a0b2d4c6e8f0a2c4e6f8a0b2d4c6..."
    Atau Unggah Berkas PDF       | [ Pilih Berkas Dokumen PDF... ]
    [  <b>VERIFIKASI SEKARANG</b>  ]
  }
  --
  {
    <b>HASIL PEMERIKSAAN DOKUMEN</b>
    --
    {#
      <b>Informasi Dokumen</b> | <b>Status Verifikasi</b>
      Status Keaslian | <b>DOKUMEN ASLI TERVERIFIKASI</b>
      Penerbit Dokumen | Dr. Mahendra Kusuma, S.H., M.H. (Advokat Berlisensi)
      Tanggal Diterbitkan | 02 Juli 2026
      Meterai Elektronik | e-Meterai Peruri Resmi Terdaftar
    }
  }
}
@endsalt
```

---

## 3. SPESIFIKASI PENGALAMAN PENGGUNA (*UX FLOW*)
1. **Kepercayaan & Keamanan:** Memberikan kepastian instan bagi instansi atau pengadilan mengenai keaslian dokumen hukum yang diterbitkan advokat Justica.
