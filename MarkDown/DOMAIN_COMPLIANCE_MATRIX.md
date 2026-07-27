# Domain Compliance Matrix — Arsitektur 100% Siloed (Justifiqa & Qualifa)

**Versi**: 2.1 (Sinkronisasi Compliance Mandate Phase 2)
**Tanggal**: 27 Juli 2026
**Status**: Mandatory Compliance Baseline  
**Referensi**: UU PDP (UU 27/2022), UU 18/2003 Advokat, UU 10/2020 e-Meterai, UU 18/2014 Kesehatan Mental, Kode Etik HIMPSI 2019

Dokumen ini menetapkan matriks kepatuhan regulasi mutlak untuk dua aplikasi mandiri yang tidak berbagi database maupun infrastruktur backend: **Justifiqa** (Platform Hukum Digital) dan **Qualifa** (Platform Kesehatan Mental & Konseling Psikologi). Seluruh regulasi dan komponen medis (*Sehatifiqa*) telah dihapus seutuhnya.

---

## BAGIAN I: REGULASI & KEPATUHAN — APLIKASI MANDIRI JUSTIFIQA (DOMAIN HUKUM)

### 1.1 Ringkasan Regulasi Utama Hukum
| Regulasi Utama | Pasal Kunci | Relevansi untuk Justifiqa |
| :--- | :--- | :--- |
| **UU 18/2003 tentang Advokat** | Pasal 18, 19, 20, 21 | Hak keistimewaan advokat (*Attorney-Client Privilege*), kewajiban menjaga kerahasiaan perkara klien, dan perlindungan berkas perkara dari sitaan/pemeriksaan pihak luar. |
| **Kode Etik Peradi 2022** | Pasal 3, 4, 5, 12, 13 | Integritas profesional advokat, larangan *conflict of interest*, dan larangan menelantarkan klien hukum. |
| **UU 10/2020 tentang Bea Meterai** | Pasal 3, 4, 11, 13 | Keabsahan e-Meterai resmi Perum Peruri senilai Rp 10.000 pada dokumen *Legal Opinion* dan draf perjanjian hukum digital agar bernilai alat bukti sah di pengadilan. |
| **UU 16/2011 tentang Bantuan Hukum** | Pasal 5, 6, 7, 8 | Hak masyakarat tidak mampu mendapat layanan Pro Bono secara cuma-cuma melalui verifikasi SKTM yang sah. |
| **UU PDP No. 27 Tahun 2022** | Pasal 15, 16, 17, 26, 46 | Perlindungan data pribadi hukum dan sensitif, kewajiban pemrosesan berbasis *consent*, larangan transfer data rahasia ke luar negeri (*data residency* Indonesia), dan notifikasi insiden kebocoran maksimal 3x24 jam. |
| **UU HPP & PER-16/PJ/2016** | Pasal 21, 23 | Pemotongan pajak PPh 21 otomatis atas penghasilan tenaga ahli advokat serta validasi NPWP aktif. |

---

### 1.2 Klasifikasi & Enkripsi Data Hukum (Justifiqa)
| Kategori Data | Contoh Data | Tingkat Sensitivitas | Standar Enkripsi & Proteksi | Masa Retensi | Hak Akses (*RBAC*) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Identitas Klien Hukum** | NIK Dukcapil, KK, Nama, Alamat, No. HP | Tinggi (*Sensitive PII*) | AES-256-GCM + Field-Level Encryption | 10 Tahun | Klien bersangkutan, Advokat aktif, Admin Legal (terbatas) |
| **Dokumen Bukti Perkara** | Gugatan, Jawaban, Foto Bukti, Putusan | **Privileged / Sangat Rahasia** | **E2EE Wajib (Zero-Knowledge)** + Legal Hold Flag | Minimum 10 Tahun / Permanen | **Hanya Klien & Advokat** (Admin Justifiqa dilarang dan tidak bisa membuka) |
| **Catatan Sesi IRAC Note** | Issue, Rule, Application, Conclusion | **Privileged / Sangat Rahasia** | **E2EE Wajib** + AES-256-GCM | Minimum 10 Tahun | **Hanya Advokat** (dan Klien jika dibagikan oleh Advokat) |
| **Legal Drafting & e-Meterai** | Draf Kontrak v1/v2, Legal Opinion ber-Meterai | Tinggi | AES-256-GCM + WORM Hash SHA-256 | 10 Tahun | Advokat pengonsep, Klien pemesan, API Peruri (hash only) |
| **Berkas Pro Bono (SKTM)** | Foto SKTM, Status verifikasi Dinsos | Tinggi | AES-256-GCM | 10 Tahun | Klien pengaju, Advokat Pro Bono, Admin Legal |
| **Audit Log WORM Justifiqa** | Jejak login, unduhan, verifikasi, suspend | **Kritikal / Forensik** | **Immutable WORM Storage (SHA-256 Chain)** | Permanen | Admin Legal, Auditor Eksternal, Aparat Penegak Hukum (atas perintah pengadilan) |

