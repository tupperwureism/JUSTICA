# Project Decision & Correction Log (LifeQ Standalone Ecosystem)

Dokumen ini mencatat seluruh keputusan arsitektural penting, koreksi teknis dari pengguna, dan aturan rekayasa yang **WAJIB** dipatuhi oleh tim pengembang dan Agen AI agar tidak terjadi kesalahan berulang (*Context Rot & Memory Integrity* - Aturan 3).

---

## 1. Catatan Koreksi Teknis & Aturan PlantUML (03 Juli 2026)
* **Koreksi Pengguna**: Terjadi *syntax error* pada saat import kode PlantUML ke Draw.io karena pemenggalan baris (*newline/multiline*) di dalam tanda kutip nama aktor.
* **Akar Masalah**: Penulisan literal newline `\n` atau enter di dalam string `actor "Klien\n(Pencari Keadilan)" as Klien` dianggap sebagai tanda kutip tidak tertutup oleh parser PlantUML 1.2025.10 di Draw.io.
* **ATURAN MUTLAK PLANTUML**:
  1. **DILARANG KERAS** menggunakan karakter pemenggal baris (`\n`, `\r`, atau enter) di dalam tanda kutip untuk definisi Aktor, Use Case, Participant, Swimlane/Partition, atau Component.
  2. Semua label entitas PlantUML **WAJIB** ditulis dalam 1 baris utuh yang bersih:
     * *Benar*: `actor "Klien (Pencari Keadilan)" as Klien`
     * *Salah*: `actor "Klien\n(Pencari Keadilan)" as Klien`
  3. Biarkan mesin pembuat diagram (Draw.io/PlantUML) melakukan *text-wrapping* secara otomatis pada kotak/elemen grafisnya tanpa pemenggalan manual di level sintaks.

---

## 2. Keputusan Arsitektural: Opsi B - 100% Siloed Standalone Apps (03 Juli 2026)
* **Latar Belakang**: Keputusan bisnis terbaru dari manajemen/bos meniadakan konsep SuperApp 3 domain (Medis, Hukum, Psikologi) dan menghapus total domain Medis (*Sehatifiqa*).
* **Arsitektur Terpilih**: **Opsi B (100% Siloed & Independent Total Architecture)**.
* **Spesifikasi Arsitektur**:
  1. **Justifiqa (Domain Hukum)**: Aplikasi berdiri sendiri dari ujung ke ujung (*frontend, backend, database, authentication MFA, escrow payment, dan admin panel khusus hukum*). Tidak berbagi sistem dengan aplikasi lain.
  2. **Qualifa (Domain Psikologi)**: Aplikasi berdiri sendiri dari ujung ke ujung (*frontend, backend, database, authentication MFA, payment, dan admin panel khusus psikologi/komite etik*). Tidak berbagi sistem dengan aplikasi lain.
* **Pembersihan Konteks Lama (*Cognitive Refresh*)**:
  * Seluruh ingatan dan referensi mengenai "SuperApp", "LifeQ Core Shared Engine", "SSO LifeQ ID", dan "Domain Medis/Sehatifiqa/Dokter/Apotek" dinyatakan **TIDAK BERLAKU LAGI** dan telah dipangkas dari spesifikasi aktif proyek.

---

## 3. Status Alur Kerja Rekayasa (*Phase-Gate Tracking*)
* [x] **Langkah 1.A**: Refactoring Use Case Diagram (`plantuml_uc_diagrams.md`) & Skenario Teks (`unified_use_case_scenarios.md`, `use_case_scenarios.md`) ke Arsitektur Siloed Opsi B. *(Selesai & Direview)*
* [x] **Langkah 1.B**: Refactoring Activity Diagram (`plantuml_activity_diagrams.md`). *(Selesai & Direview)*
* [x] **Langkah 1.C**: Refactoring Sequence Diagram (`plantuml_sequence_diagrams.md`). *(Selesai & Direview)*
* [ ] **Langkah 2**: Refactoring Product Backlog (`product_backlog.md`) & Matriks Kepatuhan.
* [x] **Langkah 3**: Refactoring Wireframe & Mockup HTML (Membuang modul medis & memisahkan antarmuka Klien dan Mitra untuk Justifiqa & Qualifa). *(Selesai & Direview)*
* [ ] **Langkah 4**: Desain ERD & Database Schema Standalone.

