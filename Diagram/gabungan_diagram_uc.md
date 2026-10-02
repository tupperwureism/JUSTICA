# Dokumen Gabungan: Diagram & Spesifikasi Skenario Use Case

Dokumen ini merupakan gabungan dari seluruh diagram arsitektur sistem dan detail skenario Use Case untuk platform **LifeQ Ecosystem (Tele-Consultation)**.

---

## 1. Direktori Diagram Arsitektur (PDF)

Berikut adalah tautan ke seluruh file diagram yang telah dihasilkan pada fase pemodelan UML. Silakan klik tautan di bawah ini untuk membuka diagram secara langsung:

*   [Diagram Domain Hukum](file:///d:/justificadll/Diagram/Hukum.drawio.pdf)
*   [Diagram Domain Kesehatan Fisik](file:///d:/justificadll/Diagram/Kesehatan.drawio.pdf)
*   [Diagram Domain Psikologi (Asesmen)](file:///d:/justificadll/Diagram/Psikologi.drawio.pdf)
*   [Sequence Diagram Keseluruhan (SD-01 s/d SD-18)](file:///d:/justificadll/Diagram/SEQUENCE.drawio-1.pdf)
*   [Unified Diagram Terpadu (26 Use Case & AD)](file:///d:/justificadll/Diagram/UNIFIEDDIAGRAM.drawio-4.pdf)

---

## 2. Spesifikasi Skenario Use Case - LifeQ Ecosystem (Justifiqa & Qualifa Standalone Apps)

Dokumen ini berisi spesifikasi skenario tertulis (*Use Case Scenarios*) untuk seluruh 26 Use Case terpadu pada sistem **LifeQ Ecosystem (Justifiqa & Qualifa Standalone Apps)** (17 Core Use Case + 9 Domain Use Case untuk Hukum, Psikologi, dan Kesehatan Fisik). Setiap skenario merinci deskripsi, aktor, kondisi prasyarat (*pre-condition*), kondisi akhir (*post-condition*), alur sukses utama (*basic flow*), dan alur alternatif/gagal (*alternative flow*).

> **Catatan UML**: Aktor hanya diisi oleh entitas di luar sistem (*external entities*). Sistem itu sendiri bertindak sebagai batasan sistem (*system boundary*) sehingga tidak dimasukkan sebagai aktor pendukung.

---

### DAFTAR ISI KELOMPOK AKTOR
* [A. Aktor: Klien (Client)](#a-aktor-klien-client)
* [B. Aktor: Mitra Profesional (Professional Partner)](#b-aktor-mitra-profesional-professional-partner)
* [C. Aktor: Admin Sistem (System Admin)](#c-aktor-admin-sistem-system-admin)

---

### A. Aktor: Klien (Client)

#### UC-01: Melakukan Registrasi Klien
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Calon klien mendaftarkan akun baru agar dapat mengakses layanan konsultasi di platform.
* **Pre-condition**: Klien belum terdaftar dan tidak sedang masuk ke akun lain.
* **Post-condition**: Akun klien baru berhasil dibuat di database dengan status aktif.
* **Alur Utama (Basic Flow)**:
  1. Klien membuka halaman pendaftaran akun.
  2. Sistem menampilkan formulir registrasi (Nama Lengkap, Email, Nomor Telepon, dan Kata Sandi).
  3. Klien mengisi seluruh data wajib dan mengklik tombol "Daftar".
  4. Sistem memvalidasi kelengkapan dan format data yang diinput.
  5. Sistem menyimpan data akun baru di database dengan status aktif.
  6. Sistem menampilkan pesan sukses dan mengarahkan klien ke halaman Login.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Email atau Nomor Telepon Sudah Terdaftar**:
    1. Sistem mendeteksi bahwa email atau nomor telepon sudah terdaftar di database.
    2. Sistem menampilkan pesan error: *"Email atau Nomor Telepon sudah digunakan"*.
    3. Sistem meminta klien memasukkan data yang berbeda.
  * **4b. Format Data Tidak Valid**:
    1. Sistem mendeteksi format email tidak valid atau panjang kata sandi kurang dari 8 karakter.
    2. Sistem menampilkan pesan error validasi yang sesuai.
    3. Klien memperbaiki input data.

#### UC-02: Melakukan Login Klien
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Klien masuk ke dalam aplikasi menggunakan kredensial akun dan kode verifikasi email (OTP).
* **Pre-condition**: Klien sudah memiliki akun aktif dan berada di halaman Login.
* **Post-condition**: Klien berhasil masuk dan mendapatkan token sesi aktif untuk mengakses dasbor utama.
* **Alur Utama (Basic Flow)**:
  1. Klien memasukkan Email/Nomor Telepon dan Kata Sandi pada halaman Login.
  2. Klien mengklik tombol "Masuk".
  3. Sistem memverifikasi kecocokan data dengan database.
  4. Sistem mengirimkan kode verifikasi (OTP) ke email Klien yang terdaftar.
  5. Sistem menampilkan halaman verifikasi OTP.
  6. Klien memasukkan kode verifikasi (OTP) yang diterima di email.
  7. Sistem memvalidasi kode verifikasi.
  8. Sistem membuat token sesi baru (JWT) untuk menjaga status masuk.
  9. Sistem mengarahkan klien ke halaman Dasbor Utama Klien.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Kredensial Salah**:
    1. Sistem mendeteksi email tidak terdaftar atau kata sandi tidak cocok.
    2. Sistem menampilkan pesan error: *"Email atau Kata Sandi salah"*.
    3. Klien diminta mengisi kembali kredensial.
  * **3b. Akun Diblokir/Ditangguhkan (Suspended)**:
    1. Sistem mendeteksi status akun klien adalah `SUSPENDED` (karena pelanggaran kebijakan).
    2. Sistem menampilkan pesan error: *"Akun Anda dinonaktifkan karena melanggar ketentuan. Silakan hubungi Customer Service"*.
    3. Sesi masuk dibatalkan.
  * **7a. Kode Verifikasi (OTP) Salah / Kadaluarsa**:
    1. Sistem mendeteksi kode OTP tidak cocok atau waktu aktif OTP habis.
    2. Sistem menampilkan pesan error: *"Kode verifikasi salah atau sudah kadaluarsa"*.
    3. Klien diminta mengisi kembali OTP atau mengklik "Kirim Ulang Kode".

#### UC-03: Memilih Mitra Profesional
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Klien mencari, menyaring, dan memilih mitra profesional (Dokter, Advokat, atau Psikolog) yang sedang online untuk dikonsultasikan.
* **Pre-condition**: Klien sudah login and berada di dasbor utama layanan.
* **Post-condition**: Klien memilih satu profil mitra profesional untuk sesi konsultasi.
* **Alur Utama (Basic Flow)**:
  1. Klien memilih domain layanan (Medis, Hukum, atau Psikologi).
  2. Klien memilih kategori spesialisasi (misal: Spesialis Anak, Hukum Keluarga, atau Kecemasan/Mental Health).
  3. Sistem menampilkan daftar mitra profesional yang sesuai dengan kriteria domain dan spesialisasi.
  4. Klien menyaring daftar berdasarkan status ketersediaan (Hanya menampilkan yang online).
  5. Klien mengklik salah satu profil mitra profesional untuk melihat detail tarif per sesi, rating, dan pengalaman.
  6. Sistem menampilkan detail profil lengkap mitra profesional yang dipilih.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Mitra Profesional Tidak Ditemukan**:
    1. Sistem mendeteksi tidak ada mitra profesional yang memenuhi kriteria pencarian atau semuanya sedang offline.
    2. Sistem menampilkan pesan: *"Mitra profesional tidak ditemukan atau sedang offline"*.
    3. Klien kembali ke langkah sebelumnya untuk mengubah filter pencarian.

#### UC-04: Melakukan Konsultasi
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Mitra Profesional
* **Deskripsi Singkat**: Klien melakukan konsultasi interaktif via obrolan (chat) real-time dengan mitra profesional setelah pembayaran tiket sukses.
* **Pre-condition**: Klien sudah memilih mitra profesional (UC-03) dan memiliki tiket transaksi yang aktif dan terverifikasi pembayarannya.
* **Post-condition**: Sesi obrolan ditutup, dan data ringkasan konsultasi disimpan di database.
* **Alur Utama (Basic Flow)**:
  1. Klien mengklik "Mulai Konsultasi" setelah pembayaran tiket berhasil diverifikasi.
  2. Sistem memverifikasi validitas tiket pembayaran (UC-05) dan membuka ruang obrolan (chat room).
  3. Sistem mengirimkan notifikasi ke dasbor Mitra Profesional (UC-10) untuk menerima konsultasi.
  4. Klien and Mitra Profesional melangsungkan sesi tanya jawab via obrolan real-time.
  5. Mitra Profesional menutup sesi konsultasi secara resmi setelah dirasa cukup.
  6. Sistem mengunci ruang obrolan sehingga pesan baru tidak dapat dikirim lagi.
  7. Sistem menyimpan riwayat obrolan dan mengarahkan klien ke halaman pemberian ulasan (UC-06).
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **2a. Tiket Pembayaran Tidak Valid/Belum Dibayar**:
    1. Sistem mendeteksi status transaksi pembayaran untuk tiket konsultasi ini adalah `FAILED` atau `PENDING`.
    2. Sistem membatalkan pembukaan ruang obrolan dan mengarahkan klien kembali ke halaman pembayaran.
  * **3a. Mitra Profesional Tidak Merespon (Timeout)**:
    1. Mitra profesional tidak menerima obrolan setelah batas waktu tunggu berakhir (misal: 5 menit).
    2. Sistem membatalkan sesi konsultasi secara otomatis.
    3. Sistem menginisiasi pengembalian dana (*refund*) transaksi otomatis ke klien.
    4. Sistem menampilkan notifikasi permintaan maaf dan menyarankan klien memilih mitra lain.
  * **3b. Klien Keluar dari Ruang Chat Secara Sepihak**:
    1. Sistem mendeteksi klien menutup halaman obrolan/aplikasi secara sengaja sebelum mitra profesional mengakhiri sesi.
    2. Sistem mengirimkan pesan konfirmasi pop-up untuk memastikan tindakan klien.
    3. Klien mengonfirmasi ingin keluar. Sistem mengunci ruang obrolan dan mengakhiri sesi.
    4. Sistem menandai status sesi sebagai `COMPLETED` dan menutup transaksi tanpa pengembalian dana (*no refund*).

#### UC-05: Melakukan Pembayaran
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Payment Gateway
* **Deskripsi Singkat**: Klien melakukan pembayaran biaya konsultasi menggunakan metode digital pilihan mereka (*Include* dari UC-04).
* **Pre-condition**: Klien telah memilih mitra profesional dan detail transaksi telah terbentuk.
* **Post-condition**: Pembayaran diverifikasi sukses, dan tiket konsultasi aktif diterbitkan.
* **Alur Utama (Basic Flow)**:
  1. Klien memilih metode pembayaran (E-wallet, Virtual Account, Kartu Kredit) pada halaman checkout.
  2. Sistem mengirimkan data transaksi ke Payment Gateway untuk membuat Snap Token pembayaran.
  3. Payment Gateway mengembalikan token transaksi dan instruksi pembayaran.
  4. Sistem menampilkan instruksi pembayaran kepada Klien.
  5. Klien menyelesaikan pembayaran di aplikasi pihak ketiga (e-wallet/m-banking) milik mereka.
  6. Payment Gateway memvalidasi transaksi dan mengirim callback status "Sukses" ke Sistem.
  7. Sistem memperbarui status transaksi menjadi `PAID` dan menerbitkan tiket konsultasi aktif.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **5a. Pembayaran Gagal / Ditolak (Saldo Kurang, dll.)**:
    1. Payment Gateway mendeteksi transaksi gagal dan mengirimkan status callback "Gagal" ke Sistem.
    2. Sistem memperbarui status transaksi menjadi `FAILED` dan menampilkan notifikasi: *"Pembayaran Anda Gagal"*.
    3. Klien diarahkan kembali ke halaman pemilihan metode pembayaran untuk mencoba lagi.
  * **5b. Batas Waktu Pembayaran Habis (Timeout)**:
    1. Klien tidak melakukan pembayaran hingga batas waktu (misal: 15 menit) berakhir.
    2. Payment Gateway membatalkan transaksi dan mengirim status callback "Expired".
    3. Sistem memperbarui status transaksi menjadi `EXPIRED` dan membatalkan booking mitra profesional.

#### UC-06: Memberikan Ulasan dan Rating
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Klien memberikan penilaian berupa skor rating bintang dan ulasan teks untuk mitra profesional setelah sesi obrolan selesai.
* **Pre-condition**: Sesi konsultasi telah ditutup secara resmi (UC-04).
* **Post-condition**: Ulasan tersimpan dan mempengaruhi nilai rata-rata rating mitra profesional di profil publik mereka.
* **Alur Utama (Basic Flow)**:
  1. Sistem menampilkan halaman pemberian ulasan kepada klien setelah ruang obrolan ditutup.
  2. Klien memilih skor bintang (1 hingga 5).
  3. Klien menuliskan ulasan singkat mengenai pengalaman konsultasinya.
  4. Klien mengklik tombol "Kirim Ulasan".
  5. Sistem menyimpan ulasan ke database dan memperbarui kalkulasi rating rata-rata mitra profesional.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **2a. Klien Melewati Ulasan (Skip)**:
    1. Klien memilih tombol "Nanti Saja / Skip".
    2. Sistem menutup halaman ulasan dan langsung mengarahkan klien kembali ke halaman dasbor utama tanpa menyimpan rating.

---

### B. Aktor: Mitra Profesional (Professional Partner)

#### UC-07: Melakukan Registrasi Mitra Profesional
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Calon mitra profesional mendaftarkan akun baru dan mengunggah dokumen kredensial (STR/KTA/SIPP) agar dapat diverifikasi oleh admin.
* **Pre-condition**: Mitra profesional belum terdaftar di platform.
* **Post-condition**: Akun mitra baru dibuat dengan status `PENDING_VERIFICATION` menunggu persetujuan admin.
* **Alur Utama (Basic Flow)**:
  1. Mitra Profesional membuka halaman registrasi khusus mitra.
  2. Sistem menampilkan formulir registrasi (Nama Lengkap, Bidang Layanan, Spesialisasi, Nomor Lisensi/STR, Ijazah, Berkas Lisensi, dan Kata Sandi).
  3. Mitra Profesional mengisi seluruh kolom wajib, mengunggah berkas kredensial, dan mengklik tombol "Kirim Pendaftaran".
  4. Sistem memvalidasi kelengkapan data dan format file yang diunggah.
  5. Sistem menyimpan data dengan status akun `PENDING_VERIFICATION`.
  6. Sistem menampilkan pesan sukses bahwa dokumen sedang ditinjau oleh Admin.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Berkas Kredensial Wajib Kosong**:
    1. Mitra Profesional tidak mengunggah berkas wajib (Ijazah/STR/KTA).
    2. Sistem mendeteksi ketiadaan file wajib dan membatalkan pengiriman data.
    3. Sistem menampilkan error: *"Dokumen Kredensial Wajib Diunggah"*.
  * **3b. Format File Tidak Didukung**:
    1. Mitra Profesional mengunggah file selain format PDF, JPG, atau PNG (misal: .zip).
    2. Sistem menampilkan error: *"Format file tidak didukung. Harap unggah PDF, JPG, atau PNG"*.

#### UC-08: Melakukan Login Mitra Profesional
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Mitra Profesional masuk ke dasbor profesional menggunakan kredensial akun dan verifikasi email (OTP).
* **Pre-condition**: Akun mitra profesional sudah aktif dan telah diverifikasi oleh admin.
* **Post-condition**: Mitra profesional masuk ke dasbor mereka dan siap menerima konsultasi klien.
* **Alur Utama (Basic Flow)**:
  1. Mitra Profesional memasukkan Email/Nomor Lisensi dan Kata Sandi pada halaman Login Mitra.
  2. Mitra Profesional mengklik tombol "Masuk".
  3. Sistem mencocokkan kredensial di database.
  4. Sistem mengirimkan kode verifikasi (OTP) ke email Mitra Profesional yang terdaftar.
  5. Sistem menampilkan halaman verifikasi OTP.
  6. Mitra Profesional memasukkan kode verifikasi (OTP) yang diterima di email.
  7. Sistem memvalidasi kode verifikasi.
  8. Sistem membuat token sesi aktif dan mengarahkan mitra ke halaman Dasbor Profesional.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Akun Belum Diverifikasi Admin**:
    1. Sistem mendeteksi kredensial benar, tetapi status verifikasi akun masih `PENDING_VERIFICATION`.
    2. Sesi masuk ditolak.
    3. Sistem menampilkan pesan: *"Akun Anda masih dalam proses verifikasi oleh Admin. Harap tunggu"*.
  * **3b. Akun Ditolak oleh Admin**:
    1. Sistem mendeteksi status verifikasi akun adalah `REJECTED`.
    2. Sistem menampilkan pesan error dan detail alasan penolakan berkas dari admin.
    3. Sistem mengarahkan mitra kembali ke formulir pendaftaran untuk mengoreksi berkas.
  * **7a. Kode Verifikasi (OTP) Salah / Kadaluarsa**:
    1. Sistem mendeteksi kode OTP tidak cocok atau waktu aktif OTP habis.
    2. Sistem menampilkan pesan error: *"Kode verifikasi salah atau sudah kadaluarsa"*.
    3. Mitra Profesional diminta mengisi kembali OTP atau mengklik "Kirim Ulang Kode".

#### UC-09: Mengonfirmasi Status Ketersediaan (on/off)
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Mitra Profesional mengubah status ketersediaan mereka menjadi online atau offline agar sistem dapat menampilkan ketersediaan mereka kepada klien.
* **Pre-condition**: Mitra profesional sudah login dan berada di dasbor utama.
* **Post-condition**: Status ketersediaan mitra profesional di database diperbarui secara instan.
* **Alur Utama (Basic Flow)**:
  1. Mitra Profesional membuka halaman pengaturan ketersediaan di dasbor mereka.
  2. Mitra Profesional menggeser tombol toggle ketersediaan menjadi online atau offline.
  3. Sistem menangkap perubahan toggle dan mengirim instruksi update status ke database.
  4. Sistem memperbarui status ketersediaan mitra profesional di DB secara real-time.
  5. Sistem memperbarui tampilan dasbor mitra dan menampilkan notifikasi status aktif.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Koneksi Internet Terputus**:
    1. Sistem gagal mengirim instruksi update status ke database karena gangguan koneksi.
    2. Sistem mengembalikan toggle ke posisi semula dan menampilkan pesan: *"Koneksi gagal. Silakan coba lagi"*.

#### UC-10: Melayani Konsultasi
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Klien
* **Deskripsi Singkat**: Mitra Profesional menerima obrolan masuk dan melangsungkan sesi tanya jawab konsultasi via chat dengan klien (*Include* dari UC-04).
* **Pre-condition**: Mitra profesional telah online (UC-09) dan ada tiket klien masuk.
* **Post-condition**: Konsultasi selesai dilayani dan ringkasan serta resep/rekomendasi disimpan di database.
* **Alur Utama (Basic Flow)**:
  1. Sistem memunculkan pop-up permintaan konsultasi masuk ke dasbor Mitra Profesional.
  2. Mitra Profesional mengklik tombol "Terima Permintaan".
  3. Sistem menghubungkan mitra ke ruang obrolan (chat room) yang aktif dengan Klien.
  4. Mitra Profesional membaca keluhan klien dan merespons dengan memberikan penjelasan medis/hukum/psikologi via chat.
  5. Setelah sesi dirasa cukup, Mitra Profesional menulis catatan sesi konsultasi (UC-11).
  6. Mitra Profesional mengklik tombol "Selesaikan Konsultasi".
  7. Sistem menutup dan mengunci ruang obrolan chat.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **2a. Mitra Profesional Menolak Permintaan**:
    1. Mitra Profesional memilih tombol "Tolak / Sibuk".
    2. Sistem mengembalikan tiket klien ke antrean pencarian profesional online lainnya.
    3. Sesi konsultasi pada mitra bersangkutan dibatalkan.

#### UC-11: Membuat Catatan Sesi Konsultasi
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Mitra Profesional menuliskan kesimpulan, diagnosis, opini hukum, atau ringkasan psikologi setelah obrolan konsultasi selesai.
* **Pre-condition**: Mitra profesional berada dalam sesi konsultasi aktif (UC-10).
* **Post-condition**: Ringkasan catatan sesi disimpan secara permanen di database.
* **Alur Utama (Basic Flow)**:
  1. Mitra Profesional memilih opsi "Buat Catatan Konsultasi" di panel obrolan.
  2. Sistem menampilkan Formulir Catatan Sesi (Gejala/Keluhan, Diagnosis/Opini, Rekomendasi Tindak Lanjut).
  3. Mitra Profesional mengisi detail catatan konsultasi.
  4. Mitra Profesional memilih untuk menambahkan dokumen rekomendasi khusus (*Extend* ke UC-12).
  5. Mitra Profesional menyimpan catatan konsultasi tersebut.
  6. Sistem menyimpan data rekam medis/hukum/konseling klien di database.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Pengisian Formulir Tidak Lengkap**:
    1. Mitra Profesional mengklik simpan namun kolom wajib belum terisi.
    2. Sistem membatalkan penyimpanan dan memunculkan notifikasi kolom wajib yang harus diisi.

#### UC-12: Mengeluarkan Output Dokumen Konsultasi
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Mitra Profesional meracik dokumen output konsultasi (seperti resep obat digital untuk domain medis, ulasan dokumen hukum untuk advokat, atau lembar tugas mandiri untuk psikologi) (*Extend dari* UC-11).
* **Pre-condition**: Mitra profesional sedang mengisi formulir catatan sesi (UC-11) dan klien membutuhkan dokumen tindak lanjut khusus.
* **Post-condition**: Dokumen rekomendasi/resep digital terbit dan terlampir pada riwayat catatan sesi klien.
* **Alur Utama (Basic Flow)**:
  1. Mitra Profesional mengklik tombol "Tambah Dokumen Output" pada formulir catatan.
  2. Sistem menampilkan formulir sesuai domain (Pencarian obat medis, ulasan draf hukum, atau modul/latihan psikologi).
  3. Mitra Profesional menginput data detail dokumen output yang dibutuhkan.
  4. Mitra Profesional mengklik "Simpan Dokumen".
  5. Sistem melampirkan file dokumen output tersebut ke catatan konsultasi klien.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Item yang Dicari Tidak Ditemukan**:
    1. Mitra mencari item (misal: obat medis/modul psikologi) namun tidak terdaftar di katalog sistem.
    2. Sistem menampilkan notifikasi kegagalan pencarian.
    3. Mitra memilih menuliskan rekomendasi secara manual dengan teks bebas.

---

### C. Aktor: Admin Sistem (System Admin)

#### UC-13: Memverifikasi Berkas Kredensial Mitra
* **Aktor Utama**: Admin Sistem
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Admin meninjau dokumen lisensi profesi (STR/KTA/SIPP) calon mitra profesional baru untuk menyetujui atau menolak pendaftaran mereka.
* **Pre-condition**: Ada pendaftaran mitra profesional baru dengan status `PENDING_VERIFICATION` (UC-07).
* **Post-condition**: Status verifikasi mitra berubah menjadi aktif (`ACTIVE`) atau ditolak (`REJECTED`) di database.
* **Alur Utama (Basic Flow)**:
  1. Admin membuka menu "Verifikasi Berkas" di dashboard admin.
  2. Sistem menampilkan daftar mitra profesional baru beserta berkas ijazah dan lisensi yang telah diunggah.
  3. Admin **memilih** salah satu mitra dari daftar, membuka detail berkas, dan melakukan verifikasi keaslian dokumen secara manual ke badan/konsil resmi terkait.
  4. Berkas dinyatakan valid. Admin mengklik tombol "Setujui / Approve".
  5. Sistem mengubah status akun mitra menjadi `ACTIVE` dan mengirimkan email pemberitahuan pendaftaran sukses.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Berkas Dinyatakan Palsu / Tidak Valid**:
    1. Admin mendeteksi berkas lisensi palsu, kedaluwarsa, atau tidak sah.
    2. Admin mengklik tombol "Tolak / Reject".
    3. Sistem menampilkan kolom pengisian alasan penolakan.
    4. Admin mengisi alasan penolakan (misal: *"File STR tidak terbaca / buram"*).
    5. Sistem mengubah status verifikasi mitra menjadi `REJECTED` dan mengirimkan email penolakan berkas beserta alasannya.

#### UC-14: Mengelola Data Akun Klien
* **Aktor Utama**: Admin Sistem
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Admin menangguhkan (suspend) akun klien yang terbukti melanggar aturan platform.
* **Pre-condition**: Admin telah login dan berada di dasbor manajemen akun admin.
* **Post-condition**: Akun klien yang melanggar ditangguhkan dan tidak bisa melakukan login.
* **Alur Utama (Basic Flow)**:
  1. Admin memilih menu Kelola Akun Pasien (Klien).
  2. Sistem menampilkan daftar data akun klien secara keseluruhan.
  3. Admin memeriksa data akun. Jika perlu tindakan penangguhan (Suspend) karena adanya laporan pelanggaran, maka lanjut ke langkah 4. Jika tidak perlu, alur selesai (Sistem tetap menampilkan halaman daftar akun).
  4. Admin memilih akun klien yang melanggar dan mengklik tombol "Suspend/Tangguhkan".
  5. Sistem meminta konfirmasi penangguhan akun klien.
  6. Admin mengonfirmasi tindakan tersebut.
  7. Sistem memperbarui status akun klien menjadi `SUSPENDED` di database, mematikan token sesi aktif klien tersebut, dan menampilkan notifikasi sukses.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Mengaktifkan Kembali Akun Klien (Unsuspend)**:
    1. Admin meninjau banding dari klien dan memutuskan memulihkan akun.
    2. Admin mencari akun klien tersuspend dan mengklik tombol "Aktifkan Kembali".
    3. Sistem memperbarui status akun klien kembali menjadi `ACTIVE` di database dan menampilkan notifikasi sukses.

#### UC-15: Mengelola Data Akun Mitra Profesional
* **Aktor Utama**: Admin Sistem
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Admin menangguhkan (suspend) akun mitra profesional yang terbukti melanggar kode etik atau kebijakan platform.
* **Pre-condition**: Admin telah login dan berada di dasbor manajemen akun admin.
* **Post-condition**: Akun mitra yang melanggar ditangguhkan dan tidak muncul di filter pencarian dokter/advokat/psikolog.
* **Alur Utama (Basic Flow)**:
  1. Admin memilih menu Kelola Akun Mitra Profesional.
  2. Sistem menampilkan daftar data akun mitra profesional secara keseluruhan.
  3. Admin memeriksa data akun. Jika perlu tindakan penangguhan (Suspend) karena adanya laporan pelanggaran, maka lanjut ke langkah 4. Jika tidak perlu, alur selesai (Sistem tetap menampilkan halaman daftar akun).
  4. Admin memilih akun mitra profesional yang melanggar dan mengklik tombol "Suspend/Tangguhkan".
  5. Sistem meminta konfirmasi penangguhan akun mitra profesional.
  6. Admin mengonfirmasi tindakan tersebut.
  7. Sistem memperbarui status akun mitra profesional menjadi `SUSPENDED` di database, menonaktifkan profil mitra dari filter pencarian, dan menampilkan notifikasi sukses.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **3a. Mengaktifkan Kembali Akun Mitra Profesional (Unsuspend)**:
    1. Admin meninjau klarifikasi dari mitra profesional dan memutuskan memulihkan akun.
    2. Admin mencari akun mitra tersuspend dan mengklik tombol "Aktifkan Kembali".
    3. Sistem memperbarui status akun mitra profesional kembali menjadi `ACTIVE` di database dan menampilkan notifikasi sukses.

#### UC-16: Memantau Laporan Transaksi
* **Aktor Utama**: Admin Sistem
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Admin memantau seluruh transaksi keuangan dari layanan konsultasi yang masuk ke platform dan mengunduh laporan ekspor data.
* **Pre-condition**: Admin telah login dan berada di halaman Laporan Keuangan.
* **Post-condition**: Admin melihat visualisasi grafik keuangan dan mengunduh laporan transaksi berformat PDF/Excel.
* **Alur Utama (Basic Flow)**:
  1. Admin masuk ke halaman Laporan Transaksi Keuangan.
  2. Sistem menampilkan tabel seluruh riwayat transaksi default beserta grafik mingguan.
  3. Admin memeriksa data. Jika ingin memfilter data, lanjut ke langkah 4. Jika tidak ingin memfilter, langsung lompat ke langkah 7.
  4. Admin memilih opsi "Filter" berdasarkan rentang tanggal tertentu, domain layanan (Medis/Hukum/Psikologi), atau bidang spesialisasi.
  5. Sistem memproses data transaksi sesuai parameter filter di database.
  6. Sistem menampilkan data terfilter di tabel dan grafik dasbor.
  7. Admin melihat detail transaksi lalu mengklik tombol "Ekspor Laporan".
  8. Sistem memproses data dan menghasilkan berkas laporan berformat `.xlsx` (Excel) atau `.pdf`.
  9. Sistem mengirim file laporan ke browser Admin untuk diunduh otomatis.
* **Alur Alternatif/Gagal (Alternative Flow)**:
  * **4a. Data Transaksi Tidak Ditemukan Sesuai Filter**:
    1. Sistem mendeteksi tidak ada transaksi pada parameter filter yang ditentukan Admin.
    2. Sistem menampilkan pesan: *"Tidak ada data transaksi pada periode ini"*.
    3. Sistem menonaktifkan tombol ekspor laporan.

---

#### UC-17: Mengelola Saldo dan Penarikan Dana Mitra
* **Aktor Utama**: Mitra Profesional
* **Aktor Pendukung**: Admin Finansial, Payment Gateway / Bank API
* **Deskripsi Singkat**: Mitra Profesional memantau bagi hasil pendapatan jasa konsultasi, menghitung estimasi pajak PPh 21, dan mencairkan dana dari dompet platform ke rekening bank pribadi terdaftar.
* **Pre-condition**: Mitra profesional sudah login, memiliki saldo pendapatan yang dapat dicairkan (*available balance* > Rp 50.000), serta rekening bank profesi dan NPWP telah diverifikasi.
* **Post-condition**: Permintaan penarikan dana diproses, saldo berpindah ke status `DIBEKUKAN` (*frozen balance*), dan dana ditransfer ke rekening bank mitra melalui *auto-disbursement* atau persetujuan manual Admin Finansial.
* **Compliance Checklist & Regulasi Domain**:
  * **Peraturan Dirjen Pajak (PPh 21 Compliance)**: Sistem secara otomatis mengalkulasi dan memotong Pajak Penghasilan (PPh 21) atas jasa tenaga ahli (Dokter/Advokat/Psikolog) berdasarkan persentase aturan perpajakan yang berlaku sebelum saldo bersih masuk ke dompet mitra.
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

---

### D. Skenario Spesifik Domain (Kesehatan, Psikologi, Hukum)

#### Psi-UC01: Mengisi Jurnal Mood Harian (Domain Psikologi)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Psikolog
* **Deskripsi Singkat**: Klien mencatat kondisi emosional harian mereka ke dalam jurnal yang nantinya bisa diakses oleh psikolog sebagai bahan asesmen.
* **Pre-condition**: Klien telah login.
* **Post-condition**: Catatan mood harian tersimpan di database.
* **Alur Utama (Basic Flow)**:
  1. Klien membuka halaman Jurnal Mood (*Mood Tracker*).
  2. Sistem menampilkan pilihan ikon emotikon (Senang, Sedih, Marah, Cemas, dll).
  3. Klien memilih satu emotikon yang mendeskripsikan perasaan hari ini.
  4. Klien mengetikkan cerita singkat tentang apa yang memicu perasaan tersebut (opsional).
  5. Klien mengklik "Simpan Jurnal".
  6. Sistem menyimpan data ke riwayat *Mood Tracker* yang terenkripsi, yang dapat dibuka oleh psikolog saat sesi konseling dimulai.

#### Huk-UC01: Mengunggah Berkas Perkara (Domain Hukum)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Advokat
* **Deskripsi Singkat**: Klien mengunggah dokumen/bukti kasus agar bisa ditinjau oleh pengacara sebelum atau saat sesi konsultasi.
* **Pre-condition**: Klien telah login dan telah/sedang terhubung dengan advokat.
* **Post-condition**: Dokumen rahasia terenkripsi dan dapat diakses oleh advokat.
* **Alur Utama (Basic Flow)**:
  1. Klien mengklik tombol "Unggah Bukti/Dokumen" di dalam ruang chat konsultasi.
  2. Klien memilih berkas (PDF/Gambar) dari perangkatnya.
  3. Sistem memvalidasi ekstensi dan batas ukuran file (misal maksimal 10MB).
  4. Sistem mengenkripsi berkas dan mengirimkannya ke ruang chat.
  5. Advokat dapat membuka dan menganalisis berkas tersebut untuk memberikan opini hukum.

#### Kes-UC03: Melihat Rekam Medis & Family Care (Domain Kesehatan)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Klien mengakses riwayat medis digital miliknya atau anggota keluarganya.
* **Pre-condition**: Klien telah login.
* **Post-condition**: Klien berhasil membaca riwayat diagnosis dan resep obat.
* **Alur Utama (Basic Flow)**:
  1. Klien membuka menu "Rekam Medis".
  2. Sistem memverifikasi token dan menampilkan daftar anggota keluarga (Family Care).
  3. Klien memilih profil pasien (Diri Sendiri/Keluarga).
  4. Sistem mengambil riwayat konsultasi, diagnosis, dan resep dari database.
  5. Klien meninjau data historis kesehatannya secara Read-Only.

#### Psi-UC02: Mengakses Audio Meditasi (Domain Psikologi)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Tidak ada
* **Deskripsi Singkat**: Klien memutar trek audio relaksasi/meditasi mandiri.
* **Pre-condition**: Klien telah login.
* **Post-condition**: Audio meditasi berhasil diputar.
* **Alur Utama (Basic Flow)**:
  1. Klien membuka menu "Relaksasi & Meditasi".
  2. Sistem menampilkan daftar kategori audio (Tidur, Kecemasan, Fokus).
  3. Klien memilih dan menekan tombol *Play* pada salah satu trek.
  4. Sistem melakukan *streaming* audio ke perangkat klien.

#### Psi-UC03: Mengisi Tes Asesmen Psikologi (Domain Psikologi)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Psikolog
* **Deskripsi Singkat**: Klien mengisi kuisioner standar (misal DASS-21) untuk mengukur tingkat stres, depresi, atau kecemasan awal sebelum sesi.
* **Pre-condition**: Klien telah login.
* **Post-condition**: Hasil skor tes tersimpan dan direkomendasikan penanganan lanjutan.
* **Alur Utama (Basic Flow)**:
  1. Klien membuka menu "Asesmen Psikologi".
  2. Sistem menampilkan daftar pertanyaan pilihan ganda (*self-report*).
  3. Klien menjawab seluruh pertanyaan hingga selesai.
  4. Sistem mengalkulasi skor secara otomatis berdasarkan standar psikometri.
  5. Sistem menampilkan hasil indikasi (Ringan/Sedang/Berat) dan menyimpan data agar bisa dibaca oleh psikolog kelak.

#### Huk-UC02: Membuat Draf Dokumen Hukum (Domain Hukum)
* **Aktor Utama**: Advokat (Mitra)
* **Aktor Pendukung**: Klien
* **Deskripsi Singkat**: Advokat meracik draf/dokumen hukum (seperti Somasi, Perjanjian Sewa, atau Kontrak Kerja) untuk klien sebagai hasil output dari konsultasi.
* **Pre-condition**: Advokat sedang melayani sesi konsultasi klien (Ekstensi UC-12).
* **Post-condition**: Draf hukum final berhasil dikirim ke ruang chat klien.
* **Alur Utama (Basic Flow)**:
  1. Advokat memilih menu "Legal Drafting".
  2. Sistem menampilkan berbagai *template* dokumen hukum (Perdata/Pidana/Bisnis) beserta kotak pencarian.
  3. Advokat mencari (berdasarkan nama/kategori) dan **memilih** salah satu *template* yang sesuai dengan kasus klien.
  4. Sistem membuka *template* tersebut dan menampilkan *form input*.
  5. Advokat mengisi variabel spesifik (Nama pihak, nominal, pasal) ke dalam *form* tersebut.
  6. Sistem me-render *template* tersebut menjadi file PDF final.
  7. Advokat mengirim dokumen final tersebut ke ruang obrolan klien.

#### Huk-UC03: Melakukan Konsultasi Pro Bono (Domain Hukum)
* **Aktor Utama**: Klien
* **Aktor Pendukung**: Advokat
* **Deskripsi Singkat**: Klien yang kurang mampu secara ekonomi dapat mengajukan konsultasi hukum gratis (disubsidi/pro bono) dengan melampirkan Surat Keterangan Tidak Mampu (SKTM).
* **Pre-condition**: Klien telah login dan masuk ke kategori Pro Bono.
* **Post-condition**: Tiket konsultasi Pro Bono diterbitkan (Diskon 100%).
* **Alur Utama (Basic Flow)**:
  1. Klien memilih opsi "Konsultasi Bantuan Hukum (Pro Bono)".
  2. Sistem meminta klien mengunggah berkas SKTM (Surat Keterangan Tidak Mampu).
  3. Klien mengunggah berkas SKTM.
  4. Sistem memverifikasi ketersediaan kuota Advokat Pro Bono.
  5. Sistem menerbitkan tiket konsultasi dengan tarif Rp 0 (Melewati integrasi Payment Gateway).
  6. Klien langsung diarahkan ke ruang tunggu obrolan (chat room).
