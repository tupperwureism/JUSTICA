# MOCK-J-CL-02B [CLEAR]: Profil Detail Advokat & Booking Jadwal Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-02B` |
| **Nama Halaman** | Profil Advokat & Pemilihan Jadwal (`client.justica.id/advocates/mahendra-kusuma`) |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Klien Hukum |
| **Ref. Use Case** | `J-UC03` (`ST-J-05`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Platform Hukum Profesional | [ < Kembali ke Daftar Advokat ] | [ ☀ / ☾ ] }
  --
  {
    === DR. MAHENDRA KUSUMA, S.H., M.H.
    "Spesialis Hukum Bisnis, Sengketa Komersial, & Hak Kekayaan Intelektual"
  }
  --
  {
    [ Advokat Terverifikasi Resmi ] • [ Anggota PERADI ] • [ ★ 4.9 dari 124 Klien ]
  }
  --
  {
    <b>PROFIL & PENGALAMAN</b>
    "Berpengalaman lebih dari 15 tahun mendampingi klien korporasi dan individu dalam penyelesaian sengketa komersial dan kontrak bisnis."
  }
  --
  {
    <b>1. PILIH LAYANAN KONSULTASI</b>
    --
    () <b>Konsultasi Awal (15 Menit) — GRATIS Rp 0</b>
       Penilaian awal kasus hukum Anda secara singkat.
    (*) <b>Konsultasi Mendalam (45 Menit) — Rp 450.000</b>
        Analisis dokumen, pembahasan strategi hukum, dan saran tindak lanjut.
    () <b>Konsultasi & Pembuatan Dokumen — Rp 3.500.000</b>
       Penyusunan pendapat hukum resmi / kontrak beserta revisi.
  }
  --
  {
    <b>2. PILIH METODE & JADWAL PERTEMUAN</b>
    --
    Metode Pertemuan: (*) Konsultasi Online | () Konsultasi Tatap Muka
    Tanggal Konsultasi: ^Hari Ini, 10 Juli 2026^
    Pilihan Jam Tersedia:
    [ 09:00 WIB (Penuh) ] | [ <b>10:30 WIB (Tersedia)</b> ] | [ 14:00 WIB (Tersedia) ]
  }
  --
  {
    [  <b>LANJUTKAN KE PEMBAYARAN</b>  ]
  }
}
@endsalt
```

---

## 3. SPESIFIKASI PENGALAMAN PENGGUNA (*UX FLOW*)
1. **Kejelasan Informasi:** Menampilkan profil lengkap serta rincian biaya yang terjamin tanpa ada biaya tersembunyi.
