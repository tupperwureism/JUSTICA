"""
Script to replace 9 Activity Diagrams (AD-Kes-04, AD-Psi-04, AD-Huk-04, AD-Huk-05, AD-Kes-05, AD-Psi-05, AD-Huk-06, AD-Admin-01, AD-Admin-02)
with versions that have proper PlantUML swimlanes (|Actor|).
"""
import re

FILE = r'd:\justificadll\MarkDown\unified_plantuml_codes.md'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

def replace_ad_section(text, header_prefix, new_content):
    pattern = rf'({re.escape(header_prefix)}.*?)(?=\n---\n\n### |\n---\n\n## |\Z)'
    match = re.search(pattern, text, re.DOTALL)
    if match:
        old_slice = match.group(0)
        return text.replace(old_slice, new_content.strip()), True
    return text, False

AD_KES_04 = """### AD-Kes-04: Activity Diagram - Menebus Resep dan Membeli Obat (Kes-UC01)
*Diagram ini merepresentasikan alur menebus resep digital termasuk validasi SIA (Sistem Informasi Apotek), cek interaksi obat (drug-drug interaction), dan workflow berbeda untuk obat non-controlled vs controlled (Narkotika/Psikotropika).*

```plantuml
@startuml
|Klien|
start
:Membuka halaman "Tebus Resep";
|Sistem (Backend/DB)|
:Menampilkan daftar resep aktif;
|Klien|
:Memilih resep yang ingin ditebus;
|Sistem (Backend/DB)|
:Memvalidasi format resep (Permenkes 73/2016);

if (Format resep valid?) then (ya)
  :Mengirim data resep ke SIA Apotek Mitra;
  |SIA Apotek Mitra|
  :Menerima dan memproses resep;
  :Melakukan cek interaksi obat (Drug-Drug Interaction);
  
  if (Ada interaksi Major?) then (ya)
    :Mengirim alert ke Dokter penulis resep;
    |Dokter|
    :Mereview dan merevisi resep;
    |Sistem (Backend/DB)|
    :Memperbarui resep;
    |SIA Apotek Mitra|
  else (tidak)
  endif
  
  if (Resep mengandung Narkotika/Psikotropika?) then (ya)
    :Menerapkan workflow Controlled Drug;
    note right
      3 rangkap: Apotek, Pasien, BPOM
      Validasi SIP Narkotika Dokter
      Log ke sistem BNN
    end note
    :Memvalidasi SIP Narkotika dokter;
    :Mencetak resep 3 rangkap;
  else (tidak)
    :Memproses resep standar;
  endif
  
  |Sistem (Backend/DB)|
  :Menampilkan rincian obat + harga;
  |Klien|
  :Memilih metode pembayaran;
  :Melakukan pembayaran (UC-05);
  
  |Sistem (Backend/DB)|
  if (Pembayaran berhasil?) then (ya)
    :Mengonfirmasi ke Apotek;
    |Klien|
    :Mengisi alamat pengiriman;
    |SIA Apotek Mitra|
    :Memproses pengiriman obat;
    |Sistem (Backend/DB)|
    :Mengirim notifikasi + tracking;
  else (tidak)
    :Membatalkan transaksi resep;
    :Resep dikembalikan ke status aktif;
  endif
  
else (tidak)
  |Sistem (Backend/DB)|
  :Menampilkan error format resep;
  |Klien|
  :Diarahkan menghubungi Dokter;
endif

stop
@enduml
```"""

