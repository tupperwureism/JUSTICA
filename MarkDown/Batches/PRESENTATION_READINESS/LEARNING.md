# Learning — Honest Presentation Boundary

## 1. Mengapa status dipisah?

Software dapat terlihat lengkap di UI walaupun boundary server atau provider belum tersedia. Karena itu halaman presentasi memakai empat status eksplisit pada presentationReadinessModel.ts:

- ACCEPTED_LOCAL: lulus untuk scope lokal yang dibuktikan;
- BLOCKED: menunggu dependency/keputusan material;
- FUTURE_WORK: masih roadmap, belum delivery;
- NOT_STARTED: belum masuk tahap implementasi.

## 2. Fail-closed presentation

Fail-closed berarti ketidakpastian tidak dinaikkan menjadi klaim berhasil. PresentationReadinessGrid.tsx hanya memberi label accepted kepada Corporate Intake dan Corporate Escrow. Notary/e-KYC tetap future work.

## 3. Presentational component vs integration

DevShowcasePage.tsx tidak memanggil Supabase atau mutation. Ia menjelaskan evidence dan mengarahkan pengguna ke portal klien untuk UI terintegrasi. Ini mencegah no-op handler terlihat seperti sukses.

## 4. Mengapa provider initiation ditulis blocked?

Settlement webhook telah diterima lokal, tetapi memulai pembayaran memerlukan provider yang belum dipilih. Keduanya adalah capability berbeda: penerimaan callback tidak otomatis berarti checkout provider tersedia.

## Mini-kuis

1. Apakah ACCEPTED_LOCAL berarti production-ready? Tidak.
2. Bolehkah UI roadmap menampilkan ceklis sukses? Tidak.
3. Di mana status presentasi diuji? justifiqa-frontend/test/presentationReadiness.test.ts.