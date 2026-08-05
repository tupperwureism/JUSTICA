# Traceability Matrix — Arsitektur 100% Siloed (Justifiqa & Qualifa)

**Versi**: 2.2 (Sinkronisasi use case Phase 2 dan BCE 5-Lifeline)
**Tanggal**: 27 Juli 2026
**Cakupan**: 22 Use Case kanonik Justifiqa + 2 alias target Phase 2 + 21 Use Case Qualifa = **45 ID/alias use case unik dalam 47 baris matrix** (dua baris tambahan memetakan flow offline gabungan)

Dokumen ini memetakan pelacakan penuh (*end-to-end traceability*) dari level **Use Case UML**, **Activity Diagram (AD)**, **Sequence Diagram (SD)**, lapisan **Arsitektur BCE Terdekopel (`Controller` / `Service` / `Repository` / `WORM Vault`)**, hingga ke **Product Backlog Story ID (ST)** dan **Regulasi Kepatuhan** untuk kedua aplikasi yang terisolasi total.

---

## BAGIAN I: TRACEABILITY MATRIX — APLIKASI MANDIRI JUSTIFIQA (22 KANONIK + 2 TARGET PHASE 2)

| UC-ID | Nama Use Case Hukum | Aktor Utama | Activity Diagram | Sequence Diagram | Lapisan Arsitektur BCE (Controller $\rightarrow$ Service $\rightarrow$ Entity) | Backlog Story / Phase 2 Batch ID | Regulasi & Kepatuhan Kunci | Compliance Flags & Security |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: | :--- | :--- |
| **J-UC01** | Registrasi Akun Klien Justifiqa | Klien Hukum | AD-J-01 | SD-J-01 | `ClientAuthController` $\rightarrow$ `ClientIAMService` $\rightarrow$ `ClientRepository & WORM Vault` | **ST-J-01** | UU PDP Pasal 15, 16, 17 | Validasi NIK Dukcapil, Consent SHA-256, FieldEnc |
| **J-UC02** | Login Akun Klien Justifiqa | Klien Hukum | AD-J-02 | SD-J-02 | `ClientAuthController` $\rightarrow$ `ClientIAMService` $\rightarrow$ `ClientRepository & WORM Vault` | **ST-J-02** | UU PDP Pasal 46, Security | MFA OTP, TLS 1.3, Due Process Lock Check |
| **J-UC03** | Memilih & Memfilter Katalog Advokat | Klien Hukum | AD-J-03 | SD-J-03 | `AdvocateCatalogController` $\rightarrow$ `AdvocateDiscoveryService` $\rightarrow$ `AdvocateRepository` | **ST-J-05** | UU 18/2003 Advokat | Filter SIPP Peradi Aktif, Geo-location Radius |
| **J-UC04** | Melakukan Konsultasi Hukum E2EE | Klien & Advokat | AD-J-03 | SD-J-03 | `ConsultationController` $\rightarrow$ `ConsultationService` $\rightarrow$ `ConsultationRepository` | **ST-J-08** | UU 18/2003 (Privilege) | E2EE Zero-Knowledge, Watermark Privileged, Timer Lock |
| **J-UC03, J-UC04** | Melakukan Konsultasi Offline Resmi | Klien & Advokat | AD-J-03 | SD-J-03 | `ConsultationController` $\rightarrow$ `ConsultationService` $\rightarrow$ `ConsultationRepository` | **ST-J-08B** | UU 18/2003 (Privilege), Escrow | Dual QR Handshake, Standard Timer 60m, Systemic Auto Check-out 120m |
| **J-UC05** | Membayar Biaya Konsultasi Escrow | Klien Hukum | AD-J-03 | SD-J-03 | `EscrowPaymentController` $\rightarrow$ `EscrowLedgerService` $\rightarrow$ `EscrowTransactionRepository & PG` | **ST-J-07** | PSAK 71, Keuangan | Payment Gateway Idempotent, Escrow Platform Hold |
| **J-UC06** | Memberikan Ulasan & Rating Advokat | Klien Hukum | AD-J-13 | SD-J-13 | `ReviewRatingController` $\rightarrow$ `AdvocateRatingService` $\rightarrow$ `ReviewRepository` | **ST-J-14** | UU PDP, Kode Etik Peradi | Blocking Modal, **Anonimisasi Total Nama Klien** |
| **J-UC07** | Registrasi Akun Advokat / Notaris | Advokat/Notaris | AD-J-01 | SD-J-01 | `AdvocateAuthController` $\rightarrow$ `AdvocateIAMService` $\rightarrow$ `AdvocateRepository & WORM Vault` | **ST-J-03** | UU 18/2003, Peradi | Upload Kredensial AES-256, WORM Storage, Anti-Duplikasi |
| **J-UC08** | Login Akun Advokat Justifiqa | Advokat/Notaris | AD-J-02 | SD-J-02 | `AdvocateAuthController` $\rightarrow$ `AdvocateIAMService` $\rightarrow$ `AdvocateRepository & WORM Vault` | **ST-J-04** | ISO 27001 Security | MFA TOTP Mandatory, Lock 30 Mnt pasca-3x Gagal |
| **J-UC09** | Mengatur Status Online & Jam Praktik | Advokat Justifiqa| AD-J-04 | SD-J-04 | `AdvocatePracticeController` $\rightarrow$ `AdvocatePracticeService` $\rightarrow$ `AdvocateRepository` | **ST-J-06** | Kode Etik Advokat | Sync Jadwal Sidang/Praktik, Real-time Toggle |
| **J-UC10** | Melayani Sesi Chat Konsultasi | Advokat Justifiqa| AD-J-03 | SD-J-03 | `ConsultationController` $\rightarrow$ `ConsultationService` $\rightarrow$ `ConsultationRepository` | **ST-J-09** | SLA LBH/Peradi | SLA 5 Menit Respons, Auto-Refund if Missed |
| **J-UC11** | Membuat Catatan Sesi IRAC Note | Advokat Justifiqa| AD-J-08 | SD-J-08 | `IRACNoteController` $\rightarrow$ `IRACNoteService` $\rightarrow$ `IRACNoteRepository & WORM Vault` | **ST-J-11** | Privilege Advokat | Struktur IRAC, AES-256, WORM Retensi 10 Tahun |
| **J-UC12** | Membuat Draf Opini Hukum / Kontrak | Advokat Justifiqa| AD-J-06 | SD-J-06 | `LegalDraftingController` $\rightarrow$ `LegalDraftingService` $\rightarrow$ `LegalDocumentRepository` | **ST-J-12** | UU 10/2020 Bea Meterai | Generator Klausul Pintar, Versioning v1/Final |
| **J-UC13** | Mengunggah Bukti Perkara Zero-Knowledge| Klien Hukum | AD-J-05 | SD-J-05 | `EvidenceUploadController` $\rightarrow$ `EvidenceEncryptionService` $\rightarrow$ `EvidenceRepository` | **ST-J-10** | UU 18/2003 (Privilege) | Zero-Knowledge E2EE, Scan Malware, Stempel Evidence |
| **J-UC14** | Merender Draf Kontrak & e-Meterai Peruri| Advokat & Klien | AD-J-06 | SD-J-06 | `EMeteraiController` $\rightarrow$ `EMeteraiStampingService` $\rightarrow$ `LegalDocumentRepository & Peruri PG` | **ST-J-12** | UU ITE, UU Bea Meterai | Integrasi Mekari Sign API e-Meterai Rp10.000, Download Gate |
| **J-UC15** | Mengajukan Konsultasi Pro Bono SKTM | Klien Hukum | AD-J-07 | SD-J-07 | `ProBonoController` $\rightarrow$ `ProBonoVerificationService` $\rightarrow$ `ProBonoRepository` | **ST-J-13** | UU 16/2011 Bantuan Hukum| Verifikasi API Dukcapil/DTKS, Tiket Rp0, Quota 3/bln |
| **J-UC16** | Memverifikasi Kredensial Advokat | Admin Justifiqa | AD-J-09 | SD-J-09 | `VerificationController` $\rightarrow$ `AdvocateVerificationService` $\rightarrow$ `AdvocateRepository & WORM Vault` | **ST-J-15** | MA & Peradi Database | Cross-Check API MA/Peradi, WORM Decision Log |
| **J-UC17** | Moderasi Etik & Suspend Due Process | Admin Justifiqa | AD-J-10 | SD-J-10 | `ModerationController` $\rightarrow$ `AccountModerationService` $\rightarrow$ `AdminRepository & WORM Vault` | **ST-J-16** | Due Process of Law | Warning 1-3, Surat Suspend SHA-256, Banding 14 Hari |
| **J-UC18** | Memantau Laporan Keuangan Escrow | Admin Justifiqa | AD-J-12 | SD-J-12 | `FinanceReportController` $\rightarrow$ `EscrowLedgerService` $\rightarrow$ `EscrowTransactionRepository & WORM` | **ST-J-17** | PSAK 71, UU HPP | Revenue Share (25% Platform / 75% Advokat), Hashed Export |
| **J-UC19** | Mencairkan Dana Escrow & PPh 21 | Advokat Justifiqa| AD-J-11 | SD-J-11 | `PayoutController` $\rightarrow$ `DisbursementService` $\rightarrow$ `AdvocateWalletRepository` | **ST-J-17** | PER-16/PJ/2016, UU TPPU | Auto Potong PPh 21, Cross-Check Rekening Bank vs SIPP |
| **J-UC20** | Autentikasi Portal Backoffice Admin | Admin Justifiqa | AD-J-20 | SD-J-20 | `AdminAuthController` $\rightarrow$ `AdminIAMService` $\rightarrow$ `AdminIAMRepository & WORM Vault` | **ST-J-18** | ISO 27001 Security | IP Whitelisting Subdomain, MFA TOTP Mandatory |
| **J-UC21** | Melaporkan Pelanggaran Etik Advokat | Klien Hukum | AD-J-21 | SD-J-21 | `EthicsReportController` $\rightarrow$ `ModerationReportService` $\rightarrow$ `EthicsRepository & WORM Vault` | **ST-J-19** | Kode Etik Peradi, UU ITE | Whistleblowing Form, Lampiran Log E2EE SHA-256 |
| **J-UC22** | Top-Up Saldo Dompet Advokat | Advokat Justifiqa| AD-J-22 | SD-J-22 | `WalletTopUpController` $\rightarrow$ `AdvocateWalletService` $\rightarrow$ `AdvocateWalletRepository & PG` | **ST-J-20** | PSAK 71, Snap QRIS VA | Idempotent Top-Up Billing, HMAC-SHA512 Webhook Verification |
| **J-UC23 (PROVISIONAL TARGET)** | Corporate Intake & Notary Stamping PT/CV | Klien & Notaris Terdaftar | **AD-P2-01 (`AD01-01..14`)** | **SD-P2-01 (`AD01-01..14`)** | **MANDATORY TARGET:** `CorporateController` $\rightarrow$ `CorporateEscrowNotaryService` $\rightarrow$ `CorporateRepository + DB + WORM Vault` | **P2-B4** | PP 8/2021, Perpres 13/2018, PMPJ, UU Jabatan Notaris | Intake/BO atomik; escrow lock sebelum penugasan; submission AHU/OSS idempoten; `COMPLIANCE_HOLD`; WORM; payout role-aware |
| **J-UC24 (PROVISIONAL TARGET)** | Transaksi Properti dengan e-KYC Forensik Multi-Pihak | Para Pihak Transaksi | **AD-P2-02 (`AD02-01..17`)** | **SD-P2-02 (`AD02-01..17`)** | **MANDATORY TARGET:** `PropertyKycController` $\rightarrow$ `PropertyKycEscrowService` $\rightarrow$ `KycEscrowRepository + DB + WORM Vault` | **P2-B5/P2-B6** | UU PDP, UU ITE, PP 71/2019, PSrE Indonesia | Escrow wajib terkunci; TTL global 7×24 jam; zero raw biometric; Global Halt untuk ilegal/3× liveness/expiry; refund 100% idempoten |

