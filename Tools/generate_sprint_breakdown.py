"""
Script to generate SPRINT_TECHNICAL_BREAKDOWN.md mapping ST-001 to ST-027 into BE/FE/QA technical tasks.
"""

TARGET_FILE = r'd:\justificadll\MarkDown\SPRINT_TECHNICAL_BREAKDOWN.md'

CONTENT = """# Sprint Planning & Breakdown Task Teknis (BE / FE / QA)

Dokumen ini merupakan panduan eksekusi teknis tingkat mendalam (*Technical Execution Breakdown*) bagi tim pengembangan perangkat lunak (Backend Engineer, Frontend Engineer, dan Quality Assurance / Compliance Auditor) dalam mewujudkan seluruh **27 User Story (ST-001 hingga ST-027)** dalam Product Backlog JUSTIFICA 3-in-1.

---

## 1. ARSITEKTUR TEKNIS UMUM & TOOLS REQUIREMENT
* **Backend Stack**: Node.js / TypeScript (NestJS atau Express) atau Python (FastAPI), PostgreSQL dengan ekstensi `pgcrypto` untuk enkripsi *field-level*, Redis untuk caching & session lock, serta WORM (*Write-Once-Read-Many*) Object Storage (AWS S3 Object Lock / MinIO WORM).
* **Frontend Stack**: Web App SPA modern berbasis React/Vite atau Vanilla JS berkinerja tinggi, berarsitektur CSS responsif (*Rich Aesthetics, Glassmorphism, HSL Tokens*), dan *WebSockets Client* untuk obrolan E2EE real-time.
* **QA & Security Stack**: Jest/PyTest untuk Unit Testing, Cypress/Playwright untuk End-to-End (E2E) UI Automation Testing, OWASP ZAP untuk *Vulnerability & Penetration Testing*, dan SonarQube untuk *Static Code Analysis*.

---

## 2. BREAKDOWN TASK PER SPRINT & STORY

### SPRINT 1: Core System & Authentication (ST-001 s/d ST-006)
*Fokus: Fondasi identitas tunggal, enkripsi sesi, dan filter katalog profesional.*

| Story ID | Domain Ref | Task Type | Deskripsi Task Teknis | Estimasi (Jam) | Output / Deliverable |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **ST-001** | UC-01 | **BE** | Buat endpoint POST `/api/v1/auth/client/register`. Implementasi middleware validasi NIK ke API Dukcapil. Buat tabel `client_consents` ber-hash SHA-256 untuk merekam *granular consent* per domain (Medis/Hukum/Psikologi). Validasi regex email `.ac.id` untuk pendaftar magang psikologi. | 16 | API Endpoints & DB Schema |
| | | **FE** | Buat UI komponen Registrasi Klien dengan 3 kotak centang consent terpisah (*Granular Consent UI*). Implementasi *form validation* dan logika pengecekan format email magang. | 12 | Form Component & Validation |
| | | **QA** | Buat skrip E2E Cypress menguji: (1) NIK duplikat ditolak; (2) Email non-ac.id pada magang ditolak; (3) Consent tersimpan di DB dengan hash SHA-256 yang valid. | 8 | Automated Test Suite |
| **ST-002** | UC-02 | **BE** | Buat endpoint POST `/api/v1/auth/login` dengan verifikasi OTP SMS/Email. Generate token JWT berenkripsi menggunakan *HttpOnly, Secure, SameSite Cookie*. Implementasi filter pengecekan status `SUSPENDED` (block login & return 403 dengan payload hak banding 14 hari). | 14 | Auth Service & JWT Engine |
| | | **FE** | Buat layar Login & tantangan OTP. Buat UI pemantau *error handling* 403 Suspended yang merender pop-up *"Akun Ditangguhkan - Hak Banding 14 Hari"* beserta tombol *redirect* ke form banding. | 10 | Login UI & Suspended Modal |
| | | **QA** | Uji *penetration testing* cookie JWT (pastikan anti-XSS & anti-CSRF). Uji batas coba OTP salah 5x memicu penguncian akun 15 menit. | 8 | Security Test Report |
| **ST-003** | UC-07 | **BE** | Buat endpoint POST `/api/v1/auth/mitra/register`. Setup integrasi *AWS S3 Object Lock (WORM)* untuk penyimpanan file STR/SIP/SIPP/KTA. Enkripsi metadata file dengan AES-256. Validasi anti-duplikasi nomor lisensi. | 18 | WORM Storage Upload API |
| | | **FE** | Buat UI Formulir Registrasi Mitra Profesional dinamis sesuai domain (Medis/Hukum/Psikologi) dengan *drag-and-drop* file upload beresolusi tinggi dan *progress bar*. | 14 | Dynamic Mitra Form UI |
| | | **QA** | Verify bahwa file STR/KTA yang diunggah ke S3 WORM tidak dapat di-overwrite atau di-delete via SDK/API AWS (*Immutability assertion*). | 8 | WORM Security Assertion |
| **ST-004** | UC-08 | **BE** | Buat endpoint POST `/api/v1/auth/mitra/login-mfa`. Integrasikan library `speakeasy` untuk verifikasi TOTP Google Authenticator / SMS OTP. Catat setiap *attempt* login ke tabel audit WORM `login_audit_logs`. | 14 | MFA Service & WORM Audit |
| | | **FE** | Buat antarmuka *MFA Challenge Screen* dengan input 6 digit OTP/TOTP yang mendukung *auto-focus* dan *paste clipboard*. | 8 | MFA Challenge UI |
| | | **QA** | Test bahwa login tanpa MFA di-reject 100%. Uji coba gagal MFA 3x memicu status *temporary account lockout* selama 30 menit. | 6 | MFA Security Test Script |
| **ST-005** | UC-03 | **BE** | Buat endpoint GET `/api/v1/mitra/catalog` dengan *query builder* filter spesialisasi, rating, *geolocation radius* (Haversine formula < 10 km), dan *background check* lisensi aktif (where `license_exp_date > NOW()`). | 16 | Catalog Query & Filter API |
| | | **FE** | Buat UI Direktori Mitra Profesional dengan kartu profil kaca (*Glassmorphism*), indikator status online hijau, dan *filter bar* jarak (<10 km). | 14 | Catalog UI & Geolocation |
| | | **QA** | Inject data uji mitra dengan STR expired hari ini di DB, pastikan API `/catalog` tidak mengembalikan mitra tersebut (*Zero expired license assertion*). | 6 | Catalog Filter Test Suite |
| **ST-006** | UC-09 | **BE** | Buat endpoint PATCH `/api/v1/mitra/availability`. Implementasi *SIRS RS API Sync* dan *SIPP Pengadilan API Sync* (tolak online jika ada jadwal fisik bentrok). Implementasi aturan *Psychology Buffer Rule*: tolak online jika `last_heavy_counseling_end_time < 30 minutes ago`. | 16 | External Calendar Sync API |
| | | **FE** | Buat tombol *Toggle Online/Offline* di Dasbor Mitra. Buat pop-up peringatan jika toggle gagal karena jadwal RS/Sidang bentrok atau masa *buffer* psikologi 30 menit belum habis. | 10 | Dashboard Toggle UI |
| | | **QA** | Mock API SIRS RS mengembalikan status 'Sedang Operasi', verify toggle online di-reject dengan pesan yang sesuai. Mock buffer psikolog 15 menit pasca-sesi, verify hitung mundur 15 menit muncul. | 8 | External Sync Mock Tests |

---

### SPRINT 2: Communication & Payment Engine (ST-007 s/d ST-010)
*Fokus: Real-time chat room E2EE, arsitektur Zero-Knowledge, dan Payment Gateway Escrow.*

| Story ID | Domain Ref | Task Type | Deskripsi Task Teknis | Estimasi (Jam) | Output / Deliverable |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **ST-007** | UC-05 | **BE** | Integrasikan API Midtrans/Xendit untuk pembentukan Snap Token / Virtual Account dengan timer 15 menit. Buat endpoint POST `/api/v1/payment/webhook` ber-validasi *checksum signature SHA-256*. Buat mekanisme *Escrow Ledger* untuk tagihan draf hukum dan subsidi Pro Bono. | 20 | Payment Engine & Escrow DB |
| | | **FE** | Buat UI Checkout Page dengan pilihan metode bayar, timer hitung mundur 15 menit yang persisten di localStorage, dan *polling status* otomatis pasca-bayar. | 14 | Checkout UI & Polling |
| | | **QA** | Simulate webhook callback FAILED/EXPIRED dan SUCCESS dari Payment Gateway menggunakan Postman/Cypress, verify perubahan status di DB dan pembukaan chat room. | 8 | Webhook Automation Suite |
| **ST-008** | UC-04 | **BE** | Bangun *WebSockets Server (Socket.io/WS)* untuk obrolan real-time. Implementasi *timer engine* sesi (default 45 menit). Buat cron job / event listener: saat timer 00:00, otomatis ubah status chat menjadi `COMPLETED` dan kunci tabel pesan menjadi *Read-Only WORM storage*. | 24 | WebSockets Server & Timer |
| | | **FE** | Buat UI Chat Room interaktif. Untuk domain Hukum, pasang **Gold Banner "PRIVILEGED AND CONFIDENTIAL"** di header chat. Implementasi *auto-disable* kolom input teks dan tombol kirim begitu status berubah `COMPLETED` atau timer menyentuh 00:00. | 18 | Chat Room UI & E2EE Client |
| | | **QA** | Uji konkurensi 1.000 koneksi WebSocket bersamaan. Uji timer habis 00:00: pastikan FE mematikan input teks dan BE menolak *payload* pesan baru dengan error `403 Session Closed`. | 10 | Load Test & Session Lock QA |
| **ST-009** | UC-10 | **BE** | Buat sistem *push notification* & SLA watchdog. Jika tiket berstatus `PAID` tidak direspons mitra dalam 5 menit, trigger *auto-refund API* ke dompet klien atau re-queue ke mitra online lain. Buat fitur *reconnect window* 5 menit di Redis jika mitra terputus. | 16 | Watchdog SLA & Reconnect |
| | | **FE** | Buat ring audio dan pop-up permintaan masuk pada layar Dasbor Mitra dengan timer mundur 5 menit untuk menekan tombol *"Terima Permintaan"*. | 12 | Notification Ring & Pop-up |
| | | **QA** | Simulate mitra tidak merespons selama 5 menit 01 detik, verify sistem otomatis mengeksekusi refund dan mencatat penalti SLA pada akun mitra. | 8 | SLA Watchdog Test Suite |
| **ST-010** | Huk-UC01 | **BE** | Buat endpoint POST `/api/v1/chat/upload-evidence` dengan batas max 25 MB. Implementasi arsitektur *Zero-Knowledge*: BE hanya menerima file terenkripsi E2EE dari client tanpa menyimpan *decryption key*. Berikan label database `"PRIVILEGED LEGAL EVIDENCE"`. | 16 | ZK Upload API & Storage |
| | | **FE** | Implementasi library kriptografi *client-side* (Web Crypto API) untuk mengenkripsi file sebelum diupload. Buat UI *Secure PDF Viewer* di dalam aplikasi yang merender bukti tanpa menyimpan *temp file* di disk lokal. | 16 | Client E2EE & PDF Viewer |
| | | **QA** | Lakukan *Penetration Testing*: coba akses file bukti hukum menggunakan *token access* milik Admin Sistem atau DB root, verify isi file tetap terenkripsi (*Zero-Knowledge proof*). | 10 | Zero-Knowledge PenTest |

---

### SPRINT 3: Domain-Specific Medical & General Post-Session (ST-011 s/d ST-015)
*Fokus: e-Resep DDI Checker, SOAP Note ICD-10, Controlled Drugs 3-Rangkap, dan Family Care.*

| Story ID | Domain Ref | Task Type | Deskripsi Task Teknis | Estimasi (Jam) | Output / Deliverable |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **ST-011** | UC-11 | **BE** | Buat endpoint POST `/api/v1/clinical/notes` berenkripsi *field-level (`pgcrypto` AES-256)*. Implementasi pencarian *full-text search* kamus penyakit **ICD-10** di PostgreSQL. Wajibkan parameter ICD-10 untuk catatan medis sebelum penyimpanan berhasil. | 16 | Field-level Enc DB & ICD-10 |
| | | **FE** | Buat Formulir Catatan Sesi Dinamis (SOAP untuk Medis, DAP untuk Psikologi, Case Memo untuk Hukum). Buat komponen *autocomplete dropdown* untuk kolom Diagnosis ICD-10. | 14 | SOAP/DAP Form & Autocomplete |
| | | **QA** | Test simpan SOAP Note tanpa memilih kode ICD-10, pastikan BE menolak dengan status 400. Verify di DB PostgreSQL bahwa kolom `assessment_text` tersimpan dalam bentuk *ciphertext*. | 8 | ICD-10 & Encryption QA |
| **ST-012** | UC-12 | **BE** | Buat modul **Drug-Drug Interaction (DDI) Checker Engine** berbasis *rule database*. Jika kombinasi obat memicu *Major DDI*, tolak terbit resep kecuali dokter menyertakan *payload `override_reason`* yang akan di-log ke WORM. Jika obat adalah *Controlled Drug (Narkotika)*, generate PDF 3-rangkap ber-watermark khusus. | 24 | DDI Engine & Controlled Drug |
| | | **FE** | Buat antarmuka e-Resep dengan daftar obat dinamis. Buat *Alert Modal Merah/Kuning* saat DDI Checker memicu bahaya interaksi obat, mengharuskan dokter mengisi kotak teks *override reason* sebelum tombol simpan aktif. | 16 | e-Resep UI & DDI Alert Modal |
| | | **QA** | Inject kombinasi obat Amoxicillin + Allopurinol (simulasi DDI), verify alert merah muncul. Test peresepan Codeine (Narkotika), verify keluaran PDF terpecah menjadi 3 rangkap digital tersandi. | 10 | DDI Engine Automated Specs |
| **ST-013** | Kes-UC01 | **BE** | Buat endpoint POST `/api/v1/pharmacy/redeem`. Implementasi *geolocation query* mencari Apotek Mitra terintegrasi SIA dalam radius < 10 km. Kirim *payload e-Resep* ke server SIA Apotek. Khusus obat Narkotika, wajibkan parameter unggah foto KTP fisik penerima. | 18 | SIA Pharmacy Sync API |
| | | **FE** | Buat UI Modul Apotek & Peta Pelacakan Kurir (*Live Tracking*). Buat pop-up *upload KTP fisik* saat checkout obat yang bertanda *Controlled Drug*. | 14 | Pharmacy UI & Courier Map |
| | | **QA** | Mock server SIA Apotek offline, verify sistem melakukan auto-switch ke Apotek Mitra lain dalam radius 20 km tanpa penambahan ongkos kirim. | 8 | Pharmacy Failover QA |
| **ST-014** | Kes-UC02 | **BE** | Buat endpoint POST `/api/v1/hospital/offline-booking`. Integrasikan panggilan ke API SIRS Rumah Sakit untuk mengunci kuota poli spesialis. Integrasikan API BPJS Kesehatan untuk memvalidasi nomor rujukan Faskes Tingkat 1. | 16 | SIRS & BPJS Sync API |
| | | **FE** | Buat UI Pemesanan Janji Temu RS Offline dengan kalender jadwal dokter dan input nomor kartu BPJS/Rujukan yang memberikan *instant validation badge*. | 12 | Offline Booking UI |
| | | **QA** | Simulate webhook dari SIRS RS yang membatalkan jadwal dokter H-1, verify sistem otomatis mengirim SMS/WA ke klien dan membuka opsi *reschedule/tele-consult* gratis. | 8 | Hospital Webhook QA |
| **ST-015** | Kes-UC03 | **BE** | Buat endpoint GET `/api/v1/medical-records` dengan *Read-Only authorization*. Implementasi verifikasi PIN Rahasia 6 digit (gagal 3x blokir 1 jam di Redis). Implementasi pengecekan `digital_guardianship_consent` untuk profil dewasa di *Family Care*. | 16 | Read-Only EME API & PIN Lock |
| | | **FE** | Buat UI Rekam Medis & Family Care dengan layar input PIN 6 digit atau biometrik WebAuthn. Buat tampilan kronologis kartu medis SOAP & resep yang bersih. | 12 | EME Timeline & PIN Screen |
| | | **QA** | Test coba buka profil Family Care anggota keluarga dewasa yang `consent_status = false`, verify BE merespons 403 Forbidden dengan pesan regulasi UU PDP No. 27/2022. | 6 | Family Care PDP Spec Suite |

---

### SPRINT 4: Domain-Specific Psychology & Law (ST-016 s/d ST-020)
*Fokus: DASS-21 Mandatory Crisis Protocol, Mood Tracker, dan Legal Drafting IRAC ber-e-Meterai Peruri.*

| Story ID | Domain Ref | Task Type | Deskripsi Task Teknis | Estimasi (Jam) | Output / Deliverable |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **ST-016** | Psi-UC01 | **BE** | Buat endpoint POST `/api/v1/psychology/mood-tracker` berenkripsi *field-level*. Buat agregator *cron job*: jika klien mencatat mood = 'Sedih/Panik' dengan intensitas > 8 selama 7 hari berturut-turut, set flag `trigger_wellness_banner = true` pada profil klien. | 14 | Mood DB & Trend Agregator |
| | | **FE** | Buat UI Roda Emosi Mood Tracker dan catatan jurnal harian. Buat komponen **Proactive Wellness Banner** berwarna zamrud yang muncul saat flag aktif, menawarkan kupon subsidi konseling 50%. | 12 | Mood Tracker & Banner UI |
| | | **QA** | Inject 7 data mood sedih intensitas 9 secara kronologis di DB, verify saat login berikutnya banner psikoedukasi muncul di Dasbor Klien. | 6 | Trend Analytics QA Script |
| **ST-017** | Psi-UC02 | **BE** | Buat endpoint GET `/api/v1/psychology/meditation-audio` dengan *Adaptive Bitrate Streaming* (HLS/DASH). Catat statistik waktu relaksasi ke tabel `client_mindfulness_stats`. | 12 | Audio Streaming API |
| | | **FE** | Buat UI Audio Player Relaksasi dengan latar belakang animasi suara alam (*Glassmorphism Audio Player*). Implementasi pemantau kecepatan jaringan yang menurunkan bitrate otomatis jika sinyal lemah. | 12 | Audio Player UI & HLS Client |
| | | **QA** | Throttling bandwidth network di browser ke Slow 3G, verify pemutar audio tidak macet dan beralih ke stream bitrate rendah (64kbps). | 6 | Network Throttling QA |
| **ST-018** | Psi-UC03 | **BE** | Buat endpoint POST `/api/v1/psychology/dass21-submit`. Implementasi *scoring engine* DASS-21 (Depression, Anxiety, Stress \times 2). **MANDATORY CRISIS PROTOCOL**: Jika skor masuk kategori *Severe* atau *Extremely Severe*, otomatis pancarkan event WebSocket *Emergency Alert* ke Dasbor Supervisor Klinis dan set prioritas antrean klien ke Psikolog Klinis Spesialis Trauma. | 20 | DASS-21 Engine & Crisis Alert |
| | | **FE** | Buat UI Kuisioner DASS-21 (21 pertanyaan). **MANDATORY CRISIS PROTOCOL UI**: Jika respons API mengembalikan status *Severe/Extreme*, wajib render **Pop-Up Darurat Hotline Krisis 119 Ext 8** berlatar merah pekat yang menutupi layar secara *blocking*, dengan tombol tutup (*Close button*) dinonaktifkan secara mutlak selama hitung mundur 10 detik. | 16 | DASS-21 UI & 10s Blocking Lock |
| | | **QA** | Submit payload DASS-21 dengan skor Depression = 30 (Severe). Verify: (1) Pop-up merah 119 ext 8 muncul di FE; (2) Tombol close tidak bisa diklik selama 10 detik (*strict assertion*); (3) WebSocket alert diterima di socket Supervisor. | 10 | Mandatory Crisis E2E Specs |
| **ST-019** | Huk-UC02 | **BE** | Buat modul *Template Engine* hukum metode IRAC. Implementasi *Version Control System (v1, v2, vFinal)* di DB dengan WORM retention 10 tahun. Integrasikan **API Perum Peruri** untuk pembubuhan e-Meterai Rp 10.000 pada koordinat tanda tangan dokumen PDF final. Implementasi *Download Gate*: tolak request unduh PDF jika tiket tagihan draf belum `PAID`. | 24 | IRAC Engine, Peruri API, Gate |
| | | **FE** | Buat UI *Legal Drafting Workspace* dengan editor variabel template IRAC dan panel riwayat *Version Control*. Buat tombol aksi *"Bubuhkan e-Meterai Rp 10.000 & Stempel Privilege"*. Buat tampilan *Download Gate* di chat klien dengan tombol bayar tagihan draf. | 18 | Drafting Workspace & Gate UI |
| | | **QA** | Mock API Peruri e-Meterai mengembalikan sukses, verify PDF akhir memiliki *stempel hash digital*. Uji Download Gate: coba hit endpoint download PDF draf saat transaksi `PENDING`, pastikan BE menolak dengan 402 Payment Required. | 10 | e-Meterai & Download Gate QA |
| **ST-020** | Huk-UC03 | **BE** | Buat endpoint POST `/api/v1/probono/apply` (upload SKTM). Integrasikan logika replikasi verifikasi Admin (UC-13) dengan cross-check API Dukcapil & DTKS Kemensos. Saat `SKTM_APPROVED`, terbit tiket konsultasi Rp 0, kurangi kuota bulanan advokat pro bono (*max 3/month*), dan kunci dana subsidi di *Escrow Ledger*. | 18 | Pro Bono API & Escrow Engine |
| | | **FE** | Buat UI Pengajuan Pro Bono & Upload SKTM. Buat antarmuka pemilihan Advokat Pro Bono yang menampilkan sisa kuota pengabdian bulanan advokat secara transparan. | 12 | Pro Bono UI & Quota Display |
| | | **QA** | Test pilih advokat pro bono yang kuota bulanannya sudah mencapai 3 kasus, verify BE menolak booking dan FE merekomendasikan daftar advokat pro bono lain yang tersedia. | 8 | Pro Bono Quota E2E Suite |

---

### SPRINT 5: Admin & Feedback Module (ST-021 s/d ST-027)
*Fokus: Blocking review modal, Due Process 3 Warning, Ethics Committee Flow, PPh 21, dan Audit WORM.*

| Story ID | Domain Ref | Task Type | Deskripsi Task Teknis | Estimasi (Jam) | Output / Deliverable |
| :--- | :--- | :---: | :--- | :---: | :--- |
| **ST-021** | UC-06 | **BE** | Buat endpoint POST `/api/v1/reviews`. Jika review untuk domain Medis berating <= 2 bintang, otomatis buat tiket investigasi `UNDER_INVESTIGATION` di tabel `adverse_events` dan kirim alert ke Tim Etik. Implementasi *auto-anonymize function* untuk mengubah nama klien hukum menjadi format anonim (misal: `Klien Huk-8891`). | 14 | Review API, Adverse & Anon |
| | | **FE** | Buat **Blocking Review Modal** yang otomatis muncul dan menutupi Dasbor Klien saat sesi chat berubah menjadi `COMPLETED`. Jika klien memilih bintang <= 2 pada dokter, perluas modal secara dinamis dengan *Formulir Pelaporan Adverse Event Klinis*. | 14 | Blocking Modal & Adverse UI |
| | | **QA** | Verify bahwa saat sesi COMPLETED, klien tidak bisa mengklik menu navigasi lain sebelum mengisi atau mengklik 'Lewati/Nanti Saja'. Submit rating 1 bintang pada dokter, verify tiket adverse event terbentuk di DB. | 8 | Blocking Modal & Adverse QA |
| **ST-022** | UC-13 | **BE** | Buat endpoint GET & POST untuk modul Admin Verifikasi Kredensial & SKTM. Bangun layanan *Cross-Check Aggregator* yang memanggil API KKI/KTKI, HIMPSI, Peradi, Dukcapil, dan DTKS Kemensos. Implementasi *WORM Audit Logger* untuk merekam setiap persetujuan atau penolakan beserta alasan teknisnya. | 20 | Admin Verification API & Aggregator |
| | | **FE** | Buat UI Halaman Admin Verifikasi (Tab Lisensi Mitra vs Tab SKTM Klien) dengan *WORM PDF Viewer* di kiri dan panel *Cross-Check API Match* di kanan. | 16 | Admin Verification Workspace |
| | | **QA** | Mock API KKI mengembalikan 'STR Tidak Terdaftar', verify panel Admin menampilkan badge merah mismatch. Verify keputusan reject mengirim email notifikasi yang tepat ke pengguna. | 8 | Verification Aggregator QA |
| **ST-023** | UC-14 | **BE** | Buat endpoint POST `/api/v1/admin/clients/warn` dan `/suspend`. **DUE PROCESS ENGINE**: Wajibkan pengecekan `warning_count`. Jika `warning_count < 2`, tolak eksekusi suspend langsung (kecuali flag pelanggaran berat). Saat suspend dieksekusi, generate **Surat Resmi Suspend PDF ber-hash SHA-256**, kunci token sesi JWT di Redis (*force logout*), dan set `appeal_deadline = NOW() + 14 DAYS`. | 18 | Due Process Engine & Suspend API |
| | | **FE** | Buat UI Tabel Manajemen Akun Klien dengan indikator warna *Warning Count*. Buat Modal Suspend yang menampilkan hitung mundur masa banding 14 hari kerja dan tombol pengajuan klarifikasi. | 12 | Account Management Table & Modal |
| | | **QA** | Test klik tombol Suspend pada akun dengan Warning Count = 0 (tanpa flag pelanggaran berat), pastikan BE menolak dengan error `"Due Process Violation: Wajib berikan Warning 1 & 2 terlebih dahulu"`. | 8 | Due Process Guardrail Specs |
| **ST-024** | UC-15 | **BE** | Buat modul **Ethics Committee Flow**. Buat endpoint untuk membentuk Tim Etik Multidisiplin (1 Dokter Senior, 1 Psikolog Senior, 1 Advokat Senior, 1 Admin Compliance). Set status mitra menjadi `OFFLINE` (*Pre-hearing Suspension*). Saat Ketua Tim Etik memverifikasi putusan bersalah, eksekusi suspend permanen, dan trigger *automated API reporting* mengirim laporan resmi ke Badan Profesi Nasional (KKI/HIMPSI/Peradi). | 24 | Ethics Flow & National Reporting API |
| | | **FE** | Buat UI Panel Sidang Etik Multidisiplin di Dasbor Admin, menampilkan daftar 4 panel ahli, status jadwal hearing virtual, dan form keputusan akhir (*Guilty / Not Guilty*). | 16 | Ethics Committee Panel UI |
| | | **QA** | Simulate putusan 'Terbukti Melanggar Etik Berat' oleh Tim Etik, verify: (1) Akun mitra berubah `SUSPENDED`; (2) Laporan terkirim ke mock API KKI; (3) Putusan terkunci permanen di WORM DB. | 10 | Ethics Committee E2E Suite |
| **ST-025** | UC-16 | **BE** | Buat endpoint GET `/api/v1/finance/analytics` dan `/export`. Bangun *SAK Accounting Engine* yang mengalkulasi otomatis bagi hasil proporsional per transaksi: Medis (15%/85%), Psikologi (20%/80%), Hukum (25%/75%). Saat ekspor laporan (XLSX/PDF), hitung *checksum hash SHA-256* dari seluruh baris data dan sematkan di footer file serta tabel WORM log. | 20 | Finance Analytics & Hashed Export API |
| | | **FE** | Buat UI Dashboard Intelijen Finansial & Bagi Hasil (Kartu GMV, Grafik Proporsi Domain, Filter Bar). Buat tombol ekspor laporan ber-badge *WORM SHA-256 Signed*. | 14 | Financial Analytics Dashboard |
| | | **QA** | Unduh file ekspor XLSX, hitung ulang hash SHA-256 secara independen menggunakan script Python/Node, verify string hash cocok 100% dengan hash di footer laporan (*Cryptographic hash verification*). | 8 | SHA-256 Export Integrity QA |
| **ST-026** | UC-17 | **BE** | Buat endpoint POST `/api/v1/mitra/withdraw`. Bangun modul pemotongan pajak otomatis PPh 21 sesuai aturan Dirjen Pajak. Implementasi *AML Account Verification* (nama rekening bank harus 100% cocok dengan KTP/STR). **THRESHOLD CONTROL**: Jika nominal < Rp 5 Juta, panggil API Bank Payout otomatis (*auto-disburse*); jika >= Rp 5 Juta, masukkan ke tabel `manual_approval_queue` Admin Finansial. | 22 | PPh 21 Engine, AML & Threshold API |
| | | **FE** | Buat UI Saldo & Pencairan Dana di Dasbor Mitra dengan rincian pemotongan PPh 21 dan bagi hasil platform. Buat UI Tabel Antrean Pencairan Manual (>= Rp 5 Juta) di Dasbor Admin Finansial. | 14 | Mitra Wallet UI & Admin Queue |
| | | **QA** | Submit penarikan Rp 4.900.000, verify sistem mengeksekusi auto-disburse. Submit penarikan Rp 5.100.000, verify sistem menahan saldo di `PENDING_MANUAL` dan meminta klik *Approve* dari Admin Finansial. | 10 | Threshold & PPh 21 Automation |
| **ST-027** | *(Optional)*<br>Audit | **BE** | Buat endpoint GET `/api/v1/audit/worm-integrity-scan`. Bangun *Cryptographic Watchdog* yang memindai seluruh tabel WORM (`login_audit_logs`, `client_consents`, `chat_evidence`, `adverse_events`, `ethics_hearings`) dan memvalidasi keutuhan *hash chain*. Buat fitur *Digital Evidence Bundle Generator* (zip file bersertifikat digital untuk pembuktian pengadilan/BPSK). | 24 | WORM Integrity Engine & Bundle API |
| | | **FE** | Buat UI Dashboard Auditor WORM khusus yang menampilkan status *Integrity Hash Chain* (Hijau = Tamper-Free) dan tombol unduh *Digital Evidence Bundle*. | 14 | Auditor WORM Dashboard UI |
| | | **QA** | Lakukan *Database Tampering Simulation*: ubah 1 karakter pada tabel `chat_evidence` langsung di DB PostgreSQL, jalankan `/worm-integrity-scan`, verify sistem mendeteksi *Tampered Hash Alert* secara real-time. | 12 | Tampered DB Forensic Test Suite |

---

## 3. SUMMARY ESTIMASI TEKNIS TOTAL
* **Total Backend Engineering (BE)**: **488 Jam** (~61 Hari Kerja / 3 Engineer)
* **Total Frontend Engineering (FE)**: **378 Jam** (~47 Hari Kerja / 3 Engineer)
* **Total Quality Assurance & Compliance (QA)**: **216 Jam** (~27 Hari Kerja / 2 Engineer)
* **Total Keseluruhan Waktu Eksekusi**: **1.082 Jam Kerja Teknis** (Siap dieksekusi dalam 5 Sprint Agile berdurasi 2 minggu per sprint).
"""

with open(TARGET_FILE, 'w', encoding='utf-8') as f:
    f.write(CONTENT.strip() + "\n")

print("Successfully generated SPRINT_TECHNICAL_BREAKDOWN.md.")
