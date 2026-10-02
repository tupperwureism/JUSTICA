# Standard Operating Procedure (SOP): Core Governance & Architectural Compliance

Dokumen ini adalah acuan tata kelola mutlak (*Mandatory Governance SOP*) bagi Agen maupun Developer dalam merancang alur aktivitas (`AD`), diagram sekuens (`SD`), dan kode sistem Justifiqa. Seluruh aturan di bawah ini **WAJIB** ditegakkan tanpa kecuali.

---

## 1. Prinsip Persetujuan Ganda (*4-Eyes Principle / Dual-Sign-Off Rule*)
Setiap tindakan administratif yang berdampak hukum atau finansial tinggi **DILARANG KERAS** dieksekusi oleh satu aktor tunggal. Sistem wajib memisahkan peran **Inisiator (*Maker*)** dan **Validator (*Checker*)**:
1. **Penjatuhan Sanksi Suspend Akun (`AD/SD-J-21`)**:
   - *Inisiator*: Admin Legal Investigasi (mengajukan draf sanksi & melampirkan bukti WORM SHA-256).
   - *Validator*: Supervisor Legal / Komite Etik (melakukan *review & final approval/reject*).
2. **Pencairan / Rollback Dana Escrow Sengketa**:
   - *Inisiator*: Admin Keuangan (*Finance Maker*).
   - *Validator*: Manajer Keuangan (*Finance Checker*).

---

## 2. Regulasi Waktu Konsultasi Daring (*Fair-Clock & Smart SLA Engine*)
1. **Active Session Trigger**: Timer konsultasi (45–90 menit) **TIDAK BOLEH BERDETAK** sebelum Advokat mengirimkan respons substansial pertama atas pesan Klien di ruang chat E2EE.
2. **Auto-Pause SLA 5 Menit**: Jika Advokat tidak membalas pesan Klien dalam $> 5$ menit, server otomatis **MENJEDA (*PAUSE*)** timer utama sesi.
3. **AFK Abandonment Penalty**: Jika Advokat tidak aktif selama $> 15$ menit berturut-turut, sistem otomatis mengaktifkan tombol klaim *Refund Escrow 100%* bagi Klien.

---

## 3. Konsultasi Tatap Muka (*Offline Consultation QR-Code Handshake*)
Untuk mencegah *Platform Leakage* (transaksi di luar sistem) pada Tier Premium & Pro:
1. **Lokasi Terverifikasi**: Hanya sah dilakukan di Kantor Hukum resmi terdaftar atau *Legal Lounge* mitra Justifiqa.
2. **Dual QR Handshake**: Sesi dimulai via pemindaian **QR Code Check-in** di lokasi. Pelepasan dana Escrow hanya dipicu setelah pemindaian **QR Code Check-out**.

---

## 4. Akuntansi Terpisah Token Virtual vs. Tunai Escrow (*Dual-Bucket Ledger*)
1. **Uang Tunai Rupiah via Payment Gateway**: Dicatat di Rekening Escrow Sementara $\rightarrow$ Dicairkan ke Saldo Dompet Tunai Advokat (*Cashable Withdrawal*).
2. **Token Virtual (*Welcome Bonus / Uang-Uangan*)**: Dicatat di *Virtual Token Ledger* $\rightarrow$ Dikreditkan ke profil Advokat sebagai **Poin/Token Internal Non-Tunai (*Non-Cashable Reputation / In-App Reward*)**.

---

