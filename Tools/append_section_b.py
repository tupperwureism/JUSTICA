"""
Script to append Section B (Aktor Mitra Profesional: UC-07, UC-08, UC-09, UC-10, UC-11, UC-12, UC-17)
to unified_use_case_scenarios.md.
"""

TARGET_FILE = r'd:\justificadll\MarkDown\unified_use_case_scenarios.md'

SECTION_B = """
---

## B. Aktor: Mitra Profesional (Professional Partner)

### UC-07: Melakukan Registrasi Mitra Profesional
* **Aktor Utama**: Mitra Profesional (Dokter / Advokat / Psikolog)
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Calon mitra profesional mendaftarkan akun baru dan mengunggah dokumen kredensial spesifik domain (STR/SIP/KTA/SIPP) agar dapat diverifikasi oleh Admin Sistem.
* **Pre-condition**: Mitra profesional belum terdaftar di platform JUSTIFICA.
* **Post-condition**: Akun mitra profesional dibuat dengan status `PENDING_VERIFICATION`, dan dokumen terenkripsi tersimpan di storage WORM menunggu tinjauan Admin.
* **Compliance Checklist & Regulasi Domain**:
  * **UU No. 17 Tahun 2023 (Kesehatan)**: Kewajiban pengunggahan STR (Surat Tanda Registrasi) yang diterbitkan oleh Konsil Kedokteran Indonesia (KKI) / Konsil Tenaga Kesehatan Indonesia (KTKI), Surat Izin Praktik (SIP) aktif di Faskes, dan bukti kerja sama BPJS Provider (jika melayani rujukan BPJS).
  * **Kode Etik HIMPSI (Psikologi)**: Kewajiban pengunggahan Surat Izin Praktik Psikologi (SIPP) aktif yang dikeluarkan oleh HIMPSI serta bukti keanggotaan wilayah.
  * **UU No. 18 Tahun 2003 (Advokat)**: Kewajiban pengunggahan Kartu Tanda Anggota (KTA) Peradi aktif dan SK Pengacara / Berita Acara Sumpah dari Pengadilan Tinggi negeri.
  * **WORM Storage Security**: Seluruh dokumen kredensial disimpan pada *Write-Once-Read-Many (WORM) Storage* berenkripsi AES-256 untuk mencegah manipulasi pasca-unggah.
* **Alur Utama (Basic Flow)**:
  1. Calon Mitra Profesional membuka halaman "Registrasi Mitra Profesional" di portal JUSTIFICA.
  2. Calon mitra memilih domain profesinya (Kesehatan Medis, Hukum, atau Psikologi).
  3. Sistem me-render formulir registrasi spesifik sesuai domain yang dipilih.
  4. Mitra mengisi data identitas pribadi (Nama Lengkap, NIK, NPWP, Email, Nomor Telepon, Alamat Praktik/Kantor, dan Kata Sandi).
  5. Mitra mengunggah berkas kredensial berformat PDF atau JPG beresolusi tinggi (STR+SIP untuk Dokter; SIPP+KTA HIMPSI untuk Psikolog; KTA Peradi+Berita Acara Sumpah untuk Advokat).
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
  * **Domain Kesehatan (API RS/Faskes Sync)**: Sistem terintegrasi dengan Sistem Informasi Rumah Sakit (SIRS) Faskes tempat dokter praktik. Dokter tidak dapat mengaktifkan status *Online* tele-konsultasi jika kalender SIRS menunjukkan dokter sedang melakukan tindakan operasi atau praktik offline jam tersebut.
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
  3. Sistem menghubungkan mitra ke ruang obrolan (*chat room*) E2EE yang telah terbuka bersama klien (UC-04).
  4. Mitra menyapa klien, meninjau riwayat medis/hukum/psikologi yang diizinkan (merujuk ke Kes-UC03 / Huk-UC01), dan memberikan konsultasi interaktif.
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
  * **Permenkes 24/2022 & Standar SOAP Note (Medis)**: Dokter **wajib** mengisi format rekam medis SOAP (*Subjective, Objective, Assessment, Plan*) dan mencantumkan kode klasifikasi penyakit internasional **ICD-10** pada kolom diagnosis.
  * **Kode Etik HIMPSI & Standar DAP Note (Psikologi)**: Psikolog mengisi format DAP (*Data, Assessment, Plan*). Jika dalam asesmen ditemukan indikasi risiko tinggi melukai diri atau bunuh diri (*suicidal/self-harm*), sistem **wajib** memicu **Crisis Flag Protocol**.
  * **UU No. 18 Tahun 2003 & Standar IRAC (Hukum)**: Advokat mengisi format *Case Memo* atau metode IRAC (*Issue, Rule, Application, Conclusion*). Catatan hukum **wajib** dibubuhi stempel sistem *"PRIVILEGED AND CONFIDENTIAL"* dan diberlakukan masa retensi minimum 10 tahun (*Legal Hold*).
* **Alur Utama (Basic Flow)**:
  1. Mitra Profesional mengklik tab "Catatan Sesi" di panel kanan layar obrolan.
  2. Sistem me-render template catatan yang disesuaikan secara otomatis dengan domain mitra:
     * *[Medis]* Formulir SOAP Note + kolom pencarian kode ICD-10.
     * *[Psikologi]* Formulir DAP Note + indikator level risiko klinis (Low/Medium/High/Critical).
     * *[Hukum]* Formulir Case Memo / IRAC + opsi penandaan kerahasiaan (*Privilege Marking*).
  3. Mitra mengisi kolom analisis klinis atau opini hukum berdasarkan fakta yang dikumpulkan selama chat.
  4. *[Medis]* Dokter mengetikkan nama penyakit pada kolom diagnosis, sistem menampilkan *auto-complete* kode ICD-10, dan dokter memilih kode yang tepat.
  5. *[Psikologi]* Psikolog memilih level risiko klinis. Jika memilih *Low* atau *Medium*, alur berjalan normal.
  6. Mitra mengklik tombol "Simpan & Kunci Catatan".
  7. Sistem melakukan enkripsi *field-level* menggunakan kunci kriptografis spesifik domain, menyimpan catatan ke database WORM, dan menempelkan *timestamp* tidak terubah.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Kolom Wajib (Diagnosis ICD-10 / Assessment) Dikosongkan**:
    1. Dokter mencoba menyimpan SOAP Note tanpa memilih kode ICD-10 yang valid.
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
  * **Permenkes 73/2016 (Standar e-Resep Medis)**: e-Resep **wajib** melalui pengecekan interaksi obat (*Drug-Drug Interaction / DDI Check*) secara otomatis oleh sistem. Jika resep mengandung obat golongan Narkotika atau Psikotropika (*Controlled Drugs*), sistem **wajib** memeriksa SIP Narkotika dokter dan mencetak resep dalam format 3 rangkap digital (Apotek, Pasien, Arsip BPOM/BNN).
  * **Kode Etik HIMPSI (Lembar Tugas Psikologi)**: Pemberian tugas mandiri (*homework* seperti journaling atau mindfulness) harus dapat dihubungkan dengan grafik pemantauan *Mood Tracker* klien (Psi-UC01).
  * **UU No. 10 Tahun 2020 & UU 18/2003 (Legal Opinion & e-Meterai)**: Dokumen pendapat hukum tertulis (*Legal Opinion*) metode IRAC bernilai pembuktian tinggi **wajib** dibubuhi e-Meterai resmi Rp 10.000 via API Peruri serta cap *"PRIVILEGED AND CONFIDENTIAL"*.
* **Alur Utama (Basic Flow)**:
  1. Pada formulir catatan sesi (UC-11), Mitra mengklik tombol "Terbitkan Dokumen Output".
  2. Sistem menampilkan formulir khusus sesuai domain:
     * *[Medis]* Formulir e-Resep (Pencarian nama obat, dosis, frekuensi, aturan pakai, dan jumlah).
     * *[Psikologi]* Formulir Lembar Tugas / *Homework Sheet* (Instruksi latihan relaksasi, journaling, atau cognitive reframing).
     * *[Hukum]* Formulir Legal Opinion / Draf Kontrak Hukum metode IRAC.
  3. Mitra mengisi rincian dokumen yang dibutuhkan.
  4. *[Medis]* Dokter menambahkan daftar obat ke dalam resep. Sistem secara otomatis menjalankan modul **Drug-Drug Interaction (DDI) Checker** di latar belakang untuk menganalisis potensi bentrok antar obat. Jika aman (tidak ada interaksi *Major*), alur berlanjut.
  5. *[Hukum]* Advokat mengklik tombol "Finalisasi & Bubuhkan e-Meterai". Sistem memanggil API Peruri untuk menempelkan e-Meterai Rp 10.000 pada dokumen PDF Legal Opinion.
  6. Mitra melakukan penandatanganan digital menggunakan sertifikat elektronik / PIN rahasia mitra.
  7. Sistem men-generate dokumen PDF ber-hash SHA-256, menyimpannya di storage WORM, dan melampirkannya ke ruang obrolan klien serta riwayat catatan sesi.
  8. *[Medis]* Khusus e-Resep, sistem secara paralel mengirimkan salinan resep digital tersertifikasi ke Sistem Informasi Apotek (SIA) mitra terdekat (Kes-UC01).
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Terdeteksi Interaksi Obat Berbahaya (*Major DDI Detected*)**:
    1. Modul DDI Checker mendeteksi bahwa kombinasi obat yang dimasukkan dokter memiliki interaksi fatal atau kontraindikasi berat.
    2. Sistem memunculkan alarm merah pop-up di layar dokter: *"PERINGATAN BAHAYA: Kombinasi [Obat A] dan [Obat B] berpotensi menyebabkan [Efek Samping Fatal]. Apakah Anda ingin merevisi resep?"*.
    3. Dokter **wajib** merevisi resep dengan mengganti obat/dosis, ATAU melakukan *Override* dengan wajib mengetikkan alasan medis spesifik dalam kolom pertanggungjawaban klinis yang akan dicatat permanen dalam audit trail WORM.
  * **4b. Peresepan Obat Narkotika / Psikotropika (*Controlled Drugs*)**:
    1. Dokter memasukkan obat golongan Narkotika (misal: Fentanyl / Morfin) atau Psikotropika keras ke dalam e-Resep.
    2. Sistem memverifikasi apakah dokter memiliki izin/SIP khusus peresepan obat terlarang yang masih berlaku.
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
* **Pre-condition**: Mitra profesional sudah login, memiliki saldo pendapatan yang dapat dicairkan (*available balance* > Rp 50.000), dan rekening bank tujuan telah diverifikasi.
* **Post-condition**: Permintaan penarikan dana diproses, saldo berpindah ke status `PENDING` (*freeze*), dan dana ditransfer ke rekening bank mitra melalui *auto-disbursement* atau persetujuan manual Admin Finansial.
* **Compliance Checklist & Regulasi Domain**:
  * **Peraturan Dirjen Pajak (PPh 21 Compliance)**: Sistem secara otomatis mengalkulasi dan memotong Pajak Penghasilan (PPh 21) atas jasa tenaga ahli (Dokter/Advokat/Psikolog) berdasarkan persentase aturan perpajakan yang berlaku sebelum saldo bersih masuk ke dompet mitra.
  * **Standar Verifikasi Rekening Bank Faskes/BPJS Provider**: Khusus bagi mitra kesehatan yang terikat kontrak faskes, penarikan dana hanya diizinkan ke rekening bank resmi Faskes atau rekening pribadi yang nama pemiliknya 100% cocok dengan nama pada KTP/STR terdaftar (anti pencucian uang / AML).
  * **Threshold Control (Gerbang Batas Nominal)**: Penarikan dana di bawah Rp 5.000.000 diproses secara *Auto-Disburse* via API Bank Gateway. Penarikan bernominal >= Rp 5.000.000 **wajib** melalui verifikasi dan persetujuan manual (*Manual Approval*) oleh Admin Finansial demi pencegahan *fraud*.
* **Alur Utama (Basic Flow)**:
  1. Mitra Profesional memilih menu "Saldo & Pencairan Dana" di navigasi Dasbor Mitra.
  2. Sistem menampilkan rincian keuangan: Total Pendapatan Kotor, Potongan Bagi Hasil Platform (merujuk ke UC-16), Potongan Pajak PPh 21, Saldo Tertahan (*Escrow/Pending*), dan Saldo Tersedia (*Available Balance*).
  3. Mitra mengklik tombol "Tarik Dana" dan memasukkan nominal yang ingin dicairkan (minimal Rp 50.000).
  4. Sistem memvalidasi bahwa nominal tidak melebihi Saldo Tersedia dan rekening bank tujuan dalam status aktif/valid.
  5. Sistem memotong Saldo Tersedia mitra di database dan memindahkannya ke tabel `saldo_pending` (*Balance Freeze*).
  6. Sistem memeriksa nominal penarikan terhadap aturan *Threshold Control*:
     * **Jika Nominal < Rp 5.000.000**: Sistem menginisiasi panggilan API *Auto-Disbursement* langsung ke Payment Gateway / Bank Switcher untuk mentransfer dana saat itu juga.
     * **Jika Nominal >= Rp 5.000.000**: Sistem memasukkan permintaan pencairan ke dalam antrean **Manual Approval** di Dasbor Admin Finansial. Admin Finansial mereview bukti pelayanan, mengklik "Setujui & Transfer", baru sistem memicu API Bank Gateway.
  7. API Bank Gateway membalas dengan status *Transfer Success*.
  8. Sistem memperbarui status penarikan menjadi `DISBURSED`, menghapus dana dari `saldo_pending`, dan mencatat log mutasi finansial WORM.
  9. Sistem mengirimkan email bukti transfer (*Remittance Advice*) beserta slip pemotongan pajak PPh 21 kepada Mitra Profesional.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Rekening Bank Tujuan Tidak Cocok dengan Identitas STR/KTA (*Name Mismatch*)**:
    1. Sistem mendeteksi bahwa rekening bank yang dipilih mitra memiliki nama pemilik yang berbeda dengan nama KTP/STR/KTA yang diverifikasi saat registrasi.
    2. Sistem menolak penarikan dana dan menampilkan pesan error AML: *"Penarikan dana ditolak. Demi kepatuhan anti-pencucian uang, rekening tujuan harus atas nama [Nama Mitra Terdaftar]"*.
  * **6a/7a. Webhook Bank Membalas Gagal (Transfer Ditolak / Rekening Diblokir)**:
    1. API Bank mengembalikan status gagal transfer karena nomor rekening tujuan salah, diblokir bank, atau sistem kliring bank sedang offline.
    2. Sistem secara otomatis melakukan **Rollback Finansial**: mengembalikan uang dari `saldo_pending` kembali ke `saldo_tersedia` (*Unfreeze Balance*).
    3. Sistem memperbarui status penarikan menjadi `FAILED` dan mengirimkan notifikasi peringatan ke aplikasi dan email mitra: *"Penarikan dana sebesar Rp [Nominal] gagal diproses oleh bank tujuan. Saldo Anda telah dikembalikan secara utuh ke dompet platform"*.
  * **6b. Admin Finansial Menolak Pencairan Manual (Terdeteksi Anomali/Fraud)**:
    1. Pada penarikan >= Rp 5.000.000, Admin Finansial menemukan adanya kejanggalan transaksi (misal: konsultasi fiktif atau manipulasi rating).
    2. Admin mengklik tombol "Tolak Pencairan & Investigasi" di dasbor admin.
    3. Sistem menahan dana di `saldo_pending`, mengubah status menjadi `UNDER_INVESTIGATION`, dan menonaktifkan sementara fitur penarikan dana pada akun mitra tersebut hingga sidang etik/investigasi selesai (UC-15).
  * **7b. API Bank Timeout / Tidak Membalas (> 24 Jam Tanpa Callback)**:
    1. Sistem *Watchdog / Cron Job* mendeteksi transaksi penarikan berstatus `PROCESSING` di API Bank melebihi batas waktu 24 jam tanpa kejelasan *callback*.
    2. Sistem menjalankan protokol **Safety Rollback**: membatalkan instruksi transfer di Payment Gateway, mengembalikan saldo dari `saldo_pending` ke `saldo_tersedia`, dan mengirimkan tiket investigasi otomatis ke tim engineer finansial.
"""

with open(TARGET_FILE, 'a', encoding='utf-8') as f:
    f.write(SECTION_B)

print("Appended Section B successfully.")
