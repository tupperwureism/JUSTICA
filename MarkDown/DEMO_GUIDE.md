# Panduan Demo Justifiqa — Scope Aktual

> Dokumen kanonik untuk presentasi lokal per 13 Agustus 2026. Ini bukan production go-live approval. Klaim lama tentang akun mock otomatis, checkout provider, Notary Workspace, dan e-KYC end-to-end tidak lagi digunakan.

## Status yang boleh disampaikan

| Capability | Status | Makna |
|---|---|---|
| Corporate Intake | ACCEPTED_LOCAL | Form, protected BO evidence, Edge Function, dan RPC atomik telah diverifikasi pada scope lokal |
| Corporate Escrow Settlement | ACCEPTED_LOCAL | Signed webhook, replay idempoten, concurrency, dan canonical status telah diverifikasi lokal |
| Payment Provider Initiation | BLOCKED | Provider checkout belum dipilih; tidak ada tombol bayar atau URL palsu |
| Notary Workspace | FUTURE_WORK | Target Batch 3.C; belum diterima end-to-end |
| e-KYC & Signing | FUTURE_WORK | Target Batch 3.D; belum diterima end-to-end |
| Full E2E/security/QA | FUTURE_WORK | Phase 4 belum selesai |
| Production Readiness | NOT_STARTED | Deployment, observability, runbook, provider readiness, dan go-live audit belum dilakukan |

## Persiapan cepat

1. Masuk ke direktori justifiqa-frontend.
2. Jalankan npm run dev.
3. Buka http://localhost:5173/demo/readiness.
4. Ucapkan: "Demo ini menunjukkan local implementation scope, bukan production-ready system."

Halaman readiness bersifat presentasional dan tidak menjalankan mutation.

## Urutan demo utama (3–5 menit)

### 1. Ringkasan

Pada tab Ringkasan, tunjukkan enam kartu status. Tekankan bahwa warna/status berasal dari acceptance lokal dan roadmap, bukan dari kelengkapan visual semata.

Kalimat aman:

"Corporate Intake dan Corporate Escrow telah diterima untuk scope lokal. Provider initiation, Notary, e-KYC, full E2E, dan production readiness masih dibatasi secara eksplisit."

### 2. Alur diterima lokal

Buka tab Alur diterima lokal dan jelaskan urutannya:

1. Klien mengisi Corporate Intake dan mengunggah bukti beneficial owner melalui boundary terproteksi.
2. Edge Function memverifikasi JWT, payload, dan idempotency.
3. RPC atomik memilih katalog harga kanonik dan membuat order/case.
4. Signed payment webhook menyelesaikan escrow serta menyegarkan status kanonik.

Tombol Buka portal klien hanya mengarahkan ke portal aplikasi. Jangan menjanjikan bahwa provider checkout tersedia.

Evidence utama:

- Corporate Intake implementation: 67439533e079cceded8bbddba1f56a4db6388767
- Corporate Intake reconciliation: 2c7f28a86109d58acf4d1319a84ed04ca2e679bf
- Corporate Escrow: 4cddf6866c50cf410697d330bc528d0daafd99fe
- Escrow replay hardening: 59ff89dff3f49a8f169f7822c522f14163d5c707

### 3. Roadmap

Buka tab Roadmap.

- Batch 3.C — Notary Workspace: assignment, approval, dan transition browser-safe belum diselesaikan.
- Batch 3.D — e-KYC & Signing: envelope, provider liveness, callback, serta storage end-to-end belum diselesaikan.
- Phase 4: full E2E/security/QA masih future work.
- Phase 5: production readiness belum dimulai.

UI target lama boleh disebut sebagai rancangan visual, tetapi tidak boleh didemonstrasikan sebagai transaksi berhasil.

## Jika local Supabase tersedia

Anda boleh membuka portal klien untuk memperlihatkan UI terintegrasi Corporate Intake. Gunakan akun lokal yang benar-benar tersedia pada environment tersebut; jangan mengklaim ada akun demo bawaan bila fixture tidak diverifikasi.

Untuk membuktikan settlement, gunakan evidence test/SQL runtime Batch 3.B/3.B.1. Jangan menembakkan webhook provider tanpa secret dan fixture resmi.

## Yang tidak boleh diklaim

- "Aplikasi sudah production-ready."
- "Pembayaran provider sudah bisa dimulai."
- "Kasus otomatis masuk dan selesai di workspace Notaris."
- "e-KYC provider dan signing envelope sudah end-to-end."
- "Semua tombol pada UI legacy terhubung backend."
- "Local test sama dengan production E2E."

## Jawaban singkat untuk pertanyaan dosen

**Apa yang benar-benar selesai?**

Hardened backend contract, Corporate Intake, protected BO evidence, canonical pricing, dan Corporate Escrow settlement pada scope lokal.

**Mengapa pembayaran belum bisa diklik seperti aplikasi produksi?**

Settlement callback sudah diamankan, tetapi provider initiation memerlukan pemilihan dan kredensial provider eksternal. Sistem sengaja tidak membuat checkout palsu.

**Mengapa Notary dan e-KYC masih terlihat dalam roadmap?**

Database seam dan target UI pernah dirancang, tetapi browser-safe end-to-end workflow belum diterima. Karena itu statusnya FUTURE_WORK.

**Apakah ini siap go-live?**

Belum. Phase 4 dan Phase 5 masih memerlukan E2E, security/QA, deployment, observability, operational runbook, dan approval terpisah.

## Referensi kanonik

- MarkDown/CURRENT_STATE.md
- MarkDown/BATCH_INDEX.md
- MarkDown/Batches/PRESENTATION_READINESS/BATCH.md
- MarkDown/Batches/PRESENTATION_READINESS/DEMO_SCRIPT.md
- MarkDown/Batches/BATCH_3_B_1.md
- justifiqa-frontend/src/pages/DevShowcasePage.tsx
- justifiqa-frontend/src/components/presentation/presentationReadinessModel.ts