AD_PSI_04 = """### AD-Psi-04: Activity Diagram - Mengisi Tes Asesmen Psikologi DASS-21 (Psi-UC03)
*Diagram ini merepresentasikan alur pengisian asesmen DASS-21 termasuk scoring otomatis, risk protocol untuk skor Severe/Extreme (mandatory crisis hotline, auto-assign psikolog klinis), dan informed consent ulang.*

```plantuml
@startuml
|Klien|
start
:Membuka halaman "Asesmen DASS-21";
|Sistem (Backend/DB)|
:Menampilkan informed consent asesmen;
|Klien|
:Menyetujui informed consent;

|Sistem (Backend/DB)|
:Menampilkan 21 pertanyaan DASS-21;
|Klien|
:Mengisi semua pertanyaan (skor 0-3);
:Klik "Lihat Hasil Analisis";

|Sistem (Backend/DB)|
:Menghitung skor per subskala;
note right
  Depression: sum(Q3,5,10,13,16,17,21) x 2
  Anxiety: sum(Q2,4,7,9,15,19,20) x 2
  Stress: sum(Q1,6,8,11,12,14,18) x 2
end note

:Mengklasifikasikan tingkat keparahan;

if (Ada subskala Severe/Extremely Severe?) then (ya)
  #pink:Memicu Crisis Protocol;
  :Tampilkan pop-up wajib: hotline krisis (119 ext 8);
  note right
    Pop-up TIDAK BISA ditutup
    selama 10 detik (mandatory read)
  end note
  
  :Auto-assign ke Psikolog Klinis;
  note right
    Bukan konselor biasa.
    Harus psikolog klinis
    bersertifikat HIMPSI.
  end note
  
  :Meminta informed consent ulang;
  |Klien|
  :Menyetujui re-consent;
  
  |Sistem (Backend/DB)|
  :Mengirim alert ke Supervisor;
  |Supervisor|
  :Menerima alert krisis;
  |Sistem (Backend/DB)|
  :Menampilkan rekomendasi + daftar Psikolog Klinis;
else (tidak)
  |Sistem (Backend/DB)|
  :Menampilkan hasil normal;
  :Tampilkan grafik skor + interpretasi;
  :Tampilkan rekomendasi (self-help / konsultasi);
endif

|Sistem (Backend/DB)|
:Menyimpan hasil (encrypted, field-level);
|Klien|
:Dapat melihat riwayat asesmen;

stop
@enduml
```"""

AD_HUK_04 = """### AD-Huk-04: Activity Diagram - Membuat Draf Dokumen Hukum (Huk-UC02)
*Diagram ini merepresentasikan alur template engine untuk legal drafting termasuk validasi variabel (NPWP, NIK, Nomor Akta), integrasi e-meterai Peruri, dan version control draf (v1, v2, final).*

```plantuml
@startuml
|Advokat|
start
:Membuka halaman "Legal Drafting";
|Sistem (Backend/DB)|
:Menampilkan daftar template dokumen;
note right
  - Surat Kuasa Khusus
  - Perjanjian Kerja Sama
  - Somasi
  - Gugatan Sederhana
  - dll.
end note

|Advokat|
:Memilih template;
|Sistem (Backend/DB)|
:Me-render form variabel template;

|Advokat|
:Mengisi variabel;
note right
  Nama Pihak, NIK, NPWP,
  Nomor Akta, Pasal, Nominal,
  Tanggal, dll.
end note

|Sistem (Backend/DB)|
:Memvalidasi variabel;

if (Semua variabel valid?) then (ya)
  :Generate draf v1 (PDF preview);
  |Advokat|
  :Mereview draf v1;
  
  if (Perlu revisi?) then (ya)
    :Mengedit variabel/teks;
    |Sistem (Backend/DB)|
    :Generate draf v2;
    note right
      Version control:
      v1, v2, ... vN, final
      Setiap versi tersimpan
    end note
    |Advokat|
    :Ulangi review;
  else (tidak)
  endif
  
  |Advokat|
  :Klik "Finalisasi Dokumen";
  |Sistem (Backend/DB)|
  :Menandai draf sebagai FINAL;
  
  if (Memerlukan e-Meterai?) then (ya)
    :Menghubungi API Peruri;
    |API Peruri (e-Meterai)|
    :Mengembalikan e-Meterai (Rp 10.000);
    |Sistem (Backend/DB)|
    if (e-Meterai berhasil?) then (ya)
      :Menempelkan e-Meterai pada PDF;
      :Dokumen ditandai "PRIVILEGED AND CONFIDENTIAL";
    else (tidak)
      :Menampilkan error e-Meterai;
      |Advokat|
      :Dapat retry atau skip (Phase 3);
      |Sistem (Backend/DB)|
    endif
  else (tidak)
  endif
  
  |Sistem (Backend/DB)|
  :Menyimpan dokumen final;
  note right
    Retention: 10 tahun minimum
    Privilege marking otomatis
    Legal Hold flag aktif
  end note
  |Advokat|
  :Mengirim dokumen ke klien via chat;
  |Klien|
  :Menerima dokumen hukum final;
  
else (tidak)
  |Sistem (Backend/DB)|
  :Menampilkan error validasi;
  |Advokat|
  :Memperbaiki variabel;
endif

stop
@enduml
```"""