---

### 1.3 Kepatuhan Anti-Bypass, Pre-Chat Agreement (MoU) & DLP Platform Leakage

Untuk melindungi kepastian hukum, hak keistimewaan profesi, perlindungan dana Escrow, serta menjaga keberlangsungan pendapatan platform Justifiqa, setiap transaksi konsultasi tunduk pada protokol kepatuhan berikut:

#### 1. Pre-Chat Clickwrap Agreement (MoU / Terms of Engagement Modal)
Sebelum Klien dan Advokat dapat membuka ruang obrolan E2EE (`J-UC03`), kedua belah pihak **WAJIB menekan tombol persetujuan eksplisit (*"I Accept This Agreement / Saya Menyetujui Syarat & Ketentuan Konsultasi Hukum Justifiqa"*)** yang mencakup 3 klausul mengikat:
1. **Larangan Transaksi Off-Platform**: Klien dan Advokat dilarang keras mengalihkan pembicaraan, menyepakati pertemuan offline liar, atau melakukan pembayaran di luar mekanisme resmi Justifiqa (kecuali menggunakan fitur **QR-Code Handshake Offline Consultation** yang dipesan sah via aplikasi).
2. **Persetujuan DLP Security Scan**: Sepakat bahwa sistem berhak mengoperasikan pemindaian **DLP (*Data Loss Prevention*) Circumvention Filter** pada pertukaran teks/meta untuk mendeteksi pola nomor telepon/kontak pribadi ilegal dan upaya *bypass* tagihan.
3. **Pembatalan Garansi & Pelepasan Tanggung Jawab (*Liability Disclaimer*)**: Segala bentuk penipuan, malpraktik, atau sengketa yang timbul akibat pertemuan/transaksi di luar platform secara otomatis **membatalkan hak Klaim Refund Escrow 100%** dan membebaskan Justifiqa dari segala tuntutan hukum.

#### 2. Arsitektur Pre-Broadcast Inline Interception & Matriks Zero-Tolerance (2-Tier Enforcement)
Seluruh pesan *chat* diproses secara **Pre-Broadcast Inline Interception** di lapisan *API Gateway / ConsultationController* (~25–40 milidetik) **SEBELUM** diproses oleh *ConsultationService* dan diteruskan ke *socket* WebSocket lawan bicara. Dengan demikian, pesan melanggar **dicegat secara mutlak sebelum tampil di layar UI penerima (*Zero Exposure*)**.

| Tingkat Pelanggaran | Kondisi Pemicu (DLP Filter) | Tindakan Sistem Otomatis | Sanksi & Eskalasi Hukum |
| :--- | :--- | :--- | :--- |
| **Level 1 (Percobaan Pertama — Pre-Broadcast Interception & Drop)** | Terdeteksi string kontak (no. HP, WA, email, link luar) atau kalimat ajakan transaksi offline liar | 1. **Pesan langsung diblokir / dicegat sebelum di-broadcast (*Message Dropped*)** — lawan bicara **TIDAK MENERIMA/MELIHAT** pesan tersebut.<br>2. Tampilkan *Red Security Alert* kepada pengirim. | Catatan percobaan pelanggaran pada *Internal Audit Log*. |
| **Level 2 (Percobaan Kedua / Evasion — Instant Freeze & Suspend)** | Pengirim mencoba mengulangi atau mengakali blokir (misal *obfuscation*: "kosong delapan satu dua...") | 1. **Sesi obrolan langsung dibekukan permanen (*Instant Session Freeze*)**.<br>2. Dana Escrow ditahan (*Escrow Hold*). | 1. Eskalasi otomatis ke **Admin Legal Compliance (`J-UC21`)**.<br>2. **Pembekuan Akun Pelaku (*Account Suspension*) / Blacklist Klien**. |

