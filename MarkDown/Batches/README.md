# Batch Documentation Standard

Standar ini berlaku untuk batch baru. File flat `BATCH_*.md` dan `BATCH_*_DBS.md` yang sudah ada adalah arsip kompatibel dan tidak perlu dipindahkan.

## Struktur wajib

```text
MarkDown/Batches/<BATCH_ID>/
|-- BATCH.md
|-- PROMPT_MASTER.md
`-- LEARNING.md
```

- `BATCH.md` (**DBB**) mencatat objective, fixed point, scope, checkpoints, perubahan, evidence, limitation, status, dan next exact action.
- `PROMPT_MASTER.md` menyimpan prompt eksekusi yang benar-benar digunakan. Jangan memperbaiki atau merekonstruksi prompt historis lalu menyebutnya verbatim.
- `LEARNING.md` (**DBS**) menjelaskan konsep SWE yang dipakai dalam bahasa Indonesia yang dapat dipelajari pemilik proyek, dengan sitasi langsung ke source terkait.

File opsional:

- `CHECKPOINT.md` untuk recovery batch panjang;
- `EVIDENCE.md` bila bukti terlalu besar untuk DBB;
- `assets/` untuk diagram atau gambar khusus batch.

## Lifecycle

```text
DRAFT -> IN_PROGRESS -> READY_FOR_EXTERNAL_REAUDIT
                              |-> ACCEPTED_LOCAL
                              |-> BLOCKED
                              `-> SUPERSEDED
```

Executor hanya boleh menutup dengan `READY_FOR_EXTERNAL_REAUDIT`. Advisor/controller yang melakukan audit fisik menetapkan acceptance. `ACCEPTED_LOCAL` tidak berarti production go-live.

## Required invariants

1. `BATCH.md` menyebut input fixed point, bukan meramal hash commit yang belum terbentuk.
2. `PROMPT_MASTER.md` memakai `NOT_RECORDED_VERBATIM` bila prompt sebenarnya tidak tersedia.
3. Hasil test harus menyebut command dan pass/fail faktual; klaim E2E harus menjelaskan boundary yang benar-benar dilewati.
4. DBB/DBS tidak boleh memuat secret, token, raw PII, atau resep Git berbahaya.
5. Riwayat tidak dihapus. Supersession dicatat di `BATCH_INDEX.md` alih-alih membuka rantai koreksi kosmetik.
6. `CURRENT_STATE.md` hanya diperbarui untuk perubahan status atau next action yang material.
7. Stage/commit tetap memerlukan otorisasi eksplisit dan hanya mencakup file batch aktif.

## Naming

- Gunakan ID roadmap kanonik dengan titik, misalnya `3.C` dan `3.D`; untuk nama folder gunakan normalisasi filesystem `3C` dan `3D`. Nama operasional non-roadmap seperti `PRESENTATION_READINESS` tetap diperbolehkan.
- Satu folder mewakili satu batch koheren. Koreksi substantif dapat memakai suffix `.1`; debt kosmetik masuk backlog, bukan batch baru.

## Legacy compatibility

Daftar lengkap arsip flat ada di `../BATCH_INDEX.md`. Tautan lama tidak diubah. Bila status historis ambigu, gunakan urutan bukti berikut:

1. source/migration/config;
2. Git commit dan diff;
3. hasil verifikasi aktual;
4. `CURRENT_STATE.md` dan `BATCH_INDEX.md`;
5. narasi DBB/DBS historis.