AD_HUK_05 = """### AD-Huk-05: Activity Diagram - Melakukan Konsultasi Pro Bono (Huk-UC03)
*Diagram ini merepresentasikan alur pengajuan Pro Bono termasuk means test (verifikasi SKTM cross-check Dukcapil), quota management per advokat (max 3 kasus/bulan), dan legal aid report untuk LBH.*

```plantuml
@startuml
|Klien|
start
:Membuka halaman "Bantuan Hukum Pro Bono";
:Mengisi form pengajuan;
:Mengunggah file SKTM;

|Sistem (Backend/DB)|
:Menyimpan pengajuan (status: PENDING_SKTM);
:Mengirim notifikasi ke Admin;

== Verifikasi Admin ==

|Admin Sistem|
:Membuka panel verifikasi SKTM;
:Mereview dokumen SKTM;

|Sistem (Backend/DB)|
:Cross-check NIK ke Dukcapil API;
|Dukcapil API|
:Mengembalikan validitas NIK & status ekonomi;

|Admin Sistem|
if (NIK valid dan status ekonomi sesuai?) then (ya)
  if (Admin menyetujui?) then (ya)
    |Sistem (Backend/DB)|
    :Mengubah status menjadi SKTM_APPROVED;
    :Mengirim notifikasi ke Klien;
    
    == Pencocokan Advokat ==
    
    |Klien|
    :Memilih advokat Pro Bono dari daftar;
    |Sistem (Backend/DB)|
    :Mengecek quota advokat;
    
    if (Quota advokat tersedia (< 3 kasus/bulan)?) then (ya)
      :Membuat tiket konsultasi Pro Bono;
      :Mengurangi quota advokat (n+1);
      :Dana konsultasi di-escrow oleh platform;
      note right
        Escrow: dana ditahan
        sampai sesi selesai
        dan laporan LBH dikirim
      end note
      |Advokat Pro Bono|
      :Menerima notifikasi sesi baru;
      :Sesi konsultasi dimulai (UC-04);
      
      == Pasca-Sesi ==
      
      :Mengisi laporan LBH;
      |Sistem (Backend/DB)|
      :Generate Legal Aid Report;
      :Melepas escrow ke advokat;
      
    else (tidak)
      :Menampilkan "Quota advokat penuh";
      |Klien|
      :Memilih advokat lain;
    endif
    
  else (tidak)
    |Admin Sistem|
    :Menolak SKTM + isi alasan;
    |Sistem (Backend/DB)|
    :Mengubah status menjadi SKTM_REJECTED;
    :Mengirim notifikasi penolakan ke Klien;
  endif
else (tidak)
  |Dukcapil API|
  :NIK tidak valid / tidak sesuai;
  |Admin Sistem|
  :Menolak pengajuan;
  |Sistem (Backend/DB)|
  :Klien diarahkan untuk upload ulang;
endif

stop
@enduml
```"""

AD_KES_05 = """### AD-Kes-05: Activity Diagram - Catatan Sesi dan Resep Elektronik Kesehatan (UC-11 dan UC-12 Domain Kes)
*Diagram ini merepresentasikan alur pengisian SOAP Note oleh dokter, generate PDF resep format Permenkes 73/2016, dan pengiriman ke SIA apotek mitra.*

```plantuml
@startuml
|Dokter|
start
:Membuka form catatan sesi;
|Sistem (Backend/DB)|
:Menampilkan template SOAP Note;

|Dokter|
:Mengisi Subjective (keluhan pasien);
:Mengisi Objective (hasil pemeriksaan);
:Mengisi Assessment (diagnosis + kode ICD-10);
:Mengisi Plan (rencana terapi);

:Klik "Simpan Catatan";
|Sistem (Backend/DB)|
:Menyimpan SOAP Note (encrypted, field-level);

if (Pasien memerlukan resep?) then (ya)
  |Dokter|
  :Klik "Buat Resep Elektronik";
  |Sistem (Backend/DB)|
  :Menampilkan form resep;
  
  |Dokter|
  :Mengisi daftar obat + dosis + aturan pakai;
  |Sistem (Backend/DB)|
  :Melakukan cek interaksi obat otomatis;
  
  if (Ada interaksi Major?) then (ya)
    :Menampilkan warning interaksi;
    |Dokter|
    :Merevisi resep atau override dengan alasan;
    |Sistem (Backend/DB)|
  else (tidak)
  endif
  
  :Generate PDF Resep (format Permenkes 73/2016);
  |Dokter|
  :Menandatangani resep secara digital;
  |Sistem (Backend/DB)|
  :Menyimpan resep + kirim ke SIA Apotek;
  |SIA Apotek|
  :Menerima e-Resep tersertifikasi;
  
  |Sistem (Backend/DB)|
  :Mengirim notifikasi ke Klien;
  note right
    "Resep Anda telah diterbitkan.
     Silakan tebus di Apotek Mitra."
  end note
  |Klien|
  :Menerima notifikasi resep;
else (tidak)
  |Sistem (Backend/DB)|
  :Catatan sesi disimpan tanpa resep;
endif

|Sistem (Backend/DB)|
:Menutup form dan kembali ke dashboard;

stop
@enduml
```"""