#### 3. Protokol Atribusi Asimetris & Perlindungan Mitra Jujur (*Asymmetric Attribution & Safe-Harbor Protection*)
Untuk mencegah ketidakadilan di mana Advokat yang jujur dirugikan atau dijebak oleh Klien nakal yang berinisiatif mengajak bertemu offline liar secara sepihak, sistem menerapkan **Atribusi Subjek Pelanggar (*Actor Attribution Engine*)**:
1. **Target Sanksi Presisi (100% pada Pengirim Nakal)**: Jika pesan ajakan ilegal dikirim secara sepihak oleh Klien (`sender_role = Klien`), maka sanksi peringatan, pembekuan sesi, dan *blacklist* **hanya dijatuhkan kepada Klien**. Profil Advokat **TIDAK TERKENA STRIKE (*Zero Penalty*)**.
2. **Kompensasi Penuh untuk Advokat (*Anti-Trap Honorarium Protection*)**: Jika sesi terpaksa dibatalkan/dibekukan oleh sistem akibat pelanggaran Level 2 yang dilakukan Klien, **dana Escrow TETAP DICAIRKAN (*Settled*) 100% kepada Advokat** sebagai kompensasi waktu yang telah diluangkan. Klien kehilangan seluruh hak *refund*.
3. **Whistleblower Immunity Button**: Advokat dilengkapi fitur **"Laporkan Ajakan Ilegal" (*Flag Unsafe/Bypass Attempt*)**. Jika Advokat melaporkan inisiatif Klien nakal, Advokat mendapat poin kepatuhan/reputasi tambahan dan sesi ditutup secara aman dengan jaminan pembayaran Escrow penuh.

---

### 1.4 Kepatuhan Pencairan Escrow Berbasis Produk Kerja (*Deliverable-Triggered Escrow Release*)

Untuk melindungi hak Klien mendapatkan hasil kerja profesional tertulis dan memberikan kepastian pencairan bagi Advokat, pencairan Rekening Penampungan Sementara (*Escrow*) **TIDAK TERPICU** oleh habisnya waktu obrolan semata, melainkan tunduk pada **Matriks Deliverable** berikut:

| Tingkat Layanan (*Tier*) | Objek Utama Layanan | Syarat Pemicu Pencairan Escrow (*Release Trigger*) | SLA Auto-Approval (Perlindungan Mitra) |
| :--- | :--- | :--- | :--- |
| **Tier 1: Gratis** *(Legal Triage 15 Menit)* | Orientasi & penapisan awal perkara hukum | **Sesi Obrolan Selesai**: Tidak melibatkan uang tunai Rupiah, sistem mengkreditkan Poin/Reputasi Internal kepada Advokat. | Cair langsung (*Instant Reputation Credit*) setelah obrolan ditutup. |
| **Tier 2: Premium** *(Konsultasi Hukum Mendalam)* | Diagnosis hukum + Catatan Rekomendasi Resmi | **Rilis Catatan IRAC (*IRAC Consultation Note*)**: Escrow **BARU CAIR** setelah Advokat mengunggah dokumen ringkasan resmi (*Issue, Rule, Application, Conclusion*) ke dasbor Klien. | Jika Klien tidak menekan konfirmasi dalam **2x24 jam** sejak IRAC Note dirilis, sistem mencairkan Escrow otomatis (*Auto-Settlement*). |
| **Tier 3: Pro** *(Legal Drafting & Opinion)* | Produk Dokumen Hukum Final (*Non-Litigation Deliverable*) | **Rilis & Persetujuan Dokumen Final (*Final Document Approved*)**: Escrow **DITAHAN PENUH** dan baru dicairkan setelah Advokat mengunggah draf final (*Kontrak, Legal Opinion bermeterai, atau Somasi*) dan disetujui Klien. | Jika Klien tidak mengajukan revisi dalam **3x24 jam** sejak dokumen diunggah, sistem mencairkan Escrow otomatis (*Auto-Settlement*). |

---

### 1.5 Kepatuhan Ruang Kerja Asinkron & Sanitasi Profil/Media 3-Lapisan (*3-Layer Profile & Media DLP*)

Untuk menutup celah komunikasi pasca-berakhirnya waktu obrolan langsung 60 menit serta mencegah upaya kebocoran kontak di luar ruang percakapan (*Profile & Media Bypass*), sistem memberlakukan standar kepatuhan berikut:

#### 1. Ruang Kerja & Klarifikasi Asinkron Pasca-Sesi (*Asynchronous Deliverable Thread*)
1. **Pemisahan Live Chat vs. Deliverable Q&A**: Ketika durasi obrolan langsung 60 menit habis, ruang percakapan *real-time* otomatis ditutup (*read-only chat history*). Panggilan suara/video (*Voice/Video Call*) otomatis dinonaktifkan.
2. **Pembukaan Jalur Tiket Asinkron**: Untuk Paket Premium (`J-UC11`) dan Paket Pro (`J-UC12, J-UC14`), sistem membuka **Ruang Kerja Asinkron (*Deliverable Thread*)** pada Dasbor Perkara berformat terstruktur seperti sistem komentar/tiket dokumen (*Document Q&A Ticket*).
3. **Fungsi Legal & Label Terstruktur**:
   - **Klarifikasi Fakta Tertinggal**: Advokat mengajukan pertanyaan berlabel `[KLARIFIKASI FAKTA]` kepada Klien jika ada data yang kurang saat merumuskan dokumen.
   - **Review & Klarifikasi Klien**: Klien dapat meminta penjelasan berlabel `[KLARIFIKASI SARAN]` (Paket Premium) atau mengirimkan catatan `[REVISI KLAUSUL]` (Paket Pro).
   - **Inline DLP Enforcement**: Seluruh pesan, komentar, dan lampiran pada Ruang Kerja Asinkron **tetap dipindai secara *real-time* oleh DLP Engine** untuk mencegah penyisipan nomor telepon atau ajakan transaksi di luar sistem.

