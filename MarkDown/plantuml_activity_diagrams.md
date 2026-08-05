# Kumpulan Kode PlantUML: Activity Diagrams - 100% Siloed Architecture (Justifiqa & Qualifa)

Dokumen ini berisi kumpulan kode PlantUML untuk seluruh Activity Diagram pada dua aplikasi mandiri yang **100% terisolasi dan berdiri sendiri (*Siloed Architecture*)**: **Justifiqa** (Domain Hukum) dan **Qualifa** (Domain Psikologi). Penomoran diagram telah distandarisasi menggunakan pengenal spesifik aplikasi: **`AD-J-xx`** untuk Justifiqa dan **`AD-Q-xx`** untuk Qualifa.

---

> **⚠️ STATUS: TARGET ARCHITECTURE**
>
> Diagram dalam dokumen ini mendeskripsikan **arsitektur target / alur bisnis utama yang dimaksudkan**. Aktivitas yang ditampilkan murni berupa keputusan bisnis, swimlane peran, dan alur pengulangan/exception handling. Diagram ini **bukan as-built documentation** dan tidak menegaskan bahwa setiap adapter/seam saat ini telah ada.
>
> Implementasi aktual (as-built) menggunakan **Supabase BaaS** (PostgREST, GoTrue, Storage, Realtime, Edge Functions). Pemetaan target capability dan status implementasi aktual **hanya** ada di `MarkDown/TRACEABILITY_MATRIX.md`.
>
> **Untuk presentasi:** diagram AMAN dipamerkan sebagai representasi alur bisnis target. Setiap penyebutan `API Mekari Sign`, `Payment Gateway`, `WORM Storage` di AD adalah referensi dependency eksternal target, bukan endpoint internal yang sudah ter-deploy.

---

## Cara Import ke Draw.io
1. Buka Draw.io (`app.diagrams.net`).
2. Pada toolbar bagian atas, klik tombol **+ (Insert)** atau pilih menu **Arrange -> Insert**.
3. Pilih **Advanced -> PlantUML...**.
4. Salin dan tempel kode di bawah ini, lalu klik **Insert**.

---

## BAGIAN I: ACTIVITY DIAGRAMS - APLIKASI MANDIRI JUSTIFIQA (DOMAIN HUKUM)

### AD-J-01: Registrasi Akun Klien & Advokat (J-UC01, J-UC07)
*Diagram alur pendaftaran akun mandiri Klien (verifikasi NIK Dukcapil) dan Advokat/Notaris (verifikasi SIPP Peradi) di platform Justifiqa.*

```plantuml
@startuml
|Pengguna (Klien/Advokat)|
start
:Buka Halaman Registrasi Justifiqa;
:Pilih Jenis Akun (Klien atau Advokat);

|Backend Independen Justifiqa|
:Tampilkan Formulir Registrasi Spesifik;

|Pengguna (Klien/Advokat)|
--> (A)
:Isi Data Diri & Unggah Dokumen Kredensial;
note right
Klien: NIK KTP Dukcapil
Advokat: Kartu Peradi & SIPP/SK Notaris
end note
:Klik Daftar;

|Backend Independen Justifiqa|
if (Apakah Format & Ukuran File Valid?) then (Ya)
  if (Apakah Email/No HP/NIK Sudah Terdaftar?) then (Tidak)
    if (Jenis Akun = Advokat?) then (Ya)
      :Simpan Akun di DB Justifiqa (Status: PENDING_VERIFICATION);
      :Kirim Antrean Audit ke Admin Legal Justifiqa;
      :Tampilkan Pesan "Menunggu Verifikasi Admin 1x24 Jam";
      |Pengguna (Klien/Advokat)|
      stop
    else (Tidak - Klien)
      :Verifikasi NIK ke API Dukcapil;
      if (NIK Valid?) then (Ya)
        :Simpan Akun Klien di DB Justifiqa (Status: AKTIF);
        :Tampilkan Pesan Sukses & Arahkan ke Login;
        |Pengguna (Klien/Advokat)|
        stop
      else (Tidak)
        :Tampilkan Error "NIK Tidak Valid / Tidak Cocok";
      endif
    endif
  else (Ya)
    |Backend Independen Justifiqa|
    :Tampilkan Error "Email/No HP/NIK Sudah Terdaftar";
  endif
else (Tidak)
  |Backend Independen Justifiqa|
  :Tampilkan Error Validasi Format/File;
endif

|Pengguna (Klien/Advokat)|
:Perbaiki Input Data;
if (Coba Daftar Lagi?) then (Ya)
  --> (A)
  detach
else (Tidak)
  stop
endif
@enduml
```

---

### AD-J-02: Login Akun Klien & Advokat (J-UC02, J-UC08)
*Diagram alur masuk (login) independen beserta verifikasi Multi-Factor Authentication (MFA / 2FA).*

```plantuml
@startuml
|Pengguna Justifiqa|
start
:Buka Halaman Login Justifiqa;
--> (A)
:Masukkan Email/No HP & Password;
:Klik Login;

|Backend Independen Justifiqa|
if (Apakah Kredensial Cocok di DB Justifiqa?) then (Ya)
  if (Apakah Akun Diblokir / Suspend?) then (Tidak)
    :Generate Kode OTP 6-Digit (Expire 5 Menit);
    :Kirim OTP via SMS/WhatsApp/Email;
    
    |Pengguna Justifiqa|
    --> (B)
    :Terima & Masukkan Kode OTP;
    
    |Backend Independen Justifiqa|
    if (Apakah OTP Valid & Belum Expire?) then (Ya)
      :Generate Token Sesi JWT Independen Justifiqa;
      :Catat Log Login Sukses (IP & Device);
      :Arahkan ke Dasbor (Klien atau Advokat);
      |Pengguna Justifiqa|
      stop
    else (Tidak)
      |Backend Independen Justifiqa|
      :Tampilkan Error "Kode OTP Salah/Kadaluarsa";
      |Pengguna Justifiqa|
      if (Minta Kirim Ulang OTP?) then (Ya)
        :Klik Resend OTP;
        |Backend Independen Justifiqa|
        :Generate & Kirim OTP Baru;
        --> (B)
        detach
      else (Tidak)
        stop
      endif
    endif
  else (Ya)
    |Backend Independen Justifiqa|
    :Tampilkan Error "Akun Suspended karena Due Process Legal";
    |Pengguna Justifiqa|
    stop
  endif
else (Tidak)
  |Backend Independen Justifiqa|
  :Tampilkan Error "Email/No HP atau Password Salah";
  |Pengguna Justifiqa|
  if (Coba Login Lagi?) then (Ya)
    --> (A)
    detach
  else (Tidak)
    stop
  endif
endif
@enduml
```

---

### AD-J-03: Konsultasi Hukum & Pembayaran Escrow (J-UC03, J-UC04, J-UC05, J-UC10)
*Diagram alur reservasi, pembayaran escrow yang ditahan sistem Justifiqa, pelaksanaan sesi chat E2EE, hingga pelepasan dana setelah sesi selesai.*

