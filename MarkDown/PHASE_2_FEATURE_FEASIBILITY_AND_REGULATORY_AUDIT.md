# PHASE 2 FEATURE FEASIBILITY AND REGULATORY AUDIT

**Tanggal audit:** 22 Juli 2026
**Baseline repository yang diperiksa:** `41cb5c27ee86754d8d92f14b5ca91d7c315ee3ae` (`41cb5c2`)
**Status admission:** **DITERIMA — BASE-01 s.d. BASE-04 DITUTUP OLEH KAMPANYE 1 (P2-B0 + P2-B3)**
**Aturan bukti:** hukum dan kemampuan provider dirujuk ke sumber primer/resmi jika tersedia. Klaim fitur/sertifikasi provider tetap merupakan klaim vendor sampai Justica memeriksa kontrak, registry Komdigi terkini, laporan pengujian, terms pemrosesan data, dan perilaku sandbox.

Dokumen ini adalah audit kelayakan produk, arsitektur, dan regulasi. Dokumen ini bukan pengganti pendapat hukum tertulis dari konsultan hukum Indonesia, notaris/PPAT mitra, atau regulator.

> **Catatan eksekusi 22 Juli 2026:** temuan mock/untracked/stale-type di bawah adalah bukti snapshot saat audit dilakukan. Penutupannya tercatat secara runnable pada [`MVP_BASELINE_RECONCILIATION_MANIFEST.md`](./MVP_BASELINE_RECONCILIATION_MANIFEST.md) dan migration [`20260722000016_p2_b3_service_orders_expand_only.sql`](../supabase/migrations/20260722000016_p2_b3_service_orders_expand_only.sql). Gate deployment production tetap terpisah.

### Ringkasan untuk pengguna nonteknis

- **AHU** mengesahkan/mendaftarkan bentuk usahanya; **OSS** menerbitkan NIB dan izin sesuai risiko usahanya; **PPATK** bukan pemberi izin pendirian perusahaan. PPATK menerima laporan rahasia bila advokat/notaris menemukan transaksi yang wajib dilaporkan.
- Justica dapat membuat seluruh intake, checklist, BO/PMPJ, pembayaran, koordinasi notaris, dan pelacakan AHU/OSS menjadi digital. Justica belum boleh menjanjikan pengajuan pemerintah otomatis sebelum ada kontrak API/credential resmi.
- Foto KTP melalui WhatsApp tidak otomatis ilegal, tetapi alur ad-hoc sulit dikontrol dan diaudit. e-KYC dalam aplikasi lebih aman bila memakai provider sah, DPIA, retensi pendek, kontrol akses, dan jalur review manusia.
- AI liveness hanya memperkuat bukti bahwa orang yang hadir kemungkinan benar dan hidup. Keabsahan TTE tetap bergantung pada aturan UU ITE/PSrE; keabsahan akta autentik juga bergantung pada formalitas UU Jabatan Notaris/PPAT.
- Rekomendasi final: terima kedua ide secara bersyarat, beli primitive e-KYC/PSrE dari provider matang, mulai pilot concierge kecil, dan jangan coding sebelum `BASE-01` s.d. `BASE-04` ditutup.

## BAB I: REGULATORY & MARKET REALITY CHECK (PPATK, AHU, OSS & PSrE)

### 1.1 Arti sebenarnya dari “mendirikan PT/CV lewat web”

Empat nama yang disebut pengguna bukan satu sistem dan tidak menjalankan fungsi yang sama.

| System/actor | Actual role | What Justica may safely promise | What Justica must not promise yet |
|---|---|---|---|
| **Notary** | Drafts and executes the notarial deed required for an ordinary capital-partnership PT and a CV, checks parties and documents, and acts as the professional applicant in the relevant AHU workflow. | Intake, document checklist, appointment, draft/review, payment, status tracking, and evidence hand-off to a partner notary. | That every authentic deed can be executed entirely remotely by clicking a PSrE signature. |
| **Ditjen AHU** | Legal administration. `SABH` handles, among others, PT; `SABU` handles non-legal-entity businesses such as CV/firma/civil partnerships. BO data is part of the corporate process. | Guided AHU submission by an authorized notary/applicant and capture of official receipt/decision references. | A public, unrestricted AHU API or automatic approval. No public production API contract was found in the official material reviewed. |
| **OSS RBA** | Issues the NIB and risk-based business licensing after/alongside entity formation. Since 2025 the controlling framework is **PP 28/2025**, not the superseded PP 5/2021. | KBLI/risk intake, OSS checklist, assisted submission, NIB/licence status, and evidence capture. | That NIB alone is sufficient for every risk category or sectoral licence. |
| **PPATK/goAML** | AML reporting and supervision. A report is triggered by applicable professional duties and suspicious facts, not an ordinary approval step for every PT/CV. | PMPJ/CDD workflow, BO risk assessment, restricted compliance case, and export/handoff to the obliged professional. | “PPATK approval for company establishment,” or an automatic STR report visible to the customer. |