#### 2. Pertahanan 3-Lapisan Sanitasi Profil & Media (*3-Layer Profile & Media Contact Sanitization*)
1. **Layer 1: Immutable Verified Display Name (`AD/SD-J-09`)**:
   Nama Tampilan Advokat (**Display Name**) dikunci dan di-generate otomatis dari **KTP & Kartu Advokat Peradi resmi** yang diverifikasi admin. Advokat **TIDAK BISA** menyunting nama mereka menjadi mengandung nomor telepon/kontak (contoh pelanggaran: `"Advokat Budi 08123456789"` dilarang total).
2. **Layer 2: Pre-Publication Regex & NLP Sanitization pada Deskripsi Profil**:
   Setiap pembaruan kolom teks profil (Bio, Deskripsi Diri, Pengalaman Kerja, Pencapaian) harus melewati pemindai NLP sebelum dipublikasikan. Jika terdeteksi nomor telepon, kamuflase ejaan angka (*"kosong delapan satu..."*, *"WA"*), email, atau username media sosial, request update **DITOLAK OTOMATIS (`400 Profile Rejected - DLP Contact Violation`)**.
3. **Layer 3: Optical Character Recognition (OCR) pada Foto Profil & Media**:
   Setiap unggahan Foto Profil (*Avatar*) atau gambar lampiran diproses melalui **OCR Sandbox Engine**. Jika hasil ekstraksi teks pada gambar mendeteksi nomor telepon, steganografi teks kontak, atau kode QR eksternal, gambar **DITOLAK (`422 Unprocessable Media - Contact Info Detected in Image`)** dan akun dicatat dalam log pengawasan etik.

---

### 1.6 Batas Kemampuan Filter Teknis & Pertahanan Teori Permainan Ekonomi (*Economic & Behavioral Anti-Evasion Matrix*)

Secara jujur dan realistis (*Corrective Honesty*), tidak ada pemindai teks/gambar (baik Regex, NLP, maupun LLM) yang memiliki tingkat akurasi 100% (*zero false negative*) dalam mendeteksi sandi morse, enkripsi khusus, atau bahasa sandi buatan baru (*invented slang*) yang disepakati pengguna di luar sistem.

Oleh karena itu, untuk menangani upaya penggelapan transaksi ekstrim yang lolos dari pemindai teknis, Justifiqa menerapkan **3 Pilar Pertahanan Teori Permainan Ekonomi & Analisis Perilaku (*Economic & Behavioral Game Theory*)**:

1. **Pilar 1: Disinsentif Klien — Hilangnya Jaminan Perlindungan Escrow (*Zero Escrow Warranty*)**
   - Klien bertransaksi di dalam Justifiqa karena jaminan uang kembali (*Money-Back Guarantee*) melalui Escrow jika Advokat wanprestasi atau dokumen cacat hukum.
   - Jika Klien menggunakan sandi rahasia untuk bertransaksi langsung ke rekening pribadi Advokat di luar sistem, Klien menanggung risiko 100% kehilangan uang tanpa hak gugatan atau pengembalian dana dari platform.

2. **Pilar 2: Disinsentif Advokat — Sanksi Pemblokiran Permanen & Pencabutan Reputasi (*Reputational Death*)**
   - Advokat mitra bergantung pada peringkat algoritmik (*Badge/Rating*) dan riwayat ulasan positif untuk mendapatkan arus klien berkelanjutan.
   - Jika Advokat terbukti melakukan penggelapan transaksi eksternal (melalui laporan *Whistleblower Button* Klien atau audit rahasia *mystery shopper* Admin):
     - Akun Advokat **DI-BANNED PERMANEN**, seluruh poin reputasi dan saldo promosi hangus.
     - Pelanggaran dilaporkan secara resmi ke **Dewan Kehormatan Peradi** sebagai pelanggaran integritas digital.
   - Secara matematis, mengorbankan reputasi karier jangka panjang demi menghindari biaya platform pada 1 transaksi adalah **keputusan irasional secara ekonomi**.

