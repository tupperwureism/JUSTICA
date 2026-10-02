"""
Batch 3+4: Replace existing ADs + Add new domain ADs
- Replace AD-Kes-UC01 -> AD-Kes-04, AD-Psi-UC03 -> AD-Psi-04, AD-Huk-UC02 -> AD-Huk-04, AD-Huk-UC03 -> AD-Huk-05
- Replace AD-09 (UC-14) -> AD-Admin-01, AD-10 (UC-15) -> AD-Admin-02
- Add AD-Kes-05, AD-Psi-05, AD-Huk-06
"""
import re

FILE = r'd:\justificadll\MarkDown\unified_plantuml_codes.md'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# NEW/REPLACEMENT AD DIAGRAMS
# ============================================================

AD_KES_04 = """### AD-Kes-04: Activity Diagram - Menebus Resep dan Membeli Obat (Kes-UC01)
*Diagram ini merepresentasikan alur menebus resep digital termasuk validasi SIA (Sistem Informasi Apotek), cek interaksi obat (drug-drug interaction), dan workflow berbeda untuk obat non-controlled vs controlled (Narkotika/Psikotropika).*

```plantuml
@startuml
start
:Klien membuka halaman "Tebus Resep";
:Sistem menampilkan daftar resep aktif;
:Klien memilih resep yang ingin ditebus;

:Sistem memvalidasi format resep (Permenkes 73/2016);

if (Format resep valid?) then (ya)
  :Sistem mengirim data resep ke SIA Apotek Mitra;
  
  :SIA menerima dan memproses resep;
  :SIA melakukan cek interaksi obat (Drug-Drug Interaction);
  
  if (Ada interaksi Major?) then (ya)
    :SIA mengirim alert ke Dokter penulis resep;
    :Dokter mereview dan merevisi resep;
    :Sistem memperbarui resep;
  else (tidak)
  endif
  
  if (Resep mengandung Narkotika/Psikotropika?) then (ya)
    :SIA menerapkan workflow Controlled Drug;
    note right
      3 rangkap: Apotek, Pasien, BPOM
      Validasi SIP Narkotika Dokter
      Log ke sistem BNN
    end note
    :SIA memvalidasi SIP Narkotika dokter;
    :SIA mencetak resep 3 rangkap;
  else (tidak)
    :SIA memproses resep standar;
  endif
  
  :Sistem menampilkan rincian obat + harga;
  :Klien memilih metode pembayaran;
  :Klien melakukan pembayaran (UC-05);
  
  if (Pembayaran berhasil?) then (ya)
    :Sistem mengonfirmasi ke Apotek;
    :Klien mengisi alamat pengiriman;
    :Apotek memproses pengiriman obat;
    :Sistem mengirim notifikasi + tracking;
  else (tidak)
    :Sistem membatalkan transaksi resep;
    :Resep dikembalikan ke status aktif;
  endif
  
else (tidak)
  :Sistem menampilkan error format resep;
  :Klien diarahkan menghubungi Dokter;
endif

stop
@enduml
```
"""

