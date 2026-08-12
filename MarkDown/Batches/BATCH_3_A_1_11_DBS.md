# Batch 3.A.1.11 DBS — Perbedaan "Fakta Saat Kejadian" dan "Fakta Repository Sekarang"

Dokumen ini menjelaskan secara sederhana (DBS) mengapa Batch 3.A.1.11 diperlukan, apa yang diperbaiki, dan bagaimana pembaca dapat memahaminya — tanpa memerlukan pengetahuan teknis mendalam. **Dokumen ini adalah `BATCH_3_A_1_11_DBS.md` (dokumen DBB pendamping `BATCH_3_A_1_11.md`), bukan `BATCH_3_A_1_11.md` itu sendiri.**

---

## 1. Perbedaan "Fakta Saat Kejadian" dan "Fakta Repository Sekarang"

Ketika kita membaca dokumen lama (misalnya `BATCH_3_A_1_9.md`), kita sering lupa bahwa dokumen itu ditulis pada satu waktu tertentu. Ada dua fakta yang berbeda:

- **Fakta saat kejadian (`original creation time`)**: apa yang benar ketika dokumen pertama kali dikomit. Pada saat itu, commit 3.A.1.9 belum tercipta, sehingga hash `6c3f38c` belum bisa diketahui.
- **Fakta repository sekarang (`present-state`)**: apa yang benar saat ini, setelah commit 3.A.1.9 (dan 3.A.1.10) sudah terbentuk. Sekarang kita bisa memverifikasi `6c3f38c` dengan `git rev-parse`, dan Batch 3.A.1.10 memasukkan angka itu ke dokumen secara retrospektif.

Jika kita tidak membedakan dua fakta ini, dokumen akan terlihat bertentangan: satu bagian menyatakan hash "tidak disertakan", bagian lain menunjukkan angka `6c3f38c`. Keduanya benar, tetapi berlaku untuk waktu yang berbeda.

---

## 2. Mengapa Commit Tidak Bisa Mengetahui Hash Dirinya Sendiri

Setiap kali isi file berubah, hash SHA commit ikut berubah. Artinya, **tidak mungkin** sebuah dokumen yang berada di dalam commit mencantumkan hash final commit itu sendiri saat commit dibuat — karena begitu angka dicantumkan, dokumen berubah, dan angka itu akan salah.

Contoh praktis:
- Jika `BATCH_3_A_1_9.md` menulis `6c3f38c` saat commit 3.A.1.9 dibuat (sebelum commit terbentuk), angka itu akan selalu salah.
- Oleh karena itu, dokumen 3.A.1.9 pada `creation time` tidak bisa memuat `6c3f38c`.
- Namun, setelah commit `6c3f38c` terbentuk, descendant (Batch 3.A.1.10 dan 3.A.1.11) boleh memperbarui dokumen historis untuk mencatat angka yang sudah diverifikasi.

---

## 3. Bagaimana Descendant Commit Bisa Memperkaya Dokumen Ancestor

Sebuah commit baru (`descendant`) boleh mengubah file dari commit lama (`ancestor`) untuk menambahkan fakta baru yang belum tersedia saat ancestor dibuat. Ini bukan "menipu" sejarah — ini adalah audit retrospektif yang sah.

Contoh timeline:

- **T1 (creation time 3.A.1.9)**: dokumen `BATCH_3_A_1_9.md` dibuat. Hash `6c3f38c` belum tersedia. Dokumen menyatakan hash "tidak disertakan" — ini benar untuk T1.
- **T2 (commit `6c3f38c` terbentuk)**: Git membuat commit baru; hash diverifikasi.
- **T3 (Batch 3.A.1.10)**: descendant memperbarui dokumen `BATCH_3_A_1_9.md` secara retrospektif, memasukkan `6c3f38c` sebagai catatan historis.
- **Akibatnya**: jika dokumen masih menyatakan "hash tidak disertakan" tanpa kualifikasi waktu, pembaca akan melihat kontradiksi — karena angka `6c3f38c` sudah ada di dokumen sekarang.

Batch 3.A.1.11 menyelesaikan ini dengan menambahkan kualifikasi waktu: pernyataan "tidak disertakan" berlaku pada T1 (`creation time`), bukan pada T3 (`present-state`).

---

## 4. Pentingnya Kualifikasi Temporal Seperti "Pada Saat Commit Dibuat"

Tanpa kualifikasi waktu, kalimat dalam dokumen audit bisa disalahartikan. Contoh:

- **Tanpa kualifikasi (berbahaya)**: "Hash final 3.A.1.9 tidak disertakan."
  - Ini salah jika dibaca saat ini, karena `6c3f38c` sudah ada di dokumen.
