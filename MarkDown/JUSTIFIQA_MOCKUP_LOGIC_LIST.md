# Daftar Mockup & Logika Sistem Justica (`JUSTIFIQA_MOCKUP_LOGIC_LIST.md`)

Dokumen ini mendefinisikan daftar lengkap **28 Mockup / Halaman Antarmuka Justica (2 Publik + 13 Klien + 7 Advokat + 6 Admin)** yang berfokus murni pada **logika sistem (*system logic*)**, interaksi komponen fungsional, serta pemenuhan spesifikasi **21 Use Case (`J-UC01` s/d `J-UC21`)** dan seluruh fitur **Fase 2 Backlog** (*Tiering, Inline DLP Security ~30ms, Fair-Clock Timer, Offline QR Handshake, Async Deliverable Quota, Dual-Source Moderation, WORM Audit Trail*).

Seluruh Mockup disimpan dalam dua direktori terpisah (*Dual-Audience Architecture*):
- `D:\justificadll\JustifiqaMockups\mockup_ori\` *(Engineering & Compliance Spec)*
- `D:\justificadll\JustifiqaMockups\mockup_clear\` *(End-User Professional Corporate Slate UI)*

---

## 1. GERBANG PUBLIK & VERIFIKASI (2 MOCKUP)

| ID Mockup | Nama Halaman | Use Case | Keterangan Fungsi Logis Utama |
| :--- | :--- | :---: | :--- |
| **`MOCK-J-GATEWAY-01`** | **Gerbang Utama & Pemilihan Peran (*Root Gateway*)** | `J-UC01`, `J-UC07` | Halaman utama (`justica.id`) pemisah arus trafik Klien, Advokat, dan Admin Kepatuhan. |
| **`MOCK-J-PUBLIC-VERIFY`** | **Portal Publik Verifikasi Keaslian Dokumen SHA-256** | `J-UC12`, `J-UC14` | Alat publik (`verify.justica.id`) untuk memindai QR / memasukkan hash SHA-256 e-Meterai. |

---

## 2. PORTAL KLIEN HUKUM (13 MOCKUP)

| ID Mockup | Nama Halaman | Use Case | Keterangan Fungsi Logis Utama |
| :--- | :--- | :---: | :--- |
| **`MOCK-J-CL-01`** | **Portal Registrasi & Login Klien** | `J-UC01`, `J-UC02` | Autentikasi MFA & pencatatan persetujuan UU PDP ber-hash SHA-256. |
| **`MOCK-J-CL-02A`** | **Dasbor Utama Klien & Riwayat Perkara Aktif** | `J-UC04`, `J-UC12` | Hub manajemen kasus aktif, dokumen deliverable, dan status sesi berjalan. |
| **`MOCK-J-CL-02`** | **Katalog Advokat & Direktori Layanan** | `J-UC03` | Pencarian dan filter advokat berdasarkan spesialisasi, status SIPP aktif, dan Tier 1/2/3. |
| **`MOCK-J-CL-02B`** | **Profil Detail Advokat & Pemilihan Jadwal Booking** | `J-UC03` | Rincian lisensi SIPP MA/Peradi, biografi, ulasan terdahulu, dan pemilihan kalender slot. |
| **`MOCK-J-CL-03`** | **Checkout Pembayaran Escrow & Pro Bono SKTM** | `J-UC05`, `J-UC15` | Pilihan bayar Escrow timer 15m atau klaim tiket Pro Bono SKTM Rp0 ber-DTKS. |
| **`MOCK-J-CL-03B`** | **Instruksi Pembayaran VA/QRIS & Resi e-Invoice** | `J-UC05` | Instruksi bayar Virtual Account / QRIS, status real-time, dan e-Kwitansi SHA-256. |
| **`MOCK-J-CL-04`** | **Ruang Obrolan Hukum Online E2EE** | `J-UC04`, `J-UC10`, `J-UC13` | Sesi konsultasi daring E2EE, Fair-Clock Timer (PAUSED after 5m AFK), Inline DLP ~30ms. |
| **`MOCK-J-CL-05`** | **Check-in/out Konsultasi Offline Resmi (QR Scan)** | `J-UC03`, `J-UC04` | Pemindai Dynamic QR Token, timer sesi tatap muka 60m, grace period 120m. |
| **`MOCK-J-CL-06`** | **Ruang Kerja Asinkron Deliverable & Download Gate** | `J-UC12`, `J-UC14` | PDF viewer e-Meterai Peruri SHA-256, kuota revisi 2 putaran, SLA auto-approve. |
| **`MOCK-J-CL-07`** | **Blocking Modal Rating & Ulasan Advokat** | `J-UC06` | Evaluasi mutlak pasca-sesi dengan penyamaran identitas klien secara sistemik. |
| **`MOCK-J-CL-08`** | **Form Whistleblowing & Pelaporan Etik Advokat** | `J-UC21` | Pelaporan pelanggaran etik berlampiran transkrip E2EE SHA-256 ke Dewan Etik. |
| **`MOCK-J-CL-09`** | **Pusat Pemantauan Status Dispute & Laporan Etik** | `J-UC17`, `J-UC21` | Pelacakan progres investigasi kasus etik dan status proses refund dana Escrow. |
| **`MOCK-J-CL-10`** | **Pengaturan Akun, Keamanan MFA, & Audit Consent UU PDP** | `J-UC01` | Pengelolaan data pribadi, MFA, dan pengunduhan log persetujuan UU PDP No. 27/2022. |

---

## 3. PORTAL ADVOKAT HUKUM (7 MOCKUP)

| ID Mockup | Nama Halaman | Use Case | Keterangan Fungsi Logis Utama |
| :--- | :--- | :---: | :--- |
| **`MOCK-J-AD-01`** | **Portal Onboarding & Login Advokat** | `J-UC07`, `J-UC08` | Registrasi KTP/BAS/Kartu Peradi AES-256 WORM, login MFA TOTP mandatory. |
| **`MOCK-J-AD-01B`** | **Dasbor Status Verifikasi KYC Kredensial SIPP** | `J-UC16` | Tracker status verifikasi berkas oleh Admin MA/Peradi & pengajuan ulang. |
| **`MOCK-J-AD-02A`** | **Dasbor Command Center Advokat & Manajemen Kasus** | `J-UC09` | Pemantauan antrean klien masuk, jadwal hari ini, batas SLA drafting, dan alert. |
| **`MOCK-J-AD-02`** | **Pengaturan Jadwal Praktik & Status Ketersediaan** | `J-UC09` | Toggle status online/offline real-time, pengaturan kalender praktik & kuota offline. |
| **`MOCK-J-AD-03`** | **Ruang Obrolan Advokat & Penampil Dynamic QR Host** | `J-UC04`, `J-UC10` | Pelayanan chat E2EE atau tampilan token QR dinamis untuk konsultasi tatap muka. |
| **`MOCK-J-AD-04`** | **Editor Catatan IRAC 4-Tab & Legal Drafting Engine** | `J-UC11`, `J-UC12`, `J-UC14` | Penyusunan IRAC terstruktur WORM 10 tahun, pembubuhan e-Meterai Peruri Rp10.000. |
| **`MOCK-J-AD-05`** | **Dasbor Keuangan Escrow, PPh 21 Otomatis, & Pencairan** | `J-UC19` | Saldo Escrow Hold vs Settled, bagi hasil 75/25, potong PPh 21 otomatis, pencairan. |

---

## 4. PORTAL ADMIN COMPLIANCE BACKOFFICE (6 MOCKUP)

| ID Mockup | Nama Halaman | Use Case | Keterangan Fungsi Logis Utama |
| :--- | :--- | :---: | :--- |
| **`MOCK-J-AM-01`** | **Autentikasi Terisolasi Admin Portal** | `J-UC20` | IP Whitelisting subdomain terisolasi, login kredensial + 6-digit TOTP Authenticator. |
| **`MOCK-J-AM-02`** | **Dasbor Verifikasi Kredensial Advokat & SKTM Pro Bono** | `J-UC16`, `J-UC15` | Previewer WORM anti-unduh, panggilan API cross-check SIPP MA/Peradi & DTKS. |
| **`MOCK-J-AM-03`** | **Dual-Source Moderation Queue & Due Process Panel** | `J-UC17`, `J-UC21` | Antrean kasus dari Klien & alert DLP backend, sistem Warning 1-3, suspend SHA-256. |
| **`MOCK-J-AM-04`** | **Pemantauan Keuangan Escrow & Rekonsiliasi Pajak** | `J-UC18` | Audit arus kas Escrow platform, bukti potong PPh 21, Two-Person Approval >= Rp10M. |
| **`MOCK-J-AM-05`** | **Pusat Audit Trail Log WORM & Keamanan Sistem** | `J-UC20` | Audit ketat perubahan data WORM, log pencegahan DLP, dan jejak aksi personel. |
| **`MOCK-J-AM-06`** | **Manajemen Parameter Governance & Konfigurasi Escrow** | `J-UC18` | Pengaturan parameter Tier 1/2/3, persentase bagi hasil, dan sinkronisasi MA. |
