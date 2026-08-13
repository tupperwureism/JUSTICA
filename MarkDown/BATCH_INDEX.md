# Justifiqa Batch Index

> Indeks kanonik status dan lokasi dokumentasi batch. Bila narasi historis bertentangan dengan status di sini, verifikasi source/Git lalu gunakan `CURRENT_STATE.md` dan ADR aktif sebagai control plane.

## Status vocabulary

| Status | Makna |
|---|---|
| `DRAFT` | Scope belum dikunci |
| `IN_PROGRESS` | Implementasi berlangsung |
| `READY_FOR_EXTERNAL_REAUDIT` | Executor selesai; belum diterima controller |
| `ACCEPTED_LOCAL` | Lulus untuk scope lokal yang dinyatakan; bukan production approval |
| `BLOCKED` | Tidak dapat diselesaikan tanpa keputusan/dependency material |
| `FUTURE_WORK` | Roadmap aktif tetapi tidak dikerjakan pada delivery sekarang |
| `SUPERSEDED` | Digantikan record penerus; tetap disimpan sebagai provenance |
| `OUT_OF_SCOPE` | Bukan roadmap aktif Justifiqa |

## Canonical delivery batches

| Family | Status kanonik | Implementation/result commit | Record utama | Catatan |
|---|---|---|---|---|
| Corporate Intake 3.A/3.A.1 | `ACCEPTED_LOCAL` | `67439533e079cceded8bbddba1f56a4db6388767` | [3.A.1.7 DBB](Batches/BATCH_3_A_1_7.md), [DBS](Batches/BATCH_3_A_1_7_DBS.md) | Dokumen 3.A.1.8 sampai 3.A.1.12 hanya merekonsiliasi narasi; implementasi tidak dibuka kembali |
| Corporate Intake documentation reconciliation | `ACCEPTED_LOCAL` (documentation only) | `2c7f28a86109d58acf4d1319a84ed04ca2e679bf` | [3.A.1.12 DBB](Batches/BATCH_3_A_1_12.md), [DBS](Batches/BATCH_3_A_1_12_DBS.md) | Terminal reconciliation; debt minor tidak membuka batch baru |
| Corporate Escrow 3.B | `ACCEPTED_LOCAL` | `4cddf6866c50cf410697d330bc528d0daafd99fe` | [3.B DBB](Batches/BATCH_3_B.md), [DBS](Batches/BATCH_3_B_DBS.md) | Settlement lokal; provider initiation belum dipilih |
| Corporate Escrow 3.B.1 | `ACCEPTED_LOCAL` | `59ff89dff3f49a8f169f7822c522f14163d5c707` | [3.B.1 DBB](Batches/BATCH_3_B_1.md), [DBS](Batches/BATCH_3_B_1_DBS.md) | Replay after progression + concurrency/ACL hardening; Batch 3.B dibekukan |
| Documentation control plane bootstrap | `READY_FOR_EXTERNAL_REAUDIT` | `NOT_EMBEDDED_SELF_HASH` | [BATCH](Batches/DOC_CONTROL_PLANE/BATCH.md), [Prompt record](Batches/DOC_CONTROL_PLANE/PROMPT_MASTER.md), [Learning](Batches/DOC_CONTROL_PLANE/LEARNING.md) | Result hash dilaporkan setelah commit; membuat current state, index, ADR, dan standar paket tanpa memindahkan arsip |

## Legacy flat-record inventory

Semua file berikut dipertahankan pada lokasi lama. Mereka bukan template untuk batch baru.

### Corporate Intake correction chain

