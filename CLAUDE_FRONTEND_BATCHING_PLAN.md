# 🎯 MASTER BATCHING PLAN PROMPT: JUSTIFIQA FRONTEND UI RESET & REGENERATION

Dokumen ini berisi rencana eksekusi bertahap (*Batching Plan*) untuk me-reset dan membangun ulang seluruh antarmuka pengguna (`justifiqa-frontend` / `justica-frontend-claude`) menggunakan AI Claude / Claude Code berdasarkan referensi fisik prototipe HTML (`JustifiqaMockups/JUSTICA_Proto_*.html`) dan spesifikasi Markdown (`JustifiqaMockups/mockup_clear/*.md`).

---

## 💡 STRATEGI NAVIGASI & EFISIENSI TOKEN (ANALISIS TEKNIS)

1. **Mengapa Navigasi Dasar (`Link` & `onNavigate`) Harus Dibangun Bersama UI oleh Claude?**
   - Jika Claude hanya membuat komponen statis terisolasi tanpa *navigation triggers* (`onClick` atau `Link to`), kita harus memodifikasi ulang ratusan baris kode di setiap *header*, kartu, dan tombol hanya untuk menyisipkan *event handler* navigasi. Ini akan membuang waktu dan berisiko merusak proporsi UI (*regression*).
   - **Solusi Hemat Token**: Claude diminta membangun **Komponen UI + Kontrak Properti Navigasi Sederhana (`onNavigate?: (path: string) => void`, `<Link to="...">`)** pada setiap Batch. Claude **TIDAK PERLU** membuat state management global rumit atau menyusun *Central Router Engine* (`App.tsx`) yang besar. Router utama dan integrasi *backend/state* akan kita rakit bersama setelah seluruh UI selesai.
2. **Prinsip Diskrit (*Anti-Hallucination & Anti-Token Exhaustion*)**
   - Eksekusi dibagi menjadi **5 Batch Diskrit**. Satu Batch = Satu giliran prompt kepada Claude. Ini menjaga konsumsi token tetap rendah per giliran dan menjamin kualitas visual maksimal (100% patuh pada spesifikasi referensi).

---

## 📋 DAFTAR BATCH EKSEKUSI

| Batch | Area & Modul | File Referensi Prototipe HTML (`JustifiqaMockups/`) | File Referensi Opsional (`mockup_clear/`) |
| :--- | :--- | :--- | :--- |
| **Batch 1** | **Root Gateway, Verifier & Authentication** | `JUSTICA_Proto_1.1_Gateway_and_Verifier.html` | `MOCK-J-GATEWAY-01`, `MOCK-J-PUBLIC-VERIFY`, `MOCK-J-CL-01`, `MOCK-J-AD-01` |
| **Batch 2** | **Client Portal: Dashboard, Catalog & Checkout Escrow** | `JUSTICA_Proto_1.2_Client_Catalog_Booking.html`<br>`JUSTICA_Proto_1.3_Client_Checkout_Escrow.html` | `MOCK-J-CL-02A`, `MOCK-J-CL-02`, `MOCK-J-CL-02B`, `MOCK-J-CL-03`, `MOCK-J-CL-03B` |
| **Batch 3** | **Client Portal: Consultation Room E2EE, Deliverables & Dispute** | `JUSTICA_Proto_1.4_Client_Consultation_Room.html`<br>`JUSTICA_Proto_1.5_Client_Review_Dispute_Settings.html` | `MOCK-J-CL-04` hingga `MOCK-J-CL-10` |
| **Batch 4** | **Advocate Portal: Command Center, Schedule, Room & e-Meterai** | `JUSTICA_Proto_2.1_Advocate_Portal_KYC_Command.html`<br>`JUSTICA_Proto_2.2_Advocate_Schedule_Room_Deliverable.html`<br>`JUSTICA_Proto_2.3_Advocate_ProBono_Report.html` | `MOCK-J-AD-02A` hingga `MOCK-J-AD-07` |
| **Batch 5** | **Admin Compliance SLA & Escrow Dispute Mediation Center** | `JUSTICA_Proto_3.1_Admin_Compliance_Mediation.html` | `MOCK-J-ADM-01`, `MOCK-J-ADM-02` |

