# Matriks Hukum e-KYC dan TTE Multi-Pihak

**Status:** spesifikasi operasional P2-B2 — wajib dipenuhi sebelum produksi
**Ruang lingkup:** verifikasi identitas Klien/Advokat dan TTE tersertifikasi melalui provider eksternal

## 1. Landasan dan batas klaim hukum

| Instrumen | Kewajiban desain Justica | Batas klaim |
| --- | --- | --- |
| [UU No. 1 Tahun 2024](https://www.peraturan.go.id/id/uu-no-1-tahun-2024), perubahan kedua UU ITE | TTE harus terikat pada penanda tangan, berada dalam kuasanya saat penandatanganan, dan perubahan pascatanda tangan dapat diketahui. | Klik, OTP, atau liveness saja tidak otomatis menjadikan suatu dokumen TTE tersertifikasi atau memenuhi formalitas dokumen tertentu. |
| [PP No. 71 Tahun 2019](https://peraturan.go.id/id/pp-no-71-tahun-2019) | Sistem elektronik harus andal, aman, bertanggung jawab, memiliki jejak audit, dan menjaga integritas dokumen/transaksi. | Justica bukan penerbit sertifikat dan tidak menyimpan kunci privat penanda tangan. |
| [Permenkominfo No. 11 Tahun 2022](https://jdih.komdigi.go.id/produk_hukum/view/id/833/t/peraturan%2Bmenteri%2Bkomunikasi%2Bdan%2Binformatika%2Bnomor%2B11%2Btahun%2B2022) | Gunakan PSrE Indonesia yang pengakuan dan layanannya masih berlaku; verifikasi status melalui [registri resmi Komdigi](https://tte.komdigi.go.id/) pada pengadaan dan sebelum go-live. | Nama merek, status PSE, materi pemasaran, atau integrasi dengan partner PSrE bukan bukti tunggal bahwa seluruh layanan merek tersebut adalah layanan PSrE yang diakui. |

Privy, VIDA, Mekari Sign, dan ASLI RI boleh masuk proses RFP. Pemilihan akhir wajib membuktikan rantai provider aktual untuk setiap layanan, pengakuan PSrE terkini bila TTE tersertifikasi ditawarkan, Certification Practice Statement, cakupan sertifikat, webhook signing, lokasi data, subprosesor, retensi/penghapusan, audit PAD/liveness, SLA insiden, dan mekanisme keluar/ekspor. Status tersebut harus diperiksa ulang; dokumen ini tidak mensertifikasi merek tertentu.

## 2. Matriks tanggung jawab

| Aktivitas | Justica | Provider e-KYC/PSrE | Advokat/Notaris |
| --- | --- | --- | --- |
| Intake dan notice | Menampilkan tujuan, dasar pemrosesan, provider, versi notice, retry, dan jalur manual. | Menyediakan SDK/redirect yang tervalidasi. | Menilai kebutuhan dan formalitas dokumen. |
| OCR/liveness/face match | Membuat sesi dan menerima hasil terverifikasi; tidak menerima media mentah. | Memproses capture, anti-spoofing, dan pencocokan pada infrastrukturnya. | Melakukan review manusia atas hasil meragukan. |
| Penerbitan sertifikat/kunci | Menyimpan reference ID dan digest saja. | Mengendalikan penerbitan sertifikat serta kunci privat sesuai kewenangannya. | Memastikan identitas dan kewenangan pihak sesuai konteks hukum. |
| TTE multi-pihak | Mengatur envelope, urutan, pihak, digest dokumen, status, dan audit metadata. | Mengikat consent/signature ke digest, menerbitkan callback yang ditandatangani, dan menyediakan bukti validasi. | Menentukan kelayakan remote signing serta kebutuhan saksi/notaris. |
| WORM dan verifikasi | Menjaga catatan terminal append-only dan proyeksi publik minimum. | Menyediakan audit bundle, timestamp, status sertifikat/revokasi. | Menilai akibat hukum; verifikasi integritas bukan opini sahnya transaksi. |

## 3. Zero Raw Biometric Storage — aturan mutlak

Justica **DILARANG KERAS** menyimpan foto raw KTP, hasil crop KTP, selfie/foto/video liveness, rekaman suara biometrik, sidik jari, template wajah, embedding, atau payload provider yang memuat data tersebut di PostgreSQL, log aplikasi, analytics, error tracker, cache, backup, maupun storage internal Justica.

Allow-list persistensi hanya:

- `verification_id`, `user_id`, peran, provider dan jenis verifikasi;
- status `PENDING`, `PASSED`, `REJECTED`, atau `REQUIRES_MANUAL_REVIEW`;
- opaque `provider_reference_id` / `external_envelope_id` / recipient ID;
- digest SHA-256 64 karakter heksadesimal atas audit bundle atau hasil yang telah diminimalkan;
- waktu verifikasi/penandatanganan dan metadata status minimum.

Hash bukan anonimisasi. Digest tidak boleh dibuat dari NIK atau nilai berentropi rendah tanpa konstruksi provider yang aman. Telemetri wajib memakai allow-list dan redaction; URL callback tidak boleh membawa NIK, email, atau credential. Bila provider mengharuskan retensi media, retensi tersebut berada pada sistem provider berdasarkan kontrak, tujuan yang sah, jadwal penghapusan terpendek, dan hasil DPIA—bukan disalin ke Justica.

## 4. Alur minimum dan kontrol kegagalan

1. Justica menampilkan notice, memperoleh tindakan afirmatif, dan membuat sesi provider satu kali.
2. Browser berpindah ke SDK/halaman provider; media tidak melewati API atau storage Justica.
3. Backend menerima callback HTTPS, memverifikasi signature, timestamp, nonce/idempotency key, dan mencegah replay.
4. Backend menyimpan reference ID, status, digest SHA-256, dan waktu; payload mentah tidak masuk log atau tabel.
5. `REJECTED` tidak boleh menjadi keputusan material yang sepenuhnya otomatis. Pengguna mendapat retry yang terbatas, aksesibel, serta jalur `REQUIRES_MANUAL_REVIEW`.
6. Sebelum envelope dikirim, digest dokumen dibekukan. Pergantian byte dokumen mengharuskan envelope baru.
7. Status `SIGNED` dan `COMPLETED` bersifat terminal/append-only. Void atau expiry dicatat sebagai status terminal, bukan penghapusan riwayat.

## 5. Gate produksi

- DPIA, DPA, daftar subprosesor, lokasi/transfer data, dan jadwal penghapusan disetujui.
- Status PSrE dan cakupan layanan dicek pada registri resmi pada tanggal go-live.
- Uji replay/deepfake/virtual-camera, callback spoofing, document swap, signer-order bypass, dan enumeration lulus.
- Jalur manual tersedia dan tidak meminta pengguna mengirim KTP/selfie melalui WhatsApp atau kanal tak terkendali.
- Audit database membuktikan tidak ada kolom, object path, atau log field untuk biometrik mentah/kredensial.

**Keputusan arsitektur:** Justica membeli primitive e-KYC/TTE dan bertindak sebagai orchestrator metadata. Justica bukan model biometrik, PSrE, penerbit sertifikat, ataupun penyimpan kunci privat.