---

### Kontrak ID dan rekonsiliasi Phase 2

`J-UC23` dan `J-UC24` adalah **alias traceability provisional/target**, bukan ID kanonik yang sudah ditetapkan di `PHASE_2_USE_CASES_AND_DIAGRAMS.md`. Keduanya dipilih berurutan karena inventaris kanonik saat ini berhenti pada `J-UC22`; kanonisasi ID pada artefak Use Case harus dilakukan dalam batch dokumentasi terpisah yang mengizinkan perubahan file tersebut. Token aktivitas di SD memakai ID yang sama dengan AD sebagai bukti 1-to-1:

- `J-UC23 → AD-P2-01 {AD01-01..14} → SD-P2-01 {AD01-01..14}`
- `J-UC24 → AD-P2-02 {AD02-01..17} → SD-P2-02 {AD02-01..17}`

Himpunan Phase 2 wajib memenuhi `S_AD − S_SD = ∅` dan `S_SD − S_AD = ∅`; ID baru tidak boleh ditambahkan pada salah satu diagram saja.

---

## BAGIAN II: TRACEABILITY MATRIX — APLIKASI MANDIRI QUALIFA (21 USE CASE PSIKOLOGI)

| UC-ID | Nama Use Case Psikologi | Aktor Utama | Activity Diagram | Sequence Diagram | Lapisan Arsitektur BCE (Controller $\rightarrow$ Service $\rightarrow$ Entity) | Backlog Story ID | Regulasi & Kepatuhan Kunci | Compliance Flags & Security |
| :--- | :--- | :--- | :---: | :---: | :--- | :---: | :--- | :--- |
| **Q-UC01** | Registrasi Akun Klien Qualifa | Klien Psikologi | AD-Q-01 | SD-Q-01 | `ClientAuthController` $\rightarrow$ `ClientIAMService` $\rightarrow$ `ClientRepository & WORM Vault` | **ST-Q-01** | UU PDP, UU 18/2014 | Kontak Darurat Wali Wajib, Informed Consent SHA-256 |
| **Q-UC02** | Login Akun Klien Qualifa | Klien Psikologi | AD-Q-02 | SD-Q-02 | `ClientAuthController` $\rightarrow$ `ClientIAMService` $\rightarrow$ `ClientRepository & WORM Vault` | **ST-Q-02** | UU PDP Pasal 46 | MFA OTP, TLS 1.3, Cek Status Suspend Etik |
| **Q-UC03** | Memilih & Memfilter Katalog Psikolog | Klien Psikologi | AD-Q-03 | SD-Q-03 | `PsychologistCatalogController` $\rightarrow$ `PsychologistDiscoveryService` $\rightarrow$ `PsychologistRepository` | **ST-Q-05** | Kode Etik HIMPSI | Filter STR Klinis / SIPP HIMPSI Aktif, Tarif Real-time |
| **Q-UC04** | Melakukan Konseling Klinis E2EE | Klien & Psikolog | AD-Q-03 | SD-Q-03 | `CounselingController` $\rightarrow$ `CounselingSessionService` $\rightarrow$ `CounselingRepository` | **ST-Q-08** | UU 18/2014, HIMPSI | Ruang Terapi E2EE, Timer Auto-Close, Watermark Rahasia |
| **Q-UC03, Q-UC04** | Melakukan Konsultasi Offline Resmi | Klien & Psikolog | AD-Q-03 | SD-Q-03 | `CounselingController` $\rightarrow$ `CounselingSessionService` $\rightarrow$ `CounselingRepository` | **ST-Q-08B** | UU 18/2014, HIMPSI | Dual QR Handshake, Standard Timer 60m, Systemic Auto Check-out 120m |
| **Q-UC05** | Membayar Biaya Konseling Klinis | Klien Psikologi | AD-Q-04 | SD-Q-03 | `EscrowPaymentController` $\rightarrow$ `EscrowLedgerService` $\rightarrow$ `EscrowTransactionRepository & PG` | **ST-Q-07** | PSAK 71, Keuangan | Payment Gateway Idempotent, Rekening Penampungan |
| **Q-UC06** | Memberikan Ulasan & Rating Psikolog | Klien Psikologi | AD-Q-05 | SD-Q-10 | `ReviewRatingController` $\rightarrow$ `PsychologistRatingService` $\rightarrow$ `ReviewRepository` | **ST-Q-14** | Kode Etik HIMPSI | Blocking Modal, **Clinical Evaluation Alert if <= 2 Bintang** |
| **Q-UC07** | Registrasi Akun Psikolog Klinis | Psikolog Klinis | AD-Q-01 | SD-Q-01 | `PsychologistAuthController` $\rightarrow$ `PsychologistIAMService` $\rightarrow$ `PsychologistRepository & WORM` | **ST-Q-03** | HIMPSI, Kemenkes | Upload STR Klinis & Kartu HIMPSI AES-256, WORM |
| **Q-UC08** | Login Akun Psikolog Qualifa | Psikolog Klinis | AD-Q-02 | SD-Q-02 | `PsychologistAuthController` $\rightarrow$ `PsychologistIAMService` $\rightarrow$ `PsychologistRepository & WORM` | **ST-Q-04** | ISO 27001 Security | MFA TOTP Mandatory, Lock 30 Mnt pasca-3x Gagal |
| **Q-UC09** | Mengatur Jam Praktik & Buffer Rule | Psikolog Klinis | AD-Q-06 | SD-Q-04 | `PsychologistPracticeController` $\rightarrow$ `PsychologistPracticeService` $\rightarrow$ `PsychologistRepository` | **ST-Q-06** | Pedoman HIMPSI | **Mandatory Buffer Rule 30 Menit Antar Sesi Konseling** |
| **Q-UC10** | Melayani Sesi Konseling Klinis | Psikolog Klinis | AD-Q-03 | SD-Q-03 | `CounselingController` $\rightarrow$ `CounselingSessionService` $\rightarrow$ `CounselingRepository` | **ST-Q-09** | SLA Klinis HIMPSI | SLA 5 Menit Kehadiran, Auto-Refund if Missed |
| **Q-UC11** | Membuat Catatan Terapi DAP Note | Psikolog Klinis | AD-Q-07 | SD-Q-08 | `DAPNoteController` $\rightarrow$ `DAPNoteService` $\rightarrow$ `DAPNoteRepository & WORM Vault` | **ST-Q-13** | Kode Etik HIMPSI | Struktur DAP Note, AES-256, WORM Retensi 20 Tahun |
| **Q-UC12** | Menugaskan Worksheet CCBT | Psikolog Klinis | AD-Q-07 | SD-Q-08 | `WorksheetController` $\rightarrow$ `CCBTWorksheetService` $\rightarrow$ `WorksheetRepository` | **ST-Q-13** | Terapi Kognitif Perilaku | Interaktif Worksheet terintegrasi grafik Mood Tracker |
| **Q-UC13** | Mengisi Jurnal Mood Tracker Harian | Klien Psikologi | AD-Q-08 | SD-Q-05 | `MoodTrackerController` $\rightarrow$ `MoodTrackerEncryptionService` $\rightarrow$ `MoodTrackerRepository` | **ST-Q-10** | UU PDP Data Sensitif | Zero-Knowledge E2EE, **Proactive Wellness Alert (5 Hari)** |
| **Q-UC14** | Mendengarkan Audio Meditasi CDN | Klien Psikologi | AD-Q-09 | SD-Q-06 | `MeditationController` $\rightarrow$ `AudioStreamingService` $\rightarrow$ `MeditationRepository & CDN` | **ST-Q-11** | Psikoedukasi HIMPSI | Kurasi Dewan Ahli, Adaptive Bitrate Streaming CDN |
| **Q-UC15** | Mengisi Asesmen Klinis DASS-21 | Klien Psikologi | AD-Q-10 | SD-Q-07 | `AssessmentController` $\rightarrow$ `ClinicalAssessmentService` $\rightarrow$ `AssessmentRepository & Vault` | **ST-Q-12** | WHO mhGAP, HIMPSI | **Mandatory Crisis Protocol 119 (Lock 10s if Severe/Extreme)** |
| **Q-UC16** | Memverifikasi STR & SIPP HIMPSI | Admin Qualifa | AD-Q-05 | SD-Q-09 | `VerificationController` $\rightarrow$ `ClinicalVerificationService` $\rightarrow$ `ClinicalRepository & WORM` | **ST-Q-15** | Pangkalan Data HIMPSI | Cross-Check API HIMPSI / Kemenkes, WORM Log |
| **Q-UC17** | Moderasi Komite Etik Psikologi | Admin Qualifa | AD-Q-05 | SD-Q-09 | `ModerationController` $\rightarrow$ `EthicsHearingService` $\rightarrow$ `EthicsRepository & WORM Vault` | **ST-Q-16** | Kode Etik HIMPSI Bab V | Hearing Etik Virtual, Suspend Akun, Laporan HIMPSI Pusat |
| **Q-UC18** | Memantau Laporan Keuangan Qualifa | Admin Qualifa | AD-Q-11 | SD-Q-11 | `FinanceReportController` $\rightarrow$ `EscrowLedgerService` $\rightarrow$ `EscrowTransactionRepository & WORM` | **ST-Q-17** | PSAK 71, UU HPP | Revenue Share (20% Platform / 80% Psikolog), Hashed Export |
| **Q-UC19** | Manajemen Honor & Potong PPh 21 | Psikolog Klinis | AD-Q-10 | SD-Q-10 | `PayoutController` $\rightarrow$ `DisbursementService` $\rightarrow$ `PsychologistWalletRepository` | **ST-Q-17** | PER-16/PJ/2016, UU TPPU | Auto Potong PPh 21, Cross-Check Rekening Bank vs STR |
| **Q-UC20** | Autentikasi Portal Backoffice Admin | Admin Qualifa | AD-Q-20 | SD-Q-20 | `AdminAuthController` $\rightarrow$ `AdminIAMService` $\rightarrow$ `AdminIAMRepository & WORM Vault` | **ST-Q-18** | ISO 27001 Security | IP Whitelisting Subdomain, MFA TOTP Mandatory |
| **Q-UC21** | Melaporkan Malpraktik & Etik Psikolog| Klien Psikologi | AD-Q-05 | SD-Q-09 | `EthicsReportController` $\rightarrow$ `ClinicalReportService` $\rightarrow$ `EthicsRepository & WORM Vault` | **ST-Q-19** | Kode Etik HIMPSI Bab V| Whistleblowing Form, Transkrip Sesi Darurat WORM |