```plantuml
@startuml
|Klien Justifiqa|
start
:Buka Katalog Advokat & Notaris;
:Filter Spesialisasi & Pilih Level Konsultasi (Gratis / Premium / Pro);

if (Apakah Level Konsultasi = Gratisan / Legal Triage?) then (Ya - Rp 0)
  :Pilih Sesi Triage 15 Menit (Advokat Muda / Paralegal);
  |Backend Independen Justifiqa|
  :Buka Ruang Chat E2EE Langsung (Tanpa Invoice / Escrow);
  :Mulai Countdown Timer Triage (Maks 15 Menit Text Chat);
  
  fork
    |Advokat Justifiqa|
    :Memberikan Jawaban Dasar / Orientasi Hukum;
  fork again
    |Klien Justifiqa|
    :Mengajukan Pertanyaan Dasar / Ringan;
  end fork
  
  |Backend Independen Justifiqa|
  :Akhiri Sesi Triage 15 Menit;
  if (Apakah Klien Membutuhkan Analisis Kasus Lanjutan?) then (Ya - Upgrade Premium/Pro)
    --> (A)
    detach
  else (Tidak - Selesai)
    :Arahkan Klien ke Modul Ulasan & Rating;
    stop
  endif
else (Tidak - Konsultasi Premium / Pro)
  --> (A)
  |Klien Justifiqa|
  :Pilih Advokat Sesuai Tier, Mode Sesi (Online vs Offline Tatap Muka), & Jadwal Sesi;
  :Klik Konfirmasi Reservasi;

  |Backend Independen Justifiqa|
  :Hitung Biaya Sesuai Tier & Periksa Saldo Virtual Token (Welcome Bonus Rp 100.000 / Non-Cashable);
  if (Apakah Saldo Virtual Token Mencukupi 100% Tagihan?) then (Ya - Full Virtual Token)
    :Potong Saldo Virtual Token Klien (Uang-Uangan / Diamond);
    :Catat Reservasi Berbasis Virtual Token (Tanpa Escrow Tunai Rupiah);
  else (Tidak - Bayar Penuh / Split Payment)
    if (Apakah Klien Menggunakan Sebagian Virtual Token?) then (Ya - Split Payment)
      :Potong Saldo Virtual Token Klien (Potongan Diskon Non-Tunai);
      :Buat Tagihan Sisa Tunai (Invoice Rupiah) & Kirim ke Payment Gateway;
    else (Tidak - Bayar 100% Tunai via PG)
      :Buat Tagihan Penuh (Invoice Rupiah) & Kirim ke Payment Gateway;
    endif
    
    |Payment Gateway|
    :Tampilkan Pilihan Metode Pembayaran (VA, E-Wallet, CC);
    
    |Klien Justifiqa|
    :Lakukan Pembayaran Sesuai Nominal Sisa / Penuh;
    
    |Payment Gateway|
    if (Apakah Webhook Status Transaksi PAID / SUCCESS?) then (Ya - PAID)
      |Backend Independen Justifiqa|
      :Tahan Dana Tunai Pembayaran PG ke Rekening Escrow Sementara;
    else (Tidak - Gagal / Kadaluwarsa)
      |Backend Independen Justifiqa|
      :Kembalikan Saldo Virtual Token Klien (Rollback);
      :Batalkan Invoice & Tampilkan Error "Pembayaran Gagal";
      
      |Klien Justifiqa|
      if (Coba Pilih Metode Bayar Lain / Jadwal Ulang?) then (Ya)
        --> (A)
        detach
      else (Tidak)
        stop
      endif
    endif
  endif

  |Backend Independen Justifiqa|
  :Ubah Status Reservasi Jadi TERKONFIRMASI;
  :Kirim Pengingat Jadwal ke Advokat & Klien;
  
  if (Apakah Mode Konsultasi = Offline Tatap Muka?) then (Ya - Offline QR Handshake)
    |Klien Justifiqa|
    :Datang ke Kantor Hukum Resmi / Safe Meeting Point Terverifikasi;
    :Pindai QR Code Check-in milik Advokat;
    
    |Backend Independen Justifiqa|
    :Verifikasi Handshake Kehadiran Fisik & Mulai Sesi Tatap Muka;
    :Mulai Countdown Timer Sesi Offline (Durasi Baku 60 Menit - Slot Standard);
    
    fork
      |Advokat Justifiqa|
      :Memberikan Analisis Hukum Tatap Muka;
    fork again
      |Klien Justifiqa|
      :Mengajukan Pertanyaan & Pembahasan Mendalam;
    end fork
    
    |Backend Independen Justifiqa|
    if (Apakah Klien Pindai QR Code Check-out ATAU Waktu Sesi > 120 Menit Sejak Check-in?) then (QR Check-out Manual)
      |Klien Justifiqa|
      :Pindai QR Code Check-out saat Sesi Selesai;
    else (Lupa Check-out - Grace Period 120m Habis)
      |Backend Independen Justifiqa|
      :Eksekusi Systemic Auto Check-out (Mencegah Escrow Menggantung);
    endif
  else (Tidak - Online E2EE Chat Room)
    fork
      |Advokat Justifiqa|
      :Masuk ke Ruang Chat E2EE pada Jadwal yang Ditentukan;
    fork again
      |Klien Justifiqa|
      :Masuk ke Ruang Chat E2EE & Kirim Pesan Pertama;
    end fork
    
    |Backend Independen Justifiqa|
    :Tunggu Respons Substansial Pertama Advokat (Active Session Trigger);
    :Mulai Countdown Timer Sesi (Durasi 45 - 90 Menit - Fair Clock Engine);
    
    repeat
      fork
        |Advokat Justifiqa|
        :Kirim Pesan Teks / Audio / Video (Advice Hukum);
      fork again
        |Klien Justifiqa|
        :Kirim Pesan Teks / Audio / Video (Pertanyaan / Diskusi);
      end fork
      
      |Backend Independen Justifiqa|
      :Pre-Broadcast Inline DLP Interception (~30ms Scan Sebelum Diteruskan ke Lawan Bicara);
      if (Terdeteksi Ajakan Ketemuan Offline Ilegal / Tukar Kontak Pribadi?) then (Ya - Pelanggaran)
        :Blokir & Cegat Pesan secara Real-Time (Message Dropped - Lawan Bicara 0% Melihat);
        :Kirim Peringatan Keras Keamanan ke Pengirim & Catat Log Percobaan Pelanggaran;
        if (Apakah Percobaan Berulang >= 2x / Evasion?) then (Ya - Instant Freeze & Suspend)
          :Bekukan Sesi Obrolan Permanen & Tahan Dana Escrow Sementara;
          :Generate Security Alert & Eskalasi Insiden ke Antrean Investigasi Admin (Lihat AD-J-10);
          stop
        else (Tidak - Level 1 Block)
        endif
      else (Tidak - Lolos DLP / Aman)
        :Broadcast Pesan ke UI Lawan Bicara (Message Delivered);
      endif

      if (Apakah Advokat Diam / Tidak Merespons > 5 Menit?) then (Ya - Auto-Pause)
        :Jeda Sementara (PAUSE) Countdown Timer Sesi & Kirim SLA Alert ke Advokat;
        if (Apakah Advokat Tidak Aktif / AFK > 15 Menit?) then (Ya - AFK Abandonment)
          :Aktifkan Hak Klaim Refund Escrow 100% untuk Klien;
          |Klien Justifiqa|
          :Ajukan Laporan Pelanggaran / Klaim Refund (Lihat AD-J-21 / J-UC21);
          stop
        else (Tidak - Advokat Membalas)
          :Lanjutkan (RESUME) Countdown Timer Sesi;
        endif
      else (Tidak - Respons Lancar)
      endif
    repeat while (Waktu Sesi Masih Tersisa & Sesi Belum Diakhiri?) is (Ya - Lanjut Chatting)
    
    |Backend Independen Justifiqa|
    :Akhiri Waktu Live Chat 60 Menit & Kunci Ruang Chat E2EE (Read-Only History);
    :Nonaktifkan Fitur Panggilan Suara & Video (Voice/Video Call Disabled);
    :Ubah Status Perkara Jadi PENDING_DELIVERABLE;
    :Buka Ruang Kerja Asinkron (Asynchronous Deliverable Thread) di Dasbor Perkara;
    :Aktifkan Sistem Tiket Komentar Terstruktur [KLARIFIKASI FAKTA] / [REVISI KLAUSUL];
  endif

  |Backend Independen Justifiqa|
  :Arsip Log Metadata Sesi & Tutup Ruang Chat E2EE;

  |Advokat Justifiqa|
  :Mengisi & Mengarsip Catatan Sesi IRAC Note (Lihat AD-J-08 / J-UC11);

  if (Apakah Level Konsultasi = Tier 2 Premium?) then (Ya - Premium Advice Summary)
    |Advokat Justifiqa|
    :Susun Dokumen Laporan Saran Hukum (Client Advice Summary v1);
    :Unggah Laporan ke Dasbor Klien;
    |Klien Justifiqa|
    :Review Laporan Saran Hukum di Dasbor;
    while (Apakah Klien Mengajukan Tiket [KLARIFIKASI SARAN] & Kuota Putaran < 2x & SLA 2x24 Jam Belum Habis?) is (Ya - Gunakan Ruang Asinkron)
      |Klien Justifiqa|
      :Kirim Pertanyaan Klarifikasi Terbatas;
      |Advokat Justifiqa|
      :Berikan Jawaban Penjelasan / Perbarui Laporan;
      |Klien Justifiqa|
      :Review Jawaban / Laporan Pembaruan;
    endwhile (Tidak - Laporan Disetujui / Kuota Habis / SLA Habis)
    |Backend Independen Justifiqa|
    :Kunci Permanen Ruang Kerja Asinkron (THREAD_LOCKED);
    :Cairkan Dana Escrow Tunai ke Advokat (Potong Fee & PPh 21);
  else (Tidak - Tier 3 Pro Legal Drafting / Opinion)
    |Advokat Justifiqa|
    :Susun Draf Dokumen Hukum Final (Drafting v1 - Lihat AD-J-10);
    :Unggah Draf Dokumen ke Dasbor Klien;
    |Klien Justifiqa|
    :Review Draf Dokumen Hukum di Dasbor;
    while (Apakah Klien Mengajukan Tiket [REVISI KLAUSUL] & Kuota Putaran < 2x & SLA 3x24 Jam Belum Habis?) is (Ya - Gunakan Ruang Asinkron)
      |Klien Justifiqa|
      :Kirim Catatan Revisi Klausul Terbatas;
      |Advokat Justifiqa|
      :Perbarui & Unggah Draf Revisi Dokumen (v2 / v3);
      |Klien Justifiqa|
      :Review Draf Revisi Terbaru;
    endwhile (Tidak - Draf Disetujui / Kuota Habis / SLA Habis)
    |Backend Independen Justifiqa|
    :Kunci Permanen Ruang Kerja Asinkron (THREAD_LOCKED);
    :Cairkan Dana Escrow Tunai ke Advokat (Potong Fee & PPh 21);
  endif
  :Arahkan Klien ke Modul Ulasan & Rating (Lihat AD-J-13);
  stop
endif
@enduml
```

---

### AD-J-04: Mengatur Status Ketersediaan Praktik Advokat (J-UC09)
*Diagram alur pengaturan jadwal praktik dan toggle ketersediaan real-time advokat.*

```plantuml
@startuml
|Advokat Justifiqa|
start
:Buka Dasbor Advokat Menu Pengaturan Jadwal Praktik;
--> (A)
:Tambah, Ubah, atau Hapus Slot Hari & Jam Operasional;
:Klik Simpan Perubahan Jadwal;

|Backend Independen Justifiqa|
:Validasi Apakah Ada Reservasi Klien Eksisting pada Slot Tersebut?;
if (Apakah Ada Reservasi Klien yang Terkonfirmasi & Bentrok?) then (Ya - Ada Reservasi)
  :Tolak Perubahan & Tampilkan Error "Jadwal Tidak Dapat Diubah karena Ada Reservasi Klien Aktif";
  |Advokat Justifiqa|
  if (Ingin Atur Kembali Slot Jadwal Lain?) then (Ya)
    --> (A)
    detach
  else (Tidak - Batal)
    stop
  endif
else (Tidak - Slot Aman)
  |Backend Independen Justifiqa|
  :Simpan Jadwal Operasional Baru ke Database Justifiqa;
  :Perbarui Ketersediaan Slot di Katalog Pencarian Klien;
  stop
endif
@enduml
```

---

### AD-J-05: Mengunggah Berkas Perkara E2EE Zero-Knowledge (J-UC13)
*Diagram alur pengunggahan bukti perkara yang dienkripsi sebelum meninggalkan perangkat klien agar tidak dapat dibaca oleh server maupun pihak ketiga.*

```plantuml
@startuml
|Klien Justifiqa|
start
:Buka Ruang Chat Konsultasi Aktif dengan Advokat;
:Klik Tombol "Unggah Bukti Perkara";
:Pilih Dokumen Hukum (PDF/JPG, Maks 15 MB);
:Sistem Klien Melakukan Enkripsi E2EE Lokal (Zero-Knowledge);

|Backend Independen Justifiqa|
:Terima Blob Terenkripsi & Verifikasi Hash Intergritas;
:Simpan Blob di WORM Storage Hukum;
:Teruskan Notifikasi File Baru ke Ruang Chat Advokat;

|Advokat Justifiqa|
:Klik Unduh Berkas Perkara;
:Sistem Advokat Melakukan Dekripsi Lokal dengan Kunci Sesi;
:Review Bukti Perkara (Kontrak, Sertifikat, Bukti Transfer);
:Berikan Analisis Hukum Berdasarkan Bukti Terlampir;
stop
@enduml
```

---

### AD-J-06: Membuat & Memfinalisasi Draf Kontrak Hukum Bermeterai (J-UC12, J-UC14)
*Diagram alur pembuatan opini hukum, surat somasi, atau kontrak kerja sama oleh advokat menggunakan generator klausul pintar dan finalisasi pembubuhan e-Meterai resmi Peruri yang difasilitasi platform (*Platform-Facilitated Stamping*) dengan pemotongan saldo dompet advokat.*

