# MOCK-J-CL-03B [CLEAR]: Instruksi Pembayaran & Resi Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-03B` |
| **Nama Halaman** | Instruksi Pembayaran (`client.justica.id/invoice`) |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Klien Hukum |
| **Ref. Use Case** | `J-UC05` (`ST-J-07`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Platform Hukum Profesional | [ Dasbor Saya ] | [ ☀ / ☾ ] }
  --
  {
    === INSTRUKSI PEMBAYARAN REKENING BERSAMA (ESCROW)
    "Selesaikan pembayaran dalam waktu 15 menit agar jadwal konsultasi Anda tetap terpesan."
  }
  --
  {
    ID Tagihan         | "INV-202607-003"
    Layanan Konsultasi | "Dr. Mahendra Kusuma, S.H., M.H. (45 Menit)"
    Total Pembayaran   | "<b>Rp 450.000</b>"
  }
  --
  {
    <b>PINDAI KODE QRIS ATAU TRANSFER VIRTUAL ACCOUNT</b>
    --
    {
      [  KODE QRIS INSTAN  ]
      "Gunakan aplikasi e-Wallet atau Mobile Banking Anda"
    } | {
      Virtual Account Bank BCA:
      <b>88921 081234567890</b>  [ Salin Nomor ]
      --
      Virtual Account Bank Mandiri:
      <b>89022 081234567890</b>  [ Salin Nomor ]
    }
  }
  --
  {
    [  <b>CEK STATUS PEMBAYARAN</b>  ] | [ Unduh Bukti Tagihan ]
  }
  --
  {
    ! <color:green><b>PEMBAYARAN DITERIMA:</b></color>
    [  <b>MASUK KE RUANG KONSULTASI SEKARANG</b>  ]
    --
    ! <color:blue><b>PRO BONO SKTM DISETUJUI (Rp 0):</b></color>
    [  <b>MASUK KE RUANG PRO BONO SEKARANG</b>  ]
  }
}
@endsalt
```

---

## 3. SPESIFIKASI PENGALAMAN PENGGUNA (*UX FLOW*)
1. **Kemudahan Bayar:** Klien dapat menyalin nomor Virtual Account atau memindai QRIS secara langsung dengan kejelasan batas waktu.