---

# 🚀 PROMPT EKSEKUSI PER BATCH (SIAP COPY-PASTE UNTUK CLAUDE)

Gunakan prompt di bawah ini satu per satu pada Claude Code (`claude`) untuk setiap tahap:

## 🟩 BATCH 1: ROOT GATEWAY, VERIFIER & AUTHENTICATION

```text
Kamu ditugaskan sebagai Principal Frontend UI Engineer untuk membangun Batch 1 antarmuka Justifiqa SuperApp (Platform Hukum Digital Indonesia berarsitektur BCE) di dalam direktori `justifiqa-frontend` (atau `justica-frontend-claude`).

================================================================================
ATURAN MUTLAK ARSITEKTUR & GEOMETRI VISUAL (CLAUDE'S 4 RULES SUPREMACY)
================================================================================
1. DESIGN SYSTEM FIRST: Dilarang menumpuk ad-hoc utility classes liar di JSX. Gunakan variabel tema resmi di `src/index.css` (`--background: Obsidian Dark`, `--primary: Legal Gold / Cyber Blue`, `--card`, `--border`).
2. ANTI-WRAP & ANTI-GEPENG LOCKDOWN: Seluruh tombol CTA, badge, chip, dan item navigasi wajib dikunci dengan properti mutlak (`white-space: nowrap !important; flex-shrink: 0 !important; min-height: 40px; display: inline-flex; align-items: center; justify-content: center;`).
3. STRICT ATOMIC ARCHITECTURE & ZERO VOID CARD: Gunakan komponen dasar dari `src/components/ui/card.tsx`, `button.tsx`, dan `badge.tsx`. Dilarang membuat `min-height` statis raksasa yang menyisakan ruang hampa gelap (*dark void*).
4. ZERO HORIZONTAL CLIPPING: Pastikan pembungkus utama memiliki batas maksimal yang selaras (`max-w-[1600px] mx-auto w-full px-4 sm:px-8 md:px-10`).

================================================================================
TUGAS BATCH 1: ROOT GATEWAY, VERIFIER & AUTHENTICATION
================================================================================
Baca dan pelajari secara fisik file referensi berikut sebelum menulis kode:
- Referensi Utama HTML: `JustifiqaMockups/JUSTICA_Proto_1.1_Gateway_and_Verifier.html`
- Referensi Spec Opsional: `JustifiqaMockups/mockup_clear/MOCK-J-GATEWAY-01_Root_Gateway.md`, `MOCK-J-PUBLIC-VERIFY_Verifikasi_Dokumen.md`, `MOCK-J-CL-01_Portal_Login_Registrasi.md`, `MOCK-J-AD-01_Portal_Login_Advokat.md`

Bangun komponen/halaman berikut dengan struktur yang sama atau lebih mewah dari referensi:
1. `src/pages/LandingGatewayPage.tsx`: Halaman utama (*Root Gateway*) dengan Hero Banner mewah, pilihan masuk portal (*Klien Hukum*, *Advokat Mitra PERADI*, *AI Legal Intelligence*), serta fitur unggulan (WORM Vault & ACID Concurrency).
2. `src/pages/PublicDocumentVerifierPage.tsx`: Halaman verifikasi publik dokumen hukum ber-meterai elektronik & SHA-256 WORM Vault dengan *drag-and-drop zone* dan hasil verifikasi kriptografis.
3. `src/pages/auth/ClientLoginPage.tsx` & `src/pages/auth/AdvocateLoginPage.tsx`: Halaman login/registrasi dengan opsi otentikasi biometrik (FIDO2 / WebAuthn), input NIK/NIA, dan pilihan metode masuk yang bersih.
4. Sertakan trigger navigasi dasar (`<Link to="...">` atau properti `onNavigate?: (path: string) => void`) pada tombol-tombol utama agar siap dihubungkan ke router.

================================================================================
MANDATORY ZERO-ERROR AUDIT GATE
================================================================================
Setelah menulis kode, eksekusi perintah terminal berikut dan pastikan 100% lulus tanpa error atau peringatan:
`npx oxlint && npx tsc -b && npx vite build`
Jika ada error, perbaiki seketika sebelum melapor!
```

