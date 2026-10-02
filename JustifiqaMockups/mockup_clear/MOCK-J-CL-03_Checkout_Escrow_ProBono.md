# MOCK-J-CL-03 [CLEAR]: Checkout Pembayaran & Pengajuan Pro Bono Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-03` |
| **Nama Halaman** | Checkout Layanan (`client.justica.id/checkout`) |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Klien Hukum |
| **Ref. Use Case** | `J-UC05` (`ST-J-07`), `J-UC15` (`ST-J-13`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Platform Hukum Profesional | [ Dasbor Saya ] | [ < Kembali ] | [ Sisa Waktu Bayar: 14:28 ] | [ ☀ / ☾ ] }
  --
  {
    === KONFIRMASI PEMESANAN KONSULTASI
    "Dana Anda dilindungi dengan aman dalam Rekening Bersama (Escrow) dan baru diteruskan setelah sesi konsultasi selesai."
  }
  --
  {
    Advokat Mitra      | "Dr. Mahendra Kusuma, S.H., M.H."
    Layanan Dipilih    | "Konsultasi Hukum Mendalam (45 Menit)"
    Jadwal Pertemuan   | "Hari Ini, 10 Juli 2026 — 10:30 WIB"
    Total Biaya        | "<b>Rp 450.000</b>"
  }
  --
  {/ <b>[ PEMBAYARAN ESCROW ]</b> | [ PENGAJUAN BANTUAN GRATIS (PRO BONO) ] }
  --
  {
    <b>PILIH METODE PEMBAYARAN</b>
    --
    (*) QRIS (Gopay, OVO, DANA, Mobile Banking)
    () Virtual Account Bank (BCA, Mandiri, BNI, BRI)
    () Kartu Kredit / Debit
    --
    [X] Saya menyetujui Ketentuan Layanan Justica
    --
    [  <b>BAYAR SEKARANG — Rp 450.000</b>  ]
  }
  --
  {
    <b>ALTERNATIF: PENGAJUAN BANTUAN HUKUM GRATIS (SKTM)</b>
    --
    Nomor NIK KTP              | "3171234567890001                  "
    Nomor Surat SKTM Kelurahan | "SKTM/2026/VII/0921                  "
    Unggah Foto SKTM Asli      | [ Pilih Berkas Dokumen... ]
    --
    [  <b>AJUKAN KONSULTASI PRO BONO (Rp 0)</b>  ]
  }
}
@endsalt
```

---

## 3. SPESIFIKASI PENGALAMAN PENGGUNA (*UX FLOW*)
1. **Perlindungan Klien:** Menegaskan jaminan keamanan dana Escrow untuk meningkatkan kepercayaan pengguna saat pembayaran.