AD_PSI_05 = """### AD-Psi-05: Activity Diagram - Catatan Sesi dan Lembar Tugas Psikologi (UC-11 dan UC-12 Domain Psi)
*Diagram ini merepresentasikan alur pengisian DAP Note oleh psikolog, generate homework sheet (PDF), dan mood tracker correlation view.*

```plantuml
@startuml
|Psikolog|
start
:Membuka form catatan sesi;
|Sistem (Backend/DB)|
:Menampilkan template DAP Note;

|Psikolog|
:Mengisi Data (observasi + laporan klien);
:Mengisi Assessment (evaluasi klinis);

if (Ada indikasi risiko (suicidal/self-harm)?) then (ya)
  |Sistem (Backend/DB)|
  #pink:Memicu Crisis Flag;
  :Mengirim alert real-time ke Supervisor;
  |Supervisor|
  :Menerima alert & memantau sesi;
  |Psikolog|
  :Mengisi Risk Assessment detail;
  |Sistem (Backend/DB)|
  :Mencatat level risiko (Low/Medium/High/Critical);
else (tidak)
endif

|Psikolog|
:Mengisi Plan (rencana intervensi);
:Klik "Simpan Catatan";
|Sistem (Backend/DB)|
:Menyimpan DAP Note (encrypted);

if (Psikolog ingin memberikan tugas rumah?) then (ya)
  |Psikolog|
  :Klik "Buat Lembar Tugas";
  |Sistem (Backend/DB)|
  :Menampilkan template homework;
  
  |Psikolog|
  :Mengisi daftar tugas + instruksi;
  note right
    Contoh tugas:
    - Journaling harian
    - Teknik grounding 5-4-3-2-1
    - Mindfulness 10 menit/hari
  end note
  
  |Sistem (Backend/DB)|
  :Generate homework PDF;
  :Mengirim ke klien via chat;
  |Klien|
  :Menerima notifikasi tugas baru;
else (tidak)
endif

|Psikolog|
:Mereview mood tracker correlation;
note right
  Korelasi antara:
  - Jurnal Mood harian (Psi-UC01)
  - Skor asesmen (Psi-UC03)
  - Progress terapi (DAP Notes)
end note

|Sistem (Backend/DB)|
:Menutup form;

stop
@enduml
```"""

