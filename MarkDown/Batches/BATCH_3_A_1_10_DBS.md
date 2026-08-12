# Batch 3.A.1.10 DBS — Menjelaskan Koreksi Keturunan (Ancestry) Batch 3.A.1.9

Dokumen ini menjelaskan secara sederhana (DBS) mengapa Batch 3.A.1.10 diperlukan, apa yang diperbaiki, dan bagaimana pembaca dapat memahaminya — tanpa memerlukan pengetahuan teknis mendalam.

---

## 1. Empat Nama untuk Empat Hubungan Git yang Berbeda

Dalam audit, satu angka (hash) tidak boleh memiliki dua arti yang berbeda. Batch 3.A.1.9 salah menempatkan angka yang sama untuk dua hubungan yang berbeda. Berikut empat nama yang benar, dengan contoh angka yang sudah diverifikasi oleh Git:

| Nama hubungan | Arti | Contoh angka yang sudah diverifikasi |
|---|---|---|
| **Input fixed point** | Komit yang menjadi titik awal (induk) sebelum batch ini berjalan. Ini stabil. | `979c7932d99d80819c2307042637a1d777ac10aa` |
| **Parent of input fixed point** (induk dari titik awal) | Komit sebelum titik awal — ini berbeda dari titik awal itu sendiri. | `67439533e079cceded8bbddba1f56a4db6388767` |
| **Resulting commit** | Komit yang dihasilkan oleh batch ini. | `6c3f38c340b05a9b6ae404e925b4a8d5192c1f6b` (hasil 3.A.1.9) |
| **Parent of resulting commit** | Komit sebelum komit hasil — ini sama dengan input fixed point, bukan sama dengan induknya. | `979c7932d99d80819c2307042637a1d777ac10aa` |

**Contoh empat simpul (node) dari sejarah Git:**

`67439533` → `979c7932` → `6c3f38c` → (komit hasil 3.A.1.10, belum diketahui saat dokumen ini ditulis)

Setiap panah berarti "induk dari". Jadi `979c7932` adalah anak dari `67439533`, dan `6c3f38c` adalah anak dari `979c7932`. Ini adalah rantai yang jelas dan tidak bisa dibalik.

---

## 2. Mengapa Satu Angka Tidak Boleh Diberi Dua Nama yang Berbeda

Jika satu angka (`979c7932`) disebut sebagai "titik awal" dan juga disebut sebagai "induk dari titik awal" dalam satu dokumen, maka pembaca akan bingung: apakah angka itu adalah titik awal, atau angka itu adalah sesuatu sebelum titik awal? Dalam audit, kebingungan ini berarti dokumen gagal membuktikan apa yang sebenarnya terjadi. Oleh karena itu, setiap angka dalam dokumen audit harus memiliki satu label hubungan yang tepat.

---

## 3. Mengapa Label yang Tepat Penting dalam Jejak Audit

Audit bukan hanya tentang "apakah angka benar" tetapi juga "apakah angka itu menjelaskan hubungan yang benar". Label yang tepat memastikan bahwa:

- Pembaca bisa mengikuti rantai dari satu komit ke komit berikutnya.
- Tidak ada kesalahan yang tersembunyi karena label yang kabur.
- Dokumen bisa diverifikasi ulang oleh orang lain menggunakan perintah `git rev-parse`.

---

## 4. Perbedaan antara Kegagalan Substantif dan Kegagalan Metadata Saja

Batch 3.A.1.9 memiliki dua bagian:

- **Koreksi substantif** (tiga koreksi dokumentasi): penghapusan resep eksekusi berbahaya, koreksi klaim hash yang saling bertentangan, dan penghapusan kata arah usang (`di bawah`). Ketiga koreksi ini **tetap diterima** — mereka benar dan tidak dibuka kembali.
- **Kegagalan metadata**: hanya bagian keturunan (hubungan angka) dalam dokumen `BATCH_3_A_1_9.md` yang salah. Ini bukan kegagalan implementasi (`67439533` tetap diterima) dan bukan kegagalan koreksi substantif.

Batch 3.A.1.10 hanya memperbaiki bagian metadata ini, bukan membuka kembali koreksi substantif atau kode produksi.

---

## 5. Contoh Rantai Empat Simpul (Tanpa Memprediksi Hash Akhir)

Rantai yang sudah diverifikasi:

1. `67439533e079cceded8bbddba1f56a4db6388767` — komit implementasi Corporate Intake (`67439533`).
2. `979c7932d99d80819c2307042637a1d777ac10aa` — komit sebelum 3.A.1.9 (titik awal 3.A.1.9).
3. `6c3f38c340b05a9b6ae404e925b4a8d5192c1f6b` — komit hasil 3.A.1.9.
4. Komit hasil 3.A.1.10 — **pada saat dokumen ini dibuat (creation time), hash komit hasil 3.A.1.10 belum diketahui dan tidak disertakan; fakta repository sekarang (present-state): komit hasil 3.A.1.10 diverifikasi sebagai `e347594988af77692364d1cb3d9cbe7583337e23` (parent: `6c3f38c340b05a9b6ae404e925b4a8d5192c1f6b`)**.

---

## 6. Daftar Periksa dan Mini-Kuis

Sebelum menyatakan batch "siap untuk audit eksternal", tanyakan:

- [ ] Apakah setiap angka memiliki satu label hubungan (titik awal, induk titik awal, komit hasil, induk komit hasil)?
- [ ] Apakah angka-angka ini cocok dengan hasil `git rev-parse`?
- [ ] Apakah dokumen membedakan kegagalan metadata dari kegagalan substantif?
- [ ] Apakah dokumen menyatakan dengan jelas bahwa implementasi `67439533` tetap diterima?
- [ ] Apakah dokumen tidak menyertakan angka komit hasil 3.A.1.10 sebagai prediksi?
- [ ] Apakah semua empat file dalam allowlist diverifikasi sebagai UTF-8 tanpa BOM dan tanpa spasi belakang berlebih?

