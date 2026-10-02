# MOCK-J-CL-02A [CLEAR]: Dasbor Utama Klien & Riwayat Perkara Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-02A` |
| **Nama Halaman** | Dasbor Saya (`client.justica.id/dashboard`) |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Klien Hukum |
| **Ref. Use Case** | `J-UC03` (`ST-J-05`), `J-UC04` (`ST-J-08`), `J-UC12` (`ST-J-12`), `J-UC14` (`ST-J-12`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Portal Klien Terverifikasi | [ Dasbor Saya ] | [ Cari Advokat ] | [ Pusat Sengketa ] | [ Pengaturan Akun ] | [ ☀ Light / ☾ Dark ] }
  --
  {
    === HALO, BUDI SANTOSO
    "Kelola sesi konsultasi aktif, unduh dokumen hukum Anda, atau jadwalkan konsultasi baru."
  }
  --
  {
    [ <b>+ KONSULTASI BARU (CARI ADVOKAT)</b> ] | [ Layanan Pro Bono Gratis ]
  }
  --
  {
    <b>KONSULTASI HUKUM AKTIF</b>
    --
    {#
      <b>Advokat Mitra</b> | <b>Spesialisasi</b> | <b>Status Layanan</b> | <b>Aksi</b>
      Dr. Mahendra Kusuma, S.H., M.H. | Hukum Bisnis | Sesi Berjalan (44:12) | [ <b>Buka Ruang Obrolan</b> ]
      Anita Wulandari, M.H. | Ketenagakerjaan | Penyusunan Dokumen | [ <b>Lihat Dokumen</b> ]
    }
  }
  --
  {
    <b>RIWAYAT DOKUMEN & KONSULTASI SELESAI</b>
    --
    {#
      <b>Tanggal</b> | <b>Advokat</b> | <b>Layanan & Dokumen</b> | <b>Unduhan</b>
      02/07/2026 | Dr. Mahendra Kusuma, S.H. | Legal Opinion Kontrak NDA | [ Unduh Dokumen PDF ]
      18/06/2026 | Budi Hartono, S.H. | Konsultasi Tatap Muka | [ Unduh Bukti Transaksi ]
    }
  }
}
@endsalt
```

---

## 3. SPESIFIKASI PENGALAMAN PENGGUNA (*UX FLOW*)
1. **Ringkas & Fokus:** Menampilkan langsung konsultasi yang membutuhkan tindakan pengguna di bagian atas.
2. **Arsip Terpusat:** Seluruh dokumen hukum tersimpan rapi dan dapat diunduh kapan saja.