AD_HUK_06 = """### AD-Huk-06: Activity Diagram - Catatan Sesi dan Legal Opinion Hukum (UC-11 dan UC-12 Domain Huk)
*Diagram ini merepresentasikan alur pengisian Case Memo oleh advokat, legal opinion template (IRAC method), privilege marking, dan retention policy 10 tahun.*

```plantuml
@startuml
|Advokat|
start
:Membuka form catatan sesi;
|Sistem (Backend/DB)|
:Menampilkan template Case Memo;

|Advokat|
:Mengisi ringkasan fakta kasus;
:Mengisi analisis hukum;
:Mengisi rekomendasi tindakan;

:Klik "Simpan Catatan";
|Sistem (Backend/DB)|
:Menyimpan Case Memo (E2EE);
:Otomatis menandai "PRIVILEGED AND CONFIDENTIAL";
note right
  Privilege marking otomatis
  pada semua dokumen hukum.
  Hanya Advokat & Klien yang
  dapat mengakses (Admin tidak).
end note

if (Advokat ingin membuat Legal Opinion?) then (ya)
  |Advokat|
  :Klik "Buat Legal Opinion";
  |Sistem (Backend/DB)|
  :Menampilkan template IRAC;
  
  |Advokat|
  :Mengisi Issue (isu hukum);
  :Mengisi Rule (dasar hukum/pasal);
  :Mengisi Application (penerapan pada kasus);
  :Mengisi Conclusion (kesimpulan);
  
  |Sistem (Backend/DB)|
  :Generate Legal Opinion PDF;
  :Menandai dokumen dengan privilege stamp;
  
  if (Advokat ingin kirim ke klien?) then (ya)
    :Mengirim via chat (E2EE);
    |Klien|
    :Menerima notifikasi dokumen baru;
    note right
      Download gate:
      Klien harus verifikasi
      pembayaran sebelum unduh
    end note
  else (tidak)
    |Sistem (Backend/DB)|
    :Dokumen tersimpan sebagai draft internal;
  endif
  
else (tidak)
endif

|Sistem (Backend/DB)|
:Menerapkan retention policy;
note right
  Retention: 10 tahun minimum
  Legal Hold: aktif otomatis
  Disposal: hanya via
  privilege waiver dari klien
end note

:Menutup form;

stop
@enduml
```"""

AD_ADMIN_01 = """### AD-Admin-01: Activity Diagram - Mengelola Data Akun Klien / Suspend (UC-14)
*Diagram ini merepresentasikan alur due process untuk suspend akun klien: warning 3x, evidence log, notifikasi hukum (surat resmi), dan appeal window 14 hari.*

```plantuml
@startuml
|Admin Sistem|
start
:Menerima laporan pelanggaran klien;
:Membuka panel "Manajemen Akun Klien";
:Mereview bukti pelanggaran;

|Sistem (Backend/DB)|
:Menampilkan riwayat warning klien;

if (Warning count < 3?) then (ya)
  |Admin Sistem|
  :Mengirim Warning ke klien;
  |Sistem (Backend/DB)|
  :Mencatat warning (count + 1);
  :Menyimpan evidence log (WORM);
  note right
    Warning ke-1: Peringatan ringan
    Warning ke-2: Peringatan keras
    Warning ke-3: Peringatan akhir
  end note
  :Mengirim notifikasi warning ke klien;
  |Klien|
  :Menerima peringatan sistem;
  
else (tidak, warning >= 3)
  |Admin Sistem|
  :Memutuskan untuk Suspend akun;
  
  == Due Process ==
  
  |Sistem (Backend/DB)|
  :Generate Surat Resmi Suspend;
  note right
    Surat berisi:
    - Alasan suspend
    - Bukti pelanggaran
    - Hak banding (14 hari)
    - Kontak pengajuan banding
  end note
  
  :Mengirim Surat ke email klien;
  :Mengubah status akun menjadi SUSPENDED;
  :Memblokir akses klien ke platform;
  |Klien|
  :Menerima surat suspend & akses terblokir;
  
  == Appeal Window (14 Hari) ==
  
  if (Klien mengajukan banding dalam 14 hari?) then (ya)
    |Klien|
    :Mengajukan permohonan banding + bukti;
    |Admin Sistem|
    :Menerima permohonan banding;
    :Mereview bukti baru dari klien;
    
    if (Banding diterima?) then (ya)
      :Mengubah status menjadi ACTIVE;
      |Sistem (Backend/DB)|
      :Mengirim notifikasi reinstatement;
      :Warning count di-reset;
      |Klien|
      :Aksesi akun dipulihkan;
    else (tidak)
      |Admin Sistem|
      :Menolak banding + isi alasan;
      |Sistem (Backend/DB)|
      :Mengirim notifikasi penolakan final;
      :Status tetap SUSPENDED (permanen);
    endif
    
  else (tidak, 14 hari lewat)
    |Sistem (Backend/DB)|
    :Mengunci suspend secara permanen;
    :Mengirim notifikasi final ke klien;
  endif
endif

stop
@enduml
```"""

