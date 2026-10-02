# EXECUTIVE MANDATE: JUSTIFIQA LEGALTECH SUPERAPP FRONTEND ENGINEERING (CLEAN OVERHAUL)

Kamu ditugaskan sebagai **Principal Frontend UI Engineer & Architect** untuk mewujudkan antarmuka portal digital **Justifiqa SuperApp** (Platform Hukum Digital Indonesia berarsitektur *Boundary-Control-Entity* / BCE) di dalam direktori proyek `justica-frontend-claude` (atau `justifiqa-frontend`).

Tugas utamamu adalah merombak total dan membangun antarmuka yang **Sangat Mewah (*State-of-the-Art Luxury UI*)**, **Modern**, **Presisi 1:1 terhadap Spesifikasi**, **100% Responsif** (tanpa cacat wrapping atau overflow clipping dari mobile hingga ultra-wide monitor), serta **Lulus Audit Zero-Error (`oxlint && tsc -b && vite build`)**.

---

## SECTION 1: ATURAN MUTLAK ARSITEKTUR & GEOMETRI VISUAL (CLAUDE'S 4 RULES SUPREMACY)

Kamu **WAJIB** mematuhi 4 Aturan Besi berikut tanpa pengecualian:

### 1. DESIGN SYSTEM FIRST MANDATE (*Zero Ad-Hoc JSX Utility Stacking Ban*)
- **DILARANG KERAS** menumpuk puluhan *ad-hoc utility classes* secara liar di dalam JSX (misal: `<div className="flex flex-col md:flex-row items-center justify-between p-4 md:p-8 bg-[#111827] border-b...">`).
- Sebelum menulis atau memodifikasi komponen JSX, kamu **WAJIB mendefinisikan atau memastikan kelas komponen CSS terisolasi di `src/index.css` (`@layer components`) terlebih dahulu**.
- JSX hanya boleh bertindak sebagai konsumen kelas desain sistem yang sudah matang (`<Card className="portal-card-shell">`, `<button className="chip-service-item">`).
- **Palet Warna Mutlak**: Gunakan variabel tema CSS semantik resmi (`--background: Obsidian Dark`, `--primary: Legal Gold / Cyber Blue`, `--card`, `--border`, `--muted-foreground`). Dilarang keras menggunakan warna statis hardcoded seperti `bg-[#111827]` atau `text-white`.

### 2. ANTI-WRAP & ANTI-GEPENG GEOMETRY PROTECTION (*Strict Atomic Element Lockdown*)
- Seluruh elemen interaktif dan informatif atomik (tombol CTA, chip layanan, pil spesialisasi, lencana/badge status, dan item topbar navigasi) **WAJIB DIKUNCI GEOMETRI FISIKNYA** dengan properti CSS mutlak di `index.css`:
  ```css
  white-space: nowrap !important;
  flex-shrink: 0 !important;
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  ```
- Aturan ini wajib diterapkan untuk mencegah keruntuhan proporsi (tombol terhiris, badge terlipat, teks terpotong) pada resolusi atau tingkat zoom berapapun.

### 3. STRICT ATOMIC ARCHITECTURE & ZERO VOID CARD (*Primitive & Anti-Kopong Rule*)
- **Satu File = Satu Komponen = Satu Tanggung Jawab Murni**. Halaman utama (`*Page.tsx` di `src/pages/`) HANYA bertindak sebagai orkestrator kontainer (*View Controller*). Seluruh elemen UI wajib dipecah menjadi mikro-komponen atomik terisolasi di `src/components/client/...` atau `src/components/advocate/...` yang tidak boleh melebihi 100 baris kode bersih per file.
- **Shadcn v4 Primitive Supremacy**: Komponen atomik wajib mengonsumsi komponen dasar dari `src/components/ui/card.tsx`, `button.tsx`, dan `badge.tsx`. Kartu WAJIB menerapkan hierarki natural tanpa `min-height` statis raksasa agar tidak pernah ada ruang hampa gelap (*dark void / kopong*) di tengah atau bawah kartu:
  ```tsx
  <Card className="portal-card-shell flex flex-col justify-between h-full relative overflow-hidden">
    <CardHeader className="space-y-2 pb-4 border-b border-border/60 flex-shrink-0">...</CardHeader>
    <CardContent className="flex-1 py-4 leading-relaxed text-sm md:text-base">...</CardContent>
    <CardFooter className="pt-4 border-t border-border/40 flex-shrink-0 flex items-center justify-end gap-3">...</CardFooter>
  </Card>
  ```
- **Zero Box-in-Box Ban**: Dilarang membungkus tabel dalam bingkai berlapis-lapis (*Russian Nesting Doll*). Tabel hanya boleh berada di dalam **SATU `<Card>` utama** dengan satu `<div className="overflow-x-auto w-full">` pembungkus tabel.

