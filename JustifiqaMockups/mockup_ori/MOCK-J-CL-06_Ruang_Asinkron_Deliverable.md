# MOCK-J-CL-06 [ORI]: Ruang Kerja Asinkron Deliverable & Download Gate Justica

## 1. METADATA SPESIFIKASI (ENGINEERING EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-06` |
| **Nama Halaman** | Portal Penyerahan Berkas Hukum Asinkron & e-Meterai (`client.justica.id/deliverable/{id}`) |
| **Aktor Target** | Klien Hukum Terverifikasi (*Verified Legal Client*) |
| **Ref. Use Case** | `J-UC12` (`ST-J-12`: Pembuatan & Verifikasi Deliverable Opini Hukum / Kontrak, 2-Round Review Quota, Hard Thread Lock), `J-UC14` (`ST-J-12`: Pembubuhan e-Meterai Peruri SHA-256) |
| **Peta Navigasi (`from` -> `to`)** | `MOCK-J-CL-02A` -> `MOCK-J-CL-06` -> `MOCK-J-CL-07` (Modal Rating & Ulasan), `MOCK-J-CL-08` (Pusat Sengketa) |
| **Kepatuhan Keamanan** | Peruri e-Meterai KMS Integration, SHA-256 Digital Signature Verify, Escrow Hold/Release Gate, Hard Thread Lock |

---

