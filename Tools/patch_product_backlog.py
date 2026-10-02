"""
Script to upgrade product_backlog.md with comprehensive AC/DoD, compliance guardrails, and ST-027.
"""

TARGET_FILE = r'd:\justificadll\MarkDown\product_backlog.md'

CONTENT = """# Product Backlog: Justifica 3-in-1 Tele-Consultation Platform

Dokumen ini memetakan seluruh *Use Case* (Core & Domain-Specific) ke dalam struktur *Agile Product Backlog*. Setiap baris ditulis dalam format *User Story* yang dilengkapi dengan **Acceptance Criteria (AC)** yang ketat serta **Definition of Done (DoD)** tingkat korporasi untuk memastikan kepatuhan regulasi mutlak (UU 17/2023 Kesehatan, Permenkes 24/2022, Kode Etik HIMPSI, UU 18/2003 Advokat, UU 10/2020 e-Meterai, dan UU PDP No. 27/2022).

---

## DEFINITION OF DONE (DoD) & COMPLIANCE GUARDRAILS (Berlaku untuk Seluruh Story)
Sebelum sebuah *User Story* dinyatakan **DONE**, tim engineering **wajib** memenuhi daftar periksa berikut:
1. **WORM Audit Trail Logging**: Seluruh perubahan status (login, registrasi, transaksi, suspend, ekspor laporan) wajib menghasilkan log abadi berenkripsi di storage WORM (*Write-Once-Read-Many*) ber-hash SHA-256 yang tidak bisa di-delete atau di-edit.
2. **End-to-End Encryption (E2EE) & Zero-Knowledge Verify**: Untuk domain Hukum (Huk-UC01, Huk-UC02) dan Medis (UC-04, UC-11), kunci dekripsi tidak boleh tersimpan di server platform. Uji penembusan (*penetration testing*) wajib membuktikan Admin tidak dapat mengintip isi chat hukum.
3. **API Mocking & Cross-Check Validation**: Integrasi dengan API eksternal (KKI/KTKI, HIMPSI, Peradi, Dukcapil, DTKS Kemensos, SIRS RS, SIPP Pengadilan, dan Perum Peruri e-Meterai) wajib memiliki unit test dengan *mocking response* sukses dan gagal (timeout/down), serta mekanisme *auto-retry* 3x.
4. **Due Process & UI Blocking Rule**: Seluruh pop-up wajib hukum (Modal Rating & Review UC-06, Hotline Krisis 119 ext 8 Psi-UC03 dengan lock 10 detik, dan Peringatan Suspend 14 Hari UC-14) wajib diuji secara *blocking* (menutupi layar dan tombol close dinonaktifkan sesuai aturan).
5. **Code Quality & Security Scan**: Coverage tes otomatis minimal 80% (BE & FE). Tidak ada kerentanan kritis (*zero critical vulnerability*) pada pemindai SonarQube / OWASP ZAP.

---

## EPIC 1: Core System & Authentication (Sprint 1)
*Fondasi sistem dan autentikasi multidisiplin.*

| ID | Use Case Ref | User Story & Acceptance Criteria | SP | Priority |
| :--- | :--- | :--- | :---: | :---: |
| **ST-001** | UC-01 | **Sebagai Klien**, saya ingin mendaftarkan akun baru dengan verifikasi NIK dan *granular consent*, **sehingga** saya memiliki akses sah ke platform.<br>**Acceptance Criteria:** (1) Sistem wajib memvalidasi NIK ke API Dukcapil; (2) Pendaftar magang psikologi wajib menggunakan email domain `.ac.id`; (3) Kotak centang consent terpisah per domain (Medis/Hukum/Psikologi) wajib tersimpan ber-hash. | 3 | High |
| **ST-002** | UC-02 | **Sebagai Klien**, saya ingin login dengan sistem verifikasi OTP/2FA, **sehingga** akun saya aman dan sesi terenkripsi.<br>**Acceptance Criteria:** (1) Token JWT wajib menggunakan HttpOnly Cookie & TLS 1.3; (2) Jika akun berstatus `SUSPENDED`, sistem menolak login dan memunculkan surat pemberitahuan hak banding 14 hari kerja. | 5 | High |
| **ST-003** | UC-07 | **Sebagai Mitra Profesional**, saya ingin mendaftarkan akun dan mengunggah kredensial (STR/SIP/SIPP/KTA Peradi), **sehingga** lisensi saya bisa diverifikasi.<br>**Acceptance Criteria:** (1) Berkas kredensial wajib dienkripsi AES-256 dan disimpan di storage WORM; (2) Sistem menolak registrasi jika nomor STR/SIPP/Peradi sudah terdaftar (duplikat). | 5 | High |
| **ST-004** | UC-08 | **Sebagai Mitra Profesional**, saya ingin login ke dasbor dengan Multi-Factor Authentication (MFA), **sehingga** keamanan data rekam medis/hukum terjaga.<br>**Acceptance Criteria:** (1) Autentikasi lapis kedua (TOTP Google Auth / SMS OTP) bersifat **wajib mutlak**; (2) Gagal MFA 3x berturut-turut mengunci akun sementara selama 30 menit. | 3 | High |
| **ST-005** | UC-03 | **Sebagai Klien**, saya ingin mencari dan memfilter daftar mitra berdasarkan spesialisasi, status lisensi aktif, dan *geolocation*, **sehingga** saya menemukan konsultan tepat.<br>**Acceptance Criteria:** (1) Sistem wajib menyembunyikan mitra yang STR/SIPP/KTA-nya telah kadaluarsa; (2) Filter radius < 10 km berfungsi untuk konsul darurat/tatap muka. | 5 | High |
| **ST-006** | UC-09 | **Sebagai Mitra Profesional**, saya ingin mengubah status *online/offline* via *toggle*, **sehingga** klien tahu ketersediaan saya.<br>**Acceptance Criteria:** (1) Sistem wajib mengecek API SIRS RS dan API Pengadilan (menolak online jika bentrok jadwal fisik); (2) Khusus Psikolog, sistem memaksakan jeda istirahat wajib (*buffer rule*) 30 menit pasca-konseling intensif. | 2 | High |

---

## EPIC 2: Communication & Payment Engine (Sprint 2)
*Jantung operasional platform: gerbang pembayaran dan ruang obrolan terenkripsi.*

| ID | Use Case Ref | User Story & Acceptance Criteria | SP | Priority |
| :--- | :--- | :--- | :---: | :---: |
| **ST-007** | UC-05 | **Sebagai Klien**, saya ingin membayar biaya konsultasi via *Payment Gateway* (QRIS/VA/CC), **sehingga** saya mendapatkan tiket masuk *chat room*.<br>**Acceptance Criteria:** (1) Integrasi Midtrans/Xendit Snap Token dengan timer 15 menit; (2) Webhook callback wajib divalidasi dengan signature SHA-256; (3) Khusus Pro Bono Hukum, dana ditahan di rekening *Escrow Platform*. | 8 | High |
| **ST-008** | UC-04 | **Sebagai Klien**, saya ingin bertukar pesan secara *real-time* via *chat room* E2EE dengan mitra, **sehingga** saya bisa berkonsultasi.<br>**Acceptance Criteria:** (1) Ruang obrolan Hukum wajib menonjolkan label *"PRIVILEGED AND CONFIDENTIAL"*; (2) Sistem wajib mematikan fungsi input teks, memblokir tombol kirim, dan otomatis mengunci sesi menjadi COMPLETED/WORM di database begitu timer mundur menyentuh 00:00; (3) Peringatan otomatis H-5 menit sebelum sesi berakhir. | 8 | High |
| **ST-009** | UC-10 | **Sebagai Mitra Profesional**, saya ingin menerima notifikasi dan melayani *chat* dari klien, **sehingga** saya bisa memberikan solusi profesional.<br>**Acceptance Criteria:** (1) SLA respons maksimal 5 menit; jika mitra tidak merespons > 5 menit, sistem memicu *Auto-Refund* 100% ke klien atau mengalihkan tiket ke mitra lain; (2) Fitur *reconnect window* 5 menit jika mitra putus koneksi. | 5 | High |
| **ST-010** | Huk-UC01 | **Sebagai Klien**, saya ingin mengunggah bukti perkara ke dalam *chat* dengan perlindungan E2EE *Zero-Knowledge*, **sehingga** kerahasiaan bukti hukum terjamin.<br>**Acceptance Criteria:** (1) Pemindaian virus/malware di client-side sebelum upload; (2) Max file size 25 MB; (3) File diberi stempel *"PRIVILEGED LEGAL EVIDENCE"*; (4) Admin Sistem secara teknis tidak dapat membuka file. | 5 | High |

---

## EPIC 3: Domain-Specific & Post-Consultation (Sprint 3 & 4)
*Fitur pembeda (*Unique Selling Proposition*) untuk domain Kesehatan Medis, Hukum, dan Psikologi.*

### Sprint 3 (Medical & General Post-Session)
| ID | Use Case Ref | User Story & Acceptance Criteria | SP | Priority |
| :--- | :--- | :--- | :---: | :---: |
| **ST-011** | UC-11 | **Sebagai Mitra Profesional**, saya ingin membuat catatan sesi konsultasi (SOAP/DAP/Case Memo) terenkripsi, **sehingga** rekam medis/hukum klien tersimpan.<br>**Acceptance Criteria:** (1) Medis: format SOAP Note wajib diisi kode diagnosis ICD-10 via auto-complete; (2) Psikologi: format DAP Note; jika risiko *High/Critical*, sistem otomatis memicu *Crisis Flag Alert* ke Supervisor; (3) Hukum: format IRAC ber-stempel privilege & retensi WORM 10 tahun. | 3 | High |
| **ST-012** | UC-12 | **Sebagai Mitra Profesional**, saya ingin menerbitkan dokumen *output* (e-Resep / Lembar Tugas / Legal Opinion), **sehingga** klien mendapatkan instruksi klinis/hukum.<br>**Acceptance Criteria:** (1) e-Resep Medis wajib melewati modul *Drug-Drug Interaction (DDI) Checker*; jika terdeteksi *Major DDI*, dokter wajib merevisi atau memberi *override log*; (2) Peresepan obat Narkotika/Psikotropika (*Controlled Drugs*) wajib mencetak resep digital 3 rangkap; (3) Legal Opinion Hukum wajib dibubuhi e-Meterai Peruri Rp 10.000. | 5 | High |
| **ST-013** | Kes-UC01 | **Sebagai Klien**, saya ingin menebus resep digital ke Apotek Mitra SIA, **sehingga** obat dapat dikirimkan oleh kurir medis.<br>**Acceptance Criteria:** (1) Sistem mencari apotek mitra terintegrasi SIA terdekat (< 10 km); (2) Khusus obat *Controlled Drugs*, kurir wajib memverifikasi KTP fisik penerima saat pengantaran. | 8 | High |
| **ST-014** | Kes-UC02 | **Sebagai Klien**, saya ingin memesan janji temu offline di Rumah Sakit/Klinik mitra, **sehingga** saya bisa bertemu dokter secara fisik.<br>**Acceptance Criteria:** (1) Sinkronisasi slot kuota real-time via API SIRS RS; (2) Validasi nomor rujukan BPJS Kesehatan via API BPJS; (3) Jika dokter batal praktik, sistem mengirim SMS/WA darurat dan menawarkan *reschedule* gratis atau alih ke tele-konsultasi. | 5 | Med |
| **ST-015** | Kes-UC03 | **Sebagai Klien**, saya ingin melihat rekam medis saya dan mengelola profil *Family Care*, **sehingga** saya mengetahui sejarah kesehatan keluarga.<br>**Acceptance Criteria:** (1) Akses rekam medis wajib dilindungi PIN Rahasia/Biometrik (gagal 3x kunci 1 jam); (2) Untuk anggota keluarga dewasa di *Family Care*, sistem wajib meminta persetujuan perwalian digital (*Digital Guardianship Consent*) di akun mereka. | 3 | Med |

### Sprint 4 (Psychology & Law)
| ID | Use Case Ref | User Story & Acceptance Criteria | SP | Priority |
| :--- | :--- | :--- | :---: | :---: |
| **ST-016** | Psi-UC01 | **Sebagai Klien**, saya ingin mengisi *Mood Tracker* harian, **sehingga** psikolog dapat memantau grafik korelasi emosi saya.<br>**Acceptance Criteria:** (1) Jurnal terenkripsi field-level & hanya bisa dibaca konselor aktif; (2) Jika tren emosi sedih/cemas ekstrem berlangsung 7 hari beruntun, sistem memunculkan *Proactive Wellness Banner* menawarkan diskon sesi konseling. | 3 | Med |
| **ST-017** | Psi-UC02 | **Sebagai Klien**, saya ingin mendengarkan *streaming* audio meditasi relaksasi, **sehingga** saya bisa melakukan psikoedukasi mandiri.<br>**Acceptance Criteria:** (1) Trek audio dikurasi dewan ahli HIMPSI; (2) Adaptive bitrate streaming (turun dari 320kbps ke 64kbps jika sinyal lambat); (3) Waktu relaksasi tercatat di profil. | 5 | Low |
| **ST-018** | Psi-UC03 | **Sebagai Klien**, saya ingin mengisi tes asesmen psikometri DASS-21, **sehingga** psikolog memiliki basis penilaian kuantitatif.<br>**Acceptance Criteria:** (1) Kalkulasi otomatis skor Depression, Anxiety, Stress; (2) Jika skor *Severe/Extremely Severe*, sistem **wajib memicu Mandatory Crisis Protocol**: pop-up Hotline 119 ext 8 mengunci layar selama 10 detik (tombol close mati), alert real-time ke Supervisor, dan prioritas antrean ke Psikolog Klinis bersertifikat. | 5 | Med |
| **ST-019** | Huk-UC02 | **Sebagai Advokat**, saya ingin menggunakan *Template Engine* untuk merender draf dokumen hukum ber-e-Meterai, **sehingga** saya bisa memproduksi *Legal Drafting* berketetapan hukum.<br>**Acceptance Criteria:** (1) Template IRAC baku; (2) Version Control (v1/v2/Final) dengan retensi WORM 10 tahun; (3) Integrasi API Peruri untuk e-Meterai Rp 10.000; (4) *Download Gate*: klien baru bisa mengunduh PDF setelah pembayaran biaya draf lunas. | 8 | High |
| **ST-020** | Huk-UC03 | **Sebagai Klien**, saya ingin mengajukan konsultasi Pro Bono dengan mengunggah SKTM, **sehingga** saya mendapat bantuan hukum cuma-cuma.<br>**Acceptance Criteria:** (1) Verifikasi SKTM via cross-check API Dukcapil & DTKS Kemensos oleh Admin (UC-13); (2) Persetujuan otomatis menerbitkan tiket subsidi Rp 0 dan mengunci dana di *Escrow Platform*; (3) Kuota advokat pro bono maksimal 3 kasus/bulan. | 5 | Med |

---

## EPIC 4: Admin & Feedback Module (Sprint 5)
*Panel kontrol operasional sistem, rekonsiliasi keuangan, dan penegakan hukum/etik.*

| ID | Use Case Ref | User Story & Acceptance Criteria | SP | Priority |
| :--- | :--- | :--- | :---: | :---: |
| **ST-021** | UC-06 | **Sebagai Klien**, saya ingin memberikan skor rating dan ulasan, **sehingga** mitra profesional mendapatkan evaluasi kinerja publik.<br>**Acceptance Criteria:** (1) Begitu sesi chat diubah menjadi COMPLETED, sistem wajib memunculkan modal pop-up Rating & Review secara *blocking* di Dasbor Klien; (2) Jika rating ≤ 2 bintang pada domain Kesehatan, sistem wajib memunculkan *Mandatory Adverse Event Form* untuk dievaluasi Tim Etik; (3) Nama klien hukum wajib dianonimisasikan di publik. | 3 | Med |
| **ST-022** | UC-13 | **Sebagai Admin Sistem**, saya ingin memverifikasi dokumen lisensi mitra (STR/SIPP/Peradi) dan SKTM Pro Bono klien, **sehingga** keabsahan platform terjamin.<br>**Acceptance Criteria:** (1) Panel verifikasi dilengkapi tombol *Cross-Check API Nasional* (KKI, HIMPSI, Peradi, Dukcapil, DTKS Kemensos); (2) Persetujuan/penolakan wajib mencatat alasan dan log WORM; (3) Replikasi arsitektural untuk tab Mitra dan tab SKTM Klien tanpa penggabungan diagram fisik. | 5 | High |
| **ST-023** | UC-14 | **Sebagai Admin Sistem**, saya ingin menangguhkan (*suspend*) akun klien yang melanggar ketentuan layanan, **sehingga** platform tetap aman.<br>**Acceptance Criteria:** (1) Penegakan *Due Process of Law*: wajib menerapkan sistem peringatan bertingkat (*Warning 1, 2, 3*) sebelum suspend; (2) Penangguhan wajib menerbitkan Surat Resmi Suspend ber-hash SHA-256 dan memberikan **Masa Banding 14 Hari Kerja** (*Appeal Window*); (3) Bukti pelanggaran disimpan di WORM. | 2 | Med |
| **ST-024** | UC-15 | **Sebagai Admin Sistem**, saya ingin menangani laporan malpraktik mitra profesional melalui *Ethics Committee Flow*, **sehingga** penegakan etik adil dan sah.<br>**Acceptance Criteria:** (1) Sistem wajib memfasilitasi pembentukan **Tim Etik Multidisiplin** (1 Dokter Senior, 1 Psikolog Senior, 1 Advokat Senior, 1 Admin Compliance); (2) Mitra wajib diberikan undangan *Hearing* etik virtual; (3) Jika terbukti bersalah dan di-suspend permanen, sistem otomatis menerbitkan Laporan Resmi ke Badan Profesi Nasional (KKI/HIMPSI/Peradi). | 5 | High |
| **ST-025** | UC-16 | **Sebagai Admin Sistem**, saya ingin melihat laporan dan grafik transaksi keuangan, **sehingga** saya bisa memantau pendapatan dan bagi hasil platform.<br>**Acceptance Criteria:** (1) Kalkulasi *Revenue Sharing* proporsional otomatis per domain: Kesehatan (15% Platform / 85% Mitra), Psikologi (20% Platform / 80% Mitra), Hukum (25% Platform / 75% Mitra); (2) Ekspor laporan (XLSX/PDF) wajib dibubuhi *checksum hash* SHA-256 di footer & WORM log. | 5 | Med |
| **ST-026** | UC-17 | **Sebagai Mitra Profesional**, saya ingin memantau saldo pendapatan dan mencairkannya ke rekening bank, **sehingga** saya mendapatkan hak bagi hasil.<br>**Acceptance Criteria:** (1) Sistem otomatis mengalkulasi dan memotong pajak PPh 21 sesuai aturan Dirjen Pajak; (2) Validasi rekening bank Faskes/Mitra (nama harus 100% cocok dengan STR/KTA untuk anti pencucian uang / AML); (3) **Threshold Control**: pencairan < Rp 5.000.000 diproses otomatis via API Bank (*auto-disburse*); pencairan ≥ Rp 5.000.000 wajib masuk antrean *Manual Approval* Admin Finansial. | 5 | High |
| **ST-027** | *(Optional)*<br>Audit & Ethics | **Sebagai Admin Compliance**, saya ingin mengelola dan mengaudit log penyimpanan WORM (*Write-Once-Read-Many*) serta memonitor jalannya Sidang Etik Multidisiplin (*Ethics Committee Flow*), **sehingga** pembuktian forensik sistem tahan uji secara hukum dan tidak dapat dimanipulasi.<br>**Acceptance Criteria:** (1) Dashboard khusus auditor yang menampilkan verifikasi *cryptographic checksum hash* SHA-256 untuk seluruh log aktivitas, transkrip chat yang dilaporkan, dan putusan hearing etik; (2) Fitur *One-Click Integrity Check* yang memindai seluruh tabel WORM dan mendeteksi anomali/tampering; (3) Ekspor paket bukti digital (*Digital Evidence Bundle*) bersertifikat untuk keperluan persidangan di pengadilan atau BPSK. | 8 | Med |
"""

with open(TARGET_FILE, 'w', encoding='utf-8') as f:
    f.write(CONTENT.strip() + "\n")

print("Successfully upgraded product_backlog.md with AC/DoD and ST-027.")