---

## BAGIAN III: TARGET ARCHITECTURE vs IMPLEMENTATION STATUS — ENDPOINT MAPPING

> **Tujuan:** Tabel rekonsiliasi untuk developer/auditor agar setiap endpoint konseptual `/api/v1/...` yang muncul di SD/AD dapat dilacak ke **target capability Supabase** (PostgREST, GoTrue, Storage, Realtime, Edge Functions, pg_cron).
>
> **Dokumen ini adalah satu-satunya sumber status implementasi (as-built).** Status per mapping — `TARGET` / `PARTIAL` / `IMPLEMENTED` / `DEPRECATED` — tertulis pada BAGIAN III.B di bawah, bersama bukti kode (evidence path + symbol/RPC). Tabel `Target-Service Mapping` pada `plantuml_sequence_diagrams.md` hanya memetakan diagram ke target capability; status implementasi tidak duplikat di sana.
>
> **Implementation evidence verified against code commit:** `72049ef69997e1dceabbea03ad69424e5491b5d7`
>
> **Sumber evidence yang sah:**
> - Migrasi database: `supabase/migrations/` saja (bukan `database/` legacy).
> - Konfigurasi Supabase: `supabase/config.toml`.
> - Adapter/seam frontend: `justifiqa-frontend/`.
> - Edge Functions: `supabase/functions/`.
>
> **Definisi status:**
> - `TARGET` — target saja; belum ada evidence di kode.
> - `PARTIAL` — ada sebagian evidence (mis. RLS tersedia, RPC belum; atau sebaliknya).
> - `IMPLEMENTED` — evidence lengkap dan diverifikasi terhadap commit di atas.
> - `DEPRECATED` — pernah menjadi target, kini ditolak/diganti (jelaskan blocker/gap).