## 2. DIAGRAM WIREFRAME LOGIS (PLANTUML SALT)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> - Ruang Kerja Asinkron | [ Dasbor Saya ] | [ ☀ Light / ☾ Dark Mode ] }
  --
  {
    === RUANG SERAH TERIMA BERKAS HUKUM & LEGAL OPINION RESMI (ST-J-12)
    "Periksa dokumen hukum yang telah disusun oleh Advokat. Anda dapat mengajukan revisi atau menyetujuinya untuk melepas dana Escrow."
  }
  --
  {
    {#
      <b>Informasi Berkas Deliverable</b> | <b>Metadata Kepatuhan Hukum SHA-256 & Quota Guard</b>
      {
        Judul Dokumen     | "Pendapat Hukum (*Legal Opinion*) & Draf Perjanjian Kerja Sama"
        Status Terkini    | <b>SIAP DIUNDUH & DIVERIFIKASI (SIAP E-METERAI RESMI)</b>
        Hash SHA-256 Asli | "a2c4e6f8a0b2d4c6e8f0a2c4e6f8a0b2d4c6e8f0a2c4e6f8a0b2d4c6e8f01234"
        Nomor e-Meterai   | "PERURI-1029384756 (Legalisasi 100% Sah)"
      } | {
        Sisa Kuota Revisi : <b>2 / 2 Putaran Revisi Gratis (2-Round Quota Engine)</b>
        Batas Waktu Review: <b>72 Jam Sebelum Auto-Approve</b>
        Status Thread     : <color:orange><b>ACTIVE (async_thread_locked = TRUE saat Final/Approved)</b></color>
        [ <b>PERIKSA KEASLIAN HASH</b> ]
      }
    }
  }
  --
  {
    <b>PRATAYANG DOKUMEN HUKUM (READ-ONLY INLINE VIEW)</b>
    [   PDF PRATAYANG DOKUMEN   ]
    --
    [  <b>UNDUH DOKUMEN LENGKAP PDF (SHA-256)</b>  ]
    [  <b>SETUJUI DOKUMEN & SELESAIKAN PERKARA</b>  ]
    [  <b>AJUKAN REVISI DOKUMEN (GRATIS)</b>  ]
    [  Laporan Masalah / Sengketa Berkas  ]
  }
}
@endsalt
```

---

## 3. KAMUS DATA & ELEMEN UI (DATA FIELD DICTIONARY)
| ID Elemen | Nama Komponen UI | Tipe Data | Wajib? | Aturan Validasi Logis & Batasan Kepatuhan |
| :--- | :--- | :--- | :---: | :--- |
| `DEL-NAV-01` | `Tautan Dasbor Saya`| Navigation Link | Ya | Kembali ke dasbor utama klien `MOCK-J-CL-02A`. |
| `DEL-NAV-02` | `Toggle Theme Mode` | Action Button   | Ya | Mengubah tema visual antarmuka Light/Dark Mode di local storage. |
| `DEL-PRE-01` | `Pratayang PDF`    | Binary View | Ya | Menampilkan berkas dengan *watermark* sebelum persetujuan akhir. |
| `DEL-BTN-01` | `Unduh PDF SHA-256`| Action Button| Ya | Mengirimkan berkas binary asli lengkap metadata sertifikat e-Meterai. |
| `DEL-BTN-02` | `Setujui Dokumen`  | Action Button| Ya | Melepas 100% dana Escrow ke advokat (`PAID_OUT`) dan membuka modal rating `CL-07`. |
| `DEL-BTN-03` | `Ajukan Revisi`    | Action Button| Ya | Aktif jika `revisions_left > 0`. Membuka formulir masukan catatan revisi. |
| `DEL-BTN-04` | `Laporan Sengketa` | Action Button| Ya | Mengalihkan klien ke formulir pelaporan masalah kualitas/substansi berkas (`MOCK-J-CL-08`). |

---

## 4. MATRIKS EVENT HANDLER & TRANSISI LOGIKA
| Event Trigger | Komponen UI | Kondisi Guard (*Pre-Condition*) | Aksi Sistem (*System Response*) | Transisi Layar (*Target*) |
| :--- | :--- | :--- | :--- | :--- |
| `onClick` | Tombol `[ UNDUH DOKUMEN ]` | Berkas ter-stamp e-Meterai | Catat aktivitas pengunduhan ke WORM audit log, unduh berkas PDF. | Tetap di `MOCK-J-CL-06` |
| `onClick` | Tombol `[ SETUJUI DOKUMEN ]`| Konfirmasi modal `Yes` | Cairkan Escrow ke advokat, ubah status perkara jadi `COMPLETED`. | -> `MOCK-J-CL-07` (Rating Modal) |
| `onClick` | Tombol `[ AJUKAN REVISI ]` | `revisions_left > 0` | Kirim catatan revisi ke advokat (`AD-04`), kurangi kuota revisi. | Tetap (Status menjadi `IN_REVISION`) |
| `onClick` | Tombol `[ Laporan Sengketa ]`| Sesi Aktif / Review | Membuka pusat pelaporan masalah dan sengketa Escrow. | -> `MOCK-J-CL-08` (Form Whistleblowing & Dispute) |
| `onClick` | Header `[ Dasbor Saya ]`   | Sesi Klien Aktif | Kembali ke halaman dasbor utama klien. | -> `MOCK-J-CL-02A` |
| `onClick` | Tombol `[ ☀ / ☾ Mode ]`    | Tidak ada | Mengganti tema visual antarmuka Light/Dark Mode. | Tetap di `MOCK-J-CL-06` |

---

## 5. KONTRAK INTEGRASI API & DATA BINDING (*API BINDING CONTRACT*)
| Aksi UI | HTTP Method & Endpoint | Payload Request JSON | Struktur Response JSON |
| :--- | :--- | :--- | :--- |
| Setujui Deliverable | `POST /api/v2/client/deliverables/REQ-002/approve` | `{"consent_final": true, "client_sha256": "a2c4e6..."}` | `200 OK: {"case_status": "COMPLETED", "escrow_payout": "TRIGGERED"}` |

---

## 6. MATRIKS PENANGANAN ERROR & CATATAN ARSITEKTUR TEKNIS
| Kode HTTP / Error | Skenario Pemicu Kegagalan | Pesan UI ke Pengguna (*User-Facing Message*) | Mekanisme Pemulihan / Fallback |
| :--- | :--- | :--- | :--- |
| `400 Revision Exceeded`| Kuota revisi gratis habis (`revisions_left == 0`) | `"Kuota revisi gratis telah habis. Silakan setujui dokumen atau pesan sesi penambahan revisi."` | Tombol revisi dinonaktifkan dengan opsi pengajuan add-on. |
| `409 Integrity Mismatch`| Hash berkas di server berbeda dari WORM | `"Peringatan: Berkas rusak atau mengalami perubahan tidak sah."` | Pengunduhan diblokir otomatis untuk mencegah distribusi dokumen cacat hukum. |

### Catatan Arsitektur Teknis:
1. **e-Meterai KMS Integration:** Penandatanganan meterai elektronik dilakukan via *Key Management Service* Peruri yang disinkronkan ke dalam berkas PDF asli.
2. **Escrow Sign-off Gate:** Rekening Escrow otomatis tertahan sampai tombol `[ SETUJUI DOKUMEN ]` ditekan oleh klien atau setelah melewati batas waktu otomatis 72 jam tanpa keberatan.