---

## 🟦 BATCH 2: CLIENT PORTAL - DASHBOARD, CATALOG & CHECKOUT ESCROW

```text
Kamu ditugaskan sebagai Principal Frontend UI Engineer untuk melanjutkan Batch 2 antarmuka Justifiqa SuperApp di dalam direktori `justifiqa-frontend` (atau `justica-frontend-claude`).

================================================================================
ATURAN MUTLAK ARSITEKTUR & GEOMETRI VISUAL (CLAUDE'S 4 RULES SUPREMACY)
================================================================================
Patuhi mutlak: Design System First, Anti-Wrap/Gepeng Lockdown (`white-space: nowrap`), Zero Void Card, dan Zero Horizontal Clipping. Khusus tabel, dilarang membungkus tabel dalam bingkai berlapis-lapis (*Russian Nesting Doll*). Tabel wajib berada di dalam tepat SATU `<Card>` dengan `<div className="overflow-x-auto w-full">` dan kolom kanan (`AKSI`) ditetapkan eksplisit (`pr-6 text-right whitespace-nowrap font-bold`).

================================================================================
TUGAS BATCH 2: CLIENT DASHBOARD, CATALOG & CHECKOUT ESCROW
================================================================================
Baca dan pelajari secara fisik file referensi berikut:
- Referensi Utama HTML: `JustifiqaMockups/JUSTICA_Proto_1.2_Client_Catalog_Booking.html` & `JustifiqaMockups/JUSTICA_Proto_1.3_Client_Checkout_Escrow.html`
- Referensi Spec Opsional: `JustifiqaMockups/mockup_clear/MOCK-J-CL-02A_Dasbor_Klien_Riwayat.md`, `MOCK-J-CL-02_Katalog_Advokat.md`, `MOCK-J-CL-02B_Profil_Advokat_Booking.md`, `MOCK-J-CL-03_Checkout_Escrow_ProBono.md`, `MOCK-J-CL-03B_Instruksi_Pembayaran_Resi.md`

Bangun komponen modular atomik di `src/components/client/` dan orkestrator halaman di `src/pages/ClientDashboardPage.tsx`:
1. `ClientHeaderAndTabs.tsx`: Topbar & tab switcher (*Dasbor Saya & Riwayat*, *Cari & Katalog Advokat*, *IRAC Bedah Kasus*) yang proporsional dan tidak menabrak margin kanan.
2. `ClientGreetingCard.tsx`: Kartu sapaan klien dengan gradien mewah dan tombol CTA (`+ KONSULTASI BARU`, `Layanan Pro Bono Gratis`).
3. `ClientOverviewTables.tsx`: Tabel antrean konsultasi aktif dan riwayat dokumen WORM Vault yang bersih dari bingkai berlapis serta kolom `AKSI` yang utuh.
4. `AdvocateCatalogTab.tsx` & `AdvocateProfileDetailModal.tsx`: Grid katalog advokat dengan filter spesialisasi, kartu profil advokat (Tarif, Rating, Spesialisasi), dan modal detail profil + jadwal slot.
5. `CheckoutEscrowModal.tsx` / Tab & `PaymentReceiptView.tsx`: Form pemesanan konsultasi ber-escrow mutex, ringkasan biaya, serta instruksi pembayaran VA/QRIS beserta resi kriptografis SHA-256.

================================================================================
MANDATORY ZERO-ERROR AUDIT GATE
================================================================================
Eksekusi dan pastikan lulus 100%: `npx oxlint && npx tsc -b && npx vite build`
```

---

