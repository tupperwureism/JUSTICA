# Standard Operating Procedure (SOP): Fase 1.B - UML Activity Diagram

Dokumen ini adalah acuan mutlak (*SOP & Guardrails*) bagi Agen ketika bertugas pada **Fase 1.B: UML Activity Diagram (`plantuml_activity_diagrams.md`)**. Agen **WAJIB** membaca dan menerapkan pedoman ini sebelum melakukan analisis, generate, atau modifikasi pada dokumen activity diagram.

---

## 1. KEDUDUKAN & TUJUAN ACTIVITY DIAGRAM (`AD AS BUSINESS LOGIC BLUEPRINT`)
* **Representasi Lintas Aktor & Sistem:** Activity Diagram (AD) berkedudukan sebagai cetak biru logika bisnis (*business workflow blueprint*) yang memetakan alur kerja end-to-end antaraktor manusia dan sistem.
* **Fondasi Logika Percabangan:** Seluruh titik keputusan hukum, aturan bisnis, dan kondisi penolakan/persetujuan yang didefinisikan dalam AD akan menjadi dasar rujukan mutlak bagi pembuatan Sequence Diagram (`SD > AD`).
* **Larangan Happy Path:** AD dilarang keras hanya memetakan skenario sukses (*happy path*). Skenario kegagalan, kedaluwarsa waktu (*timeout/expired*), penolakan moderasi, dan pengulangan input (*retry*) wajib tergambar secara jelas.

---

## 2. ATURAN PARTISI SWIMLANE (`|Actor / System|`)
1. **Pemisahan Tanggung Jawab Eksekusi Mutlak:**
   * Setiap aktivitas wajib ditempatkan di dalam swimlane yang tepat menggunakan sintaks partisi PlantUML (`|Nama Aktor/Sistem|`).
   * Contoh partisi standar:
     - `|Klien Justifiqa|` / `|Advokat Justifiqa|`
     - `|Backend Independen Justifiqa|`
     - `|Payment Gateway|`
     - `|Admin Legal Justifiqa|`
2. **Larangan Polusi Swimlane:**
   * Dilarang menempatkan proses komputasi server (misal: *Generate Token*, *Verifikasi Hash SHA-256*, *Catat ke WORM Storage*) di dalam swimlane aktor manusia.
   * Aktor manusia hanya melakukan aktivitas antarmuka (UI): mengisi form, menekan tombol, mengunggah berkas, atau menerima/membaca notifikasi.

---

## 3. ATURAN PERCABANGAN LOGIKA (`if / else / endif`) & KONKURENSI (`fork`)
1. **Kejelasan Label Kondisi Percabangan:**
   * Setiap blok `if (Kondisi?) then (Ya/Valid)` wajib memiliki label kondisi yang spesifik dan objektif (misal: `if (Apakah Bukti Permulaan Sah & Terverifikasi SHA-256?) then (Ya - Bukti Valid)`).
   * Cabang `else` wajib diberi label kondisi sebaliknya (misal: `else (Tidak - Bukti Tidak Sah / Laporan Palsu)`).
2. **Aturan Eksekusi Paralel & Konkurensi (`fork / fork again / end fork`):**
   * Ketika sistem mengeksekusi dua atau lebih aktivitas secara bersamaan (*concurrent execution*), **WAJIB** menggunakan blok `fork`.
   * **Contoh Wajib Fork:**
     - Backend mencatat log audit ke `WORM Storage` **sekaligus** mengirim Email/Push Notifikasi kepada Aktor.
     - Klien dan Advokat memasuki ruang konsultasi E2EE secara bersamaan.
   * **Larangan Ambiguitas Node Tunggal:** Dilarang menggabungkan dua aksi paralel ke dalam satu node tunggal (misal dilarang menulis `:Catat ke WORM & Kirim Email ke Advokat;` dalam satu kotak tanpa kejelasan alur penerimaan oleh advokat).

---

## 4. INTEGRASI KEAMANAN & KEPATUHAN HUKUM PLATFORM
* Setiap alur kerja yang melibatkan bukti digital, sanksi moderasi, atau transaksi keuangan wajib secara eksplisit menyertakan langkah kepatuhan platform pada swimlane Backend:
  1. **Integritas WORM Storage:** Setiap penerbitan surat penting (panggilan klarifikasi, SK pemecatan, surat peringatan) dan pencatatan laporan wajib dicap dengan stempel kriptografi **Hash SHA-256**.
  2. **Due Process of Law:** Alur penindakan sanksi berat wajib menyertakan masa sanggah/banding eksplisit sebelum putusan akhir dijatuhkan.

---

## 5. PROSEDUR VERIFIKASI & AUDIT SINTAKSIS AD
Sebelum melaporkan diagram kepada pengguna:
1. Pastikan diagram diawali dengan `start` dan diakhiri dengan `stop` pada jalur eksekusi yang tepat.
2. Verifikasi bahwa setiap blok percabangan `if` ditutup oleh `endif`, dan setiap blok `fork` ditutup oleh `end fork`.
3. Verifikasi keselarasan ID Use Case (`J-UCxx` / `Q-UCxx`) pada judul diagram terhadap dokumen *Traceability Matrix*.
