# Penjelasan Use Case J-UC23 & J-UC24 (Bahasa Non-Teknis)

> Dokumen ini menjelaskan dua Use Case Justifiqa dalam bahasa yang mudah dipahami, tanpa jargon teknis. Tujuan: agar Product Owner, stakeholder non-engineering, atau kontributor baru dapat memahami logika fitur dengan cepat.

**Referensi teknis (untuk yang ingin masuk detail):**
- `MarkDown/plantuml_activity_diagrams.md` baris 1559-1815 (AD-P2-01, AD-P2-02)
- `MarkDown/plantuml_sequence_diagrams.md` baris 2470+ (SD-P2-01, SD-P2-02)
- `MarkDown/DOMAIN_COMPLIANCE_MATRIX.md` baris 138-151 (CM-P2-CORP-*, CM-P2-EKYC-*)
- `MarkDown/CORPORATE_CONCIERGE_LEGAL_AND_PARTNER_MATRIX.md`
- `MarkDown/EKYC_AND_MULTIPARTY_SIGNING_LEGAL_MATRIX.md`

---

## J-UC23: Corporate Intake & Notary Stamping PT/CV

**Inti:** Klien mau bikin PT atau CV (badan usaha) untuk bisnisnya, tapi prosesnya ribet - harus bolak-balik ke notaris, urus KBLI (kode bidang usaha), urus NIB (izin operasional) via AHU/OSS. Justifiqa jadi "perantara" yang ngurusin流程 dari awal sampai perusahaan resmi berdiri.

**Analogi:** Seperti bikin KTP via calo profesional - Anda isi formulir, calo yang urus ke kelurahan/disdukcapil, bayar di muka, calo kasih KTP jadi. Anda tidak perlu tahu prosedur internal mereka.

**Alur (10 langkah):**

1. **Klien submit data** - Nama PT/CV, bidang usaha, siapa pemilik asli (Beneficial Owner / BO), alamat, modal, dll.
2. **Sistem validasi** - Cek format, kelengkapan. **Penting:** BO harus orang fisik (pemegang saham), BUKAN badan hukum lain.
3. **Klien bayar upfront via Escrow** - Misal Rp 5 juta untuk biaya notaris + PNBP (Penerimaan Negara Bukan Pajak). Dana ditahan di rekening bersama - belum diteruskan ke siapa pun.
4. **Notaris mitra ditugaskan** - Hanya setelah dana di-escrow (anti-scam: notaris tidak kerja kalau belum dibayar).
5. **Notaris review** - Cek data, identitas, KBLI, domisili. Jika kurang lengkap, minta revisi ke klien (dana tetap ditahan selama revisi).
6. **Notaris bikin akta** - Akta pendirian PT di notaris secara **fisik** (wajib sesuai UU Jabatan Notaris Pasal 16 - tidak bisa full online untuk akta autentik).
7. **Submit ke AHU/OSS** - Sistem pemerintah. **Bisa ditolak**, diulang sampai APPROVED.
8. **NIB terbit** - Klien dapat NIB (izin usaha resmi dari pemerintah).
9. **Rekonsiliasi** - Sistem cocokkan nomor AHU/NIB, dokumen final, hash SHA-256.
10. **WORM anchoring** - Dokumen final disimpan permanen dengan hash kriptografis (tidak bisa diubah/dihapus).
11. **Dana diteruskan ke Notaris** - Dari escrow diteruskan ke rekening notaris, setelah dikurangi fee platform.

**Compliance wajib:**
- **PMPJ (Prinsip Mengenali Pengguna Jasa)** - Notaris wajib cek KTP, BO, asal-usul modal untuk anti pencucian uang (AML/CFT).
- **PPATK reporting** - Jika ada indikasi uang ilegal, notaris wajib lapor **diam-diam** ke PPATK (tidak boleh kasih tahu klien = "No Tipping-Off").

**Yang Justifiqa TIDAK boleh lakukan:**
- Bikin akta notaris sendiri (hanya notaris manusia yang sah untuk akta autentik).
- Simpan credential notaris untuk akses AHU/OSS (keamanan).
- Klaim "izin pasti terbit" (OSS itu risk-based, keputusan akhir ada di pemerintah).

---

## J-UC24: Transaksi Properti & e-KYC Forensik Multi-Pihak

**Inti:** Jual beli tanah (atau properti high-value lainnya). Nilai transaksi besar - risiko penipuan/sengketa juga besar. Justifiqa jadi "penjaga gerbang" yang memastikan semua pihak yang tanda tangan kontrak adalah benar-benar orang yang berhak, **bukan penipu pakai KTP orang lain**.

**Analogi:** Seperti tanda tangan akta jual beli tanah di notaris - tapi di sini verifikasi identitasnya **digital forensik**, menggunakan foto pembuktian khusus (bukan selfie biasa).

**Alur (7 fase):**

1. **Inisiator bikin transaksi** - Daftarkan semua pihak (pembeli, penjual, dll), attach e-kertas (kontrak digital).
2. **Klien/Pembeli bayar escrow** - Dana ditahan. **TTL (time-to-live) global diset: 7x24 jam** sejak escrow lock.
3. **Undangan dikirim ke semua pihak** - Setiap pihak dapat link unik untuk verifikasi.
4. **Setiap pihak verifikasi diri (e-KYC)** dengan **foto pembuktian khusus** dalam **satu frame**:
   - Setengah badan (bukan selfie close-up)
   - Tangan pegang KTP fisik
   - Di samping laptop/device yang menampilkan TTD kontrak final di layarnya
