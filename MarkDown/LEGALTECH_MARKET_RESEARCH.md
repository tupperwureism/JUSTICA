# LAPORAN RISET PASAR & ANALISIS FITUR COMPETITOR TELELEGAL / LEGALTECH
**Proyek:** Justica SuperApp (Konsultasi & Layanan Hukum Terpadu)  
**Tanggal:** 22 Juli 2026  
**Metodologi:** Live Web Scraping, Verification & Comparative Market Analysis  

---

## 📌 PEMBAGIAN WILAYAH & STATUS OPERASIONAL

### AREA A: TELELEGAL DALAM NEGERI (INDONESIA)
- 🟢 **CURRENTLY LIVE / ACTIVE:**
  - **Justika** (`justika.com`) — Marketplace konsultasi hukum terkemuka.
  - **TNOS** (`tnos.co.id`) — Platform konsultasi hukum 24 jam & pendampingan fisik/pengawasan.
  - **Perqara** (`perqara.com`) — Platform konsultasi hukum gratis (pro bono) & berbayar.
  - **Hukumonline / Klinik Hukumonline** (`hukumonline.com`) — Database regulasi, media hukum, & AI chatbot LIA.
  - **KontrakHukum** (`kontrakhukum.com`) — Legalitas usaha, pendirian PT/CV, & pembuatan dokumen digital.
- 🔴 **DEAD / INACTIVE / PIVOTED:**
  - **PopLegal** (`poplegal.id`) — *DEAD (Non-Aktif)*. Didirikan 2015 untuk layanan administrasi hukum UKM & PopDocs. Gagal monetisasi akibat rendahnya literasi hukum digital dan fleksibilitas harga UKM.
  - **Hakita** (`hakita.id`) — *INACTIVE / DEFUNCT*. Dulu fokus pada otomatisasi dokumen perjanjian, namun tidak aktif berkembang dan terhenti secara operasional.
  - **LegalGo** (`legalgo.id`) — *PIVOTED / DORMANT B2C*. Berpindah fokus dari marketplace konsumen ke agregator kepatuhan pajak/fintech (regtech) untuk korporasi.

---

### AREA B: TELELEGAL LUAR NEGERI (GLOBAL / US / UK / EU)
- 🟢 **CURRENTLY LIVE / ACTIVE:**
  - **LegalZoom** (`legalzoom.com` - US) — Raksasa legal DIY, pembentukan usaha, & legal advisory plan.
  - **Rocket Lawyer** (`rocketlawyer.com` - US/UK/EU) — Templat dokumen interaktif, e-signature RocketSign, & subscription konsultasi.
  - **Avvo** (`avvo.com` - US) — Direktori pengacara terbesar dengan rating, review, & konsultasi Q&A.
  - **LegalShield** (`legalshield.com` - US/CA) — Model prepaid legal membership & jaringan firma hukum mitra.
  - **Clio** (`clio.com` - Global) — SaaS Legal Practice Management & AI client intake (Clio Draft).
  - **Ironclad** (`ironcladapp.com` - Global) — Enterprise Contract Lifecycle Management (CLM) berbasis AI.
- 🔴 **DEAD / INACTIVE / PIVOTED:**
  - **Atrium** (`atrium.co`) — *DEAD / SHUT DOWN (2020)*. Mengumpulkan pendanaan $75.5M (Justin Kan), namun tutup total karena benturan budaya operasi law firm tradisional vs ekspektasi pertumbuhan software SaaS.
  - **UpCounsel** (`upcounsel.com`) — *PIVOTED / SHUTDOWN & ASSET SALE (2020)*. Sempat ditutup akibat gugatan tuduhan fee-splitting / unauthorized practice of law dari LegalZoom, sebelum akhirnya aset domain dijual dan diluncurkan ulang dengan struktur baru.
  - **DoNotPay** (`donotpay.com`) — *PIVOTED / RESTRICTED*. Ditegur dan digugat (class-action & State Bar warnings) atas klaim "Robot Lawyer" tanpa lisensi advokat, memaksanya mundur dari konsultasi hukum formal ke bantuan sengketa konsumen ringan.

---

## 📊 BAGIAN I: TABEL DATA MENTAH KOMPETITOR

### 1. AREA A — DALAM NEGERI (INDONESIA)