```plantuml
@startuml
title Activity Diagram: AD-J-06 - Membuat & Memfinalisasi Draf Kontrak Hukum Bermeterai (J-UC12, J-UC14)
|Advokat Justifiqa|
start
:Buka Menu "Generator Draf Hukum / Legal Opinion";
:Pilih Template Dokumen (Surat Somasi / Perjanjian / LO);
repeat
  |Advokat Justifiqa|
  :Isi / Perbarui Klausul Hukum & Identitas Para Pihak (Drafting v1 / Revisi v2/v3);
  :Simpan & Review Versi Draf (Versioning v1/v2/v3);
  if (Apakah Dokumen Memerlukan Pembubuhan e-Meterai?) then (Ya - Perlu e-Meterai)
    :Klik Tombol "Finalisasi Dokumen & Bubuhkan e-Meterai Resmi";
    
    |Backend Independen Justifiqa|
    :Kunci Versi Draf (Immutable Final Version);
    
    repeat
      :Validasi Saldo Dompet Advokat (Cek Biaya e-Meterai Rp12.000);
      if (Apakah Saldo Dompet Advokat Cukup?) then (Ya - Saldo Cukup)
        :Potong Saldo Dompet Advokat;
        :Kirim Request Stamping ke API Mekari Sign;
      else (Tidak - Saldo Dompet Kurang / Kosong)
        |Advokat Justifiqa|
        :Tampilkan Alert "⚠️ Saldo Dompet Kurang untuk e-Meterai";
        :Lakukan Top-Up Dompet (Lihat AD-J-22);
      endif
    repeat while (Apakah Saldo Sudah Dipotong & Request Disubmit?) is (Belum - Ulangi Cek Saldo)
    -> Sudah Disubmit ke API;

    |API Mekari Sign (Distributor e-Meterai)|
    :Validasi Request & Bubuhkan Stempel e-Meterai Peruri;
    :Sertakan Digital Signature Kriptografi SHA-256;
    
    |Backend Independen Justifiqa|
    :Simpan Dokumen Bersertifikat di WORM Storage;
  else (Tidak - Draf Internal / Tanpa Meterai)
    |Backend Independen Justifiqa|
    :Simpan Draf Biasa di Database;
  endif

  fork
    |Backend Independen Justifiqa|
    :Kirim Konfirmasi Sukses & Tautan Unduh ke Advokat;
    
    |Advokat Justifiqa|
    :Terima Konfirmasi & Unduh Arsip Dokumen Bermeterai;
  fork again
    |Backend Independen Justifiqa|
    :Kirim Notifikasi Dokumen Siap Diperiksa ke Klien;
    
    |Klien Justifiqa|
    :Terima & Unduh Dokumen Hukum di Asynchronous Deliverable Thread;
  end fork
while (Apakah Klien Mengajukan Tiket [REVISI KLAUSUL] di Async Thread (Lolos DLP) & Kuota Putaran Revisi < 2x & SLA 3x24 Jam Belum Habis?) is (Ya - Butuh Revisi Draf v2/v3)
  |Advokat Justifiqa|
  :Perbarui Draf Dokumen Hukum & Unggah Revisi;
  |Klien Justifiqa|
  :Review Draf Revisi Terbaru;
endwhile (Tidak - Draf Disetujui / Kuota Habis / SLA Habis)

|Backend Independen Justifiqa|
:Kunci Permanen Ruang Kerja Asinkron (THREAD_LOCKED);
:Cairkan Dana Escrow Tunai ke Dompet Advokat (Potong Fee & PPh 21);
stop
@enduml
```

---

### AD-J-07: Konsultasi Pro Bono SKTM (J-UC15)
*Diagram alur pengajuan bantuan hukum cuma-cuma (Pro Bono) melalui verifikasi Surat Keterangan Tidak Mampu (SKTM) Dukcapil dengan mekanisme pemilihan katalog mandiri.*

```plantuml
@startuml
|Klien Justifiqa|
start
:Pilih Menu "Bantuan Hukum Pro Bono (Gratis)";
:Isi Formulir Pengajuan Kasus (Pidana/Perdata);
:Unggah Foto SKTM (Surat Keterangan Tidak Mampu) & KTP;
:Klik Ajukan Pro Bono;

|Backend Independen Justifiqa|
:Kirim Payload SKTM ke API Verifikasi Dukcapil / Dinsos;
if (SKTM Valid & Terverifikasi?) then (Ya)
  :Ubah Status Pengajuan Jadi APPROVED;
  :Buka Kunci (Unlock) Katalog Khusus Advokat Pro Bono;
  
  |Klien Justifiqa|
  --> (A)
  :Pilih Advokat & Slot Waktu di Katalog Pro Bono;
  
  |Backend Independen Justifiqa|
  :Kirim Request Reservasi Pro Bono Rp0 ke Advokat;
  
  |Advokat Justifiqa|
  if (Menerima Reservasi Pro Bono?) then (Ya)
    :Terima Reservasi Pro Bono;
    :Lakukan Sesi Konsultasi & Bantuan Hukum (J-UC04);
  else (Tidak / Berhalangan)
    |Backend Independen Justifiqa|
    :Kirim Notifikasi Penolakan/Slot Penuh ke Klien;
    |Klien Justifiqa|
    if (Ingin Pilih Ulang Advokat / Slot Lain?) then (Ya)
      --> (A)
      detach
    else (Tidak)
      stop
    endif
  endif
else (Tidak)
  |Backend Independen Justifiqa|
  :Tolak Pengajuan & Tampilkan Alasan "SKTM Tidak Terverifikasi";
  |Klien Justifiqa|
  :Tampilkan Opsi Beralih ke Konsultasi Berbayar Reguler;
endif
stop
@enduml
```

---

### AD-J-08: Membuat Catatan Sesi IRAC Note Advokat (J-UC11)
*Diagram alur pembuatan catatan terstruktur metode IRAC (Issue, Rule, Application, Conclusion) oleh advokat.*

```plantuml
@startuml
|Advokat Justifiqa|
start
:Selesai Melayani Sesi Konsultasi Hukum;
:Buka Menu "Catatan Sesi Advokat (IRAC Framework)";

|Backend Independen Justifiqa|
if (Apakah Level Konsultasi == Tier 1 Gratis / Triage 15 Menit?) then (Ya - Tidak Relevan)
  :Tolak Akses Pembuatan IRAC Note (Tier 1 Hanya Orientasi & Penapisan Awal - Tidak Mendapatkan IRAC);
  stop
else (Tidak - Tier 2 Premium atau Tier 3 Pro)
  |Advokat Justifiqa|
  :Isi Kolom Issue, Rule, Application, Conclusion;
  :Klik Simpan Catatan IRAC Internal;

  |Backend Independen Justifiqa|
  :Enkripsi Catatan dengan Field-Level Encryption (AES-256);
  :Simpan di Arsip Perkara Klien Justifiqa (access_level = INTERNAL_ONLY - Work Product Privilege);

  if (Apakah Level Konsultasi == Tier 2 Premium?) then (Ya - Butuh Client Advice Summary)
    |Advokat Justifiqa|
    :Susun & Rilis Laporan Saran Hukum (Client Advice Summary) ke Dasbor Klien;
    
    |Klien Justifiqa|
    :Baca Laporan Saran & Rekomendasi Hukum di Ruang Kerja Asinkron;
    
    repeat
      if (Apakah Klien Mengajukan Tiket [KLARIFIKASI FAKTA] & Kuota Putaran < 2x & SLA 2x24 Jam Belum Habis?) then (Ya - Klarifikasi Terbatas)
        :Kirim Pertanyaan / Tambahan Fakta Baru di Async Thread;
        |Advokat Justifiqa|
        :Perbarui Internal IRAC Note (I - Issue & A - Application) Berdasarkan Fakta Lengkap Terbaru;
        :Kirim Balasan Penjelasan / Perbarui Client Advice Summary;
        |Klien Justifiqa|
      else (Tidak - Setuju / Kuota Habis / SLA Habis)
      endif
    repeat while (Apakah Klien Masih Mengajukan Klarifikasi & Kuota Putaran < 2x & SLA 2x24 Jam Belum Habis?) is (Ya - Lanjut Q&A Terbatas)
    
    |Backend Independen Justifiqa|
    :Kunci Permanen Ruang Kerja Asinkron (THREAD_LOCKED - Cegah Konsultasi Gratis Tanpa Batas);
    if (Apakah Kuota Klarifikasi 2x Habis ATAU SLA 2x24 Jam Habis?) then (Ya)
      :Tampilkan Prompt "Batas Kuota Klarifikasi Sesi Ini Habis - Buat Reservasi Baru untuk Topik Tambahan";
    else (Tidak - Disetujui Klien)
    endif
    :Disetujui Klien ATAU SLA Habis -> Cairkan Dana Escrow Tunai ke Advokat (Potong Fee & PPh 21);
  else (Tidak - Tier 3 Pro)
    :Catatan IRAC Internal Tersimpan Aman di Rekam Perkara (Work Product Privilege untuk Dasar Analisis);
    :Lanjut ke Pembuatan Draf Dokumen Hukum & Alur Revisi Klausul Klien (AD-J-10 / J-UC12 / J-UC14);
  endif
endif
stop
@enduml
```

---

### AD-J-09: Verifikasi Kredensial & Sanitasi Profil/Media 3-Lapisan Advokat Mitra (J-UC16)
*Diagram alur verifikasi kredensial profesi Peradi serta pertahanan 3-Lapisan sanitasi profil/media anti-bypass kontak pribadi.*

```plantuml
@startuml
|Admin Legal Justifiqa|
start
:Buka Dasbor Admin Menu "Verifikasi Advokat Baru";
:Periksa Dokumen KTP, Kartu Peradi, & SK SIPP/Notaris;
:Verifikasi Keabsahan Nomor SIPP ke Pangkalan Data Mahkamah Agung / Peradi;
if (Kredensial Sah & Aktif?) then (Ya)
  |Backend Independen Justifiqa|
  :Ubah Status Akun Advokat Jadi VERIFIED / AKTIF;
  :Kunci Nama Tampilan (Layer 1: Immutable Display Name dari KTP/Peradi);
  :Kirim Email Pemberitahuan Akun Aktif;
else (Tidak - Palsu/Kadaluarsa)
  |Backend Independen Justifiqa|
  :Ubah Status Akun Jadi REJECTED;
  :Kirim Email Alasan Penolakan Kredensial;
  stop
endif

|Advokat Justifiqa|
:Perbarui Deskripsi Profil (Bio/Pengalaman) ATAU Unggah Foto Profil;

|Backend Independen Justifiqa|
if (Apakah Perbaruan = Foto Profil / Avatar?) then (Ya - Media Upload)
  :Jalankan Layer 3: Media OCR Sandbox Engine (Ekstrak Teks Gambar);
  if (Terdeteksi Nomor HP / Steganografi Kontak di Gambar?) then (Ya - Kontak Ilegal)
    :Tolak Unggahan (422 Unprocessable Media - Contact Detected);
    stop
  else (Tidak - Gambar Bersih)
    :Publikasikan Foto Profil Terverifikasi;
  endif
else (Tidak - Perbaruan Teks Bio/Deskripsi)
  :Jalankan Layer 2: Pre-Publication NLP Contact Scanner;
  if (Terdeteksi Pola Nomor HP / Email / Sosmed di Teks?) then (Ya - Kontak Ilegal)
    :Tolak Pembaruan (400 Profile Rejected - DLP Violation);
    stop
  else (Tidak - Teks Bersih)
    :Publikasikan Deskripsi Profil Advokat;
  endif
endif
stop
@enduml
```

---

### AD-J-10: Moderasi Akun & Due Process Suspend Admin Justifiqa (J-UC17)
*Diagram alur penanganan laporan pelanggaran kode etik, investigasi Due Process of Law, pengajuan sanggahan, dan putusan akhir akun advokat.*

