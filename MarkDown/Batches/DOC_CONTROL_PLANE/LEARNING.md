# Learning: Mengapa Proyek Membutuhkan Documentation Control Plane

## 1. Masalah yang diselesaikan

Bayangkan source code sebagai kota. Git adalah rekaman pembangunan kotanya. Sebelum bootstrap ini, proyek memiliki banyak laporan pekerjaan, tetapi tidak mempunyai peta bertanda **Anda berada di sini**. Agen baru terpaksa membaca banyak commit dan chat untuk mengetahui jalan mana yang masih aktif.

Control plane memberikan tiga penunjuk:

1. `CURRENT_STATE.md` -> posisi proyek sekarang;
2. `BATCH_INDEX.md` -> daftar perjalanan yang pernah dilakukan;
3. `ADR/` -> alasan mengapa rute penting dipilih.

## 2. DBB, Prompt Master, dan DBS

| Artefak | Pertanyaan yang dijawab |
|---|---|
| `BATCH.md` | Apa yang dikerjakan, diubah, diuji, dan dibatasi? |
| `PROMPT_MASTER.md` | Instruksi apa yang benar-benar diberikan kepada executor? |
| `LEARNING.md` | Konsep SWE apa yang dapat dipelajari pemilik proyek? |

Pemisahan ini mencegah satu dokumen menjadi campuran instruksi, laporan, dan tutorial yang sulit diaudit.

## 3. Mengapa arsip lama tidak dipindahkan

Memindahkan puluhan file terlihat rapi, tetapi dapat memutus link, mengaburkan history, dan menciptakan diff besar menjelang presentasi. Prinsip yang dipakai adalah **Strangler/Compatibility Layer**: struktur baru berlaku ke depan, sedangkan struktur lama tetap hidup melalui indeks.

Lihat:

- `MarkDown/BATCH_INDEX.md` untuk inventory legacy;
- `MarkDown/Batches/README.md` untuk standar baru;
- `MarkDown/ADR/ADR-001-documentation-control-plane.md` untuk alasan keputusan.

## 4. Mengapa status perlu vocabulary

`DONE` terlalu kasar. Test lokal yang lulus belum tentu berarti provider nyata, deployment, monitoring, dan rollback sudah siap. Karena itu dipakai label seperti:

- `READY_FOR_EXTERNAL_REAUDIT` -> executor selesai, auditor belum menerima;
- `ACCEPTED_LOCAL` -> diterima pada boundary lokal yang disebut;
- `FUTURE_WORK` -> target aktif tetapi belum dikerjakan;
- `OUT_OF_SCOPE` -> tidak masuk roadmap aktif;
- production approval -> keputusan terpisah.

Lihat `MarkDown/ADR/ADR-003-release-claims-and-phase-gates.md`.

## 5. Mengapa prompt yang hilang tidak direkonstruksi

Menulis ulang prompt lama dari ingatan lalu menyebutnya prompt asli adalah **false provenance**. Solusi jujur adalah `NOT_RECORDED_VERBATIM`, kemudian catat objective dan constraints sebagai ringkasan non-verbatim.

## Checklist mandiri

- [ ] Dapatkah agen baru menemukan status sekarang dalam satu file?
- [ ] Dapatkah ia melihat batch mana yang superseded tanpa membaca semuanya?
- [ ] Dapatkah ia membedakan local acceptance dari production approval?
- [ ] Apakah prompt yang tidak tersedia ditandai jujur?
- [ ] Apakah arsip lama tetap dapat ditemukan?

## Mini-kuis

1. **Bolehkah `CURRENT_STATE.md` menggantikan source code?** Tidak. Ia hanya pointer kanonik.
2. **Mengapa executor tidak boleh menulis `PASS` sendiri?** Karena acceptance membutuhkan audit independen terhadap bukti fisik.
3. **Apakah `ACCEPTED_LOCAL` berarti siap production?** Tidak.
4. **Haruskah semua DBB lama dipindahkan?** Tidak; indeks memberikan compatibility tanpa churn.
5. **Apa yang ditulis jika prompt asli hilang?** `NOT_RECORDED_VERBATIM` dan ringkasan non-verbatim.