3. **Pilar 3: Analisis Anomali Perilaku Sesi (*Behavioral Fraud & Anomaly Detection*)**
   - Sistem memantau pola perilaku transaksi tanpa membaca isi sandi pesan:
     - **High Drop-Off Anomaly**: Jika seorang Advokat memiliki rasio sesi konsultasi yang diakhiri prematur (< 5 menit) di atas batas normal tanpa menghasilkan deliverable atau pembayaran lanjut.
     - **Conversion Anomaly**: Sesi konsultasi berulang dengan Klien yang sama tanpa ada konversi layanan Pro/Premium.
   - Akun dengan skor anomali tinggi otomatis masuk antrean audit investigasi oleh Admin Backoffice (`AD/SD-J-10`).

---

### 1.7 Compliance Mandate Phase 2 — Corporate Intake & e-KYC Forensik

Bagian ini adalah kontrak kepatuhan normatif untuk implementasi mendatang. Kata **WAJIB**, **DILARANG**, dan **HANYA** bersifat mengikat bagi kode TypeScript dan SQL. `J-UC23` dan `J-UC24` di bawah adalah alias traceability **PROVISIONAL TARGET** sampai artefak Use Case kanonik menetapkan ID-nya. Status dokumentasi `MANDATORY TARGET` tidak berarti kontrol tersebut sudah tersedia atau sudah lulus audit produksi. Implementasi baru boleh dinyatakan patuh setelah tes TypeScript, migrasi/reset database, concurrency test, RLS/proacl audit, dan bukti WORM terkait lulus.