```plantuml
@startuml
title Activity Diagram: AD-J-10 - Moderasi Akun & Due Process Suspend Admin Justifiqa (J-UC17)
|Admin Legal Justifiqa / Behavioral Fraud Engine|
start
:Buka Antrean Investigasi Moderasi (Menerima Laporan Klien J-UC21 ATAU Security Alert Otomatis DLP Backend);
:Pilih Akun Advokat Terlapor & Periksa Barang Bukti WORM SHA-256 / Log Anomali;

if (Apakah Bukti Permulaan Sah / Skor Anomali Kritis Terverifikasi?) then (Ya - Bukti Valid)
  if (Apakah Tergolong Pelanggaran Berat / Kritis?) then (Ya - Pelanggaran Berat)
    :Jalankan Protokol Due Process Investigation;
    :Klik Tombol "🛑 Suspend Akun & Kirim Panggilan Klarifikasi";
    
    |Backend Independen Justifiqa|
    :Ubah Status Akun Terlapor Jadi SUSPENDED & Sembunyikan Katalog (UNLISTED);
    if (Apakah Mitra Sedang Dalam Sesi Konsultasi Aktif?) then (Ya - IN_PROGRESS)
      :Biarkan Sesi Aktif Berlangsung Hingga Selesai (Graceful Finish);
      :Tahan Dana Escrow Sesi Aktif (Frozen in Escrow);
    else (Tidak - Idle)
    endif
    :Batalkan Seluruh Reservasi Mendatang & Auto-Refund 100% Dana Klien;
    :Generate Surat Panggilan & Stempel Hash SHA-256 ke WORM Storage;
    :Aktifkan Timer Countdown Masa Sanggah/Banding (14 Hari Kerja);
    :Kirim Email, SMS, & Push Notifikasi Surat Panggilan ke Advokat;
    
    |Advokat Terlapor|
    :Menerima Notifikasi & Mengunduh Surat Panggilan Ber-hash SHA-256;
    :Melihat Timer Masa Sanggah 14 Hari di Dasbor Advokat;
    
    if (Mengajukan Berkas Sanggahan / Banding?) then (Ya - Mengajukan Pembelaan)
      :Unggah Berkas Pembelaan & Bukti Counter-Evidence;
      |Backend Independen Justifiqa|
      :Simpan Berkas Sanggahan ke WORM & Notifikasikan Admin;
    else (Tidak / Timer Habis - Putusan Verstek)
      |Backend Independen Justifiqa|
      :Tandai Kasus sebagai "No Defense Submitted (Verstek)";
    endif
    
    |Admin Legal Justifiqa|
    :Input Putusan Akhir Sidang Etik (Dewan Kehormatan);
    if (Terbukti Bersalah Melanggar Etik / Penggelapan Transaksi?) then (Ya - Sanksi Berat Reputational Death)
      |Backend Independen Justifiqa|
      :Ubah Status Akun Jadi REVOKED / PERMANENT_BAN & Hanguskan Poin Reputasi;
      :Terbitkan Surat Keputusan Pemecatan Ber-hash SHA-256;
      :Kirim Laporan Pelanggaran Integritas Digital Resmi ke Dewan Kehormatan Peradi;
    else (Tidak - Rehabilitasi)
      |Backend Independen Justifiqa|
      :Pulihkan Status Akun Jadi VERIFIED / AKTIF (Rehabilitasi);
      :Terbitkan Surat Rehabilitasi Nama Baik Ber-hash SHA-256;
    endif
  else (Tidak - Pelanggaran Ringan / Administratif)
    |Admin Legal Justifiqa|
    :Terbitkan Peringatan Tertulis / Pembinaan (Tanpa Suspend Akun);
    fork
      |Backend Independen Justifiqa|
      :Catat Surat Teguran ke WORM Storage;
    fork again
      |Backend Independen Justifiqa|
      :Kirim Email & Push Notifikasi Surat Teguran;
      |Advokat Terlapor|
      :Menerima & Membaca Surat Peringatan Tertulis;
    end fork
  endif
else (Tidak - Bukti Tidak Sah / Laporan Palsu)
  |Admin Legal Justifiqa|
  :Tolak & Arsip Laporan sebagai Tidak Terbukti (Clear);
  |Backend Independen Justifiqa|
  :Update Status Laporan = DISMISSED;
endif
stop
@enduml
```

---

### AD-J-11: Pencairan Dana Escrow & Perhitungan PPh 21 Advokat (J-UC19)
*Diagram alur penarikan dana honorarium advokat dari dompet digital ke rekening bank pribadi, pemotongan pajak PPh 21 otomatis, dan auto-rollback jika transfer gagal.*

```plantuml
@startuml
|Advokat Justifiqa|
start
:Buka Menu Dompet Saldo Advokat Justifiqa;
:Klik Penarikan Dana (Withdrawal) ke Rekening Bank Bersangkutan;

|Backend Independen Justifiqa|
:Periksa Saldo Dompet Tunai Available (Hanya Escrow Tunai yang Sudah Release dari Deliverable Approved - Bukan Token Virtual);
:Validasi Rekening Bank Tujuan Advokat;
:Hitung Potongan Pajak PPh 21 Sesuai Regulasi Ditjen Pajak;
:Buat Instruksi Pencairan Dana Bersih;
:Kirim Request Transfer ke Payment Gateway Disbursement;

|Payment Gateway|
:Proses Transfer Real-time ke Bank Advokat;
:Kirim Webhook Status Transfer ke Backend Justifiqa;

|Backend Independen Justifiqa|
if (Status Webhook PG = SUCCESS?) then (Ya)
  :Kurangi Saldo Available Advokat & Terbitkan Bukti Potong PPh 21;
  :Generate Hash Log SHA-256 Transaksi ke WORM Hash Storage;
  :Kirim Email Bukti Transfer & Bukti Potong Pajak ke Advokat;
  |Advokat Justifiqa|
  :Terima Email Bukti Transfer & Unduh Bukti Potong PPh 21;
else (Tidak / FAILED)
  |Backend Independen Justifiqa|
  :Eksekusi Rollback Saldo Available Advokat (Saldo Kembali Utuh);
  :Generate Hash Log SHA-256 Kegagalan Transfer ke WORM Storage;
  :Kirim Notifikasi Error Transfer ke HP Advokat ("Transfer Gagal, Saldo Dikembalikan");
  |Advokat Justifiqa|
  :Terima Notifikasi Error & Periksa Saldo yang Kembali Utuh;
endif
stop
@enduml
```

---

### AD-J-12: Memantau Laporan Keuangan Escrow & Audit WORM (J-UC18)
*Diagram alur pengawasan buku besar escrow, verifikasi bagi hasil platform (25%/75%), dan eksport bukti pajak PPh 21 ber-hash WORM SHA-256 oleh Admin Justifiqa.*

```plantuml
@startuml
|Admin Justifiqa|
start
:Login ke Portal Backoffice Admin Justifiqa;
:Buka Modul Keuangan & Buku Besar Escrow;
:Filter Rentang Waktu & Cari Riwayat Pencairan Dana Mitra;

|Backend Independen Justifiqa|
:Ambil Data Rekonsiliasi Saldo & Log Hash WORM SHA-256;
:Tampilkan Tabel Rekapitulasi Bagi Hasil (25% Platform / 75% Advokat) & PPh 21;

|Admin Justifiqa|
if (Tindak Lanjut Laporan?) then (Eksport Data Pajak / DJP)
  :Klik Unduh Laporan Rekapitulasi PPh 21 & Hash WORM;
  
  |Backend Independen Justifiqa|
  :Generate File Excel/PDF dengan Digital Signature WORM SHA-256;
  :Kirim File Laporan ke Workstation Admin;
else (Audit Rutin Selesai)
  |Admin Justifiqa|
  :Tutup Modul Keuangan Escrow;
endif
stop
@enduml
```

---

### AD-J-13: Memberikan Ulasan & Rating Advokat (J-UC06)
*Diagram alur pemberian penilaian pasca-sesi konsultasi dengan proteksi privasi anonimisasi nama publik sesuai UU PDP dan kalkulasi agregat rating otomatis.*

```plantuml
@startuml
|Klien Justifiqa|
start
:Buka Menu "Riwayat Konsultasi" atau Pop-up Penilaian Sesi;
:Pilih Sesi Konsultasi yang Telah Selesai (DONE);
:Pilih Skor Rating Bintang (1 - 5 Bintang);
:Tulis Ulasan Deskriptif Kualitas Layanan Advokat;
if (Aktifkan Anonimasi Nama Publik?) then (Ya)
  :Centang Toggle "Anonimkan Nama Saya di Publik (UU PDP)";
else (Tidak)
  :Gunakan Identitas Nama Profil Asli;
endif
:Klik Kirim Ulasan & Rating;

|Backend Independen Justifiqa|
:Validasi Status Sesi (Must Be DONE) & Cek Duplikasi Ulasan;
if (Sesi Valid & Belum Direview?) then (Ya)
  if (Status Anonimasi = AKTIF?) then (Ya)
    :Masking Identitas Klien (Misal: K****n) pada Direktori Publik;
  else (Tidak)
    :Tampilkan Nama Profil Klien pada Direktori Publik;
  endif
  :Simpan Data Ulasan & Hitung Ulang Agregat Rating Advokat;
  if (Rating Agregat <= 2 Bintang?) then (Ya)
    :Kirim Internal Quality Alert ke Dasbor Advokat;
  else (Tidak - Normal)
  endif
  :Kirim Notifikasi Konfirmasi ke Klien;
  
  |Klien Justifiqa|
  :Terima Konfirmasi "Terima Kasih atas Penilaian Anda";
else (Tidak / Tidak Valid)
  |Backend Independen Justifiqa|
  :Tampilkan Error "Sesi Belum Selesai atau Sudah Diberi Ulasan";
  
  |Klien Justifiqa|
  :Terima Pesan Error & Kembali ke Daftar Riwayat;
endif
stop
@enduml
```

---

### AD-J-14: [DILEBUR KE DALAM AD-J-06]
*Catatan: Skenario J-UC14 (Pembubuhan e-Meterai Peruri) telah ditiadakan sebagai diagram mandiri dan dilebur seutuhnya ke dalam **AD-J-06 (J-UC12, J-UC14)** sebagai alur kerja terpadu perumusan dan finalisasi dokumen bermeterai yang difasilitasi platform (*Platform-Facilitated Stamping*) dengan pemotongan saldo dompet advokat.*

### AD-J-21: Melaporkan Dugaan Pelanggaran Etik Advokat (J-UC21)
*Diagram alur pengajuan laporan dugaan pelanggaran kode etik, kerahasiaan, atau wanprestasi advokat oleh klien beserta lampiran barang bukti digital terverifikasi SHA-256.*