---

## 4. Keputusan Arsitektural: Pembubuhan e-Meterai & Pemisahan Dompet Advokat (07 Juli 2026)
* **Koreksi Pengguna**: Skema A (menagih biaya e-Meterai via invoice tambahan ke klien di tengah proses stamping) menyebabkan alur kerja terlalu rumit dan bertele-tele. Usulan menggabungkan pengisian saldo dan penarikan saldo ke dalam satu Use Case ditolak karena melanggar *Single Responsibility Principle (SRP)*.
* **Arsitektur Terpilih**:
  1. **Platform-Facilitated Stamping (Peleburan J-UC14 ke J-UC12)**: Pembubuhan e-Meterai resmi Peruri Rp10.000 via Mekari Sign ditarik langsung ke dalam alur kerja perumusan kontrak (`J-UC12` / `AD-J-06` / `SD-J-06`). Biaya meterai (Rp12.000/lembar) dipotong secara otomatis dari saldo dompet digital advokat.
  2. **Pemisahan Tegas Top-Up vs Withdrawal (SRP & Clean Architecture)**:
     * **`J-UC19` (Withdrawal)**: Khusus menangani penarikan saldo (*cash-out*) ke bank pribadi, melibatkan perhitungan otomatis potongan pajak tenaga ahli PPh 21 (5%) dan verifikasi WORM Storage.
     * **`J-UC22` (Top-Up)**: Khusus menangani pengisian saldo dompet advokat (*cash-in*) melalui Payment Gateway Checkout (Snap / QRIS / VA) untuk membayar layanan platform, **tanpa pemotongan pajak PPh 21**.
* **Implikasi Spesifikasi**:
  * `J-UC14`, `AD-J-14`, dan `SD-J-14` ditiadakan sebagai diagram mandiri (dilebur seutuhnya ke dalam `J-UC12` / `AD-J-06` / `SD-J-06`).
  * `J-UC05` diubah judulnya menjadi *Melakukan Pembayaran Escrow Konsultasi* untuk memperjelas batasannya terhadap top-up dompet advokat.
  * **Enkapsulasi Sub-Activity (`AD-J-06` / `SD-J-06`)**: Dilarang keras mengekspansi atau menaruh langkah-langkah Webhook Payment Gateway di dalam diagram `AD-J-06` maupun `SD-J-06`. Alur top-up dipanggil murni sebagai sub-activity/reference (`Lihat AD-J-22` / `Lihat SD-J-22`) sebelum mengulang kembali ke pengecekan saldo, sehingga sistem dapat menangani kondisi sukses maupun gagal top-up tanpa asumsi *happy-path*.

# Project Decision & Correction Log (LifeQ Standalone Ecosystem)

Dokumen ini mencatat seluruh keputusan arsitektural penting, koreksi teknis dari pengguna, dan aturan rekayasa yang **WAJIB** dipatuhi oleh tim pengembang dan Agen AI agar tidak terjadi kesalahan berulang (*Context Rot & Memory Integrity* - Aturan 3).

---

