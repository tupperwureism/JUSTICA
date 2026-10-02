# MOCK-J-FRONTEND-STANDARD: Buku Panduan Arsitektur & Supremasi Visual Frontend (`justifiqa-frontend`)

Dokumen ini berfungsi sebagai **Single Source of Truth (SST)** fisik dan mutlak bagi seluruh agen AI (`Antigravity`, sub-agents) serta pengembang dalam membangun, memodifikasi, dan merefaktorisasi antarmuka pengguna (`justifiqa-frontend`). Sesuai aturan **Mandatory Source-of-Truth Reread Before Execution (`Zero Blind Generation Rule`)** pada `AGENTS.md`, dokumen ini **WAJIB dibaca secara fisik (`view_file`) sebelum mengeksekusi batch/sub-batch Frontend apa pun**.

---

## 1. PILAR UTAMA: SUPREMASI DESIGN SYSTEM & TOKEN CSS

Rahasia dari ketajaman visual 1:1 (*pixel-perfect fidelity*) berkas HTML prototipe master (`JUSTICA_Proto_1.1_Gateway_and_Verifier.html`) adalah penggunaan **Kelas Komponen Terisolasi & Token CSS Ekstensif**. Dalam lingkungan React + Tailwind CSS v4, aturan berikut wajib dipatuhi tanpa kompromi:

### 1.1 Larangan *Inline Arbitrary Utility* Liar
* **DILARANG KERAS** menulis nilai bracket ad-hoc secara langsung dan berulang di dalam pohon JSX (misal: `bg-[#111827] text-[#F9FAFB] max-w-[1180px] gap-[2.5rem] p-[2.5rem] rounded-[16px] border border-[#374151]`).
* Penumpukan puluhan *inline utility* dalam satu elemen menyebabkan *CSS cascade clash*, pemaksaan penyusutan (*flex-shrink collapse*), dan keruntuhan proporsi di berbagai resolusi layar browser.

### 1.2 Kewajiban Definisi Token & Kelas Abstraksi di `index.css`
Seluruh variabel warna, tipografi, bayangan (*shadow/glow*), dan kelas komponen utama **WAJIB didaftarkan pada `index.css`** (menggunakan variabel `:root` dan `@layer components` atau kelas CSS murni) sebelum dipanggil di komponen React:

```css
/* Contoh Abstraksi Komponen Wajib di index.css */
.portal-card {
  background: var(--bg-obsidian-card);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--border-glass-light);
  border-radius: 16px;
  padding: 2.5rem;
  box-shadow: var(--shadow-glass);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.portal-card:hover {
  transform: translateY(-4px);
  border-color: var(--accent-legal-gold);
  box-shadow: var(--shadow-gold-glow);
}

.trust-bar-container {
  max-w: 1180px;
  margin: 0 auto;
  padding: 1.5rem 2.5rem;
  background: rgba(17, 24, 39, 0.75);
  border: 1px solid var(--border-glass-light);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 1.5rem;
}
```

### 1.3 Mandat Proteksi Geometri Anti-Wrap & Anti-Gepeng (`Claude Rule #2`)
Untuk mencegah keruntuhan proporsi visual (*squished / wrapped / clipped elements*) seperti chip yang terpotong ke baris bawah atau tombol yang menyusut saat viewport berubah:
* Seluruh tombol CTA, chip layanan, pil spesialisasi, lencana/badge, dan item navigasi **WAJIB** dikunci geometri fisiknya dengan properti mutlak di `index.css`:
  ```css
  .chip-service, .pill-badge, .btn-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    white-space: nowrap;          /* KRITIS: dilarang melipat/wrap ke bawah */
    flex-shrink: 0;               /* KRITIS: dilarang menyusut/gepeng */
    min-height: 40px;             /* KRITIS: standar kenyamanan sentuh & proporsi */
    box-sizing: border-box;
  }
  ```
* Aturan geometri fisik ini **TIDAK BOLEH DILANGGAR** berapapun jumlah chip atau ukuran layar browser.

---

## 2. PILAR UTAMA: DEKOPEL MODULAR ATOMIK (*ATOMIC DECOUPLED ARCHITECTURE*)

### 2.1 Larangan Halaman Monolitik (*Monolithic View Ban*)
* File di bawah direktori `src/pages/` (`GatewayPage.tsx`, `ClientDashboardPage.tsx`, `AdvocateDashboardPage.tsx`) **HANYA BOLEH BERTINDAK SEBAGAI ORKESTRATOR KONTAINER (*View Controller*)**.
* **DILARANG KERAS** membuat halaman monolitik melebihi 200 baris yang mencampuradukkan *Navbar*, *Hero Search*, *Portal Cards Grid*, *Trust Bar*, *Footer*, dan *Verifier Panel* dalam satu fungsi render ad-hoc.

### 2.2 Pohon Komponen Mikro-Atomik Gateway (`src/components/gateway/`)
Setiap halaman wajib dipecah ke dalam komponen atomik terdekopel dengan spesifikasi tanggung jawab sebagai berikut:

