# MOCK-J-CL-06 [CLEAR]: Ruang Dokumen Hukum Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-06` |
| **Nama Halaman** | Ruang Kerja Dokumen (`client.justica.id/deliverable`) |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Klien Hukum |
| **Ref. Use Case** | `J-UC12` (`ST-J-12`), `J-UC14` (`ST-J-12`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Platform Hukum Profesional | [ Dasbor Saya ] | [ ☀ / ☾ ] }
  --
  {
    === DOKUMEN HUKUM SIAP DIUNDUH
    "Advokat Anda telah menyelesaikan penyusunan dokumen hukum resmi ber-e-Meterai."
  }
  --
  {
    Judul Dokumen     | "Pendapat Hukum (*Legal Opinion*) & Kontrak Perjanjian"
    Status Legalisasi | <b>TERVERIFIKASI & SAH BER-e-METERAI</b>
  }
  --
  {
    [  <b>UNDUH DOKUMEN LENGKAP (PDF)</b>  ]
    --
    Apakah dokumen ini sudah memenuhi kebutuhan Anda?
    [  <b>SETUJUI & SELESAIKAN PERKARA</b>  ]
    --
    [  Ajukan Perbaikan Dokumen (Sisa Garansi: 2x)  ]
  }
}
@endsalt
```

---

## 3. SPESIFIKASI PENGALAMAN PENGGUNA (*UX FLOW*)
1. **Penyelesaian Transparan:** Klien dapat mengunduh dan memeriksa dokumen secara menyeluruh sebelum menyetujui pencairan dana akhir.
