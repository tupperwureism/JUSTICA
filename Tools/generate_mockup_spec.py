"""
Script to generate MOCKUP_SPEC_DETAIL.md with Markdown specs and PlantUML wireframes
for 3 Admin pages and 3 Domain modules.
"""

TARGET_FILE = r'd:\justificadll\MarkDown\MOCKUP_SPEC_DETAIL.md'

CONTENT = """# Spesifikasi Desain & Wireframe UI/UX Mockup (Admin & Modul Domain)

Dokumen ini mendefinisikan spesifikasi arsitektur antarmuka (*UI/UX Specification*) dan rancangan tata letak visual (*PlantUML Wireframes / Salt Syntax*) untuk **3 Halaman Admin Sistem** dan **3 Modul Update Domain Spesifik (Kesehatan, Hukum, Psikologi)** pada platform JUSTIFICA 3-in-1.

---

## 1. DESIGN SYSTEM & VISUAL COMPLIANCE TOKENS
Sesuai arahan arsitektur modern (*Rich Aesthetics, Glassmorphism, Dynamic Micro-animations*), antarmuka menggunakan palet warna kurasi berbasis kepatuhan domain dan regulasi:
* **Primary Brand (Deep Navy & Cyber Blue)**: `hsl(215, 85%, 25%)` hingga `hsl(210, 100%, 50%)` — Melambangkan keandalan sistem dan profesionalisme.
* **Medical Domain Token (Clinical Blue & Teal)**: `hsl(190, 85%, 45%)` — Menenangkan, bersih, dan klinis.
* **Psychology Domain Token (Calming Emerald & Sage)**: `hsl(150, 65%, 40%)` — Empati, relaksasi, dan psikoedukasi.
* **Legal Domain Token (Privilege Gold & Deep Amber)**: `hsl(40, 90%, 45%)` — Melambangkan kerahasiaan (*Advocate-Client Privilege*), kewibawaan akta hukum, dan e-Meterai.
* **Crisis & Compliance Alert Token (Urgent Red)**: `hsl(0, 85%, 50%)` — Untuk peringatan DDI Checker, bahaya obat narkotika, dan *Mandatory Crisis Protocol DASS-21* (Hotline 119 ext 8).
* **WORM & Audit Trail Badge (Slate Gray & Monospace Font)**: `font-family: 'Roboto Mono', monospace; background: #2D3748; color: #00FF66;` — Untuk penanda *cryptographic hash SHA-256* dan status dokumen *Read-Only*.

---

## 2. SPESIFIKASI & WIREFRAME 3 HALAMAN ADMIN SISTEM

### Halaman Admin 1: Verifikasi Kredensial & SKTM Pro Bono (ST-022 / UC-13)
* **Tujuan**: Memfasilitasi Admin Compliance untuk memverifikasi lisensi mitra (STR/SIPP/Peradi) dan SKTM klien Pro Bono dengan integrasi API nasional.
* **Komponen Utama**:
  1. **Tab Navigation**: Switcher antara *Tab Verifikasi Mitra Profesional* dan *Tab Verifikasi SKTM Pro Bono (Klien)*.
  2. **Document Viewer**: Jendela WORM PDF Previewer di sisi kiri layar dengan proteksi anti-download.
  3. **Cross-Check API Panel**: Panel kanan dengan tombol aksi cepat panggilan API nasional (KKI/KTKI, HIMPSI, Peradi, Dukcapil, DTKS Kemensos).
  4. **Action Gates**: Tombol *"Setujui / Approve"* (hijau) dan *"Tolak / Reject"* (merah dengan modal wajib alasan penolakan).
* **PlantUML Wireframe**:
```plantuml
@startsalt
{+
  {* **JUSTIFICA ADMIN PORTAL** | [Verifikasi Kredensial] | [Manajemen Akun] | [Keuangan & PPh 21] | [Audit WORM] }
  ==
  {
    [X] Tab 1: Lisensi Mitra (12 Antrean) | [ ] Tab 2: SKTM Pro Bono Klien (5 Antrean)
  }
  --
  {+
    **Daftar Antrean Verifikasi**
    {
      ^Nama Pendaftar^ | ^Domain^ | ^No. Lisensi / STR^ | ^Status API Cross-Check^ | ^Aksi^
      dr. Andi Saputra | Medis (Sp.A) | STR-889102-2026 | [VALID - KKI API Match] | [Review Dokumen]
      Siti Aminah, M.Psi | Psikologi | SIPP-00219-HIMPSI | [VALID - HIMPSI Match] | [Review Dokumen]
      Budi Santoso, S.H. | Hukum | PERADI-99102 | [PENDING CROSS-CHECK] | [Review Dokumen]
    }
  }
  ==
  {+
    **PANEL TINJAUAN BERKAS WORM — dr. Andi Saputra**
    {
      {
        **WORM PDF Previewer (Encrypted)**
        +-----------------------------------+
        | [STR DOKTER KKI - SCAN PDF]       |
        | Nama: dr. Andi Saputra            |
        | No: 889102 / Berlaku s/d: 2028    |
        | SHA-256: 8f9a2b1c...99a0e1        |
        +-----------------------------------+
      } | {
        **Hasil Cross-Check API KKI / KTKI**
        [Status: MATCH 100% - AKTIF]
        * NIK Terdaftar: 3171029910290001 (Dukcapil OK)
        * STR Valid di Konsil Kedokteran Indonesia
        * BPJS Provider Flag: Terverifikasi
        --
        **Keputusan Compliance Admin:**
        [ (v) SETUJUI & AKTIFKAN AKUN ]
        [ ( ) TOLAK & MINTA UNGGAH ULANG ]
        Catatan Penolakan (Jika ada):
        "                                "
        --
        [ EKSEKUSI KEPUTUSAN (LOG WORM) ]
      }
    }
  }
}
@endsalt
```

---

### Halaman Admin 2: Manajemen Akun & Laporan Pelanggaran (ST-023, ST-024 / UC-14, UC-15)
* **Tujuan**: Menangani pelanggaran ketentuan layanan oleh klien maupun mitra dengan prinsip *Due Process of Law* (Warning 1/2/3, banding 14 hari) dan *Ethics Committee Flow* (Sidang Etik Multidisiplin).
* **Komponen Utama**:
  1. **User Table & Warning Badge**: Tabel daftar akun dengan indikator warna *Warning Count* (0 = Hijau, 1-2 = Kuning, 3 = Merah/Suspend).
  2. **Due Process Suspension Modal**: Form penjatuhan suspend dengan otomatisasi surat pembekuan dan argo hitung mundur masa banding 14 hari kerja.
  3. **Ethics Committee Panel**: Panel khusus pembentukan Tim Etik Multidisiplin (1 Dokter, 1 Psikolog, 1 Advokat, 1 Admin) dan penjadwalan *Hearing Etik Virtual*.
* **PlantUML Wireframe**:
```plantuml
@startsalt
{+
  {* **JUSTIFICA ADMIN PORTAL** | [Verifikasi Kredensial] | [Manajemen Akun] | [Keuangan & PPh 21] | [Audit WORM] }
  ==
  {
    [Filter Domain: Semua v] | [Cari NIK/Email:           ] | [Status: Reported / Warning v] | [Cari]
  }
  --
  {+
    **Tabel Manajemen Akun & Laporan Pelanggaran**
    {
      ^ID Akun^ | ^Nama Pengguna^ | ^Peran^ | ^Warning Count^ | ^Laporan Etik / Adverse Event^ | ^Status^ | ^Aksi Hukum/Etik^
      CL-9910 | Ahmad Klien | Klien | [Warning: 2/3] | Kata kasar di chat hukum | ACTIVE | [Kirim Warning Ke-3] / [Suspend (14D Appeal)]
      DR-1102 | dr. Budi Salah | Mitra | [Warning: 1/3] | Rating 1* (Alergi obat berat) | UNDER_INVEST | [Bentuk Tim Etik Multidisiplin]
      PS-4412 | Rina Psikolog | Mitra | [Warning: 0/3] | - | ACTIVE | [Pantau Profil]
    }
  }
  ==
  {+
    **MODAL SIDANG ETIK MULTIDISIPLIN — DR-1102 (dr. Budi Salah)**
    {
      **Komposisi Tim Etik (4 Panel Ahli Wajib):**
      [v] Dokter Senior: dr. Hendra, Sp.PD (KKI Member)
      [v] Psikolog Senior: Dra. Maya, M.Psi (HIMPSI)
      [v] Advokat Senior: Bambang, S.H., M.H. (Peradi)
      [v] Admin Compliance: Legal Officer JUSTIFICA
      --
      **Status Hearing & Putusan Akhir:**
      Jadwal Hearing Virtual: [05 Juli 2026, 10:00 WIB] | Status: [SELESAI DILAKSANAKAN]
      --
      **Input Putusan Tim Etik:**
      ( ) TIDAK TERBUKTI / BEBASKAN (Rehabilitasi Nama Baik)
      (*) TERBUKTI MELANGGAR ETIK BERAT (Malpraktik Resep)
      --
      **Tindakan Eksekusi Sistem:**
      [v] Suspend Permanen Akun Mitra DR-1102
      [v] Generate & Kirim Laporan Resmi ke Konsil Kedokteran Indonesia (KKI)
      [v] Simpan Transkrip & Putusan di WORM Storage (SHA-256 Locked)
      --
      [ FINALISASI PUTUSAN ETIK ] | [ BATAL ]
    }
  }
}
@endsalt
```

---

### Halaman Admin 3: Laporan Keuangan & Rekonsiliasi Transaksi (ST-025, ST-026 / UC-16, UC-17)
* **Tujuan**: Memantau volume transaksi (GMV), mengalkulasi bagi hasil proporsional per domain (Medis 15% / Psi 20% / Huk 25%), menangani antrean pencairan manual (>= Rp 5 Juta), dan mengekspor laporan WORM ber-hash SHA-256.
* **Komponen Utama**:
  1. **GMV & Revenue Share Cards**: Visualisasi kartu metrik keuangan real-time.
  2. **Disbursement Approval Queue**: Tabel antrean pencairan mitra dengan filter threshold (< 5 Juta Auto-Disburse, >= 5 Juta butuh tombol *Approve Transfer*).
  3. **WORM Export Tool**: Modul pembuatan dokumen akuntansi (XLSX/PDF) dengan penyematan *checksum hash SHA-256* di footer file.
* **PlantUML Wireframe**:
```plantuml
@startsalt
{+
  {* **JUSTIFICA ADMIN PORTAL** | [Verifikasi Kredensial] | [Manajemen Akun] | [Keuangan & PPh 21] | [Audit WORM] }
  ==
  {
    **DASHBOARD INTELIJEN FINANSIAL & REVENUE SHARING (JULI 2026)**
    +---------------------------+ +---------------------------+ +---------------------------+ +---------------------------+
    | Total GMV Transaksi       | | Pendapatan Bersih Platform| | Total Payout Mitra (80%)  | | Escrow Pro Bono Hukum     |
    | Rp 1.250.000.000          | | Rp 237.500.000            | | Rp 1.012.500.000          | | Rp 45.000.000 (Locked)    |
    +---------------------------+ +---------------------------+ +---------------------------+ +---------------------------+
  }
  --
  {
    **Proporsi Bagi Hasil per Domain (Automated SAK Engine):**
    * [Medis]: Platform 15% / Dokter 85% | * [Psikologi]: Platform 20% / Psikolog 80% | * [Hukum]: Platform 25% / Advokat 75%
  }
  ==
  {+
    **ANTREAN PENCARIAN DANA MITRA (THRESHOLD CONTROL >= Rp 5.000.000)**
    {
      ^ID Tiket^ | ^Nama Mitra^ | ^Domain^ | ^Nominal Penarikan^ | ^Potongan PPh 21^ | ^Rekening Tujuan (AML Check)^ | ^Status^ | ^Aksi Admin^
      WD-8810 | dr. Andi Saputra | Medis | Rp 12.500.000 | Rp 625.000 (5%) | BCA 0912831 (MATCH STR) | PENDING_MANUAL | [Approve & Transfer API]
      WD-8811 | Siti Aminah, M.Psi | Psikologi | Rp 3.200.000 | Rp 160.000 (5%) | Mandiri 10293 (MATCH SIPP) | AUTO_DISBURSED | [Lihat Remittance]
      WD-8812 | Budi Santoso, S.H. | Hukum | Rp 25.000.000 | Rp 1.250.000 (5%) | BNI 091283 (MATCH PERADI) | PENDING_MANUAL | [Approve & Transfer API]
    }
  }
  --
  {
    **EKSPOR LAPORAN AKUNTANSI WORM AUDIT-READY:**
    [Pilih Periode: 1-30 Juni 2026 v] | [Format: .XLSX & .PDF (SHA-256 Signed) v] | [ EKSPOR LAPORAN WORM HASHED ]
  }
}
@endsalt
```

---

## 3. SPESIFIKASI & WIREFRAME 3 MODUL UPDATE DOMAIN

### Modul Update 1: Domain Kesehatan Medis (ST-011, ST-012, ST-013 / UC-11, UC-12, Kes-UC01)
* **Fitur Kunci**: Form e-Resep dengan modul *Drug-Drug Interaction (DDI) Checker* real-time, protokol resep 3 rangkap untuk obat Narkotika/Psikotropika (*Controlled Drugs*), dan penulisan SOAP Note dengan *auto-complete* kode diagnosis ICD-10.
* **PlantUML Wireframe**:
```plantuml
@startsalt
{+
  {* **PANEL KONSULTASI MEDIS (DR. ANDI SAPUTRA, SP.A)** | [Chat E2EE] | [SOAP Note & ICD-10] | [e-Resep DDI Checker] }
  ==
  {+
    **FORMULIR SOAP NOTE (PERMENKES 24/2022 COMPLIANT)**
    {
      Subjective (Keluhan):  | "Demam tinggi 3 hari, batuk berdahak, lemas           "
      Objective (Fisik):     | "Suhu 38.8 C, napas cepat 28x/mnt                     "
      Assessment (ICD-10):   | [ J18.9 - Pneumonia, unspecified (AUTOCOMPLETE MATCH) v]
      Plan (Tindakan):       | "Berikan antibiotik & antipiretik, istirahat total    "
    }
  }
  ==
  {+
    **PERESEPAN ELEKTRONIK (e-RESEP) & DDI CHECKER**
    {
      ^Nama Obat^ | ^Dosis^ | ^Frekuensi^ | ^Aturan Pakai^ | ^Controlled Drug Flag^ | ^Aksi^
      Amoxicillin | 500mg | 3x1 hari | Sesudah makan | [ ] Normal | [Hapus]
      Paracetamol | 500mg | 3x1 hari | Jika demam | [ ] Normal | [Hapus]
      Codeine     | 15mg  | 2x1 hari | Batuk berat | [v] NARKOTIKA (3-RANGKAP) | [Hapus]
    }
    --
    {+
      **ALARM MODUL DDI CHECKER (DRUG-DRUG INTERACTION ALERT)**
      [!] PERINGATAN INTERAKSI OBAT: Kombinasi [Amoxicillin] dan [Obat X sebelumnya] memiliki potensi alergi silang ringan.
      [v] Saya telah menelaah interaksi obat ini dan bertanggung jawab penuh secara klinis (Override Log WORM SHA-256).
    }
    --
    [ TERBITKAN e-RESEP 3-RANGKAP & KIRIM KE SIA APOTEK MITRA ]
  }
}
@endsalt
```

---

### Modul Update 2: Domain Hukum (ST-008, ST-010, ST-019 / UC-04, Huk-UC01, Huk-UC02)
* **Fitur Kunci**: Ruang obrolan berarsitektur *Zero-Knowledge* dengan spanduk emas *"PRIVILEGED AND CONFIDENTIAL"*, panel *Legal Drafting* metode IRAC dengan *Version Control* (v1/v2/Final), pembubuhan e-Meterai Peruri Rp 10.000, dan mekanisme *Download Gate*.
* **PlantUML Wireframe**:
```plantuml
@startsalt
{+
  {* **RUANG OBROLAN HUKUM — ADV. BUDI SANTOSO, S.H.** | [Chat E2EE ZK] | [Legal Drafting IRAC] | [Bukti Perkara] }
  ==
  {
    **[GOLD BANNER] PRIVILEGED AND CONFIDENTIAL — UU NO. 18 TAHUN 2003 COMPLIANT**
    *Seluruh komunikasi & bukti perkara dilindungi hak keistimewaan advokat-klien. Admin Sistem tidak dapat membaca ruang ini.*
  }
  --
  {+
    **PANEL LEGAL DRAFTING & VERSION CONTROL (TEMPLATE IRAC)**
    Pilih Template Akta: [Surat Kuasa Khusus Perdata (Peruri Stamp Ready) v]
    {
      Issue (Pokok Gugatan):       | "Wanprestasi kontrak jual beli tanah seharga Rp 2 Miliar    "
      Rule (Dasar Hukum/Pasal):    | "Pasal 1243 KUHPerdata & UU No. 10 Tahun 2020 tentang Meterai"
      Application (Analisis):      | "Pihak Kedua terbukti lalai membayar angsuran termin ke-3    "
      Conclusion (Tuntutan):       | "Membayar ganti rugi materiil & immateriil seketika          "
    }
    --
    **Version Control & Retention History (10-Year Legal Hold):**
    (*) v1.0 (Draft Awal) | (*) v2.0 (Revisi Klien) | (*) **vFinal (Ready for Stamping)**
    --
    {+
      **INTEGRASI e-METERAI PERUM PERURI Rp 10.000 & DOWNLOAD GATE**
      [Status e-Meterai: READY TO STAMP] | Saldo Token Peruri Mitra: [15 Meterai]
      --
      [ (v) BUBUHKAN e-METERAI Rp 10.000 & CAP PRIVILEGE (SHA-256 HASH) ]
      --
      *Catatan Download Gate*: File PDF final akan dikunci di chat Klien hingga tiket tagihan draf berstatus `PAID`.
    }
  }
}
@endsalt
```

---

### Modul Update 3: Domain Psikologi (ST-011, ST-016, ST-018 / UC-11, Psi-UC01, Psi-UC03)
* **Fitur Kunci**: DAP Note dengan pengukur Level Risiko klinis, Asesmen DASS-21 dengan *Mandatory Crisis Protocol pop-up 119 ext 8* (mengunci layar 10 detik, tombol close dimatikan), dan Mood Tracker dengan *Proactive Wellness Banner*.
* **PlantUML Wireframe**:
```plantuml
@startsalt
{+
  {* **MODUL KLIEN PSIKOLOGI & ASESMEN KLINIS** | [Mood Tracker] | [Asesmen DASS-21] | [Audio Meditasi] }
  ==
  {+
    **WIDGET MOOD TRACKER & PROACTIVE WELLNESS BANNER**
    Grafik Tren 7 Hari Terakhir: [Sedih] -> [Cemas] -> [Panik] -> [Sedih] -> [Sedih] -> [Sedih] -> [Panik]
    --
    {
      **[EMERALD ALERT] PROACTIVE MENTAL HEALTH BANNER**
      *Kami memperhatikan 7 hari terakhir terasa sangat berat bagi Anda. Anda tidak sendiri. Mari berbicara dengan konselor.*
      [ PESAN SESI KONSULING SEKARANG (DISKON SUBSIDI 50%) ] | [ PUTAR AUDIO GROUNDING 5-4-3-2-1 ]
    }
  }
  ==
  {+
    **SIMULASI HASIL ASESMEN DASS-21 (DEPRESSION, ANXIETY, STRESS SCALE)**
    Skor Depression: [28 - SEVERE] | Skor Anxiety: [22 - EXTREMELY SEVERE] | Skor Stress: [18 - MODERATE]
    --
    {+
      **[URGENT RED MODAL] MANDATORY CRISIS INTERVENTION PROTOCOL (HIMPSI COMPLIANT)**
      +-----------------------------------------------------------------------------------+
      | PERINGATAN DARURAT KRISIS KESEHATAN MENTAL                                        |
      | Skor asesmen Anda menunjukkan tingkat kecemasan & depresi yang memerlukan         |
      | pertolongan medis/klinis segera. Demi keselamatan Anda, protokol krisis aktif:    |
      |                                                                                   |
      | 1. HOTLINE KRISIS NASIONAL 24/7 (KEMENKES & LBH MENTAL HEALTH):                   |
      |    >> TELEPON SEKARANG: 119 Ekstensi 8 atau (021) 500-454 <<                      |
      |                                                                                   |
      | 2. SISTEM TELAH MENGIRIM ALERT DARURAT KE SUPERVISOR KLINIS PSIKOLOGI JUSTIFICA   |
      | 3. ANTREAN ANDA DI-PRIORITASKAN KHUSUS KEPADA PSIKOLOG KLINIS SPESIALIS TRAUMA    |
      |                                                                                   |
      | [ Tombol Tutup / Close dinonaktifkan sistem selama hitung mundur: 00:07 detik ]   |
      +-----------------------------------------------------------------------------------+
    }
  }
}
@endsalt
```
"""

with open(TARGET_FILE, 'w', encoding='utf-8') as f:
    f.write(CONTENT.strip() + "\n")

print("Successfully generated MOCKUP_SPEC_DETAIL.md.")