#### 🟢 CURRENTLY LIVE / ACTIVE
| 0. Nama Web / Platform & URL Domain | 1. Daftar Fitur Utama & Model Bisnis |
| :--- | :--- |
| **Justika**<br>`https://www.justika.com` | **Fitur Utama:** Konsultasi Chat (instant/scheduled), Telepon/Voice Call, Video Call, Pembuatan Dokumen Perjanjian (Kontrak), Review Dokumen Hukum, Layanan Pendirian Usaha (PT/CV).<br>**Model Bisnis:** Pay-per-session (Tarif flat Rp30rb - Rp150rb per konsultasi), Fee-sharing dengan mitra Advokat, & Paket pembuatan dokumen fixed-fee. |
| **TNOS**<br>`https://tnos.co.id` | **Fitur Utama:** Konsultasi Hukum 24 Jam via Video Call, Pendampingan Hukum Offline (Polisi/Pengadilan/Mediasi), Pengawalan Pribadi (Bodyguard), Pembuatan Akta/PT.<br>**Model Bisnis:** Pay-per-use (bayar per durasi video call atau per event pendampingan lapangan), Commission fee mitra advokat/pengawal. |
| **Perqara**<br>`https://perqara.com` | **Fitur Utama:** Konsultasi Hukum Instan Chat/Call, Layanan Pro Bono (Gratis untuk Pidana & Keluarga tertentu), Konsultasi Berbayar Komersial, Template Dokumen Hukum.<br>**Model Bisnis:** Freemium / Pro Bono subsidised by Commercial B2B legal fees, Partnership sponsorship. |
| **Hukumonline**<br>`https://www.hukumonline.com` | **Fitur Utama:** Database Peraturan & Putusan Pengadilan terbesar, Klinik Hukum (Q&A Artikel), AI Chatbot (LIA - Legal Intelligent Assistant), RegTech (Regulatory Compliance System).<br>**Model Bisnis:** Subscription B2B/Corporate Enterprise, Direct Advertising, Paid Training/Webinar. |
| **KontrakHukum**<br>`https://kontrakhukum.com` | **Fitur Utama:** Pembuatan & Review Kontrak Bisnis, Pendirian Badan Usaha & Izin Usaha (OSS RBA), Pendaftaran HKI/Merek, Notaris Digital, e-Meterai & Sign.<br>**Model Bisnis:** Transactional Fixed Price per Service Package, Subscription Retainer Legal Corporate untuk SME. |

#### 🔴 DEAD / INACTIVE / PIVOTED
| 0. Nama Web / Platform & URL Domain | 1. Daftar Fitur Utama & Model Bisnis | Catatan Kegagalan / Status |
| :--- | :--- | :--- |
| **PopLegal**<br>`http://poplegal.id` | **Fitur:** Modul PopDocs (generator dokumen kontrak), konsultasi hukum dasar UKM, pendaftaran usaha.<br>**Model Bisnis:** Freemium & Pay-per-document. | **DEAD (2019/2020):** Pasar UKM Indonesia sangat sensitif harga dan rendah literasi hukum; biaya akuisisi pengguna (CAC) lebih tinggi dibanding *Lifetime Value* (LTV). |
| **Hakita**<br>`https://hakita.id` | **Fitur:** Otomatisasi pengerjaan draft perjanjian, konsultasi hukum via formulir web.<br>**Model Bisnis:** Pay-per-contract. | **INACTIVE:** Gagal mencapai *product-market fit* (PMF) dan terhenti di tahap adopsi awal karena kurangnya saluran distribusi advokat. |
| **LegalGo**<br>`https://legalgo.id` | **Fitur:** Konsultasi hukum usaha, pendirian PT, verifikasi dokumen.<br>**Model Bisnis:** Marketplace Jasa Hukum. | **PIVOTED:** Meninggalkan agregasi konsumen individu/UKM lepas, pivot menjadi platform kepatuhan perpajakan/fintech korporat (RegTech). |

---

### 2. AREA B — LUAR NEGERI (GLOBAL / US / UK / EU)

