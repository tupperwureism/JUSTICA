# Excessive Revision Guide — Standar Pembersihan UI/UX & Feedback Sistem

**Versi**: 1.0  
**Tanggal**: 06 Juli 2026  
**Tujuan**: Menjadi pedoman persisten paska-eksekusi (*Post-Batch Polish Gate*) untuk membersihkan antarmuka pengguna (UI) dari kata-kata boros, kebocoran referensi teknis, dan label status yang terlalu panjang.

---

## 1. Prinsip Utama Pembersihan UI/UX
Dalam paradigma **SD-Driven Development**, implementasi awal berfokus pada ketepatan alur logika dan ketercejakan teknis (*traceability*). Setelah suatu Batch atau Domain selesai dieksekusi, tahap **Excessive Revision** wajib dilakukan untuk memastikan antarmuka akhir terasa bersih (*clean*), profesional, padat, dan manusiawi (*human-readable*).

---

## 2. Aturan Standar Pembersihan (*Polish Rules*)

### Aturan 1: Larangan Kebocoran Referensi Teknis (*No Technical Leakage*)
* **Deskripsi**: Label tombol, judul modal, placeholder, teks statis, dan elemen antarmuka yang dilihat oleh pengguna akhir **DILARANG KERAS** mencantumkan kode dokumen teknis seperti `(UC-05)`, `(SD-J-04)`, `(J-UC06 2a)`, `(5a/5b)`, atau sejenisnya.
* **Tindakan**: Hapus seluruh referensi alur spesifikasi dari elemen antarmuka pengguna.
* **Contoh Standarisasi**:
  * ❌ `Simulasi Waktu Habis / Ditolak (UC-05 5a/5b)` ➔ ✅ `Simulasi Waktu Habis / Ditolak`
  * ❌ `Ulasan & Rating Advokat (J-UC06)` ➔ ✅ `Ulasan & Rating Advokat`
  * ❌ `Nanti (Skip - UC-06 2a)` ➔ ✅ `Nanti Saja` atau `Lewati`
  * ❌ `Daftar Akun Klien (SD-J-01)` ➔ ✅ `Daftar Akun Klien`

### Aturan 2: Penyederhanaan Status & Badge (*Concise State Naming*)
* **Deskripsi**: Status ketersediaan, kondisi sistem, atau label badge harus menggunakan **satu kata atau frasa tunggal yang padat dan jelas**, menghindari penggunaan garis miring (`/`) yang berlebihan atau penggabungan sinonim ganda.
* **Tindakan**: Ganti label status gabungan menjadi label tunggal standar.
* **Contoh Standarisasi**:
  * ❌ `🟢 ONLINE / AVAILABLE` ➔ ✅ `🟢 Online`
  * ❌ `🔴 SIDANG / OFFLINE` atau `🔴 OFFLINE / SIDANG` ➔ ✅ `🔴 Offline`
  * ❌ `PENDING / MENUNGGU VERIFIKASI` ➔ ✅ `Menunggu Verifikasi`

### Aturan 3: Efisiensi Dialog Alert & Pop-up (*Clean System Feedback*)
* **Deskripsi**: Peringatan sistem (*system alert*, toast, atau confirmation modal) harus langsung menyampaikan inti pesan dengan bahasa yang sopan dan profesional. Hapus penjabaran kode error teknis internal atau kronologi langkah SD pada pesan untuk pengguna akhir.
* **Tindakan**: Sederhanakan teks alert menjadi pesan informatif yang mudah dipahami.
* **Contoh Standarisasi**:
  * ❌ `⚠️ ERROR 409 CONFLICT (SD-J-04 / J-UC09 Alternatif 2b): Gagal mengubah status ketersediaan praktik! Sistem mendeteksi adanya Sesi Konsultasi...` ➔ ✅ `⚠️ Gagal Mengubah Status: Terdapat sesi konsultasi yang sedang berlangsung atau konflik jadwal sidang. Harap selesaikan sesi aktif terlebih dahulu.`
  * ❌ `✅ SUCCESS 200 OK (SD-J-04 Langkah 176): Status praktik berhasil diubah menjadi ONLINE...` ➔ ✅ `✅ Status Praktik Diperbarui: Anda sekarang Online dan siap menerima konsultasi klien.`

### Aturan 4: Pengecualian pada Kotak Panduan Uji Coba (*Helper Guide Exception*)
* **Deskripsi**: Kode referensi teknis (`SD-XX`, `UC-XX`, `Langkah XX`) **HANYA DIZINKAN** berada di dalam panel atau kotak khusus panduan pengujian (*Helper Guide*) yang sengaja disediakan bagi penguji sistem atau QA. Panel ini merupakan alat bantu tes dan tidak dianggap sebagai elemen UI publik.

---

## 3. Alur Kerja Integrasi
1. **Eksekusi Batch SD-Driven**: Kerjakan logika dan antarmuka berdasarkan PlantUML Sequence Diagram & Use Case.
2. **Audit & Pembersihan (Excessive Revision Gate)**: Sisir seluruh file HTML dan script yang diubah, aplikasikan Aturan 1-3 dari panduan ini.
3. **Regenerasi Bundel**: Regenerasi master bundel standalone agar pembersihan tersinkronisasi.
4. **Sign-Off**: Ajukan verifikasi hasil akhir kepada pengguna.
