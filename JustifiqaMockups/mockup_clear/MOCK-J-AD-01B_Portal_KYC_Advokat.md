# MOCK-J-AD-01B [CLEAR]: Portal Verifikasi KYC & Sinkronisasi Lisensi SIPP Mahkamah Agung Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-AD-01B` |
| **Nama Halaman** | Portal Onboarding, Verifikasi KYC, & Sinkronisasi Lisensi SIPP Advokat |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Mitra Advokat Berlisensi Mahkamah Agung |
| **Ref. Use Case** | `J-UC01` (`ST-J-01`), `J-UC17` (`ST-J-15`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Portal Verifikasi KYC Advokat | [ Keluar ] | [ ☀ Light / ☾ Dark ] }
  --
  {
    === VERIFIKASI IDENTITAS & SINKRONISASI LISENSI SIPP MAHKAMAH AGUNG
    "Langkah wajib untuk memastikan seluruh advokat yang berpraktik di platform Justica berlisensi aktif dan sah."
  }
  --
  {
    <b>1. DATA IDENTITAS & KREDENSIAL ADVOKAT</b>
    --
    Nomor Induk Kependudukan (NIK KTP) | "3171234567890001                  "
    Nomor SIPP Mahkamah Agung RI       | "18293/PERADI/2015                   "
    Organisasi Advokat Menaungi        | ^PERADI (Perhimpunan Advokat Indonesia)^
    Nomor Rekening Bank Pencairan      | "123-00-9876543-2 (Bank Mandiri)     "
    --
    <b>2. UNGGAH DOKUMEN LEGALITAS FISIK TERVERIFIKASI</b>
    Foto Kartu Anggota Organisasi Advokat | [ Pilih Berkas JPG/PDF (Max 10MB)... ]
    Foto Berita Acara Sumpah Advokat PT   | [ Pilih Berkas JPG/PDF (Max 10MB)... ]
    --
    [  <b>SINKRONISASIKAN SECARA REAL-TIME KE API MAHKAMAH AGUNG</b>  ]
  }
  --
  {
    <b>HASIL SINKRONISASI API MAHKAMAH AGUNG RI:</b>
    --
    {#
      <b>Parameter Pemeriksaan</b> | <b>Status Pangkalan Data MA RI</b> | <b>Hasil Kepatuhan Justica</b>
      Status Lisensi SIPP         | <b>AKTIF & BERLAKU HINGGA 2028</b> | [ <color:green><b>VERIFIED ACTIVE</b></color> ]
      Kesesuaian Nama Advokat     | Dr. Mahendra Kusuma, S.H., M.H.  | [ <color:green><b>MATCH 100%</b></color> ]
      Catatan Pelanggaran Etik MA | TIDAK ADA CATATAN PELANGGARAN      | [ <color:green><b>CLEAN RECORD</b></color> ]
    }
  }
  --
  {
    [  <b>SELESAIKAN ONBOARDING & MASUK KE COMMAND CENTER</b>  ]
  }
}
@endsalt
```
