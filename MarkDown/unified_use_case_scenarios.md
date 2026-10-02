# Spesifikasi Skenario Use Case - Unified Tele-Consultation Platform

Dokumen ini berisi spesifikasi skenario tertulis (*Use Case Scenarios*) untuk seluruh **26 Use Case terpadu** pada sistem **Unified Tele-Consultation Platform** (Domain Hukum, Psikologi, dan Kesehatan Medis). Setiap skenario merinci deskripsi, aktor, kondisi prasyarat (*pre-condition*), kondisi akhir (*post-condition*), daftar periksa kepatuhan regulasi (*Compliance Checklist & Regulasi Domain*), alur sukses utama (*basic flow*), dan alur alternatif/gagal (*alternative flow*).

> **Catatan UML & Kepatuhan**: 
> 1. Aktor hanya diisi oleh entitas di luar sistem (*external entities*). Sistem itu sendiri bertindak sebagai batasan sistem (*system boundary*).
> 2. Seluruh alur kerja menerapkan standar regulasi ketat: UU No. 17 Tahun 2023 (Kesehatan), Permenkes 24/2022 (Rekam Medis Elektronik), Permenkes 73/2016 (Standar Pelayanan Farmasi), Kode Etik HIMPSI (Psikologi), UU No. 18 Tahun 2003 (Advokat & Privilege Marking), serta UU No. 27 Tahun 2022 (Pelindungan Data Pribadi / UU PDP).

---