AD_PSI_04 = """### AD-Psi-04: Activity Diagram - Mengisi Tes Asesmen Psikologi DASS-21 (Psi-UC03)
*Diagram ini merepresentasikan alur pengisian asesmen DASS-21 termasuk scoring otomatis, risk protocol untuk skor Severe/Extreme (mandatory crisis hotline, auto-assign psikolog klinis), dan informed consent ulang.*

```plantuml
@startuml
start
:Klien membuka halaman "Asesmen DASS-21";
:Sistem menampilkan informed consent asesmen;
:Klien menyetujui informed consent;

:Sistem menampilkan 21 pertanyaan DASS-21;
:Klien mengisi semua pertanyaan (skor 0-3);
:Klien klik "Lihat Hasil Analisis";

:Sistem menghitung skor per subskala;
note right
  Depression: sum(Q3,5,10,13,16,17,21) x 2
  Anxiety: sum(Q2,4,7,9,15,19,20) x 2
  Stress: sum(Q1,6,8,11,12,14,18) x 2
end note

:Sistem mengklasifikasikan tingkat keparahan;

if (Ada subskala Severe/Extremely Severe?) then (ya)
  #pink:Sistem memicu Crisis Protocol;
  :Tampilkan pop-up wajib: hotline krisis (119 ext 8);
  note right
    Pop-up TIDAK BISA ditutup
    selama 10 detik (mandatory read)
  end note
  
  :Sistem auto-assign ke Psikolog Klinis;
  note right
    Bukan konselor biasa.
    Harus psikolog klinis
    bersertifikat HIMPSI.
  end note
  
  :Sistem meminta informed consent ulang;
  :Klien menyetujui re-consent;
  
  :Sistem mengirim alert ke Supervisor;
  :Sistem menampilkan rekomendasi + daftar Psikolog Klinis;
else (tidak)
  :Sistem menampilkan hasil normal;
  :Tampilkan grafik skor + interpretasi;
  :Tampilkan rekomendasi (self-help / konsultasi);
endif

:Sistem menyimpan hasil (encrypted, field-level);
:Klien dapat melihat riwayat asesmen;

stop
@enduml
```
"""

AD_HUK_04 = """### AD-Huk-04: Activity Diagram - Membuat Draf Dokumen Hukum (Huk-UC02)
*Diagram ini merepresentasikan alur template engine untuk legal drafting termasuk validasi variabel (NPWP, NIK, Nomor Akta), integrasi e-meterai Peruri, dan version control draf (v1, v2, final).*

```plantuml
@startuml
start
:Advokat membuka halaman "Legal Drafting";
:Sistem menampilkan daftar template dokumen;
note right
  - Surat Kuasa Khusus
  - Perjanjian Kerja Sama
  - Somasi
  - Gugatan Sederhana
  - dll.
end note

:Advokat memilih template;
:Sistem me-render form variabel template;

:Advokat mengisi variabel;
note right
  Nama Pihak, NIK, NPWP,
  Nomor Akta, Pasal, Nominal,
  Tanggal, dll.
end note

:Sistem memvalidasi variabel;

if (Semua variabel valid?) then (ya)
  :Sistem generate draf v1 (PDF preview);
  :Advokat mereview draf v1;
  
  if (Perlu revisi?) then (ya)
    :Advokat mengedit variabel/teks;
    :Sistem generate draf v2;
    note right
      Version control:
      v1, v2, ... vN, final
      Setiap versi tersimpan
    end note
    :Ulangi review;
  else (tidak)
  endif
  
  :Advokat klik "Finalisasi Dokumen";
  :Sistem menandai draf sebagai FINAL;
  
  if (Memerlukan e-Meterai?) then (ya)
    :Sistem menghubungi API Peruri;
    :Peruri mengembalikan e-Meterai (Rp 10.000);
    if (e-Meterai berhasil?) then (ya)
      :Sistem menempelkan e-Meterai pada PDF;
      :Dokumen ditandai "PRIVILEGED AND CONFIDENTIAL";
    else (tidak)
      :Sistem menampilkan error e-Meterai;
      :Advokat dapat retry atau skip (Phase 3);
    endif
  else (tidak)
  endif
  
  :Sistem menyimpan dokumen final;
  note right
    Retention: 10 tahun minimum
    Privilege marking otomatis
    Legal Hold flag aktif
  end note
  :Advokat mengirim dokumen ke klien via chat;
  
else (tidak)
  :Sistem menampilkan error validasi;
  :Advokat memperbaiki variabel;
endif

stop
@enduml
```
"""