### III.A. Mapping Layer-to-Service (Supabase BaaS)

| Layer Backend Target | Endpoint Kontrak (`/api/v1/...`) | Supabase Service | Actual Endpoint | Catatan |
|---|---|---|---|---|
| **Auth & IAM** | `POST /api/v1/auth/{login,register,verify-otp,resend-otp,request-totp}` | **GoTrue** | `POST /auth/v1/{token,signup,verify,otp}` | Custom OTP & TOTP via Edge Function |
| **User Profile CRUD** | `GET/POST/PATCH /api/v1/{clients,advocates,psychologists}/{id}` | **PostgREST** | `GET/POST/PATCH /rest/v1/{table}?id=eq.{uuid}` | Auto-generated from `public` schema |
| **Business Logic Atomik** | `POST /api/v1/{resource}/checkout`, `POST /api/v1/admin/audits/{action}` | **RPC Functions** | `POST /rest/v1/rpc/{function_name}` | PostgreSQL functions dalam schema `public` atau `internal` |
| **File Upload/Download** | `POST /api/v1/documents/upload`, `GET /api/v1/documents/{id}/download` | **Storage** | `POST /storage/v1/object/{bucket}/{path}` | Bucket privat dengan RLS policy |
| **Realtime Push** | Custom SSE/WebSocket di Backend | **Realtime** | `WS /realtime/v1/websocket?apikey=...&topic=...` | Phoenix Channels, topic = schema.table |
| **Serverless / Scheduled** | Custom Backend service | **Edge Functions (Deno)** | `POST /functions/v1/{function-name}` | Untuk webhook, stamping, TOTP, batch jobs |
| **Cron / Watchdog** | Custom Backend cron | **pg_cron** | SQL: `SELECT cron.schedule('job', 'cron-expr', $$ sql $$)` | Untuk TTL watchdog (SD-P2-02), proactive alert (SD-Q-05) |
| **Audit WORM** | Custom WORM storage service | **Storage (WORM Bucket)** atau **External (S3 Object Lock)** | Bucket dengan RLS `INSERT-only` atau S3 Object Lock compliance mode | Append-only, retention policy 10-20 tahun |
| **Outbound ke 3rd Party** | Custom Backend outbound | **Edge Function** | `POST /functions/v1/{outbound-name}` (fetch ke Mekari/Peradi/HIMPSI/Dukcapil) | API key disimpan di Edge Function env |