## 🟨 BATCH 3: CLIENT PORTAL - CONSULTATION ROOM E2EE, DELIVERABLES & DISPUTE

```text
Kamu ditugaskan sebagai Principal Frontend UI Engineer untuk melanjutkan Batch 3 antarmuka Justifiqa SuperApp di dalam direktori `justifiqa-frontend` (atau `justica-frontend-claude`).

================================================================================
ATURAN MUTLAK ARSITEKTUR & GEOMETRI VISUAL (CLAUDE'S 4 RULES SUPREMACY)
================================================================================
Patuhi mutlak: Design System First, Anti-Wrap/Gepeng Lockdown, Zero Void Card, dan Zero Horizontal Clipping.

================================================================================
TUGAS BATCH 3: CLIENT CONSULTATION ROOM E2EE, DELIVERABLES, DISPUTE & SETTINGS
================================================================================
Baca dan pelajari secara fisik file referensi berikut:
- Referensi Utama HTML: `JustifiqaMockups/JUSTICA_Proto_1.4_Client_Consultation_Room.html` & `JustifiqaMockups/JUSTICA_Proto_1.5_Client_Review_Dispute_Settings.html`
- Referensi Spec Opsional: `JustifiqaMockups/mockup_clear/MOCK-J-CL-04_Ruang_Obrolan_E2EE.md` hingga `MOCK-J-CL-10_Pengaturan_Akun_Privasi.md`

Bangun halaman dan komponen berikut:
1. `src/pages/ClientConsultationRoomPage.tsx` & subkomponen di `src/components/client/room/`:
   - Ruang obrolan terenkripsi *End-to-End Encryption* (E2EE) dengan indikator sesi hidup/timer (*Mutex Countdown*).
   - *Document Vault Panel*: Tempat unggah/unduh bukti kasus, draf opini hukum, dan tombol persetujuan pelepasan dana (*Escrow Release*).
2. `src/components/client/modals/OfflineConsultationQRModal.tsx`: Modal tampilan QR Code untuk absensi konsultasi tatap muka.
3. `src/components/client/modals/ReviewRatingModal.tsx`: Modal pemberian ulasan, bintang, dan testimoni untuk advokat setelah sesi selesai.
4. `src/components/client/modals/DisputeFormModal.tsx` & `ClientDisputeCenterTab.tsx`: Form pengajuan sengketa/whistleblowing dan pemantauan status mediasi escrow.
5. `src/components/client/AccountSettingsTab.tsx`: Tab pengaturan profil klien, keamanan biometrik FIDO2, dan privasi data.

================================================================================
MANDATORY ZERO-ERROR AUDIT GATE
================================================================================
Eksekusi dan pastikan lulus 100%: `npx oxlint && npx tsc -b && npx vite build`
```

---

## 🟧 BATCH 4: ADVOCATE PORTAL - COMMAND CENTER, SCHEDULE, ROOM & e-METERAI