### 4. ZERO HORIZONTAL CLIPPING & FULL-BLEED FLUID LAYOUT
- Pembungkus utama halaman (`BaseLayout.tsx` & `Navbar.tsx`) wajib memiliki batas maksimal lebar yang selaras (`max-w-[1600px] mx-auto w-full px-4 sm:px-8 md:px-10`).
- Pada tabel riwayat dan konsultasi, judul kolom dan sel paling kanan (`AKSI` / `UNDUHAN WORM`) wajib ditetapkan secara eksplisit dengan `pr-6 text-right whitespace-nowrap font-bold` agar tombol biru `[Buka Ruang Obrolan]` atau `[Unduh Dokumen PDF]` memiliki ruang napas natural dan tidak pernah terpotong huruf atau ujungnya.

---

## SECTION 2: RUANG LINGKUP & DETAIL EKSEKUSI REFAKTORISASI

Eksekusi pembongkaran dan penataan ulang antarmuka secara presisi pada file-file berikut:

### 1. `src/index.css`
- Bersihkan dan hapus seluruh kelas wrapper rakitan ad-hoc yang merusak proporsi (`.client-banner-safe-wrapper`, `.client-card-safe-wrapper`, `.client-table-safe-wrapper`).
- Definisikan kelas sistem desain atomik yang bersih dan terstandarisasi di `@layer components` untuk kartu (`.portal-card-shell`), navigasi (`.topbar-nav-shell`), dan tombol/chip (`.chip-service-item`, `.client-tab-btn`) sesuai filosofi Aturan #1 & #2.

### 2. `src/components/Navbar.tsx` & `src/components/BaseLayout.tsx`
- Pastikan `Navbar` dan `BaseLayout` memiliki `max-w-[1600px] mx-auto px-4 sm:px-8 md:px-10` sehingga seluruh konten sejajar sempurna.
- Tata navigasi atas (`Brand & Logo`, `PERAN: Klien | Advokat | AI Legal`, dan badge `Budi Santoso FIDO2 Verified`) agar padat, elegan, dan tidak bertabrakan dengan sub-navbar di bawahnya.

### 3. `src/components/client/ClientHeaderAndTabs.tsx`
- Sederhanakan menjadi bilah sub-header bersih yang menyajikan tombol `<- Gerbang Utama` di kiri dan *Tab Switcher* (`[Dasbor Saya & Riwayat]`, `[Cari & Katalog Advokat]`, `[IRAC Bedah Kasus]`) di kanan.
- Bungkus tab switcher dalam kontainer `flex flex-wrap sm:flex-nowrap items-center gap-1.5 rounded-2xl bg-secondary/80 p-1.5 border border-border shadow-inner max-w-full overflow-x-auto` agar mendistribusikan proporsi secara seimbang dan tidak menabrak batas kanan layar.

### 4. `src/components/client/ClientGreetingCard.tsx`
- Gunakan struktur `<Card>` dari Shadcn v4 dengan layout `flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 sm:p-8`.
- Bagian kiri (`CardHeader p-0 flex-1 space-y-3`) memuat avatar, sapaan `HALO, {session.userName}`, label peran dinamis, serta teks deskripsi dengan `max-w-3xl` yang mengalir rapi tanpa rongga kosong (*zero hollow void*).
- Bagian kanan (`CardFooter p-0 flex flex-wrap sm:flex-nowrap items-center gap-3 flex-shrink-0`) memuat tombol `[+ KONSULTASI BARU (CARI ADVOKAT)]` dan `[Layanan Pro Bono Gratis]` yang terkunci rapi.

### 5. `src/components/client/ClientOverviewTables.tsx`
- Gunakan arsitektur tabel datar tanpa bingkai berlapis (`Zero Box-in-Box`).
- Tabel 1 (`KONSULTASI HUKUM AKTIF`) dan Tabel 2 (`RIWAYAT DOKUMEN & KONSULTASI SELESAI WORM IMMUTABLE`) masing-masing dibungkus oleh tepat satu `<Card className="flex flex-col gap-5 sm:gap-6 p-6 sm:p-8 rounded-3xl border border-border bg-card shadow-xl w-full">`.
- Pastikan seluruh `th` dan `td` kolom `AKSI` / `UNDUHAN WORM` di kanan memiliki `pr-6 text-right whitespace-nowrap font-bold` dan tombol CTA utuh tanpa terhiris.

### 6. `src/components/client/AdvocateCatalogTab.tsx` & `ClientIRACBedahKasusTab.tsx`
- Pastikan kedua tab menggunakan kelas desain sistem dari `index.css` dengan geometri kartu dan tombol filter (`client-filter-pill`) yang anti-wrap dan mewah.

---

## SECTION 3: MANDATORY ZERO-ERROR FORENSIC AUDIT GATE

Setelah seluruh modifikasi dan penulisan kode selesai, kamu **WAJIB** mengeksekusi perintah terminal berikut secara langsung untuk memverifikasi integritas kompilasi dan linter:

```bash
npx oxlint && npx tsc -b && npx vite build
```

**SYARAT KELULUSAN MUTLAK**:
1. `Found 0 warnings and 0 errors` pada Oxlint.
2. `0 error` TypeScript pada `tsc -b`.
3. `vite build` berhasil membuat *production bundle* tanpa cacat.

Jika terdapat error atau peringatan sekecil apapun, kamu wajib mendiagnosis dan memperbaikinya saat itu juga sebelum memberikan laporan penyelesaian akhir! Mulailah eksekusi sekarang dengan ketelitian tingkat tinggi.
