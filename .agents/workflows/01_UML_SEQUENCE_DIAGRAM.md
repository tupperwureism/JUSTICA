# Standard Operating Procedure (SOP): Fase 1.C - UML Sequence Diagram

Dokumen ini adalah acuan mutlak (*SOP & Guardrails*) bagi Agen ketika bertugas pada **Fase 1.C: UML Sequence Diagram (`plantuml_sequence_diagrams.md`)**. Agen **WAJIB** membaca dan menerapkan pedoman ini sebelum melakukan analisis, generate, atau refactoring pada dokumen sequence diagram.

---

## 1. SUPREMASI DETAIL SEQUENCE DIAGRAM TERHADAP ACTIVITY DIAGRAM (`SD > AD`)
* Sequence Diagram (SD) berkedudukan sebagai representasi teknis, sistemik, dan programmik yang lebih terperinci daripada Activity Diagram (AD).
* Seluruh blok keputusan (`if/else`), percabangan logika bisnis, serta alur pengulangan/retry yang terdapat pada AD **WAJIB** dipetakan secara penuh ke dalam sintaks programmable SD (`alt` / `else` / `loop` / `opt`).
* **Larangan Happy Path:** SD dilarang keras disederhanakan menjadi sekadar *happy path* atau berhenti pada pesan error statis tanpa memetakan siklus pengulangan yang ada pada AD.
* **Kelengkapan Teknis:** Setiap interaksi sistem harus memetakan endpoint API yang relevan (misal: `POST /api/v1/auth/register`), query/transaksi database (`Check Existing Email/NIK`), dan kode status HTTP yang presisi (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `402 Payment Required`, `409 Conflict`, `422 Unprocessable Entity`).

---

## 2. ATURAN ACTIVATION BAR & DEACTIVATION
1. **Pasangan Aktivasi Presisi:** Setiap pemanggilan pesan yang memicu proses baru pada participant (`BE`, `FE`, `DB`, `Ext`, `PG`) **WAJIB** menggunakan tanda aktivasi (`++`) dan diakhiri dengan deaktivasi (`--`).
2. **Larangan Shorthand Deactivation (`--`) pada Panah ke Aktor/User:** 
   * Dalam sintaks PlantUML, menaruh `--` pada panah balasan ke arah Aktor (seperti `FE --> Klien --` atau `PG --> Klien --`) akan menonaktifkan Aktor penerima di tengah interaksi dan menyebabkan *double deactivation error* (`Activate/Deactivate already done on Klien`).
   * **Aturan Mutlak:** Seluruh panah visualisasi ke Aktor wajib ditulis bersih tanpa `--` (`FE --> Klien`).
   * Aktor hanya diaktifkan 1 kali saat interaksi dimulai (`activate <Actor>`) dan dinonaktifkan 1 kali di akhir diagram sebelum `@enduml` (`deactivate <Actor>`).
3. **Return Arrow Mutlak:** Pemanggilan ke API eksternal, Database, atau internal method (`BE -> DB ++`, `BE -> BE ++`) wajib diringangi oleh panah balasan eksplisit (`DB --> BE -- : Return Result`).
4. **Aturan Aktivasi Kontinu pada Percabangan Kondisional (`alt` / `else` / `loop`):**
   * Dalam PlantUML, parser memproses state aktivasi secara linear dari atas ke bawah. Jika seorang participant (`BE`, `FE`) dinonaktifkan (`deactivate BE`) di dalam cabang pertama (`alt [Error]`) atau di dalam siklus pengulangan (`loop [Retry]`), parser akan menandai participant tersebut nonaktif. Standalone `activate BE` di dalam cabang `else` berikutnya sering kali diabaikan oleh layout engine PlantUML karena tidak terikat pada panah pesan yang masuk.
   * **Aturan Mutlak:** Untuk menjamin *activation bar* yang 100% utuh dan kontinu pada seluruh cabang eksekusi tanpa terputus, **DILARANG KERAS** menaruh perintah `deactivate BE` atau `deactivate FE` di dalam cabang `alt`, `else`, atau `loop` yang merupakan bagian dari satu sesi interaksi yang sama. Biarkan participant tetap aktif selama validasi/retry berlangsung, dan lakukan deaktivasi (`deactivate BE`, `deactivate FE`) hanya satu kali di akhir rangkaian interaksi (sebelum `@enduml` atau pada penutupan sesi).
5. **Pola Outer Loop & Annotasi Eksplisit Break/Repeat (`Outer Loop Validation Pattern`):**
   * Setiap alur validasi atau verifikasi yang memiliki mekanisme pengulangan/retry (misalnya registrasi, login, verifikasi OTP, retry pembayaran, atau pengaturan kalender) **WAJIB dibungkus dari awal trigger pesan hingga evaluasi kondisi dalam satu `loop [Maksimal Nx Percobaan ...]` di bagian luar (Outer Loop)**.
   * Di dalam blok kondisional (`alt / else`), **WAJIB** ditambahkan anotasi note eksplisit agar pembaca teknis dapat dengan jelas memahami titik keluar dari loop tanpa kebingungan:
     - Pada cabang kegagalan (yang memicu pengulangan): tambahkan `note over <Actor>, <Participant> : [REPEAT LOOP: ... penjelasan ... to baris awal loop]`.
     - Pada cabang keberhasilan (yang menghentikan pengulangan): tambahkan `note over <Actor>, <Participant> : [BREAK LOOP: ... penjelasan kondisi sukses ...]`.

---

## 3. BATAS KEAMANAN BLOK KONDISIONAL (`alt` & `loop`)
* Transaksi kritis (seperti pemutakhiran `Last Login Timestamp`, pencetakan token JWT, atau pencairan dana Escrow) **WAJIB TETAP BERADA DI DALAM** blok percabangan kondisi valid (`alt [OTP Valid]` atau `alt [Webhook PAID]`).
* Dilarang keras menaruh penutupan blok (`end`) sebelum proses kritis selesai hanya demi memperkecil tampilan visual frame.
* **Verifikasi Enclosure:** Dalam blok pengulangan error (`loop [Coba Perbaiki Input]`), pastikan pesan perbaikan dari user ke FE dan FE ke BE sepenuhnya tertutup oleh tag `end`.

---

## 4. PROSEDUR VERIFIKASI & AUDIT
Sebelum melaporkan diagram kepada pengguna:
1. Lakukan verifikasi sintaksis dengan memeriksa apakah setiap perintah `activate` memiliki pasangan `deactivate` yang seimbang.
2. Gunakan pembacaan fisik atau skrip pencarian untuk memastikan setiap percabangan error dari Activity Diagram telah memiliki blok `alt` dan `loop` di Sequence Diagram.
3. Pastikan tidak ada karakter terlarang atau pemotongan blok yang menyebabkan *syntax error* pada PlantUML / Draw.io parser.
