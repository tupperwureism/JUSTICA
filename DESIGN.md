# DESIGN.md — Design System Reference (Justifiqa & Qualifa)

> Dokumen ini merangkum bahasa desain yang sudah dipakai di mockup HTML existing kedua aplikasi standalone (Justifiqa — Hukum, Qualifa — Psikologi), supaya bisa dipakai sebagai input/prompt-context untuk Google Stitch saat membuat mockup baru yang konsisten secara visual dengan yang sudah ada.

---

## 1. Prinsip Desain

- **Dark-mode-first, glassmorphism modern.** Semua layar memakai latar gelap dengan panel "kaca" tembus pandang (`backdrop-filter: blur`), bukan flat/light UI korporat biasa.
- **Siloed by color, unified by structure.** Justifiqa dan Qualifa memakai kerangka layout, tipografi, dan komponen yang identik — yang membedakan hanya *accent color* dan sedikit ikonografi. Ini penting agar kedua app terasa dari keluarga produk yang sama meski 100% terpisah secara arsitektur.
- **Kepercayaan & kerahasiaan sebagai tema visual.** Karena kedua domain sensitif (hukum & kesehatan mental), UI banyak memakai badge terverifikasi, watermark "privileged/confidential", indikator enkripsi, dan warna hijau/emas untuk status "aman/sah".
- **Data-dense tapi tidak sesak.** Dashboard pakai card-based layout dengan spacing besar (1.5–2.5rem), bukan tabel padat ala enterprise lama.

---

## 2. Brand A — Justifiqa (Domain Hukum)

**Mood**: kewibawaan hukum, kerahasiaan advokat-klien, kemewahan legal/notaris (bukan startup ceria).

### Warna
| Token | Hex | Pemakaian |
|---|---|---|
| Background base | `#080c14` / `#020617` | latar utama seluruh halaman |
| Sidebar / panel gelap | `#0d1322` | sidebar nav |
| Glass surface | `rgba(255,255,255,0.03)` bg, `rgba(255,255,255,0.08)` border | card, modal |
| **Primary (Gold/Amber — identitas Justifiqa)** | `#d97706` → `#eab308` → `#facc15` (terang) / `#b45309` (gelap) | tombol utama, ikon, highlight advokat, badge "Privileged" |
| Secondary (Cyan/Sky — untuk aksi/link/info) | `#0ea5e9` / `#38bdf8` | tombol sekunder, badge info, link |
| Success | `#10b981` / `#34d399` | status aktif, terverifikasi, pembayaran sukses |
| Danger | `#ef4444` / `#f87171` | suspend, tolak, error, akhiri sesi |
| Warning | `#f59e0b` / `#fbbf24` | pending, antrean, buffer |
| Text primary | `#f8fafc` | teks utama di atas dark bg |
| Text muted | `#94a3b8` / `#64748b` | deskripsi, label sekunder |

### Tipografi
- **Font utama**: `Outfit` (weight 300–800)
- **Font monospace** (untuk hash, kode referensi, angka teknis): `Roboto Mono` 500
- Judul halaman: 1.8rem, weight 700
- Card title: 1.2–1.25rem, weight 600–700
- Body/label: 0.85–0.95rem

### Elemen Khas
- **Gold banner "PRIVILEGED AND CONFIDENTIAL"** di setiap ruang kerja hukum — border 2px emas, gradient gelap-emas, ikon 🛡️/⚖️.
- **Badge WORM/hash**: font mono, background gelap pekat, teks hijau terang (`#00FF66` atau `#34d399`), dipakai untuk menandai audit trail SHA-256.
- **e-Meterai / stamping widget**: kartu emas dengan ikon bendera/stempel, menunjukkan kuota & status "LOCKED"/"UNLOCKED" (download gate).
- Ikon: Phosphor Icons (`ph-fill`, `ph-bold`), tema timbangan (⚖️), gedung (🏛️), dokumen (📜/📑).

---

## 3. Brand B — Qualifa (Domain Psikologi)

**Mood**: tenang, empatik, klinis tapi hangat, dengan jalur darurat yang tegas untuk krisis.

### Warna
| Token | Hex | Pemakaian |
|---|---|---|
| Background base | `#080c14` / `#020617` / `#030712` | latar utama |
| Sidebar / panel gelap | `#0d1322` | sidebar nav |
| Glass surface | sama seperti Justifiqa | card, modal |
| **Primary (Purple/Violet — identitas Qualifa)** | `#a855f7` → `#c084fc` (terang) / `#7e22ce` / `#9333ea` (gelap) | tombol utama, badge, aksen psikolog |
| Secondary (Emerald — untuk wellness/CDN/audio) | `#10b981` / `#34d399` / `#059669` | audio meditasi, status online, kepatuhan |
| Crisis/Alert (Rose-Red — krisis 119) | `#ef4444` / `#e11d48` / `#f87171` | tombol darurat, modal crisis protocol, DASS-21 severe |
| Warning | `#f59e0b` / `#fbbf24` | buffer rule, jadwal pending |
| Text primary/muted | sama seperti Justifiqa | — |

### Tipografi
- Sama seperti Justifiqa: `Outfit` + `Roboto Mono` untuk data teknis (SIPP number, hash).

### Elemen Khas
- **Modal Crisis 119**: border merah tebal (3px), countdown timer wajib 10 detik sebelum tombol tutup aktif, tone visual mendesak tapi tidak grafis/menakutkan.
- **Proactive Wellness Banner**: card merah/oranye lembut untuk alert mood 5 hari beruntun sedih/cemas, nada bahasa suportif bukan menghakimi.
- **Mood Tracker widget**: grid tombol emoji besar (5 pilihan emosi), highlight state jelas saat dipilih.
- **DAP Note / rekam medis**: card hijau (privileged clinical record), field terstruktur Data–Assessment–Plan.
- Ikon: 🧠, 🧘, 🌱, dominan emoji-forward untuk kehangatan (berbeda dari Justifiqa yang lebih formal-simbolis).