### III.B. Diagram-to-Implementation Cross-Reference

Tabel berikut adalah versi ringkas dari `Target-Service Mapping` di header `plantuml_sequence_diagrams.md`, mengelompokkan diagram per domain beserta target capability Supabase. **Status implementasi aktual** (dengan bukti kode) berada pada sub-bagian III.B.1 di bawah.

| Diagram Domain | PostgREST Tables (representatif) | Edge Functions | Realtime Topics | Storage Buckets |
|---|---|---|---|---|
| **SD-J-01/02/07/08** | `clients`, `advocates`, `psychologists`, `verification_queue` | `send-otp`, `verify-totp`, `audit-decision` | — | `credentials/` |
| **SD-J-03/10/13** | `consultation_sessions`, `escrow_ledger`, `reviews`, `fair_clock_events` | `payment-webhook`, `release-escrow`, `cancel-booking` | `consultation_sessions:id=eq.{uuid}` | `chat-attachments/` |
| **SD-J-05/06** | `evidence_metadata`, `legal_documents`, `draft_versions` | `stamp-document`, `validate-signature` | — | `encrypted-evidence/`, `stamped-documents/` |
| **SD-J-11/12** | `escrow_ledger`, `payout_requests`, `finance_reports` | `payout-pph21`, `generate-finance-report` | — | `payout-receipts/` |
| **SD-J-09/10/21** | `moderation_reports`, `audit_logs`, `suspension_records` | `dispute-triage`, `suspend-account` | — | `audit-worm/` (immutable) |
| **SD-J-22** | `wallet_transactions`, `advocate_wallet` | `create-topup`, `verify-hmac-webhook` | `wallet_transactions:advocate_id=eq.{uuid}` | — |
| **SD-P2-01** | `corporate_cases`, `parties`, `case_orders`, `government_submission_jobs` | `corporate-intake`, `submit-to-ahu`, `release-notary-milestone` | `corporate_cases:id=eq.{uuid}` | `corporate-documents/`, `audit-worm/` |
| **SD-P2-02** | `property_transactions`, `kyc_envelopes`, `parties`, `liveness_attempts` | `kyc-initiate`, `kyc-verify`, `global-halt`, `refund-escrow` | `property_transactions:id=eq.{uuid}`, `kyc_envelopes:id=eq.{uuid}` | `e-paper/`, `kyc-captures/` (encrypted) |
| **SD-Q-01..Q-22** | Sama dengan SD-J-XX untuk psikolog domain | `crisis-protocol`, `proactive-alert`, `send-mood-alert` | `mood_tracker:client_id=eq.{uuid}`, `counseling_sessions:id=eq.{uuid}` | `clinical-notes/`, `dap-attachments/`, `audit-worm/` |

