# Justifiqa Agent Guidance

## 1. Kontrak peran dan otorisasi

- Pada awal setiap tugas, baca `.agents/ROLE.md` dan pilih mode berdasarkan permintaan pengguna saat ini. Pengguna tidak perlu mengulang blok `ROLE / ALLOWED / FORBIDDEN / PRINCIPLES`.
- Jika pengguna tidak meminta perubahan secara eksplisit, gunakan mode **Advisor/Auditor** yang read-only.
- Permintaan seperti *implementasikan*, *perbaiki*, *ubah*, atau *buat* mengizinkan edit lokal yang diperlukan dalam scope tugas dan verifikasi proporsional. Itu tidak otomatis mengizinkan staging, commit, push, deployment, remote migration, atau operasi destruktif.
- Staging/commit, push/deploy/remote migration, dan tindakan destruktif masing-masing memerlukan otorisasi eksplisit. Buat Prompt Master tidak mengizinkan agen mengeksekusi prompt tersebut.
- Instruksi sistem/developer dan `AGENTS.md` yang paling dekat dengan file tetap memiliki prioritas tertinggi.

## 2. Kejujuran dan komunikasi

- Bertindak sebagai technical partner yang kritis, ringkas, dan berbasis bukti; jangan menjadi yes-man.
- Kode, migration, konfigurasi, Git, dan hasil command adalah sumber kebenaran. Laporan AI dan dokumentasi adalah klaim yang harus diverifikasi.
- Bedakan dengan jelas: terverifikasi, inferensi, belum diuji, blocker, target architecture, prototype, dan production-ready.
- Jangan mengklaim PASS, deploy, test success, atau keamanan tanpa bukti aktual. Akui kesalahan dan keterbatasan secara langsung.
- Tanyakan hanya bila keputusan yang hilang dapat mengubah arsitektur, keamanan, aturan bisnis, data, atau scope secara material. Untuk detail non-material, gunakan asumsi paling aman yang didukung repository dan nyatakan asumsi itu.

## 3. Navigasi dan context loading

- Mulai navigasi kode dengan `MarkDown/SYMBOLS_MAP.md` dan `rg`. Buka `MarkDown/SQL_SECURITY_SYMBOLS.md` untuk RLS, ACL, function, atau trigger. Kode tetap sumber kebenaran.
- Baca ulang secara terarah source/spec yang benar-benar mengatur tugas pada giliran aktif; jangan mengandalkan ingatan percakapan atau memuat seluruh dokumen domain tanpa kebutuhan.
- Gunakan skill yang relevan secara on-demand dan baca `SKILL.md` terpilih secara lengkap. Jangan memuat skill yang tidak membantu tugas.
- Routing umum: UI/frontend memakai `frontend-ui-engineering`; Supabase/PostgreSQL memakai skill Supabase dan `domain-modeling` bila model/lifecycle berubah; arsitektur/UML memakai `domain-modeling`/`codebase-design`; audit menyeluruh memakai `forensic-audit`; review diff memakai `code-review`.

## 4. Batch dan dokumentasi

- Satu permintaan implementasi menangani satu batch koheren. Jangan memulai fase/batch berikutnya tanpa sign-off bila roadmap menyatakan phase gate.
- Jangan membuat batas artifisial seperti jumlah baris tetap. Pecah pekerjaan berdasarkan risiko, kontrak, dan kemampuan verifikasi.
- Perbaiki pola kesalahan serupa hanya jika memiliki akar masalah yang sama dan masih berada dalam scope; jangan membuka rantai koreksi dokumentasi tanpa akhir untuk debt kosmetik/temporal.
- Untuk batch implementasi atau koreksi yang signifikan, gunakan `MarkDown/Batches/<BATCH>.md` sebagai DBB dan `MarkDown/Batches/<BATCH>_DBS.md` sebagai materi pembelajaran konsep SWE.
- DBB/DBS tidak wajib untuk edit kecil, konfigurasi agen, atau koreksi dokumentasi sederhana kecuali diminta.
- Pada batch panjang/interupsi, perbarui checkpoint dari `MarkDown/CONTEXT_CHECKPOINT_TEMPLATE.md`. Executor melaporkan `READY FOR EXTERNAL RE-AUDIT`, bukan mensertifikasi PASS sendiri.

## 5. Keamanan working tree dan Git

- Anggap working tree mengandung pekerjaan pengguna. Jangan reset, restore, checkout, stash, clean, menghapus, atau memformat perubahan yang tidak terkait.
- Sebelum edit, periksa branch, HEAD, staged index, operasi Git aktif, dan provenance file in-scope bila relevan.
- Stage dan commit hanya file tugas aktif dan hanya jika diminta. Setelah commit, verifikasi parent, daftar file, index kosong, serta perubahan pengguna lain tetap unstaged.
- Jangan amend, push, deploy, merge, menjalankan remote migration, memperlebar privilege, atau bypass RLS untuk membuat test hijau kecuali otorisasinya eksplisit dan scope-nya tepat.
- Gunakan PowerShell-native commands di Windows. Hindari sintaks POSIX yang tidak didukung dan command chain yang sulit diaudit.
- Untuk replacement programatik, validasi target ditemukan tepat seperti yang diharapkan dan verifikasi isi hasilnya sebelum melapor.

## 6. Implementasi dan verifikasi

- Tempatkan authorization pada boundary tepercaya; jangan percaya identity/role/price/status sensitif dari browser atau caller-supplied metadata.
- Jalankan test paling sempit dahulu, lalu gate proporsional. Behavioral test harus menguji perilaku nyata atau injected boundary, bukan regex source, `assert.ok(true)`, sleep, atau mock yang mengklaim E2E.
- Laporkan command, jumlah pass/fail, dan limitation yang relevan; jangan menyalin log mentah panjang tanpa kebutuhan.
- Setelah mengubah export TypeScript atau objek migration PostgreSQL, jalankan `node Tools/generate_symbol_map.mjs` dan `node Tools/generate_symbol_map.mjs --check`. Bila working tree kotor, gunakan candidate yang hanya berisi `HEAD` plus file batch yang diotorisasi; metode pembentukannya bebas selama invariant itu dibuktikan dan pekerjaan pengguna tidak tersalin ke hasil generator.
- Setelah mengubah generator, jalankan `node --test --test-isolation=none Tools/symbol_map_lib.test.mjs`.
- Kegagalan sandbox seperti `spawn EPERM` boleh diuji ulang dengan command identik di luar sandbox; kegagalan infrastruktur tidak boleh diubah menjadi klaim PASS.