AD_HUK_05 = """### AD-Huk-05: Activity Diagram - Melakukan Konsultasi Pro Bono (Huk-UC03)
*Diagram ini merepresentasikan alur pengajuan Pro Bono termasuk means test (verifikasi SKTM cross-check Dukcapil), quota management per advokat (max 3 kasus/bulan), dan legal aid report untuk LBH.*

```plantuml
@startuml
start
:Klien membuka halaman "Bantuan Hukum Pro Bono";
:Klien mengisi form pengajuan;
:Klien mengunggah file SKTM;

:Sistem menyimpan pengajuan (status: PENDING_SKTM);
:Sistem mengirim notifikasi ke Admin;

== Verifikasi Admin ==

:Admin membuka panel verifikasi SKTM;
:Admin mereview dokumen SKTM;

:Sistem cross-check NIK ke Dukcapil API;

if (NIK valid dan status ekonomi sesuai?) then (ya)
  if (Admin menyetujui?) then (ya)
    :Sistem mengubah status menjadi SKTM_APPROVED;
    :Sistem mengirim notifikasi ke Klien;
    
    == Pencocokan Advokat ==
    
    :Klien memilih advokat Pro Bono dari daftar;
    :Sistem mengecek quota advokat;
    
    if (Quota advokat tersedia (< 3 kasus/bulan)?) then (ya)
      :Sistem membuat tiket konsultasi Pro Bono;
      :Sistem mengurangi quota advokat (n+1);
      :Dana konsultasi di-escrow oleh platform;
      note right
        Escrow: dana ditahan
        sampai sesi selesai
        dan laporan LBH dikirim
      end note
      :Advokat menerima notifikasi sesi baru;
      :Sesi konsultasi dimulai (UC-04);
      
      == Pasca-Sesi ==
      
      :Advokat mengisi laporan LBH;
      :Sistem generate Legal Aid Report;
      :Sistem melepas escrow ke advokat;
      
    else (tidak)
      :Sistem menampilkan "Quota advokat penuh";
      :Klien memilih advokat lain;
    endif
    
  else (tidak)
    :Admin menolak SKTM + isi alasan;
    :Sistem mengubah status menjadi SKTM_REJECTED;
    :Sistem mengirim notifikasi penolakan ke Klien;
  endif
else (tidak)
  :Dukcapil: NIK tidak valid / tidak sesuai;
  :Admin menolak pengajuan;
  :Klien diarahkan untuk upload ulang;
endif

stop
@enduml
```
"""

AD_KES_05 = """### AD-Kes-05: Activity Diagram - Catatan Sesi dan Resep Elektronik Kesehatan (UC-11 dan UC-12 Domain Kes)
*Diagram ini merepresentasikan alur pengisian SOAP Note oleh dokter, generate PDF resep format Permenkes 73/2016, dan pengiriman ke SIA apotek mitra.*

```plantuml
@startuml
start
:Dokter membuka form catatan sesi;
:Sistem menampilkan template SOAP Note;

:Dokter mengisi Subjective (keluhan pasien);
:Dokter mengisi Objective (hasil pemeriksaan);
:Dokter mengisi Assessment (diagnosis + kode ICD-10);
:Dokter mengisi Plan (rencana terapi);

:Dokter klik "Simpan Catatan";
:Sistem menyimpan SOAP Note (encrypted, field-level);

if (Pasien memerlukan resep?) then (ya)
  :Dokter klik "Buat Resep Elektronik";
  :Sistem menampilkan form resep;
  
  :Dokter mengisi daftar obat + dosis + aturan pakai;
  :Sistem melakukan cek interaksi obat otomatis;
  
  if (Ada interaksi Major?) then (ya)
    :Sistem menampilkan warning interaksi;
    :Dokter merevisi resep atau override dengan alasan;
  else (tidak)
  endif
  
  :Sistem generate PDF Resep (format Permenkes 73/2016);
  :Dokter menandatangani resep secara digital;
  :Sistem menyimpan resep + kirim ke SIA Apotek;
  
  :Sistem mengirim notifikasi ke Klien;
  note right
    "Resep Anda telah diterbitkan.
     Silakan tebus di Apotek Mitra."
  end note
else (tidak)
  :Catatan sesi disimpan tanpa resep;
endif

:Sistem menutup form dan kembali ke dashboard;

stop
@enduml
```
"""

