# ADR-001: Documentation Control Plane

- Status: `ACCEPTED`
- Date: 2026-08-13

## Context

Dokumentasi batch sebelumnya tersedia, tetapi tersebar sebagai file flat tanpa current-state pointer, indeks supersession, paket Prompt Master, atau ADR aktif. Akibatnya, agen baru harus merekonstruksi konteks dari chat panjang dan Git history. Rantai koreksi 3.A.1.8 sampai 3.A.1.12 menunjukkan biaya nyata dari status historis yang tidak memiliki pointer kanonik.

## Decision

1. `CURRENT_STATE.md` menjadi snapshot status dan next action kanonik.
2. `BATCH_INDEX.md` menjadi indeks status, commit, dan supersession.
3. Batch baru menggunakan paket folder `BATCH.md`, `PROMPT_MASTER.md`, dan `LEARNING.md`.
4. ADR menyimpan keputusan lintas batch.
5. Arsip flat lama tetap di tempatnya dan ditautkan dari indeks.
6. Prompt yang tidak tersimpan ditandai `NOT_RECORDED_VERBATIM`; tidak direkonstruksi seolah salinan asli.

## Consequences

- Handoff AI baru dapat dimulai dari dua dokumen kanonik lalu membuka evidence terarah.
- Status historis tidak perlu ditulis ulang berulang kali.
- Setiap batch baru menanggung biaya dokumentasi kecil tetapi predictable.
- Dokumen kanonik tetap bukan pengganti source, Git, atau test.

## Alternatives considered

- **Memindahkan seluruh arsip ke folder baru:** ditolak karena churn besar, risiko link rusak, dan provenance lebih sulit diaudit.
- **Mengandalkan Git/chat saja:** ditolak karena onboarding mahal dan chat tidak selalu tersedia pada sesi baru.
- **Satu decision log besar:** ditolak sebagai sumber aktif tunggal karena keputusan sulit disupersede dan domain lama bercampur.

## Evidence

- `MarkDown/Batches/BATCH_3_A_1_8.md` sampai `BATCH_3_A_1_12.md`.
- `MarkDown/decision_log.md`.
- `MarkDown/Batches/README.md`.
