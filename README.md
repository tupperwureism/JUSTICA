# Justifiqa (f.k.a. Justica)

Platform LegalTech enterprise dan Notary Workspace terintegrasi dengan jaminan kepatuhan regulasi hukum Indonesia, audit trail nir-ubah (WORM vault), isolasi multi-tenant PostgreSQL Row Level Security (RLS), dan transaksi escrow bergaransi ACID mutex.

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8.svg)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_15-3ecf8e.svg)](https://supabase.com/)
[![Deno](https://img.shields.io/badge/Deno_Runtime-Edge_Functions-white.svg)](https://deno.land/)
[![Tests](https://img.shields.io/badge/Tests-129%2F129_Passing-brightgreen.svg)]()
[![Status](https://img.shields.io/badge/Status-ACCEPTED__LOCAL-success.svg)]()
[![Architect & Creator](https://img.shields.io/badge/Architect%20%26%20Creator-Shalom%20Kurniawan-black.svg)](https://github.com/tupperwureism)

---

## Daftar Isi
1. [Ringkasan Proyek](#ringkasan-proyek)
2. [Lingkup Produk & Batasan Arsitektur](#lingkup-produk--batasan-arsitektur)
3. [Arsitektur Sistem](#arsitektur-sistem)
4. [Tech Stack](#tech-stack)
5. [Panduan Instalasi dan Menjalankan Proyek](#panduan-instalasi-dan-menjalankan-proyek)
6. [Pengujian dan Verifikasi Mutu](#pengujian-dan-verifikasi-mutu)
7. [Status Pengembangan](#status-pengembangan)
8. [Creator & Lead Architect](#creator--lead-architect)

---

## Ringkasan Proyek

Justifiqa adalah platform sistem operasi hukum yang menghubungkan Klien Korporat/Individu, Advokat Berlisensi (PERADI), dan Notaris/PPAT. 

Fungsi utama sistem mencakup:
- **Corporate Concierge:** Pengadaan akta pendirian, perizinan OSS-RBA, dan verifikasi Beneficial Ownership (BO).
- **Escrow Settlement:** Rekening penampungan dana aman berbasis penguncian baris atomik (Row-Level Mutex) untuk mencegah double-spending.
- **Notary Workspace:** Pemeriksaan Customer Due Diligence (CDD), validasi dokumen bukti korporasi, dan audit kesiapan pelaporan Kemenkumham AHU.
- **WORM Audit Ledger:** Pencatatan seluruh transaksi dan mutasi status pada tabel Write-Once-Read-Many yang kedap manipulasi.

---

## Lingkup Produk & Batasan Arsitektur

Berdasarkan keputusan arsitektur kanonik [ADR-002](MarkDown/ADR/ADR-002-justifiqa-active-product-scope.md):
- **Justifiqa (Active Scope):** Seluruh pengembangan aktif, pipeline CI/CD, migration schema, dan pengujian difokuskan 100% pada modul LegalTech Justifiqa.
- **Qualifa (Archived / Out of Scope):** Modul layanan kesehatan mental/psikologi dipisahkan dari roadmap aktif karena perbedaan regulasi (UU Advokat vs Kode Etik Psikologi/Kemenkes). Berkas terkait disimpan di repositori semata-mata sebagai arsip riset historis berstatus `OUT_OF_SCOPE`.

---

## Arsitektur Sistem

Sistem menerapkan empat prinsip rekayasa utama:
1. **Boundary-Control-Entity (BCE):** Antarmuka klien (Boundary) tidak mengeksekusi mutasi tabel secara langsung. Seluruh alur divalidasi oleh Edge Functions atau Stored Procedures (Control) sebelum menyentuh data (Entity).
2. **ACID Row Mutex:** Konfirmasi pembayaran escrow menggunakan `SELECT ... FOR UPDATE` dan Idempotency Key (SHA-256) guna mencegah race condition.
3. **WORM Vault:** Log audit dan bukti transaksi dilindungi trigger basis data yang menolak operasi `UPDATE` dan `DELETE`.
4. **PostgreSQL RLS:** Pemisahan akses multi-tenant ditegakkan di level basis data menggunakan GoTrue Auth Context dan role-based policy (`corporate_client`, `notary`, `advocate`, `system_admin`).

---

## Tech Stack

| Lapisan | Teknologi | Peran |
|---|---|---|
| Frontend | React 19.2 + TypeScript 6.0 | Single Page Application |
| Build Tool | Vite 8.1 + Oxlint | Bundler dan fast static analyzer |
| Styling | Tailwind CSS v4 + Radix UI | Utility styling dan komponen aksesibel |
| Database & Auth | Supabase (PostgreSQL 15+) | PostgREST, RLS, Auth GoTrue, Realtime Engine |
| Serverless Logic | Deno Edge Functions | Webhook handler, background worker, dan intake controller |
| Test Runner | Node.js Native Runner (`node --test`) | Behavioral test suite tanpa dependensi testing eksternal |

---

## Panduan Instalasi dan Menjalankan Proyek

Bagian ini memuat panduan lengkap penyiapan environment dari nol, mencakup dependensi sistem, database kontainer lokal, konfigurasi environment, hingga server frontend.

### 1. Prasyarat Sistem

Pastikan perangkat Anda memenuhi spesifikasi berikut:
- **Sistem Operasi:** Windows 10/11 (dengan WSL2 Ubuntu 22.04 LTS terpasang) atau Linux (Ubuntu 22.04+).
- **Node.js:** Versi >= 20.18.0 LTS (Direkomendasikan Node.js v22 LTS atau v24).
- **Docker Engine:** Docker Engine CE atau Docker Desktop dengan integrasi WSL2 aktif.
- **Git:** Git CLI versi 2.40+.

#### Instalasi Node.js (Jika Belum Terpasang)
- **Windows:** Unduh installer resmi LTS dari [nodejs.org](https://nodejs.org/), atau gunakan package manager:
  ```powershell
  winget install OpenJS.NodeJS.LTS
  ```
- **Ubuntu / WSL2 (menggunakan NVM):**
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  nvm install 22
  nvm use 22
  ```

#### Instalasi Docker di Ubuntu WSL2 (Jika Menggunakan WSL2 Tanpa Docker Desktop)
Jika menggunakan Ubuntu di WSL2 tanpa Docker Desktop:
```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Masukkan user ke grup docker agar tidak memerlukan sudo setiap perintah:
sudo usermod -aG docker $USER
```
Nyalakan service Docker di WSL2:
```bash
sudo service docker start
sudo service docker status
```

---

### 2. Setup dan Menjalankan Backend Supabase (Lokal)

Stack backend Supabase dijalankan di lingkungan Linux/WSL2 yang memiliki Docker aktif.

#### Langkah A: Masuk ke WSL2 dan Folder Proyek
```bash
wsl -d Ubuntu-22.04
cd /mnt/d/justificadll
```
*(Sesuaikan path `/mnt/d/justificadll` dengan lokasi direktori proyek Anda).*

#### Langkah B: Jalankan Supabase Local Stack
```bash
npx supabase start
```
*Catatan: Eksekusi pertama kali akan mengunduh image Docker resmi Supabase (PostgreSQL 15, PostgREST, GoTrue Auth, Storage, Realtime, dan Inbucket). Proses ini memerlukan koneksi internet stabil.*

Setelah berhasil berjalan, terminal akan menampilkan kredensial lokal:
```text
Started supabase local development setup.

         API URL: http://127.0.0.1:54321
          DB URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
      Studio URL: http://127.0.0.1:54323
    Inbucket URL: http://127.0.0.1:54324
        anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
Simpan nilai `API URL` dan `anon key` untuk konfigurasi frontend pada langkah berikutnya.

Semua migrasi basis data (32 berkas SQL) otomatis dieksekusi secara berurutan oleh Supabase CLI saat container dinyalakan.

Untuk mereset basis data ke kondisi awal kapan saja:
```bash
npx supabase db reset
```

Untuk menghentikan kontainer Supabase:
```bash
npx supabase stop
```

---

### 3. Konfigurasi Environment Frontend

Buka terminal baru (PowerShell di Windows atau terminal Linux), arahkan ke subdirektori frontend:

```powershell
cd justifiqa-frontend
```

Buat berkas `.env.local` di dalam folder `justifiqa-frontend/` dengan konten berikut:

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ganti_dengan_anon_key_dari_supabase_start
```

---

### 4. Instalasi Dependensi dan Menjalankan Frontend

Masih di dalam direktori `justifiqa-frontend`:

#### Langkah A: Pasang Paket Dependensi
```powershell
npm install
```

#### Langkah B: Jalankan Development Server
```powershell
npm run dev
```

Server lokal Vite akan berjalan dan dapat diakses melalui browser:
```text
  VITE v8.1.1  ready in 240 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Akses `http://localhost:5173/` di browser web Anda.

---

## Pengujian dan Verifikasi Mutu

Repositori ini menerapkan suite verifikasi native Node.js tanpa framework pengujian eksternal:

```powershell
# Jalankan seluruh suite tes behavioral Phase 2 (129 assertions lulus):
npm --prefix justifiqa-frontend run test:phase2

# Jalankan typechecker pada suite pengujian:
npm --prefix justifiqa-frontend run typecheck:phase2-tests

# Jalankan linter Oxlint pada kode sumber frontend:
npm --prefix justifiqa-frontend run lint

# Jalankan verifikasi integritas peta simbol TypeScript dan migrasi SQL:
node Tools/generate_symbol_map.mjs --check
```

---

## Status Pengembangan

- **Status Verifikasi Kanonik:** `ACCEPTED_LOCAL` (Seluruh kontrak model, RPC, dan tes fungsional tervalidasi pada lingkungan lokal).
- **Payment & e-KYC Gateway:** Berjalan menggunakan simulasi mock lokal (`BLOCKED_BY_PROVIDER_SELECTION`). Idempotency key, webhook handler, dan verifikasi tanda tangan kriptografis telah terimplementasi dan siap dihubungkan ke penyedia gateway pihak ketiga.

---

## Creator & Lead Architect

- **Shalom Kurniawan** ([@tupperwureism](https://github.com/tupperwureism))
  - Peran: Founding Creator, Lead System Architect & Protocol Designer
  - Email: trusukkendal@gmail.com
  - Kontribusi Utama: Perancangan arsitektur BCE, WORM Audit Vault, ACID Row-Mutex Escrow, dan Notary Workspace Compliance Specification.

---
Lisensi: MIT. Dikelola di bawah standar Justifiqa Core Engineering.
