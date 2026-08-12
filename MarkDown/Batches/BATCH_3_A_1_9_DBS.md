# Batch 3.A.1.9 DBS — Menutup Audit Rekonsiliasi Dokumentasi Corporate Intake

Dokumen ini menjelaskan secara sederhana (DBS) mengapa Batch 3.A.1.9 diperlukan, apa yang diperbaiki, dan bagaimana pembaca dapat memverifikasinya sendiri — tanpa memerlukan pengetahuan teknis mendalam.

---

## 1. Perbedaan antara Penjelasan Historis dan Instruksi yang Bisa Dieksekusi

Dokumen sejarah bisa menjelaskan apa yang pernah terjadi, tapi tidak boleh menyarankan perintah yang bisa disalin-tempel untuk mengulangi proses tersebut — apalagi jika proses itu sudah selesai dan worktree sekarang berbeda.

**Contoh dari 3.A.1.8 DBS (yang sudah dihapus):**
Versi sebelumnya memuat blok berkas yang menyarankan penambahan (`staging`) historis — termasuk menyebutkan `corporateEvidenceService.ts` — yang jika disalin dan dijalankan bisa mengotori commit lain. Blok tersebut sudah dihapus sepenuhnya; tidak ada instruksi eksekusi yang tersisa dalam dokumen.

**Apa yang dilakukan 3.A.1.9:**
Blok tersebut dihapus sepenuhnya. Sebagai gantinya, dokumen hanya menyajikan daftar keanggotaan berkas yang sebenarnya dikomit (`12c0b4e`) secara faktual, tanpa instruksi yang dapat dieksekusi. Ini adalah **penjelasan historis**, bukan **resep eksekusi**.

---

## 2. Kenapa Dokumen yang Dikomit Tidak Bisa Memuat Hash Miliknya Sendiri

Setiap kali isi sebuah file berubah, hash SHA commit ikut berubah. Artinya, **tidak mungkin** sebuah dokumen yang berada di dalam commit mencantumkan hash final commit itu sendiri — karena begitu hash dicantumkan, dokumen berubah, hash ikut berubah.

**Apa yang bisa dicatat di dalam dokumen:**
- **Fixed point** (komit induk) — stabil, tidak berubah.
- **Kontrak pesan commit** — misalnya `fix(docs): close corporate intake reconciliation audit`.

**Apa yang harus dilaporkan di luar dokumen:**
- Hash final commit itu sendiri, oleh eksekutor setelah commit, di luar file yang dikomit (misalnya di log auditor atau laporan eksekusi).

**Koreksi di 3.A.1.9:**
Dokumen `BATCH_3_A_1_8.md` dan `BATCH_3_A_1_8_DBS.md` sebelumnya menyebutkan bahwa hash final "dicatat oleh 3.A.1.8" atau "recorded by 3.A.1.8" sambil menyatakan tidak disertakan. Itu saling bertentangan. 3.A.1.9 memperbaikinya: dokumen menyatakan bahwa hasil aktual (test pass, lint pass, dst.) dicatat, sedangkan hash final sengaja **tidak disertakan** dalam dokumen terkomit dan akan dilaporkan secara eksternal.

---

## 3. Kenapa Status Retrospektif Harus Membedakan Kegagalan Implementasi dari Kegagalan Dokumentasi

Ketika audit menemukan masalah, kita harus membedakan dengan jelas:

- **Implementasi gagal** = kode produksi atau test salah; perlu perbaikan kode.
- **Dokumentasi gagal** = dokumen tidak cocok dengan kenyataan; perlu perbaikan dokumen, bukan kode.

**Kasus Corporate Intake (`67439533`):**
Audit eksternal menerima implementasi Corporate Intake sebagai teknis dapat diterima (`IMPLEMENTATION ACCEPTED`). Yang gagal adalah dokumentasi rekonsiliasi Batch 3.A.1.8. Oleh karena itu, status yang benar untuk 3.A.1.8 adalah:

`DOCUMENTATION RECONCILIATION FAILED EXTERNAL AUDIT; SUPERSEDED BY 3.A.1.9`

Ini menyatakan dengan tepat bahwa:
- Kegagalan hanya pada dokumentasi, bukan pada implementasi.
- Implementasi `67439533` tetap diterima.
- Batch 3.A.1.9 adalah pengganti dokumentasi, bukan pengganti kode.

---

## 4. Kenapa Pemeriksaan Nol-Kemunculan (`Zero-Occurrence`) Lebih Kuat daripada Melabeli sebagai "Contoh"

Membiarkan sebuah perintah berbahaya tetap ada dalam dokumen dengan label "contoh" atau "usang" masih berbahaya: pembaca bisa menyalin-tempel tanpa membaca labelnya, atau label bisa terlewat.

