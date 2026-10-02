# Justifiqa Current State

> Canonical project snapshot for handoff and planning. Kode, migration, Git, dan hasil test tetap sumber kebenaran. Dokumen ini tidak merupakan production go-live approval.

## Snapshot

- Tanggal pencatatan: 27 Agustus 2026 (Asia/Jakarta).
- Branch aktif: `batch-3c-notary-workspace`.
- Input fixed point Batch 3.C.5: `1de5186127cd7aad377078632174244d8d11c1df`.
- Scope produk aktif: **Justifiqa**. Qualifa adalah arsip/research `OUT_OF_SCOPE`.
- Status rilis: **local implementation/demo scope**, bukan production-ready.

## Status fase

| Fase/batch | Status kanonik | Evidence utama | Batas faktual |
|---|---|---|---|
| Phase 2 backend hardened contract | Lulus audit integrasi pada `018fb05` | `PHASE_2_BACKEND_FORENSIC_CERTIFICATION.md`, migration `supabase/` | Bukan production go-live approval |
| Batch 3.A / 3.A.1 Corporate Intake | **ACCEPTED_LOCAL** | Implementasi final yang diterima: `67439533e079cceded8bbddba1f56a4db6388767`; rekonsiliasi dokumentasi: `2c7f28a86109d58acf4d1319a84ed04ca2e679bf` | Evidence retry hanya bertahan dalam page session; provider/deployment eksternal bukan bagian acceptance |
| Batch 3.B Corporate Escrow settlement | **ACCEPTED_LOCAL** | `4cddf6866c50cf410697d330bc528d0daafd99fe` + hardening replay `59ff89dff3f49a8f169f7822c522f14163d5c707` | Provider initiation masih `BLOCKED_BY_PROVIDER_SELECTION`; bukan Edge Runtime/deployment production proof |
| Batch 3.C Notary workspace | **SUPERSEDED** | Commit `1a6c89e`, `MarkDown/Batches/3C/BATCH.md` | Failed external audit karena anomali skema dan loncatan siklus hidup perkara |
| Batch 3.C.1 Notary workspace repair | **SUPERSEDED** | Commit `3e5e4a7`, `MarkDown/Batches/3C_1/BATCH.md` | Failed external audit karena tabel audit fiktif, in-place migration edit, missing advisory locks, dan fail-open UI refresh |
| Batch 3.C.2 Notary Workspace & CDD Hardening | **SUPERSEDED** | `MarkDown/Batches/3C_2/BATCH.md` | Failed external audit karena unexecuted DB proof, false-green probe, invalid SQL runtime, dan unhardened search_path |
| Batch 3.C.3 Prove & Harden Notary Workspace | **SUPERSEDED** | `MarkDown/Batches/3C_3/BATCH.md` | Failed external audit karena direct DML privilege leak, unisolated replay proof, dan dirty-tree generator |
| Batch 3.C.4 Close Workspace Proof & Privilege Gaps | **SUPERSEDED** | Commit `1de5186127cd7aad377078632174244d8d11c1df`, `MarkDown/Batches/3C_4/BATCH.md` | Failed external audit: probe `execSync` + `Promise.all` tidak membuktikan overlap dan hook proof false-green; digantikan 3.C.5 |
| Batch 3.C.5 True Concurrency & Hook Proof | **ACCEPTED_LOCAL** | Commit `ccbb2fdfd40d89d519f1e06b6abbd3436dac9d1f`; `MarkDown/Batches/3C_5/BATCH.md`; final probe 5/5 dengan `pg_stat_activity` lock barrier; 129/129 phase-2 tests; clean-candidate symbol maps; external audit `P0=0`, `P1=0` | Diterima untuk scope lokal, bukan production approval; AHU/OSS/Stamping live tetap future work |
| Batch 3.D e-KYC/signing | **FUTURE_WORK** | Target/seam parsial pada `TRACEABILITY_MATRIX.md` | Provider liveness/storage/E2E belum lengkap; tidak boleh dipresentasikan sebagai implemented end-to-end |
| Phase 4 E2E/security/QA | **FUTURE_WORK** | Belum ada acceptance batch kanonik | Local tests sebelumnya tidak sama dengan full production E2E |
| Phase 5 production readiness | **NOT_STARTED** | Tidak ada production approval | Deploy, observability, provider readiness, operational runbook, dan go-live audit masih diperlukan |
| Documentation control plane bootstrap | **ACCEPTED_LOCAL** | Commit 82e45bb8d17ac0f66dfa51c9e98b333e27317376 | Control plane lokal diterima; bukan production approval |
| Presentation Readiness & Honest Scope Freeze | **ACCEPTED_LOCAL** | /demo/readiness dan Batches/PRESENTATION_READINESS/ | Presentation aid statis; tidak membuktikan production E2E |

## Keputusan aktif

1. `MarkDown/CURRENT_STATE.md` adalah pointer status lintas batch; detail/evidence tetap berada di DBB, Git, test, dan source.
2. `MarkDown/BATCH_INDEX.md` adalah indeks kanonik paket batch serta rantai supersession.
3. Keputusan arsitektur aktif dicatat terpisah di `MarkDown/ADR/`; `decision_log.md` diperlakukan sebagai arsip historis, bukan sumber keputusan aktif tunggal.
4. Batch baru memakai paket folder sesuai `MarkDown/Batches/README.md`. Arsip flat lama tidak dipindahkan agar provenance Git tetap mudah diaudit.
5. Status lokal/demo tidak boleh dinaikkan menjadi production-ready tanpa batch dan approval terpisah.

## Next exact action

**Siapkan Prompt Master Batch 3.D e-KYC/signing dari commit control-plane hasil acceptance 3.C.5.** Gunakan fresh executor session. Sebelum gate database/runtime, stabilkan Docker atau gunakan disposable stack terisolasi tanpa menyentuh resource main/recovery sebagai fallback.

## Known documentation debt (non-blocking)

- DBB 3.A.1 lama memuat rantai status temporal/supersession yang sulit dibaca; gunakan `BATCH_INDEX.md`, jangan buka batch koreksi baru untuk wording kecil.
- DBB 3.B/3.B.1 masih menyimpan status executor sebelum external audit; status kanonik setelah audit berada di dokumen ini dan `BATCH_INDEX.md`.
- `TRACEABILITY_MATRIX.md` memotret as-built pada fixed point yang disebut di dokumen itu (`72049ef`), sehingga bukan current-state proof untuk commit 3.A/3.B yang lebih baru.
- Beberapa dokumen legacy memiliki mojibake/line-ending drift. Perbaiki hanya bila mengganggu presentasi atau makna, bukan sebagai cascade cleanup.
- DEMO_GUIDE.md telah direkonsiliasi dengan status aktual; gunakan bersama Batches/PRESENTATION_READINESS/DEMO_SCRIPT.md.

## Canonical references

- [Batch index](BATCH_INDEX.md)
- [Batch documentation standard](Batches/README.md)
- [ADR index](ADR/README.md)
- [Implementation traceability](TRACEABILITY_MATRIX.md)
- [Phase 2 backend forensic certification](PHASE_2_BACKEND_FORENSIC_CERTIFICATION.md)
- [Batch 3.B.1 evidence](Batches/BATCH_3_B_1.md)
- [Presentation demo script](Batches/PRESENTATION_READINESS/DEMO_SCRIPT.md)

## Update rule

Perbarui dokumen ini hanya ketika status kanonik, fixed point, next action, atau release claim berubah secara material. Debt kosmetik/temporal kecil masuk backlog dokumentasi dan tidak membuka rantai koreksi batch baru.