| Mandate ID | Use Case dan Jejak UML | Compliance Mandate yang Mengikat | Kewajiban TypeScript Mendatang | Kewajiban SQL/PostgreSQL Mendatang | Bukti Verifikasi Wajib | Status Saat Ini |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CM-P2-CORP-01** | `J-UC23` → `AD-P2-01 AD01-01..03` → `SD-P2-01` | Corporate intake, parties, natural-person BO, consent/version, service order, fee lines, dan milestone **WAJIB** divalidasi dan dibuat sebagai satu unit konsisten; badan hukum **DILARANG** menjadi record BO. | DTO/schema memvalidasi bentuk PT/CV, natural-person BO, consent, dan legal scope version; service mengorkestrasi satu atomic persistence command. | FK/check constraint dan transaksi atomik menjaga case/order/milestone/BO; mutasi server-side memakai expected-state guard, RLS, dan audit append-only. | Tes invalid payload/no partial write; constraint test BO; audit event `AD01-01..03`. | **MANDATORY TARGET** |
| **CM-P2-CORP-02** | `J-UC23` → `AD01-04..08` → `SD-P2-01` | Notaris **HANYA** boleh ditugaskan setelah pembayaran tervalidasi dan escrow berstatus `HELD_IN_ESCROW`; kegagalan webhook **DILARANG** menghasilkan mutasi finansial. | Controller memverifikasi kontrak webhook; service memisahkan provider I/O dari transaksi DB dan tidak membuka workspace sebelum escrow lock terkonfirmasi. | HMAC/event/order/nominal diverifikasi; event dan escrow di-row-lock (`SELECT ... FOR UPDATE`); idempotency mencegah double settlement; ledger bersifat append-only. | Replay/concurrency test; status `PENDING_PAYMENT → HELD_IN_ESCROW`; bukti `AD01-04..08`. | **MANDATORY TARGET** |
| **CM-P2-CORP-03** | `J-UC23` → `AD01-09..14` → `SD-P2-01` | Submission AHU/OSS yang `REJECTED` **WAJIB** kembali melalui `DRAFT → SUBMITTED`; mismatch rekonsiliasi **WAJIB** menghasilkan terminal `COMPLIANCE_HOLD` dan memblok payout. Dokumen final dan payout result **WAJIB** memiliki bukti WORM. | Callback signature/replay guard, loop revisi, rekonsiliasi digest/reference, dan payout role-aware wajib berada di service; credential pemerintah **DILARANG** masuk payload/log persistence. | Job/idempotency key, final digest, integrity anchor, payout mutex, dan WORM audit wajib persisten; payout tidak boleh memakai fungsi khusus Advokat untuk pembayaran Notaris tanpa port/kontrak role-aware. | Callback spoof/replay test; rejection-loop test; mismatch blocks payout; WORM immutability test; bukti `AD01-09..14`. | **MANDATORY TARGET** |
| **CM-P2-EKYC-01** | `J-UC24` → `AD02-01..08, AD02-15` → `SD-P2-02` | e-KYC **DILARANG** aktif sebelum escrow `HELD_IN_ESCROW`. Deadline global **WAJIB** tepat `expires_at = escrow_locked_at + 7 × 24 jam` dan **WAJIB** diperiksa pada invitation resolution, pembuatan provider session, callback provider, callback manual review, dan watchdog. | Semua command/callback memakai satu deadline policy berbasis server time; request lewat deadline ditolak sebagai terminal expiry (kontrak transport `HTTP 410`) dan tidak boleh mengubah outcome pihak. | Aggregate envelope–escrow dan `expires_at TIMESTAMPTZ` wajib terikat; pemeriksaan deadline/status terminal dilakukan di dalam row lock agar callback terlambat tidak menang melawan expiry sweep. | Boundary tests tepat sebelum/saat/setelah deadline; callback-vs-watchdog race test; bukti `AD02-03..08, AD02-15`. | **MANDATORY TARGET — aggregate/deadline belum tersedia penuh** |
| **CM-P2-EKYC-02** | `J-UC24` → `AD02-09..12` → `SD-P2-02` | Satu pihak yang terbukti ilegal **ATAU** mencapai tepat tiga kegagalan **liveness** **WAJIB** memicu Global Halt untuk semua pihak. Kegagalan OCR/device/TTD yang belum membuktikan ilegal **DILARANG** menambah counter liveness dan **WAJIB** menuju `REQUIRES_MANUAL_REVIEW`. | Gunakan counter bernama/bermakna `liveness_attempt_count`; service memisahkan `ILLEGAL_CONFIRMED`, `LIVENESS_FAILED_3X`, dan hasil ambigu; tidak boleh ada irreversible rejection otomatis untuk hasil ambigu. | Increment counter harus atomik; constraint mencegah nilai di luar `0..3`; transisi terminal memakai expected-state check dan row lock; histori verifikasi tidak dihapus. | Tes dua gagal lalu lulus; gagal ketiga; tiga mismatch non-liveness; illegal pada pihak mana pun; bukti `AD02-09..12`. | **MANDATORY TARGET** |
| **CM-P2-EKYC-03** | `J-UC24` → `AD02-09, AD02-12, AD02-14..17` → `SD-P2-02` | Global Halt **WAJIB** bersifat all-or-nothing: `ILLEGAL_CONFIRMED`/`LIVENESS_FAILED_3X` menetapkan envelope `VOIDED`, sedangkan nonresponse sampai TTL menetapkan `EXPIRED`; sinkronisasi seluruh pihak dan seluruh command/callback lanjutan **WAJIB** menghormati status terminal global. | Semua terminal cause memanggil satu handler `haltGlobally(cause)` yang idempoten; notifikasi tidak boleh mendahului commit terminal/refund. | Envelope, party, refund, ledger, dan WORM audit berubah dalam transaksi/mutex yang konsisten; unique idempotency key mencegah halt/refund ganda. | Multi-party propagation/synchronization test; duplicate callback/sweep test; terminal-state mutation rejection; bukti `AD02-09, AD02-12, AD02-14..17`. | **MANDATORY TARGET** |
| **CM-P2-EKYC-04** | `J-UC24` → `AD02-17` → seluruh terminal halt `SD-P2-02` | Setiap Global Halt setelah escrow terkunci **WAJIB** mengembalikan 100% dana kepada Klien secara idempoten dan menghasilkan `escrow_transactions.status = REFUNDED_TO_CLIENT`; sukses e-KYC **DILARANG** mencairkan dana dan mempertahankan `HELD_IN_ESCROW`. | Service memanggil satu port refund server-only dan menangani retry provider tanpa double refund; UI/realtime hanya memproyeksikan hasil setelah commit. | Refund memakai row-level mutex/server-only function, ledger append-only, authenticated provider reference, dan WORM audit; privilege eksekusi wajib dibatasi ke role server. | Double-submit/refund race test; ledger reconciliation; proacl/proconfig audit; bukti `AD02-16..17`. | **MANDATORY TARGET** |
| **CM-P2-EKYC-05** | `J-UC24` → `AD02-07..13` → `SD-P2-02` | Justifiqa **DILARANG** menyimpan raw KTP, selfie/video liveness, template/embedding biometrik, atau payload provider mentah. Hanya metadata allow-list, opaque reference, status kanonik, digest, dan timestamp yang boleh dipersistenkan. | Browser mengirim media langsung ke SDK/provider; logger, analytics, error telemetry, dan callback DTO wajib memakai allow-list/redaction. | Tidak boleh ada kolom/object path raw biometric; RLS membatasi metadata; WORM hanya menyimpan digest dan event minimum, bukan media/payload mentah. | Schema/log scan; payload redaction test; provider callback fixture; bukti `AD02-07..13`. | **MANDATORY TARGET** |