#### 🟢 CURRENTLY LIVE / ACTIVE
| 0. Nama Web / Platform & URL Domain | 1. Daftar Fitur Utama & Model Bisnis |
| :--- | :--- |
| **LegalZoom**<br>`https://www.legalzoom.com` | **Fitur Utama:** Business Formation (LLC, Corp), Trademark Registration, Wills & Estate Planning, Business Advisory Plan (Akses jaringan pengacara mitra).<br>**Model Bisnis:** Hybrid Transactional (One-time filing fees $0+state fees) + Subscription Recurring (Annual/Monthly Attorney Subscription & Registered Agent Fees). |
| **Rocket Lawyer**<br>`https://www.rocketlawyer.com` | **Fitur Utama:** Interactive Document Generator (Q&A-based drafting), RocketSign (e-signature built-in), Ask-a-Lawyer consultation, Attorney Document Review.<br>**Model Bisnis:** Monthly SaaS Subscription ($39.99/mo) yang memberikan potongan harga 40% untuk legal services + Free unlimited document creation. |
| **Avvo**<br>`https://www.avvo.com` | **Fitur Utama:** Direktori Pengacara 97%+ US, Rating System (Avvo Rating), Public Legal Q&A Forum, Fixed-Price Legal Services.<br>**Model Bisnis:** Directory Advertising & Lead Generation (Advokat membayar slot iklan sponsor & profil terverifikasi), Pay-per-lead. |
| **LegalShield**<br>`https://www.legalshield.com` | **Fitur Utama:** Prepaid Legal Plan (Konsultasi telepon tanpa batas, penulisan surat/telepon atas nama klien, review kontrak 15 halaman, bantuan tilang/traffic violation).<br>**Model Bisnis:** Prepaid Monthly Subscription (MLM / Direct Sales distribution network) berkisar $29.95 - $49.95/bulan. |
| **Clio**<br>`https://www.clio.com` | **Fitur Utama:** End-to-end Law Firm Practice Management, Time Tracking, Billing/Invoicing, Client Intake Portal, Clio Draft (AI Document Automation).<br>**Model Bisnis:** B2B SaaS per-seat subscription ($49 - $149/user/month). |
| **Ironclad**<br>`https://ironcladapp.com` | **Fitur Utama:** Enterprise Contract Lifecycle Management (CLM), Real-time Collaboration & Redlining, AI-powered Clause Extraction, Workflow Automation.<br>**Model Bisnis:** Enterprise SaaS Subscription berdasarkan volume kontrak & seat advokat internal. |

#### 🔴 DEAD / INACTIVE / PIVOTED
| 0. Nama Web / Platform & URL Domain | 1. Daftar Fitur Utama & Model Bisnis | Catatan Kegagalan / Status |
| :--- | :--- | :--- |
| **Atrium**<br>`https://atrium.co` | **Fitur:** Tech-enabled Law Firm + Legal Software Suite untuk startup (fundraising, equity, contract management).<br>**Model Bisnis:** Monthly retainer subscription untuk jasa legal + software. | **DEAD (2020):** Menutup operasi setelah membakar $75.5M. Penyebab: Tidak bisa mengotomatisasi pekerjaan advokat secepat yang diperkirakan; model *hybrid law firm* tidak memiliki *margin expansion* seperti murni SaaS. |
| **UpCounsel**<br>`https://www.upcounsel.com` | **Fitur:** Marketplace advokat freelance on-demand untuk korporasi/UKM.<br>**Model Bisnis:** Commission fee % dari project billing. | **PIVOTED/RELAUNCHED:** Ditutup pada 2020 akibat tekanan hukum regulasi *fee-splitting* dengan non-pengacara dari State Bar & LegalZoom. Aset dibeli pihak ketiga dan struktur pembayaran direvisi. |
| **DoNotPay**<br>`https://donotpay.com` | **Fitur:** "World's First Robot Lawyer", otomatisasi surat gugatan kecil (small claims), pembatalan langganan, banding tiket parkir.<br>**Model Bisnis:** Consumer Subscription ($36/quarter). | **PIVOTED/RESTRICTED:** Terkena gugatan *Unauthorized Practice of Law* (UPL) di California. Menghentikan fitur representasi hukum formal dan kembali fokus pada sengketa konsumen ringan. |

---

## 🎯 BAGIAN II: ANALISIS SINTESIS & KESIMPULAN FITUR

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      JUSTICA SUPERAPP FEATURE MATRIX                   │
 ├──────────────────────────────────┬─────────────────────────────────────┤
 │ 1. MUST-HAVE (Baseline)          │ 2. FITUR PEMBEDA (Differentiators)   │
 │ • Chat & Video Teleconsultation  │ • SLA Respon Dijamin (< 15 menit)   │
 │ • Smart Search & Legal Directory │ • Escrow Payment (Rekening Bersama) │
 │ • Document Builder (Template)    │ • Fixed Flat-Rate Transparent Fees  │
 │ • E-Signature Basic              │ • On-Demand Offline Escort / Bantuan│
 ├──────────────────────────────────┴─────────────────────────────────────┤
 │ 3. KILLER FEATURES (Uncommon & High Value)                             │
 │ • AI Legal Assistant Pre-Consultation (Triaging & Smart Summary)       │
 │ • Anti-Tamper WORM Audit Vault (Verifikasi Berkas Bergaransi Kriptografi)│
 │ • Integrated Legal Fee Calculator & Probability Estimator             │
 │ • Automatic e-Meterai PERURI Integration & Digital Notarization       │
 └────────────────────────────────────────────────────────────────────────┘