## DAFTAR ISI KELOMPOK AKTOR & DOMAIN
* [A. Aktor: Klien (Client)](#a-aktor-klien-client)
  * [UC-01: Melakukan Registrasi Klien](#uc-01-melakukan-registrasi-klien)
  * [UC-02: Melakukan Login Klien](#uc-02-melakukan-login-klien)
  * [UC-03: Memilih Mitra Profesional](#uc-03-memilih-mitra-profesional)
  * [UC-04: Melakukan Konsultasi](#uc-04-melakukan-konsultasi)
  * [UC-05: Melakukan Pembayaran](#uc-05-melakukan-pembayaran)
  * [UC-06: Memberikan Ulasan dan Rating](#uc-06-memberikan-ulasan-dan-rating)
* [B. Aktor: Mitra Profesional (Professional Partner)](#b-aktor-mitra-profesional-professional-partner)
  * [UC-07: Melakukan Registrasi Mitra Profesional](#uc-07-melakukan-registrasi-mitra-profesional)
  * [UC-08: Melakukan Login Mitra Profesional](#uc-08-melakukan-login-mitra-profesional)
  * [UC-09: Mengonfirmasi Status Ketersediaan (on/off)](#uc-09-mengonfirmasi-status-ketersediaan-onoff)
  * [UC-10: Melayani Konsultasi](#uc-10-melayani-konsultasi)
  * [UC-11: Membuat Catatan Sesi Konsultasi](#uc-11-membuat-catatan-sesi-konsultasi)
  * [UC-12: Mengeluarkan Output Dokumen Konsultasi](#uc-12-mengeluarkan-output-dokumen-konsultasi)
  * [UC-17: Mengelola Saldo dan Penarikan Dana Mitra](#uc-17-mengelola-saldo-dan-penarikan-dana-mitra)
* [C. Aktor: Admin Sistem (System Admin)](#c-aktor-admin-sistem-system-admin)
  * [UC-13: Memverifikasi Berkas Kredensial Mitra & SKTM Pro Bono](#uc-13-memverifikasi-berkas-kredensial-mitra--sktm-pro-bono)
  * [UC-14: Mengelola Data Akun Klien](#uc-14-mengelola-data-akun-klien)
  * [UC-15: Mengelola Data Akun Mitra Profesional](#uc-15-mengelola-data-akun-mitra-profesional)
  * [UC-16: Memantau Laporan Transaksi](#uc-16-memantau-laporan-transaksi)
* [D. Skenario Spesifik Domain (Kesehatan, Psikologi, Hukum)](#d-skenario-spesifik-domain-kesehatan-psikologi-hukum)
  * [Psi-UC01: Mengisi Jurnal Mood Harian (Domain Psikologi)](#psi-uc01-mengisi-jurnal-mood-harian-domain-psikologi)
  * [Psi-UC02: Mengakses Audio Meditasi (Domain Psikologi)](#psi-uc02-mengakses-audio-meditasi-domain-psikologi)
  * [Psi-UC03: Mengisi Tes Asesmen Psikologi DASS-21 (Domain Psikologi)](#psi-uc03-mengisi-tes-asesmen-psikologi-dass-21-domain-psikologi)
  * [Huk-UC01: Mengunggah Berkas Perkara (Domain Hukum)](#huk-uc01-mengunggah-berkas-perkara-domain-hukum)
  * [Huk-UC02: Membuat Draf Dokumen Hukum (Domain Hukum)](#huk-uc02-membuat-draf-dokumen-hukum-domain-hukum)
  * [Huk-UC03: Melakukan Konsultasi Pro Bono (Domain Hukum)](#huk-uc03-melakukan-konsultasi-pro-bono-domain-hukum)

---
## A. Aktor: Klien (Client)

### UC-01: Melakukan Registrasi Klien
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada (Integrasi API Dukcapil & BPJS)
* **Deskripsi Singkat**: Calon klien mendaftarkan akun baru agar dapat mengakses layanan konsultasi multidisiplin di platform.
* **Pre-condition**: Klien belum terdaftar dan tidak sedang masuk ke akun lain.
* **Post-condition**: Akun klien baru berhasil dibuat di database dengan status aktif dan rekam persetujuan (*consent*) tersimpan ber-hash.
* **Compliance Checklist & Regulasi Domain**:
  * **UU PDP No. 27/2022**: Kewajiban pengumpulan *granular consent* secara terpisah untuk pemrosesan data medis sensitif, data hukum pribadi, dan catatan psikologi klinis.
  * **UU No. 17 Tahun 2023 (Kesehatan)**: Validasi identitas tunggal berbasis NIK dan integrasi kepesertaan BPJS Kesehatan (untuk layanan rujukan/subsidi).
  * **Kode Etik HIMPSI**: Verifikasi domain email institusi (`.ac.id`) khusus bagi psikolog magang atau mahasiswa psikologi yang mendaftar sebagai akun observasi klinis di bawah supervisi.
* **Alur Utama (Basic Flow)**:
  1. Klien membuka halaman pendaftaran akun di aplikasi.
  2. Sistem menampilkan formulir registrasi (Nama Lengkap, NIK/Nomor KTP, Email, Nomor Telepon, Nomor BPJS opsional, dan Kata Sandi) beserta kotak centang *granular consent* per domain layanan.
  3. Klien mengisi data profil, mencentang persetujuan pemrosesan data sensitif sesuai domain yang ingin diakses, dan mengklik tombol "Daftar".
  4. Sistem melakukan validasi format input dan melakukan pemanggilan API eksternal (Dukcapil API) untuk memverifikasi keabsahan NIK dan kecocokan nama.
  5. *[Domain Psikologi Magang]* Jika pendaftar menandai diri sebagai mahasiswa magang klinis, sistem memvalidasi bahwa email yang digunakan menggunakan domain akademis resmi (`.ac.id`).
  6. Sistem mengirimkan kode verifikasi (OTP) ke email atau nomor WhatsApp terdaftar.
  7. Klien memasukkan kode OTP yang valid.
  8. Sistem menyimpan data akun baru di database dengan status `ACTIVE` dan mencatat *timestamp* serta bukti *granular consent* dalam log audit WORM.
  9. Sistem menampilkan pesan sukses dan mengarahkan klien ke halaman Dasbor Utama.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. NIK / Email / Nomor Telepon Sudah Terdaftar (Duplikasi)**:
    1. Sistem mendeteksi bahwa NIK, email, atau nomor telepon sudah ada di database sistem.
    2. Sistem menampilkan pesan error: *"NIK, Email, atau Nomor Telepon sudah terdaftar. Silakan gunakan fitur Lupa Kata Sandi jika ini akun Anda"*.
    3. Klien diminta memasukkan data yang belum terdaftar atau masuk ke akun lama.
  * **4b. Verifikasi NIK ke Dukcapil Gagal / Tidak Cocok**:
    1. API Dukcapil mengembalikan status NIK tidak ditemukan atau nama tidak sesuai dengan database kependudukan nasional.
    2. Sistem menampilkan pesan error: *"Data NIK tidak cocok dengan catatan kependudukan nasional. Harap periksa kembali nomor KTP Anda"*.
    3. Pendaftaran dibatalkan sementara hingga klien mengoreksi NIK.
  * **5a. Domain Email Tidak Valid untuk Akun Magang**:
    1. Pendaftar magang psikologi menggunakan email publik (`@gmail.com` / `@yahoo.com`).
    2. Sistem menolak pendaftaran status magang dan meminta email resmi institusi pendidikan (`.ac.id`).
  * **7a. Kode OTP Salah atau Kedaluwarsa**:
    1. Kode OTP yang dimasukkan tidak cocok atau melebihi batas waktu 5 menit.
    2. Sistem menampilkan error dan memberikan opsi untuk meminta ulang kode verifikasi maksimal 3 kali sebelum pemblokiran sementara 30 menit.

---

### UC-02: Melakukan Login Klien
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Klien masuk ke dalam aplikasi menggunakan kredensial akun dan verifikasi faktor kedua (OTP/2FA).
* **Pre-condition**: Klien sudah memiliki akun aktif di platform.
* **Post-condition**: Klien berhasil masuk dan mendapatkan token sesi aktif (*JWT Encrypted*) untuk mengakses dasbor utama.
* **Compliance Checklist & Regulasi Domain**:
  * **UU PDP No. 27/2022**: Kewajiban enkripsi sesi komunikasi (TLS 1.3), pembubuhan *Secure & HttpOnly Cookie*, serta pencatatan audit trail aktivitas login (IP Address, Device ID, Timestamp).
  * **Permenkes 24/2022**: Kewajiban pengamanan akses menuju Rekam Medis Elektronik melalui autentikasi berlapis (MFA / OTP) pada perangkat baru.
* **Alur Utama (Basic Flow)**:
  1. Klien memasukkan Email/Nomor Telepon dan Kata Sandi pada halaman Login.
  2. Klien mengklik tombol "Masuk".
  3. Sistem memverifikasi kecocokan *hash* kata sandi di database.
  4. Sistem memeriksa status akun di database. Jika status `ACTIVE`, sistem memeriksa apakah login dilakukan dari perangkat yang dikenali.
  5. Jika perangkat baru atau parameter keamanan membutuhkan, sistem mengirimkan kode OTP ke nomor telepon/email Klien.
  6. Klien memasukkan kode OTP pada layar verifikasi.
  7. Sistem memvalidasi kode OTP, membuat token sesi baru (*JSON Web Token* dengan masa berlaku 24 jam), dan mencatat log aktivitas login di tabel audit.
  8. Sistem mengarahkan klien ke halaman Dasbor Utama Klien.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Kredensial Salah**:
    1. Sistem mendeteksi email/nomor telepon tidak terdaftar atau kata sandi keliru.
    2. Sistem menampilkan pesan error generik demi keamanan: *"Email/Nomor Telepon atau Kata Sandi salah"*.
    3. Jika kegagalan terjadi 5 kali berturut-turut, sistem mengunci sementara akun selama 15 menit (*Brute-force protection*).
  * **4a. Akun Ditangguhkan (Suspended) oleh Admin**:
    1. Sistem mendeteksi status akun adalah `SUSPENDED` karena pelanggaran kebijakan atau laporan etik (merujuk ke UC-14).
    2. Sistem menolak akses masuk dan memunculkan jendela informasi: *"Akun Anda ditangguhkan karena melanggar Ketentuan Layanan. Anda memiliki hak untuk mengajukan banding dalam masa 14 hari sejak surat penangguhan dikirimkan"*.
    3. Sistem menyediakan tautan/tombol *"Ajukan Banding"* yang mengarahkan klien ke form pengajuan klarifikasi ke Admin Compliance.
  * **6a. Kode OTP Salah / Kedaluwarsa**:
    1. Klien memasukkan OTP yang salah atau waktu habis.
    2. Sistem menampilkan notifikasi kesalahan dan meminta klien mencoba kembali.

---

### UC-03: Memilih Mitra Profesional
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Klien mencari, menyaring, dan memilih mitra profesional (Mitra Profesional, Advokat, atau Psikolog) yang memiliki lisensi aktif dan bersedia melayani konsultasi.
* **Pre-condition**: Klien sudah login dan berada di dasbor utama layanan.
* **Post-condition**: Klien memilih satu profil mitra profesional dan mengunci slot konsultasi sementara (*temporary slot lock*).
* **Compliance Checklist & Regulasi Domain**:
  * **UU No. 17 Tahun 2023 (Kesehatan)**: Filter sistem **wajib** menyembunyikan atau menolak profil Mitra Profesional yang STR (Surat Tanda Registrasi) atau SIP (Surat Izin Praktik)-nya telah habis masa berlakunya dari katalog aktif.
  * **Kode Etik HIMPSI**: Filter **wajib** memastikan Psikolog Klinis memiliki SIPP yang valid dari HIMPSI.
  * **UU No. 18 Tahun 2003 (Advokat)**: Verifikasi status aktif KTA Peradi dan Berita Acara Sumpah Pengadilan Tinggi sebelum advokat dapat dipilih oleh klien.
  * **Geolocation Compliance**: Fitur filter radius jarak (< 10 km) untuk kedaruratan medis atau kebutuhan pertemuan fisik tatap muka di Faskes/Kantor Hukum terdekat.
* **Alur Utama (Basic Flow)**:
  1. Klien memilih domain layanan (Kesehatan Medis, Hukum, atau Psikologi).
  2. Klien memilih kategori spesialisasi (misal: Spesialis Anak, Hukum Pidana/Keluarga, atau Psikolog Klinis Dewasa).
  3. Sistem melakukan *query* ke database dengan filter wajib: status akun mitra = `ACTIVE`, status ketersediaan = `ONLINE`, dan tanggal kedaluwarsa lisensi (STR/SIPP/Peradi) > tanggal hari ini.
  4. Sistem menampilkan daftar mitra profesional yang memenuhi syarat, diurutkan berdasarkan rating tertinggi, pengalaman, atau jarak lokasi (*geolocation radius*).
  5. Klien menggunakan fitur filter tambahan (tarif per sesi, jenis kelamin, atau lokasi Faskes/Kantor).
  6. Klien mengklik kartu profil salah satu mitra untuk membaca bio, jadwal praktik, daftar tarif, dan riwayat ulasan publik.
  7. Klien mengklik tombol "Pilih & Lanjut Konsultasi".
  8. Sistem melakukan penguncian slot jadwal sementara (*lock slot* selama 15 menit) agar mitra tidak dipilih oleh klien lain bersamaan, lalu mengarahkan klien ke halaman pembayaran (UC-05).
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Lisensi Mitra Terdeteksi Kedaluwarsa oleh Sistem**:
    1. Saat *background query*, sistem menemukan bahwa STR/SIPP/KTA milik mitra yang sebelumnya aktif baru saja melewati tanggal kedaluwarsa hari ini.
    2. Sistem secara otomatis menonaktifkan profil mitra tersebut dari daftar hasil pencarian publik dan mengirimkan notifikasi peringatan perpanjangan lisensi ke dasbor mitra.
  * **4a. Mitra Profesional Tidak Ditemukan Sesuai Filter**:
    1. Tidak ada mitra online yang memenuhi kriteria spesialisasi atau radius jarak yang ditentukan klien.
    2. Sistem menampilkan pesan: *"Mitra profesional dengan kriteria tersebut sedang offline atau tidak tersedia di area Anda"*.
    3. Sistem menyarankan spesialisasi terkait yang sedang online atau menampilkan jadwal reservasi untuk sesi mendatang.
  * **8a. Slot Waktu Mitra Baru Saja Diambil Klien Lain**:
    1. Pada detik bersamaan, klien lain telah menyelesaikan pembayaran untuk mitra tersebut terlebih dahulu.
    2. Sistem membatalkan penguncian slot dan menampilkan pesan: *"Maaf, Mitra baru saja menerima konsultasi lain. Silakan pilih mitra online lainnya"*.

---

### UC-04: Melakukan Konsultasi
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Mitra Profesional (Mitra Profesional / Advokat / Psikolog)
* **Deskripsi Singkat**: Klien melakukan konsultasi interaktif via ruang obrolan (*chat room*) terenkripsi (*End-to-End Encryption*) secara real-time dengan mitra profesional setelah pembayaran diverifikasi.
* **Pre-condition**: Klien telah memilih mitra profesional (UC-03) dan tiket transaksi telah berstatus `PAID` (UC-05).
* **Post-condition**: Sesi konsultasi selesai, ruang obrolan dikunci permanen (*WORM read-only*), dan klien diwajibkan mengisi modal ulasan (UC-06).
* **Compliance Checklist & Regulasi Domain**:
  * **Permenkes 24/2022 (Rekam Medis Elektronik)**: Kewajiban enkripsi *End-to-End Encryption* (E2EE) pada pertukaran data medis, serta larangan pengunduhan atau tangkapan layar ilegal pada informasi sensitif pasien.
  * **UU No. 18 Tahun 2003 (Advocate-Client Privilege)**: Ruang obrolan domain Hukum wajib diberikan penandaan visual dan arsitektural *"PRIVILEGED AND CONFIDENTIAL"*. Isi komunikasi hukum **mutlak rahasia**, tidak dapat diakses, diintip, atau disita oleh Admin Sistem platform sekalipun (*Zero-Knowledge Architecture*).
  * **Kode Etik HIMPSI**: Pembatasan durasi waktu standar konseling (45-60 menit) dan kewajiban penyampaian *Informed Consent* batas kerahasiaan di awal obrolan.
* **Alur Utama (Basic Flow)**:
  1. Setelah pembayaran diverifikasi (UC-05), sistem membuat ruang obrolan (*chat room*) khusus bertanda tanda keamanan E2EE dan mengaktifkan timer sesi (default 45 menit). **[Actor Viewpoint Routing]:** Sistem menyajikan antarmuka dengan struktur DOM dari sudut pandang Klien (`?role=klien`, pesan Klien di kanan sebagai `.user`).
  2. Sistem mengirimkan notifikasi prioritas tinggi ke Dasbor Mitra Profesional (UC-10) bahwa sesi baru telah siap.
  3. Mitra Profesional menerima sesi dan memasuki ruang obrolan. Sistem merender presentasi DOM yang dibalik secara adaptif (`?role=mitra`, pesan Mitra di kanan sebagai `.user`, Klien di kiri sebagai `.partner`). Sistem otomatis mengirimkan pesan sambutan dan *Informed Consent* regulasi domain ke dalam chat.
  4. Klien dan Mitra Profesional melakukan interaksi konsultasi melalui teks, pesan suara, atau pengunggahan berkas dokumen bukti (merujuk ke Huk-UC01 / Psi-UC01).
  5. Lima menit sebelum waktu sesi habis, sistem menampilkan peringatan otomatis kepada kedua belah pihak di dalam ruang obrolan.
  6. Setelah masalah klien tuntas atau durasi berakhir, Mitra Profesional menyusun Catatan Sesi (UC-11) dan menekan tombol "Selesaikan Konsultasi".
  7. Sistem menutup dan mengunci ruang obrolan secara permanen menjadi status `COMPLETED` (*Read-Only WORM storage*, tidak bisa dihapus atau diubah).
  8. Sistem secara **wajib** memunculkan modal pop-up Rating & Review (UC-06) menutupi layar Dasbor Klien sebelum klien dapat menavigasi ke menu lain.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **2a. Mitra Profesional Tidak Merespon Permintaan (Timeout > 5 Menit)**:
    1. Mitra profesional tidak mengklik terima dalam window waktu 5 menit sejak tiket dibayar.
    2. Sistem membatalkan sesi konsultasi pada mitra tersebut secara otomatis.
    3. Sistem menginisiasi pengembalian dana (*Full Refund*) secara instan ke dompet klien atau menawarkan pengalihan tiket ke Mitra Spesialis selevel yang sedang online tanpa biaya tambahan.
    4. Sistem mencatat penalti penurunan skor respons pada akun mitra yang lalai.
  * **4a. Klien Mengalami Putus Koneksi / Keluar Sepihak**:
    1. Klien menutup aplikasi atau kehilangan sinyal di tengah sesi yang sedang berlangsung.
    2. Sistem mempertahankan ruang chat tetap terbuka selama window waktu konsultasi masih aktif.
    3. Jika klien kembali masuk dalam window waktu tersebut, sesi dilanjutkan tanpa kehilangan riwayat pesan.
    4. Jika klien tidak kembali hingga waktu habis, mitra mengakhiri sesi, status menjadi `COMPLETED`, dan dana tetap dibayarkan ke mitra (*No Refund*).
  * **4b. Deteksi Kata Kunci Krisis Darurat (Domain Psikologi)**:
    1. Sistem mendeteksi kata kunci sensitif terkait bunuh diri (*suicide*) atau melukai diri (*self-harm*) pada pesan teks klien.
    2. Sistem memicu **Crisis Alert Protocol**: memunculkan banner darurat di layar psikolog dan otomatis menampilkan nomor hotline intervensi krisis nasional (119 ext 8) di layar klien.

---

### UC-05: Melakukan Pembayaran
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Payment Gateway (Midtrans / Xendit / Bank API)
* **Deskripsi Singkat**: Klien melakukan pembayaran biaya konsultasi atau layanan hukum menggunakan metode pembayaran digital pilihan (*Include* dari UC-04).
* **Pre-condition**: Klien telah memilih mitra profesional (UC-03) dan sistem telah menghitung total biaya (termasuk pajak dan e-Meterai jika berlaku).
* **Post-condition**: Pembayaran terverifikasi sukses oleh sistem, status transaksi menjadi `PAID`, dan tiket konsultasi aktif diterbitkan.
* **Compliance Checklist & Regulasi Domain**:
  * **PCI-DSS Compliance**: Standar keamanan industri kartu pembayaran; platform dilarang menyimpan nomor kartu kredit secara telanjang (*raw*) di database lokal.
  * **Peraturan Bank Indonesia (PBI)**: Kepatuhan pemrosesan transaksi uang elektronik dan QRIS.
  * **Escrow System (Rekening Bersama Platform)**: Khusus untuk layanan Hukum Pro Bono atau proyek *Legal Drafting* bernominal besar, dana yang dibayarkan klien di-escrow (ditahan sementara oleh sistem) dan baru dilepaskan (*disburse*) ke dompet advokat setelah pekerjaan/laporan selesai diverifikasi demi mencegah penipuan.
* **Alur Utama (Basic Flow)**:
  1. Klien diarahkan ke halaman *Checkout* yang menampilkan rincian biaya konsultasi, biaya layanan platform, dan PPN.
  2. Klien memilih metode pembayaran (QRIS, Virtual Account Bank, E-Wallet, atau Kartu Kredit).
  3. Sistem membuat *order ID* unik dan mengirimkan permintaan pembentukan *Snap Token* / *Payment URL* ke server Payment Gateway melalui koneksi API terenkripsi.
  4. Payment Gateway merespons dengan token pembayaran dan instruksi transfer.
  5. Sistem me-render antarmuka pembayaran atau menampilkan kode QRIS/Nomor Virtual Account kepada klien dengan timer hitung mundur 15 menit.
  6. Klien melakukan pembayaran melalui aplikasi m-banking atau e-wallet miliknya.
  7. Server Payment Gateway memvalidasi masuknya dana dan mengirimkan *asynchronous webhook callback* (HTTP POST) ber-tanda tangan kriptografis ke server sistem JUSTIFICA.
  8. Sistem memvalidasi tanda tangan *webhook callback*, memperbarui status transaksi di database dari `PENDING` menjadi `PAID`, dan mencatat log finansial WORM.
  9. Sistem menerbitkan tiket konsultasi dan memicu pembukaan ruang obrolan (UC-04).
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **7a. Pembayaran Gagal / Saldo Tidak Mencukupi**:
    1. Payment Gateway mengirimkan *callback* dengan status `FAILED` atau `DENIED`.
    2. Sistem memperbarui status transaksi menjadi `FAILED` di database.
    3. Sistem menampilkan pesan error: *"Pembayaran Anda gagal atau ditolak oleh bank/penyedia e-wallet. Harap gunakan metode pembayaran lain"*.
    4. Klien diberikan opsi untuk mengganti metode pembayaran tanpa kehilangan slot booking selama timer 15 menit belum habis.
  * **7b. Batas Waktu Pembayaran Habis (Timeout > 15 Menit)**:
    1. Klien tidak melakukan transfer hingga hitung mundur 15 menit berakhir.
    2. Payment Gateway mengakhiri sesi pembayaran dan mengirim *callback* `EXPIRED`.
    3. Sistem mengubah status transaksi menjadi `EXPIRED`, membatalkan penguncian slot jadwal mitra di database, dan memberitahukan klien bahwa sesi pembayaran telah kadaluarsa.
  * **7c. Webhook Callback Tertunda (Network Delay / Gangguan PG)**:
    1. Klien telah membayar, namun server sistem belum menerima *callback* otomatis dari Payment Gateway.
    2. Klien menekan tombol *"Saya Sudah Membayar / Cek Status"*.
    3. Sistem melakukan *synchronous polling API* langsung ke server Payment Gateway berdasarkan *Order ID*.
    4. Jika API menjawab sudah terbayar, sistem memperbarui status menjadi `PAID` dan melanjutkan alur konsultasi.

---

### UC-06: Memberikan Ulasan dan Rating
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Klien memberikan penilaian berupa skor bintang (1-5) dan ulasan tertulis atas kualitas pelayanan mitra profesional setelah sesi selesai.
* **Pre-condition**: Sesi konsultasi telah ditutup secara resmi dengan status `COMPLETED` (UC-04).
* **Post-condition**: Ulasan dan rating tersimpan di database, memodifikasi nilai rata-rata mitra profesional, serta memicu protokol investigasi jika terjadi rating rendah pada domain medis.
* **Compliance Checklist & Regulasi Domain**:
  * **UU No. 17 Tahun 2023 & Permenkes 17/2023 (Kesehatan)**: **Mandatory Adverse Event Reporting**. Jika klien memberikan rating bintang <= 2 pada domain Kesehatan Medis, sistem **wajib** memunculkan formulir investigasi kelalaian medis (*adverse event report*) untuk ditindaklanjuti oleh Tim Etik Medis.
  * **UU No. 18 Tahun 2003 (Advocate-Client Privilege)**: Pada domain Hukum, sistem **wajib** melakukan anonimisasi nama klien secara otomatis (misal: *Klien Huk-8891*) saat ulasan ditampilkan di profil publik advokat, guna melindungi kerahasiaan identitas klien hukum.
* **Alur Utama (Basic Flow)**:
  1. Begitu sesi chat berubah status menjadi `COMPLETED`, sistem memunculkan modal pop-up Rating & Review secara *blocking* di layar dasbor klien.
  2. Klien memilih skor rating bintang (1 hingga 5 bintang).
  3. Klien menuliskan komentar atau umpan balik terkait kejelasan penjelasan, empati, dan profesionalisme mitra.
  4. Klien mengklik tombol "Kirim Penilaian".
  5. Sistem menyimpan ulasan ke database.
  6. *[Domain Hukum]* Sistem menerapkan fungsi anonimisasi pada atribut nama klien sebelum ulasan dipublikasikan ke katalog umum.
  7. Sistem menjalankan *stored procedure* / *service* untuk mengalkulasi ulang rata-rata rating mitra profesional secara real-time.
  8. Modal pop-up tertutup, dan klien dapat kembali menggunakan seluruh fitur dasbor normal.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **2a. Klien Memberikan Rating Rendah (Bintang <= 2) pada Domain Kesehatan**:
    1. Klien memilih skor 1 atau 2 bintang pada sesi konsultasi Mitra Profesional.
    2. Sistem mendeteksi parameter rating rendah pada domain medis dan secara otomatis memperluas modal pop-up dengan **Formulir Pelaporan Adverse Event / Ketidakpuasan Klinis**.
    3. Klien diminta memilih kategori masalah (misal: *Diagnosis keliru*, *Mitra Profesional tidak sopan*, *Resep obat menimbulkan alergi berat*, atau *Sesi diakhiri prematur*).
    4. Setelah dikirim, ulasan tersebut tidak langsung dipublikasikan, melainkan ditandai `UNDER_INVESTIGATION` dan dikirimkan sebagai tiket prioritas ke panel **Tim Etik Multidisiplin Admin** (merujuk ke UC-15) untuk dievaluasi.
  * **2b. Klien Melewati Ulasan (Tombol Skip / Nanti Saja)**:
    1. Klien memilih tombol "Lewati / Nanti Saja" pada modal pop-up.
    2. Sistem menutup modal pop-up tanpa menyimpan nilai rating.
    3. Sistem akan memunculkan kembali pengingat ulasan yang belum diisi saat klien login di hari berikutnya (maksimal 3 kali pengingat sebelum dianggap *expired* / *no review*).

---

## B. Aktor: Mitra Profesional (Professional Partner)

### UC-07: Melakukan Registrasi Mitra Profesional
* **Aktor Utama**: Mitra Profesional (Mitra Profesional / Advokat / Psikolog)
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Calon mitra profesional mendaftarkan akun baru dan mengunggah dokumen kredensial spesifik domain (STR/SIP/KTA/SIPP) agar dapat diverifikasi oleh Admin Sistem.
* **Pre-condition**: Mitra profesional belum terdaftar di platform JUSTIFICA.
* **Post-condition**: Akun mitra profesional dibuat dengan status `PENDING_VERIFICATION`, dan dokumen terenkripsi tersimpan di storage WORM menunggu tinjauan Admin.
* **Compliance Checklist & Regulasi Domain**:
  * **UU No. 17 Tahun 2023 (Kesehatan)**: Kewajiban pengunggahan STR (Surat Tanda Registrasi) yang diterbitkan oleh Konsil Kemitra profesionalan Indonesia (KKI) / Konsil Tenaga Kesehatan Indonesia (KTKI), Surat Izin Praktik (SIP) aktif di Faskes, dan bukti kerja sama BPJS Provider (jika melayani rujukan BPJS).
  * **Kode Etik HIMPSI (Psikologi)**: Kewajiban pengunggahan Surat Izin Praktik Psikologi (SIPP) aktif yang dikeluarkan oleh HIMPSI serta bukti keanggotaan wilayah.
  * **UU No. 18 Tahun 2003 (Advokat)**: Kewajiban pengunggahan Kartu Tanda Anggota (KTA) Peradi aktif dan SK Pengacara / Berita Acara Sumpah dari Pengadilan Tinggi negeri.
  * **WORM Storage Security**: Seluruh dokumen kredensial disimpan pada *Write-Once-Read-Many (WORM) Storage* berenkripsi AES-256 untuk mencegah manipulasi pasca-unggah.
* **Alur Utama (Basic Flow)**:
  1. Calon Mitra Profesional membuka halaman "Registrasi Mitra Profesional" di portal JUSTIFICA.
  2. Calon mitra memilih domain profesinya (Kesehatan Medis, Hukum, atau Psikologi).
  3. Sistem me-render formulir registrasi spesifik sesuai domain yang dipilih.
  4. Mitra mengisi data identitas pribadi (Nama Lengkap, NIK, NPWP, Email, Nomor Telepon, Alamat Praktik/Kantor, dan Kata Sandi).
  5. Mitra mengunggah berkas kredensial berformat PDF atau JPG beresolusi tinggi (STR+SIP untuk Mitra Profesional; SIPP+KTA HIMPSI untuk Psikolog; KTA Peradi+Berita Acara Sumpah untuk Advokat).
  6. Mitra menyetujui Pakta Integritas Layanan Tele-Konsultasi dan Aturan Kode Etik Multidisiplin.
  7. Mitra mengklik tombol "Kirim Pendaftaran".
  8. Sistem memvalidasi kelengkapan berkas, mengunggah file ke storage WORM berenkripsi, dan menyimpan record di database dengan status `PENDING_VERIFICATION`.
  9. Sistem menampilkan halaman konfirmasi dan mengirimkan email pemberitahuan bahwa berkas sedang dalam antrean verifikasi Admin (estimasi 1-2 hari kerja).
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **5a. Berkas Kredensial Wajib Kosong atau Rusak (*Corrupt*)**:
    1. Sistem mendeteksi ada berkas wajib yang belum diunggah atau file tidak dapat dibaca oleh *parser*.
    2. Sistem menolak pengiriman formulir dan menandai kotak input yang bermasalah dengan warna merah beserta pesan: *"Berkas kredensial wajib diunggah dalam format PDF/JPG yang terbaca"*.
  * **5b. Nomor STR / SIPP / Peradi Terdeteksi Duplikat di Database**:
    1. Sistem mendeteksi bahwa nomor lisensi profesi yang diinput sudah pernah didaftarkan oleh akun lain.
    2. Sistem membatalkan registrasi dan menampilkan pesan error: *"Nomor lisensi profesi ini sudah terdaftar di sistem JUSTIFICA. Jika terjadi penyalahgunaan identitas, silakan hubungi tim legal kami"*.
  * **8a. Kegagalan Upload ke Storage WORM (Network Timeout)**:
    1. Koneksi terputus saat proses pengiriman berkas berukuran besar.
    2. Sistem melakukan *auto-retry* 3 kali. Jika tetap gagal, sistem menyimpan data teks sebagai *draft* dan meminta mitra melanjutkan pengunggahan berkas saat koneksi stabil.

---

### UC-08: Melakukan Login Mitra Profesional
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Mitra Profesional masuk ke dasbor profesional menggunakan kredensial akun dan wajib melewati autentikasi dua faktor (*Multi-Factor Authentication / MFA*).
* **Pre-condition**: Akun mitra profesional telah diverifikasi dan disetujui oleh Admin (status `ACTIVE`).
* **Post-condition**: Mitra profesional berhasil masuk ke Dasbor Mitra, sesi terenkripsi aktif, dan audit trail tercatat di database.
* **Compliance Checklist & Regulasi Domain**:
  * **Permenkes 24/2022 & UU PDP No. 27/2022**: **Mandatory Multi-Factor Authentication (MFA)**. Demi melindungi kerahasiaan Rekam Medis Elektronik (EME) pasien, rekam kasus hukum rahasia, dan catatan klinis psikologi, mitra profesional **wajib** menggunakan MFA (TOTP Google Authenticator / SMS OTP) setiap kali melakukan login.
  * **Audit Trail Compliance**: Setiap aktivitas login dan logout mitra dicatat ke dalam log WORM abadi (Timestamp, IP Address, User-Agent, Status Login) sebagai bukti audit forensik jika terjadi kebocoran data.
* **Alur Utama (Basic Flow)**:
  1. Mitra Profesional memasukkan Email/Nomor Lisensi dan Kata Sandi pada halaman Login Mitra.
  2. Mitra Profesional mengklik tombol "Masuk".
  3. Sistem mencocokkan kredensial dengan database dan memeriksa status verifikasi akun.
  4. Setelah kredensial valid, sistem memunculkan layar tantangan MFA (*MFA Challenge*).
  5. Sistem mengirimkan kode OTP via SMS/WhatsApp atau meminta kode TOTP 6 angka dari aplikasi *Authenticator* mitra.
  6. Mitra memasukkan kode MFA/OTP ke dalam sistem.
  7. Sistem memvalidasi kode MFA, membuat token sesi JWT berenkripsi dengan hak akses peran profesional (`ROLE_MITRA`), dan mencatat log sukses di tabel audit WORM.
  8. Sistem mengarahkan mitra ke Dasbor Utama Profesional.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Akun Masih Berstatus `PENDING_VERIFICATION`**:
    1. Sistem mendeteksi bahwa berkas pendaftaran mitra belum selesai ditinjau oleh Admin Sistem.
    2. Sistem menolak pembukaan dasbor dan menampilkan pesan: *"Akun Anda masih dalam proses verifikasi oleh Admin Sistem. Harap menunggu konfirmasi email"*.
  * **3b. Akun Ditolak (`REJECTED`) oleh Admin**:
    1. Sistem mendeteksi status verifikasi adalah `REJECTED` karena dokumen tidak valid/buram (merujuk ke UC-13).
    2. Sistem menampilkan notifikasi penolakan beserta detail alasan teknis dari admin, serta menyediakan tombol *"Unggah Ulang Berkas"*.
  * **3c. Akun Ditangguhkan (`SUSPENDED`) karena Sidang Etik**:
    1. Sistem mendeteksi status akun adalah `SUSPENDED` akibat putusan Tim Etik Multidisiplin (merujuk ke UC-15).
    2. Sistem memblokir akses login secara mutlak dan menampilkan surat pemberitahuan resmi penonaktifan.
  * **6a. Kode MFA/OTP Salah atau Kedaluwarsa**:
    1. Mitra memasukkan kode MFA yang keliru atau melebihi batas waktu.
    2. Sistem menolak akses. Jika kegagalan MFA terjadi 3 kali berturut-turut, sesi login dibatalkan dan akun dikunci sementara selama 30 menit untuk mencegah peretasan akun medis/hukum.

---

### UC-09: Mengonfirmasi Status Ketersediaan (on/off)
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Sistem Integrasi Eksternal (API RS / API Pengadilan)
* **Deskripsi Singkat**: Mitra Profesional mengubah status ketersediaan mereka menjadi *Online* (siap menerima konsultasi) atau *Offline*, dengan validasi sinkronisasi jadwal praktik offline/sidang eksternal.
* **Pre-condition**: Mitra profesional sudah login dan berada di Dasbor Mitra.
* **Post-condition**: Status ketersediaan mitra di database diperbarui secara real-time, mempengaruhi visibilitas di katalog pencarian klien (UC-03).
* **Compliance Checklist & Regulasi Domain**:
  * **Domain Kesehatan (API RS/Faskes Sync)**: Sistem terintegrasi dengan Sistem Informasi Rumah Sakit (SIRS) Faskes tempat mitra profesional praktik. Mitra Profesional tidak dapat mengaktifkan status *Online* tele-konsultasi jika kalender SIRS menunjukkan mitra profesional sedang melakukan tindakan operasi atau praktik offline jam tersebut.
  * **Domain Hukum (API Pengadilan Sync)**: Sistem memeriksa jadwal sidang di SIPP Pengadilan (Sistem Informasi Penelusuran Perkara). Advokat dilarang *Online* jika sedang terdaftar dalam sidang aktif pada jam yang sama demi mencegah terbengkalainya klien tele-konsultasi.
  * **Kode Etik HIMPSI (Psikologi Buffer Rule)**: Sistem **wajib** memberlakukan jeda waktu (*mandatory buffer*) 30 menit setelah sesi konseling klinis intensif sebelum psikolog dapat menerima sesi konsultasi baru, guna mencegah kelelahan mental (*compassion fatigue / burnout*).
* **Alur Utama (Basic Flow)**:
  1. Mitra Profesional membuka panel kontrol ketersediaan di Dasbor Mitra.
  2. Mitra menggeser tombol *toggle* dari *Offline* menjadi *Online*.
  3. Sistem melakukan validasi kepatuhan domain di latar belakang:
     * *[Medis]* Mengecek jadwal praktik offline di API SIRS RS Mitra.
     * *[Hukum]* Mengecek kalender sidang di API Pengadilan.
     * *[Psikologi]* Mengecek apakah waktu sekarang sudah melepasi *buffer* 30 menit dari sesi konseling terakhir.
  4. Jika tidak ada jadwal eksternal yang bentrok dan aturan *buffer* terpenuhi, sistem mengubah atribut status ketersediaan mitra di database menjadi `ONLINE`.
  5. Sistem memancarkan *event real-time* (WebSockets) ke seluruh aplikasi klien bahwa mitra kini tersedia di katalog pencarian (UC-03).
  6. Dasbor mitra berubah warna menjadi hijau dengan indikator *"Anda Sedang Online - Siap Menerima Klien"*.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Terdeteksi Bentrok Jadwal Praktik RS / Sidang Pengadilan**:
    1. API eksternal mengembalikan bahwa mitra memiliki jadwal praktik fisik atau sidang pengadilan dalam waktu dekat (misal: 15 menit lagi).
    2. Sistem menolak aktivasi toggle *Online* dan membalas toggle ke posisi *Offline*.
    3. Sistem menampilkan pesan pop-up peringatan: *"Status Online tidak dapat diaktifkan. Anda memiliki jadwal praktik RS / sidang pengadilan terdaftar pukul [HH:MM]"*.
  * **3b. Masa Jeda (*Buffer*) Psikologi Belum Terpenuhi**:
    1. Seorang Psikolog mencoba *Online* kembali 10 menit setelah menyelesaikan sesi konseling berat (skor DASS-21 Severe).
    2. Sistem menolak aktivasi toggle dan menampilkan hitung mundur waktu jeda wajib: *"Demi kesehatan mental dan kualitas layanan, Anda wajib beristirahat 20 menit lagi sebelum dapat menerima sesi baru sesuai standar HIMPSI"*.
  * **3c. Gangguan Koneksi API Eksternal (RS/Pengadilan Offline)**:
    1. Server API RS atau Pengadilan tidak merespons dalam 3 detik.
    2. Sistem mengizinkan aktivasi *Online* dengan mode *Fallback Warning*: *"Koneksi ke kalender RS/Pengadilan terputus. Pastikan Anda tidak memiliki jadwal fisik yang bentrok sebelum menerima sesi online"*.

---

### UC-10: Melayani Konsultasi
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Klien
* **Deskripsi Singkat**: Mitra Profesional menerima permintaan obrolan masuk dari klien dan melangsungkan pelayanan konsultasi medis, hukum, atau psikologi via *chat room* terenkripsi (*Include* dari UC-04).
* **Pre-condition**: Mitra profesional berstatus `ONLINE` (UC-09) dan menerima notifikasi tiket konsultasi baru dari klien.
* **Post-condition**: Sesi konsultasi selesai dilayani, catatan sesi (UC-11) dan dokumen output (UC-12) tersimpan di database.
* **Compliance Checklist & Regulasi Domain**:
  * **Permenkes 24/2022 (SLA Respons Klinis)**: Mitra medis **wajib** merespons pesan pembuka klien maksimal dalam waktu 5 menit setelah menerima tiket demi keselamatan pasien.
  * **UU No. 18 Tahun 2003 (Advocate-Client Privilege)**: Advokat wajib menjaga seluruh rahasia klien yang diungkapkan dalam ruang chat dan dilarang menyebarkan dokumen kasus ke pihak luar.
  * **Kode Etik HIMPSI**: Psikolog wajib menjaga sikap profesional, empati, dan tidak melakukan *judgment* selama sesi konseling real-time.
* **Alur Utama (Basic Flow)**:
  1. Sistem memunculkan dering alarm dan kartu pop-up permintaan konsultasi masuk pada Dasbor Mitra Profesional (menampilkan nama/anonim klien, domain, dan keluhan awal).
  2. Mitra Profesional mengklik tombol "Terima Permintaan" dalam jendela waktu respons (maksimal 5 menit).
  3. Sistem menghubungkan mitra ke ruang obrolan (*chat room*) E2EE yang telah terbuka bersama klien (UC-04). **[Actor Viewpoint Routing]:** Sistem mengaktifkan parameter `?role=mitra` dan membalikkan presentasi DOM secara otomatis (identitas Klien di topbar, pesan Mitra Profesional di kanan sebagai `.user`).
  4. Mitra menyapa klien, meninjau riwayat hukum/psikologi yang diizinkan (merujuk ke Huk-UC01 / Psi-UC01), dan memberikan konsultasi interaktif.
  5. Selama sesi atau menjelang sesi berakhir, Mitra membuka panel "Catatan Sesi" (UC-11) untuk menyusun diagnosis, opini hukum, atau asesmen psikologi.
  6. Jika klien membutuhkan terapi obat medis, draf kontrak hukum, atau tugas mandiri psikologi, Mitra menerbitkan berkas terkait dari menu "Output Dokumen" (*Extend* ke UC-12).
  7. Setelah konsultasi tuntas dan disepakati klien, Mitra mengklik tombol "Selesaikan Konsultasi".
  8. Sistem menutup sesi, mengunci ruang obrolan menjadi `COMPLETED`, dan memperbarui statistik pelayanan mitra di database.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **2a. Mitra Profesional Mengabaikan / Menolak Permintaan (Timeout > 5 Menit)**:
    1. Mitra profesional tidak mengklik "Terima" atau sengaja menekan tombol "Tolak / Sibuk".
    2. Sistem segera mengalihkan tiket klien ke antrean pencarian mitra online lain atau memicu alur pengembalian dana (*refund*) otomatis (merujuk ke UC-04 alur 2a).
    3. Jika mitra menolak/abaikan permintaan 3 kali berturut-turut dalam sehari, sistem secara otomatis mengubah status ketersediaan mitra menjadi `OFFLINE` untuk mencegah antrean klien yang menggantung.
  * **4a. Koneksi Internet Mitra Terputus di Tengah Sesi**:
    1. Mitra mengalami gangguan jaringan sehingga keluar dari *chat room* secara tidak sengaja.
    2. Sistem menampilkan banner pemberitahuan di layar klien: *"Mitra sedang mengalami gangguan koneksi dan akan segera kembali"*.
    3. Sistem memberikan *reconnect window* selama 5 menit bagi mitra. Jika mitra berhasil terhubung kembali, sesi dilanjutkan normal. Jika melebihi 5 menit, sesi diakhiri dengan status `INTERRUPTED` dan sistem menjadwalkan sesi pengganti gratis untuk klien.

---

### UC-11: Membuat Catatan Sesi Konsultasi
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Supervisor Klinis (Khusus Domain Psikologi jika terdeteksi krisis)
* **Deskripsi Singkat**: Mitra Profesional mendokumentasikan hasil pemeriksaan, diagnosis, opini hukum, atau evaluasi psikologis ke dalam rekam medis/hukum/klinis elektronik setelah sesi konsultasi.
* **Pre-condition**: Mitra profesional sedang berada dalam sesi konsultasi aktif atau baru saja mengklik "Selesaikan Konsultasi" (UC-10).
* **Post-condition**: Catatan sesi terenkripsi secara *field-level* dan tersimpan permanen di storage WORM dengan masa retensi sesuai undang-undang.
* **Compliance Checklist & Regulasi Domain**:
  * **Permenkes 24/2022 & Standar SOAP Note (Medis)**: Mitra Profesional **wajib** mengisi format rekam medis SOAP (*Subjective, Objective, Assessment, Plan*) dan mencantumkan kode klasifikasi penyakit internasional **ICD-10** pada kolom diagnosis.
  * **Kode Etik HIMPSI & Standar DAP Note (Psikologi)**: Psikolog mengisi format DAP (*Data, Assessment, Plan*). Jika dalam asesmen ditemukan indikasi risiko tinggi melukai diri atau bunuh diri (*suicidal/self-harm*), sistem **wajib** memicu **Crisis Flag Protocol**.
  * **UU No. 18 Tahun 2003 & Standar IRAC (Hukum)**: Advokat mengisi format *Case Memo* atau metode IRAC (*Issue, Rule, Application, Conclusion*). Catatan hukum **wajib** dibubuhi stempel sistem *"PRIVILEGED AND CONFIDENTIAL"* dan diberlakukan masa retensi minimum 10 tahun (*Legal Hold*).
* **Alur Utama (Basic Flow)**:
  1. Mitra Profesional mengklik tab "Catatan Sesi" di panel kanan layar obrolan.
  2. Sistem me-render template catatan yang disesuaikan secara otomatis dengan domain mitra:
     * *[Medis]* Formulir SOAP Note + kolom pencarian kode ICD-10.
     * *[Psikologi]* Formulir DAP Note + indikator level risiko klinis (Low/Medium/High/Critical).
     * *[Hukum]* Formulir Case Memo / IRAC + opsi penandaan kerahasiaan (*Privilege Marking*).
  3. Mitra mengisi kolom analisis klinis atau opini hukum berdasarkan fakta yang dikumpulkan selama chat.
  4. *[Medis]* Mitra Profesional mengetikkan nama penyakit pada kolom diagnosis, sistem menampilkan *auto-complete* kode ICD-10, dan mitra profesional memilih kode yang tepat.
  5. *[Psikologi]* Psikolog memilih level risiko klinis. Jika memilih *Low* atau *Medium*, alur berjalan normal.
  6. Mitra mengklik tombol "Simpan & Kunci Catatan".
  7. Sistem melakukan enkripsi *field-level* menggunakan kunci kriptografis spesifik domain, menyimpan catatan ke database WORM, dan menempelkan *timestamp* tidak terubah.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Kolom Wajib (Diagnosis ICD-10 / Assessment) Dikosongkan**:
    1. Mitra Profesional mencoba menyimpan SOAP Note tanpa memilih kode ICD-10 yang valid.
    2. Sistem menolak penyimpanan catatan dan menampilkan peringatan: *"Sesuai standar Permenkes 24/2022, kode diagnosis ICD-10 wajib diisi sebelum mengakhiri rekam medis"*.
  * **5a. Psikolog Menandai Level Risiko *High* / *Critical* (Crisis Protocol TriggerED)**:
    1. Dalam formulir DAP Note, Psikolog menandai indikator bahwa klien memiliki ide bunuh diri aktif (*active suicidal ideation*).
    2. Sistem secara otomatis memicu **Crisis Flag Protocol**:
       * Mengirimkan *alert* darurat secara real-time ke layar **Supervisor Klinis Psikologi** di platform.
       * Membuka form *Risk Assessment* mendalam bagi psikolog untuk diisi.
       * Mengirimkan notifikasi SMS/WA otomatis ke kontak darurat (*Emergency Contact*) klien yang terdaftar saat registrasi, menyarankan pemeriksaan ke IGD rumah sakit jiwa terdekat.
  * **7a. Kegagalan Enkripsi Database (Encryption Key Error)**:
    1. Terjadi kesalahan pada *KMS (Key Management Service)* saat proses enkripsi *field-level*.
    2. Sistem menolak penyimpanan data mentah (*plaintext*) ke database demi keamanan, menyimpan catatan di memori sementara tersandi (*volatile RAM*), dan mencoba ulang proses enkripsi 3 detik kemudian.

---

### UC-12: Mengeluarkan Output Dokumen Konsultasi
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Sistem Integrasi Eksternal (API e-Meterai Peruri / SIA Apotek)
* **Deskripsi Singkat**: Mitra Profesional meracik dan menerbitkan dokumen tindak lanjut resmi untuk klien, berupa e-Resep Medis, Lembar Tugas Psikologi (*Homework Sheet*), atau Legal Opinion Hukum (*Extend* dari UC-11).
* **Pre-condition**: Mitra profesional sedang mengisi atau telah menyimpan catatan sesi (UC-11) dan kasus membutuhkan dokumen resmi terverifikasi.
* **Post-condition**: Dokumen output resmi ber-tanda tangan digital terbit, tersimpan di storage WORM, dan dikirimkan ke klien atau apotek mitra.
* **Compliance Checklist & Regulasi Domain**:
  * **Permenkes 73/2016 (Standar e-Resep Medis)**: e-Resep **wajib** melalui pengecekan interaksi obat (*Drug-Drug Interaction / DDI Check*) secara otomatis oleh sistem. Jika resep mengandung obat golongan Narkotika atau Psikotropika (*Controlled Drugs*), sistem **wajib** memeriksa SIP Narkotika mitra profesional dan mencetak resep dalam format 3 rangkap digital (Apotek, Pasien, Arsip BPOM/BNN).
  * **Kode Etik HIMPSI (Lembar Tugas Psikologi)**: Pemberian tugas mandiri (*homework* seperti journaling atau mindfulness) harus dapat dihubungkan dengan grafik pemantauan *Mood Tracker* klien (Psi-UC01).
  * **UU No. 10 Tahun 2020 & UU 18/2003 (Legal Opinion & e-Meterai)**: Dokumen pendapat hukum tertulis (*Legal Opinion*) metode IRAC bernilai pembuktian tinggi **wajib** dibubuhi e-Meterai resmi Rp 10.000 via API Peruri serta cap *"PRIVILEGED AND CONFIDENTIAL"*.
* **Alur Utama (Basic Flow)**:
  1. Pada formulir catatan sesi (UC-11), Mitra mengklik tombol "Terbitkan Dokumen Output".
  2. Sistem menampilkan formulir khusus sesuai domain:
     * *[Medis]* Formulir e-Resep (Pencarian nama obat, dosis, frekuensi, aturan pakai, dan jumlah).
     * *[Psikologi]* Formulir Lembar Tugas / *Homework Sheet* (Instruksi latihan relaksasi, journaling, atau cognitive reframing).
     * *[Hukum]* Formulir Legal Opinion / Draf Kontrak Hukum metode IRAC.
  3. Mitra mengisi rincian dokumen yang dibutuhkan.
  4. *[Medis]* Mitra Profesional menambahkan daftar obat ke dalam resep. Sistem secara otomatis menjalankan modul **Drug-Drug Interaction (DDI) Checker** di latar belakang untuk menganalisis potensi bentrok antar obat. Jika aman (tidak ada interaksi *Major*), alur berlanjut.
  5. *[Hukum]* Advokat mengklik tombol "Finalisasi & Bubuhkan e-Meterai". Sistem memanggil API Peruri untuk menempelkan e-Meterai Rp 10.000 pada dokumen PDF Legal Opinion.
  6. Mitra melakukan penandatanganan digital menggunakan sertifikat elektronik / PIN rahasia mitra.
  7. Sistem men-generate dokumen PDF ber-hash SHA-256, menyimpannya di storage WORM, dan melampirkannya ke ruang obrolan klien serta riwayat catatan sesi.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Terdeteksi Interaksi Obat Berbahaya (*Major DDI Detected*)**:
    1. Modul DDI Checker mendeteksi bahwa kombinasi obat yang dimasukkan mitra profesional memiliki interaksi fatal atau kontraindikasi berat.
    2. Sistem memunculkan alarm merah pop-up di layar mitra profesional: *"PERINGATAN BAHAYA: Kombinasi [Obat A] dan [Obat B] berpotensi menyebabkan [Efek Samping Fatal]. Apakah Anda ingin merevisi resep?"*.
    3. Mitra Profesional **wajib** merevisi resep dengan mengganti obat/dosis, ATAU melakukan *Override* dengan wajib mengetikkan alasan medis spesifik dalam kolom pertanggungjawaban klinis yang akan dicatat permanen dalam audit trail WORM.
  * **4b. Peresepan Obat Narkotika / Psikotropika (*Controlled Drugs*)**:
    1. Mitra Profesional memasukkan obat golongan Narkotika (misal: Fentanyl / Morfin) atau Psikotropika keras ke dalam e-Resep.
    2. Sistem memverifikasi apakah mitra profesional memiliki izin/SIP khusus peresepan obat terlarang yang masih berlaku.
    3. Jika valid, sistem mengubah alur resep menjadi **Controlled Drug Workflow**: generate e-Resep 3 rangkap digital tersandi khusus, menandai resep agar apotek wajib meminta verifikasi KTP/NIK fisik penerima obat, dan mencatat log transaksi ke database pelaporan BNN/BPOM.
  * **5a. Gangguan Integrasi API e-Meterai Peruri (Timeout/Error)**:
    1. Server Peruri gagal membubuhkan e-Meterai pada dokumen Legal Opinion advokat.
    2. Sistem menyimpan dokumen dalam status `PENDING_STAMPING` dan menampilkan pesan: *"Pembubuhan e-Meterai tertunda karena pemeliharaan server Peruri. Dokumen telah diamankan dan akan dicap otomatis dalam 1x24 jam"*.
    3. Advokat dapat memilih untuk mengirimkan draf *Unstamped Preview* terlebih dahulu kepada klien dengan *watermark* sementara.

---

### UC-17: Mengelola Saldo dan Penarikan Dana Mitra
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Admin Finansial, Payment Gateway / Bank API
* **Deskripsi Singkat**: Mitra Profesional memantau bagi hasil pendapatan jasa konsultasi, menghitung estimasi pajak PPh 21, dan mencairkan dana dari dompet platform ke rekening bank pribadi terdaftar.
* **Pre-condition**: Mitra profesional sudah login, memiliki saldo pendapatan yang dapat dicairkan (*available balance* > Rp 50.000), serta rekening bank profesi dan NPWP telah diverifikasi.
* **Post-condition**: Permintaan penarikan dana diproses, saldo berpindah ke status `DIBEKUKAN` (*frozen balance*), dan dana ditransfer ke rekening bank mitra melalui *auto-disbursement* atau persetujuan manual Admin Finansial.
* **Compliance Checklist & Regulasi Domain**:
  * **Peraturan Dirjen Pajak (PPh 21 Compliance)**: Sistem secara otomatis mengalkulasi dan memotong Pajak Penghasilan (PPh 21) atas jasa tenaga ahli (Advokat/Psikolog) berdasarkan persentase aturan perpajakan yang berlaku sebelum saldo bersih masuk ke dompet mitra.
  * **Standar Verifikasi Rekening Bank Faskes/BPJS Provider**: Khusus bagi mitra kesehatan yang terikat kontrak faskes, penarikan dana hanya diizinkan ke rekening bank resmi Faskes atau rekening pribadi yang nama pemiliknya 100% cocok dengan nama pada KTP/STR terdaftar (anti pencucian uang / AML).
  * **Threshold Control (Gerbang Batas Nominal)**: Penarikan dana di bawah Rp 5.000.000 diproses secara *Auto-Disburse* via API Bank Gateway. Penarikan bernominal >= Rp 5.000.000 **wajib** melalui verifikasi dan persetujuan manual (*Manual Approval*) oleh Admin Finansial demi pencegahan *fraud*.
* **Alur Utama (Basic Flow)**:
  1. Mitra Profesional memilih menu "Saldo & Pencairan Dana" di navigasi Dasbor Mitra.
  2. Sistem menampilkan rincian keuangan: Total Pendapatan Kotor, Potongan Bagi Hasil Platform (merujuk ke UC-16), Potongan Pajak PPh 21, Saldo Tertahan (*Escrow/Pending*), dan Saldo Tersedia (*Available Balance*).
  3. Mitra mengklik tombol "Tarik Dana" dan memasukkan nominal yang ingin dicairkan (minimal Rp 50.000).
  4. Sistem memvalidasi bahwa nominal tidak melebihi Saldo Tersedia, memverifikasi status NPWP (PPh 21), dan memeriksa keabsahan rekening bank profesi (Faskes/Peradi/HIMPSI).
  5. Sistem memotong Saldo Tersedia mitra di database dan memindahkannya ke tabel `saldo_dibekukan` (*Balance Freeze*).
  6. Sistem memeriksa nominal penarikan terhadap aturan *Threshold Control*:
     * **Jika Nominal < Rp 5.000.000**: Sistem menginisiasi panggilan API *Auto-Disbursement* langsung ke Payment Gateway / Bank Switcher untuk mentransfer dana saat itu juga.
     * **Jika Nominal >= Rp 5.000.000**: Sistem memasukkan permintaan pencairan ke dalam antrean **Manual Approval** di Dasbor Admin Finansial. Admin Finansial mereview bukti pelayanan, mengklik "Setujui & Transfer", baru sistem memicu API Bank Gateway.
  7. API Bank Gateway membalas dengan status *Transfer Success*.
  8. Sistem memperbarui status penarikan menjadi `DISBURSED`, menghapus dana dari `saldo_dibekukan`, dan mencatat log mutasi finansial WORM.
  9. Sistem mengirimkan email bukti transfer (*Remittance Advice*) beserta slip pemotongan pajak PPh 21 kepada Mitra Profesional.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Rekening Bank Tujuan Tidak Cocok dengan Identitas STR/KTA (*Name Mismatch*)**:
    1. Sistem mendeteksi bahwa rekening bank yang dipilih mitra memiliki nama pemilik yang berbeda dengan nama KTP/STR/KTA yang diverifikasi saat registrasi.
    2. Sistem menolak penarikan dana dan menampilkan pesan error AML: *"Penarikan dana ditolak. Demi kepatuhan anti-pencucian uang, rekening tujuan harus atas nama [Nama Mitra Terdaftar]"*.
  * **6a/7a. Webhook Bank Membalas Gagal (Transfer Ditolak / Rekening Diblokir)**:
    1. API Bank mengembalikan status gagal transfer karena nomor rekening tujuan salah, diblokir bank, atau sistem kliring bank sedang offline.
    2. Sistem secara otomatis melakukan **Rollback Finansial**: mengembalikan uang dari `saldo_dibekukan` kembali ke `saldo_tersedia` (*Unfreeze Balance*).
    3. Sistem memperbarui status penarikan menjadi `FAILED` dan mengirimkan notifikasi peringatan ke aplikasi dan email mitra: *"Penarikan dana sebesar Rp [Nominal] gagal diproses oleh bank tujuan. Saldo Anda telah dikembalikan secara utuh ke dompet platform"*.
  * **6b. Admin Finansial Menolak Pencairan Manual (Terdeteksi Anomali/Fraud)**:
    1. Pada penarikan >= Rp 5.000.000, Admin Finansial menemukan adanya kejanggalan transaksi (misal: konsultasi fiktif atau manipulasi rating).
    2. Admin mengklik tombol "Tolak Pencairan & Investigasi" di dasbor admin.
    3. Sistem menahan dana di `saldo_dibekukan`, mengubah status menjadi `UNDER_INVESTIGATION`, dan menonaktifkan sementara fitur penarikan dana pada akun mitra tersebut hingga sidang etik/investigasi selesai (UC-15).
  * **7b. API Bank Timeout / Tidak Membalas (> 24 Jam Tanpa Callback)**:
    1. Sistem *Watchdog / Cron Job* mendeteksi transaksi penarikan berstatus `PROCESSING` di API Bank melebihi batas waktu 24 jam tanpa kejelasan *callback*.
    2. Sistem menjalankan protokol **Safety Rollback**: membatalkan instruksi transfer di Payment Gateway, mengembalikan saldo dari `saldo_dibekukan` ke `saldo_tersedia`, dan mengirimkan tiket investigasi otomatis ke tim engineer finansial.

---

## C. Aktor: Admin Sistem (System Admin)

### UC-13: Memverifikasi Berkas Kredensial Mitra & SKTM Pro Bono
* **Aktor Utama**: Admin Sistem (Tim Compliance & Legal)
* **Aktor Pendukung**: Sistem Integrasi Eksternal (API Konsil Kemitra profesionalan KKI/KTKI, API HIMPSI, API Peradi, API Dukcapil & DTKS Kemensos)
* **Deskripsi Singkat**: Admin Sistem melakukan verifikasi silang (*cross-check*) terhadap keabsahan dokumen lisensi profesi calon mitra profesional baru (STR/SIP/KTA/SIPP) serta dokumen Surat Keterangan Tidak Mampu (SKTM) dari klien pengaju bantuan hukum gratis (*Pro Bono*).
* **Pre-condition**: Terdapat antrean verifikasi berkas lisensi mitra (`PENDING_VERIFICATION`, UC-07) atau antrean pengajuan SKTM Pro Bono dari klien (`PENDING_SKTM`, Huk-UC03).
* **Post-condition**: Status verifikasi berubah menjadi aktif/disetujui (`ACTIVE` / `SKTM_APPROVED`) atau ditolak (`REJECTED` / `SKTM_REJECTED`) di database, dan log keputusan tercatat dalam audit trail WORM.
* **Compliance Checklist & Regulasi Domain**:
  * **UU No. 17 Tahun 2023 (Kesehatan)**: Verifikasi keaslian STR mitra profesional **wajib** dilakukan dengan mencocokkan nomor STR dan NIK secara langsung ke database Konsil Kemitra profesionalan Indonesia (KKI) / KTKI melalui gerbang API nasional.
  * **Kode Etik HIMPSI (Psikologi)**: Verifikasi SIPP psikolog **wajib** dicocokkan dengan direktori keanggotaan HIMPSI Pusat dan Wilayah untuk memastikan tidak ada pembekuan izin praktik klinis.
  * **UU No. 18 Tahun 2003 (Advokat & Pro Bono)**: Keabsahan KTA Advokat diverifikasi ke Pangkalan Data Peradi. Sementara untuk klien Pro Bono, verifikasi SKTM **wajib** dikomparasi dengan Data Terpadu Kesejahteraan Sosial (DTKS) Kemensos dan Dukcapil demi mencegah salah sasaran subsidi bantuan hukum cuma-cuma.
* **Alur Utama (Basic Flow)**:
  1. Admin Sistem login ke Dasbor Admin dan membuka modul "Antrean Verifikasi Kredensial & SKTM".
  2. Sistem me-render dua tab antrean: **Tab Verifikasi Lisensi Mitra** dan **Tab Verifikasi SKTM Pro Bono (Klien)**.
  3. Admin memilih salah satu berkas antrean, sistem menampilkan dokumen yang diunggah dari storage WORM berenkripsi, serta memunculkan tombol analisis **Cross-Check API Eksternal**.
  4. **Jika Memverifikasi Lisensi Mitra Profesional**:
     * Admin mengklik "Cross-Check ke Database Nasional".
     * Sistem memanggil API KKI/KTKI (untuk Medis), API HIMPSI (untuk Psikologi), atau API Peradi (untuk Hukum) berdasarkan nomor lisensi yang diinput mitra.
     * API eksternal merespons dengan data validitas (Nama Pemilik, Status Aktif, Tanggal Kedaluwarsa).
     * Jika data cocok 100%, Admin mengklik tombol "Setujui / Approve".
     * Sistem mengubah status akun mitra menjadi `ACTIVE`, mengaktifkan profilnya di katalog pencarian (UC-03), dan mengirimkan email selamat bergabung kepada mitra.
  5. **Jika Memverifikasi SKTM Pro Bono (Klien)**:
     * Admin memeriksa visual dokumen SKTM (cap kelurahan, tanda tangan pejabat, dan kesesuaian NIK).
     * Admin mengklik "Cross-Check DTKS & Dukcapil".
     * Sistem memanggil API Dukcapil untuk memvalidasi NIK dan API DTKS Kemensos untuk memeriksa status ekonomi pengaju.
     * Jika NIK terbukti valid dan terdaftar dalam kelompok masyarakat berpenghasilan rendah/rentan, Admin mengklik "Setujui SKTM".
     * Sistem mengubah status pengajuan Pro Bono menjadi `SKTM_APPROVED`, menerbitkan kuota tiket konsultasi bernominal Rp 0 (subsidi 100%), dan mengirimkan notifikasi persetujuan ke dasbor klien agar langsung terhubung dengan Advokat Pro Bono (Huk-UC03).
  6. Sistem mencatat seluruh keputus verifikasi admin beserta *payload respons API* ke dalam log WORM permanen sebagai bukti pertanggungjawaban hukum.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a/5a. Berkas Terdeteksi Palsu / Kedaluwarsa / Tidak Terdaftar di API Nasional**:
    1. Respons API eksternal menunjukkan bahwa nomor STR/SIPP/Peradi tidak terdaftar, atau nama pemilik di database nasional berbeda dengan KTP yang diunggah (*Identity Fraud*). Pada kasus SKTM, NIK klien tidak ditemukan dalam DTKS atau surat kelurahan terindikasi hasil suntingan digital.
    2. Admin mengklik tombol "Tolak / Reject" di layar peninjauan.
    3. Sistem memunculkan jendela modal alasan penolakan dengan daftar kategori standar (misal: *Lisensi Kedaluwarsa*, *Nomor STR Tidak Terdaftar di KKI*, *SKTM Tidak Terverifikasi Kelurahan*, atau *Dokumen Buram/Tidak Terbaca*).
    4. Admin memilih alasan dan menambah komentar perbaikan spesifik.
    5. Sistem memperbarui status menjadi `REJECTED` (untuk mitra) atau `SKTM_REJECTED` (untuk klien), mengunci sementara kemampuan pengajuan ulang selama 24 jam, dan mengirimkan email pemberitahuan penolakan beserta instruksi perbaikan dokumen.
  * **4b. API Eksternal Nasional Sedang Down / Timeout**:
    1. Server KKI/HIMPSI/Peradi/Dukcapil tidak dapat dihubungi saat Admin menekan tombol cross-check.
    2. Sistem menampilkan peringatan: *"API Verifikasi Nasional sedang tidak dapat diakses. Harap lakukan verifikasi manual via telepon/web resmi organisasi profesi atau tunda persetujuan hingga server nasional pulih"*.
    3. Admin dapat menempatkan berkas ke status `ON_HOLD_NATIONAL_SERVER` tanpa menolak akun pengguna.

---

### UC-14: Mengelola Data Akun Klien
* **Aktor Utama**: Admin Sistem (Tim Compliance & Customer Relations)
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Admin Sistem mengelola data akun klien, menangani laporan pelanggaran ketentuan layanan, dan menerapkan sanksi penangguhan (*suspend*) melalui prosedur due process of law yang adil.
* **Pre-condition**: Admin telah login ke Dasbor Admin dan terdapat laporan pelanggaran dari mitra atau deteksi anomali sistem terhadap suatu akun klien.
* **Post-condition**: Akun klien yang melanggar diberikan peringatan bertingkat atau ditangguhkan (`SUSPENDED`), bukti pelanggaran tersimpan di WORM storage, dan surat penonaktifan resmi diterbitkan dengan masa banding 14 hari.
* **Compliance Checklist & Regulasi Domain**:
  * **Due Process of Law & Perlindungan Konsumen**: Platform **wajib** menerapkan prinsip keadilan struktural sebelum menonaktifkan akun klien secara sepihak. Klien yang melanggar aturan ringan/sedang (misal: membatalkan janji sepihak berulang kali atau berbicara kasar di chat) wajib diberikan **Peringatan Bertingkat (*Warning 1, 2, 3*)** sebelum sanksi suspend dijatuhkan.
  * **WORM Evidence Logging**: Seluruh bukti pelanggaran (transkrip chat yang dilaporkan, rekaman log kasar, atau bukti *chargeback* curang) **wajib** dibekukan ke dalam *Write-Once-Read-Many (WORM) Storage* sebagai alat bukti yang sah jika klien menggugat ke Badan Penyelesaian Sengketa Konsumen (BPSK) atau pengadilan.
  * **Mandatory Appeal Window (Masa Banding 14 Hari)**: Klien yang di-suspend wajib diberikan surat pemberitahuan resmi via email beserta hak untuk mengajukan pembelaan/banding dalam waktu **14 hari kerja** sejak tanggal penangguhan.
* **Alur Utama (Basic Flow)**:
  1. Admin membuka modul "Manajemen Akun Klien & Laporan Pelanggaran" di Dasbor Admin.
  2. Sistem me-render daftar akun klien dan menyorot akun-akun yang menerima laporan pelanggaran dari mitra profesional atau sistem pemantau anti-fraud.
  3. Admin memilih akun klien yang dilaporkan dan memeriksa log bukti pelanggaran (Evidence Log).
  4. Sistem menampilkan riwayat jumlah peringatan (*Warning Count*) yang pernah diterima klien:
     * **Jika Warning Count < 2 (Pelanggaran Ringan/Sedang Pertama atau Kedua)**:
       * Admin memilih opsi "Kirim Peringatan / Warning".
       * Sistem mencatat peringatan di database (*Warning Count + 1*), mengamankan bukti ke storage WORM, dan mengirimkan email/notifikasi peringatan keras kepada klien: *"Peringatan Ke-[N]: Kami mendeteksi adanya pelanggaran Ketentuan Layanan pada sesi konsultasi Anda. Pelanggaran berikutnya dapat mengakibatkan penonaktifan akun"*.
     * **Jika Warning Count >= 2 (Pelanggaran Berulang Ke-3) ATAU Pelanggaran Berat (Misal: Pelecehan Seksual terhadap Mitra / Penipuan Kartu Kredit)**:
       * Admin mengklik tombol "Putuskan Suspend Akun".
       * Sistem meminta konfirmasi akhir dan mengharuskan Admin melampirkan berkas bukti WORM.
       * Admin mengonfirmasi penangguhan.
       * Sistem mengubah status akun klien menjadi `SUSPENDED`, mematikan seluruh token sesi JWT aktif klien secara instan (*force logout*), dan memblokir akses login (UC-02).
       * Sistem secara otomatis men-generate **Surat Resmi Penangguhan Akun** ber-hash SHA-256 yang merinci pasal pelanggaran, lampiran bukti, serta instruksi pengajuan banding dalam masa **14 Hari Kerja**, lalu mengirimkannya ke email terdaftar klien.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Klien Mengajukan Banding dalam Masa 14 Hari (*Appeal Process*)**:
    1. Klien membalas surat penangguhan atau mengisi formulir banding resmi dengan melampirkan klarifikasi dan bukti sanggahan.
    2. Tiket banding masuk ke tab "Antrean Banding Klien" di Dasbor Admin Compliance.
    3. Admin meninjau sanggahan klien bersama tim legal.
    4. **Jika Banding Diterima**: Admin mengklik "Cabut Suspend / Reinstate". Sistem memulihkan status akun kembali menjadi `ACTIVE`, mereset *Warning Count* menjadi 0, dan mengirimkan email pemulihan nama baik kepada klien.
    5. **Jika Banding Ditolak / Tidak Ada Banding hingga Hari Ke-15**: Admin mengklik "Kunci Suspend Permanen". Sistem menutup jendela banding, mengunci akun klien secara permanen di database, dan memasukkan NIK/Email klien ke dalam daftar hitam (*Blacklist*) sistem untuk mencegah pendaftaran ulang.
  * **4b. Klien Meminta Penghapusan Data Pribadi Saat Di-suspend (UU PDP Conflict)**:
    1. Klien yang tersuspend mengajukan permohonan *Right to be Forgotten* (penghapusan akun) demi menghindari rekam jejak pelanggaran.
    2. Sistem menolak permohonan penghapusan secara otomatis karena akun sedang dalam masa *Legal Hold / WORM Audit Trail* untuk kepentingan penyelidikan hukum atau penyelesaian sengketa, sesuai pengecualian dalam UU PDP No. 27/2022.

---

### UC-15: Mengelola Data Akun Mitra Profesional
* **Aktor Utama**: Admin Sistem (Admin Compliance & Tim Etik Multidisiplin)
* **Aktor Pendukung**: Tim Etik Multidisiplin (Mitra Profesional Senior, Psikolog Senior, Advokat Senior), Badan Profesi Nasional (Konsil Kemitra profesionalan KKI, HIMPSI, Peradi)
* **Deskripsi Singkat**: Admin Sistem menangani laporan malpraktik, pelanggaran kode etik, atau kelalaian berat yang dilakukan oleh Mitra Profesional melalui **Ethics Committee Flow** (Sidang Etik Multidisiplin), memverifikasi sanksi penangguhan (`SUSPENDED`), dan melaporkan pelanggaran etik ke organisasi profesi nasional.
* **Pre-condition**: Terdapat laporan pelanggaran etik berat dari klien (merujuk ke UC-06 *Adverse Event* atau laporan langsung), atau terdeteksi kelalaian medis/hukum fatal.
* **Post-condition**: Akun mitra profesional ditangguhkan permanen (`SUSPENDED`), di-blacklist dari platform, dan laporan resmi dikirimkan ke Badan Profesi (KKI/HIMPSI/Peradi) untuk tindakan pencabutan lisensi praktik nasional.
* **Compliance Checklist & Regulasi Domain**:
  * **Ethics Committee Flow (Sidang Etik Multidisiplin)**: Platform JUSTIFICA dilarang memecat atau men-suspend permanen seorang tenaga ahli (Advokat/Psikolog) hanya atas putusan sepihak Admin awam. Sistem **wajib** memfasilitasi pembentukan **Tim Etik Multidisiplin** yang terdiri dari: 1 orang Mitra Profesional Senior (untuk kasus medis), 1 orang Psikolog Senior (untuk kasus psikologi), 1 orang Advokat Senior (untuk kasus hukum), dan 1 orang Admin Compliance Platform.
  * **Mandatory Hearing & Due Process**: Mitra profesional yang tertuduh **wajib** diberikan hak untuk membela diri dalam sidang etik formal (*Ethics Hearing*) sebelum putusan penangguhan dijatuhkan.
  * **Mandatory Professional Body Reporting**: Sesuai UU No. 17/2023 (Kesehatan), Kode Etik HIMPSI, dan UU No. 18/2003 (Advokat), jika putusan sidang etik menemukan bukti sah malpraktik klinis atau pelanggaran berat hukum, platform **wajib secara hukum** menerbitkan laporan resmi beserta bukti WORM ke Badan Profesi terkait (KKI/KTKI, HIMPSI, atau Peradi) agar izin praktik nasional mitra dapat ditinjau atau dicabut.
  * **WORM Audit Preservation**: Seluruh berkas pembuktian, transkrip sidang hearing, dan putusan etik disimpan permanen dalam WORM storage yang tidak dapat dihapus atau diubah sampai kapan pun.
* **Alur Utama (Basic Flow)**:
  1. Admin Compliance menerima tiket insiden prioritas tinggi dari modul *Adverse Event Reporting* klien (UC-06) atau laporan malpraktik.
  2. Admin membuka modul "Manajemen Akun Mitra & Kasus Etik" dan memeriksa bukti pendukung awal.
  3. Jika laporan terbukti memiliki dasar klinis/hukum yang serius, Admin mengklik tombol **"Inisiasi Ethics Committee Flow"**.
  4. Sistem menonaktifkan sementara status ketersediaan mitra menjadi `OFFLINE` (*Pre-hearing Suspension*) agar mitra tidak menerima klien baru selama investigasi berlangsung.
  5. Sistem membentuk panel **Tim Etik Multidisiplin** di database dengan mengundang anggota komite yang sebidang dengan domain mitra tertuduh (misal: Mitra Profesional Spesialis Senior untuk mengadili Mitra Profesional).
  6. Sistem men-generate surat panggilan sidang etik (*Ethics Hearing Invitation*) dan menjadwalkan pertemuan virtual dalam waktu maksimal 7 hari kerja, lalu mengirimkan undangan ke email mitra profesional.
  7. **Pelaksanaan Hearing Etik**: Tim Etik Multidisiplin dan Mitra Profesional melangsungkan sidang pembelaan. Tim Etik memeriksa bukti rekam medis/hukum terenkripsi di WORM storage.
  8. Setelah hearing selesai, Ketua Tim Etik menginput **Putusan Etik Resmi** ke dalam sistem:
     * **Jika Putusan = Terbukti Melanggar Berat (Malpraktik / Pelanggaran Kode Etik Fatal)**:
       * Admin Compliance mengonfirmasi putusan di dasbor.
       * Sistem mengubah status akun mitra menjadi `SUSPENDED` (Permanen), mencabut seluruh hak akses dasbor profesional, dan membatalkan jadwal konsultasi mendatang dengan pengembalian dana 100% ke klien.
       * Sistem secara otomatis men-generate **Laporan Resmi Pelanggaran Etik Profesi** ber-tanda tangan digital dan mengirimkan berkas laporan beserta lampiran bukti WORM melalui API / Email Resmi ke **Badan Profesi Nasional** (Konsil Kemitra profesionalan KKI / HIMPSI / Peradi).
       * Sistem mencatat putusan akhir ke dalam WORM storage permanen dan memblokir identitas NIK/STR mitra dari platform JUSTIFICA selamanya.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **8a. Putusan Tim Etik = Tidak Terbukti Melanggar / Dibebaskan (*Not Guilty*)**:
    1. Tim Etik Multidisiplin menyimpulkan bahwa keluhan klien tidak beralasan (misal: efek samping obat normal yang sudah dijelaskan dalam *Informed Consent*, bukan kelalaian mitra profesional).
    2. Ketua Tim Etik mengklik tombol "Bebaskan & Pulihkan Nama Baik".
    3. Sistem mencabut *Pre-hearing Suspension*, memulihkan status akun mitra menjadi `ACTIVE`, mereset indikator laporan di profil mitra, dan mengirimkan surat keterangan bersih/rehabilitasi nama baik kepada mitra profesional.
  * **6a. Mitra Profesional Menolak Hadir atau Mangkir dari Sidang Hearing (> 7 Hari)**:
    1. Mitra profesional tidak menghadiri undangan hearing virtual sebanyak 2 kali pemanggilan tanpa alasan sah.
    2. Tim Etik Multidisiplin memutuskan perkara secara *Verstek* (putusan tanpa kehadiran tertuduh) berdasarkan bukti WORM yang ada.
    3. Sistem langsung menjatuhkan status `SUSPENDED` permanen dan menerbitkan laporan ke Badan Profesi sesuai prosedur alur utama.

---

### UC-16: Memantau Laporan Transaksi
* **Aktor Utama**: Admin Sistem (Admin Finansial & Auditor)
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Admin Finansial memantau seluruh arus kas masuk dari konsultasi, memeriksa kalkulasi bagi hasil (*revenue sharing*) proporsional per domain, dan mengunduh laporan keuangan ber-hash untuk keperluan audit tahunan.
* **Pre-condition**: Admin telah login ke Dasbor Admin dan memiliki hak akses ke modul finansial (`ROLE_FINANCE` / `ROLE_AUDITOR`).
* **Post-condition**: Admin melihat visualisasi real-time grafik transaksi dan berhasil mengekspor berkas laporan keuangan audit-ready (XLSX/PDF) yang dilindungi *checksum hash* SHA-256.
* **Compliance Checklist & Regulasi Domain**:
  * **Standar Akuntansi Keuangan (SAK) & Audit Trail**: Seluruh catatan transaksi tidak boleh mengalami *hard-delete*. Setiap modifikasi atau pembatalan transaksi harus dicatat melalui jurnal pembalik (*reversing entry*).
  * **Kebijakan Revenue Sharing Proporsional Domain**: Sistem **wajib** membagi pendapatan konsultasi antara Platform JUSTIFICA dan Mitra Profesional dengan persentase bagi hasil baku yang berbeda per domain profesi:
    * **Domain Kesehatan Medis**: **15% Platform / 85% Mitra Mitra Profesional** (Mengimbangi biaya operasional tinggi dan risiko klinis medis).
    * **Domain Psikologi**: **20% Platform / 80% Mitra Psikolog** (Standar layanan kesehatan mental digital).
    * **Domain Hukum**: **25% Platform / 75% Mitra Advokat** (Standar komersial layanan konsultasi legal & draf hukum).
  * **WORM Export Security**: Setiap berkas laporan keuangan yang diekspor dari sistem **wajib** dibubuhi tanda tangan digital dan *checksum hash* SHA-256 di halaman akhir atau *metadata* file untuk menjamin keaslian bukti keuangan saat diaudit oleh akuntan publik atau kantor pajak.
* **Alur Utama (Basic Flow)**:
  1. Admin Finansial membuka menu "Laporan & Rekonsiliasi Transaksi Keuangan" di Dasbor Admin.
  2. Sistem me-render dasbor intelijen bisnis yang menampilkan: Total Volume Transaksi (GMV), Pendapatan Bersih Platform, Total Payout Mitra, dan grafik perbandingan performa antar domain (Medis vs Hukum vs Psikologi).
  3. Admin memilih parameter filter: Rentang Tanggal (misal: 1 Bulan Terakhir), Domain Layanan, Metode Pembayaran (QRIS/VA/CC), atau Status Transaksi (`PAID`/`FAILED`/`REFUNDED`).
  4. Sistem menjalankan *query aggregation* ke database, mengalkulasi otomatis pembagian *Revenue Sharing* (15%/20%/25%) sesuai domain tiap transaksi, dan me-render tabel rincian transaksi terfilter.
  5. Admin mengklik tombol "Ekspor Laporan Audit-Ready".
  6. Sistem menanyakan format berkas yang diinginkan (`.xlsx` Excel atau `.pdf`).
  7. Sistem men-generate berkas laporan keuangan lengkap, menghitung *checksum hash* SHA-256 dari keseluruhan data, dan menyematkan string *hash* tersebut ke dalam *footer* laporan serta log WORM sistem.
  8. Berkas laporan siap dan otomatis terunduh ke peramban (*browser*) Admin Finansial.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Data Transaksi Tidak Ditemukan Sesuai Filter**:
    1. Sistem mendeteksi bahwa kombinasi filter yang dipilih (misal: *Domain Hukum pada tanggal libur nasional dengan metode CC*) tidak menghasilkan satu pun catatan transaksi.
    2. Sistem menampilkan pesan informasi: *"Tidak ada catatan transaksi yang cocok dengan kriteria filter tersebut"*.
    3. Tombol "Ekspor Laporan Audit-Ready" dinonaktifkan secara otomatis agar tidak menghasilkan berkas kosong.
  * **4b. Terdeteksi Diskrepansi Rekonsiliasi Bank (*Bank Reconciliation Discrepancy*)**:
    1. Saat sistem membandingkan log transaksi lokal dengan *settlement report* harian dari Payment Gateway, terdeteksi selisih nominal (misal: ada transaksi yang tercatat `PAID` di sistem namun uangnya belum masuk di rekening bank settlement).
    2. Sistem memunculkan alarm kuning **"Discrepancy Flag"** pada baris transaksi yang bermasalah.
    3. Admin Finansial mengklik baris tersebut untuk menginisiasi investigasi rekonsiliasi manual bersama penyedia Payment Gateway sebelum saldo dapat ditarik oleh mitra (menahan transaksi dari perhitungan UC-17).

---

## D. Skenario Spesifik Domain (Psikologi & Hukum)

### Psi-UC01: Mengisi Jurnal Mood Harian (Domain Psikologi)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada (Akses Read-Only oleh Psikolog saat sesi aktif)
* **Deskripsi Singkat**: Klien mencatat kondisi emosional dan pemicu stres harian ke dalam *Mood Tracker*, yang akan membentuk grafik korelasi klinis yang berguna bagi asesmen psikolog.
* **Pre-condition**: Klien telah login ke platform.
* **Post-condition**: Catatan mood harian tersimpan terenkripsi di database dan memperbarui grafik tren emosi klien.
* **Compliance Checklist & Regulasi Domain**:
  * **Kode Etik HIMPSI (Kerahasiaan Catatan Pribadi)**: Catatan jurnal psikologi adalah data klinis sangat rahasia. Jurnal **dilarang** diakses oleh siapapun kecuali Psikolog Klinis yang sedang melayani sesi konsultasi aktif klien tersebut (atas persetujuan informed consent awal).
  * **Proactive Mental Health Protection**: Sistem dilengkapi pemantau tren otomatis. Jika tren mood menunjukkan tingkat kesedihan/kecemasan ekstrem secara kontinu, sistem **wajib** memberikan intervensi psikoedukasi atau rekomendasi konseling.
* **Alur Utama (Basic Flow)**:
  1. Klien membuka widget "Jurnal Mood Harian (*Mood Tracker*)" di Dasbor Klien.
  2. Sistem me-render roda emosi dengan pilihan ikon emotikon (Sangat Senang, Tenang, Biasa, Cemas, Sedih, Marah, atau Panik).
  3. Klien memilih emotikon yang paling mewakili perasaannya hari ini.
  4. Sistem memunculkan kolom pengisian teks pemicu (misal: *Pekerjaan*, *Keluarga*, *Trauma*, atau *Keuangan*) serta intensitas skala 1-10.
  5. Klien mengetikkan refleksi pribadi singkat dan mengklik "Simpan Jurnal".
  6. Sistem mengenkripsi teks secara *field-level* dan menyimpannya ke database.
  7. Sistem memperbarui grafik visualisasi kalender mood mingguan/bulanan di layar klien.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **5a. Deteksi Tren Emosi Negatif Ekstrem (7 Hari Berturut-turut)**:
    1. Algoritma sistem mendeteksi bahwa klien mencatat emosi "Sedih/Panik" dengan skala intensitas > 8 selama 7 hari beruntun.
    2. Sistem memunculkan **Proactive Wellness Banner** pop-up yang lembut: *"Kami memperhatikan Anda sedang mengalami minggu yang cukup berat. Anda tidak sendirian. Apakah Anda ingin berbicara dengan Psikolog Klinis kami hari ini?"*.
    3. Sistem menawarkan kupon subsidi diskon 50% untuk memesan sesi psikologi klinis (UC-03) guna mendorong penanganan pencegahan sebelum krisis mental memburuk.

---

### Psi-UC02: Mengakses Audio Meditasi (Domain Psikologi)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Klien memutar trek audio terapi relaksasi, meditasi *mindfulness*, atau panduan teknik *grounding* klinis untuk meredakan kecemasan mandiri (*self-help*).
* **Pre-condition**: Klien telah login ke platform.
* **Post-condition**: Trek audio berhasil diputar secara *streaming* dan riwayat latihan relaksasi tercatat di profil klien.
* **Compliance Checklist & Regulasi Domain**:
  * **Standar Psikoedukasi & Intervensi Non-Klinis**: Seluruh materi audio meditatif di platform **wajib** dikurasi dan divalidasi oleh dewan ahli HIMPSI untuk memastikan teknik bernapas (misal: *4-7-8 breathing* atau *5-4-3-2-1 grounding*) aman dan tidak memicu trauma sekunder (*retraumatization*).
* **Alur Utama (Basic Flow)**:
  1. Klien membuka menu "Relaksasi & Audio Meditasi" di Dasbor Klien.
  2. Sistem menampilkan daftar kategori audio klinis (Tidur Nyenyak, Meredakan Serangan Panik / *Panic Attack Aid*, *Mindfulness* Fokus, dan Grounding Trauma).
  3. Klien memilih salah satu trek audio (misal: *"Panduan Pernapasan 10 Menit saat Cemas"*).
  4. Klien mengklik tombol *Play*.
  5. Sistem melakukan *streaming* audio beresolusi tinggi ke pemutar media internal aplikasi dengan latar belakang suara alam yang menenangkan.
  6. Setelah audio selesai diputar, sistem menambahkan +10 menit ke statistik "Waktu Mindfulness Anda" di dasbor klien.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Koneksi Internet Klien Lambat atau Tidak Stabil**:
    1. *Buffer streaming* audio mengalami keterlambatan atau terputus-putus.
    2. Sistem secara otomatis menurunkan bitrate audio dari High (320kbps) ke Low (64kbps) agar pemutaran suara panduan napas tetap lancar tanpa jeda.
    3. Sistem menampilkan opsi: *"Unduh Audio ini ke memori aplikasi untuk diputar offline secara lancar kapan saja"*.

---

### Psi-UC03: Mengisi Tes Asesmen Psikologi DASS-21 (Domain Psikologi)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Psikolog Klinis, Supervisor Klinis (Khusus kondisi krisis)
* **Deskripsi Singkat**: Klien mengisi instrumen kuisioner psikometri baku **DASS-21 (*Depression, Anxiety, and Stress Scale - 21 Items*)** untuk mengukur tingkat keparahan depresi, kecemasan, dan stres, dilengkapi dengan protokol intervensi krisis darurat.
* **Pre-condition**: Klien telah login ke platform.
* **Post-condition**: Skor DASS-21 terhitung otomatis, diklasifikasikan, dan disimpan terenkripsi. Jika skor menunjukkan risiko berat (*Severe/Extreme*), protokol intervensi krisis darurat diaktifkan.
* **Compliance Checklist & Regulasi Domain**:
  * **Standar Psikometri Klinis DASS-21**: Pengalkulasian skor **wajib** mengikuti rumus baku DASS-21 (penjumlahan skor 7 butir per subskala dikalikan 2) dan dikelompokkan ke dalam 5 jenjang keparahan resmi: *Normal, Mild, Moderate, Severe, Extremely Severe*.
  * **Kode Etik HIMPSI (Mandatory Crisis Intervention Protocol)**: Platform konsultasi psikologi **dilarang keras** membiarkan klien yang memperoleh skor *Severe* atau *Extremely Severe* tanpa pengamanan. Sistem **wajib secara mutlak** memunculkan jendela intervensi krisis darurat yang tidak dapat ditutup, menyediakan akses langsung ke hotline darurat, dan menghubungkan klien ke Psikolog Klinis bersertifikat.
* **Alur Utama (Basic Flow)**:
  1. Klien memilih menu "Tes Asesmen DASS-21" di dasbor layanan psikologi.
  2. Sistem menampilkan *Informed Consent* kuisioner bahwa tes ini adalah instrumen pengukuran awal (*self-report*) dan bukan pengganti diagnosis klinis tatap muka. Klien menekan "Setuju & Mulai Tes".
  3. Sistem me-render 21 butir pernyataan psikometri secara bertahap. Klien memilih skala penilaian (0 = Tidak pernah, 1 = Kadang-kadang, 2 = Sering, 3 = Sangat sering) untuk setiap butir.
  4. Klien menjawab seluruh butir dan menekan tombol "Lihat Hasil Analisis".
  5. Sistem menjalankan *scoring engine*:
     * *Subskala Depression*: $	ext{Sum}(Q_3, Q_5, Q_{10}, Q_{13}, Q_{16}, Q_{17}, Q_{21}) 	imes 2$
     * *Subskala Anxiety*: $	ext{Sum}(Q_2, Q_4, Q_7, Q_9, Q_{15}, Q_{19}, Q_{20}) 	imes 2$
     * *Subskala Stress*: $	ext{Sum}(Q_1, Q_6, Q_8, Q_{11}, Q_{12}, Q_{14}, Q_{18}) 	imes 2$
  6. Sistem memetakan skor ke dalam tabel klasifikasi keparahan. Jika seluruh subskala berada pada tingkat *Normal, Mild,* atau *Moderate*, sistem menampilkan grafik bar visualisasi skor beserta interpretasi psikologis yang menenangkan.
  7. Sistem memberikan rekomendasi tindakan mandiri (*self-help* audio meditasi Psi-UC02) atau opsi membuat janji temu dengan psikolog konselor biasa.
  8. Data asesmen disimpan terenkripsi di database untuk dilampirkan jika klien membuka konsultasi kelak.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **6a. Terdeteksi Skor *Severe* atau *Extremely Severe* (Mandatory Crisis Protocol)**:
    1. *Scoring engine* menemukan bahwa salah satu atau seluruh subskala mencapai angka batas kritis (misal: skor Depression >= 28 atau Anxiety >= 20).
    2. Sistem langsung memicu **Crisis Flag Protocol** secara *blocking*:
       * Layar aplikasi berubah ke mode peringatan krisis dan memunculkan **Pop-Up Darurat Hotline Krisis 119 Ext 8 / Kemenkes & LBH Mental Health**.
       * Pop-up ini dilengkapi mekanisme **Mandatory 10-Second Read Lock** (tombol tutup / *close* dinonaktifkan selama 10 detik agar klien membaca nomor darurat terlebih dahulu).
       * Sistem mengirimkan *Emergency Alert Notification* secara real-time ke panel **Supervisor Klinis Psikologi** di platform JUSTIFICA.
       * Sistem mengaktifkan **Prioritas Booking Tanpa Antre**: mengarahkan klien secara eksklusif hanya kepada daftar **Psikolog Klinis Spesialis Trauma/Krisis** bersertifikat HIMPSI (bukan konselor umum), dengan opsi subsidi tarif atau sambungan darurat instan.
  * **4a. Klien Keluar / Menutup Aplikasi Sebelum Menyelesaikan 21 Pertanyaan**:
    1. Klien menutup aplikasi pada pertanyaan ke-15.
    2. Sistem menyimpan jawaban sementara di *cache browser/app* selama 24 jam.
    3. Saat klien kembali membuka menu asesmen, sistem menawarkan: *"Lanjutkan tes Anda dari pertanyaan nomor 16"* atau *"Mulai ulang dari awal"*.

---

### Huk-UC01: Mengunggah Berkas Perkara (Domain Hukum)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Advokat Mitra
* **Deskripsi Singkat**: Klien mengunggah dokumen hukum rahasia (seperti bukti kontrak, surat gugatan, sertifikat tanah, atau foto bukti kasus) ke dalam ruang obrolan konsultasi agar ditinjau oleh advokat.
* **Pre-condition**: Klien berada dalam ruang obrolan konsultasi hukum aktif bersama advokat (UC-04).
* **Post-condition**: Dokumen perkara terenkripsi secara *Zero-Knowledge* / E2EE, ditandai sebagai barang bukti rahasia (*Privileged Evidence*), dan dapat dibuka oleh advokat.
* **Compliance Checklist & Regulasi Domain**:
  * **UU No. 18 Tahun 2003 (Advocate-Client Privilege)**: Dokumen bukti perkara yang diunggah klien kepada advokatnya memiliki perlindungan kerahasiaan hukum mutlak. Sistem **wajib** menerapkan arsitektur *Zero-Knowledge Encryption*: file dienkripsi di perangkat klien sebelum diunggah ke cloud, dan kunci dekripsinya hanya dimiliki oleh perangkat klien dan advokat yang bersangkutan. Admin Sistem platform **dilarang dan secara teknis tidak dapat** membuka atau membaca isi dokumen tersebut.
  * **Tamper-Proof File Integrity**: Sistem mencatat *hash* SHA-256 dari berkas yang diunggah untuk memastikan dokumen bukti tidak rusak atau dimodifikasi selama transmisi.
* **Alur Utama (Basic Flow)**:
  1. Di dalam ruang obrolan konsultasi hukum, klien mengklik ikon "Lampiran / Unggah Bukti Perkara".
  2. Klien memilih berkas dari perangkatnya (mendukung PDF, DOCX, JPG, PNG; maksimal 25 MB per berkas).
  3. Sistem di sisi klien (*client-side*) melakukan pemindai virus/malware cepat dan mengalkulasi *hash* SHA-256 dari berkas mentah.
  4. Sistem melakukan enkripsi *End-to-End* pada file dan mengunggahnya ke server storage WORM.
  5. File muncul dalam gelembung pesan chat dengan label khusus berwarna emas: **"PRIVILEGED LEGAL EVIDENCE - CONFIDENTIAL"**.
  6. Advokat mengklik lampiran tersebut. Server memverifikasi token E2EE advokat dan mengizinkan pembacaan dokumen di dalam *secure PDF viewer* aplikasi tanpa meninggalkan jejak *file temporary* di memori lokal advokat.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **2a. Ukuran Berkas Melebihi Batas Maksimal 25 MB**:
    1. Klien mencoba mengunggah berkas salinan putusan pengadilan setebal 100 halaman (ukuran 40 MB).
    2. Sistem menolak unggahan dan menampilkan pesan: *"Ukuran berkas melebihi batas maksimal 25 MB per file"*.
    3. Sistem menyediakan alat **Kompresi PDF Aman Internal** di dalam aplikasi, atau menyarankan klien untuk memecah dokumen menjadi 2 bagian sebelum mengunggah kembali.
  * **3a. Terdeteksi File Berbahaya / Malware oleh Scanner**:
    1. Pemindaian keamanan mendeteksi adanya skrip mencurigakan atau *macro* berbahaya pada file DOCX yang diunggah.
    2. Sistem memblokir pengiriman file secara mutlak dan memunculkan peringatan keamanan: *"File ditolak karena terdeteksi mengandung potensi risiko keamanan virus/malware. Harap simpan dokumen dalam format PDF bersih sebelum mengunggah"*.

---

### Huk-UC02: Membuat Draf Dokumen Hukum (Domain Hukum)
* **Aktor Utama**: Advokat Mitra
* **Aktor Pendukung**: Klien, Sistem Integrasi Eksternal (API e-Meterai Peruri)
* **Deskripsi Singkat**: Advokat meracik draf dokumen hukum tertulis (seperti Somasi, Surat Kuasa Khusus, Perjanjian Kerja Sama, atau Gugatan) menggunakan *Template Engine* pintar, dibubuhi e-Meterai resmi Peruri Rp 10.000, dan dikirimkan ke klien (*Extend* dari UC-12).
* **Pre-condition**: Advokat sedang melayani sesi konsultasi hukum (UC-10) atau mengerjakan pesanan *Legal Drafting* klien.
* **Post-condition**: Dokumen hukum final ber-e-Meterai dan ber-stempel *Privilege* terbit, tersimpan di WORM storage dengan masa retensi 10 tahun, dan tersedia untuk diunduh klien setelah verifikasi pembayaran.
* **Compliance Checklist & Regulasi Domain**:
  * **UU No. 18 Tahun 2003 (Legal Drafting Privilege)**: Dokumen hasil rancangan advokat merupakan produk hukum rahasia yang dilindungi undang-undang.
  * **UU No. 10 Tahun 2020 tentang Bea Meterai**: Untuk memberikan kekuatan pembuktian sempurna di pengadilan perdata, dokumen kontrak atau surat kuasa **wajib** dibubuhi **e-Meterai resmi Rp 10.000** melalui integrasi langsung dengan server Perum Peruri.
  * **Version Control & 10-Year Retention Rule**: Sistem **wajib** menyimpan rekam jejak revisi dokumen (*Version Control*: v1, v2, ... vFinal) dan memberlakukan masa retensi minimum **10 tahun (*Legal Hold*)** di storage WORM tanpa opsi penghapusan sepihak.
* **Alur Utama (Basic Flow)**:
  1. Advokat membuka menu "Legal Drafting & Template Engine" di layar ruang obrolan atau Dasbor Mitra.
  2. Sistem me-render katalog *Template Hukum Baku* yang telah divalidasi tim legal JUSTIFICA (kategori: Hukum Perdata, Bisnis, Ketenagakerjaan, Pertanahan, dan Pidana).
  3. Advokat memilih template yang relevan (misal: *"Template Surat Kuasa Khusus Perdata"*).
  4. Sistem membuka *Formulir Variabel Template*. Advokat menginput variabel spesifik kasus: Nama Pihak Pemberi & Penerima Kuasa, NIK, NPWP, Nomor Akta, Pasal Rujukan, Nominal Gugatan, dan Klausul Tambahan.
  5. Advokat mengklik "Generate Draf v1 (Preview)". Sistem me-render file PDF draf awal ber-watermark *"DRAFT FOR REVIEW"*.
  6. Advokat membagikan preview v1 ke chat room untuk direview oleh klien. Jika klien meminta revisi, advokat mengubah variabel dan men-generate draf v2 (menyimpan riwayat v1 di sistem *Version Control*).
  7. Setelah klien menyetujui isi draf, advokat mengklik tombol **"Finalisasi Dokumen & Bubuhkan e-Meterai"**.
  8. Sistem memanggil API Peruri, menempelkan e-Meterai Rp 10.000 pada koordinat tanda tangan di PDF, dan membubuhkan stempel merah *"PRIVILEGED AND CONFIDENTIAL - LEGAL HOLD ACTIVE"*.
  9. Advokat menandatangani dokumen secara digital menggunakan sertifikat elektronik.
  10. Sistem menyimpan dokumen final di WORM storage (retensi 10 tahun) dan mengirimkan berkas ke chat klien dilengkapi **Download Gate** (klien baru dapat mengunduh PDF bersih setelah tiket pembayaran biaya draf hukum berstatus `PAID`).
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Variabel NIK / NPWP Klien Tidak Valid saat Cross-Check**:
    1. Sistem memvalidasi format NIK (16 digit) dan NPWP (15/16 digit) yang dimasukkan advokat ke dalam form variabel.
    2. Jika ditemukan kejanggalan format, sistem menolak render PDF dan mengingatkan advokat: *"Format NIK/NPWP Pihak Pertama tidak valid. Sesuai standar akta hukum, pastikan nomor identitas tepat 16 digit angka"*.
  * **8a. Kegagalan API e-Meterai Peruri (Peruri Server Maintenance)**:
    1. Panggilan API ke server Peruri mengalami *timeout* atau mengembalikan status *maintenance*.
    2. Sistem tidak membatalkan dokumen, melainkan menyimpannya dalam antrean **Pending Stamping WORM** dengan keterangan: *"Dokumen final telah disetujui. Pembubuhan e-Meterai tertunda karena pemeliharaan sistem Peruri dan akan diproses otomatis oleh Cron Job dalam waktu maksimal 24 jam"*.
    3. Advokat dapat menerbitkan salinan sementara ber-tanda tangan digital dengan catatan *"e-Meterai dalam proses verifikasi sistem"*.

---

### Huk-UC03: Melakukan Konsultasi Pro Bono (Domain Hukum)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Admin Sistem (Tim Compliance), Advokat Mitra Pro Bono
* **Deskripsi Singkat**: Klien dari kelompok masyarakat kurang mampu mengajukan layanan konsultasi hukum cuma-cuma (*Pro Bono*) dengan mengunggah Surat Keterangan Tidak Mampu (SKTM). Setelah diverifikasi Admin, sistem menanggung biaya 100% dan mencocokkan klien dengan advokat pro bono terdaftar.
* **Pre-condition**: Klien telah login, mengalami masalah hukum, dan memiliki berkas SKTM resmi dari kelurahan/desa setempat.
* **Post-condition**: Pengajuan SKTM disetujui Admin (`SKTM_APPROVED`), tiket konsultasi gratis terbit, kuota pro bono advokat berkurang 1, dan dana subsidi di-escrow platform hingga *Legal Aid Report* selesai.
* **Compliance Checklist & Regulasi Domain**:
  * **UU No. 18 Tahun 2003 Pasal 22 (Kewajiban Pro Bono Advokat)**: Setiap Advokat wajib memberikan bantuan hukum cuma-cuma kepada pencari keadilan yang tidak mampu. Platform memfasilitasi kewajiban ini dengan sistem manajemen kuota (maksimal 3 kasus pro bono per bulan per advokat agar kualitas layanan tetap maksimal).
  * **Cross-Check Verifikasi SKTM (Dukcapil & DTKS Kemensos)**: Untuk mencegah penyalahgunaan layanan gratis oleh pihak mampu (*Free-rider fraud*), berkas SKTM klien **wajib** diverifikasi silang ke Data Terpadu Kesejahteraan Sosial (DTKS) oleh Admin Sistem (UC-13).
  * **Escrow & Legal Aid Reporting System**: Platform menyediakan dana subsidi silang/operasional yang di-escrow. Dana dan sertifikat kredit pro bono baru dilepaskan ke advokat setelah sesi selesai dan advokat menyerahkan Laporan Bantuan Hukum (*Legal Aid Report*) kepada sistem WORM platform untuk dilaporkan ke Kemenkumham / organisasi advokat.
* **Alur Utama (Basic Flow)**:
  1. Klien memilih menu "Bantuan Hukum Cuma-Cuma (*Pro Bono*)" di beranda layanan hukum.
  2. Sistem menampilkan syarat & ketentuan layanan Pro Bono dan merender formulir pengajuan.
  3. Klien mengisi deskripsi singkat kasus hukum yang dihadapi dan mengunggah foto/scan berkas SKTM resmi dari kantor kelurahan/desa.
  4. Klien mengklik tombol "Ajukan Pro Bono".
  5. Sistem menyimpan pengajuan dengan status `PENDING_SKTM` dan mengirimkan tiket antrean prioritas ke panel Verifikasi Admin Sistem (UC-13).
  6. **Verifikasi Admin (UC-13)**: Admin memverifikasi keabsahan SKTM dan mencocokkan NIK klien ke database DTKS Kemensos. Setelah terbukti valid, Admin mengklik "Setujui SKTM".
  7. Sistem mengubah status pengajuan menjadi `SKTM_APPROVED`, menerbitkan tiket konsultasi bernominal **Rp 0 (Subsidi Pro Bono 100%)**, dan mengirimkan notifikasi persetujuan ke klien.
  8. **Pencocokan Advokat**: Klien diarahkan ke direktori Advokat Pro Bono. Sistem memuat daftar advokat yang kuota pro bono bulanan-nya masih tersedia (< 3 kasus/bulan).
  9. Klien memilih satu advokat. Sistem memvalidasi kuota, mengurangi kuota pro bono advokat tersebut (*sisa kuota - 1*), dan mengunci dana subsidi di rekening *Escrow Platform*.
  10. Sesi konsultasi obrolan real-time berlangsung (UC-04). Advokat memberikan nasihat hukum secara profesional tanpa diskriminasi kualitas.
  11. **Pasca-Sesi**: Setelah konsultasi selesai, Advokat mengisi formulir singkat *Legal Aid Report* (Ringkasan Kasus & Nasihat yang Diberikan). Sistem memverifikasi laporan, mencatat sertifikat jam pengabdian pro bono ke profil advokat, dan melepas dana escrow operasional ke dompet advokat (UC-17).
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **6a. Admin Menolak Berkas SKTM (NIK Tidak Terdaftar di DTKS / SKTM Palsu)**:
    1. Hasil cross-check Admin di modul UC-13 menunjukkan bahwa NIK klien tergolong masyarakat mampu di database nasional, atau surat SKTM tidak memiliki nomor registrasi kelurahan yang sah.
    2. Admin mengklik "Tolak SKTM" dengan alasan: *"Data NIK tidak terdaftar dalam Data Terpadu Kesejahteraan Sosial (DTKS) / SKTM tidak terverifikasi"*.
    3. Sistem mengubah status menjadi `SKTM_REJECTED`, mengirimkan email penolakan, dan memberikan opsi kepada klien: *"Unggah ulang SKTM yang valid dalam 3x24 jam"* ATAU *"Beralih ke konsultasi hukum reguler berbayar dengan tarif normal (UC-03)"*.
  * **8a. Kuota Advokat Pro Bono Pilihan Klien Sudah Penuh (>= 3 Kasus/Bulan)**:
    1. Advokat yang dipilih klien ternyata baru saja mencapai batas maksimal 3 kasus pro bono pada bulan berjalan.
    2. Sistem menampilkan pesan: *"Advokat ini telah memenuhi batas kuota pengabdian Pro Bono bulan ini untuk menjaga kualitas pelayanan"*.
    3. Sistem secara otomatis merekomendasikan 3 Advokat Pro Bono lain di spesialisasi yang sama yang kuotanya masih tersedia, atau menawarkan antrean prioritas untuk bulan berikutnya.