- **Dengan kualifikasi (benar)**: "Pada saat commit 3.A.1.9 dibuat, hash final belum dapat disertakan. Fakta repository sekarang menunjukkan hash `6c3f38c` telah diverifikasi dan dimasukkan secara retrospektif oleh Batch 3.A.1.10."
  - Ini benar untuk kedua waktu.

Kualifikasi temporal yang wajib digunakan:
- `pada saat pembuatan commit` (`original creation time`)
- `fakta repository sekarang` (`present-state`)
- `pada waktu audit eksternal 3.A.1.10` (jika merujuk ke audit sebelumnya)

---

## 5. Checklist Singkat

Sebelum menyatakan batch "siap untuk audit eksternal", tanyakan:

- [ ] Apakah dokumen membedakan `creation-time` dari `present-state`?
- [ ] Apakah setiap klaim tentang hash memiliki kualifikasi waktu?
- [ ] Apakah hash `6c3f38c` tetap ada (tidak dihapus) dengan penjelasan retrospektif yang jelas?
- [ ] Apakah dokumen menyatakan bahwa implementasi `67439533` tetap diterima?
- [ ] Apakah tidak ada klaim bahwa `6c3f38c` sudah diketahui sebelum commit terbentuk?
- [ ] Apakah semua lima file dalam allowlist diverifikasi sebagai UTF-8 tanpa BOM dan tanpa spasi belakang berlebih?

---

## 6. Mini-Kuis dan Jawaban

**1. Apa bedanya "fakta saat kejadian" dengan "fakta repository sekarang"?**
- Fakta saat kejadian (`creation-time`) adalah apa yang benar ketika commit pertama kali dibuat. Fakta repository sekarang (`present-state`) adalah apa yang benar saat ini, setelah commit sudah terbentuk dan bisa diverifikasi.

**2. Mengapa dokumen 3.A.1.9 tidak bisa memuat `6c3f38c` saat commit dibuat?**
- Karena isi dokumen akan berubah ketika angka dicantumkan, sehingga angka itu akan selalu salah. Hash hanya bisa diverifikasi setelah commit terbentuk.

**3. Bagaimana descendant (Batch 3.A.1.10) boleh memasukkan `6c3f38c` ke dokumen 3.A.1.9?**
- Descendant boleh memperbarui dokumen historis (`ancestor`) untuk mencatat fakta baru yang belum tersedia saat ancestor dibuat. Ini adalah audit retrospektif yang sah.

**4. Mengapa Batch 3.A.1.11 diperlukan jika 3.A.1.10 sudah memperbaiki keturunan?**
- Karena **sebelum koreksi 3.A.1.11** (`before the 3.A.1.11 correction`), `BATCH_3_A_1_9.md` masih menyisakan kontradiksi temporal: dokumen memuat `6c3f38c` (fakta sekarang) tetapi menyatakan hash "tidak disertakan" (klaim saat ini tanpa kualifikasi). 3.A.1.11 merekonsiliasi ini dengan menambahkan kualifikasi waktu.

---

## 7. Sitasi Langsung ke Dokumen yang Dikoreksi

- `MarkDown/Batches/BATCH_3_A_1_9.md` — baris hash (line 7) tetap memuat `6c3f38c...`; baris 12 dan bagian keterbatasan (limitations) sekarang memakai kualifikasi temporal (`pada saat pembuatan commit` vs `fakta repository sekarang`).
- `MarkDown/Batches/BATCH_3_A_1_10.md` — status historis diperbarui menjadi `DOCUMENTATION RETROSPECTIVE HASH AUDIT FAILED; SUPERSEDED BY 3.A.1.11`; penjelasan tentang kontradiksi temporal ditambahkan.
- `MarkDown/Batches/BATCH_3_A_1_11.md` — **dokumen DBB (bukan dokumen ini)** mencatat fixed point `e347594...`, parent `6c3f38c...`, serta penjelasan lengkap tentang temporal qualifier dan dua-fakta (`creation-time` vs `present-state`).

---

## 8. Status

Batch 3.A.1.11: **DOCUMENTATION COMPLETENESS AUDIT FAILED; SUPERSEDED BY 3.A.1.12** (tidak pernah dinyatakan PASS oleh dokumen `BATCH_3_A_1_11.md` sendiri). Kontradiksi temporal dalam `BATCH_3_A_1_9.md` telah direkonsiliasi; hash `6c3f38c` dipertahankan dengan kualifikasi waktu yang tepat; koreksi keturunan 3.A.1.10 tetap diterima; implementasi Corporate Intake (`67439533`) tetap diterima; tidak ada kode produksi atau tes yang dibuka kembali. **Konsep temporal yang diajarkan DBS ini tetap valid; kegagalan adalah aplikasi tidak lengkap dan self-audit tidak akurat, bukan konsep itu sendiri.**