5. **Provider e-KYC (komputer vision AI) analisis** - 3 jenis cek simultan:
   - **Liveness** - orang hidup beneran, bukan foto/video orang lain
   - **OCR KTP** - cocokkan data KTP dengan database Dukcapil
   - **Deteksi device & TTD** - apakah di layar beneran ada TTD kontrak yang dimaksud
6. **Sistem catat hasil** - Hanya **metadata**: status PASSED/REJECTED, digest SHA-256, timestamp. **Justifiqa TIDAK menyimpan foto/video** (privasi mutlak).
7. **Cek sinkronisasi** - Apakah semua pihak sudah PASSED?
   - **Semua PASSED** -> lanjut signing (kontrak sah, dana tetap ditahan sampai milestone berikutnya).
   - **Ada ilegal/fraud** -> **Global Halt**: envelope VOIDED, semua pihak batal, **refund 100%**.
   - **Gagal liveness 3x berturut-turut** -> **Global Halt** juga (orang tersebut ditolak otomatis).
   - **TTL habis** (7 hari) sebelum semua PASSED -> **Global Halt** (envelope EXPIRED, refund 100%).

**Yang bikin verifikasi ini "forensik":**
- Bukan selfie biasa - ada **komponen fisik** (KTP asli) + **komponen digital** (layar + TTD) dalam satu frame.
- **Anti-editan**: sistem bisa deteksi jika foto dimanipulasi.
- **Anti-replay**: callback dari provider ditandatangani kriptografis + ada nonce, tidak bisa diputar ulang.

**Yang Justifiqa TIDAK boleh lakukan (privasi mutlak):**
- Simpan foto KTP asli.
- Simpan video liveness.
- Simpan template biometrik (sidik jari, wajah, dll).
- Simpan payload mentah dari provider.
- Klaim "otentikasi final" - untuk akta autentik, wewenang tetap di notaris/PPAT manusia.

---

## Kenapa Dua Fitur Ini Ada di Justifiqa?

| Aspek | J-UC23 (Bikin PT/CV) | J-UC24 (Jual Beli Properti) |
|---|---|---|
| **Tujuan** | Bantu UMKM bikin badan usaha legal | Lindungi transaksi high-value dari penipuan |
| **Kompleksitas** | Sedang (form + notaris review) | Tinggi (e-KYC multi-pihak + TTL ketat) |
| **Risiko kalau gagal** | PT/CV tidak jadi (rugi waktu) | Uang hilang / sengketa properti (rugi miliaran) |
| **Compliance utama** | PMPJ, UU Jabatan Notaris | UU PDP, UU ITE, PSrE (tanda tangan elektronik) |
| **Refund policy** | Pro-rata jika cancel | 100% refund jika Global Halt |

Keduanya adalah **fitur trust** - yang bikin Justifiqa bukan sekadar aplikasi cari advokat, tapi platform yang bisa diandalkan untuk hal-hal serius (bikin perusahaan + jual beli properti bernilai tinggi).

---

## Glosarium Singkat (Istilah yang Mungkin Membingungkan)

| Istilah | Arti |
|---|---|
| **BO (Beneficial Owner)** | Orang fisik yang punya/mengontrol badan hukum (pemilik manfaat sebenarnya). |
| **KBLI** | Klasifikasi Baku Lapangan Usaha Indonesia - kode 5-digit untuk bidang usaha. |
| **NIB** | Nomor Induk Berusaha - izin usaha resmi yang diterbitkan OSS. |
| **AHU/OSS** | Sistem Administrasi Hukum Umum / Online Single Submission - platform pemerintah untuk daftar badan usaha. |
| **PNBP** | Penerimaan Negara Bukan Pajak - biaya negara (mis. untuk legalisir akta). |
| **PMPJ** | Prinsip Mengenali Pengguna Jasa - KYC/AML yang wajib dilakukan notaris/advokat. |
| **PPATK** | Pusat Pelaporan dan Analisis Transaksi Keuangan - menerima laporan transaksi mencurigakan. |
| **Liveness** | Bukti bahwa orang di foto adalah orang hidup yang hadir saat itu (bukan foto orang lain). |
| **TTL** | Time-to-live - batas waktu maksimal suatu proses sebelum dianggap gagal. |
| **WORM** | Write-Once-Read-Many - storage yang hanya bisa ditulis sekali, tidak bisa dihapus/diubah. |
| **PSrE** | Penyelenggara Sertifikasi Elektronik - pihak yang terakreditasi untuk tanda tangan elektronik (mis. Privy, Peruri). |
| **SHA-256** | Algoritma hash kriptografis - menghasilkan "sidik jari" digital unik untuk dokumen. |
| **E2EE** | End-to-End Encryption - pesan terenkripsi dari pengirim sampai penerima, tidak bisa dibaca pihak tengah. |
| **WORM Anchoring** | Menyimpan hash SHA-256 dokumen di WORM storage sebagai bukti keaslian/abadi. |
| **OSS** | Online Single Submission - portal pemerintah terintegrasi untuk perizinan berusaha. |

---

**Versi:** 1.0
**Tanggal:** 31 Juli 2026
**Berdasarkan:** Sesi klarifikasi product owner Justifiqa (J-UC23 & J-UC24 definisi & alur dikonfirmasi 31 Juli 2026).
