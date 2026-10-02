# Corporate Concierge Legal and Partner Matrix

**Kode:** P2-B1<br>
**Modul:** J-BIZ — Pendirian PT/CV dan Verifikasi BO/PMPJ<br>
**Status:** OPERATING BOUNDARY — PHASE 2<br>
**Tanggal basis hukum:** 22 Juli 2026 (WIB)

## 1. Tujuan dan batas dokumen

Dokumen ini menetapkan batas layanan digital Justica dan pekerjaan profesional yang tidak boleh digantikan oleh sistem. J-BIZ adalah sarana intake, orkestrasi, bukti persetujuan, pembayaran milestone, dan pelacakan. J-BIZ **bukan notaris**, tidak menerbitkan akta, tidak memberi pengesahan badan hukum, tidak menjadi akun pemohon AHU/OSS, dan tidak menjamin bahwa nama, KBLI, izin, atau permohonan pemerintah akan disetujui.

Setiap kasus wajib menyimpan versi ruang lingkup hukum (`legal_scope_version`) dan persetujuan biaya sebelum pekerjaan profesional dimulai. Perubahan hukum, klasifikasi risiko, KBLI, atau fakta pengguna jasa dapat mengubah kebutuhan dokumen, biaya, dan SLA.

## 2. Matriks layanan dan kategori usaha

| Kode layanan | Bentuk dan sasaran | Intake minimum | Gerbang profesional/pemerintah | Batas mutlak |
|---|---|---|---|---|
| `PT_ORDINARY` | Perseroan persekutuan modal dengan dua atau lebih pihak sesuai struktur modal dan organ perseroan | Nama usulan, domisili, KBLI, modal, pendiri/pemegang saham, direksi/komisaris, BO | Notaris memeriksa dan membuat akta; pemohon berwenang mengajukan melalui SABH; setelah status AHU, perizinan berbasis risiko diproses melalui OSS | Sistem tidak membuat atau mengesahkan akta dan tidak menyatakan izin pasti terbit |
| `PT_INDIVIDUAL_UMK` | Perseroan perorangan yang memenuhi kriteria usaha mikro dan kecil menurut PP 8/2021 | Pemilik tunggal orang perseorangan, pernyataan pendirian, nama, domisili, KBLI, modal, BO/pengendali | Kelayakan UMK dan data pernyataan diverifikasi; pendaftaran melalui SABH; NIB/perizinan melalui OSS | Jika syarat pemilik tunggal/UMK tidak terpenuhi atau berubah, kasus harus dialihkan ke jalur yang sesuai; sistem tidak menyamarkan PT biasa sebagai PT perorangan |
| `CV` | Persekutuan komanditer dengan sekutu aktif dan sekutu pasif | Nama, domisili, KBLI, kontribusi/modal, sekutu aktif/pasif, BO | Notaris memeriksa akta dan menjadi pemohon pendaftaran SABU; NIB/perizinan melalui OSS | CV bukan badan hukum PT; antarmuka dan dokumen tidak boleh menyebut saham/direksi/komisaris sebagai struktur CV |