The official AHU guidance separates [SABH and SABU services](https://panduan.ahu.go.id/doku.php), while the PT and CV legal bases are respectively [Permenkumham 21/2021](https://www.peraturan.go.id/id/permenkumham-no-21-tahun-2021) and [Permenkumham 17/2018](https://www.peraturan.go.id/id/permenkumham-no-17-tahun-2018). A PT is a legal entity; a CV is a registered non-legal-entity partnership. A **Perseroan Perorangan** for qualifying micro/small enterprises is a separate electronic-statement route under [PP 8/2021](https://www.peraturan.go.id/id/pp-no-8-tahun-2021), so it must not be sold using the ordinary multi-founder PT workflow.

The correct end-to-end customer journey is:

1. Select entity type, founders, capital, domicile, KBLI, and intended activities.
2. Perform identity, sanctions/PEP, PMPJ/CDD, source-of-funds where risk requires it, and identify/verify each beneficial owner.
3. For an ordinary PT/CV, the notary reviews and executes the deed and submits through SABH/SABU.
4. Record AHU decision/registration and BO submission evidence.
5. Continue to OSS for NIB and the standard certificate/licence appropriate to the activity's risk under [PP 28/2025](https://peraturan.go.id/id/pp-no-28-tahun-2025) and its implementing [BKPM Regulation 5/2025](https://peraturan.bpk.go.id/Details/332573).
6. If the advocate/notary identifies a reportable suspicious transaction, that professional follows the confidential PPATK/goAML process. It is not a customer-visible “stage”.

The official [OSS portal](https://oss.go.id/) defines NIB as business identity, while the government's 2026 implementation update confirms OSS was adjusted to PP 28/2025 ([BKPM](https://www.bkpm.go.id/index.php/id/info/siaran-pers/pemerintah-sesuaikan-sistem-oss-dengan-pp-28-tahun-2025-perkuat-kepastian-dan-kemudahan-berusaha)). Therefore, old marketing or code that treats PP 5/2021 as the current top-level basis must be updated.

### 1.2 Kewajiban Beneficial Ownership, PMPJ, dan PPATK

[Perpres 13/2018](https://peraturan.bpk.go.id/Home/Details/73583/perpres-no-13-tahun-2018) requires covered corporations—including PT, foundations, associations, cooperatives, CV, firma, and civil partnerships—to identify and verify their beneficial owners during establishment/registration/licensing and while operating. The verification/supervision regime is further updated by [Permenkum 2/2025](https://portal.ahu.go.id/uploads/858944_permenkum-no-2-tahun-2025.pdf). BO is the natural person who ultimately owns, controls, benefits from, appoints/removes management, or otherwise exercises effective control; it is not safely inferred from the name on one share certificate.

For Justica, BO compliance means a structured questionnaire, ownership/control graph, documentary evidence, risk flags, reviewer decision, and an official-submission reference. A free-text “nama pemilik” field is not sufficient. AHU's own public material reported weak self-declaration quality and only partial reporting in 2025, and in 2026 reported approximately 823,000 corporations still had not reported BO ([AHU 2025](https://portal.ahu.go.id/id/detail/75-berita-lainnya/6150-ditjen-ahu-dorong-penguatan-transparansi-pemilik-manfaat-korporasi), [AHU 2026](https://portal.ahu.go.id/id/detail/75-berita-lainnya/6525-obrolan-media-gathering-dirjen-ahu-ungkap-823-000-korporasi-belum-laporkan-beneficial-owner)). This is a genuine product opportunity: completeness and evidence quality, not merely form filling.

[PP 43/2015](https://www.peraturan.go.id/id/pp-no-43-tahun-2015), as amended by PP 61/2021, includes advocates, notaries, and PPAT among professions subject to AML reporting duties for specified transactions. PPATK states that suspicious-transaction reporting applies when those professionals act for users in activities such as buying/selling property, managing money/securities/accounts, operating/managing a company, or establishing/buying/selling a legal entity ([PPATK reporting guidance](https://www.ppatk.go.id/pelaporan/read/50/)). Advocate PMPJ is governed by [PPATK Regulation 10/2017](https://www.peraturan.go.id/id/peraturan-ppatk-no-10-tahun-2017); professional goAML reporting is addressed by [PPATK Regulation 3/2021](https://peraturan.go.id/id/peraturan-ppatk-no-3-tahun-2021); and the current notary PMPJ regime must account for [Permenkum 10/2026](https://www.peraturan.go.id/files/permenkum-no-10-tahun-2026.pdf).

**Architecture consequence:** Justica assists the obliged advocate/notary but does not become the legal decision-maker by UI design. The professional must own the risk acceptance, enhanced due diligence, rejection, and any PPATK report. STR existence and content must be segregated from ordinary case data and customer-visible status to avoid confidentiality/tipping-off risk.

### 1.3 Realitas pasar dan batas monetisasi

The market validates paid, transactional incorporation services, but it also shows price pressure and bundle ambiguity. As of this audit, first-party pages advertise roughly:

| Public offer snapshot | Advertised price | Audit implication |
|---|---:|---|
| Legalitas.org CV | Rp2.25m basic; Rp4.5m with licences; Rp6.6m with licences + virtual office | Entry price is competitive; scope, geography, tax, PNBP, and partner fees must be explicit. [Source](https://legalitas.org/cv) |
| Kontrak Hukum CV | Rp2.99m basic to Rp11.99m PKP bundle, before VAT | Customers compare bundles, not just the deed. [Source](https://kontrakhukum.com/jasa-pendirian-cv/) |
| Easybiz | PT/CV from Rp5m; PT Perorangan from Rp1.4m | Brand, turnaround, and service coverage command a premium. [Source](https://www-v2.easybiz.id/) |
| Easybiz CV detailed packages | Rp5m–Rp11.7m, before VAT | There is room for milestone and add-on revenue, but pass-through items must not be presented as Justica margin. [Source](https://www-v2.easybiz.id/layanan/paket-pendirian-cv) |

These are advertised prices, not audited transaction data. The defensible revenue hypothesis is a fixed service fee plus transparent pass-through lines for notary, PNBP, licences, PSrE/e-KYC, e-Meterai, tax, and optional virtual-office/compliance services. “High-ticket” is plausible for complex PT/PMA/licensing work, but not proven for every PT/CV order.

### 1.4 Privy, PSrE, dan arti hukum tanda tangan digital

Privy's documented business workflow is close to the user's story: upload a document through API, assign participants, choose roles/order, notify them, run identity/signing sessions, receive callbacks, and retain an audit trail. Privy documents signer/reviewer/approver roles and serial ordering ([Privy workflow](https://privy.id/blog/cara-membuat-tanda-tangan-digital/)) and exposes signing integration features including API, OAuth, webhooks, and document management ([Privy Digital Signature](https://privy.id/id/digital-signature)).

However, legal effect does not arise because the user “clicked agree” or because Justica ran face recognition. Under the Indonesian trusted-services framework, a certified TTE uses an electronic certificate issued by a recognized Indonesian PSrE and a certified signing device/process. The official [Komdigi PSrE portal](https://tte.komdigi.go.id/) explains identity and integrity requirements; [Permenkominfo 11/2022](https://jdih.komdigi.go.id/produk_hukum/view/id/833/t/peraturan%2Bmenteri%2Bkomunikasi%2Bdan%2Binformatika%2Bnomor%2B11%2Btahun%2B2022?search=manajemen+layanan+spbe) governs recognized PSrE services; and the current ITE basis includes [UU 1/2024](https://www.peraturan.go.id/id/uu-no-1-tahun-2024). Current PSrE status must be rechecked on the Komdigi registry on procurement and before go-live; an old badge or vendor blog is not sufficient.

**Non-negotiable scope boundary:** Article 16(1)(m) of the amended Notary Law requires an authentic deed to be read before the appearers and witnesses and signed at that time by the appearers, witnesses, and notary ([UU 2/2014 official text](https://peraturan.bpk.go.id/Home/Download/27815/UU%20Nomor%2002%20Tahun%202014.pdf)). Phase 2 may digitize private agreements, consents, powers, forms, draft approval, and supporting documents where legally permitted. It must not claim that every authentic notarial or PPAT deed can be completed “100% remotely” solely through a PSrE workflow. A document-type legal matrix and partner-notary SOP must decide eligibility.

### 1.5 WhatsApp KTP, UU PDP, deepfake, dan AI liveness

The statement “sending a KTP photo through WhatsApp is automatically illegal” is **not proven and must not be used**. It may be lawful if there is a valid processing basis, clear notice, necessity/proportionality, processor governance, access control, retention/deletion, transfer safeguards, and security. The operational problem is that ad-hoc forwarding to personal/group chats creates uncontrolled copies, weak least-privilege access, uncertain retention, poor subject-rights handling, weak evidence lineage, and a larger breach surface.

KTP/identity data are personal data, and biometric templates used for unique identification are specific personal data under [UU PDP 27/2022](https://www.peraturan.go.id/id/uu-no-27-tahun-2022). The law requires lawful, limited, specific, transparent, purpose-bound, accurate, and secure processing. Because liveness/face matching processes specific data, uses new technology and automated scoring, and may materially deny service, Justica must complete a DPIA before production, assess the statutory DPO requirement, provide human review/fallback, define short retention, and contractually govern processors/subprocessors and cross-border transfers.

AI liveness is a **security and evidence control**, not an independent source of legal validity. It lowers impersonation/replay/deepfake risk only when the implementation covers presentation attacks and injection attacks, measures false accept/reject performance, rate-limits retries, and provides manual recovery. Procurement should require an independent ISO/IEC 30107-3 report with APCER/BPCER results—not just an “RGB circle” demo—and evaluate current NIST guidance on [presentation-attack detection](https://pages.nist.gov/frvt/html/frvt_pad.html) and [SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html).

Direct Dukcapil verification also cannot be assumed to be an open lookup API. [Permendagri 17/2023](https://peraturan.go.id/id/permendagri-no-17-tahun-2023) requires governed access, cooperation terms, purpose restrictions, security standards, and prohibits passing population data to third parties outside the agreement. Justica should therefore buy verification from a provider with demonstrable lawful access or obtain its own formal entitlement; it must not scrape or retain a shadow population database.

### 1.6 Koreksi e-Meterai

The phrase **“PERURI SHA-256” is not an accurate description of the current Justica capability**. Official DJP guidance describes e-Meterai as payment of tax on qualifying documents and explicitly states that the stamp is not the determinant of a document's validity ([DJP e-Meterai](https://www.pajak.go.id/id/artikel/e-meterai-pajak-dokumen-elektronik)). Justica's `sha256_document_hash` is its own document-integrity/index anchor. It is not proof that PERURI stamped the document, not the official e-Meterai cryptographic specification, and not a replacement for a certified TTE.

The production verifier must separately report:

1. Justica document digest/audit-anchor match;
2. PSrE certificate/signature-chain and timestamp status; and
3. e-Meterai serial/stamping evidence where the document is stamp-tax liable.

None of those checks alone proves the underlying transaction was lawful or that a notarial formality was satisfied.

## BAB II: ARCHITECTURAL FEASIBILITY & REPOSITORY INTEGRATION FIT

### 2.1 Temuan fisik repository

The feasibility result is **buildable, but not by reusing the five MVP tables unchanged**.

Jejak bukti fisik yang menjadi dasar klasifikasi ini:

| Bukti lokal | Lokasi fisik |
|---|---|
| `users_client` | `supabase/migrations/20260715000001_domain1_identity_rbac_licensing.sql:14` |
| `booking_sessions` | `supabase/migrations/20260715000002_domain2_consultation_fairclock_sla.sql:50` |
| `escrow_transactions` | `supabase/migrations/20260715000003_domain3_escrow_tax_ledgers_acid.sql:12` |
| `fn_prevent_worm_mutation`, `legal_opinions`, `emeterai_stamping_logs`, dan policy publik | `supabase/migrations/20260715000004_domain4_legal_opinions_worm_emeterai.sql:14`, `:27`, `:112`, `:131` |
| Verifier mock `verifyHash.startsWith('e8')` | `justifiqa-frontend/src/hooks/usePublicVerifier.ts:26` |

Audit ini memeriksa definisi migration, bukan hanya dokumentasi atau nama komponen UI. Klasifikasi “tamper-evident trigger”, “schema/RLS ready”, dan “mock verifier” karena itu mengikuti artefak yang benar-benar hidup di repository.

Kontrak mutex yang harus dipreservasi adalah `fn_book_consultation_slot_mutex`, `fn_release_escrow_to_advocate_mutex`, dan `fn_refund_escrow_to_client_mutex`; helper RLS KYC advokat adalah `fn_is_verified_advocate`. Fitur corporate order tidak boleh memanggil RPC booking seolah-olah corporate case adalah slot konsultasi. `BASE-01` tetap wajib menghapus ketidaksamaan nama RPC lama pada migration, caller frontend, dan generated types sebelum aggregate baru masuk.

| Physical object | Current contract found in migrations | Gap for Phase 2 |
|---|---|---|
| `users_client` | One client identity; `nik`; coarse `kyc_status` (`UNVERIFIED/PENDING/VERIFIED/REJECTED`). | No KYC attempt, provider, consent, assurance level, retry, evidence digest, expiry, or human-review history. |
| `booking_sessions` | Consultation booking with mandatory `slot_id`, one client, one advocate, and consultation states. | A months-long incorporation case is not a consultation slot and may involve notary, compliance reviewer, and government submissions. |
| `escrow_transactions` | One `booking_id`, client, advocate, gross amount, payout ratios, and consultation release/refund states. | No milestones, fee lines, multiple payees, PNBP/provider pass-through, partial refund, or corporate service order. |
| `legal_opinions` | One booking/client/advocate, one opinion lifecycle, one PDF path. | Not a generic document/envelope aggregate; cannot represent deed drafts, corporate forms, multiple documents, A/B/C participants, serial/parallel signing, or declines/expiry. |
| `emeterai_stamping_logs` | WORM-triggered rows linked only to `opinion_id`, with serial and `sha256_document_hash`; public `SELECT USING (true)`. | Cannot safely become a biometric store; cannot attach to generic documents; current public policy exposes rows more broadly than a minimal verifier RPC. |

Repository proof also shows the public React route exists, but its verifier still accepts a mock prefix (`hash.startsWith('e8')`) instead of hashing the uploaded bytes and querying authoritative data. There is no local corporate-formation, BO, signing-envelope, signer-participant, KYC-session, liveness-evidence, or provider-webhook domain.

Set reconciliation:

```text
S_current  = {users_client, booking_sessions, escrow_transactions,
              legal_opinions, emeterai_stamping_logs}

S_required = S_current ∪ {service_orders, corporate_service_cases,
              corporate_parties, beneficial_owners, compliance_assessments,
              government_submission_jobs, service_fee_lines,
              payment_milestones, document_envelopes, envelope_documents,
              document_participants, signing_events,
              identity_verification_sessions, verification_evidence,
              provider_webhook_events, document_integrity_anchors}

S_current != S_required
```

Therefore neither feature is code-ready until its domain contracts, RLS matrix, state machines, and migrations pass P2.0 admission.

### 2.2 Aggregate target dan integrasi layanan PT/CV

Do not overload `booking_sessions`. Introduce a generic `service_orders` seam and keep consultation behavior backward-compatible.

| New/changed contract | Minimum fields and invariants |
|---|---|
| `service_orders` | `order_id`, `client_id -> users_client`, `service_type`, `status`, `origin_booking_id NULL -> booking_sessions`, `assigned_professional_id`, `currency`, timestamps. `service_type` starts narrowly: `PT_ORDINARY`, `PT_INDIVIDUAL_UMK`, `CV`. |
| `corporate_service_cases` | `case_id`, `order_id UNIQUE`, entity type/name/domicile/KBLI snapshot, current stage, target SLA, assigned notary/compliance reviewer, `legal_scope_version`. No customer-visible STR flag. |
| `corporate_parties` | Founder/shareholder/director/commissioner/active partner/passive partner roles; identity reference; ownership/voting percentages with effective dates. |
| `beneficial_owners` | Natural-person reference, control basis, ownership/control percentage, source evidence digest, verification result/date/reviewer, AHU submission reference. Enforce natural-person-only and versioned declarations. |
| `compliance_assessments` | Restricted schema; CDD/EDD level, PEP/sanctions/provider checks, risk score + rules version, reviewer decision and rationale. RLS only for the assigned professional/compliance role. |
| `government_submission_jobs` | `system` (`AHU_SABH`, `AHU_SABU`, `AHU_BO`, `OSS`), status, authorized submitter, external reference, request/response digest, submitted/decided timestamps, retry/idempotency key. Store no credentials. |
| `service_fee_lines` | Separate `JUSTICA_FEE`, `NOTARY_FEE`, `PNBP`, `PSRE`, `EKYC`, `EMETERAI`, `TAX`, and other approved lines. Immutable quoted amount/version after acceptance. |
| `payment_milestones` | Deposit/intake, notary-ready, AHU-complete, OSS-complete; amount, releasable party, evidence condition, dispute/refund rule. Sum must reconcile to fee lines. |

Relationship to existing MVP tables:

```text
users_client ──< service_orders ──1 corporate_service_cases
                         │
                         ├── origin_booking_id ──> booking_sessions (optional discovery consultation)
                         ├──< service_fee_lines
                         └──< payment_milestones ──< service_escrow_allocations

escrow_transactions (MVP consultation path remains unchanged)
```

An initial corporate order may originate from a consultation, but `origin_booking_id` must be optional. Forcing every company order to fabricate a consultation slot would corrupt semantics. Escrow extension should use an **expand-only migration**: add `service_escrow_allocations` that references the existing escrow row and milestone, or later introduce a generic payment aggregate behind an adapter. Do not make `booking_id` nullable or alter current release/refund RPC behavior in the first tracer batch.

Suggested corporate case states:

```text
DRAFT -> IDENTITY_PENDING -> CDD_REVIEW -> DOCUMENTS_PENDING
      -> NOTARY_REVIEW -> AHU_SUBMITTED -> AHU_APPROVED
      -> OSS_PENDING -> NIB_ISSUED -> COMPLETED

Any active stage -> COMPLIANCE_HOLD | CUSTOMER_ACTION_REQUIRED | CANCELLED
AHU_SUBMITTED     -> AHU_REJECTED -> NOTARY_REVIEW
OSS_PENDING       -> OSS_REJECTED -> CUSTOMER_ACTION_REQUIRED
```

Only server-side transition functions may mutate these states. All provider/government callbacks require signature verification, an idempotency key, replay protection, append-only event logging, and outbox/retry handling.

### 2.3 Aggregate target untuk multi-party signing dan e-KYC

Do not attach A/B/C directly as columns on `legal_opinions`. Create a generic envelope that can reference a legal opinion or a corporate-case document without coupling the domains.

| Contract | Minimum fields/invariants |
|---|---|
| `document_envelopes` | `envelope_id`, `order_id`, title, purpose, `document_type`, eligibility decision/version, provider adapter, routing mode (`SERIAL/PARALLEL/MIXED`), status, expiry, created_by. |
| `envelope_documents` | Versioned source/final object references, MIME/size, SHA-256 before and after signing, `legal_opinion_id NULL`, `corporate_case_id NULL`; exactly one owning aggregate; no mutable overwrite of a finalized version. |
| `document_participants` | Party/user reference, role (`SIGNER/REVIEWER/APPROVER/NOTARY/WITNESS`), routing order, required flag, provider subject token, identity-session reference, state and timestamps. No private signing key. |
| `signing_events` | Append-only invite/view/consent/OTP/sign/decline/expire/provider callback events; payload digest, provider event ID, server timestamp, client metadata minimized. |
| `identity_verification_sessions` | Provider, purpose, lawful-basis/notice version, assurance level, OCR/liveness/face-match states, score bands, thresholds/model version, attempt count, reviewer state, started/expires/completed timestamps. |
| `verification_evidence` | Hashes of request/response/audit bundle, provider evidence ID, result, retention/deletion deadline, object reference only if strictly necessary. Raw KTP/selfie/video must not enter the WORM database. |
| `provider_webhook_events` | Provider event ID `UNIQUE`, signature validation result, received/processed timestamps, payload hash, processing error/retry count. Payload encrypted and short-lived if retained. |
| `document_integrity_anchors` | Generic document-version FK, hash algorithm/digest, source (`JUSTICA`, `PSRE`, `EMETERAI`), certificate serial/timestamp token/OCSP snapshot references, provider transaction ID, anchored time. Append-only. |

Envelope states:

```text
DRAFT -> IDENTITY_PENDING -> READY -> IN_PROGRESS -> ALL_SIGNED
      -> STAMPING_PENDING (only if applicable) -> COMPLETED

IN_PROGRESS -> DECLINED | EXPIRED | VOIDED | PROVIDER_FAILED
participant: INVITED -> IDENTITY_PENDING -> VERIFIED -> READY -> SIGNED
                                      \-> REJECTED/HUMAN_REVIEW
```

The provider, not Justica, should control certificate issuance and private signing keys. Justica stores provider transaction IDs, certificate serials, signature/timestamp/audit hashes, and validation snapshots. For each participant, identity proofing and signing consent must be traceably bound to the exact pre-sign document digest.

### 2.4 Pengikatan bukti liveness ke e-Meterai dan BASE-04

Liveness evidence must not be inserted into `emeterai_stamping_logs`. The safe chain is:

```text
identity_verification_session
  -> verification_evidence (provider evidence ID + audit-bundle hash)
  -> document_participant
  -> signing_event (consent/sign event + exact document digest)
  -> envelope_document final version
  -> document_integrity_anchor (PSrE/e-Meterai/Justica)
  -> public verification projection
```

`emeterai_stamping_logs` remains a legacy opinion-stamping log until a deliberate migration creates a generic `document_stamping_events` table. The new table may backfill legacy rows by reference; it must not rewrite or delete WORM history.

The BASE-04 verifier must use a security-definer/server RPC or edge endpoint that returns an allow-listed projection—not public table access via `USING (true)`. Minimum public response:

| Public | Never public |
|---|---|
| Document verification ID, digest match yes/no, document type/title if consented, issuance/finalization time, signature provider/certificate status, e-Meterai serial/status where applicable, revocation/expiry warning. | NIK, KTP image, selfie/video, biometric template/score, residential address, phone/email, provider raw payload, BO/CDD flags, STR/goAML data, storage path, internal UUIDs that enable enumeration. |

The React verifier must compute SHA-256 from the actual file bytes, query the minimal backend, support QR deep links containing a random public verification token rather than a predictable row ID, rate-limit enumeration, and log abuse without storing the uploaded document. A successful page means “this file matches the anchored record and reported provider checks”; it must not state “the transaction is legally valid”.

### 2.5 Kontrol keamanan, privasi, dan operasional

| Control | Go-live requirement |
|---|---|
| Data minimization | Vendor-hosted biometric processing preferred. Store only result/evidence references and hashes; delete raw captures after the shortest justified period. WORM and data-subject deletion duties must not conflict. |
| Encryption and access | Private object bucket, per-object authorization, envelope encryption/KMS, no public URL, short-lived signed download, service-role isolation, break-glass logging. Supabase Storage is storage—not KYC—and signed URLs are not a liveness or revocation control ([Supabase Storage](https://supabase.com/docs/guides/storage)). |
| DPIA and human fallback | DPIA approved before real subjects; explicit notice/consent where used as basis; non-biometric/manual fallback; accessible retry; human review before material rejection. |
| Provider governance | DPA, subprocessor list, data location/transfer, retention/deletion API, breach SLA, lawful Dukcapil access, current PSrE recognition, independent PAD report, BCP/exit/export. |
| Threat model | Printed/photo/video replay, masks, deepfake and virtual-camera injection, emulator/root/jailbreak, session takeover, webhook replay, document swap after KYC, signer-order bypass, QR enumeration, insider export. |
| Audit | Append-only event ledger + true object-lock archive in Phase 3. Database triggers are tamper-evident application controls, not true WORM against database administrators. |

## BAB III: THIRD-PARTY AI & KYC PROVIDER BENCHMARK (INDONESIA & GLOBAL)

### 3.1 Kriteria keputusan

Providers are compared on six separate capabilities. A single marketing page must not collapse them into one “compliance” claim:

1. Indonesian identity source access and KTP OCR;
2. face match and passive/active liveness with independent PAD evidence;
3. recognized Indonesian PSrE/certified TTE;
4. multi-party document API, callbacks, serial/parallel routing, and audit export;
5. official e-Meterai channel; and
6. PDP/data-location, deletion, subprocessor, and commercial terms.

### 3.2 Matriks provider berbasis bukti

| Provider | Evidence-supported fit | Gaps / procurement questions | Verdict |
|---|---|---|---|
| **Privy** | Closest all-in-one: KTP OCR, identity verification/liveness claims, digital certificates, document signing API, participant workflow, webhooks, and e-Meterai offering ([identity](https://privy.id/id/identity-verification), [signing](https://privy.id/id/digital-signature), [home](https://privy.id/id)). Privy has appeared on the official PSrE list; current status must still be rechecked. | Obtain current PSrE recognition evidence, sandbox coverage, PAD lab report and thresholds, Dukcapil entitlement chain, data location/retention, subprocessor list, webhook signing, bulk/export/exit, and per-component quote. | **Preferred single-vendor pilot**, subject to RFP and legal/security evidence. |
| **VIDA** | Strong full stack: identity verification with OCR, passive liveness and face match to official sources, signing/identity platform, and e-Meterai offering ([VIDA Verify](https://vida.id/id/verify_112025), [Identity Stack](https://vida.id/identitystackpage), [FAQ](https://vida.id/en/vidafaq)). Its security material references ISO/IEC 30107 ([framework](https://www.vida.id/hubfs/Trust%20Center%20-%20Policies%20and%20Docs/GRC-Product%20Security%20Framework-020125-111305.pdf?hsLang=en)). | Require the actual independent PAD evaluation scope/results, not just a framework reference; confirm routing roles, LTV/timestamp, SDK device integrity, retention/deletion, and commercial minimums. | **Preferred alternative/full-stack challenger**. Run head-to-head with Privy. |
| **Mekari Sign** | Mature signing/document workflow, certified/uncertified signature options, e-Meterai, eDMS, API documentation, and partner-PSrE model ([product](https://mekari.com/produk/sign/), [API](https://developers.mekari.com/docs/kb/product-api), [terms](https://mekari.com/persyaratan-layanan/)). | Mekari's terms distinguish its service from external PSrE. Confirm which PSrE and identity provider process each flow, chain of processors, liveness/PAD evidence, certificate ownership, portability, and incident responsibility. | **Good workflow/e-Meterai candidate**; pair or compare for identity proofing. |
| **Verihubs** | Modular API/SDK option for liveness and face comparison; public docs expose liveness and face endpoints ([liveness](https://docs.verihubs.com/docs/liveness), [face API](https://docs.verihubs.com/docs/api-request-response)). OJK recorded it in an authentication cluster in 2023 ([OJK](https://gesit.ojk.go.id/GESIT/More/Berita/47)). | 2023 OJK status is not proof of a current licence/approval. Verify current regulatory status, lawful identity source, independent PAD report, data residency, and production SLA. It is not evidenced here as a PSrE/e-Meterai provider. | **Strong modular e-KYC PoC**, paired with a current PSrE. |
| **ASLI RI** | Markets OCR, anti-forgery, face biometrics/liveness, and digital-onboarding/signature solutions ([digital onboarding](https://www.asliri.id/en/solutions/digital-onboarding), [company site](https://www.asliri.id/)). | Public technical evidence is thinner. Obtain current PSE/PSrE status distinction, Dukcapil entitlement, independent PAD numbers, API/webhook docs, data-flow diagram, retention/deletion, and references. Do not treat a PSE registration as PSrE recognition. | **Include in RFP**, not default selection without evidence. |
| **AWS Rekognition Face Liveness** | Mature global liveness component; returns a confidence score, reference image and audit images and explicitly says it is probabilistic and should be combined with other factors ([AWS docs](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness.html)). Public consumption pricing enables a cheap technical PoC ([pricing](https://aws.amazon.com/rekognition/pricing/)). | Not Indonesian KTP OCR, not Dukcapil verification, not PSrE, not e-Meterai. Current region list includes several Asia regions but not Jakarta, creating transfer/residency and latency concerns ([FAQ](https://docs.aws.amazon.com/rekognition/latest/dg/face-liveness-faq.html)). Justica would own orchestration, risk, and legal integration. | **Fallback component only**, not the recommended production stack for this use case. |
| **Supabase Storage** | Private buckets, RLS, and signed delivery are useful for encrypted evidence/document objects ([docs](https://supabase.com/docs/guides/storage)). | It performs no OCR, liveness, official identity verification, PSrE signature, or e-Meterai. A signed URL is access plumbing, not consent, identity assurance, or biometric compliance. | **Storage layer only**; never score it as a KYC provider. |

### 3.3 Strategi sourcing yang direkomendasikan

**Recommendation:** buy, do not build, the biometric and certified-signature primitives.

1. Run a paid, time-boxed bake-off between **Privy and VIDA** as full-stack candidates.
2. Include **Mekari Sign** where its document workflow/e-Meterai economics are better, with explicit mapping of the underlying PSrE and KYC processors.
3. Include **Verihubs and ASLI RI** as modular KYC challengers only if pairing them with the selected PSrE produces better assurance and unit economics.
4. Keep AWS Rekognition as a test/control option, not the Indonesian compliance anchor.
5. Use Supabase private storage only for the minimum document/evidence objects Justica must retain; provider-side short retention is preferable for raw biometric captures.

The PoC must use at least genuine-device consenting test subjects plus controlled attack media and must measure completion rate, false rejects, attack acceptance, SDK size/latency, manual-review rate, callback reliability, and per-completed-case cost. A vendor is rejected if it cannot provide:

- current Komdigi PSrE proof for certified signatures, where applicable;
- legal basis/contractual chain for official identity-source access;
- independent ISO/IEC 30107-3 PAD report with relevant device/channel coverage;
- DPA, subprocessors, storage regions, retention/deletion, and cross-border controls;
- signed/idempotent webhooks and an exportable audit package;
- transparent prices for KYC attempt, successful verification, certificate, signature, e-Meterai, storage, manual review, and minimum commitment.

No reliable public apples-to-apples pricing exists for the Indonesian vendors reviewed; a sales quote must not be treated as evidence until normalized to **cost per successfully completed order**, including failed attempts and manual review.

## BAB IV: P2.0 ADMISSION & ROADMAP RECOMMENDATION

### 4.1 Putusan admission

| Candidate | Decision | Admitted scope | Excluded until a later gate |
|---|---|---|---|
| **Feature 1 — PT/CV establishment** | **CONDITIONALLY ADMIT** | Managed/concierge workflow for PT ordinary, PT Perorangan UMK, and CV; structured BO/PMPJ; notary partner; AHU/OSS handoff and evidence; milestone billing. Start with one narrow product/geography. | Uncontracted direct AHU/OSS/goAML automation; automatic AML decision/reporting; “instant approval”; all licence types/PMA at launch. |
| **Feature 2A — Multi-party PSrE signing** | **CONDITIONALLY ADMIT** | Private agreements and legally eligible supporting documents; serial/parallel roles; certified TTE through a current PSrE; e-Meterai where liable; audit and public integrity verification. | Blanket claim that every authentic notarial/PPAT deed can be signed remotely. |
| **Feature 2B — AI e-KYC/liveness** | **CONDITIONALLY ADMIT AS A BOUGHT SERVICE** | OCR, liveness, face match, human fallback, and evidence binding through a vetted Indonesian provider. | Training an in-house biometric model, storing raw biometric media in WORM, or fully automated irreversible rejection. |

### 4.2 Discrete batch breakdown dan exit gate

No feature-expansion migration may be merged until Batch P2-B0 closes all baseline blockers.

| Batch | Deliverable | Required exit evidence |
|---|---|---|
| **P2-B0 — Baseline closure** | `BASE-01`: choose the canonical checkout RPC and align migration/callers/types. `BASE-02`: review and track or supersede migrations `...00010`/`...00011`; prove clean replay. `BASE-03`: regenerate DB types and prove schema/RPC diff zero. `BASE-04`: replace verifier mock with real file hashing, minimal backend projection, rate limiting, QR token, negative tests, and deployment evidence. | Clean checkout; `supabase db reset`/migration replay; RPC smoke tests including mutex concurrency; generated types diff; verifier found/not-found/tampered/rate-limit tests; updated baseline manifest marked closed. |
| **P2-B1 — Legal scope and partner discovery** | Document eligibility matrix; PT ordinary/PT Perorangan/CV flow; notary/advocate responsibility matrix; AHU/OSS/goAML manual-vs-API matrix; one partner-notary LOI; fee/refund policy. | Written Indonesian counsel + partner-notary sign-off; no unsupported API dependency; customer promise and exclusions approved. |
| **P2-B2 — Provider RFP, DPIA, and threat model** | Privy/VIDA/Mekari/Verihubs/ASLI evidence pack; PoC; normalized unit economics; DPIA; processor/subprocessor map; biometric threat model; incident/deletion runbook. | Selected provider contract/sandbox; current PSrE check; PAD evidence; lawful identity-source chain; DPA/transfer approval; human fallback; kill criteria satisfied. |
| **P2-B3 — Generic service-order tracer** | Expand-only `service_orders`, `service_fee_lines`, milestones, feature flag, idempotent commands, RLS. Link an optional discovery `booking_session`; preserve existing booking/escrow RPCs. | Fresh migration replay; old consultation E2E unchanged; tenant-crossing/RLS negative tests; money reconciliation/property tests; rollback by feature flag. |
| **P2-B4 — Corporate concierge pilot** | `corporate_service_cases`, parties, BO graph, restricted compliance assessment, document checklist, notary tasking, manual AHU/SABU/OSS evidence/status. Launch one product in one supported region to invited customers. | 5–10 paid cases completed; partner SLA and document accuracy measured; no production credentials in DB; BO completeness review; positive contribution margin before expansion. |
| **P2-B5 — e-KYC adapter** | Provider-neutral interface, identity sessions/evidence hashes, consent/notice versions, callback verification, retry/manual review, deletion job. | Sandbox attack/retry tests; no raw biometric in database logs/WORM; retention deletion verified; accessibility/manual path; observability without PII leakage. |
| **P2-B6 — Multi-party envelope tracer** | Generic envelope/documents/participants/events; serial and parallel routing; exact-digest binding; one PSrE adapter; private/supporting-document allow-list. | A/B/C happy path; decline/expiry/retry/provider outage/document-swap/webhook-replay tests; certificate/timestamp validation; legal eligibility guard blocks unsupported deed types. |
| **P2-B7 — e-Meterai and verification hardening** | Generic stamping/integrity anchors, e-Meterai only when applicable, PSrE validation metadata, public projection and QR. Preserve legacy WORM rows. | Tamper test, revoked/expired certificate states, duplicate serial/idempotency, privacy enumeration test, public response contains zero KTP/biometric/BO data. |
| **P2-B8 — Controlled GA and economics gate** | Prepaid/fixed-scope packages, transparent pass-through fees, support SLA, provider failover/export drill, monthly compliance review. | Measured completion time, conversion, cost per completed order, manual-review load, refund/dispute rate, security incidents, and contribution margin meet approved thresholds for two cohorts. |
| **P3-B1 — True WORM archive** | Replicate final audit bundles and signed documents to AWS S3 Object Lock Compliance Mode (or equivalent legally approved immutable storage), with retention governance and restore drills. | Object-lock policy proof, retention/legal-hold approval, restore and independent tamper test. Database trigger alone is never relabelled “True WORM”. |

### 4.3 Eksekusi komersial tanpa bakar uang

1. Start as a **software-assisted managed service**, not a nationwide fully automated platform. One notary partner, one geography, and one or two entity products produce real failure and margin data.
2. Charge a deposit before manual work. Quote Justica fee, notary fee, PNBP, provider transactions, e-Meterai, tax, and optional add-ons separately. Release escrow by accepted milestone, not by optimistic calendar date.
3. Do not subsidize unlimited KYC retries, notary revisions, licence categories, or customer-caused resubmissions. Package includes explicit limits and a priced change order.
4. Buy PSrE/e-KYC per transaction; do not fund an in-house biometric model or broad AHU/OSS automation before contracts and volume justify it.
5. Expand only after the pilot shows positive contribution margin: revenue minus notary, PNBP, payment, PSrE/KYC/e-Meterai, storage, manual operations, refunds, and support.
6. Keep STR/goAML work outside ordinary monetization telemetry and customer status. Compliance cannot be gamified into “faster approval”.

Recommended decision thresholds must be approved during P2-B1/P2-B2; the initial defaults are:

- no GA if fewer than 80% of eligible paid pilot cases complete without unplanned senior intervention;
- no vendor commitment if total provider cost cannot be modeled per completed order or exit/export is unavailable;
- pause biometric automation if false rejects, accessibility failures, or manual-review load erase the promised operating saving;
- do not automate AHU/OSS submission without a written interface/credential agreement and an accountable professional operator;
- do not launch a document type if counsel/notary cannot state whether remote certified signing satisfies its formality;
- no scale-up while contribution margin is non-positive for two consecutive completed cohorts.

### 4.4 Kesimpulan arsitektur dan produk

Kedua ide strategis hanya setelah klaimnya dipersempit:

- **Pendirian PT/CV + BO/PMPJ + orkestrasi AHU/OSS** adalah layanan berbayar yang kredibel dan cocok dengan marketplace, evidence, serta pembayaran Justica. PPATK adalah rezim pelaporan AML bersyarat, bukan API pendirian atau badge persetujuan.
- **Multi-party PSrE signing + provider e-KYC** menghilangkan handoff WhatsApp yang tidak terkendali dan menghasilkan bukti yang lebih kuat. Liveness meningkatkan identity assurance, tetapi tidak membuat tanda tangan atau akta otomatis sah.
- Escrow mutex, trigger database tamper-evident, schema e-Meterai, dan mock verifier adalah fondasi yang berguna, bukan security stack unik yang sudah selesai. Diferensiasi defensible Phase 2 adalah **rantai bukti end-to-end**: identity session → participant consent → exact document digest → event PSrE/e-Meterai → public verification minimal, dengan least privilege, akuntabilitas manusia, dan provider teruji.
- Admission tetap diblokir sampai `BASE-01` s.d. `BASE-04` ditutup secara fisik. Setelah itu, jalankan P2-B1 s.d. P2-B8 berurutan di balik feature flag; jangan melewati gate legal scope, provider, DPIA, atau ekonomi.