**Mini-kuis:**

1. **Apa bedanya "titik awal" (`979c7932`) dengan "induk dari titik awal" (`67439533`)?**
   Titik awal adalah komit yang menjadi dasar batch ini (`979c7932`); induknya (`67439533`) adalah komit sebelum titik awal, yang dalam kasus ini adalah komit implementasi Corporate Intake.

2. **Mengapa dokumen `BATCH_3_A_1_9.md` harus dikoreksi?**
   Karena dokumen tersebut salah menempatkan angka yang sama (`979c7932`) untuk dua hubungan berbeda, dan memiliki baris ambigu (`Actual parent verified before edit`) tanpa label yang jelas.

3. **Apakah Batch 3.A.1.10 membuka kembali kode produksi atau tes?**
   Tidak. Ini hanya koreksi dokumentasi metadata; implementasi `67439533` dan tiga koreksi substantif 3.A.1.9 tetap diterima.

4. **Mengapa angka komit hasil 3.A.1.10 tidak disertakan dalam dokumen ini pada saat pembuatan (creation time)?**
    Karena isi dokumen akan berubah ketika angka disertakan, sehingga angka itu akan selalu salah. Angka hasil akan dilaporkan oleh eksekutor setelah komit, di luar dokumen. **Fakta repository sekarang (present-state): komit hasil 3.A.1.10 diverifikasi sebagai `e347594988af77692364d1cb3d9cbe7583337e23`.**

---

## 7. Rujukan Langsung ke Dokumen yang Dikoreksi

- `MarkDown/Batches/BATCH_3_A_1_9.md` — koreksi keturunan diterapkan; empat hubungan diberi label eksplisit (`Input fixed point`, `Parent of input fixed point`, `Resulting Batch 3.A.1.9 commit`, `Parent of resulting commit`); status historis diperbarui menjadi `DOCUMENTATION METADATA AUDIT FAILED; SUPERSEDED BY 3.A.1.10` dengan penegasan bahwa hanya metadata yang gagal.
- `MarkDown/Batches/BATCH_3_A_1_9_DBS.md` — status historis diperbarui dengan penjelasan bahwa hanya metadata keturunan yang gagal; tiga koreksi substantif dan implementasi `67439533` tetap diterima.
- `MarkDown/Batches/BATCH_3_A_1_10.md` — dokumen audit baru (DBB) dengan rantai verifikasi, matriks koreksi, dan status historis `DOCUMENTATION RETROSPECTIVE HASH AUDIT FAILED; SUPERSEDED BY 3.A.1.11`; pada saat pembuatan status asli `READY FOR EXTERNAL RE-AUDIT`, audit eksternal kemudian gagal.

---

## 8. Kontradiksi Temporal yang Diperbaiki oleh Batch 3.A.1.11

Setelah 3.A.1.10 memperbaiki keturunan, masih tersisa satu masalah bahasa dalam `BATCH_3_A_1_9.md`: dokumen memuat hash `6c3f38c` (fakta sekarang), tetapi menyatakan bahwa hash "tidak disertakan" (klaim saat ini). Ini kontradiksi temporal — pernyataan yang benar pada saat pembuatan commit menjadi salah ketika dibaca sebagai fakta saat ini.

Batch 3.A.1.11 menyelesaikannya dengan menambahkan kualifikasi waktu:
- **Pada saat pembuatan commit 3.A.1.9** (`original creation time`): hash belum dapat disertakan, karena commit belum tercipta.
- **Pada fakta repository sekarang** (`present-state`): hash `6c3f38c` sudah diverifikasi oleh `git rev-parse` dan dimasukkan secara retrospektif oleh Batch 3.A.1.10 sebagai descendant.

Ini berarti kalimat lama "intentionally not embedded" tidak dihapus, tetapi diberi konteks waktu: ia berlaku pada `creation time`, bukan pada `present-state`.

---

## 9. Status

Batch 3.A.1.9 (historis): **DOCUMENTATION METADATA AUDIT FAILED; SUPERSEDED BY 3.A.1.10** — hanya metadata keturunan dalam DBB 3.A.1.9 yang gagal audit; tiga koreksi dokumentasi substantif tetap diterima; implementasi Corporate Intake (`67439533`) tetap diterima; tidak ada kode produksi atau tes yang dibuka kembali.

Batch 3.A.1.10: **DOCUMENTATION RETROSPECTIVE HASH AUDIT FAILED; SUPERSEDED BY 3.A.1.11** (tidak pernah dinyatakan PASS oleh dokumen ini sendiri) — koreksi keturunan 3.A.1.10 tetap diterima.
- **Status asal eksekutor pada saat pembuatan (original executor status at creation time):** `READY FOR EXTERNAL RE-AUDIT`.
- **Audit eksternal kemudian gagal** karena kontradiksi temporal tetap tersisa di `BATCH_3_A_1_9.md`.
- **Status historis akhir (final historical status):** `DOCUMENTATION RETROSPECTIVE HASH AUDIT FAILED; SUPERSEDED BY 3.A.1.11`.
- Batch 3.A.1.11 merekonsiliasi kontradiksi temporal dengan menambahkan kualifikasi temporal (`pada saat pembuatan commit` vs `fakta repository sekarang`) tanpa menghapus hash `6c3f38c` yang sudah diverifikasi.
- Batch 3.A.1.12 menyelesaikan rekonsiliasi dokumentasi residual setelah 3.A.1.11 juga gagal audit kelengkapan.