AD_PSI_05 = """### AD-Psi-05: Activity Diagram - Catatan Sesi dan Lembar Tugas Psikologi (UC-11 dan UC-12 Domain Psi)
*Diagram ini merepresentasikan alur pengisian DAP Note oleh psikolog, generate homework sheet (PDF), dan mood tracker correlation view.*

```plantuml
@startuml
start
:Psikolog membuka form catatan sesi;
:Sistem menampilkan template DAP Note;

:Psikolog mengisi Data (observasi + laporan klien);
:Psikolog mengisi Assessment (evaluasi klinis);

if (Ada indikasi risiko (suicidal/self-harm)?) then (ya)
  #pink:Sistem memicu Crisis Flag;
  :Sistem mengirim alert real-time ke Supervisor;
  :Psikolog mengisi Risk Assessment detail;
  :Sistem mencatat level risiko (Low/Medium/High/Critical);
else (tidak)
endif

:Psikolog mengisi Plan (rencana intervensi);
:Psikolog klik "Simpan Catatan";
:Sistem menyimpan DAP Note (encrypted);

if (Psikolog ingin memberikan tugas rumah?) then (ya)
  :Psikolog klik "Buat Lembar Tugas";
  :Sistem menampilkan template homework;
  
  :Psikolog mengisi daftar tugas + instruksi;
  note right
    Contoh tugas:
    - Journaling harian
    - Teknik grounding 5-4-3-2-1
    - Mindfulness 10 menit/hari
  end note
  
  :Sistem generate homework PDF;
  :Sistem mengirim ke klien via chat;
  :Klien menerima notifikasi tugas baru;
else (tidak)
endif

:Psikolog mereview mood tracker correlation;
note right
  Korelasi antara:
  - Jurnal Mood harian (Psi-UC01)
  - Skor asesmen (Psi-UC03)
  - Progress terapi (DAP Notes)
end note

:Sistem menutup form;

stop
@enduml
```
"""

AD_HUK_06 = """### AD-Huk-06: Activity Diagram - Catatan Sesi dan Legal Opinion Hukum (UC-11 dan UC-12 Domain Huk)
*Diagram ini merepresentasikan alur pengisian Case Memo oleh advokat, legal opinion template (IRAC method), privilege marking, dan retention policy 10 tahun.*

```plantuml
@startuml
start
:Advokat membuka form catatan sesi;
:Sistem menampilkan template Case Memo;

:Advokat mengisi ringkasan fakta kasus;
:Advokat mengisi analisis hukum;
:Advokat mengisi rekomendasi tindakan;

:Advokat klik "Simpan Catatan";
:Sistem menyimpan Case Memo (E2EE);
:Sistem otomatis menandai "PRIVILEGED AND CONFIDENTIAL";
note right
  Privilege marking otomatis
  pada semua dokumen hukum.
  Hanya Advokat & Klien yang
  dapat mengakses (Admin tidak).
end note

if (Advokat ingin membuat Legal Opinion?) then (ya)
  :Advokat klik "Buat Legal Opinion";
  :Sistem menampilkan template IRAC;
  
  :Advokat mengisi Issue (isu hukum);
  :Advokat mengisi Rule (dasar hukum/pasal);
  :Advokat mengisi Application (penerapan pada kasus);
  :Advokat mengisi Conclusion (kesimpulan);
  
  :Sistem generate Legal Opinion PDF;
  :Sistem menandai dokumen dengan privilege stamp;
  
  if (Advokat ingin kirim ke klien?) then (ya)
    :Sistem mengirim via chat (E2EE);
    :Klien menerima notifikasi dokumen baru;
    note right
      Download gate:
      Klien harus verifikasi
      pembayaran sebelum unduh
    end note
  else (tidak)
    :Dokumen tersimpan sebagai draft internal;
  endif
  
else (tidak)
endif

:Sistem menerapkan retention policy;
note right
  Retention: 10 tahun minimum
  Legal Hold: aktif otomatis
  Disposal: hanya via
  privilege waiver dari klien
end note

:Sistem menutup form;

stop
@enduml
```
"""