| ID | DBB | DBS | Interpretasi kanonik |
|---|---|---|---|
| 3.A.1 | [DBB](Batches/BATCH_3_A_1.md) | [DBS](Batches/BATCH_3_A_1_DBS.md) | Historical; superseded by correction chain |
| 3.A.1.2 | [DBB](Batches/BATCH_3_A_1_2.md) | [DBS](Batches/BATCH_3_A_1_2_DBS.md) | Historical implementation correction |
| 3.A.1.3 | [DBB](Batches/BATCH_3_A_1_3.md) | [DBS](Batches/BATCH_3_A_1_3_DBS.md) | Superseded by later correction |
| 3.A.1.4 | [DBB](Batches/BATCH_3_A_1_4.md) | [DBS](Batches/BATCH_3_A_1_4_DBS.md) | Superseded by later correction |
| 3.A.1.5 | [DBB](Batches/BATCH_3_A_1_5.md) | [DBS](Batches/BATCH_3_A_1_5_DBS.md) | Failed external audit; superseded by 3.A.1.6 |
| 3.A.1.6 | [DBB](Batches/BATCH_3_A_1_6.md) | [DBS](Batches/BATCH_3_A_1_6_DBS.md) | Failed external audit; superseded by 3.A.1.7 |
| 3.A.1.7 | [DBB](Batches/BATCH_3_A_1_7.md) | [DBS](Batches/BATCH_3_A_1_7_DBS.md) | Technical implementation accepted at `67439533`; narrative later reconciled |
| 3.A.1.8 | [DBB](Batches/BATCH_3_A_1_8.md) | [DBS](Batches/BATCH_3_A_1_8_DBS.md) | Documentation-only; superseded by 3.A.1.9 |
| 3.A.1.9 | [DBB](Batches/BATCH_3_A_1_9.md) | [DBS](Batches/BATCH_3_A_1_9_DBS.md) | Documentation-only; superseded by 3.A.1.10 |
| 3.A.1.10 | [DBB](Batches/BATCH_3_A_1_10.md) | [DBS](Batches/BATCH_3_A_1_10_DBS.md) | Documentation-only; superseded by 3.A.1.11 |
| 3.A.1.11 | [DBB](Batches/BATCH_3_A_1_11.md) | [DBS](Batches/BATCH_3_A_1_11_DBS.md) | Documentation-only; superseded by 3.A.1.12 |
| 3.A.1.12 | [DBB](Batches/BATCH_3_A_1_12.md) | [DBS](Batches/BATCH_3_A_1_12_DBS.md) | Terminal documentation reconciliation |

### Corporate Escrow records

| ID | DBB | DBS | Interpretasi kanonik |
|---|---|---|---|
| 3.B | [DBB](Batches/BATCH_3_B.md) | [DBS](Batches/BATCH_3_B_DBS.md) | Accepted locally after 3.B.1 hardening |
| 3.B.1 | [DBB](Batches/BATCH_3_B_1.md) | [DBS](Batches/BATCH_3_B_1_DBS.md) | Accepted locally; terminal record for Batch 3.B |

## Prompt provenance

### Legacy prompt inventory

| Batch grouping | Prompt provenance |
|---|---|
| 3.A.1 through 3.A.1.12 | `NOT_RECORDED_VERBATIM` untuk paket per-batch; prompt chat tidak tersedia sebagai artefak kanonik |
| 3.B and 3.B.1 | `NOT_RECORDED_VERBATIM`; objective/constraints hanya terekam di DBB dan Git evidence |
| `PROMPT_MASTER_BATCH_3A_FINAL.md` dan prompt legacy lain di root `MarkDown/` | `UNVERIFIED_LEGACY_ARTIFACT`; jangan diatribusikan ke batch tertentu tanpa provenance Git/chat yang membuktikan |

- Prompt Master lama yang tidak pernah disimpan **tidak boleh direkonstruksi dan disebut verbatim**.
- `PROMPT_MASTER.md` pada paket baru menyimpan prompt sebenarnya. Jika tidak tersedia, tulis `NOT_RECORDED_VERBATIM` dan hanya catat objective/constraints sebagai ringkasan non-verbatim.
- File prompt legacy di root `MarkDown/` tetap arsip dan tidak otomatis menjadi prompt kanonik suatu batch.

## Maintenance

Setelah external audit, ubah status di indeks dan `CURRENT_STATE.md` dalam satu koreksi terarah. Jangan mengedit puluhan DBB historis hanya untuk menyamakan present tense; gunakan pointer supersession di indeks.
