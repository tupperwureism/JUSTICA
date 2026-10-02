"""
Script to append Section D (Skenario Spesifik Domain: Kes-UC01 to Huk-UC03)
to unified_use_case_scenarios.md.
"""

TARGET_FILE = r'd:\justificadll\MarkDown\unified_use_case_scenarios.md'

SECTION_D = """
---

## D. Skenario Spesifik Domain (Kesehatan, Psikologi, Hukum)

### Kes-UC01: Menebus Resep & Membeli Obat (Domain Kesehatan)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Apotek Mitra / Kurir Pengiriman
* **Deskripsi Singkat**: Klien menebus e-Resep medis tersertifikasi yang diterbitkan oleh dokter (UC-12) ke Sistem Informasi Apotek (SIA) mitra terdekat, lengkap dengan verifikasi obat keras dan pelacakan pengiriman.
* **Pre-condition**: Klien telah menyelesaikan konsultasi medis dan memiliki e-Resep aktif yang terlampir di riwayat rekam medis (Kes-UC03).
* **Post-condition**: Pesanan obat diverifikasi oleh apoteker SIA, dibayar, dan dalam proses pengiriman kurir menuju alamat klien.
* **Compliance Checklist & Regulasi Domain**:
  * **Permenkes 73/2016 (Standar Pelayanan Farmasi di Apotek)**: Penyerahan obat wajib dilakukan oleh Apoteker bersertifikat. Apoteker di SIA mitra **wajib** melakukan telaah resep (kepatuhan dosis dan interaksi obat DDI).
  * **Controlled Drugs Workflow (Narkotika/Psikotropika)**: Jika e-Resep mengandung obat golongan Narkotika atau Psikotropika keras, sistem memicu protokol pengawasan ketat: e-Resep 3 rangkap digital diverifikasi, apotek wajib merekam nomor KTP penerima saat pengiriman, dan log transaksi otomatis diteruskan ke gerbang pelaporan BPOM/BNN.
* **Alur Utama (Basic Flow)**:
  1. Klien membuka menu "Resep & Apotek" dari Dasbor Klien atau riwayat sesi medis.
  2. Sistem menampilkan daftar obat yang diresepkan oleh dokter beserta keterangan dosis dan cara pakainya.
  3. Klien mengklik tombol "Tebus Resep Sekarang".
  4. Sistem melakukan pemetaan geolocation, mencari Apotek Mitra terintegrasi SIA dalam radius terdekat (< 10 km) yang memiliki stok obat lengkap.
  5. Sistem me-render rincian pesanan: Nama Apotek, Harga Obat, Biaya Pengiriman Kurir Medis Khusus, dan perkiraan waktu tiba.
  6. Klien mengkonfirmasi alamat pengiriman dan memilih metode pembayaran (UC-05).
  7. Setelah pembayaran `PAID`, sistem mentransmisikan e-Resep tersertifikasi ke sistem SIA Apotek Mitra.
  8. Apoteker di SIA menerima resep, melakukan telaah akhir, dan menyiapkan kemasan obat yang disegel anti-rusak (*tamper-evident seal*).
  9. Apotek menyerahkan obat kepada Kurir Medis terverifikasi.
  10. Sistem menampilkan peta pelacakan kurir (*Live Tracking*) di layar dasbor klien hingga obat diterima.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Stok Obat Tidak Tersedia di Apotek Terdekat**:
    1. Sistem mendeteksi bahwa apotek terdekat mengalami kekosongan stok untuk salah satu obat dalam resep.
    2. Sistem memperluas pencarian ke radius 20 km atau memecah pesanan dari 2 Apotek Mitra berbeda tanpa membebankan biaya kurir tambahan kepada klien.
    3. Jika stok di seluruh kota kosong, sistem menampilkan opsi: *"Pesan pre-order (dikirim besok pagi)"* atau *"Ajukan permintaan alternatif obat sejenis ke Dokter peresep"*.
  * **7a. e-Resep Mengandung Obat Controlled Drug (Narkotika)**:
    1. Sistem mendeteksi flag *Controlled Drug* pada e-Resep.
    2. Sistem mengharuskan klien mengunggah foto KTP fisik penerima obat pada saat checkout.
    3. Kurir Medis yang mengantar diwajibkan meminta tanda tangan digital dan memverifikasi kecocokan wajah/KTP penerima di lokasi pengantaran sebelum obat diserahkan.

---

### Kes-UC02: Membuat Janji Temu RS Offline (Domain Kesehatan)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Faskes (Rumah Sakit / Klinik Mitra)
* **Deskripsi Singkat**: Klien melakukan reservasi jadwal konsultasi fisik tatap muka (*offline appointment*) dengan dokter spesialis di rumah sakit atau klinik mitra terintegrasi.
* **Pre-condition**: Klien sudah login ke platform JUSTIFICA.
* **Post-condition**: Janji temu terkonfirmasi di kalender SIRS Rumah Sakit, kode booking diterbitkan, dan jadwal masuk ke pengingat klien.
* **Compliance Checklist & Regulasi Domain**:
  * **API SIRS Integration**: Sinkronisasi jadwal secara *real-time* dengan Sistem Informasi Rumah Sakit (SIRS) untuk menghindari over-booking kuota dokter spesialis.
  * **BPJS Kesehatan Rujukan Sync**: Bagi pasien peserta BPJS, sistem memverifikasi nomor rujukan dari Faskes Tingkat 1 sebelum mengizinkan pemesanan jadwal poli spesialis RS secara gratis.
* **Alur Utama (Basic Flow)**:
  1. Klien memilih menu "Janji Temu RS Offline" di halaman layanan kesehatan.
  2. Klien memilih kota/lokasi, jenis Faskes (RS Umum / Klinik Spesialis), dan poli yang dituju.
  3. Sistem menampilkan daftar Rumah Sakit Mitra beserta jadwal praktik dokter spesialis yang tersedia.
  4. Klien mengklik dokter pilihan dan memilih tanggal serta jam sesi konsultasi offline.
  5. Jika klien menggunakan asuransi/BPJS, klien memasukkan nomor kartu BPJS atau surat rujukan. Sistem memverifikasi keabsahan rujukan via API BPJS.
  6. Klien mengkonfirmasi pemesanan janji temu.
  7. Sistem mengirimkan *payload booking* ke API SIRS Rumah Sakit. SIRS RS mengunci kuota antrean dan membalas dengan **Kode Booking / Tiket Antrean Poli**.
  8. Sistem menerbitkan e-Tiket Janji Temu ber-barcode di dasbor klien dan mengatur pengingat otomatis H-1 dan H-2 jam sebelum jadwal.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **7a. Kuota Dokter di RS Sudah Penuh pada Jam Terpilih**:
    1. API SIRS RS menolak *payload* karena kuota antrean poli baru saja penuh.
    2. Sistem menampilkan pesan: *"Maaf, kuota antrean untuk jam tersebut baru saja penuh"*.
    3. Sistem merekomendasikan jam berikutnya di hari yang sama atau dokter spesialis lain di RS tersebut.
  * **7b. Dokter Mendadak Batal Praktik (Jadwal Operasi / Halangan RS)**:
    1. H-1 sebelum jadwal, SIRS RS mengirim *webhook* pemberitahuan pembatalan jadwal dokter ke sistem JUSTIFICA.
    2. Sistem segera mengirimkan SMS/WhatsApp darurat ke klien dan memberikan opsi: *"Jadwal ulang ke hari berikutnya secara gratis"* ATAU *"Alihkan ke konsultasi online (tele-konsultasi) sekarang dengan diskon kompensasi"*.

---

### Kes-UC03: Melihat Rekam Medis & Family Care (Domain Kesehatan)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Klien mengakses riwayat Rekam Medis Elektronik (EME) miliknya atau mengelola riwayat medis anggota keluarga terdaftar (*Family Care*) secara aman dan *Read-Only*.
* **Pre-condition**: Klien telah login dan berhasil melewati verifikasi keamanan sekunder (PIN/MFA Klien).
* **Post-condition**: Klien melihat riwayat diagnosis ICD-10, SOAP Note, resep obat, dan riwayat alergi yang tersimpan di storage WORM.
* **Compliance Checklist & Regulasi Domain**:
  * **Permenkes 24/2022 (Hak Pasien & Keamanan EME)**: Pasien berhak atas akses penuh terhadap isi rekam medisnya. Akses **wajib** dilindungi enkripsi TLS dan pembatas otorisasi ketat agar tidak bocor ke pihak yang tidak berhak.
  * **UU PDP No. 27/2022 (Family Care Consent)**: Klien dapat menambahkan anggota keluarga (anak di bawah umur atau orang tua usia lanjut) di fitur *Family Care*. Untuk anggota keluarga dewasa (suami/istri/anak dewasa), sistem **wajib** meminta persetujuan perwalian digital (*Digital Guardianship Consent*) sebelum rekam medis mereka dapat dilihat oleh klien pengelola akun.
* **Alur Utama (Basic Flow)**:
  1. Klien mengklik menu "Rekam Medis & Family Care" di Dasbor Klien.
  2. Sistem memunculkan layar verifikasi PIN Rahasia Rekam Medis atau biometrik (Fingerprint/FaceID).
  3. Klien memasukkan PIN yang benar.
  4. Sistem me-render daftar profil pasien: **Profil Diri Sendiri** dan daftar profil **Family Care** yang terikat.
  5. Klien memilih salah satu profil (misal: Profil Anak).
  6. Sistem mengambil riwayat rekam medis dari database WORM secara *Read-Only* dan menampilkannya dalam urutan kronologis terbalik: Tanggal Sesi, Nama Dokter, Faskes, Diagnosis ICD-10, SOAP Note ringkas, Daftar Obat, dan Catatan Alergi.
  7. Klien dapat mengklik tombol "Unduh Ringkasan Medis (PDF)" untuk dicetak atau dibawa ke rumah sakit fisik.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Salah Masukkan PIN Rekam Medis 3 Kali Berturut-turut**:
    1. Klien memasukkan PIN yang salah sebanyak 3 kali.
    2. Sistem mengunci menu Rekam Medis selama 1 jam demi pengamanan data privasi medis.
    3. Sistem mengirimkan email peringatan keamanan: *"Terdeteksi percobaan akses PIN Rekam Medis yang gagal pada akun Anda"*.
  * **5a. Mengakses Profil Family Care Dewasa Tanpa Consent Perwalian**:
    1. Klien mencoba mengklik profil anggota keluarga dewasa yang belum memberikan persetujuan perwalian di akun mereka.
    2. Sistem menolak pembukaan data medis dan memunculkan pop-up: *"Akses Ditolak. Sesuai UU PDP No. 27/2022, anggota keluarga dewasa harus menyetujui permintaan tautan perwalian di akun JUSTIFICA mereka sebelum rekam medis dapat dibagikan"*.

---

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
     * *Subskala Depression*: $\text{Sum}(Q_3, Q_5, Q_{10}, Q_{13}, Q_{16}, Q_{17}, Q_{21}) \times 2$
     * *Subskala Anxiety*: $\text{Sum}(Q_2, Q_4, Q_7, Q_9, Q_{15}, Q_{19}, Q_{20}) \times 2$
     * *Subskala Stress*: $\text{Sum}(Q_1, Q_6, Q_8, Q_{11}, Q_{12}, Q_{14}, Q_{18}) \times 2$
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
"""

with open(TARGET_FILE, 'a', encoding='utf-8') as f:
    f.write(SECTION_D)

print("Appended Section D successfully.")