AD_ADMIN_02 = """### AD-Admin-02: Activity Diagram - Mengelola Data Akun Mitra / Suspend (UC-15)
*Diagram ini merepresentasikan alur Ethics Committee Flow untuk suspend mitra: laporan masuk, tim etik multidisiplin (dokter/psikolog/advokat), hearing, keputusan, dan report ke Konsil/Peradi/HIMPSI.*

```plantuml
@startuml
|Admin Sistem|
start
:Menerima laporan pelanggaran Mitra;
:Membuka panel "Manajemen Akun Mitra";
:Mereview laporan + bukti;

|Sistem (Backend/DB)|
:Menampilkan riwayat warning Mitra;

if (Pelanggaran ringan (Warning count < 3)?) then (ya)
  |Admin Sistem|
  :Mengirim Warning ke Mitra;
  |Sistem (Backend/DB)|
  :Mencatat warning + evidence (WORM);
  :Mengirim notifikasi ke Mitra;
  |Mitra Profesional|
  :Menerima peringatan sistem;
  
else (tidak, pelanggaran berat atau warning >= 3)

  == Ethics Committee Flow ==
  
  |Admin Sistem|
  :Membentuk Tim Etik Multidisiplin;
  note right
    Tim Etik terdiri dari:
    - 1 Dokter Senior (jika Kes)
    - 1 Psikolog Senior (jika Psi)
    - 1 Advokat Senior (jika Huk)
    - 1 Admin Compliance
  end note
  
  |Sistem (Backend/DB)|
  :Menjadwalkan Hearing;
  :Mengirim undangan hearing ke Mitra;
  |Mitra Profesional|
  :Menerima undangan & menyiapkan pembelaan;
  
  |Tim Etik Multidisiplin|
  :Melaksanakan Hearing bersama Mitra;
  :Memberikan keputusan etik;
  
  if (Keputusan = Dibebaskan?) then (ya)
    |Sistem (Backend/DB)|
    :Mencatat hasil hearing;
    :Status Mitra tetap ACTIVE;
    :Warning count di-reset;
    
  else (Keputusan = Suspend)
    |Sistem (Backend/DB)|
    :Mengubah status menjadi SUSPENDED;
    :Memblokir akses Mitra;
    
    == Report ke Badan Profesi ==
    
    if (Domain = Kesehatan?) then (ya)
      :Generate laporan ke Konsil Kedokteran;
      |Badan Profesi (Konsil/HIMPSI/Peradi)|
      :Menerima laporan pelanggaran etik dokter;
    else if (Domain = Psikologi?) then (ya)
      |Sistem (Backend/DB)|
      :Generate laporan ke HIMPSI;
      |Badan Profesi (Konsil/HIMPSI/Peradi)|
      :Menerima laporan pelanggaran etik psikolog;
    else (Domain = Hukum)
      |Sistem (Backend/DB)|
      :Generate laporan ke Peradi;
      |Badan Profesi (Konsil/HIMPSI/Peradi)|
      :Menerima laporan pelanggaran etik advokat;
    endif
    
    |Admin Sistem|
    :Mengonfirmasi pengiriman laporan resmi;
    |Sistem (Backend/DB)|
    :Menyimpan seluruh evidence + keputusan;
    note right
      WORM storage:
      Tidak bisa diubah/dihapus
      Retention: permanen
    end note
    
    :Mengirim notifikasi final ke Mitra;
    note right
      Surat berisi:
      - Alasan suspend
      - Hasil hearing
      - Laporan ke badan profesi
      - Tidak ada appeal (final)
    end note
    |Mitra Profesional|
    :Akses terblokir permanen;
  endif
endif

stop
@enduml
```"""

replacements = [
    ("### AD-Kes-04: Activity Diagram", AD_KES_04),
    ("### AD-Psi-04: Activity Diagram", AD_PSI_04),
    ("### AD-Huk-04: Activity Diagram", AD_HUK_04),
    ("### AD-Huk-05: Activity Diagram", AD_HUK_05),
    ("### AD-Kes-05: Activity Diagram", AD_KES_05),
    ("### AD-Psi-05: Activity Diagram", AD_PSI_05),
    ("### AD-Huk-06: Activity Diagram", AD_HUK_06),
    ("### AD-Admin-01: Activity Diagram", AD_ADMIN_01),
    ("### AD-Admin-02: Activity Diagram", AD_ADMIN_02),
]

for prefix, new_ad in replacements:
    content, success = replace_ad_section(content, prefix, new_ad)
    if success:
        print(f"[OK] Replaced {prefix} with swimlanes")
    else:
        print(f"[ERROR] Could not find section {prefix}")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print("Finished updating activity diagrams with swimlanes.")