Dasar primer: [PP 8/2021](https://www.peraturan.go.id/id/pp-no-8-tahun-2021), [Permenkumham 17/2018](https://www.peraturan.go.id/id/permenkumham-no-17-tahun-2018), [panduan resmi AHU untuk SABH/SABU dan BO](https://panduan.ahu.go.id/doku.php), dan [PP 28/2025](https://peraturan.go.id/id/pp-no-28-tahun-2025). PP 28/2025 mencabut PP 5/2021; konfigurasi OSS tidak boleh tetap mengacu pada matriks izin PP 5/2021.

## 3. Responsibility matrix

| Aktivitas | Sistem Justica | Klien/pengguna jasa | Advokat/reviewer kepatuhan | Notaris mitra |
|---|---|---|---|---|
| Pemilihan bentuk usaha | Menyediakan pertanyaan penyaring dan disclosure; tidak memberi keputusan otomatis final | Memberi fakta lengkap dan memilih setelah menerima penjelasan | Menilai kecocokan kebutuhan dan risiko hukum bila ditugaskan | Mengonfirmasi bentuk dan konsekuensi terhadap akta/pengajuan |
| Intake identitas dan entitas | Menangkap data terstruktur, referensi identitas, consent, versi, dan digest bukti; akses dibatasi | Menyerahkan data benar, mutakhir, dan bukti yang sah | Menjalankan CDD/EDD, PEP/sanctions screening, dan mencatat rationale di area terbatas | Melakukan PMPJ dan pemeriksaan formal sesuai kewajiban profesi |
| Struktur BO | Menangkap deklarasi **orang perseorangan**, dasar kendali, persentase, dan digest bukti | Mengungkap pemilik manfaat sebenarnya dan perubahan | Menilai konsistensi, red flags, serta kecukupan bukti | Memverifikasi saat jasa notaris digunakan dan melakukan pelaporan/pengkinian BO yang menjadi kewenangannya |
| Nama, KBLI, domisili, modal, organ/sekutu | Menyediakan form, validasi format, snapshot, dan daftar kelengkapan | Memberi pilihan dan bukti, serta menyetujui hasil review | Memberi advis hukum sesuai penugasan | Melakukan pemeriksaan substantif untuk akta dan pengajuan resmi |
| Akta dan penandatanganan | Mengatur jadwal, pertukaran draf, consent, dan audit trail; bukan tempat penggantian formalitas notarial | Hadir/menandatangani dan memenuhi formalitas yang diminta | Mendampingi bila termasuk engagement | Membacakan akta dan menilai cara penandatanganan/kehadiran yang sah sesuai Pasal 16 UU Jabatan Notaris; menentukan apakah proses fisik atau sarana jarak jauh tertentu legally available untuk tindakan tersebut |
| SABH/SABU dan BO AHU | Menyiapkan paket data, job status, idempotency, digest request/response, dan pelacakan | Mengoreksi data dan memberi kuasa bila diperlukan | Memantau isu hukum/kepatuhan | Menggunakan akun/kewenangan sendiri untuk submission SABH/SABU/BO; merekam referensi eksternal, tanpa membagikan credential ke Justica |
| OSS RBA dan NIB | Menyiapkan snapshot KBLI, checklist, milestone, dan status | Menyatakan data kegiatan usaha dan memenuhi komitmen | Menilai isu sektoral bila ditugaskan | Mengajukan atau mendampingi pengajuan hanya bila masuk engagement dan berwenang; klasifikasi risiko mengikuti PP 28/2025 dan aturan pelaksana terkini |
| Escrow dan biaya | Membuat order, fee line, milestone, consent versi penawaran, serta aturan release/refund | Mendanai milestone dan menyetujui deliverable sesuai kontrak | Menyerahkan hasil tahap profesional | Menyerahkan hasil tahap notarial/pengajuan; pemerintah tetap dapat menolak tanpa menjadikan notaris penjamin hasil |
| Pelacakan klien | Menampilkan tahap operasional AHU/OSS dan permintaan tindakan klien | Menindaklanjuti permintaan | Memperbarui tahap yang boleh dilihat klien melalui server workflow | Memberi referensi hasil yang boleh diungkapkan |

Formalitas notarial merujuk [UU 2/2014 tentang perubahan UU Jabatan Notaris](https://peraturan.go.id/id/uu-no-2-tahun-2014). Implementasi tidak boleh mengartikan “remote” sebagai izin umum untuk melewati kewajiban pembacaan, kehadiran, saksi, dan penandatanganan yang berlaku pada jenis akta tertentu.

## 4. BO dan PMPJ

1. Pemilik Manfaat dimodelkan hanya sebagai **orang perseorangan**. Badan hukum dapat menjadi pihak/pemegang saham, tetapi tidak boleh menjadi record `beneficial_owners`.
2. Deklarasi harus versioned dan menyimpan dasar kendali, persentase kepemilikan/kendali bila relevan, referensi identitas yang bersifat opaque, serta SHA-256 digest bukti—bukan salinan credential pemerintah.
3. Verifikasi BO dilakukan berbasis risiko dan tidak disamakan dengan pencocokan nama semata. Perpres 13/2018 mendefinisikan BO sebagai orang perseorangan dengan kendali/manfaat yang memenuhi kriteria; Permenkum 2/2025 menetapkan verifikasi BO oleh korporasi, notaris, Menteri, atau instansi berwenang menurut konteksnya.
4. Advokat mengikuti PMPJ menurut Peraturan PPATK 10/2017. Notaris mengikuti Permenkum 10/2026, yang menggantikan Permenkumham 9/2017.
5. Hasil CDD/EDD, PEP/sanctions, risk score, rules version, reviewer decision, dan rationale berada di `compliance_assessments` dengan RLS terbatas. Ringkasan klien hanya boleh berupa tindakan netral, misalnya “dokumen tambahan diperlukan” atau `CUSTOMER_ACTION_REQUIRED`.

Dasar primer: [Perpres 13/2018](https://www.peraturan.go.id/id/perpres-no-13-tahun-2018), [Permenkum 2/2025](https://www.peraturan.go.id/files/permenkum-no-2-tahun-2025.pdf), [Peraturan PPATK 10/2017](https://www.peraturan.go.id/id/peraturan-ppatk-no-10-tahun-2017), dan [Permenkum 10/2026](https://www.peraturan.go.id/files/permenkum-no-10-tahun-2026.pdf).

## 5. Kebijakan anti-tipping-off — kontrol mutlak

UU 8/2010 Pasal 12 melarang pemberitahuan langsung maupun tidak langsung mengenai Laporan Transaksi Keuangan Mencurigakan yang sedang disusun atau telah disampaikan. Profesi, termasuk advokat dan notaris pada transaksi yang dicakup, melakukan pelaporan melalui goAML sesuai rezim PPATK. Dasar primer: [UU 8/2010](https://www.peraturan.go.id/id/uu-no-8-tahun-2010) dan [pedoman pelaporan PPATK](https://www.ppatk.go.id/pelaporan/read/50/).

Kontrol sistem wajib:

- **DILARANG KERAS** membuat kolom, enum, event, notifikasi, timeline, audit message, analytics property, search facet, atau client-facing state yang mengungkap bahwa STR/LTKM/goAML sedang dipertimbangkan, disusun, dikirim, diterima, dikoreksi, atau ditindaklanjuti.
- `corporate_service_cases`, `corporate_parties`, `beneficial_owners`, `government_submission_jobs`, dashboard klien, email, push notification, ekspor, dan support tooling tidak boleh mengandung status pelaporan tersebut.
- `compliance_assessments` juga tidak menyimpan status atau referensi STR/goAML. Jika profesi wajib melapor, pencatatan dilakukan di kanal milik pihak pelapor yang terpisah dari Justica dan tunduk pada kontrol hukumnya sendiri.
- Klien tidak memiliki hak `SELECT`, `INSERT`, `UPDATE`, atau `DELETE` pada `compliance_assessments`. RLS bukan satu-satunya kontrol: aplikasi klien tidak boleh memanggil endpoint atau menerima DTO tabel ini.
- Keputusan operasional yang perlu diketahui klien harus memakai alasan netral (`CUSTOMER_ACTION_REQUIRED`, dokumen tidak lengkap, atau layanan tidak dapat dilanjutkan) tanpa mengungkap rule, red flag, risk score, atau pelaporan.
- Credential, API key, access token, session cookie, dan payload mentah AHU/OSS/goAML tidak boleh disimpan pada tabel job. Hanya external reference yang tidak rahasia dan digest request/response yang diperbolehkan.

## 6. Stage model dan disclosure klien

Alur utama:

`DRAFT -> IDENTITY_PENDING -> CDD_REVIEW -> DOCUMENTS_PENDING -> NOTARY_REVIEW -> AHU_SUBMITTED -> AHU_APPROVED -> OSS_PENDING -> NIB_ISSUED -> COMPLETED`

State pengecualian yang boleh ditampilkan secara netral: `COMPLIANCE_HOLD`, `CUSTOMER_ACTION_REQUIRED`, `CANCELLED`, `AHU_REJECTED`, dan `OSS_REJECTED`. Label UI untuk `COMPLIANCE_HOLD` harus netral (“review internal berlangsung”) dan tidak boleh memuat penyebab, skor, atau indikasi pelaporan.

Perubahan stage hanya melalui fungsi server-side dengan optimistic expected-state check dan row lock. Callback pemerintah harus tervalidasi, idempotent, tahan replay, serta hanya menyimpan digest dan referensi minimum.

## 7. Acceptance gates operasional

Kasus tidak boleh bergerak ke:

- `CDD_REVIEW` sebelum identitas dan consent minimum lengkap;
- `NOTARY_REVIEW` sebelum pihak, struktur, BO, dan dokumen wajib lolos completeness check;
- `AHU_SUBMITTED` tanpa notaris/pemohon berwenang dan paket final yang disetujui;
- `OSS_PENDING` sebelum hasil AHU yang sesuai tersedia;
- `NIB_ISSUED` tanpa referensi OSS/NIB yang tervalidasi;
- `COMPLETED` sebelum milestone, deliverable, dan jejak persetujuan direkonsiliasi.

## 8. Catatan implementasi identity seam

Baseline saat ini belum memiliki tabel profil notaris khusus. Karena itu `assigned_notary_id` menggunakan foreign key ke registry profesional terverifikasi `users_advocate` sebagai seam kompatibilitas. Hanya akun mitra yang telah diverifikasi dan secara operasional ditetapkan sebagai notaris yang boleh ditugaskan. Migrasi registry notaris di masa depan harus expand/migrate/contract; tidak boleh mengubah ID penugasan secara diam-diam.