AD_ADMIN_01 = """### AD-Admin-01: Activity Diagram - Mengelola Data Akun Klien / Suspend (UC-14)
*Diagram ini merepresentasikan alur due process untuk suspend akun klien: warning 3x, evidence log, notifikasi hukum (surat resmi), dan appeal window 14 hari.*

```plantuml
@startuml
start
:Admin menerima laporan pelanggaran klien;
:Admin membuka panel "Manajemen Akun Klien";
:Admin mereview bukti pelanggaran;

:Sistem menampilkan riwayat warning klien;

if (Warning count < 3?) then (ya)
  :Admin mengirim Warning ke klien;
  :Sistem mencatat warning (count + 1);
  :Sistem menyimpan evidence log (WORM);
  note right
    Warning ke-1: Peringatan ringan
    Warning ke-2: Peringatan keras
    Warning ke-3: Peringatan akhir
  end note
  :Sistem mengirim notifikasi warning ke klien;
  
else (tidak, warning >= 3)
  :Admin memutuskan untuk Suspend akun;
  
  == Due Process ==
  
  :Sistem generate Surat Resmi Suspend;
  note right
    Surat berisi:
    - Alasan suspend
    - Bukti pelanggaran
    - Hak banding (14 hari)
    - Kontak pengajuan banding
  end note
  
  :Sistem mengirim Surat ke email klien;
  :Sistem mengubah status akun menjadi SUSPENDED;
  :Sistem memblokir akses klien ke platform;
  
  == Appeal Window (14 Hari) ==
  
  if (Klien mengajukan banding dalam 14 hari?) then (ya)
    :Admin menerima permohonan banding;
    :Admin mereview bukti baru dari klien;
    
    if (Banding diterima?) then (ya)
      :Admin mengubah status menjadi ACTIVE;
      :Sistem mengirim notifikasi reinstatement;
      :Warning count di-reset;
    else (tidak)
      :Admin menolak banding + isi alasan;
      :Sistem mengirim notifikasi penolakan final;
      :Status tetap SUSPENDED (permanen);
    endif
    
  else (tidak, 14 hari lewat)
    :Sistem mengunci suspend secara permanen;
    :Sistem mengirim notifikasi final ke klien;
  endif
endif

stop
@enduml
```
"""