```text
Kamu ditugaskan sebagai Principal Frontend UI Engineer untuk melanjutkan Batch 4 antarmuka Justifiqa SuperApp di dalam direktori `justifiqa-frontend` (atau `justica-frontend-claude`).

================================================================================
ATURAN MUTLAK ARSITEKTUR & GEOMETRI VISUAL (CLAUDE'S 4 RULES SUPREMACY)
================================================================================
Patuhi mutlak: Design System First, Anti-Wrap/Gepeng Lockdown, Zero Void Card, dan Zero Horizontal Clipping. Pastikan tabel antrean klien dan riwayat pencairan dana diatur tanpa bingkai berlapis (*Zero Box-in-Box*) dan kolom kanan utuh.

================================================================================
TUGAS BATCH 4: ADVOCATE COMMAND CENTER, SCHEDULE, ROOM & DELIVERABLE e-METERAI
================================================================================
Baca dan pelajari secara fisik file referensi berikut:
- Referensi Utama HTML: `JustifiqaMockups/JUSTICA_Proto_2.1_Advocate_Portal_KYC_Command.html`, `2.2_Advocate_Schedule_Room_Deliverable.html`, `2.3_Advocate_ProBono_Report.html`
- Referensi Spec Opsional: `JustifiqaMockups/mockup_clear/MOCK-J-AD-02A_Command_Center_Advokat.md` hingga `MOCK-J-AD-07_Manajemen_ProBono_Laporan.md`

Bangun komponen modular atomik di `src/components/advocate/` dan orkestrator di `src/pages/AdvocateDashboardPage.tsx` serta `AdvocateConsultationRoomPage.tsx`:
1. `AdvocateCommandCenterTab.tsx` & `AdvocateKYCVerificationBanner.tsx`: Dasbor utama advokat dengan statistik konsultasi, saldo escrow tertahan/cair, dan status verifikasi KTA PERADI / Berita Acara Sumpah.
2. `SlotScheduleSettingsTab.tsx`: Pengaturan jadwal ketersediaan slot waktu konsultasi mingguan dan tarif konsultasi ber-mutex.
3. `AdvocateConsultationRoomPage.tsx` / Panel: Ruang obrolan sisi advokat dengan catatan kasus pribadi (*IRAC Notes*) dan kontrol sesi.
4. `DeliverablePublisherModal.tsx`: Panel penerbitan *Legal Opinion / Contract Draft* ber-meterai elektronik Peruri & penandatanganan kriptografis.
5. `AdvocateWalletTab.tsx` & `ProBonoManagementTab.tsx`: Manajemen pencairan honor ke rekening bank dan laporan dedikasi Pro Bono.

================================================================================
MANDATORY ZERO-ERROR AUDIT GATE
================================================================================
Eksekusi dan pastikan lulus 100%: `npx oxlint && npx tsc -b && npx vite build`
```

---

## 🟪 BATCH 5: ADMIN COMPLIANCE SLA & ESCROW DISPUTE MEDIATION CENTER

```text
Kamu ditugaskan sebagai Principal Frontend UI Engineer untuk menyelesaikan Batch 5 (terakhir) antarmuka Justifiqa SuperApp di dalam direktori `justifiqa-frontend` (atau `justica-frontend-claude`).

================================================================================
ATURAN MUTLAK ARSITEKTUR & GEOMETRI VISUAL (CLAUDE'S 4 RULES SUPREMACY)
================================================================================
Patuhi mutlak: Design System First, Anti-Wrap/Gepeng Lockdown, Zero Void Card, dan Zero Horizontal Clipping.

================================================================================
TUGAS BATCH 5: ADMIN COMPLIANCE SLA & ESCROW DISPUTE MEDIATION CENTER
================================================================================
Baca dan pelajari secara fisik file referensi berikut:
- Referensi Utama HTML: `JustifiqaMockups/JUSTICA_Proto_3.1_Admin_Compliance_Mediation.html`
- Referensi Spec Opsional: `JustifiqaMockups/mockup_clear/MOCK-J-ADM-01_Portal_Admin_Compliance_SLA.md` & `MOCK-J-ADM-02_Pusat_Mediasi_Escrow_Dispute.md`

Bangun halaman dan komponen berikut di `src/pages/admin/` dan `src/components/admin/`:
1. `AdminComplianceDashboardPage.tsx`: Dasbor monitoring kepatuhan SLA seluruh advokat, antrean verifikasi dokumen KYC advokat baru, dan audit trail sistem WORM.
2. `AdminMediationCenterPage.tsx` / `EscrowDisputeResolutionTab.tsx`: Pusat resolusi sengketa konsultasi/pembayaran ber-escrow dengan panel pemeriksaan bukti log obrolan E2EE dan tombol keputusasaan mutlak (*Force Release to Advocate* atau *Full Refund to Client*).

================================================================================
MANDATORY ZERO-ERROR AUDIT GATE
================================================================================
Eksekusi dan pastikan lulus 100%: `npx oxlint && npx tsc -b && npx vite build`
```