## 5. Pencairan Escrow Berbasis Produk Kerja (*Deliverable-Triggered Escrow Release*)
Pencairan Rekening Penampungan Sementara (*Escrow*) **DILARANG KERAS** dipicu hanya oleh berakhirnya waktu *timer chat*. Pencairan tunduk pada capaian produk kerja (*deliverable*):
1. **Tier Gratis (Legal Triage)**: Cairkan poin/reputasi setelah sesi obrolan ditutup.
2. **Tier Premium (Konsultasi Mendalam)**: Escrow **BARU CAIR** setelah Advokat menerbitkan/mengunggah dokumen **IRAC Consultation Note** (atau SLA auto-approve 2x24 jam).
3. **Tier Pro (Legal Drafting / Non-Litigation Deliverable)**: Escrow **BARU CAIR** setelah Advokat mengunggah **Dokumen Hukum Final (*Kontrak / Legal Opinion / Somasi*)** dan disetujui oleh Klien (atau SLA auto-approve 3x24 jam).

---

## 6. Pre-Broadcast Inline DLP Interception & Zero-Tolerance Anti-Bypass
1. **Inline Middleware Scan (~30ms)**: Setiap pesan *chat* masuk ke lapisan *Edge Gateway Backend* dan diverifikasi **SEBELUM** di-broadcast ke *socket* lawan bicara (*Zero Exposure*).
2. **Level 1 (Drop & Red Alert)**: Jika terdeteksi kontak/ajakan transaksi di luar platform, pesan **langsung dibatalkan (*Message Dropped*)**.
3. **Level 2 (Instant Freeze)**: Jika pengirim mengulangi percobaan (*evasion attempt*), sistem **langsung membekukan sesi**, menahan Escrow, dan mengeskalasi ke `J-UC21` untuk pembekuan akun pengirim nakal (*Actor Attribution Engine*).

---

## 7. Asynchronous Deliverable Thread & Multi-Layer Profile/Media DLP Sanitization
1. **Asynchronous Deliverable Q&A Thread**: Pasca-habisnya waktu obrolan langsung 60 menit, percakapan *live* ditutup (`read-only`) dan digantikan oleh **Ruang Kerja Asinkron (*Deliverable Thread*)** pada Dasbor Perkara untuk klarifikasi fakta tertinggal atau pengajuan catatan revisi draf (`J-UC12, J-UC14`). Seluruh pesan/lampiran di thread ini tetap dipindai *Inline DLP*.
2. **Layer 1 - Verified Display Name Lock**: Nama Tampilan Advokat dikunci dari KTP/Kartu Peradi terverifikasi (`AD/SD-J-09`); dilarang menyisipkan nomor HP/kontak.
3. **Layer 2 - Profile Text NLP Sanitization**: Setiap pembaruan Bio/Deskripsi/Pengalaman dipindai NLP/Regex sebelum tayang; terdeteksi nomor telepon/kontak $\rightarrow$ `400 Profile Rejected`.
4. **Layer 3 - Media OCR Sandbox Engine**: Foto Profil/Avatar dan gambar lampiran dipindai OCR; terdeteksi teks nomor telepon/steganografi kontak $\rightarrow$ `422 Unprocessable Media`.

---

## 8. Pertahanan Teori Permainan Ekonomi & Analisis Perilaku (*Economic & Behavioral Game Theory*)
1. **Pengakuan Keterbatasan Filter Teknis (*Corrective Honesty*)**: Filter teks/gambar tidak dapat mencapai akurasi 100% terhadap sandi morse, *cipher*, atau bahasa sandi baru buatan pengguna (*invented slang*).
2. **Disinsentif Klien (*Zero Escrow Warranty*)**: Klien yang bertransaksi di luar sistem kehilangan 100% jaminan uang kembali (*Money-Back Guarantee*) jika Advokat wanprestasi atau draf cacat hukum.
3. **Disinsentif Advokat (*Reputational Death*)**: Advokat yang terbukti melakukan penggelapan transaksi eksternal akan di-banned permanen, kehilangan seluruh riwayat ulasan/rating, dan dilaporkan ke Dewan Kehormatan Peradi.
4. **Behavioral Fraud Detection**: Sistem memantau anomali rasio putus sesi prematur (*high drop-off rate*) dan rasio konversi abnormal untuk mengeskalasi akun mencurigakan ke proses investigasi Admin Backoffice (`AD/SD-J-10`).