```plantuml
@startuml
title Activity Diagram: AD-J-21 - Melaporkan Dugaan Pelanggaran Etik Advokat (J-UC21)
|Klien Justifiqa|
start
:Buka Riwayat Konsultasi / Profil Advokat;
:Klik Tombol "Laporkan Pelanggaran Etik / Wanprestasi";
:Pilih Kategori Pelanggaran (Kerahasiaan, Pemerasan, Benturan Kepentingan, Wanprestasi);
:Tulis Kronologi Kejadian Pelanggaran;

if (Apakah Melampirkan Bukti Transkrip E2EE / Dokumen Pendukung?) then (Ya - Lampirkan Bukti)
  :Unggah Ekspor Transkrip E2EE / Dokumen Bukti;
  |Backend Independen Justifiqa|
  :Verifikasi Enkripsi & Generate Stempel Hash SHA-256 Bukti;
  |Klien Justifiqa|
else (Tidak - Tanpa Bukti Lampiran)
  :Tampilkan Peringatan "Laporan Tanpa Bukti Sah Berisiko Ditolak Saat Triage";
endif

:Centang Pernyataan Kebenaran Laporan & Klik Kirim Laporan;

|Backend Independen Justifiqa|
:Simpan Laporan ke Database (`moderation_reports`);
:Catat Hash SHA-256 Tiket Laporan ke WORM Storage;
:Teruskan Tiket Laporan ke Antrean Investigasi Admin Legal (`AD-J-10`);
:Kirim Email & Notifikasi Nomor Tiket Laporan kepada Klien;

|Klien Justifiqa|
:Tampilkan Konfirmasi Laporan Diterima & Nomor Tiket Investigasi;
stop
@enduml
```

---

### AD-J-22: Mengisi Saldo Dompet Advokat (Top-Up / Cash-In - J-UC22)
*Diagram alur pengisian saldo dompet digital advokat melalui Payment Gateway (Snap / QRIS / VA) untuk membayar layanan berbayar platform tanpa potongan pajak PPh 21.*

```plantuml
@startuml
title Activity Diagram: AD-J-22 - Mengisi Saldo Dompet Advokat (Top-Up / Cash-In - J-UC22)
|Advokat Justifiqa|
start
:Buka Dasbor Dompet Advokat (`SCR-JST-03`);
:Pilih Menu "Top-Up Saldo Dompet";
:Pilih Nominal Pengisian (Rp 12.000 / Rp 50.000 / Rp 100.000);
:Klik "Buat Tagihan Pembayaran";

|Backend Independen Justifiqa|
:Buat Data Transaksi Top-Up berstatus "PENDING";
:Kirim Request Pembuatan Snap Token ke Payment Gateway;

|Payment Gateway Checkout|
:Generate Snap Token & Instruksi Pembayaran (QRIS / VA);
:Kirim Response ke Backend Justifiqa;

|Backend Independen Justifiqa|
:Tampilkan Halaman Pembayaran (Snap Checkout) ke Advokat;

|Advokat Justifiqa|
:Selesaikan Pembayaran via M-Banking / E-Wallet Eksternal;

|Payment Gateway Checkout|
if (Apakah Pembayaran Sukses Diterima?) then (Ya - Pembayaran Sukses)
  :Kirim Webhook Callback Status "Sukses" (HTTP POST);
  
  |Backend Independen Justifiqa|
  :Verifikasi Tanda Tangan Kriptografi Webhook;
  :Update Status Transaksi Menjadi "PAID";
  :Tambahkan Saldo ke Dompet Aktif Advokat di Tabel `advocate_wallets`;
  :Kirim Resi Pembayaran Top-Up & Notifikasi Sukses ke Advokat;
  
  |Advokat Justifiqa|
  :Terima Notifikasi Saldo Bertambah & Siap Digunakan;
else (Tidak - Kedaluwarsa / Dibatalkan)
  |Payment Gateway Checkout|
  :Kirim Webhook Callback Status "Expired / Cancelled";
  
  |Backend Independen Justifiqa|
  :Batalkan Transaksi Top-Up (Status "CANCELLED");
  :Saldo Dompet Advokat Tetap Utuh (Tidak Berubah);
endif
stop
@enduml
```

---

### AD-J-20: Autentikasi Portal Backoffice Admin Justifiqa (TOTP 2FA - J-UC20)
*Diagram alur autentikasi tingkat lanjut untuk Admin Justifiqa melalui portal backoffice terisolasi (`admin.justifiqa.com`) dengan IP Whitelisting, verifikasi kredensial internal, dan otentikasi ganda TOTP Authenticator.*

```plantuml
@startuml
title Activity Diagram: AD-J-20 - Autentikasi Portal Backoffice Admin Justifiqa (TOTP 2FA - J-UC20)
|Admin Justifiqa|
start
:Buka URL Portal Backoffice Admin Justifiqa (`admin.justifiqa.com`) via VPN/ZTNA;
--> (A)

|Gateway Security / IAM Justifiqa|
if (Apakah IP Address Terdaftar di Whitelist Justifiqa?) then (Ya - IP Valid)
  |Admin Justifiqa|
  :Tampilkan Form Login Khusus Backoffice Hukum;
  :Masukkan Email/Username & Password Internal Justifiqa;
  :Klik Login Backoffice;
  
  |Gateway Security / IAM Justifiqa|
  if (Apakah Kredensial Valid di DB IAM Justifiqa?) then (Ya - Kredensial Valid)
    --> (B)
    |Admin Justifiqa|
    :Tampilkan Permintaan Kode TOTP 2FA;
    :Buka Aplikasi Authenticator & Masukkan 6 Digit Kode;
    
    |Gateway Security / IAM Justifiqa|
    if (Apakah Kode TOTP Valid & Belum Kadaluwarsa?) then (Ya - TOTP Valid)
      :Terbitkan Cryptographic JWT Session Token Khusus Justifiqa;
      :Arahkan ke Dasbor Admin Utama Justifiqa (`SCR-JST-07`);
      
      |WORM Audit Storage Justifiqa|
      :Catat Log Autentikasi Sukses (Timestamp, IP, Role: Legal Admin);
      
      |Admin Justifiqa|
      stop
    else (Tidak - TOTP Gagal)
      |WORM Audit Storage Justifiqa|
      :Catat Log Percobaan TOTP Gagal (Anomali SOC Justifiqa);
      
      |Gateway Security / IAM Justifiqa|
      :Tampilkan Error "Kode TOTP Tidak Valid atau Kadaluwarsa";
      
      |Admin Justifiqa|
      if (Coba Masukkan TOTP Lagi?) then (Ya - Ulangi Input TOTP)
        --> (B)
        detach
      else (Tidak - Batal)
        stop
      endif
    endif
  else (Tidak - Kredensial Salah)
    |WORM Audit Storage Justifiqa|
    :Catat Log Kredensial Gagal (Failed Login Attempt);
    
    |Gateway Security / IAM Justifiqa|
    :Tampilkan Error "Kredensial atau Kode TOTP Tidak Valid";
    
    |Admin Justifiqa|
    if (Coba Login Lagi?) then (Ya - Ulangi Login)
      --> (A)
      detach
    else (Tidak - Batal)
      stop
    endif
  endif
else (Tidak - IP Liar / Tidak Dikenal)
  |WORM Audit Storage Justifiqa|
  :Catat Peringatan SOC Keamanan Kritis (Unauthorized IP Access);
  
  |Gateway Security / IAM Justifiqa|
  :Blokir Koneksi & Tampilkan Error 403 Forbidden;
  
  |Admin Justifiqa|
  stop
endif
@enduml
```

---

## BAGIAN II: ACTIVITY DIAGRAMS - APLIKASI MANDIRI QUALIFA (DOMAIN PSIKOLOGI)

### AD-Q-01: Registrasi Akun Klien & Psikolog Klinis (Q-UC01, Q-UC07)
*Diagram alur pendaftaran akun mandiri Klien dan Psikolog Klinis (verifikasi STR & SIPP HIMPSI) di platform Qualifa.*

```plantuml
@startuml
|Pengguna (Klien/Psikolog)|
start
:Buka Halaman Registrasi Qualifa;
:Pilih Jenis Akun (Klien atau Psikolog Klinis);

|Backend Independen Qualifa|
:Tampilkan Formulir Registrasi Spesifik Qualifa;

|Pengguna (Klien/Psikolog)|
--> (A)
:Isi Data Diri & Unggah Dokumen Kredensial;
note right
Klien: Profil Diri & Kontak Darurat
Psikolog: Kartu HIMPSI & STR / SIPP Psikologi
end note
:Klik Daftar;

|Backend Independen Qualifa|
if (Apakah Format & Ukuran File Valid?) then (Ya)
  if (Apakah Email/No HP Sudah Terdaftar?) then (Tidak)
    if (Jenis Akun = Psikolog?) then (Ya)
      :Simpan Akun di DB Qualifa (Status: PENDING_VERIFICATION);
      :Kirim Antrean Audit ke Admin Etik Qualifa;
      :Tampilkan Pesan "Menunggu Verifikasi HIMPSI 1x24 Jam";
      |Pengguna (Klien/Psikolog)|
      stop
    else (Tidak - Klien)
      :Simpan Akun Klien di DB Qualifa (Status: AKTIF);
      :Tampilkan Pesan Sukses & Arahkan ke Login;
      |Pengguna (Klien/Psikolog)|
      stop
    endif
  else (Ya)
    |Backend Independen Qualifa|
    :Tampilkan Error "Email/No HP Sudah Terdaftar";
  endif
else (Tidak)
  |Backend Independen Qualifa|
  :Tampilkan Error Validasi Format/File;
endif

|Pengguna (Klien/Psikolog)|
:Perbaiki Input Data;
if (Coba Daftar Lagi?) then (Ya)
  --> (A)
  detach
else (Tidak)
  stop
endif
@enduml
```

---

### AD-Q-02: Login Akun Klien & Psikolog Klinis (Q-UC02, Q-UC08)
*Diagram alur masuk (login) independen beserta verifikasi Multi-Factor Authentication (MFA / 2FA).*

```plantuml
@startuml
|Pengguna Qualifa|
start
:Buka Halaman Login Qualifa;
--> (A)
:Masukkan Email/No HP & Password;
:Klik Login;

|Backend Independen Qualifa|
if (Apakah Kredensial Cocok di DB Qualifa?) then (Ya)
  if (Apakah Akun Diblokir / Suspend?) then (Tidak)
    :Generate Kode OTP 6-Digit (Expire 5 Menit);
    :Kirim OTP via SMS/WhatsApp/Email;
    
    |Pengguna Qualifa|
    --> (B)
    :Terima & Masukkan Kode OTP;
    
    |Backend Independen Qualifa|
    if (Apakah OTP Valid & Belum Expire?) then (Ya)
      :Generate Token Sesi JWT Independen Qualifa;
      :Catat Log Login Sukses (IP & Device);
      :Arahkan ke Dasbor (Klien atau Psikolog);
      |Pengguna Qualifa|
      stop
    else (Tidak)
      |Backend Independen Qualifa|
      :Tampilkan Error "Kode OTP Salah/Kadaluarsa";
      |Pengguna Qualifa|
      if (Minta Kirim Ulang OTP?) then (Ya)
        :Klik Resend OTP;
        |Backend Independen Qualifa|
        :Generate & Kirim OTP Baru;
        --> (B)
        detach
      else (Tidak)
        stop
      endif
    endif
  else (Ya)
    |Backend Independen Qualifa|
    :Tampilkan Error "Akun Suspended oleh Komite Etik Qualifa";
    |Pengguna Qualifa|
    stop
  endif
else (Tidak)
  |Backend Independen Qualifa|
  :Tampilkan Error "Email/No HP atau Password Salah";
  |Pengguna Qualifa|
  if (Coba Login Lagi?) then (Ya)
    --> (A)
    detach
  else (Tidak)
    stop
  endif
endif
@enduml
```