```
src/components/gateway/
├── NavbarGateway.tsx        # Topbar sticky: Brand Logo, Subtitle, Theme Switcher, CTA Verifikasi
├── HeroSearchSection.tsx    # Headline H1 gradient, Search Input 54px, dan Quick Search Chips
├── PortalCardsGrid.tsx      # Grid kontainer 2 kolom (grid-cols-1 lg:grid-cols-2 gap-10)
├── PortalCardItem.tsx       # Kartu individual Klien & Mitra Advokat (Props: title, badge, desc, cta)
├── TrustBarSection.tsx      # Bilah jaminan keamanan (SIPP MA, Escrow ACID, Zero-Knowledge E2EE)
└── VerifierPanel.tsx        # Panel verifikasi hash SHA-256 & dropzone PDF mandiri
```

### 2.3 Aturan Isolasi & *Box Model*
* Setiap komponen wajib menjamin kemandirian strukturnya dengan mendefinisikan `w-full box-border flex-shrink-0` untuk ikon/tombol dan tidak bergantung pada *padding/margin* kontainer luar yang tidak terduga.

---

## 3. PILAR UTAMA: LAYOUT ENGINE & PRESERVASI SPASIAL 1:1

Untuk menjamin tidak ada elemen yang menyempit (*squished*), meluber, atau tergepengkan saat dirender di dalam `AppRouter` atau `BaseLayout`, standar dimensi spasial berikut wajib dipatuhi persis seperti prototipe master HTML:

| Elemen UI | Parameter Spasial / Kunci Layout | Standar Fidelity Master |
| :--- | :--- | :--- |
| **Top Navbar (`NavbarGateway`)** | `padding: 1.15rem 3rem`, `top: 0`, `z-index: 1000` | Sticky navbar dengan backdrop blur `bg-obsidian-surface/95` |
| **Main Content Container** | `max-w-[1180px] mx-auto px-[2.5rem]` | Kontainer terpusat mutlak untuk seluruh section utama |
| **Ritme Vertikal (*Section Gap*)** | `gap: 2.5rem` (`40px`) atau `my-[2.5rem]` | Jarak nafas antar-section (Hero -> Cards -> Trust Bar) |
| **Portal Cards Grid** | `grid grid-cols-1 md:grid-cols-2 gap-[2.5rem]` | 2 kartu sejajar simetris dengan tinggi setara (`h-full`) |
| **Portal Card Item** | `padding: 2.5rem`, `border-radius: 16px` | Bantalan dalam luas, tombol CTA utuh `h-[48px]` di bawah |
| **Search Bar Container** | `max-w-[800px] mx-auto`, input `h-[54px]` | Bilah pencarian lebar, tombol `CARI ADVOKAT` tidak tertekan |
| **Trust Bar Section** | `max-w-[1180px] mx-auto p-6 rounded-[12px]` | 3 kolom lencana sejajar dengan ikon `24px` tidak terkompresi |
| **Verifier Panel** | `max-w-[760px] mx-auto p-10 rounded-[16px]` | Kotak verifikasi terisolasi dengan proporsi seimbang |

---

## 4. PILAR UTAMA: ALUR KERJA EKSEKUSI SUB-BATCH DISKRIT (*NO PSEUDO-BATCHING*)

Dalam melakukan refaktorisasi atau pembangunan komponen UI, agen **WAJIB mematuhi aturan eksekusi per Sub-Batch mikro**. Satu balasan prompt **HANYA BOLEH menyelesaikan tepat 1 Sub-Batch**, mencatatnya ke Git commit, dan berhenti menunggu audit pengguna:

* **Sub-Batch 1:** Pembaruan *Design System* (`index.css`), pembuatan direktori `src/components/gateway/`, serta pemisahan komponen `NavbarGateway.tsx` & `HeroSearchSection.tsx`.
* **Sub-Batch 2:** Pembuatan komponen `PortalCardsGrid.tsx`, `PortalCardItem.tsx`, dan `TrustBarSection.tsx` yang terisolasi dengan presisi CSS 1:1.
* **Sub-Batch 3:** Pembuatan komponen `VerifierPanel.tsx` dan integrasi akhir pada `GatewayPage.tsx` sebagai orkestrator bersih.

---

## 5. PROTOKOL AUDIT FORENSIK SEBELUM SIGN-OFF

Sebelum menyatakan suatu Sub-Batch UI selesai, agen wajib memverifikasi secara forensik:
1. `tsc -b && vite build` harus lulus dengan **0 error dan `✓ built in ...ms`**.
2. `oxlint` harus lulus dengan **0 warnings dan 0 errors**.
3. Verifikasi dimensi spasial (`max-w-[1180px]`, `grid-cols-2`, `p-[2.5rem]`) harus sesuai 1:1 dengan matriks tabel di atas.
4. Git commit harus dicatat dengan pesan yang representatif (`feat(ui): Sub-Batch X.Y - ...`).