## 1. Catatan Koreksi Teknis & Aturan PlantUML (03 Juli 2026)
* **Koreksi Pengguna**: Terjadi *syntax error* pada saat import kode PlantUML ke Draw.io karena pemenggalan baris (*newline/multiline*) di dalam tanda kutip nama aktor.
* **Akar Masalah**: Penulisan literal newline `\n` atau enter di dalam string `actor "Klien\n(Pencari Keadilan)" as Klien` dianggap sebagai tanda kutip tidak tertutup oleh parser PlantUML 1.2025.10 di Draw.io.
* **ATURAN MUTLAK PLANTUML**:
  1. **DILARANG KERAS** menggunakan karakter pemenggal baris (`\n`, `\r`, atau enter) di dalam tanda kutip untuk definisi Aktor, Use Case, Participant, Swimlane/Partition, atau Component.
  2. Semua label entitas PlantUML **WAJIB** ditulis dalam 1 baris utuh yang bersih:
     * *Benar*: `actor "Klien (Pencari Keadilan)" as Klien`
     * *Salah*: `actor "Klien\n(Pencari Keadilan)" as Klien`
  3. Biarkan mesin pembuat diagram (Draw.io/PlantUML) melakukan *text-wrapping* secara otomatis pada kotak/elemen grafisnya tanpa pemenggalan manual di level sintaks.

---

## 2. Keputusan Arsitektural: Opsi B - 100% Siloed Standalone Apps (03 Juli 2026)
* **Latar Belakang**: Keputusan bisnis terbaru dari manajemen/bos meniadakan konsep SuperApp 3 domain (Medis, Hukum, Psikologi) dan menghapus total domain Medis (*Sehatifiqa*).
* **Arsitektur Terpilih**: **Opsi B (100% Siloed & Independent Total Architecture)**.
* **Spesifikasi Arsitektur**:
  1. **Justifiqa (Domain Hukum)**: Aplikasi berdiri sendiri dari ujung ke ujung (*frontend, backend, database, authentication MFA, escrow payment, dan admin panel khusus hukum*). Tidak berbagi sistem dengan aplikasi lain.
  2. **Qualifa (Domain Psikologi)**: Aplikasi berdiri sendiri dari ujung ke ujung (*frontend, backend, database, authentication MFA, payment, dan admin panel khusus psikologi/komite etik*). Tidak berbagi sistem dengan aplikasi lain.
* **Pembersihan Konteks Lama (*Cognitive Refresh*)**:
  * Seluruh ingatan dan referensi mengenai "SuperApp", "LifeQ Core Shared Engine", "SSO LifeQ ID", dan "Domain Medis/Sehatifiqa/Dokter/Apotek" dinyatakan **TIDAK BERLAKU LAGI** dan telah dipangkas dari spesifikasi aktif proyek.

---

## 3. Status Alur Kerja Rekayasa (*Phase-Gate Tracking*)
* [x] **Langkah 1.A**: Refactoring Use Case Diagram (`plantuml_uc_diagrams.md`) & Skenario Teks (`unified_use_case_scenarios.md`, `use_case_scenarios.md`) ke Arsitektur Siloed Opsi B. *(Selesai & Direview)*
* [x] **Langkah 1.B**: Refactoring Activity Diagram (`plantuml_activity_diagrams.md`). *(Selesai & Direview)*
* [x] **Langkah 1.C**: Refactoring Sequence Diagram (`plantuml_sequence_diagrams.md`). *(Selesai & Direview)*
* [ ] **Langkah 2**: Refactoring Product Backlog (`product_backlog.md`) & Matriks Kepatuhan.
* [x] **Langkah 3**: Refactoring Wireframe & Mockup HTML (Membuang modul medis & memisahkan antarmuka Klien dan Mitra untuk Justifiqa & Qualifa). *(Selesai & Direview)*
* [ ] **Langkah 4**: Desain ERD & Database Schema Standalone.

---