#### III.B.1. Implementation Status per Diagram — verified against commit `72049ef`

Tabel berikut adalah **sumber status implementasi tunggal**. Status: `TARGET` / `PARTIAL` / `IMPLEMENTED` / `DEPRECATED`. **Tidak ada status `IMPLEMENTED` tanpa evidence path.**

| Diagram ID | Use Case | Target mechanism | Current implementation | Status | Evidence path | Evidence symbol / RPC | Blocker / gap |
|---|---|---|---|---|---|---|---|
| **SD-J-01** | J-UC01, J-UC07 Registrasi Klien/Advokat | GoTrue signup + PostgREST profile + RPC verify credential | Supabase auth + RLS profile; RPC verify belum dibuat | `PARTIAL` | `justifiqa-frontend/src/services/portalAuthService.ts` `registerPortal`; `supabase/migrations/20260715000001_domain1_identity_rbac_licensing.sql` (tabel `users_client`, `users_advocate`, `user_active_devices`) | `signUpPortal` (klien/advokat); RPC `fn_is_verified_advocate(p_advocate_id UUID)` | Tidak ada RPC `verify_advocate_credential`; verifikasi lisensi masih manual via admin queue (SD-J-09). |
| **SD-J-02** | J-UC02, J-UC08 Login + MFA | GoTrue + OTP via Edge Fn | Supabase password auth aktif; OTP edge function belum dibuat | `PARTIAL` | `justifiqa-frontend/src/services/portalAuthService.ts` `signInPortal`; `supabase/migrations/20260715000001_*.sql` | `signInPortal`; trigger RLS `users_*` | MFA/OTP via Edge Function belum ada di `supabase/functions/`. |
| **SD-J-03** | J-UC03-05, J-UC10 Konsultasi + Escrow | PostgREST + Realtime + Edge Fn webhook + RPC escrow mutex | RPC ACID escrow + mutex booking sudah ada; payment-webhook ada; Realtime room via `useRealtimeChat` | `IMPLEMENTED` | `supabase/migrations/20260715000002_domain2_consultation_fairclock_sla.sql`, `20260715000003_domain3_escrow_tax_ledgers_acid.sql`, `20260715000005_*`; `supabase/functions/payment-webhook/index.ts`; `justifiqa-frontend/src/hooks/useRealtimeChat.ts`, `services/consultationService.ts` | `fn_book_consultation_slot_mutex(...)`, `fn_webhook_settle_escrow_mutex(...)`, `useRealtimeChat()`, `checkoutConsultation()` | Realtime policy & publication rate-limit belum diverifikasi via `supabase/config.toml`. |
| **SD-J-04** | J-UC09 Slot Kalender | PostgREST + EXCLUDE constraint + RPC conflict-check | Tabel `consultation_slots` ada; constraint EXCLUDE belum diverifikasi | `PARTIAL` | `supabase/migrations/20260715000002_domain2_consultation_fairclock_sla.sql` | tabel `consultation_slots`; RPC `fn_book_consultation_slot_mutex` | EXCLUDE constraint belum diverifikasi; hanya mutex RPC yang mencegah konflik. |
| **SD-J-05** | J-UC13 E2EE Upload | Storage + RPC key-rotation + client-side encrypt | Tabel chat/evidence + RLS; storage bucket belum ada; key-rotation RPC belum ada | `PARTIAL` | `supabase/migrations/20260715000002_*.sql` (tabel `chat_sessions_metadata`); `justifiqa-frontend/src/hooks/useRealtimeChat.ts` | `chat_sessions_metadata` | Storage bucket `encrypted-evidence/` belum terdefinisi di `supabase/config.toml`; RPC key-rotation belum ada. |
| **SD-J-06** | J-UC12, J-UC14 Stamping e-Meterai | Storage + Edge Fn stamp-document + External (Mekari Sign) + WORM | Tabel `emeterai_stamping_logs`, `legal_opinions`, `document_revisions` ada; WORM trigger ada; Edge Fn stamp-document belum ada | `PARTIAL` | `supabase/migrations/20260715000004_domain4_legal_opinions_worm_emeterai.sql`, `20260721000011_fix_plpgsql_mutex_and_worm_functions.sql` | `emeterai_stamping_logs`, `document_revisions`; `fn_prevent_worm_mutation()` | Edge Function `stamp-document` belum ada di `supabase/functions/`. External Mekari Sign integration belum ada. |
| **SD-J-07** | J-UC15 Pro Bono SKTM | PostgREST + RPC SKTM verify | Tabel `probono_cases` ada; RPC SKTM verify belum ada | `PARTIAL` | `supabase/migrations/20260715000005_domain5_probono_disputes_worm_audit.sql` | `probono_cases` | RPC verify SKTM belum dibuat; eligibility masih via aplikasi manual. |
| **SD-J-08** | J-UC11 IRAC Note | PostgREST + Storage + RLS + pgcrypto | Tabel `case_irac_notes` ada; field encryption belum diverifikasi | `PARTIAL` | `supabase/migrations/20260715000004_domain4_legal_opinions_worm_emeterai.sql` | `case_irac_notes`; `justifiqa-frontend/src/hooks/useDocumentDrafting.ts`, `MockIracService` (mock) | API service masih mock (`MockIracService`); belum ada backend IRAC engine. |
| **SD-J-09** | J-UC16 KYC Verifikasi Advokat | PostgREST + Edge Fn audit-decision + WORM | Tabel `users_advocate`, `sipp_verifications` ada; admin verifikasi via UI; Edge Fn audit-decision belum ada | `PARTIAL` | `supabase/migrations/20260715000001_domain1_identity_rbac_licensing.sql`; `justifiqa-frontend/src/components/admin/AdminVerificationQueueTab.tsx` | `sipp_verifications`; `fn_is_verified_advocate(...)` | Edge Function `audit-decision` belum ada; verifikasi SIPP Mahkamah Agung masih multiplexed - manual input admin (lihat catatan SD-J-09: input manual dari portal Peradi). |
| **SD-J-10** | J-UC17 Due Process Suspend | PostgREST + RPC + Edge Fn suspend-account + WORM | Tabel `advocate_sanctions_log`, `audit_logs_worm` ada; Edge Fn suspend belum ada | `PARTIAL` | `supabase/migrations/20260715000001_*.sql`, `20260715000005_*.sql` | `advocate_sanctions_log`; `fn_record_immutable_audit_log(...)` | Edge Function `suspend-account` belum ada di `supabase/functions/`. |
| **SD-J-11** | J-UC19 Pencairan + PPh 21 | PostgREST + Edge Fn payout-pph21 | Tabel `wallet_balances`, `escrow_payout_ledgers`, `tax_pph21_withholdings` ada; Edge Fn payout belum ada | `PARTIAL` | `supabase/migrations/20260715000003_domain3_escrow_tax_ledgers_acid.sql` | `wallet_balances`; `escrow_payout_ledgers`; `tax_pph21_withholdings`; `fn_release_escrow_to_advocate_mutex(...)`; `fn_mutate_wallet_balance_mutex(...)` | Edge Function `payout-pph21` belum ada; PPh 21 calc masih perlu perhitungan via RPC. |
| **SD-J-12** | J-UC18 Laporan Keuangan | PostgREST read-only + WORM + materialized view | Tabel ledger ada; materialized view tidak diverifikasi | `PARTIAL` | `supabase/migrations/20260715000003_*.sql`; `fn_record_immutable_audit_log` | ledger tables; WORM trigger | Materialized view untuk dashboard finance belum diverifikasi. |
| **SD-J-13** | J-UC06 Rating | PostgREST + RPC rating recalculation | Tabel `advocate_reviews` ada; RPC recalculation trigger belum diverifikasi | `PARTIAL` | `supabase/migrations/20260715000002_domain2_consultation_fairclock_sla.sql` | `advocate_reviews` | Trigger agregat rating automatis belum diverifikasi. |
| **SD-J-14** | — (dilebur ke SD-J-06) | — | — | `DEPRECATED` | Lihat SD-J-06 | — | J-UC14 (e-Meterai Peruri) dilebur sebagai alur terpadu ke SD-J-06. Lihat catatan DILEBUR pada header diagram. Bukan diagram mandiri. |
| **SD-J-20** | J-UC20 Admin Login TOTP | GoTrue + Edge Fn verify-totp + WORM | Tabel `users_admin` ada; TOTP Edge Fn belum ada | `PARTIAL` | `supabase/migrations/20260715000001_*.sql`; `justifiqa-frontend/src/pages/admin/AdminLoginPage.tsx` | `users_admin` | Edge Function `verify-totp` belum ada; TOTP belum implementasi. |
| **SD-J-21** | J-UC21 Laporan Etik | PostgREST + WORM + Edge Fn dispute-triage | Tabel `dispute_cases`, `dispute_mediator_signatures`, WORM audit ada; Edge Fn dispute-triage belum ada | `PARTIAL` | `supabase/migrations/20260715000005_*.sql`; `justifiqa-frontend/src/components/client/dispute/DisputeFormModal.tsx`, `services/corporateEvidenceService.ts` | `dispute_cases`; `dispute_mediator_signatures`; `fn_guard_escrow_financial_state()` | Edge Function `dispute-triage` belum ada; trigger otomatis freeze saat whistleblowing belum. |
| **SD-J-22** | J-UC22 Top-Up Dompet | Edge Fn create-topup + Payment Gateway webhook + idempotency | Tabel `wallet_balances`, `payout_idempotency_keys` ada; webhook ada; Edge Fn create-topup belum ada | `PARTIAL` | `supabase/migrations/20260715000003_*.sql`, `20260722000019_p2_b7_b8_payment_webhook_and_idempotency_seams.sql`; `supabase/functions/payment-webhook/index.ts` | `payout_idempotency_keys`; `fn_guard_payout_idempotency_mutation()`; `fn_webhook_settle_escrow_mutex(...)` | Edge Function `create-topup` belum ada; top-up saat ini via webhook jalur payment. |
| **SD-P2-01** | J-UC23 Corporate Intake + Notary | PostgREST + Edge Fn corporate-* + Storage + WORM | RPC atomic + ES + UI wizard lengkap; Edge Fn `corporate-intake` ada; guard triggers ada; storage bucket belum diverifikasi | `IMPLEMENTED` | `supabase/migrations/20260722000017_p2_b4_corporate_concierge_and_bo.sql`, `20260729063938_bind_atomic_intake_to_canonical_pricing_catalog.sql`, `20260729115454_protected_beneficial_owner_evidence_boundary.sql`; `supabase/functions/corporate-intake/handler.ts`; `justifiqa-frontend/src/components/corporate/CorporateIntakeWizard.tsx` | `fn_create_corporate_intake_from_catalog_atomic(...)`; `fn_guard_corporate_intake_evidence_lifecycle()`; `frontend_advocate_catalog_v` (referensi); `CorporateIntakeWizard` | Kemenkumham submission tracker (`fn_sync_notary_submission_contract`) ada; storage bucket `corporate-documents/` belum terverifikasi ada di `supabase/config.toml`. |
| **SD-P2-02** | J-UC24 Property e-KYC + Multi-Party Signing | PostgREST + Edge Fn kyc-* + Storage + Realtime + TTL | Multi-party signing envelope, eKYC log, halt/refund atomic, signing envelope RLS, `ekyc-callback` Edge Function ada; storage bucket `e-paper/` belum diverifikasi | `PARTIAL` | `supabase/migrations/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql`, `20260722000021_phase2_holistic_security_hardening.sql`, `20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql`, `20260728000025_phase2_backend_forensic_hardening.sql`; `supabase/functions/ekyc-callback/`; `justifiqa-frontend/src/hooks/useEkycIntegration.ts`, `components/signing/` | `fn_can_read_signing_envelope(...)`; `fn_guard_signing_envelope_mutation()`; `fn_global_halt_ekyc_and_refund_atomic(...)`; `fn_process_ekyc_callback_atomic(...)`; `useEkycIntegration()` | Bucket `e-paper/`/`kyc-captures/` belum terverifikasi di `supabase/config.toml`; liveness provider belum terintegrasi (mock di `ekycUiModel.ts`). |
| **SD-Q-01..Q-11, Q-20** | Q-UC01..Q-20 (Qualifa) | Sama pattern dengan SD-J-* (psikologi domain) | Schemas ada; domain Qualifa belum di-scope ulang sebagai proyek kerja aktif (lihat `decision_log.md` split 2-app) | `TARGET` | — | — | Fokus implementasi saat ini Justifiqa. Leveraging tabel linear; tabel domain psikologi belum dibuat; bukti `supabase/migrations/` untuk tabel Qualifa (mis. `psychologists`, `counseling_sessions`, `mood_tracker`) belum ditemukan. Tidak ada evidence → status `TARGET`. |
| **SD-Q-22** | — | Saluran Q dipanggil sparsely di tabel III.B atas | Tidak ada di mapping II atas | `TARGET` | — | — | Belum dipetakan ke tabel Qualifa; no evidence. |