AD_ADMIN_02 = """### AD-Admin-02: Activity Diagram - Mengelola Data Akun Mitra / Suspend (UC-15)
*Diagram ini merepresentasikan alur Ethics Committee Flow untuk suspend mitra: laporan masuk, tim etik multidisiplin (dokter/psikolog/advokat), hearing, keputusan, dan report ke Konsil/Peradi/HIMPSI.*

```plantuml
@startuml
start
:Admin/Klien melaporkan pelanggaran Mitra;
:Admin membuka panel "Manajemen Akun Mitra";
:Admin mereview laporan + bukti;

:Sistem menampilkan riwayat warning Mitra;

if (Pelanggaran ringan (Warning count < 3)?) then (ya)
  :Admin mengirim Warning ke Mitra;
  :Sistem mencatat warning + evidence (WORM);
  :Sistem mengirim notifikasi ke Mitra;
  
else (tidak, pelanggaran berat atau warning >= 3)

  == Ethics Committee Flow ==
  
  :Admin membentuk Tim Etik;
  note right
    Tim Etik terdiri dari:
    - 1 Dokter Senior (jika Kes)
    - 1 Psikolog Senior (jika Psi)
    - 1 Advokat Senior (jika Huk)
    - 1 Admin Compliance
  end note
  
  :Sistem menjadwalkan Hearing;
  :Sistem mengirim undangan hearing ke Mitra;
  :Mitra diberikan kesempatan membela diri;
  
  :Tim Etik melaksanakan Hearing;
  :Tim Etik memberikan keputusan;
  
  if (Keputusan = Dibebaskan?) then (ya)
    :Sistem mencatat hasil hearing;
    :Status Mitra tetap ACTIVE;
    :Warning count di-reset;
    
  else (Keputusan = Suspend)
    :Sistem mengubah status menjadi SUSPENDED;
    :Sistem memblokir akses Mitra;
    
    == Report ke Badan Profesi ==
    
    if (Domain = Kesehatan?) then (ya)
      :Sistem generate laporan ke Konsil Kedokteran;
    else if (Domain = Psikologi?) then (ya)
      :Sistem generate laporan ke HIMPSI;
    else (Domain = Hukum)
      :Sistem generate laporan ke Peradi;
    endif
    
    :Admin mengirim laporan ke badan profesi;
    :Sistem menyimpan seluruh evidence + keputusan;
    note right
      WORM storage:
      Tidak bisa diubah/dihapus
      Retention: permanen
    end note
    
    :Sistem mengirim notifikasi final ke Mitra;
    note right
      Surat berisi:
      - Alasan suspend
      - Hasil hearing
      - Laporan ke badan profesi
      - Tidak ada appeal (final)
    end note
  endif
endif

stop
@enduml
```
"""

# ============================================================
# PERFORM REPLACEMENTS
# ============================================================

def find_section(text, header_pattern):
    """Find a section from ### header to next --- separator"""
    match = re.search(header_pattern, text)
    if not match:
        return None, None
    start = match.start()
    rest = text[match.end():]
    next_section = re.search(r'\n---\n\n### ', rest)
    if next_section:
        end = match.end() + next_section.start()
    else:
        next_section = re.search(r'\n---\n\n## ', rest)
        if next_section:
            end = match.end() + next_section.start()
        else:
            end = len(text)
    return start, end

replacements = [
    (r'### 9\. Activity Diagram: Mengelola Data Akun Klien', AD_ADMIN_01.strip(), "AD-09 -> AD-Admin-01"),
    (r'### 10\. Activity Diagram: Mengelola Data Akun Mitra', AD_ADMIN_02.strip(), "AD-10 -> AD-Admin-02"),
    (r'### AD-Kesehatan: Menebus Resep', AD_KES_04.strip(), "AD-Kes-UC01 -> AD-Kes-04"),
    (r'### AD-Psikologi: Mengisi Tes Asesmen', AD_PSI_04.strip(), "AD-Psi-UC03 -> AD-Psi-04"),
    (r'### AD-Hukum: Membuat Draf Dokumen', AD_HUK_04.strip(), "AD-Huk-UC02 -> AD-Huk-04"),
    (r'### AD-Hukum: Melakukan Konsultasi Pro Bono', AD_HUK_05.strip(), "AD-Huk-UC03 -> AD-Huk-05"),
]

for pattern, replacement, label in replacements:
    start, end = find_section(content, pattern)
    if start is not None:
        content = content[:start] + replacement + content[end:]
        print(f"[OK] {label}")
    else:
        print(f"[SKIP] {label} - not found")

# Now append AD-Kes-05, AD-Psi-05, AD-Huk-06 at the end of the file
append_text = "\n\n---\n\n" + AD_KES_05.strip() + "\n\n---\n\n" + AD_PSI_05.strip() + "\n\n---\n\n" + AD_HUK_06.strip() + "\n"

content = content.rstrip() + append_text

print("[OK] AD-Kes-05, AD-Psi-05, AD-Huk-06 appended")

with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\nFile saved. Total size: {len(content)} bytes")