---

### AD-Q-03: Sesi Konseling Klinis & Pembayaran (Q-UC03, Q-UC04, Q-UC05, Q-UC10)
*Diagram alur reservasi psikolog, pembayaran konseling, pelaksanaan sesi terapi (chat/audio/video), dan penyelesaian sesi.*

```plantuml
@startuml
|Klien Qualifa|
start
:Buka Katalog Psikolog Klinis;
:Filter Keahlian (Kecemasan, Depresi, Relasi, Trauma);
--> (A)
:Pilih Psikolog & Pilih Jadwal Sesi Terapi (45 - 60 Menit);
:Klik Konfirmasi Reservasi;

|Backend Independen Qualifa|
:Buat Tagihan (Invoice) & Kirim ke Payment Gateway;

|Payment Gateway|
:Tampilkan Pilihan Metode Pembayaran (VA, E-Wallet, CC);

|Klien Qualifa|
:Lakukan Pembayaran Sesuai Nominal;

|Payment Gateway|
if (Apakah Webhook Status Transaksi PAID / SUCCESS?) then (Ya - PAID)
  |Backend Independen Qualifa|
  :Tahan Dana di Rekening Sementara Qualifa;
  :Ubah Status Reservasi Jadi TERKONFIRMASI;
  :Kirim Pengingat Jadwal ke Psikolog & Klien;
  
  fork
    |Psikolog Qualifa|
    :Masuk ke Ruang Terapi Virtual pada Jadwal yang Ditentukan;
  fork again
    |Klien Qualifa|
    :Masuk ke Ruang Konseling E2EE pada Jadwal yang Ditentukan;
  end fork
  
  |Backend Independen Qualifa|
  :Mulai Countdown Timer Sesi Terapi (Durasi 45 - 60 Menit);
  
  fork
    |Psikolog Qualifa|
    :Memberikan Intervensi Klinis & Dukungan (Interaksi Dua Arah);
  fork again
    |Klien Qualifa|
    :Konseling & Curhat Masalah Klinis (Interaksi Dua Arah);
  end fork
  
  |Backend Independen Qualifa|
  :Akhiri Sesi (Waktu Habis atau Tombol Akhiri Sesi Diklik);
  :Tutup Ruang Terapi & Arsip Log Metadata Sesi;
  :Minta Klien Memberikan Rating & Ulasan (Q-UC06);
  :Cairkan Honor Sesi ke Saldo Psikolog Klinis;
  stop
else (Tidak - Gagal / Kadaluwarsa)
  |Backend Independen Qualifa|
  :Batalkan Invoice & Tampilkan Error "Pembayaran Gagal atau Kadaluwarsa";
  
  |Klien Qualifa|
  if (Coba Pilih Metode Bayar Lain / Jadwal Ulang?) then (Ya)
    --> (A)
    detach
  else (Tidak)
    stop
  endif
endif
@enduml
```

---

### AD-Q-04: Mengatur Status Ketersediaan & Buffer 30 Mnt (Q-UC09)
*Diagram alur pengaturan jadwal praktik psikolog dengan aturan wajib jeda istirahat emosional (buffer rule) 30 menit antar sesi.*

```plantuml
@startuml
|Psikolog Qualifa|
start
:Buka Dasbor Psikolog Menu Pengaturan Jadwal Praktik;
--> (A)
:Tambah, Ubah, atau Hapus Slot Hari & Jam Operasional Terapi;
:Klik Simpan Perubahan Jadwal;

|Backend Independen Qualifa|
:Validasi Reservasi Eksisting & Aturan Buffer Waktu 30 Menit Antar Sesi;
if (Apakah Ada Reservasi Bentrok ATAU Melanggar Buffer 30 Menit?) then (Ya - Melanggar)
  :Tolak Perubahan & Tampilkan Error "Slot Melanggar Reservasi Aktif atau Kode Etik Jeda Istirahat 30 Menit";
  |Psikolog Qualifa|
  if (Ingin Atur Kembali Slot Jadwal Lain?) then (Ya)
    --> (A)
    detach
  else (Tidak - Batal)
    stop
  endif
else (Tidak - Slot Valid & Aman)
  |Backend Independen Qualifa|
  :Simpan Jadwal Operasional Baru ke Database Qualifa;
  :Perbarui Ketersediaan Slot di Katalog Pencarian Klien;
  stop
endif
@enduml
```

---

### AD-Q-05: Mengisi Jurnal Mood Tracker Harian Proactive Alert (Q-UC13)
*Diagram alur pengisian jurnal emosi harian yang dilengkapi sistem pendeteksi risiko penurunan kesehatan mental otomatis.*

```plantuml
@startuml
|Klien Qualifa|
start
:Buka Widget "Jurnal Mood Harian (Mood Tracker)";
:Pilih Emotikon Emosi Hari Ini (Senang, Tenang, Cemas, Sedih, Panik);
:Pilih Faktor Pemicu (Pekerjaan, Keluarga, Keuangan, Relasi);
:Tulis Catatan Jurnal Pribadi (Opsional);
:Klik Simpan Jurnal;

|Backend Independen Qualifa|
:Enkripsi Catatan Jurnal & Simpan di DB Qualifa;
:Analisis Tren Emosi 7 Hari Terakhir Klien;
if (Apakah Terdeteksi Tren Sedih/Cemas Ekstrem Selama 5 Hari Beruntun?) then (Ya)
  :Trigger Proactive Wellness Alert System;
  :Munculkan Pop-up Psikoedukasi & Rekomendasi Konseling;
  :Kirim Notifikasi Peringatan Lembut via Email/Push Notif;
else (Tidak)
  :Perbarui Grafik Tren Emosi di Dasbor Klien;
endif
stop
@enduml
```

---

### AD-Q-06: Mengakses Streaming Audio Meditasi & Relaksasi (Q-UC14)
*Diagram alur pemutaran trek audio terapi relaksasi dengan penyesuaian kualitas bitrate adaptif.*

```plantuml
@startuml
|Klien Qualifa|
start
:Buka Menu "Relaksasi & Audio Meditasi Qualifa";
:Pilih Kategori Meditasi (Tidur Nyenyak, Redakan Cemas, Mindfulness);
:Pilih Trek Audio & Klik Tombol Play;

|Backend Independen Qualifa|
:Periksa Kecepatan Koneksi Internet Klien;
if (Koneksi Cepat / Wi-Fi?) then (Ya)
  :Streaming Audio Bitrate Tinggi (320 kbps High Quality);
else (Tidak - Koneksi Seluler/Lambat)
  :Streaming Audio Bitrate Adaptif (128 kbps Smooth);
endif

|Klien Qualifa|
:Dengarkan Audio Meditasi;
:Sistem Mencatat Durasi Latihan di Riwayat Wellness Klien;
stop
@enduml
```

---

### AD-Q-07: Mengisi Asesmen DASS-21 & Protokol Crisis Button 119 (Q-UC15)
*Diagram alur pengisian tes stres klinis DASS-21 yang memicu protokol kedaruratan bunuh diri/krisis 119 jika skor berada pada tingkat bahaya ekstrem.*

```plantuml
@startuml
|Klien Qualifa|
start
:Buka Menu "Tes Asesmen Klinis DASS-21";
:Jawab 21 Pertanyaan Skala Intensitas Stres, Kecemasan, & Depresi;
:Klik Submit Jawaban;

|Backend Independen Qualifa|
:Hitung Skor Sub-Skala Depresi, Anxiety, & Stress;
if (Apakah Skor Depresi/Anxiety Masuk Kategori EXTREME / RISK OF SELF-HARM?) then (Ya)
  :Aktifkan Protokol Kedaruratan Krisis (Crisis 119 Protocol);
  :Munculkan Layar Peringatan Merah & Tombol "Hubungi Hotline Krisis 119 Sekarang";
  :Kirim Notifikasi Darurat ke Nomor Kontak Darurat Terdaftar Klien;
  :Tawarkan Sesi Konseling Darurat Gratis/Prioritas dengan Psikolog Klinis Siaga;
else (Tidak - Normal / Sedang)
  :Tampilkan Hasil Skor & Penjelasan Psikoedukasi Klinis;
  :Rekomendasikan Artikel Kesehatan Mental & Audio Meditasi yang Relevan;
endif
stop
@enduml
```

---

### AD-Q-08: Membuat Catatan Terapi DAP Note & Worksheet CCBT (Q-UC11, Q-UC12)
*Diagram alur pembuatan catatan klinis metode DAP (Data, Assessment, Plan) dan penugasan lembar kerja terapi perilaku kognitif (CCBT).*

```plantuml
@startuml
|Psikolog Qualifa|
start
:Selesai Melayani Sesi Konseling Klinis;
:Buka Menu "Catatan Klinis Psikolog (DAP Note Framework)";
:Isi Kolom Data (Observasi Perilaku & Keluhan Klien);
:Isi Kolom Assessment (Analisis Klinis & Dinamika Psikologis);
:Isi Kolom Plan (Rencana Intervensi & Target Terapi Lanjutan);
:Klik Simpan Catatan DAP Note;

|Backend Independen Qualifa|
:Enkripsi Catatan Klinis dengan Field-Level Encryption;
:Simpan di Arsip Terapi Klien Qualifa (Sangat Rahasia);
if (Perlu Berikan Tugas Terapi CCBT ke Klien?) then (Ya)
  |Psikolog Qualifa|
  :Buka Menu "Generator Worksheet CCBT";
  :Pilih Template Tugas (Thought Record / Behavioral Activation);
  :Kirim Tugas ke Dasbor Klien;
  |Backend Independen Qualifa|
  :Kirim Notifikasi Tugas Baru ke Aplikasi Klien;
  |Klien Qualifa|
  :Mengerjakan Worksheet CCBT di Aplikasi Sebelum Sesi Berikutnya;
else (Tidak)
  |Psikolog Qualifa|
  :Selesai;
endif
stop
@enduml
```

---

### AD-Q-09: Verifikasi STR/HIMPSI & Moderasi Komite Etik Admin Qualifa (Q-UC16, Q-UC17)
*Diagram alur audit keabsahan surat tanda registrasi psikolog klinis serta penanganan laporan kode etik.*