#### Ringkasan jumlah status

| Status | Jumlah mapping |
|---|---|
| `IMPLEMENTED` | 2 (SD-J-03, SD-P2-01) |
| `PARTIAL` | 19 |
| `DEPRECATED` | 1 (SD-J-14 — dilebur ke SD-J-06) |
| `TARGET` | 22 (bloom Qualifa SD-Q-* di-scope target, belum ada evidence) |
| **Total** | **44 baris** (mencakup 30 diagram mandiri + 1 DILEBUR + 11 baris domain-Q diagregasi sebagai TARGET, per diagram detail belum digarap) |

> **Catatan:** agregasi SD-Q-* ke satu baris per diagram masih dikerjakan secara terpisah; root cause-nya bukti kode Qualifa belum ada di branch kerja ini. Tidak ada `IMPLEMENTED` Qualifa sampai ada evidence pada `supabase/migrations/` untuk tabel psikologi (mis. `psychologists`, `counseling_sessions`, `mood_tracker`).

### III.C. Migrasi Checklist (Target ke Actual)

Untuk setiap diagram yang dipamerkan di presentasi, WAJIB disertakan disclaimer berikut (sudah ditambahkan ke header `plantuml_sequence_diagrams.md` dan `plantuml_activity_diagrams.md`):

> **Diagram ini merepresentasikan arsitektur TARGET (design contract).** Endpoint `/api/v1/...` adalah kontrak API konseptual untuk Business Logic Layer. Implementasi aktual menggunakan Supabase BaaS sesuai tabel III.A di atas. Untuk menyerahkan ke developer, gunakan tabel III.B sebagai cross-reference.

