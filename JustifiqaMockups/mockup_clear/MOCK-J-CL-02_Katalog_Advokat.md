# MOCK-J-CL-02 [CLEAR]: Katalog Advokat & Direktori Layanan Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-02` |
| **Nama Halaman** | Direktori Advokat (`client.justica.id/advocates`) |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Klien Hukum |
| **Ref. Use Case** | `J-UC03` (`ST-J-05`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Platform Hukum Profesional | [ Dasbor Saya ] | [ <b>Cari Advokat</b> ] | [ Pengaturan ] | [ ☀ / ☾ ] }
  --
  {
    === PILIH ADVOKAT TERVERIFIKASI
    "Seluruh advokat mitra Justica berlisensi resmi Mahkamah Agung dan siap membantu permasalahan hukum Anda."
  }
  --
  {
    Spesialisasi Hukum: ^Semua Spesialisasi^ | Tier Layanan: ^Semua Pilihan Tarif^ | [X] Advokat Online Saat Ini | [ <b>CARI</b> ]
  }
  --
  {
    <b>DAFTAR MITRA ADVOKAT TERSEDIA</b>
    --
    {#
      <b>Nama & Lisensi Advokat</b> | <b>Spesialisasi</b> | <b>Pilihan Layanan</b> | <b>Aksi</b>
      {
        <b>Dr. Mahendra Kusuma, S.H., M.H.</b>
        Lisensi PERADI • ★ 4.9 (124 Ulasan)
      } | {
        Hukum Bisnis & Sengketa
        Pengalaman 15 Tahun
      } | {
        • Konsultasi Awal (15 Menit Gratis)
        • Konsultasi Lengkap (Rp 450.000)
        • Analisis & Pembuatan Dokumen
      } | {
        [ <b>Lihat Profil & Jadwal</b> ]
      }
      {
        <b>Anita Wulandari, S.H., M.H.</b>
        Lisensi AAI • ★ 4.8 (88 Ulasan)
      } | {
        Hukum Ketenagakerjaan & PHK
        Pengalaman 10 Tahun
      } | {
        • Konsultasi Awal (15 Menit Gratis)
        • Konsultasi Lengkap (Rp 350.000)
        • Analisis & Pembuatan Dokumen
      } | {
        [ <b>Lihat Profil & Jadwal</b> ]
      }
    }
  }
}
@endsalt
```

---

## 3. SPESIFIKASI PENGALAMAN PENGGUNA (*UX FLOW*)
1. **Pilihan Transparan:** Klien dapat membandingkan keahlian, pengalaman, dan tarif setiap advokat dengan transparan sebelum memesan jadwal.
