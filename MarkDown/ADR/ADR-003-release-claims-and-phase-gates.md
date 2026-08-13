# ADR-003: Release Claims and Phase Gates

- Status: `ACCEPTED`
- Date: 2026-08-13

## Context

Phase 2, Corporate Intake, dan Corporate Escrow memiliki bukti lokal yang kuat, tetapi provider eksternal, deployment production, observability, dan full end-to-end operations belum lengkap. Tanpa vocabulary yang tegas, kelulusan test lokal mudah disalahartikan sebagai production readiness.

## Decision

- Gunakan `ACCEPTED_LOCAL` hanya untuk scope dan boundary yang benar-benar diuji.
- `READY_FOR_EXTERNAL_REAUDIT` adalah status executor, bukan kelulusan.
- `FUTURE_WORK`, `BLOCKED`, `PARTIAL/TARGET`, dan `OUT_OF_SCOPE` harus terlihat eksplisit dalam demo serta laporan.
- Production go-live memerlukan batch dan approval terpisah setelah deployment, provider integration, observability, security/operational review, dan rollback readiness terbukti.
- Fase berikutnya tidak otomatis dimulai hanya karena fase lokal sebelumnya diterima.

## Consequences

- Presentasi dapat menunjukkan kemajuan nyata tanpa overclaim.
- Fitur 3.C/3.D dapat divisualisasikan sebagai target/prototype, tetapi tidak boleh memberikan fake success atau narasi backend selesai.
- Laporan Tugas Akhir harus memisahkan as-built, target architecture, limitation, dan future work.

## Alternatives considered

- **Satu label `DONE`:** ditolak karena menyembunyikan perbedaan local proof dan production boundary.
- **Menunggu semua fase sebelum demo:** ditolak karena demo akademik dapat menggunakan scope freeze yang jujur.

## Evidence

- `MarkDown/PHASE_2_BACKEND_FORENSIC_CERTIFICATION.md`.
- `MarkDown/Batches/BATCH_3_B_1.md`.
- `MarkDown/TRACEABILITY_MATRIX.md`.