```plantuml
@startuml
|Admin Etik Qualifa|
start
:Buka Dasbor Admin Menu "Verifikasi Psikolog Baru";
:Periksa Dokumen STR Klinis, SIPP, & Kartu Anggota HIMPSI;
:Verifikasi Nomor STR ke Pangkalan Data HIMPSI / Kemenkes;
if (Kredensial Sah & STR Masih Berlaku?) then (Ya)
  |Backend Independen Qualifa|
  :Ubah Status Akun Psikolog Jadi VERIFIED / AKTIF;
  :Kirim Email Selamat Datang & Panduan Kode Etik Qualifa;
else (Tidak - STR Kadaluarsa / Tidak Sah)
  |Backend Independen Qualifa|
  :Ubah Status Akun Jadi REJECTED;
  :Kirim Email Alasan Penolakan Kredensial;
endif

|Admin Etik Qualifa|
:Buka Menu "Moderasi & Komite Etik Psikologi";
if (Ada Laporan Pelanggaran Kode Etik / Malpraktik?) then (Ya)
  :Jalankan Protokol Pemeriksaan Komite Etik Qualifa;
  :Ubah Status Akun Terlapor Jadi SUSPENDED (Sementara);
  :Kirim Surat Panggilan Klarifikasi Komite Etik;
else (Tidak)
  :Arsip Laporan sebagai Clear;
endif
stop
@enduml
```

---

### AD-Q-10: Pencairan Honor Psikolog & Perhitungan PPh 21 (Q-UC19)
*Diagram alur penarikan honor sesi konseling klinis oleh psikolog dari dompet digital ke rekening bank, pemotongan pajak PPh 21 otomatis, dan auto-rollback jika transfer gagal.*

```plantuml
@startuml
|Psikolog Qualifa|
start
:Buka Menu Dompet Saldo Psikolog Qualifa;
:Klik Penarikan Honor (Withdrawal) ke Rekening Bank Bersangkutan;

|Backend Independen Qualifa|
:Periksa Saldo Available & Validasi Rekening Bank Tujuan;
:Hitung Potongan Pajak PPh 21 Sesuai Regulasi Ditjen Pajak;
:Buat Instruksi Pencairan Honor Bersih;
:Kirim Request Transfer ke Payment Gateway Disbursement;

|Payment Gateway|
:Proses Transfer Real-time ke Bank Psikolog;
:Kirim Webhook Status Transfer ke Backend Qualifa;

|Backend Independen Qualifa|
if (Status Webhook PG = SUCCESS?) then (Ya)
  :Kurangi Saldo Psikolog & Simpan Bukti Potong PPh 21;
  :Generate Hash Log SHA-256 Transaksi ke WORM Hash Storage;
  :Kirim Email Bukti Transfer & Detail Honor ke Psikolog;
  |Psikolog Qualifa|
  :Terima Email Bukti Transfer & Unduh Detail Honor / PPh 21;
else (Tidak / FAILED)
  |Backend Independen Qualifa|
  :Eksekusi Rollback Saldo Available Psikolog (Saldo Kembali Utuh);
  :Generate Hash Log SHA-256 Kegagalan Transfer ke WORM Storage;
  :Kirim Notifikasi Error Transfer ke HP Psikolog ("Transfer Gagal, Saldo Dikembalikan");
  |Psikolog Qualifa|
  :Terima Notifikasi Error & Periksa Saldo yang Kembali Utuh;
endif
stop
@enduml
```

---

### AD-Q-11: Memantau Laporan Keuangan Qualifa & Audit WORM (Q-UC18)
*Diagram alur pengawasan buku besar honorarium, verifikasi bagi hasil platform (20%/80%), dan eksport bukti pajak PPh 21 ber-hash WORM SHA-256 oleh Admin Qualifa.*

```plantuml
@startuml
|Admin Qualifa|
start
:Login ke Portal Backoffice Admin Qualifa;
:Buka Modul Keuangan & Buku Besar Honorarium;
:Filter Rentang Waktu & Cari Riwayat Pencairan Honor Mitra;

|Backend Independen Qualifa|
:Ambil Data Rekonsiliasi Saldo & Log Hash WORM SHA-256;
:Tampilkan Tabel Rekapitulasi Bagi Hasil (20% Platform / 80% Psikolog) & PPh 21;

|Admin Qualifa|
if (Tindak Lanjut Laporan?) then (Eksport Data Pajak / DJP)
  :Klik Unduh Laporan Rekapitulasi PPh 21 & Hash WORM;
  
  |Backend Independen Qualifa|
  :Generate File Excel/PDF dengan Digital Signature WORM SHA-256;
  :Kirim File Laporan ke Workstation Admin;
else (Audit Rutin Selesai)
  |Admin Qualifa|
  :Tutup Modul Keuangan Honorarium;
endif
stop
@enduml
```

---

### AD-Q-20: Autentikasi Portal Backoffice Admin Qualifa (TOTP 2FA - Q-UC20)
*Diagram alur autentikasi tingkat lanjut untuk Admin Qualifa melalui portal backoffice terisolasi (`admin.qualifa.com`) dengan IP Whitelisting, verifikasi kredensial internal, dan otentikasi ganda TOTP Authenticator.*

```plantuml
@startuml
title Activity Diagram: AD-Q-20 - Autentikasi Portal Backoffice Admin Qualifa (TOTP 2FA - Q-UC20)
|Admin Qualifa|
start
:Buka URL Portal Backoffice Admin Qualifa (`admin.qualifa.com`) via VPN/ZTNA;
--> (A)

|Gateway Security / IAM Qualifa|
if (Apakah IP Address Terdaftar di Whitelist Qualifa?) then (Ya - IP Valid)
  |Admin Qualifa|
  :Tampilkan Form Login Khusus Backoffice Psikologi;
  :Masukkan Email/Username & Password Internal Qualifa;
  :Klik Login Backoffice;
  
  |Gateway Security / IAM Qualifa|
  if (Apakah Kredensial Valid di DB IAM Qualifa?) then (Ya - Kredensial Valid)
    --> (B)
    |Admin Qualifa|
    :Tampilkan Permintaan Kode TOTP 2FA;
    :Buka Aplikasi Authenticator & Masukkan 6 Digit Kode;
    
    |Gateway Security / IAM Qualifa|
    if (Apakah Kode TOTP Valid & Belum Kadaluwarsa?) then (Ya - TOTP Valid)
      :Terbitkan Cryptographic JWT Session Token Khusus Qualifa;
      :Arahkan ke Dasbor Admin Utama Qualifa (`SCR-QLF-07`);
      
      |WORM Audit Storage Qualifa|
      :Catat Log Autentikasi Sukses (Timestamp, IP, Role: Ethics Committee / Admin);
      
      |Admin Qualifa|
      stop
    else (Tidak - TOTP Gagal)
      |WORM Audit Storage Qualifa|
      :Catat Log Percobaan TOTP Gagal (Anomali SOC Qualifa);
      
      |Gateway Security / IAM Qualifa|
      :Tampilkan Error "Kode TOTP Tidak Valid atau Kadaluwarsa";
      
      |Admin Qualifa|
      if (Coba Masukkan TOTP Lagi?) then (Ya - Ulangi Input TOTP)
        --> (B)
        detach
      else (Tidak - Batal)
        stop
      endif
    endif
  else (Tidak - Kredensial Salah)
    |WORM Audit Storage Qualifa|
    :Catat Log Kredensial Gagal (Failed Login Attempt);
    
    |Gateway Security / IAM Qualifa|
    :Tampilkan Error "Kredensial atau Kode TOTP Tidak Valid";
    
    |Admin Qualifa|
    if (Coba Login Lagi?) then (Ya - Ulangi Login)
      --> (A)
      detach
    else (Tidak - Batal)
      stop
    @enduml
```

---

## BAGIAN III: ACTIVITY DIAGRAMS - PHASE 2 (CORPORATE INTAKE & E-KYC FORENSIK)

### AD-P2-01: Corporate Intake & Notary Stamping
*Alur ini mencakup intake PT/CV, validasi berulang, order dan milestone, escrow, review Notaris, submission AHU/OSS yang dapat ditolak berulang, WORM anchoring, serta payout idempoten. Klien hanya menerima status netral; detail internal PMPJ/compliance tidak ditampilkan.*

```plantuml
@startuml
title AD-P2-01: Corporate Intake & Notary Stamping

|Klien|
start
:[AD01-01] Isi dan submit Corporate Intake\n(PT/CV, KBLI, struktur, natural-person BO,\nconsent dan versi legal scope);

|Sistem UI|
:[AD01-02] Validasi format dan kelengkapan;
while (Payload valid?) is (Tidak)
  :Tampilkan error terarah;
  |Klien|
  :Perbaiki dan submit ulang;
  |Sistem UI|
  :Validasi ulang payload;
endwhile (Ya)

|Supabase BaaS|
:[AD01-03] Simpan case DRAFT, parties, BO,\nservice order, fee lines, dan milestone\nsecara atomik;

|Sistem UI|
:[AD01-04] Tampilkan checkout dan penawaran berversi;
|Klien|
:Setujui penawaran dan pilih metode pembayaran;

|Payment Gateway / Escrow|
:Terima transfer ke rekening bersama;
:Kirim webhook pembayaran bertanda tangan;

|Supabase BaaS|
:[AD01-05] Verifikasi HMAC, event, order, dan nominal;\nlock event + escrow row (SELECT ... FOR UPDATE);
if (Webhook dan pembayaran valid?) then (Tidak)
  :Tolak mutasi finansial;\norder tetap PENDING_PAYMENT;
  |Sistem UI|
  :Tampilkan pembayaran gagal/pending;
  |Klien|
  :Ulangi pembayaran atau batalkan checkout;
  stop
else (Ya)
  :Set escrow_transactions = HELD_IN_ESCROW;\nset milestone = FUNDED;\ncatat ledger append-only;
endif

|Supabase BaaS|
:[AD01-06] Set case = ESCROW_LOCKED;\ntugaskan dan notifikasi Notaris;

|Notaris|
:[AD01-07] Buka workspace dan review intake,\nBO, identitas, KBLI, domisili, dan formalitas;
while (Intake lengkap dan dapat diproses?) is (Tidak)
  :Tandai CUSTOMER_ACTION_REQUIRED\n(tanpa alasan compliance sensitif);
  |Supabase BaaS|
  :Simpan expected-state transition dan notifikasi Klien;\ndana tetap HELD_IN_ESCROW;
  |Klien|
  :Lengkapi data/dokumen dan submit ulang;
  |Supabase BaaS|
  :Simpan revisi dan audit metadata;
  |Notaris|
  :[AD01-08] Review ulang revisi;
endwhile (Ya)

|Notaris|
:[AD01-09] Siapkan submission AHU/OSS\nmelalui kanal resmi dengan credential sendiri;

|Supabase BaaS|
:Buat government_submission_job SUBMITTED\n(digest + idempotency key, tanpa raw credential/payload);
while (Submission disetujui?) is (Tidak — REJECTED)
  :[AD01-10] Catat REJECTED dan alasan yang boleh disimpan;
  |Notaris|
  :Revisi data/dokumen;
  |Supabase BaaS|
  :Buat job DRAFT baru dengan idempotency key baru;
  |Notaris|
  :Submit ulang melalui kanal resmi;
  |Supabase BaaS|
  :Set job revisi = SUBMITTED;
endwhile (Ya — APPROVED)

|Supabase BaaS|
:[AD01-11] Rekonsiliasi nomor AHU/NIB,\nexternal reference, dan digest final;
if (Rekonsiliasi final valid?) then (Tidak)
  :Set COMPLIANCE_HOLD;\nblok payout dan minta review internal;
  stop
else (Ya)
endif

|Notaris|
:Unggah dokumen final ke bucket privat;
|Supabase BaaS|
:[AD01-12] MIME allow-list + malware scan;\nhitung SHA-256 server-side;\nsimpan document_integrity_anchors\nappend-only dan kunci case;

:[AD01-13] Siapkan payout milestone;\ncommit intent + idempotency key;\npanggil provider di luar transaksi DB;\nfinalize dengan row lock dan rekonsiliasi;
|Payment Gateway / Escrow|
:Transfer dana escrow ke rekening Notaris;\nkembalikan reference terautentikasi;
|Supabase BaaS|
:Set milestone = RELEASED;\ncatat payout result dan audit_logs_worm;

|Sistem UI|
:[AD01-14] Tampilkan status selesai,\ndokumen WORM, dan payout terkonfirmasi;
|Klien|
:Unduh dokumen final melalui akses terotorisasi;
|Notaris|
:Terima konfirmasi payout;
stop
@enduml
```

