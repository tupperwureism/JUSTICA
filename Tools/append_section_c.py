"""
Script to append Section C (Aktor Admin Sistem: UC-13, UC-14, UC-15, UC-16)
to unified_use_case_scenarios.md.
"""

TARGET_FILE = r'd:\justificadll\MarkDown\unified_use_case_scenarios.md'

SECTION_C = """
---

## C. Aktor: Admin Sistem (System Admin)

### UC-13: Memverifikasi Berkas Kredensial Mitra & SKTM Pro Bono
* **Aktor Utama**: Admin Sistem (Tim Compliance & Legal)
* **Aktor Pendukung**: Sistem Integrasi Eksternal (API Konsil Kedokteran KKI/KTKI, API HIMPSI, API Peradi, API Dukcapil & DTKS Kemensos)
* **Deskripsi Singkat**: Admin Sistem melakukan verifikasi silang (*cross-check*) terhadap keabsahan dokumen lisensi profesi calon mitra profesional baru (STR/SIP/KTA/SIPP) serta dokumen Surat Keterangan Tidak Mampu (SKTM) dari klien pengaju bantuan hukum gratis (*Pro Bono*).
* **Pre-condition**: Terdapat antrean verifikasi berkas lisensi mitra (`PENDING_VERIFICATION`, UC-07) atau antrean pengajuan SKTM Pro Bono dari klien (`PENDING_SKTM`, Huk-UC03).
* **Post-condition**: Status verifikasi berubah menjadi aktif/disetujui (`ACTIVE` / `SKTM_APPROVED`) atau ditolak (`REJECTED` / `SKTM_REJECTED`) di database, dan log keputusan tercatat dalam audit trail WORM.
* **Compliance Checklist & Regulasi Domain**:
  * **UU No. 17 Tahun 2023 (Kesehatan)**: Verifikasi keaslian STR dokter **wajib** dilakukan dengan mencocokkan nomor STR dan NIK secara langsung ke database Konsil Kedokteran Indonesia (KKI) / KTKI melalui gerbang API nasional.
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
* **Aktor Pendukung**: Tim Etik Multidisiplin (Dokter Senior, Psikolog Senior, Advokat Senior), Badan Profesi Nasional (Konsil Kedokteran KKI, HIMPSI, Peradi)
* **Deskripsi Singkat**: Admin Sistem menangani laporan malpraktik, pelanggaran kode etik, atau kelalaian berat yang dilakukan oleh Mitra Profesional melalui **Ethics Committee Flow** (Sidang Etik Multidisiplin), memverifikasi sanksi penangguhan (`SUSPENDED`), dan melaporkan pelanggaran etik ke organisasi profesi nasional.
* **Pre-condition**: Terdapat laporan pelanggaran etik berat dari klien (merujuk ke UC-06 *Adverse Event* atau laporan langsung), atau terdeteksi kelalaian medis/hukum fatal.
* **Post-condition**: Akun mitra profesional ditangguhkan permanen (`SUSPENDED`), di-blacklist dari platform, dan laporan resmi dikirimkan ke Badan Profesi (KKI/HIMPSI/Peradi) untuk tindakan pencabutan lisensi praktik nasional.
* **Compliance Checklist & Regulasi Domain**:
  * **Ethics Committee Flow (Sidang Etik Multidisiplin)**: Platform JUSTIFICA dilarang memecat atau men-suspend permanen seorang tenaga ahli (Dokter/Advokat/Psikolog) hanya atas putusan sepihak Admin awam. Sistem **wajib** memfasilitasi pembentukan **Tim Etik Multidisiplin** yang terdiri dari: 1 orang Dokter Senior (untuk kasus medis), 1 orang Psikolog Senior (untuk kasus psikologi), 1 orang Advokat Senior (untuk kasus hukum), dan 1 orang Admin Compliance Platform.
  * **Mandatory Hearing & Due Process**: Mitra profesional yang tertuduh **wajib** diberikan hak untuk membela diri dalam sidang etik formal (*Ethics Hearing*) sebelum putusan penangguhan dijatuhkan.
  * **Mandatory Professional Body Reporting**: Sesuai UU No. 17/2023 (Kesehatan), Kode Etik HIMPSI, dan UU No. 18/2003 (Advokat), jika putusan sidang etik menemukan bukti sah malpraktik klinis atau pelanggaran berat hukum, platform **wajib secara hukum** menerbitkan laporan resmi beserta bukti WORM ke Badan Profesi terkait (KKI/KTKI, HIMPSI, atau Peradi) agar izin praktik nasional mitra dapat ditinjau atau dicabut.
  * **WORM Audit Preservation**: Seluruh berkas pembuktian, transkrip sidang hearing, dan putusan etik disimpan permanen dalam WORM storage yang tidak dapat dihapus atau diubah sampai kapan pun.
* **Alur Utama (Basic Flow)**:
  1. Admin Compliance menerima tiket insiden prioritas tinggi dari modul *Adverse Event Reporting* klien (UC-06) atau laporan malpraktik.
  2. Admin membuka modul "Manajemen Akun Mitra & Kasus Etik" dan memeriksa bukti pendukung awal.
  3. Jika laporan terbukti memiliki dasar klinis/hukum yang serius, Admin mengklik tombol **"Inisiasi Ethics Committee Flow"**.
  4. Sistem menonaktifkan sementara status ketersediaan mitra menjadi `OFFLINE` (*Pre-hearing Suspension*) agar mitra tidak menerima klien baru selama investigasi berlangsung.
  5. Sistem membentuk panel **Tim Etik Multidisiplin** di database dengan mengundang anggota komite yang sebidang dengan domain mitra tertuduh (misal: Dokter Spesialis Senior untuk mengadili Dokter).
  6. Sistem men-generate surat panggilan sidang etik (*Ethics Hearing Invitation*) dan menjadwalkan pertemuan virtual dalam waktu maksimal 7 hari kerja, lalu mengirimkan undangan ke email mitra profesional.
  7. **Pelaksanaan Hearing Etik**: Tim Etik Multidisiplin dan Mitra Profesional melangsungkan sidang pembelaan. Tim Etik memeriksa bukti rekam medis/hukum terenkripsi di WORM storage.
  8. Setelah hearing selesai, Ketua Tim Etik menginput **Putusan Etik Resmi** ke dalam sistem:
     * **Jika Putusan = Terbukti Melanggar Berat (Malpraktik / Pelanggaran Kode Etik Fatal)**:
       * Admin Compliance mengonfirmasi putusan di dasbor.
       * Sistem mengubah status akun mitra menjadi `SUSPENDED` (Permanen), mencabut seluruh hak akses dasbor profesional, dan membatalkan jadwal konsultasi mendatang dengan pengembalian dana 100% ke klien.
       * Sistem secara otomatis men-generate **Laporan Resmi Pelanggaran Etik Profesi** ber-tanda tangan digital dan mengirimkan berkas laporan beserta lampiran bukti WORM melalui API / Email Resmi ke **Badan Profesi Nasional** (Konsil Kedokteran KKI / HIMPSI / Peradi).
       * Sistem mencatat putusan akhir ke dalam WORM storage permanen dan memblokir identitas NIK/STR mitra dari platform JUSTIFICA selamanya.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **8a. Putusan Tim Etik = Tidak Terbukti Melanggar / Dibebaskan (*Not Guilty*)**:
    1. Tim Etik Multidisiplin menyimpulkan bahwa keluhan klien tidak beralasan (misal: efek samping obat normal yang sudah dijelaskan dalam *Informed Consent*, bukan kelalaian dokter).
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
    * **Domain Kesehatan Medis**: **15% Platform / 85% Mitra Dokter** (Mengimbangi biaya operasional tinggi dan risiko klinis medis).
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
"""

with open(TARGET_FILE, 'a', encoding='utf-8') as f:
    f.write(SECTION_C)

print("Appended Section C successfully.")
