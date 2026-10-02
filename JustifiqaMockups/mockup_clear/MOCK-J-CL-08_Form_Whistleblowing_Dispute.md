# MOCK-J-CL-08 [CLEAR]: Form Whistleblowing Etik & Pelaporan Sengketa Layanan Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-08` |
| **Nama Halaman** | Formulir Pelaporan Sengketa Layanan & Whistleblowing Pelanggaran Etik Advokat |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Klien Hukum Terverifikasi (*Verified Legal Client*) |
| **Ref. Use Case** | `J-UC21` (`ST-J-19`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Pusat Sengketa & Perlindungan Klien | [ Dasbor Saya ] | [ < Kembali ] | [ ☀ Light / ☾ Dark ] }
  --
  {
    === FORMULIR PELAPORAN SENGKETA & WHISTLEBLOWING ETIK
    "Laporan Anda langsung membekukan penarikan dana Escrow advokat secara otomatis hingga mediasi selesai."
  }
  --
  {
    <b>1. PILIH SESI / PERKARA YANG BERMASALAH</b>
    --
    Sesi Perkara Terkait | ^#REQ-202607-001 — Dr. Mahendra Kusuma, S.H. (Hukum Bisnis - Tier 2)^
    Status Dana Escrow  | [ <b>ESCROW HELD — SIAP DIBEKUKAN (FREEZE)</b> ]
    --
    <b>2. KATEGORI LAPORAN SENGKETA / PELANGGARAN ETIK</b>
    () Advokat Tidak Hadir / Tidak Responsif Melebihi SLA Fair-Clock
    (*) Kualitas Deliverable Tidak Sesuai Spesifikasi / Hukum yang Berlaku
    () Pelanggaran Kode Etik Advokat / Permintaan Biaya di Luar Escrow
    () Dugaan Konflik Kepentingan / Pelanggaran Kerahasiaan
    --
    <b>3. KRONOLOGI & BUKTI PENDUKUNG</b>
    Uraian Kejadian Sengketa:
    "Advokat tidak merespons revisi perjanjian selama 48 jam dan dokumen yang dikirimkan keliru mencantumkan pasal UU PT..."
    --
    Unggah Bukti Pendukung (Tangkapan Layar/Dokumen): | [ Pilih Berkas PDF/JPG (Max 15MB)... ]
    --
    [X] Saya menyatakan laporan ini benar dan menyetujui penahanan sementara dana Escrow selama investigasi etik berlangsung.
    --
    [  <b>KIRIM LAPORAN & BEKUKAN ESCROW SEKARANG</b>  ] | [ Batal ]
  }
}
@endsalt
```