---

### AD-P2-02: High-Stakes Property Transaction — e-KYC Forensik Multi-Pihak
*Escrow harus terkunci sebelum undangan e-KYC aktif. TTL global adalah **7 × 24 jam sejak `escrow_locked_at`**. Scheduler dan setiap command/callback memeriksa deadline yang sama. Satu pihak yang terbukti ilegal, gagal liveness pada percobaan ketiga, atau tidak merespons sampai TTL berakhir memicu **Global Halt**: envelope dibatalkan untuk semua pihak dan escrow dikembalikan penuh secara idempoten.*

```plantuml
@startuml
title AD-P2-02: Property Transaction — e-KYC, TTL 7 Hari, Global Halt & Escrow Refund

|Pihak Transaksi|
start
:[AD02-01] Inisiator membuat transaksi,\nmendaftarkan seluruh pihak dan e-kertas;

|Supabase BaaS|
:Bekukan digest dokumen;\nbuat envelope DRAFT dan party PENDING;
|Sistem UI|
:[AD02-02] Tampilkan checkout escrow;
|Pihak Transaksi|
:Setujui biaya dan transfer ke rekening bersama;
|Payment Gateway / Escrow|
:Verifikasi sumber dana dan kirim webhook bertanda tangan;
|Supabase BaaS|
:[AD02-03] Verifikasi webhook + nominal;\nrow-lock escrow; set HELD_IN_ESCROW;\nset expires_at = escrow_locked_at + 7 hari;\ncatat audit append-only;
if (Escrow berhasil dikunci?) then (Tidak)
  :Batalkan aktivasi e-KYC;\ntidak ada dana yang direfund;
  stop
else (Ya)
endif

:[AD02-04] Kirim undangan unik ke seluruh pihak;\naktifkan watchdog TTL 7 hari;

while (Semua pihak berstatus PASSED?) is (Belum)
  :[AD02-05] Pilih pihak PENDING berikutnya\natau tunggu event/callback;
  if (Sekarang >= expires_at dan ada pihak belum PASSED?) then (Ya)
    :[AD02-15] GLOBAL HALT — TTL_EXPIRED;\nset envelope = EXPIRED;\nblok seluruh command/callback lanjutan;
    :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
    stop
  else (Tidak)
  endif

  |Pihak Transaksi|
  :Buka tautan auto-login dan baca e-kertas 1..n;\nsetujui tiap halaman dan bubuhkan TTD final;
  |Sistem UI|
  :[AD02-06] Verifikasi sesi, consent per halaman,\ndan digest dokumen yang telah dibekukan;

  while (Pihak belum PASSED dan liveness_attempt_count < 3?) is (Ya)
    |Supabase BaaS|
    :Row-lock envelope; pastikan status masih aktif\ndan now < expires_at sebelum membuat sesi provider;
    if (Deadline telah lewat?) then (Ya)
      :[AD02-15] GLOBAL HALT — TTL_EXPIRED;\nset envelope = EXPIRED;\nblok seluruh command/callback lanjutan;
      :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
      stop
    else (Tidak)
    endif
    |Sistem UI|
    :[AD02-07] Buka SDK/redirect provider;\nmedia mentah dikirim langsung ke provider,\ntidak melalui API/storage/log Justifiqa;
    |Pihak Transaksi|
    :Ambil bukti forensik:\nsetengah badan + KTP + device berisi TTD final;
    |Provider e-KYC / CV AI|
    :Liveness anti-spoof/editan;\nOCR KTP; deteksi device dan TTD;\nvalidasi terhadap sumber pemerintah;
    :Kirim callback metadata bertanda tangan\n(reference, status, digest, timestamp);
    |Supabase BaaS|
    :[AD02-08] Verifikasi signature, timestamp,\nnonce/idempotency dan anti-replay;
    if (Callback valid?) then (Tidak)
      :Tolak callback tanpa mengubah status;\nTTL tetap berjalan;
    else (Ya)
      :Row-lock envelope; periksa expires_at dan status terminal\nsebelum menerima outcome atau mengubah status;
      if (Callback tiba setelah deadline?) then (Ya)
        :[AD02-15] GLOBAL HALT — TTL_EXPIRED;\nset envelope = EXPIRED;\nblok seluruh command/callback lanjutan;
        :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
        stop
      else (Tidak)
        :Simpan metadata allow-list saja;\nTANPA media/payload biometrik mentah;
      endif

      if (Ilegal/fraud terkonfirmasi?) then (Ya)
        :[AD02-09] GLOBAL HALT — ILLEGAL_CONFIRMED;\nset pihak = REJECTED;\nset envelope = VOIDED;\nblok semua pihak;
        :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
        stop
      else (Tidak)
      endif

      if (Hasil meragukan, OCR/device/TTD mismatch,\natau perlu keputusan manusia?) then (Ya)
        :[AD02-11] Set REQUIRES_MANUAL_REVIEW;\nreviewer menerima metadata minimum,\nbukan raw media melalui Justifiqa;
        :Saat callback reviewer tiba, verifikasi signature/anti-replay;\nrow-lock envelope dan periksa deadline yang sama;
        if (Callback reviewer tiba setelah deadline?) then (Ya)
          :[AD02-15] GLOBAL HALT — TTL_EXPIRED;\nset envelope = EXPIRED;\nblok seluruh command/callback lanjutan;
          :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
          stop
        else (Tidak)
        endif
        if (Review mengonfirmasi ilegal?) then (Ya)
          :[AD02-09] GLOBAL HALT — ILLEGAL_CONFIRMED;\nset pihak = REJECTED;\nset envelope = VOIDED;
          :[AD02-17] Refund idempoten 100%;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit; notifikasi semua pihak;
          stop
        else (Tidak — Clear)
          :Set hasil review = PASSED;
        endif
      else (Keputusan otomatis dapat diterima)
        if (Liveness lulus?) then (Ya)
          :Set hasil = PASSED;
        else (Tidak)
          :[AD02-10] Increment liveness_attempt_count;\ncatat kegagalan liveness terpisah;
        endif
      endif
    endif
  endwhile (Tidak)

  if (Pihak berstatus PASSED?) then (Tidak — 3 liveness gagal)
    :[AD02-12] GLOBAL HALT — LIVENESS_FAILED_3X;\nset pihak = REJECTED;\nset envelope = VOIDED;\nblok semua pihak;
    :[AD02-17] Row-lock escrow;\nrefund idempoten 100% ke Klien;\nset escrow = REFUNDED_TO_CLIENT;\ncatat ledger + audit_logs_worm;\nnotifikasi seluruh pihak;
    stop
  else (Ya)
    :[AD02-13] Pertahankan status DB = PASSED;\nproyeksi UI = GREEN;
  endif

  :[AD02-14] Cek ulang seluruh pihak;\nreschedule watchdog bila masih PENDING;
endwhile (Ya)

:[AD02-16] Tandai fase e-KYC selesai;\nenvelope dapat lanjut ke fase signing;\nescrow tetap HELD_IN_ESCROW sampai\nmilestone berikutnya terpenuhi;
|Sistem UI|
:Tampilkan semua pihak GREEN dan deadline selesai;
|Pihak Transaksi|
:Lanjut ke fase signing/milestone berikutnya;
stop
@enduml
```

---

## Keputusan arsitektur dan status kanonik

1. **Corporate rejection loop diperbaiki:** `REJECTED → DRAFT → SUBMITTED` kini kembali ke keputusan approval, bukan jatuh otomatis ke jalur `APPROVED`.
2. **Payout Notaris tidak memakai fungsi payout Advokat:** diagram memakai port payout role-aware dengan prepare/commit → external call → finalize/reconcile. `fn_release_escrow_to_advocate_mutex` tidak diklaim dapat membayar Notaris.
3. **e-KYC zero raw biometric:** browser berinteraksi langsung dengan SDK/provider. Justifiqa hanya menerima callback metadata yang telah diverifikasi.
4. **Status e-KYC:** status database adalah `PENDING | PASSED | REJECTED | REQUIRES_MANUAL_REVIEW`; warna **GREEN** hanya proyeksi UI untuk `PASSED`.
5. **Global Halt:** `VOIDED` digunakan untuk ilegal/fraud atau tiga kegagalan liveness; `EXPIRED` untuk TTL; histori individual tidak dihapus.
6. **Escrow:** sukses e-KYC tidak otomatis mencairkan uang. Dana tetap `HELD_IN_ESCROW`; semua terminal Global Halt menghasilkan `REFUNDED_TO_CLIENT`.
7. **Gap implementasi yang disengaja terlihat:** migrasi saat ini belum memiliki aggregate property transaction dan kolom deadline khusus yang mengikat envelope ke escrow. Diagram ini adalah kontrak target Batch 2; remediasi SQL berada di luar kewenangan batch ini.

## Tabel terkait yang benar-benar tersedia

| Diagram | Tabel utama |
| --- | --- |
| AD-P2-01 | `corporate_service_cases`, `corporate_parties`, `beneficial_owners`, `service_orders`, `service_fee_lines`, `payment_milestones`, `escrow_transactions`, `payout_idempotency_keys`, `government_submission_jobs`, `document_integrity_anchors`, `audit_logs_worm`, `user_notifications` |
| AD-P2-02 | `ekyc_verification_logs`, `signing_envelopes`, `signing_envelope_parties`, `escrow_transactions`, `payment_milestones`, `escrow_payout_ledgers`, `audit_logs_worm`, `user_notifications` |
```