Sumber domain khusus untuk mandate di atas adalah `CORPORATE_CONCIERGE_LEGAL_AND_PARTNER_MATRIX.md`, `EKYC_AND_MULTIPARTY_SIGNING_LEGAL_MATRIX.md`, `PHASE_2_ACTIVITY_DIAGRAMS.md`, dan `PHASE_2_SEQUENCE_DIAGRAMS.md`. Jika implementasi TypeScript/SQL bertentangan, mandate ini dan aturan hukum yang lebih ketat berlaku sampai dokumen diubah melalui review kepatuhan.

---

## BAGIAN II: REGULASI & KEPATUHAN — APLIKASI MANDIRI QUALIFA (DOMAIN PSIKOLOGI KLINIS)

### 2.1 Ringkasan Regulasi Utama Kesehatan Mental & Psikologi
| Regulasi Utama | Pasal Kunci | Relevansi untuk Qualifa |
| :--- | :--- | :--- |
| **UU 18/2014 tentang Kesehatan Mental** | Pasal 22, 23, 24 | Hak atas kerahasiaan kondisi kejiwaan (*Patient-Clinician Confidentiality*) dan jaminan penanganan krisis psikiatrik/psikologis. |
| **Kode Etik Psikologi HIMPSI 2019** | Pasal 23, 24, 25, 26, 27 | Kewajiban memegang teguh rahasia rekam klinis, asas persetujuan (*Informed Consent*), dan larangan eksploitasi relasi terapeutik. |
| **UU PDP No. 27 Tahun 2022** | Pasal 26, 46 | Data kejiwaan adalah **Data Pribadi Spesifik/Sensitif dengan Perlindungan Ekstra Tinggi**. Dilarang keras dipindahkan/disimpan di server luar negeri. |

---

### 2.2 Klasifikasi & Enkripsi Data Kesehatan Mental (Qualifa)
| Kategori Data | Contoh Data | Tingkat Sensitivitas | Standar Enkripsi & Proteksi | Masa Retensi | Hak Akses (*RBAC*) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Identitas Klien Psikologi** | NIK, Nama Samaran (*Pseudonym*), Kontak darurat | Tinggi (*Sensitive PII*) | AES-256-GCM + Anonymization Layer | 10 Tahun | Klien bersangkutan, Psikolog penanganan |
| **Jurnal Mood Tracker Harian** | Emotikon tren, catatan perasaan harian | **Sangat Rahasia / Klinis** | **Zero-Knowledge Architecture (E2EE)** | 10 Tahun | **Hanya Klien** (Psikolog melihat dalam bentuk grafik via consent per sesi) |
| **Skor Asesmen Klinis DASS-21** | Skor Depression, Anxiety, Stress, Interpretasi | **Sangat Rahasia / Klinis** | AES-256-GCM + Client-Side Decrypt | 10 Tahun | Klien bersangkutan, Psikolog penanggung jawab, Supervisor Klinis |
| **Catatan Terapi DAP Note** | Data, Assessment, Plan klinis | **Sangat Rahasia / Klinis** | AES-256-GCM + E2EE Wajib | 20 Tahun (Sesuai Kode Etik) | Psikolog pembuat catatan, Supervisor Klinis (atas mandat etik) |
| **Flag Krisis & Alert 119** | Pemicu ancaman bunuh diri, timestamp krisis | **Kritikal / Darurat** | AES-256-GCM + Isolated Emergency Vault | 20 Tahun | Psikolog aktif, Tim Respons Krisis, Supervisor HIMPSI |
| **Audio Meditasi Relaksasi** | Trek MP3 relaksasi, metadata mindfulness | Rendah (Publik) | Standard SSL / CDN Distribution | Permanen | Seluruh pengguna aktif Qualifa |
| **Audit Log WORM Qualifa** | Jejak akses rekam klinis, sidang etik, login | **Kritikal / Forensik** | **Immutable WORM Storage (SHA-256 Chain)** | Permanen | Admin Etik Qualifa, Dewan Komite Etik HIMPSI |

---

## 3. ARSITEKTUR DATA RESIDENCY & LARANGAN CROSS-BORDER
Sesuai amanat **UU PDP No. 27 Tahun 2022 Pasal 26 & Pasal 46**, seluruh data sensitif hukum (Justifiqa) dan data rekam kesehatan mental (Qualifa) **WAJIB DISIMPAN DAN DIPROSES DI DALAM WILAYAH HUKUM REPUBLIK INDONESIA**.
1. **Pusat Data Utama (*Primary Database*)**: Terletak di *Cloud Data Center* wilayah Indonesia (AWS Region Jakarta `ap-southeast-3` atau GCP Jakarta `asia-southeast2`).
2. **WORM Storage Vault**: Penyimpanan log forensik ber-hash SHA-256 abadi berada pada *Object Storage Lock (Compliance Mode)* di Indonesia.
3. **Pengecualian CDN Asset Publik**: Hanya aset statis publik tanpa PII/PHI (seperti gambar antarmuka, berkas suara meditasi MP3, dan *stylesheet* antarmuka) yang diizinkan menggunakan *Global CDN* (Cloudflare/CloudFront).