```

### 2. FITUR COMMON / MUST-HAVE (Baseline Standard)
*Fitur dasar yang WAJIB ada di Justica SuperApp agar layak bersaing di pasar modern:*

1. **Multi-Channel Teleconsultation (Chat, Audio, & Video Call):**  
   Fungsi konsultasi langsung antara pengguna dan advokat berlisensi. Chat instan dengan pengiriman lampiran berkas serta opsi panggilan suara/video dalam aplikasi.
2. **Direktori Advokat & Profil Terverifikasi:**  
   Pencarian mitra advokat berdasarkan spesifikasi bidang (Hukum Keluarga, Pidana, Bisnis, HKI, Ketenagakerjaan) lengkap dengan nomor NIA (Nomor Induk Advokat), foto, pengalaman, dan rating/review pengguna.
3. **Automated Document Generator (Template Generator):**  
   Modul pengisian formulir interaktif (wizard Q&A) untuk menghasilkan draft perjanjian umum (misal: NDA, Surat Perjanjian Kerja, Surat Kuasa, MoU).
4. **Basic E-Signature Integration:**  
   Fasilitas penandatanganan dokumen secara digital langsung setelah draft disetujui dalam platform.
5. **Transparansi Tarif & Pembayaran Digital:**  
   Integrasi payment gateway lokal (QRIS, Transfer Bank, E-Wallet) dengan tampilan harga terbuka tanpa *hidden cost*.

---

### 3. FITUR PEMBEDA (Key Differentiators)
*Fitur yang membedakan satu kompetitor dari yang lain dan menjadi poin penjualan unik (USP):*

1. **Guarantee SLA Response Time (Pembeda Operasional):**  
   *Contoh:* Menjamin advokat merespon chat dalam waktu kurang dari 15 menit. Jika meleset, biaya konsultasi digratiskan atau dikembalikan (*Money-back guarantee*).
2. **On-Demand Offline Legal Escort & Assistance (Pembeda Layanan Lapangan — ala TNOS):**  
   Memungkinkan pengguna memesan pendampingan advokat secara fisik langsung ke lokasi (misal: pendampingan di Kepolisian saat BAP, negosiasi bisnis, atau sidang pengadilan).
3. **Escrow / Rekening Bersama Sistem Jasa Hukum:**  
   Dana pembayaran pembuatan dokumen atau penanganan perkara ditahan oleh platform dan baru diteruskan ke advokat setelah pekerjaan selesai dan disetujui klien (*milestone-based payment*).
4. **Model Subscription Prepaid Membership (ala LegalShield):**  
   Berlangganan bulanan murah (misal Rp99rb/bulan untuk individu / Rp499rb untuk UKM) yang mencakup gratis *unlimited chat consultation*, review 2 dokumen per bulan, dan diskon 30% untuk pendampingan persidangan.

---

### 4. FITUR KEREN / KHUSUS / UNCOMMON (Killer Features)
*Fitur canggih & belum banyak diterapkan di Indonesia yang berpotensi menjadikan Justica SuperApp sebagai market leader:*

1. **AI Legal Pre-Consultation Assistant (Triaging & Smart Case Summary):**  
   *Konsep:* Sebelum terhubung ke advokat manusia, AI Agent menginterogasi kasus pengguna via Q&A natural. AI secara otomatis menyusun **"Ringkasan Chronology Kasus & Potensi Pasal Relevan"** untuk disajikan ke advokat.  
   *Dampak:* Menghemat waktu konsultasi hingga 50%, meningkatkan efisiensi jam advokat, dan memberikan rekomendasi advokat yang paling tepat secara presisi.
2. **WORM (Write Once Read Many) Secure Document Vault & Cryptographic Verification:**  
   *Konsep:* Setiap dokumen legal yang dibuat, ditandatangani, atau di-review di Justica disimpan dalam *Immutable Cryptographic Vault*. Menghasilkan SHA-256 Hashes & QR Verification Code untuk memastikan berkas asli tidak dapat dipalsukan atau diubah di kemudian hari.
3. **Integrasi e-Meterai Resmi PERURI & Notaris Digital Automasi:**  
   *Konsep:* Pembelian dan pembubuhan e-Meterai resmi PERURI langsung di dalam kanvas dokumen platform, diintegrasikan dengan jaringan Notaris mitra untuk pengesahan (*Legalisasi/Waarmerk*) secara remote.
4. **Legal Risk & Fee Probability Calculator:**  
   *Konsep:* Kalkulator statistik berbasis AI/Data Putusan Pengadilan terdahulu yang memberikan estimasi awal bagi pengusaha/individu mengenai rentang biaya persidangan, durasi penyelesaian perkara, dan estimasi estimasi risiko hukum sebelum mereka memutuskan menyewa advokat.

---

> [!NOTE]
> **REKOMENDASI EKSEKUSI UNTUK JUSTICA SUPERAPP:**  
> Belajar dari kegagalan Atrium dan PopLegal, **Justica SuperApp WAJIB menghindari model murni bakar uang B2C**. Strategi terbaik adalah kombinasi **SaaS B2B Legalitas UKM + Hybrid Escrow Marketplace B2C**, didukung fitur AI Triaging untuk menekan operational expense per consultation session.