## 4. Keputusan Arsitektural: Pembubuhan e-Meterai & Pemisahan Dompet Advokat (07 Juli 2026)
* **Koreksi Pengguna**: Skema A (menagih biaya e-Meterai via invoice tambahan ke klien di tengah proses stamping) menyebabkan alur kerja terlalu rumit dan bertele-tele. Usulan menggabungkan pengisian saldo dan penarikan saldo ke dalam satu Use Case ditolak karena melanggar *Single Responsibility Principle (SRP)*.
* **Arsitektur Terpilih**:
  1. **Platform-Facilitated Stamping (Peleburan J-UC14 ke J-UC12)**: Pembubuhan e-Meterai resmi Peruri Rp10.000 via Mekari Sign ditarik langsung ke dalam alur kerja perumusan kontrak (`J-UC12` / `AD-J-06` / `SD-J-06`). Biaya meterai (Rp12.000/lembar) dipotong secara otomatis dari saldo dompet digital advokat.
  2. **Pemisahan Tegas Top-Up vs Withdrawal (SRP & Clean Architecture)**:
     * **`J-UC19` (Withdrawal)**: Khusus menangani penarikan saldo (*cash-out*) ke bank pribadi, melibatkan perhitungan otomatis potongan pajak tenaga ahli PPh 21 (5%) dan verifikasi WORM Storage.
     * **`J-UC22` (Top-Up)**: Khusus menangani pengisian saldo dompet advokat (*cash-in*) melalui Payment Gateway Checkout (Snap / QRIS / VA) untuk membayar layanan platform, **tanpa pemotongan pajak PPh 21**.
* **Implikasi Spesifikasi**:
  * `J-UC14`, `AD-J-14`, dan `SD-J-14` ditiadakan sebagai diagram mandiri (dilebur seutuhnya ke dalam `J-UC12` / `AD-J-06` / `SD-J-06`).
  * `J-UC05` diubah judulnya menjadi *Melakukan Pembayaran Escrow Konsultasi* untuk memperjelas batasannya terhadap top-up dompet advokat.
  * **Enkapsulasi Sub-Activity (`AD-J-06` / `SD-J-06`)**: Dilarang keras mengekspansi atau menaruh langkah-langkah Webhook Payment Gateway di dalam diagram `AD-J-06` maupun `SD-J-06`. Alur top-up dipanggil murni sebagai sub-activity/reference (`Lihat AD-J-22` / `Lihat SD-J-22`) sebelum mengulang kembali ke pengecekan saldo, sehingga sistem dapat menangani kondisi sukses maupun gagal top-up tanpa asumsi *happy-path*.

---

## 5. Keputusan Arsitektural: Isolasi Domain Admin Backoffice (08 Juli 2026)
* **Koreksi Pengguna**: Penggabungan alur Login Admin Backoffice untuk Justifiqa dan Qualifa ke dalam satu diagram templat bersama (`AD-ADMIN-01: J-UC20 / Q-UC20`) melanggar prinsip *100% Siloed & Independent Total Architecture (Opsi B)*.
* **Arsitektur Terpilih**:
  * **Penghapusan Diagram Gabungan**: `AD-ADMIN-01` ditiadakan seutuhnya dari seluruh spesifikasi.
  * **Spesifikasi Spesifik Domain**: Alur Login Admin Backoffice dipecah menjadi dua diagram yang sepenuhnya independen pada masing-masing domain, lengkap dengan spesifikasi URL, IAM Gateway, Database Kredensial, dan WORM Audit Storage terpisah:
    1. **Justifiqa (`J-UC20`)**: Direpresentasikan oleh **`AD-J-20`** dan **`SD-J-20`** (mengarah ke portal `admin.justifiqa.com` dan dasbor `SCR-JST-07`).
    2. **Qualifa (`Q-UC20`)**: Direpresentasikan oleh **`AD-Q-20`** dan **`SD-Q-20`** (mengarah ke portal `admin.qualifa.com` dan dasbor `SCR-QLF-07`).

---