---

## 4. Komponen Bersama (Shared Component Language)

Berlaku untuk kedua brand, hanya beda warna aksen sesuai token di atas.

### Layout
- **Sidebar tetap** (`width: 260–290px`, `background: #0d1322`) di kiri: logo/brand, profil ringkas, toggle status online/offline, menu navigasi ikon+label.
- **Main content** scrollable, padding besar (`2.5rem 3rem`), topbar berisi judul halaman + deskripsi + elemen kanan (profil user / badge status).

### Card
- `background: rgba(17,24,39,0.7)`, `border: 1px solid rgba(255,255,255,0.08)`, `border-radius: 16px`, `padding: 1.8rem`, `backdrop-filter: blur(12px)`, shadow lembut.
- Card title selalu flex `justify-content: space-between` — judul di kiri, badge status di kanan.

### Badge
- Pill shape (`border-radius: 20px`), padding `4–5px 10–12px`, kombinasi warna transparan 15% + border 30% + teks warna solid. Varian: success (hijau), warning (kuning), danger (merah), info (biru/ungu sesuai brand), gold/purple (brand-specific).

### Tombol (Button)
- Solid gradient untuk aksi utama (`linear-gradient(135deg, warna-terang, warna-gelap)`), `border-radius: 8–12px`, shadow warna sesuai.
- Outline/transparent untuk aksi sekunder (`border: 1px solid rgba(255,255,255,0.15)`).
- Ukuran: padding `0.6–1.2rem` vertikal, font-weight 600–700.

### Modal
- Overlay: `rgba(0,0,0,0.85)`, `backdrop-filter: blur(8–12px)`.
- Box: `background: #0f172a` atau `rgba(17,24,39,0.95)`, border warna aksen 1–3px, `border-radius: 16–20px`, shadow besar.

### Form Input
- `background: #080c14` atau `rgba(0,0,0,0.25–0.3)`, `border: 1px solid rgba(255,255,255,0.15)`, `border-radius: 8–12px`, teks putih, focus state border warna brand + glow shadow.

### Chat / Ruang Konsultasi E2EE
- Sidebar kiri kecil: timer countdown besar (monospace, warna aksen), avatar bulat, badge status online.
- Bubble pesan: kiri (partner) abu transparan, kanan (user) gradient warna brand.
- Header selalu ada badge enkripsi ("PRIVILEGED AND CONFIDENTIAL" / "Zero-Knowledge E2EE Protected").

### Ikonografi
- Library: **Phosphor Icons** (`unpkg.com/@phosphor-icons/web`), gaya `fill` untuk ikon solid, `bold` untuk aksen garis tebal.
- Emoji dipakai bebas sebagai aksen visual cepat (⚖️🛡️📜 untuk Justifiqa; 🧠🌱🧘🚨 untuk Qualifa) — konsisten dengan gaya mockup existing, boleh dipertahankan di Stitch.

---

## 5. Tipografi Global

```
font-family utama : 'Outfit', sans-serif  (weight 300–800)
font-family mono   : 'Roboto Mono', monospace (weight 500) — untuk hash, nomor lisensi, kode referensi, timer
```
Import via Google Fonts:
```
https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Roboto+Mono:wght@500&display=swap
```

---

## 6. Radius, Spacing, Shadow

- Border radius: kecil `8px` (input/badge), sedang `12–16px` (card/tombol besar), besar `20–24px` (modal/container utama).
- Spacing dasar: kelipatan `0.4rem`–`0.5rem`; jarak antar card `1.5–2rem`; padding card `1.8rem`.
- Shadow: selalu lembut & berwarna sesuai aksen, contoh `0 4px 12px rgba(warna-brand, 0.3)` untuk tombol, `0 20px 50px rgba(0,0,0,0.5)` untuk modal/container besar.

---

## 7. Aturan Konten & Nada (untuk teks di mockup)

- Bahasa Indonesia formal-profesional untuk domain hukum (Justifiqa): istilah legal baku (Advokat, Kredensial, Berkas Perkara, e-Meterai).
- Bahasa Indonesia hangat-suportif untuk domain psikologi (Qualifa), terutama di elemen wellness/crisis: hindari nada menghakimi, selalu beri jalur bantuan yang jelas.
- Label compliance/regulasi (UU PDP, UU Advokat, HIMPSI, WORM, AES-256, e-Meterai Peruri) boleh muncul eksplisit di UI sebagai badge kepercayaan — ini ciri khas kedua produk.

---

## 8. Cara Pakai di Stitch

Saat membuat prompt di Google Stitch, sertakan potongan relevan dari file ini, misalnya:

> "Buat [nama layar] untuk aplikasi Justifiqa, dark theme, primary color gold/amber (#d97706–#facc15), font Outfit + Roboto Mono untuk data teknis, gaya glassmorphism dengan card `rgba(17,24,39,0.7)` blur, sidebar kiri 260px, badge 'PRIVILEGED AND CONFIDENTIAL' bila menyangkut komunikasi klien-advokat."

atau untuk Qualifa:

> "Buat [nama layar] untuk aplikasi Qualifa, dark theme, primary color purple (#a855f7–#c084fc), aksen emerald untuk wellness, red/rose untuk elemen krisis (119), font Outfit + Roboto Mono, gaya glassmorphism sama seperti Justifiqa tapi warna berbeda."

Selalu tegaskan ke Stitch: **kedua app harus terasa satu keluarga produk (layout, spacing, tipografi, komponen identik) tapi 100% terpisah secara branding warna dan tanpa elemen silang domain.**