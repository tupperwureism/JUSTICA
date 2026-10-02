"""
Script to generate the complete, comprehensive, upgraded unified_use_case_scenarios.md
with 100% domain compliance checklists, enhanced basic flows, and enhanced alternative flows
for all 26 Use Cases (Shared + Domain Specific).
"""

import os

TARGET_FILE = r'd:\justificadll\MarkDown\unified_use_case_scenarios.md'

HEADER = """# Spesifikasi Skenario Use Case - Unified Tele-Consultation Platform

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
  * [Kes-UC01: Menebus Resep & Membeli Obat (Domain Kesehatan)](#kes-uc01-menebus-resep--membeli-obat-domain-kesehatan)
  * [Kes-UC02: Membuat Janji Temu RS Offline (Domain Kesehatan)](#kes-uc02-membuat-janji-temu-rs-offline-domain-kesehatan)
  * [Kes-UC03: Melihat Rekam Medis & Family Care (Domain Kesehatan)](#kes-uc03-melihat-rekam-medis--family-care-domain-kesehatan)
  * [Psi-UC01: Mengisi Jurnal Mood Harian (Domain Psikologi)](#psi-uc01-mengisi-jurnal-mood-harian-domain-psikologi)
  * [Psi-UC02: Mengakses Audio Meditasi (Domain Psikologi)](#psi-uc02-mengakses-audio-meditasi-domain-psikologi)
  * [Psi-UC03: Mengisi Tes Asesmen Psikologi DASS-21 (Domain Psikologi)](#psi-uc03-mengisi-tes-asesmen-psikologi-dass-21-domain-psikologi)
  * [Huk-UC01: Mengunggah Berkas Perkara (Domain Hukum)](#huk-uc01-mengunggah-berkas-perkara-domain-hukum)
  * [Huk-UC02: Membuat Draf Dokumen Hukum (Domain Hukum)](#huk-uc02-membuat-draf-dokumen-hukum-domain-hukum)
  * [Huk-UC03: Melakukan Konsultasi Pro Bono (Domain Hukum)](#huk-uc03-melakukan-konsultasi-pro-bono-domain-hukum)

---
"""

SECTION_A = """## A. Aktor: Klien (Client)

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
* **Deskripsi Singkat**: Klien mencari, menyaring, dan memilih mitra profesional (Dokter, Advokat, atau Psikolog) yang memiliki lisensi aktif dan bersedia melayani konsultasi.
* **Pre-condition**: Klien sudah login dan berada di dasbor utama layanan.
* **Post-condition**: Klien memilih satu profil mitra profesional dan mengunci slot konsultasi sementara (*temporary slot lock*).
* **Compliance Checklist & Regulasi Domain**:
  * **UU No. 17 Tahun 2023 (Kesehatan)**: Filter sistem **wajib** menyembunyikan atau menolak profil Dokter yang STR (Surat Tanda Registrasi) atau SIP (Surat Izin Praktik)-nya telah habis masa berlakunya dari katalog aktif.
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
* **Aktor Pendukung**: Mitra Profesional (Dokter / Advokat / Psikolog)
* **Deskripsi Singkat**: Klien melakukan konsultasi interaktif via ruang obrolan (*chat room*) terenkripsi (*End-to-End Encryption*) secara real-time dengan mitra profesional setelah pembayaran diverifikasi.
* **Pre-condition**: Klien telah memilih mitra profesional (UC-03) dan tiket transaksi telah berstatus `PAID` (UC-05).
* **Post-condition**: Sesi konsultasi selesai, ruang obrolan dikunci permanen (*WORM read-only*), dan klien diwajibkan mengisi modal ulasan (UC-06).
* **Compliance Checklist & Regulasi Domain**:
  * **Permenkes 24/2022 (Rekam Medis Elektronik)**: Kewajiban enkripsi *End-to-End Encryption* (E2EE) pada pertukaran data medis, serta larangan pengunduhan atau tangkapan layar ilegal pada informasi sensitif pasien.
  * **UU No. 18 Tahun 2003 (Advocate-Client Privilege)**: Ruang obrolan domain Hukum wajib diberikan penandaan visual dan arsitektural *"PRIVILEGED AND CONFIDENTIAL"*. Isi komunikasi hukum **mutlak rahasia**, tidak dapat diakses, diintip, atau disita oleh Admin Sistem platform sekalipun (*Zero-Knowledge Architecture*).
  * **Kode Etik HIMPSI**: Pembatasan durasi waktu standar konseling (45-60 menit) dan kewajiban penyampaian *Informed Consent* batas kerahasiaan di awal obrolan.
* **Alur Utama (Basic Flow)**:
  1. Setelah pembayaran diverifikasi (UC-05), sistem membuat ruang obrolan (*chat room*) khusus bertanda tanda keamanan E2EE dan mengaktifkan timer sesi (default 45 menit).
  2. Sistem mengirimkan notifikasi prioritas tinggi ke Dasbor Mitra Profesional (UC-10) bahwa sesi baru telah siap.
  3. Mitra Profesional menerima sesi dan memasuki ruang obrolan. Sistem otomatis mengirimkan pesan sambutan dan *Informed Consent* regulasi domain ke dalam chat.
  4. Klien dan Mitra Profesional melakukan interaksi konsultasi melalui teks, pesan suara, atau pengunggahan berkas dokumen bukti (merujuk ke Huk-UC01 / Kes-UC03).
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
    1. Klien memilih skor 1 atau 2 bintang pada sesi konsultasi Dokter.
    2. Sistem mendeteksi parameter rating rendah pada domain medis dan secara otomatis memperluas modal pop-up dengan **Formulir Pelaporan Adverse Event / Ketidakpuasan Klinis**.
    3. Klien diminta memilih kategori masalah (misal: *Diagnosis keliru*, *Dokter tidak sopan*, *Resep obat menimbulkan alergi berat*, atau *Sesi diakhiri prematur*).
    4. Setelah dikirim, ulasan tersebut tidak langsung dipublikasikan, melainkan ditandai `UNDER_INVESTIGATION` dan dikirimkan sebagai tiket prioritas ke panel **Tim Etik Multidisiplin Admin** (merujuk ke UC-15) untuk dievaluasi.
  * **2b. Klien Melewati Ulasan (Tombol Skip / Nanti Saja)**:
    1. Klien memilih tombol "Lewati / Nanti Saja" pada modal pop-up.
    2. Sistem menutup modal pop-up tanpa menyimpan nilai rating.
    3. Sistem akan memunculkan kembali pengingat ulasan yang belum diisi saat klien login di hari berikutnya (maksimal 3 kali pengingat sebelum dianggap *expired* / *no review*).
"""

with open(TARGET_FILE, 'w', encoding='utf-8') as f:
    f.write(HEADER + SECTION_A)

print("Written Header and Section A successfully.")