## 6. Keputusan Arsitektural: Wajib Spesifikasi Eksekusi / Activation Bars pada Sisi Sistem & User/Actor (08 Juli 2026)
* **Koreksi Pengguna**: Seluruh Sequence Diagram sebelumnya tidak memiliki *activation bars* (`activate` / `deactivate` atau `++` / `--`). Bahkan pada iterasi perbaikan awal, activation bar hanya ditambahkan pada sisi sistem (Frontend, Backend, DB, Eksternal), sementara **pada sisi User/Actor (Klien, Mitra Advokat/Psikolog, Admin) sama sekali tidak memiliki activation bar**. Selain itu, terdapat kesalahan arah panah balasan (`return arrow`) dari SMS Gateway yang langsung diarahkan ke User (`SMS --> User --`) padahal SMS Gateway dipanggil oleh Backend (`BE`), serta masih terdapat sisa teks lawas mengenai "Toggle ONLINE" pada alur ketersediaan praktik yang bertentangan dengan keputusan penjadwalan otomatis kalender.
* **Arsitektur Terpilih**:
  1. **Penerapan Mutlak Activation Bars Sisi Sistem & User/Actor**: Seluruh Sequence Diagram pada domain Justifiqa (`SD-J-01` sd `SD-J-20`) dan Qualifa (`SD-Q-01` sd `SD-Q-20`) **WAJIB** dilengkapi notasi masa eksekusi aktif (`++` / `--` atau `activate` / `deactivate`) untuk setiap pemanggilan layanan, **termasuk pada sisi User/Actor** (memulai sesi interaksi dengan `activate <Actor>` dan mengakhirinya dengan `deactivate <Actor>`).
  2. **Penjadwalan Slot Kalender**: Menghapus seluruh terminologi "Toggle ONLINE" dari `SD-J-04` dan `SD-Q-04`, diganti dengan "Atur Ketersediaan Slot Kalender" yang mengandalkan pengecekan konflik jadwal otomatis (`HTTP 409` / `HTTP 422`).
  3. **Aturan Return Arrow API Gateway**: Pemanggilan API eksternal dari Backend (seperti SMS Gateway, Payment Gateway, Dukcapil, Peradi, Peruri, WORM) **WAJIB** mengembalikan respons HTTP ke sistem yang memanggilnya (`SMS --> BE -- : 200 OK`), **DILARANG KERAS** mengarahkan return arrow ke User (`SMS --> User --`) yang merusak struktur *call stack* API. Pengiriman pesan fisik ke ponsel/email pengguna direpresentasikan sebagai notasi catatan atau panah event terpisah pasca-respons Backend ke Frontend.
  4. **Aturan Return Arrow Database & Internal Call**: Setiap pemanggilan query atau transaksi ke Database (`BE -> DB ++`) **WAJIB** diakhiri dengan panah balasan (`DB --> BE -- : 200 OK / Rows Affected`), tidak boleh hanya dinonaktifkan sepihak (`deactivate DB`). Hal yang sama berlaku untuk pemanggilan internal method pada Backend (`BE -> BE ++` wajib diringangi `BE --> BE --`).
  5. **Batas Keamanan Blok Kondisional (`alt`)**: Transaksi pembaruan database (seperti `Update Last Login Timestamp`) dan pencetakan token sesi (seperti `Generate JWT Session Token`) **WAJIB TETAP BERADA DI DALAM** blok percabangan kondisi valid (`alt [OTP Valid & Belum Expire]`). Dilarang keras memindahkan langkah kritis tersebut ke luar/sebelum blok `alt` hanya demi memperkecil tampilan visual frame, karena akan menyebabkan cacat fatal di mana jam login dan token JWT diproses untuk setiap percobaan OTP, termasuk OTP yang salah/invalid.
  6. **Larangan Penggunaan Shorthand Deactivation (`--`) pada Panah yang Mengarah ke Aktor/User**: Dalam sintaks PlantUML, menaruh `--` pada panah balasan visualisasi UI atau API ke arah Aktor (seperti `FE --> Klien --` atau `PG --> Klien --`) akan menonaktifkan Aktor penerima di tengah interaksi dan menyebabkan *double deactivation error* (`Activate/Deactivate already done on Klien`). Seluruh panah visualisasi ke Aktor wajib ditulis bersih tanpa `--` (`FE --> Klien`). Aktor hanya diaktifkan 1 kali saat interaksi dimulai (`activate <Actor>`) dan dinonaktifkan 1 kali di akhir diagram sebelum `@enduml` (`deactivate <Actor>`).
  7. **Aturan 1-to-1 dan Supremasi Detail Sequence Diagram terhadap Activity Diagram (`SD > AD`)**: Sequence Diagram (SD) berkedudukan sebagai representasi teknis dan sistemik yang lebih terperinci daripada Activity Diagram (AD). Seluruh blok keputusan (`if/else`), percabangan logika bisnis, serta alur pengulangan/retry yang terdapat pada AD **WAJIB** dipetakan secara penuh ke dalam sintaks programmable SD (`alt` / `else` / `loop` / `opt`), lengkap dengan pemanggilan endpoint API yang relevan (seperti `POST /api/v1/auth/resend-otp` atau retry payment), pembaruan status database, dan respons HTTP yang sesuai (`400`, `401`, `402`, `409`, `422`). SD dilarang keras disederhanakan menjadi sekadar *happy path* atau berhenti pada pesan error statis tanpa memetakan siklus pengulangan yang ada pada AD.
  8. **Aturan Lingkungan Windows PowerShell (Anti-&& Bias)**: Lingkungan operasional proyek ini menggunakan Windows PowerShell. Seluruh perintah penggabungan terminal **WAJIB** menggunakan pemisah titik koma (`;`) atau dieksekusi secara terpisah. Dilarang keras menggunakan sintaks POSIX `&&` yang selalu memicu *parser error* pada PowerShell.
  9. **Aturan Anti-Halusinasi & Verifikasi Penggantian Kode**: Dalam setiap eksekusi modifikasi file secara programatik (skrip Python *replace*), skrip **WAJIB** mengimplementasikan *error statement* eksplisit jika string target tidak ditemukan (`if target not in content: raise ValueError()`). Agen dilarang menyimpulkan perbaikan berhasil hanya karena perintah terminal tidak menghasilkan *runtime error*; verifikasi pembacaan isi file harus dilakukan secara fisik sebelum melaporkan hasil kepada pengguna.
  10. **Aturan Aktivasi Kontinu pada Percabangan Kondisional (`alt` / `else` / `loop`)**: Dalam PlantUML, parser memproses state aktivasi secara linear dari atas ke bawah. Jika seorang participant (`BE`, `FE`) dinonaktifkan (`deactivate BE`) di dalam cabang pertama (`alt [Error]`) atau di dalam siklus pengulangan (`loop [Retry]`), parser akan menandai participant tersebut nonaktif. Standalone `activate BE` di dalam cabang `else` berikutnya sering kali diabaikan oleh layout engine PlantUML karena tidak terikat pada panah pesan yang masuk. Untuk menjamin *activation bar* yang 100% utuh dan kontinu pada seluruh cabang eksekusi tanpa terputus, **DILARANG KERAS** menaruh perintah `deactivate BE` atau `deactivate FE` di dalam cabang `alt`, `else`, atau `loop` yang merupakan bagian dari satu sesi interaksi yang sama. Biarkan participant tetap aktif selama validasi/retry berlangsung, dan lakukan deaktivasi (`deactivate BE`, `deactivate FE`) hanya satu kali di akhir rangkaian interaksi (sebelum `@enduml` atau pada penutupan sesi).
  11. **Pola Outer Loop & Annotasi Eksplisit Break/Repeat (`Outer Loop Validation Pattern`)**: Setiap alur validasi atau verifikasi yang memiliki mekanisme pengulangan/retry (seperti registrasi, login, verifikasi OTP, retry pembayaran, atau pengaturan kalender) **WAJIB dibungkus dari awal trigger pesan hingga evaluasi kondisi dalam satu `loop [Maksimal Nx Percobaan ...]` di bagian luar (Outer Loop)**. Di dalam blok kondisional (`alt / else`), **WAJIB** ditambahkan anotasi note eksplisit agar pembaca teknis dapat memahami titik keluar dari loop dengan jelas: (a) Pada cabang kegagalan (yang memicu pengulangan): tambahkan `note over <Actor>, <Participant> : [REPEAT LOOP: ... penjelasan ... to baris awal loop]`; (b) Pada cabang keberhasilan (yang menghentikan pengulangan): tambahkan `note over <Actor>, <Participant> : [BREAK LOOP: ... penjelasan kondisi sukses ...]`.

