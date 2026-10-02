# SPESIFIKASI IMPLEMENTASI FISIK DDL POSTGRESQL/SUPABASE & ROW-LEVEL SECURITY (RLS) — JUSTICA
**Dokumen Arsitektur Eksekusi Fisik (Fase 4B)**  
**Kesesuaian:** 100% Simetris Dua Arah dengan Baseline ERD (`ERD_DATABASE_SCHEMA_SPECIFICATION.md` commit `0cad127`)

---

## 1. PENDAHULUAN & PRINSIP KEAMANAN DATA
Dokumen ini mendefinisikan implementasi fisik **Data Definition Language (DDL)** PostgreSQL 15+ / Supabase, **Row-Level Security (RLS)**, mekanisme penguncian baris konkurensi transaksional (**ACID Mutex Row Locks**), dan trigger perlindungan *Append-Only* (**WORM Immutability**) untuk 26 tabel database Justica.

---

## 2. BATCH 1: DOMAIN 1 — IDENTITY, RBAC & PROFESSIONAL LICENSING (TABEL 1 S.D. 7)

Berkas migrasi fisik untuk Batch 1 tersedia pada:  
[`database/migrations/01_domain1_identity_rbac_licensing.sql`](file:///D:/justificadll/database/migrations/01_domain1_identity_rbac_licensing.sql)

### 2.1 Ringkasan Implementasi Tabel & RLS Policy Domain 1

| No | Nama Tabel | Primary Key | Konfigurasi RLS | Kebijakan Akses (*RLS Policies*) | Status |
| :-: | :--- | :--- | :---: | :--- | :---: |
| 1 | `users_client` | `client_id` (`UUID`) | `ENABLED` | `rls_users_client_self_access`: Klien hanya dapat membaca & memperbarui profil dengan `client_id = auth.uid()`. | <color:green>COMPLETE</color> |
| 2 | `users_advocate` | `advocate_id` (`UUID`) | `ENABLED` | `rls_users_advocate_public_read`: Publik dapat membaca advokat berstatus `'VERIFIED'`.<br>`rls_users_advocate_self_update`: Advokat hanya dapat memperbarui status online profilnya sendiri. | <color:green>COMPLETE</color> |
| 3 | `users_admin` | `admin_id` (`UUID`) | `ENABLED` | `rls_users_admin_internal_access`: Akses terbatas pada staf kepatuhan/mediator berotentikasi internal. | <color:green>COMPLETE</color> |
| 4 | `user_active_devices` | `device_session_id` (`UUID`) | `ENABLED` | `rls_user_active_devices_self_manage`: Pengguna dapat memantau dan mencabut (*revoke*) perangkat loginnya sendiri. | <color:green>COMPLETE</color> |
| 5 | `sipp_verifications` | `verification_id` (`UUID`) | `ENABLED` | `rls_sipp_verifications_advocate_read`: Advokat dapat melihat riwayat verifikasi lisensi SIPP MA miliknya. | <color:green>COMPLETE</color> |
| 6 | `advocate_service_tiers` | `tier_id` (`UUID`) | `ENABLED` | `rls_advocate_service_tiers_public_read`: Klien dapat membaca katalog Tier aktif.<br>`rls_advocate_service_tiers_advocate_manage`: Advokat mengelola paket tarifnya sendiri. | <color:green>COMPLETE</color> |
| 7 | `advocate_sanctions_log` | `sanction_id` (`UUID`) | `ENABLED` | `rls_advocate_sanctions_advocate_read`: Advokat dapat membaca notifikasi sanksi SP 1-3 miliknya. | <color:green>COMPLETE</color> |

---

### 2.2 Verifikasi Aljabar Himpunan Simetris Batch 1 ($S_{\text{DDL}} = S_{\text{Baseline}}$)
* **Himpunan Tabel Baseline Bab 3 (1–7):**  
  `users_client`, `users_advocate`, `users_admin`, `user_active_devices`, `sipp_verifications`, `advocate_service_tiers`, `advocate_sanctions_log`.
* **Himpunan Tabel DDL Batch 1 (`01_domain1_identity_rbac_licensing.sql`):**  
  `users_client`, `users_advocate`, `users_admin`, `user_active_devices`, `sipp_verifications`, `advocate_service_tiers`, `advocate_sanctions_log`.
* **Bukti Matematis:**  
  $$S_{\text{DDL\_Batch1}} - S_{\text{Baseline\_Batch1}} = \emptyset \quad \land \quad S_{\text{Baseline\_Batch1}} - S_{\text{DDL\_Batch1}} = \emptyset$$

---

## 3. BATCH 2: DOMAIN 2 — CONSULTATION SESSIONS & FAIR-CLOCK SLA (TABEL 8 S.D. 12)

Berkas migrasi fisik untuk Batch 2 tersedia pada:  
[`database/migrations/02_domain2_consultation_fairclock_sla.sql`](file:///D:/justificadll/database/migrations/02_domain2_consultation_fairclock_sla.sql)

### 3.1 Ringkasan Implementasi Tabel & RLS Policy Domain 2

| No | Nama Tabel | Primary Key | Konfigurasi RLS | Kebijakan Akses (*RLS Policies*) | Status |
| :-: | :--- | :--- | :---: | :--- | :---: |
| 8 | `consultation_slots` | `slot_id` (`UUID`) | `ENABLED` | `rls_consultation_slots_public_read`: Publik dapat membaca slot berstatus `'AVAILABLE'`.<br>`rls_consultation_slots_advocate_manage`: Advokat mengelola slot miliknya sendiri. | <color:green>COMPLETE</color> |
| 9 | `booking_sessions` | `booking_id` (`UUID`) | `ENABLED` | `rls_booking_sessions_client_access`: Klien mengakses pesanan dengan `client_id = auth.uid()`.<br>`rls_booking_sessions_advocate_access`: Advokat mengakses pesanan miliknya. | <color:green>COMPLETE</color> |
| 10 | `offline_handshakes_totp`| `handshake_id` (`UUID`) | `ENABLED` | `rls_offline_handshakes_participant_access`: Hanya pihak sesi konsultasi terkait yang dapat memverifikasi QR tatap muka. | <color:green>COMPLETE</color> |
| 11 | `chat_sessions_metadata` | `chat_session_id` (`UUID`)| `ENABLED` | `rls_chat_sessions_metadata_participants`: Hanya pihak terkait yang dapat melakukan negosiasi kunci E2EE.<br>**Constraint Kritis:** `zero_knowledge_flag = true`. | <color:green>COMPLETE</color> |
| 12 | `advocate_reviews` | `review_id` (`UUID`) | `ENABLED` | `rls_advocate_reviews_public_read`: Publik dapat membaca ulasan.<br>`rls_advocate_reviews_client_submit`: Klien dapat memberikan ulasan atas pesanannya sendiri. | <color:green>COMPLETE</color> |

---

### 3.2 Verifikasi Aljabar Himpunan Simetris Batch 2 ($S_{\text{DDL}} = S_{\text{Baseline}}$)
* **Himpunan Tabel Baseline Bab 3 (8–12):**  
  `consultation_slots`, `booking_sessions`, `offline_handshakes_totp`, `chat_sessions_metadata`, `advocate_reviews`.
* **Himpunan Tabel DDL Batch 2 (`02_domain2_consultation_fairclock_sla.sql`):**  
  `consultation_slots`, `booking_sessions`, `offline_handshakes_totp`, `chat_sessions_metadata`, `advocate_reviews`.
* **Bukti Matematis:**  
  $$S_{\text{DDL\_Batch2}} - S_{\text{Baseline\_Batch2}} = \emptyset \quad \land \quad S_{\text{Baseline\_Batch2}} - S_{\text{DDL\_Batch2}} = \emptyset$$

---

## 4. BATCH 3: DOMAIN 3 — ESCROW TRANSACTIONS, TAX PPH 21 & LEDGERS (TABEL 13 S.D. 17)

Berkas migrasi fisik untuk Batch 3 tersedia pada:  
[`database/migrations/03_domain3_escrow_tax_ledgers_acid.sql`](file:///D:/justificadll/database/migrations/03_domain3_escrow_tax_ledgers_acid.sql)

### 4.1 Ringkasan Implementasi Tabel, RLS Policy & PL/pgSQL Domain 3

| No | Nama Tabel | Primary Key | Konfigurasi RLS | Kebijakan Akses (*RLS Policies*) / Proteksi ACID | Status |
| :-: | :--- | :--- | :---: | :--- | :---: |
| 13 | `escrow_transactions` | `escrow_id` (`UUID`) | `ENABLED` | `rls_escrow_transactions_client_read`: Klien membaca transaksi miliknya.<br>`rls_escrow_transactions_advocate_read`: Advokat membaca transaksi miliknya. | <color:green>COMPLETE</color> |
| 14 | `wallet_balances` | `wallet_id` (`UUID`) | `ENABLED` | `rls_wallet_balances_self_read`: Pemilik akun membaca saldo dompetnya sendiri. | <color:green>COMPLETE</color> |
| 15 | `escrow_payout_ledgers` | `ledger_id` (`UUID`) | `ENABLED` | `rls_payout_ledgers_wallet_owner_read`: Pemilik dompet membaca jejak mutasi miliknya. | <color:green>COMPLETE</color> |
| 16 | `tax_pph21_withholdings`| `tax_receipt_id` (`UUID`)| `ENABLED` | `rls_tax_pph21_advocate_read`: Advokat membaca bukti potong PPh 21 otomatis miliknya. | <color:green>COMPLETE</color> |
| 17 | `platform_governance_configs`| `config_key` (`VARCHAR`)| `ENABLED` | `rls_governance_configs_public_read`: Publik dapat membaca parameter transparansi Escrow. | <color:green>COMPLETE</color> |

#### Prosedur PL/pgSQL ACID Concurrency Lock
* **Fungsi:** `fn_release_escrow_to_advocate_mutex(p_escrow_id UUID)`
* **Mekanisme:** Mengeksekusi `SELECT ... FOR UPDATE` pada tabel `escrow_transactions` dan `wallet_balances`, memverifikasi *Guard Rule* (`status = 'HOLDING_PERIOD_24H'`), dan memperbarui saldo advokat serta mencatat riwayat mutasi dalam satu transaksi atomik ACID bebas *race condition*.

---

### 4.2 Verifikasi Aljabar Himpunan Simetris Batch 3 ($S_{\text{DDL}} = S_{\text{Baseline}}$)
* **Himpunan Tabel Baseline Bab 3 (13–17):**  
  `escrow_transactions`, `wallet_balances`, `escrow_payout_ledgers`, `tax_pph21_withholdings`, `platform_governance_configs`.
* **Himpunan Tabel DDL Batch 3 (`03_domain3_escrow_tax_ledgers_acid.sql`):**  
  `escrow_transactions`, `wallet_balances`, `escrow_payout_ledgers`, `tax_pph21_withholdings`, `platform_governance_configs`.
* **Bukti Matematis:**  
  $$S_{\text{DDL\_Batch3}} - S_{\text{Baseline\_Batch3}} = \emptyset \quad \land \quad S_{\text{Baseline\_Batch3}} - S_{\text{DDL\_Batch3}} = \emptyset$$

---

## 5. BATCH 4: DOMAIN 4 — LEGAL OPINIONS, IRAC NOTES & E-METERAI (TABEL 18 S.D. 21)

Berkas migrasi fisik untuk Batch 4 tersedia pada:  
[`database/migrations/04_domain4_legal_opinions_worm_emeterai.sql`](file:///D:/justificadll/database/migrations/04_domain4_legal_opinions_worm_emeterai.sql)

### 5.1 Ringkasan Implementasi Tabel, RLS Policy & WORM Trigger Domain 4

| No | Nama Tabel | Primary Key | Konfigurasi RLS | Kebijakan Akses (*RLS Policies*) / Proteksi WORM | Status |
| :-: | :--- | :--- | :---: | :--- | :---: |
| 18 | `legal_opinions` | `opinion_id` (`UUID`) | `ENABLED` | `rls_legal_opinions_client_access`: Klien mengakses dokumen miliknya.<br>`rls_legal_opinions_advocate_access`: Advokat menyusun opini untuk kliennya.<br>**Constraint Kuota:** `revision_counter <= 2`. | <color:green>COMPLETE</color> |
| 19 | `document_revisions` | `revision_id` (`UUID`) | `ENABLED` | `rls_document_revisions_participant_access`: Pihak sesi konsultasi membaca riwayat putaran revisi. | <color:green>COMPLETE</color> |
| 20 | `emeterai_stamping_logs`| `stamping_id` (`UUID`)| `ENABLED` | `rls_emeterai_public_verify`: Publik dapat memverifikasi keaslian SHA-256 (`PUBLIC-VERIFY`).<br>**WORM Trigger:** `trg_worm_emeterai_stamping_logs`. | <color:green>COMPLETE</color> |
| 21 | `case_irac_notes` | `irac_id` (`UUID`) | `ENABLED` | `rls_case_irac_advocate_read`: Advokat membaca analisis IRAC miliknya.<br>**WORM Trigger:** `trg_worm_case_irac_notes`. | <color:green>COMPLETE</color> |

#### Fungsi & Trigger Append-Only WORM Vault
* **Fungsi:** `fn_prevent_worm_mutation()`
* **Mekanisme:** Mencegah modifikasi (`UPDATE`) atau penghapusan (`DELETE`) pada tabel yang diproteksi kriptografi SHA-256 (`emeterai_stamping_logs` dan `case_irac_notes`), menjamin kepatuhan retensi hukum 10 tahun *tamper-proof*.

---

### 5.2 Verifikasi Aljabar Himpunan Simetris Batch 4 ($S_{\text{DDL}} = S_{\text{Baseline}}$)
* **Himpunan Tabel Baseline Bab 3 (18–21):**  
  `legal_opinions`, `document_revisions`, `emeterai_stamping_logs`, `case_irac_notes`.
* **Himpunan Tabel DDL Batch 4 (`04_domain4_legal_opinions_worm_emeterai.sql`):**  
  `legal_opinions`, `document_revisions`, `emeterai_stamping_logs`, `case_irac_notes`.
* **Bukti Matematis:**  
  $$S_{\text{DDL\_Batch4}} - S_{\text{Baseline\_Batch4}} = \emptyset \quad \land \quad S_{\text{Baseline\_Batch4}} - S_{\text{DDL\_Batch4}} = \emptyset$$

---

## 6. BATCH 5: DOMAIN 5 — PRO BONO, DISPUTE RESOLUTION & IMMUTABLE AUDIT VAULT (TABEL 22 S.D. 26)

Berkas migrasi fisik untuk Batch 5 tersedia pada:  
[`database/migrations/05_domain5_probono_disputes_worm_audit.sql`](file:///D:/justificadll/database/migrations/05_domain5_probono_disputes_worm_audit.sql)

### 6.1 Ringkasan Implementasi Tabel, RLS Policy & WORM Audit Domain 5

| No | Nama Tabel | Primary Key | Konfigurasi RLS | Kebijakan Akses (*RLS Policies*) / Proteksi WORM | Status |
| :-: | :--- | :--- | :---: | :--- | :---: |
| 22 | `probono_cases` | `probono_id` (`UUID`) | `ENABLED` | `rls_probono_cases_client_read`: Klien membaca pengajuan bantuan hukum miliknya. | <color:green>COMPLETE</color> |
| 23 | `dispute_cases` | `dispute_id` (`UUID`) | `ENABLED` | `rls_dispute_cases_participant_read`: Pihak bersengketa dapat memantau proses mediasi. | <color:green>COMPLETE</color> |
| 24 | `dispute_mediator_signatures`| `signature_id` (`UUID`)| `ENABLED` | `rls_dispute_signatures_mediator_read`: Dewan mediator memantau kuorum persetujuan.<br>**Constraint 3-of-5:** `UNIQUE(dispute_id, mediator_admin_id)`. | <color:green>COMPLETE</color> |
| 25 | `audit_logs_worm` | `audit_id` (`UUID`) | `ENABLED` | `rls_audit_logs_worm_self_read`: Pelaku membaca riwayat log miliknya.<br>**WORM Trigger:** `trg_worm_audit_logs_vault`. | <color:green>COMPLETE</color> |
| 26 | `user_notifications` | `notification_id` (`UUID`)| `ENABLED` | `rls_user_notifications_self_read`: Pengguna mengakses kotak masuk notifikasi miliknya. | <color:green>COMPLETE</color> |

#### Fungsi PL/pgSQL Cryptographic Audit Ledger
* **Fungsi:** `fn_record_immutable_audit_log(p_actor_user_id, p_actor_type, p_action_type, p_target_resource, p_metadata_json)`
* **Mekanisme:** Menghitung hash SHA-256 secara berantai (*Merkle-tree chaining*) terhadap log sebelumnya (`worm_sha256_hash`) dan menyisipkan entri baru ke dalam gudang WORM immutable.

---

### 6.2 Verifikasi Aljabar Himpunan Simetris Batch 5 ($S_{\text{DDL}} = S_{\text{Baseline}}$)
* **Himpunan Tabel Baseline Bab 3 (22–26):**  
  `probono_cases`, `dispute_cases`, `dispute_mediator_signatures`, `audit_logs_worm`, `user_notifications`.
* **Himpunan Tabel DDL Batch 5 (`05_domain5_probono_disputes_worm_audit.sql`):**  
  `probono_cases`, `dispute_cases`, `dispute_mediator_signatures`, `audit_logs_worm`, `user_notifications`.
* **Bukti Matematis:**  
  $$S_{\text{DDL\_Batch5}} - S_{\text{Baseline\_Batch5}} = \emptyset \quad \land \quad S_{\text{Baseline\_Batch5}} - S_{\text{DDL\_Batch5}} = \emptyset$$

---

## 7. GRAND SYNTHESIS: REKONSILIASI TOTAL 26 TABEL FASE 4B

Dengan selesainya Batch 5, seluruh 26 tabel database Justica telah lengkap diimplementasikan ke dalam skrip DDL fisik PostgreSQL/Supabase dan memenuhi prinsip **Bi-Directional Mathematical Set Equality**:

$$\bigcup_{i=1}^{5} S_{\text{DDL\_Batch } i} = \bigcup_{i=1}^{5} S_{\text{Baseline\_Batch } i} = \{T_1, T_2, \dots, T_{26}\}$$

Seluruh skrip migrasi dapat dieksekusi secara terpadu melalui skrip utama:  
[`database/migrations/00_master_run_all_migrations.sql`](file:///D:/justificadll/database/migrations/00_master_run_all_migrations.sql)