Pemeriksaan `zero-occurrence` — yaitu memastikan string literal tertentu benar-benar **tidak ada sama sekali** dalam dokumen — jauh lebih kuat. Ini berarti:
- Tidak ada blok berkas yang bisa disalin.
- Tidak ada referensi tersisa yang bisa disalahartikan.
- Verifikasi bisa dilakukan secara otomatis dengan pencarian string (`grep`), bukan hanya dengan membaca secara manual.

**Apa yang diverifikasi di 3.A.1.9:**
- String dua-kata perintah penambahan berkas (`staging`) historis tidak muncul sama sekali dalam lima dokumen yang diizinkan.
- Tidak ada blok berkas (` ``` `) yang berisi instruksi penambahan berkas.
- Status dan klaim hash tidak menyertakan hash final dalam dokumen.

---

## 5. Daftar Periksa dan Mini-Kuis

Sebelum menyatakan sebuah batch dokumentasi "siap untuk audit eksternal", tanyakan:

- [ ] Apakah setiap klaim tentang file yang dikomit bisa dibuktikan dengan `git show --name-only`?
- [ ] Apakah tidak ada instruksi eksekusi (`staging`, `push`, `reset`) yang bisa disalin-tempel?
- [ ] Apakah dokumen membedakan bukti **behavioral** (test menjalankan kode) dari bukti **struktural** (kode terlihat seperti itu, tapi belum diuji jalur kegagalannya)?
- [ ] Apakah status menunjukkan dengan jelas apakah kegagalan adalah pada implementasi atau pada dokumentasi?
- [ ] Apakah tidak ada klaim tentang hash final yang disertakan di dalam dokumen yang dikomit?
- [ ] Apakah pemeriksaan `zero-occurrence` sudah dilakukan untuk string berbahaya?
- [ ] Apakah semua lima file dalam allowlist sudah diverifikasi sebagai UTF-8 tanpa BOM, tanpa spasi belakang berlebih, dan tanpa karakter aksidental?

**Mini-kuis:**

1. **Mengapa perintah penambahan berkas (`staging`) historis tidak boleh ada di dokumen audit?**
   Karena itu adalah instruksi eksekusi, bukan penjelasan historis. Jika ada, pembaca bisa menjalankannya secara tidak sengaja dan mengotori commit.

2. **Mengapa dokumen tidak boleh memuat hash final commit-nya sendiri?**
   Karena perubahan isi dokumen akan mengubah hash, sehingga hash yang dicantumkan akan selalu salah.

3. **Apa bedanya `FAILED EXTERNAL AUDIT` untuk dokumentasi vs untuk implementasi?**
   Dokumentasi gagal berarti dokumen tidak cocok dengan kenyataan; implementasi tetap valid. Implementasi gagal berarti kode atau test harus diperbaiki.

4. **Mengapa `zero-occurrence` lebih baik daripada "contoh tidak aman"?**
   Label bisa terlewat; string yang benar-benar tidak ada sama sekali tidak bisa disalin secara tidak sengaja.

---

## 6. Rujukan Langsung ke Tiga Dokumen yang Dikoreksi

- `MarkDown/Batches/BATCH_3_A_1_6_DBS.md` — koreksi arah (`di bawah`) dihapus; penjelasan retrospektif tentang resep penambahan berkas historis ditulis ulang tanpa instruksi eksekusi; referensi perintah penambahan berkas (`staging`) dihapus sepenuhnya.
- `MarkDown/Batches/BATCH_3_A_1_8.md` — status rekonsiliasi diperbarui menjadi `DOCUMENTATION RECONCILIATION FAILED EXTERNAL AUDIT; SUPERSEDED BY 3.A.1.9`; klaim hash yang saling bertentangan dikoreksi; verifikasi blok perintah eksekusi dihapus.
- `MarkDown/Batches/BATCH_3_A_1_8_DBS.md` — blok eksekusi (`staging` historis yang menyebutkan `corporateEvidenceService.ts`) dihapus sepenuhnya; penjelasan historis diganti dengan daftar keanggotaan berkas faktual; klaim "hash dicatat oleh 3.A.1.8" dikoreksi; status rekonsiliasi diperbarui.

---

## 7. Status

Batch 3.A.1.9: **DOCUMENTATION METADATA AUDIT FAILED; SUPERSEDED BY 3.A.1.10** — hanya metadata keturunan (hubungan hash) dalam DBB 3.A.1.9 yang gagal audit; tiga koreksi dokumentasi substantif tetap diterima; implementasi Corporate Intake (`67439533`) tetap diterima; tidak ada kode produksi atau tes yang dibuka kembali.
Batch 3.A.1.8 (historis): **DOCUMENTATION RECONCILIATION FAILED EXTERNAL AUDIT; SUPERSEDED BY 3.A.1.9** — implementasi Corporate Intake (`67439533`) tetap diterima.
