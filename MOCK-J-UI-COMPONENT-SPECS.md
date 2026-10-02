# MOCK-J-UI-COMPONENT-SPECS.md — Kamus Pemetaan Primitives & Token UI (Shadcn v4 Contract)

> **Status Dokumen:** `SINGLE SOURCE OF TRUTH (LAPIS 2 - SHADCN V4 PRIMITIVE MAPPING CONTRACT)`  
> **Kepatuhan Sistemik:** Wajib dipatuhi 100% oleh seluruh agen AI dan *Frontend Engineer* sebelum menulis atau merefaktorisasi kode JSX / CSS pada repositori `justifiqa-frontend`. DILARANG KERAS melakukan tebak-tebakan proporsi (*arbitrary size guessing*) ataupun membuat kelas CSS *ad-hoc* manual untuk tombol, kartu, lencana, dan input.  
> **Sertifikasi Arsitektur:** Telah diselaraskan 1:1 terhadap standar *primitives* resmi Shadcn/ui v4 (`d:\justificadll\ui\apps\v4\registry\new-york-v4\ui\`) untuk mengeliminasi kesalahan "kartu kopong" (*hollow void cards*), "pil sekecil semut", dan "tombol gepeng".

---

## 1. Filosofi & Penegakan Paradigma Shadcn v4 (`Primitive Supremacy`)

Seluruh antarmuka (*User Interface*) pada platform **JUSTICA** kini berfokus pada **Primitive Supremacy & Design Token Alignment**.  
Aturan mendasar yang tidak boleh dilanggar:
1. **Zero Handmade Ad-Hoc Utilities Ban:** DILARANG KERAS membuat *utility class* custom di `index.css` (`@layer components`) atau *inline brackets* untuk tombol (`.btn-topbar-action`, `min-h-[52px]`), lencana (`.badge-portal-card`), atau kartu (`.portal-card-gateway`, `min-h-[420px] justify-between`). Seluruh elemen atomik wajib memanggil komponen dari `src/components/ui/` (`<Button>`, `<Card>`, `<Badge>`, `<Input>`).
2. **Zero Void Card Architecture (`Anti-Kopong Rule`):** DILARANG KERAS memasang `min-height` statis raksasa (seperti `420px` atau `500px`) yang dipadukan dengan `justify-between` pada komponen kartu yang isinya ringkas. Kartu di Shadcn v4 **WAJIB** dibangun menggunakan struktur hierarki alami:
   ```tsx
   <Card className="flex flex-col gap-6 p-6 h-full transition-all hover:border-primary shadow-sm">
     <CardHeader className="gap-2 p-0">
       <Badge variant="outline" className="w-fit">...</Badge>
       <CardTitle className="text-2xl font-bold">...</CardTitle>
     </CardHeader>
     <CardContent className="p-0 flex-1 text-base text-muted-foreground leading-relaxed">
       ...
     </CardContent>
     <CardFooter className="p-0 mt-auto pt-4">
       <Button className="w-full">...</Button>
     </CardFooter>
   </Card>
   ```
   Dengan struktur `gap-6 p-6 flex-1 mt-auto` ini, kartu selalu terlihat padat, proporsional, dan tidak memiliki ruang hampa gelap (*dark void*) di tengah, berapapun resolusi layar atau skala zoom pengguna.
3. **Box-Model & Overflow Protection:** Setiap *primitive* resmi dari Shadcn v4 (`Button`, `Badge`, `Card`) secara bawaan telah menerapkan `inline-flex shrink-0 items-center justify-center whitespace-nowrap box-border overflow-hidden`. AI dilarang menimpa properti proteksi ini dengan *style ad-hoc*.

---

## 2. Katalog Pemetaan Primitives & Token Varian (Shadcn v4 Mapping)

### 2.1. Topbar & Action Buttons (`NavbarGateway`)
* **Primitive Resmi:** `<Button>` dari `src/components/ui/button`
* **Pemetaan Varian & Ukuran:**
  - **Tombol Toggle Tema:** `<Button variant="outline" size="sm" className="gap-2 font-semibold">`
  - **Tombol Verifikasi SHA-256:** `<Button variant="default" size="sm" className="gap-2 font-bold bg-[#8B5CF6] hover:bg-[#7C3AED] text-white">`
* **Kontainer Topbar:** `topbar-gateway flex items-center justify-between px-6 sm:px-12 py-3.5 bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50`

---

### 2.2. Interactive Pills / Chips (`HeroSearchSection` - Layanan Populer)
* **Primitive Resmi:** `<Badge>` atau `<Button>` dari `src/components/ui/`
* **Pemetaan Varian & Ukuran:**
  - Gunakan `<Button variant="outline" size="sm" className="rounded-full px-4 py-1.5 text-sm font-semibold gap-2 border-border hover:border-primary hover:text-primary transition-all">`
  - *DILARANG* menggunakan `text-xs py-1` yang membuat tombol sekecil semut dan sulit diklik.

---

### 2.3. Hero Search Input & Submit Button (`HeroSearchSection`)
* **Primitive Resmi:** `<Input>` dan `<Button>` dari `src/components/ui/`
* **Pemetaan Struktur:**
  - Kontainer Wrapper: `<div className="w-full max-w-[880px] mx-auto flex flex-col sm:flex-row items-center gap-3 p-2 rounded-2xl border-2 border-border bg-card shadow-lg">`
  - Input Field: `<Input type="text" placeholder="..." className="h-12 border-none bg-transparent pl-12 pr-4 text-base focus-visible:ring-0 shadow-none" />`
  - Tombol Cari: `<Button variant="default" size="lg" className="h-12 px-8 rounded-xl font-bold text-base bg-blue-600 hover:bg-blue-700 text-white shadow-md">CARI ADVOKAT →</Button>`

---

### 2.4. Card Badges & Status Tags (`PortalCardItem` / E2EE / Escrow)
* **Primitive Resmi:** `<Badge>` dari `src/components/ui/badge`
* **Pemetaan Varian & Ukuran:**
  - `<Badge variant="outline" className="rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider border-primary/40 bg-primary/10 text-primary">`
  - Ikon dan teks berada dalam proporsi sejajar berkat bawaan `inline-flex shrink-0 items-center gap-1.5` dari `badgeVariants`.

---

### 2.5. Portal Card Container & CTA Button (`PortalCardItem`)
* **Primitive Resmi:** `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`, `<CardFooter>`, dan `<Button>`
* **Pemetaan Anti-Kopong (`Zero Void Rule`):**
  - **Kontainer Utama:** `<Card className="flex flex-col gap-6 p-6 sm:p-8 rounded-2xl border border-border bg-card/90 backdrop-blur-sm shadow-md hover:shadow-xl hover:border-primary transition-all duration-300 h-full relative overflow-hidden">`
  - **Pita Warna Atas (Top Stripe):** `<div className="absolute top-0 left-0 right-0 h-[5px] bg-gradient-to-r from-amber-500 to-amber-700" />`
  - **Header & Judul:** `<CardHeader className="gap-3 p-0">` dengan `<CardTitle className="text-2xl sm:text-[1.65rem] font-extrabold font-heading">`
  - **Deskripsi:** `<CardContent className="p-0 flex-1 text-base text-muted-foreground leading-relaxed">`
  - **Tombol Masuk/Daftar (CTA):** `<CardFooter className="p-0 mt-auto pt-4">` berisi `<Button asChild variant="default" size="lg" className="w-full h-12 rounded-xl font-bold text-base shadow-sm"><Link to={to}>...</Link></Button>`

---

### 2.6. Trust Bar & Advantage Strip (`TrustBarSection`)
* **Pemetaan Kontainer:**
  - `<div className="w-full max-w-[1180px] mx-auto p-6 rounded-xl border border-border bg-card/80 backdrop-blur-md flex flex-wrap items-center justify-around gap-6 shadow-sm">`
  - Item jaminan: `<div className="flex items-center gap-3 font-bold text-sm sm:text-base text-foreground">`

---

## 3. Matriks Pemetaan Sistem Token Semantik (`index.css` Theme Tokens)

Dalam paradigma Shadcn v4, seluruh warna **WAJIB** dikendalikan oleh *Design Tokens* variabel CSS semantik di `index.css` (`:root` dan `.dark`), yang dipetakan ke palet korporat **JUSTICA** (*Obsidian Dark, Legal Gold, Cyber Blue*):

| Token Semantik Shadcn | Nilai di Tema Dark (`.dark` / default JUSTICA) | Nilai di Tema Light (`:root`) | Peran & Penggunaan |
| :--- | :--- | :--- | :--- |
| `--background` | `#090D16` (Obsidian Deep) | `#F8FAFC` (Slate Light) | Latar belakang utama seluruh halaman (`body`) |
| `--foreground` | `#F8FAFC` | `#0F172A` | Warna teks primer (`h1`, `h2`, teks utama) |
| `--card` | `#0F172A` (Obsidian Surface) | `#FFFFFF` | Latar belakang kartu (`<Card>`, `<Input>` wrapper) |
| `--card-foreground` | `#F8FAFC` | `#0F172A` | Warna teks di dalam kartu |
| `--primary` | `#D4AF37` (Legal Gold) | `#C59B27` | Warna aksen utama, hover border, lencana keadilan |
| `--primary-foreground`| `#000000` | `#FFFFFF` | Teks di atas tombol primer |
| `--secondary` | `#1E293B` | `#F1F5F9` | Latar belakang tombol/elemen sekunder |
| `--muted` | `#1E293B` | `#F1F5F9` | Latar belakang seksi non-aktif / border ringan |
| `--muted-foreground` | `#94A3B8` (Slate 400) | `#64748B` | Teks deskripsi kartu, subjudul, placeholder |
| `--border` | `rgba(255, 255, 255, 0.12)` | `#E2E8F0` | Garis batas (*border*) seluruh kartu, input, topbar |
| `--ring` | `#D4AF37` | `#C59B27` | Garis fokus (*focus ring*) saat elemen interaktif aktif |

---

## 4. SOP Wajib Sebelum Koding UI (*Zero Blind & Zero Ad-Hoc Rule*)
1. **Baca Kontrak Pemetaan Ini (`view_file MOCK-J-UI-COMPONENT-SPECS.md`):** Pastikan komponen yang akan dibuat telah menggunakan *primitives* resmi dari `src/components/ui/`.
2. **Larangan Rakitan Ad-Hoc:** Jangan pernah membuat class CSS baru di `index.css` atau *inline style* tebakan untuk tombol dan kartu.
3. **Verifikasi Terminal (`tsc -b && vite build` & `oxlint`):** Pastikan kompilasi bersih dari error dan warning setelah pemanggilan *primitives* Shadcn v4.
