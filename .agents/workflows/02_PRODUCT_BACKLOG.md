# Standard Operating Procedure (SOP): Fase 2 - Product Backlog

Dokumen ini adalah acuan mutlak (*SOP & Guardrails*) bagi Agen ketika bertugas pada **Fase 2: Product Backlog (`product_backlog.md`)**. Agen **WAJIB** membaca dan menerapkan pedoman ini sebelum melakukan analisis, generate, atau refactoring pada dokumen backlog.

---

## 1. STRUKTUR & HIERARKI BACKLOG
Seluruh item dalam *Product Backlog* wajib dikelompokkan berdasarkan hierarki:
* **Epic:** Representasi modul atau kelompok fitur besar per sprint (contoh: *Core System & Authentication*, *Communication & Escrow Payment Engine*).
* **Feature / Use Case Ref:** Referensi langsung 1-to-1 ke ID Use Case pada `use_case_scenarios.md` dan `plantuml_sequence_diagrams.md` (contoh: `J-UC01`, `Q-UC09`).
* **User Story:** Rumusan kebutuhan pengguna dengan sintaks mutlak:
  > **Sebagai [Role/Aktor]**, saya ingin [melakukan tindakan/fitur], **sehingga** [tujuan/manfaat bisnis atau klinis/hukum tercapai].
* **Acceptance Criteria (AC):** Kondisi teknis dan bisnis yang harus dipenuhi agar story dapat diverifikasi.
* **Story Points (SP):** Estimasi kompleksitas teknis menggunakan bilangan Fibonacci (`1, 2, 3, 5, 8, 13`).
* **Priority:** Tingkat urgensi bisnis dan arsitektur (`High`, `Med`, `Low`).

---

## 2. ATURAN KETERTUSURAN MUTLAK (TRACEABILITY & PARITY RULE)
1. **Paritas 1-to-1 dengan Use Case & Sequence Diagram:** Setiap *User Story* (`ST-J-xx` / `ST-Q-xx`) **WAJIB** merujuk pada minimal 1 ID Use Case (`J-UCxx` / `Q-UCxx`) yang sah dan eksis di dalam `use_case_scenarios.md` dan `plantuml_sequence_diagrams.md`. Dilarang ada story "yatim" tanpa referensi Use Case atau sebaliknya.
2. **Refleksi Logika Percabangan (Alt/Loop Parity):** Logika penanganan error, validasi gagal, dan pengulangan (*retry loop*) yang sudah distandarisasi pada Sequence Diagram **WAJIB** tercermin eksplisit di dalam *Acceptance Criteria (AC)*.
   * *Contoh:* Jika pada `SD-J-01` terdapat `loop [Coba Perbaiki Input]`, maka pada AC `ST-J-01` wajib tertulis: *"Sistem menolak registrasi dan meminta perbaikan data apabila NIK sudah terdaftar atau tidak valid di API Dukcapil."*

---

## 3. COMPLIANCE & DOMAIN GUARDRAILS (JUSTIFIQA & QUALIFA)
Setiap penulisan *Acceptance Criteria* wajib memasukkan aturan domain spesifik tanpa ada yang terlewat:

### A. Aturan Domain Hukum (Justifiqa - Standalone App)
* **Kredensial Advokat/Notaris:** Verifikasi wajib terhadap Kartu Peradi dan SIPP (Sistem Informasi Penelusuran Perkara) / SK Notaris secara real-time ke pangkalan data MA/Peradi (`ST-J-03`, `ST-J-15`).
* **Escrow Payment Engine:** Dana konsultasi **wajib tertahan di rekening Escrow Justifiqa** dan baru cair setelah sesi selesai dan dokumen verifikasi disetujui (`ST-J-07`).
* **Sesi Konsultasi & Bukti Hukum:** Watermark obrolan wajib *"PRIVILEGED AND CONFIDENTIAL - ATTORNEY-CLIENT PRIVILEGE"*. Bukti perkara dienkripsi E2EE Zero-Knowledge (`ST-J-08`, `ST-J-10`).
* **Legal Drafting & Meterai:** Pembuatan opini hukum metode IRAC (`ST-J-11`) dan pembubuhan e-Meterai resmi Perum Peruri Rp10.000 bersertifikat SHA-256 (`ST-J-12`).
* **Pro Bono & SKTM:** Bantuan hukum cuma-cuma wajib memvalidasi nomor SKTM ke API Dukcapil/Dinsos dengan kuota maksimal 3 kasus/bulan per advokat (`ST-J-13`).
* **Manajemen Honor:** Bagi hasil 25% Platform / 75% Advokat, dipotong PPh 21 otomatis dengan penerbitan bukti potong pajak digital (`ST-J-17`).

### B. Aturan Domain Psikologi (Qualifa - Standalone App)
* **Kredensial Psikolog Klinis:** Verifikasi wajib terhadap STR Klinis dan Kartu HIMPSI (`ST-Q-03`, `ST-Q-15`).
* **Penegakan Buffer Rule 30 Menit (Etika Profesi):** Sistem **mutlak memaksakan jeda istirahat emosional 30 menit** antar sesi konseling klinis bagi psikolog (`ST-Q-06`).
* **Mandatory Crisis Protocol 119 (DASS-21):** Jika skor DASS-21 masuk kategori *SEVERE / EXTREME (Risk of Self-Harm)*, sistem **wajib memunculkan pop-up merah Hotline Krisis 119 yang mengunci layar selama 10 detik** (tombol close mati), mengirim pesan darurat ke kontak keluarga/wali, dan memberi antrean konseling darurat gratis (`ST-Q-12`).
* **Mood Tracker Alert:** Deteksi emosi sedih/cemas ekstrem selama 5 hari beruntun memicu *Proactive Wellness Alert* (`ST-Q-10`).
* **Asesmen Klinis:** Pencatatan sesi menggunakan format DAP Note (Data, Assessment, Plan) dan penugasan lembar kerja *CCBT Worksheet* (`ST-Q-13`).
* **Manajemen Honor:** Bagi hasil 20% Platform / 80% Psikolog, dipotong PPh 21 otomatis (`ST-Q-17`).

### C. Aturan Keamanan & Infrastruktur Bersama (Siloed Architecture)
* **100% Siloed Architecture:** Dilarang keras menggabungkan database, tabel, atau modul antara Justifiqa dan Qualifa.
* **WORM Audit Storage:** Seluruh transaksi kritis (login, registrasi, verifikasi, suspend, pencairan dana) wajib dicatat dalam storage WORM (*Write-Once-Read-Many*) ber-hash SHA-256 yang immutable.
* **MFA & TOTP Mandatory:** Login praktisi dan admin wajib menggunakan otentikasi ganda TOTP RFC 6238 / SMS OTP (`ST-J-02/04/18`, `ST-Q-02/04/18`).

---

## 4. PROSEDUR AUDIT & REFACTORING BACKLOG
Ketika bertugas melakukan audit atau perbaikan pada `product_backlog.md`:
1. **Pre-Computation Check:** Bandingkan daftar 19 Use Case Justifiqa (`J-UC01` s/d `J-UC21`) dan 19 Use Case Qualifa (`Q-UC01` s/d `Q-UC21`) dengan tabel Product Backlog.
2. **AC Deep Verification:** Pastikan setiap *Acceptance Criteria* menuliskan status HTTP, pengecekan keunikan database, batasan waktu (*timer/buffer*), dan verifikasi pihak ketiga secara eksplisit.
3. **No Blind Replace:** Gunakan verifikasi programatik atau pembacaan fisik untuk memastikan setiap pengubahan teks tersimpan sempurna tanpa ada bagian dokumen yang terpotong.
