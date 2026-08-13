# Documentation Control Plane Bootstrap

- Status: `READY_FOR_EXTERNAL_REAUDIT`
- Date: 2026-08-13
- Input fixed point: `985cfb83b1ea6bd23a98732c50bd1f7670a2d74b`
- Scope: documentation and root agent guidance only

## Objective

Mengubah workflow DBB/DBS yang baru diterapkan sebagian menjadi control plane yang dapat dipakai sesi AI baru tanpa membaca seluruh chat atau puluhan commit.

## In scope

- current-state pointer;
- canonical batch index dan legacy inventory;
- standar paket batch baru;
- tiga ADR aktif;
- paket DBB/prompt record/learning untuk bootstrap ini;
- alignment satu aturan batch pada root `AGENTS.md`.

## Out of scope

- memindahkan atau menulis ulang DBB/DBS historis;
- mengubah source, migration, tests, generated maps, atau UI;
- memperbaiki debt kosmetik/temporal lama;
- presentation-readiness, Laporan Tugas Akhir, Batch 3.C/3.D, deploy, atau production approval.

## Discovery evidence

- Sebelum bootstrap, pada fixed point `985cfb83b1ea6bd23a98732c50bd1f7670a2d74b` dan Git history yang diperiksa, `CURRENT_STATE.md`, `BATCH_INDEX.md`, dan `ADR/` belum ada.
- `MarkDown/Batches/` sebelumnya hanya memakai file flat.
- DBS sudah diterapkan sebagai `_DBS.md`, tetapi Prompt Master per batch umumnya tidak disimpan.
- `decision_log.md` mencampur keputusan historis LifeQ/Qualifa dan bukan ADR aktif terpisah.

## Changes

1. Membuat `MarkDown/CURRENT_STATE.md`.
2. Membuat `MarkDown/BATCH_INDEX.md` dengan inventory semua DBB/DBS lama.
3. Membuat `MarkDown/Batches/README.md` sebagai standar paket ke depan.
4. Membuat ADR-001 sampai ADR-003.
5. Membuat paket dokumentasi bootstrap ini.
6. Menyelaraskan root `AGENTS.md` dengan paket baru sambil mempertahankan legacy compatibility.

## Verification contract

- seluruh path/link lokal yang disebut harus ada;
- seluruh legacy DBB/DBS harus terindeks atau tercakup dalam grouping yang eksplisit;
- status/commit utama harus cocok dengan Git;
- tidak ada klaim bahwa prompt historis direkam bila memang tidak ada;
- `git diff --check` harus bersih;
- tidak ada file produk, test, migration, map, atau WIP pengguna yang masuk scope.

## Limitations

- External controller audit belum dilakukan pada working-tree result ini.
- Status historis tetap dapat memuat wording lama; indeks menjadi pointer kanonik tanpa rewrite massal.
- Result commit bootstrap belum ada dan tidak diprediksi di dokumen ini.

## Next exact action

External physical audit terhadap control plane ini. Bila diterima, lanjut ke batch `PRESENTATION_READINESS` dan kemudian penyusunan Laporan Tugas Akhir.
