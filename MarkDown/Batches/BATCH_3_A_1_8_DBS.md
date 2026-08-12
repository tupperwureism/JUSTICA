# Batch 3.A.1.8 DBS — Dokumentasi sebagai Kontrak yang Dapat Diaudit

Dokumen ini adalah penjelasan sederhana (DBS) untuk Batch 3.A.1.8. Bahasa sehari-hari; tujuannya agar pembaca non-teknis paham mengapa dokumen perlu direkonsiliasi dan kenapa kita membatasi perbaikan pada Markdown saja.

---

## 1. Dokumentasi adalah Kontrak

Setiap file Markdown di repositori adalah bagian dari **kontrak yang dapat diaudit**. Kalau dokumen mengatakan "X file dikomit", audit bisa membuka Git dan membuktikan atau membantah klaim itu. Kalau dokumen mengatakan "helper menggunakan try/finally", audit bisa membuka kode dan melihat strukturnya.

Batch 3.A.1.8 menutupi fakta bahwa kontrak itu sebelumnya **tidak cocok** dengan kenyataan di beberapa tempat. Audit kemudian menemukan:

- Resep staging di 3.A.1.6 DBS menyebut file yang sebenarnya **tidak pernah dikomit**.
- Penjelasan akar generator di dokumen **tidak cocok** dengan kode `Tools/symbol_map_lib.mjs`.
- Checkpoint matrix di 3.A.1.7 masih memuat placeholder "Pending", padahal proses sudah selesai.
- Dokumen 3.A.1.7 DBS memuat karakter aksidental dan klaim yang keliru tentang mode Vite serta bukti test.

Kita tidak boleh memperbaiki kebenaran dengan **memaksakan implementasi cocok ke dokumen** — itu membuka jalan untuk kompromi kode. Yang benar adalah **memperbaiki dokumen** agar cocok dengan implementasi dan kenyataan.

---

## 2. Mengapa State Checkpoint yang Kadaluarsa Itu Berbahaya

Checkpoint matrix adalah laporan status saat itu. Kalau checkpoint masih tertulis "Pending" atau "Required gates recorded below" padahal proses sudah selesai, pembaca akan:

- Mengira batch **belum** selesai, padahal sudah selesai.
- Tidak tahu hasil verifikasi aktual, padahal verifikasi sudah dijalankan.
- Bisa salah memutuskan langkah berikutnya berdasarkan informasi yang kadaluarsa.

Di sinilah audit eksternal menemukan masalah: checkpoint matrix di 3.A.1.7 tidak mencerminkan kenyataan. Batch 3.A.1.8 mencatat hasil aktual (test pass, typecheck pass, lint pass, dst.) dalam dokumen terkomit; hash final 3.A.1.8 sengaja **tidak disertakan** dalam dokumen yang dikomit, dan dilaporkan oleh eksekutor secara eksternal setelah commit.

Pelajarannya: **status placeholder harus selalu diganti dengan hasil aktual sebelum commit**, atau ditandai secara eksplisit sebagai "akan diisi setelahnya oleh batch berikutnya". Tidak boleh ada placeholder menggantung di dokumen final.

---

## 3. Mengapa Perintah Staging Historis Tidak Aman di Worktree Kotor

Dokumen 3.A.1.6 DBS sebelumnya mencantumkan sebuah resep bash yang menyarankan penambahan berkas (`staging`) historis — termasuk menyebut `corporateEvidenceService.ts` — yang jika disalin dan dijalankan bisa mengotori commit lain. Resep tersebut sudah dihapus; sebagai gantinya, dokumen ini hanya menyajikan daftar keanggotaan berkas yang sebenarnya dikomit (`12c0b4e`) secara faktual, tanpa instruksi yang bisa dieksekusi.

---

## 4. Akar Generator Peta Simbol — Fakta dari Kode

`Tools/symbol_map_lib.mjs` (baris 329–346) mendefinisikan `collectMapData(workspaceRoot)` yang hanya menelusuri tiga akar tetap:

1. `justifiqa-frontend/src` — berkas TypeScript/TSX.
2. `database/migrations` — berkas SQL, hanya bila path itu ada.
3. `supabase/migrations` — berkas SQL.

Itu saja. Direktori seperti `.agents/ponytail/`, `.continue/`, mockup, diagram, atau artefak build **tidak pernah disentuh** oleh generator. Klaim versi DBS sebelumnya yang mengatakan generator memindai direktori-direktori itu adalah keliru.

Kontaminasi peta simbol hanya mungkin datang dari **berkas `.ts`/`.tsx`/`.sql` untracked atau dirty yang kebetulan hidup di salah satu dari tiga akar tetap di atas**. Prosedur clean-candidate tetap penting karena alasan itu, bukan karena generator memindai direktori lain.

**Mini-kuis:** Mengapa direktori `.agents/` tidak relevan bagi generator? Karena kode `collectMapData` hanya menelusuri tiga path tetap. Direktori lain tidak pernah disentuh; satu-satunya sumber kontaminasi adalah berkas di dalam salah satu akar itu sendiri.

---

## 5. Bukti Struktural vs Bukti Behavioral

Dua jenis bukti yang sering tertukar:

- **Bukti behavioral** = test **menjalankan kode** dan mengamati side effect. Untuk ref-isolation, buktinya adalah urutan counter `[0,0] → [1,0] → [1,1]`. Itu adalah behavioral: test **mengamati** perubahan state yang disebabkan oleh klik.
- **Bukti struktural** = inspeksi visual kode yang menunjukkan **struktur kontrol yang dimaksud**. Untuk resource safety, buktinya adalah blok `try/finally` di implementasi `withViteModule` dan nested try/finally di test. Itu adalah struktural: kode **tertulis** seperti itu, tapi tidak ada test yang **memaksa** jalur kegagalan.

Test 3.A.1.7:

- **Membuktikan secara behavioral**: transisi counter `[0,0] → [1,0] → [1,1]`.
- **Menunjukkan secara struktural**: blok `try/finally` di `withViteModule` dan nested try/finally di test.

Tes **tidak** menyuntikkan kegagalan pada `createServer`, `ssrLoadModule`, atau `server.close`. Jadi klaim "kalau renderer unmount melempar, server Vite tetap ter-close" adalah klaim **struktural** — terlihat di kode, tetapi **tidak** diverifikasi oleh test. Mengakui keterbatasan ini bukan berarti helper salah; artinya, dokumentasi tidak boleh mengklaim bukti yang lebih kuat dari yang sebenarnya diberikan.

**Mini-kuis:** Apakah "server.close() selalu dipanggil" fakta struktural atau behavioral di 3.A.1.7? Struktural — terlihat di kode, tapi tidak ada test yang membuktikan jalur kegagalannya.

---

## 6. Mengapa Commit Tidak Bisa Mencatat Hash Miliknya Sendiri

Setiap kali isi commit berubah, hash SHA commit ikut berubah. Artinya, **tidak mungkin** sebuah dokumen yang berada di dalam commit mencantumkan hash final commit itu sendiri — karena begitu hash dicantumkan, dokumen berubah, hash ikut berubah.

Yang bisa dilakukan:

- Mencantumkan **fixed point** (parent commit) di dalam dokumen — itu stabil, karena parent tidak berubah.
- Mencantumkan **kontrak pesan commit** (`fix(docs): reconcile corporate intake batch records`) di dalam dokumen.
- Mencantumkan hash final hanya di **laporan eksekusi** yang berada di luar commit (misalnya di chat/log auditor), bukan di dalam file yang dikomit.

3.A.1.8 mengikuti prinsip ini: DBB 3.A.1.8 tidak mencantumkan hash final-nya sendiri; hanya fixed point, parent, dan kontrak pesan commit. Hash final dilaporkan di laporan akhir audit.

---

## 7. Checklist Ringkas

Sebelum menganggap dokumentasi "selesai", tanyakan hal-hal berikut:

- [ ] Apakah setiap klaim tentang file yang dikomit bisa dibuktikan dengan `git show --name-only`?
- [ ] Apakah klaim tentang struktur kode bisa dibuktikan dengan membuka file kode?
- [ ] Apakah klaim tentang perilaku test bisa dibuktikan dengan menjalankan test?
- [ ] Apakah tidak ada placeholder "Pending" atau "akan diisi" di dokumen final?
- [ ] Apakah tidak ada perintah bash yang bisa disalin-ditempel untuk aksi yang sensitif (staging, push, dsb.)?
- [ ] Apakah kata-kata seperti "behaviorally tested" hanya digunakan kalau memang ada test failure-path?
- [ ] Apakah referensi ke file/kode di dokumen benar-benar menunjuk ke path yang ada?
- [ ] Apakah dokumen membedakan bukti behavioral dan bukti struktural?

---

## 8. Rujukan

- `MarkDown/Batches/BATCH_3_A_1_8.md` — DBB utama untuk batch ini (status rekonsiliasi: DOCUMENTATION RECONCILIATION FAILED EXTERNAL AUDIT; SUPERSEDED BY 3.A.1.9). Implementasi Corporate Intake commit `67439533` tetap diterima; tidak ada kode produksi atau test yang dibuka kembali.
- `MarkDown/Batches/BATCH_3_A_1_7.md` — DBB 3.A.1.7 yang direkonsiliasi (status sekarang: IMPLEMENTATION ACCEPTED; DOCUMENTATION AUDIT FAILED; SUPERSEDED BY 3.A.1.8).
- `MarkDown/Batches/BATCH_3_A_1_7_DBS.md` — DBS 3.A.1.7 yang direkonsiliasi (karakter aksidental dihapus, klaim middleware-mode dikoreksi, pembedaan behavioral/struktural ditambahkan).
- `MarkDown/Batches/BATCH_3_A_1_6_DBS.md` — DBS 3.A.1.6 yang direkonsiliasi (resep staging historis dihapus, klaim akar generator dikoreksi).
- `Tools/symbol_map_lib.mjs:329–346` — sumber faktual untuk akar generator.
- `justifiqa-frontend/test/viteSsrTestHelper.ts` — implementasi `withViteModule` dengan `try/finally` (bukti struktural).
- `justifiqa-frontend/test/beneficialOwnerEvidenceIntegration.test.ts` — test behavioral yang mengamati transisi counter.

---

## Status

Batch 3.A.1.8: **DOCUMENTATION RECONCILIATION FAILED EXTERNAL AUDIT; SUPERSEDED BY 3.A.1.9.** Corporate Intake implementasi commit `67439533` tetap diterima; tidak ada kode produksi atau test yang dibuka kembali. Batch ini (3.A.1.9) adalah koreksi dokumentasi lanjutan.

Batch 3.A.1.9: **READY FOR EXTERNAL RE-AUDIT** (never PASS).
