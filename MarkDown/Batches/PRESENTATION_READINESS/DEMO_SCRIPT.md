# Justifiqa Presentation Demo Script

## Persiapan

1. Jalankan frontend lokal.
2. Buka /demo/readiness.
3. Nyatakan: “Ini local implementation/demo scope, bukan production go-live.”

## Alur 1 — Ringkasan

Tunjukkan enam kartu status:

- Corporate Intake — ACCEPTED_LOCAL;
- Corporate Escrow Settlement — ACCEPTED_LOCAL;
- Payment Provider Initiation — BLOCKED;
- Notary Workspace — FUTURE_WORK;
- e-KYC & Signing — FUTURE_WORK;
- Production Readiness — NOT_STARTED.

## Alur 2 — Yang telah diterima lokal

Buka “Alur diterima lokal”. Jelaskan boundary:

1. intake dan protected BO evidence;
2. JWT/payload/idempotency pada Edge Function;
3. katalog harga + RPC atomik;
4. signed webhook settlement + canonical status.

Jika environment demo tersedia, lanjutkan melalui “Buka portal klien”. Jangan mengklaim provider checkout tersedia.

## Alur 3 — Roadmap

Buka “Roadmap”. Jelaskan bahwa Notary Workspace (3.C), e-KYC/signing (3.D), full E2E/security/QA (Phase 4), dan production readiness (Phase 5) belum selesai.

## Kalimat penutup yang aman

“Proyek membuktikan hardened backend contract serta Corporate Intake dan Escrow settlement pada scope lokal. Integrasi provider, Notaris, e-KYC, deployment, dan go-live audit dicatat sebagai pekerjaan lanjutan.”