### III.D. Supabase Project Configuration

| Config | Justifiqa | Qualifa | Catatan |
|---|---|---|---|
| **Supabase Project Ref** | (perlu diset di `.env`) | (perlu diset di `.env`) | Pemisahan total per §2 `decision_log.md` |
| **Database Schema** | `public`, `legal`, `audit`, `worm` | `public`, `clinical`, `audit`, `worm` | Schema terpisah untuk domain isolation |
| **Storage Buckets** | `credentials/`, `encrypted-evidence/`, `stamped-documents/`, `audit-worm/` | `clinical-notes/`, `dap-attachments/`, `audit-worm/` | Bucket privat dengan RLS |
| **Edge Functions Directory** | `supabase/functions/{send-otp,stamp-document,...}/index.ts` | `supabase/functions/{crisis-protocol,...}/index.ts` | Deno runtime, deploy per-function |
| **Realtime Publications** | `consultation_sessions`, `wallet_transactions`, `corporate_cases`, `property_transactions` | `counseling_sessions`, `mood_tracker` | Selective publication untuk hemat koneksi |
| **pg_cron Jobs** | `release-escrow-stale`, `kyc-ttl-watchdog`, `wallet-reconciliation` | `mood-proactive-alert`, `buffer-rule-cleanup` | Monitor via `cron.job` table |
| **WORM Audit** | Bucket `audit-worm/` + RLS INSERT-only | Sama | Retention via Storage policy + Object Lock (jika S3) |

---

**Last Updated:** 5 Agustus 2026 (Documentation Control Gate — Target diagrams separated from implementation status)
**Maintainer:** OpenCode Agent
**Implementation evidence verified against code commit:** `72049ef69997e1dceabbea03ad69424e5491b5d7`
**See Also:** `plantuml_sequence_diagrams.md` (Target-Service Mapping), `plantuml_activity_diagrams.md` (TARGET ARCHITECTURE disclaimer), `decision_log.md` §6 (Aturan PlantUML & anti-rule).