---

## BAGIAN III: CORE GOVERNANCE & ARCHITECTURAL GUARDRAILS (JUSTIFIQA COMPLIANCE FRAMEWORK)

Seluruh perancangan diagram alur (`AD`), diagram interaksi (`SD`), dan implementasi kode Justifiqa **WAJIB** tunduk pada 4 pilar tata kelola arsitektur berikut:

### 3.1 Prinsip Persetujuan Ganda (*4-Eyes Principle / Dual-Sign-Off Rule*)
Untuk mencegah penyalahgunaan wewenang sepihak (*unilateral abuse of power*), kesalahan mitigasi, dan menjaga *Due Process of Law*, seluruh tindakan administratif berdampak tinggi **DILARANG KERAS** dieksekusi oleh satu aktor admin tunggal.
| Tindakan Kritis (*High-Impact Action*) | Aktor Inisiator (*Maker / Tahap 1*) | Aktor Validator (*Checker / Approver Tahap 2*) | Bukti Audit yang Wajib Dilampirkan |
| :--- | :--- | :--- | :--- |
| **Penjatuhan Sanksi Suspend Akun (`AD/SD-J-10`)** | Admin Legal Investigasi | Supervisor Legal / Komite Etik | Hash SHA-256 Surat Teguran & Bukti Forensik Pelanggaran Berat |
| **Pencairan / Rollback Darurat Dana Escrow** | Admin Keuangan (*Finance Maker*) | Manajer Keuangan (*Finance Checker*) | Berita Acara Sengketa & Tiket Resolusi Dispute |
| **Pencabutan / Pembatalan Sanksi Advokat** | Admin Legal | Dewan Kehormatan / Compliance Head | Berita Acara Klarifikasi / Putusan Banding |

### 3.2 Regulasi Waktu Konsultasi Daring (*Fair-Clock & Smart SLA Engine*)
Untuk mencegah manipulasi waktu konsultasi (*stalling tactics*) dan melindungi hak konsumen hukum:
1. **Trigger Mulai Sesi (*Active Session Trigger*)**: Timer konsultasi (45–90 menit) **tidak boleh berdetak** sebelum Advokat mengirimkan respons pertama yang substansial di ruang obrolan E2EE.
2. **Jeda Otomatis SLA 5 Menit (*Auto-Pause SLA*)**: Jika Advokat tidak merespons pertanyaan Klien dalam durasi $> 5$ menit, sistem otomatis **menjeda (*PAUSE*)** timer utama sesi.
3. **Penalti Pengabaian Sesi (*AFK Abandonment Clause*)**: Jika Advokat tidak aktif selama $> 15$ menit tanpa persetujuan penundaan, Klien berhak mengklaim pengembalian dana Escrow 100% secara otomatis.

### 3.3 Kepatuhan Sesi Tatap Muka (*Offline Consultation QR-Code Handshake*)
Untuk memitigasi kebocoran transaksi di luar sistem (*Platform Leakage*) pada layanan Tier Premium & Pro:
* **Verifikasi Kehadiran Fisik**: Sesi konsultasi offline wajib dipicu melalui pemindaian **QR Code Check-in** di lokasi kantor hukum resmi/mitra terverifikasi.
* **Pelepasan Escrow Berbasis QR**: Pencairan dana Escrow konsultasi offline hanya sah jika telah terjadi pemindaian ganda (*Dual QR Check-in & Check-out*).

### 3.4 Akuntansi Terpisah Token Virtual vs. Tunai Escrow (*Dual-Bucket Ledger*)
* **Uang Tunai Rupiah via Payment Gateway**: Dicatat pada Rekening Escrow Sementara $\rightarrow$ Dicairkan ke Saldo Dompet Tunai Advokat (*Cashable Withdrawal*).
* **Token Virtual / Uang-Uangan (*Promo Welcome Credit*)**: Dicatat pada *Virtual Token Ledger* $\rightarrow$ Dikreditkan sebagai **Poin/Token Internal Non-Tunai (*Non-Cashable Reputation / In-App Reward*)**. Advokat tidak dapat mencairkan token virtual menjadi uang Rupiah.
