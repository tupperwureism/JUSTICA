# Batch 3.A.1.12 DBS — Pelajaran dari Rantai Audit Dokumentasi Corporate Intake

Dokumen ini menjelaskan secara sederhana (DBS) mengapa Batch 3.A.1.12 diperlukan, apa yang diperbaiki, dan pelajaran yang bisa diambil — tanpa memerlukan pengetahuan teknis mendalam.

---

## 1. Kebenaran Sejarah vs Kebenaran Saat Ini

Dalam audit dokumentasi, ada perbedaan fundamental antara:

- **Kebenaran sejarah (`historical truth` / `creation-time`)**: apa yang benar pada saat dokumen pertama kali dibuat. Contoh: "hash belum diketahui" — ini benar saat commit baru saja dibuat.
- **Kebenaran saat ini (`present-state truth`)**: apa yang benar sekarang, setelah semua commit sudah terbentuk dan diverifikasi. Contoh: "hash `6c3f38c` sudah diverifikasi" — ini benar hari ini.

**Kesalahan fatal**: mencampur keduanya tanpa kualifikasi. Jika dokumen lama menyatakan "hash tidak disertakan" (benar di masa lalu) tapi sekarang hash itu sudah ada di dokumen (benar sekarang), pembaca akan melihat kontradiksi — padahal keduanya benar, hanya berlaku untuk waktu yang berbeda.

---

## 2. Self-Review Eksekutor vs Audit Eksternal

Ada dua lapisan verifikasi yang **tidak boleh dibaurkan**:

| Lapisan | Siapa | Apa yang dilaporkan | Bisa salah? |
|---------|-------|---------------------|-------------|
| **Self-review eksekutor** | AI/manusia yang membuat batch | "Saya sudah cek, semuanya bersih" | **Ya** — bisa melewatkan cacat (seperti yang terjadi di 3.A.1.11) |
| **Audit eksternal** | Pengendali independen setelah commit | "Ditemukan cacat X, Y, Z yang terlewat" | **Ini yang menjadi keputusan final** |

**Pelajaran dari 3.A.1.11**: Eksekutor melaporkan "temporal sweep bersih" dan "dua sumbu bersih". Audit eksternal kemudian menemukan: CP-02/CP-03 3.A.1.9 terlewat, kontradiksi status 3.A.1.10 terlewat. Jadi self-review 3.A.1.11 **tidak akurat**.

**Aturan**: Jangan tulis "audit bersih" seolah-olah itu fakta final. Tulis: "Eksekutor melaporkan bersih; audit eksternal menemukan sisa cacat."

---

## 3. Mengapa "READY" Harus Diganti "FAILED/SUPERSEDED" Setelah Audit Gagal

Di 3.A.1.10 dan 3.A.1.11, status awal ditulis `READY FOR EXTERNAL RE-AUDIT`. Tapi setelah audit eksternal **benar-benar terjadi dan gagal**, status itu tidak boleh tetap tertulis sebagai status sekarang.

**Perbaikan yang benar**:
- Status asal eksekutor (pada saat pembuatan): `READY FOR EXTERNAL RE-AUDIT`
- Audit eksternal terjadi → **GAGAL** (ditemukan cacat)
- Status historis final: `DOCUMENTATION ... AUDIT FAILED; SUPERSEDED BY 3.A.1.x`

Jangan biarkan status `READY` bertahan di dokumen setelah audit gagal. Itu menyesatkan pembaca mendatang.

---

## 4. Catatan Checkpoint Jangan Ditulis Ulang Diam-diam

Checkpoint (CP) mencatat **apa yang benar-benar terjadi pada waktu itu**. Jangan hapus atau ubah catatan lama agar terlihat "sudah benar sejak awal".

**Contoh salah**: CP-02 3.A.1.9 awalnya tulis "no embedded future hash". Nanti diganti jadi "hash `6c3f38c` sudah ada" tanpa konteks. Ini menghapus jejak sejarah.

**Contoh benar**: CP-02 3.A.1.9 tetap berisi catatan aslinya ("pada saat pembuatan, hash belum ada"), **ditambah** kualifikasi: "fakta sekarang: hash `6c3f38c` sudah dimasukkan retrospektif oleh 3.A.1.10".

Ini menjaga integritas jejak audit: pembaca bisa melihat apa yang diketahui kapan.

---

## 5. Cara Menambah Koreksi Audit Eksternal dengan Jujur

Ketika audit eksternal menemukan cacat yang terlewat self-review:

1. **Jangan** tulis seolah eksekutor awal sudah menemukannya.
2. **Tulis**: "Self-review eksekutor melaporkan X. Audit eksternal kemudian menemukan Y masih tersisa. Oleh karena itu self-review tidak lengkap."
3. **Tambahkan** koreksi sebagai lapisan baru (batch baru), bukan menimpa catatan lama.
4. **Catat** hash hasil batch baru secara retrospektif di batch descendant (seperti 3.A.1.12 mencatat hash 3.A.1.11).

Ini yang dilakukan 3.A.1.12: mencatat temuan audit eksternal (Finding A–E) sebagai fakta, lalu menerapkan koreksi ke lima file historis.

---

## 6. Urutan Heading dan Referensi Lintas Dokumen Harus Presisi

Dua cacat kecil tapi berbahaya:

| Cacat | Contoh | Bahayanya |
|-------|--------|-----------|
| **Heading tidak berurutan** | `## 9` muncul sebelum `## 8` | Pembaca bingung urutan logika; alat otomatis (TOC generator) rusak |
| **Referensi "dokumen ini" ambigu** | Di `BATCH_3_A_1_11_DBS.md` tulis "dokumen ini" merujuk ke `BATCH_3_A_1_11.md` | Pembaca tidak tahu file mana yang sedang dibaca; identitas dokumen hilang |

**Perbaikan 3.A.1.12**:
- `BATCH_3_A_1_10_DBS.md`: heading dinomori ulang `## 8` lalu `## 9`.
- `BATCH_3_A_1_11_DBS.md`: judul eksplisit "`BATCH_3_A_1_11_DBS.md` (dokumen DBB pendamping `BATCH_3_A_1_11.md`)"; referensi di bagian sitasi diperbaiki.

---

## 7. Checklist Terminal — Mencegah Koreksi Dokumentasi Rekursif

Sebelum menyatakan batch dokumentasi "selesai", pastikan:

- [ ] **Semua hash diverifikasi via `git rev-parse`** (bukan tebakan/penyalinan).
- [ ] **Setiap klaim "hash tidak ada" dikualifikasi**: creation-time vs present-state.
- [ ] **Status tidak bersifat ganda**: tidak ada dokumen yang bilang "READY" di satu tempat, "FAILED" di tempat lain.
- [ ] **Self-review vs audit eksternal dibedakan eksplisit**.
- [ ] **Heading berurutan ketat** (`## 1`, `## 2`, `## 3`... tidak melompat/mundur).
- [ ] **Referensi lintas file pakai nama file penuh** (bukan "dokumen ini").
- [ ] **Tidak ada hash batch sendiri** tertanam di dokumen (mustahil teknisnya).
- [ ] **Allowlist ketat**: hanya file yang disebut di batch ini yang disentuh.
- [ ] **Dirty worktree user tidak disentuh**.
- [ ] **UTF-8 tanpa BOM**, no trailing whitespace.

Jika semua ✅ → batch ini adalah **terminal** (tidak perlu 3.A.1.13 untuk hal yang sama).

---

## 8. Mini-Kuis dengan Jawaban

**1. Apa beda "fakta saat kejadian" dan "fakta repository sekarang"?**
- *Jawab*: Fakta saat kejadian = benar pada saat commit dibuat (contoh: "hash belum ada"). Fakta repository sekarang = benar hari ini setelah commit terbentuk (contoh: "hash `6c3f38c` diverifikasi").

**2. Mengapa self-review eksekutor tidak boleh dianggap final?**
- *Jawab*: Karena bisa melewatkan cacat (bukti: 3.A.1.11 self-review bilang bersih, audit eksternal temukan 4 cacat). Audit eksternal yang memutus.

**3. Jika audit eksternal gagal, status `READY FOR EXTERNAL RE-AUDIT` bagaimana?**
- *Jawab*: Harus diganti jadi `FAILED; SUPERSEDED BY ...`. Status `READY` hanya berlaku *sebelum* audit terjadi.

**4. Bolehkah mengubah CP lama agar terlihat "sudah benar sejak awal"?**
- *Jawab*: **Tidak**. CP mencatat realitas waktu itu. Tambahkan kualifikasi waktu, jangan hapus catatan asli.

**5. Kenapa heading `## 9` sebelum `## 8` itu masalah?**
- *Jawab*: Merusak urutan logika, membingungkan pembaca, memecah alat otomatis (TOC, linter).

**6. Di file `_DBS.md`, bolehkah tulis "dokumen ini" merujuk ke file `.md` (non-DBS)?**
- *Jawab*: **Tidak**. "Dokumen ini" = file yang sedang dibaca. Pakai nama file penuh: "`BATCH_3_A_1_11_DBS.md` (dokumen DBB pendamping `BATCH_3_A_1_11.md`)".

**7. Apakah 3.A.1.12 ini terminal untuk rantai Corporate Intake?**
- *Jawab*: **Ya**, untuk rantai dokumentasi audit. Finding A–E semuanya tertutup. Hash 3.A.1.12 sendiri tidak diketahui (creation-time limitation).

---

## 9. Sitasi Langsung ke File yang Dikoreksi (Batch 3.A.1.12)

- `MarkDown/Batches/BATCH_3_A_1_9.md` — CP-02, CP-03, Limitations: kualifikasi temporal `creation-time` vs `present-state` ditambahkan; hash `6c3f38c` dipertahankan.
- `MarkDown/Batches/BATCH_3_A_1_10.md` — Status, Checkpoint CP-02, Limitations, Next Exact Action, Status akhir: status terpadu ke `FAILED; SUPERSEDED BY 3.A.1.11`; metadata retrospektif `e347594...` ditambahkan; self-review vs audit dibedakan.
- `MarkDown/Batches/BATCH_3_A_1_10_DBS.md` — Bagian 5 (rantai simpul), Mini-kuis Q4, Bagian 7 (rujukan), Heading dinomori ulang `## 8`/`## 9`, Status akhir: kualifikasi temporal; metadata `e347594...`; status asal vs final dibedakan.
- `MarkDown/Batches/BATCH_3_A_1_11.md` — Status, Checkpoint CP-04/CP-05, Two-Axis Review, Limitations, Next Exact Action, Status akhir: metadata retrospektif `af860b9...`; status historis `FAILED; SUPERSEDED BY 3.A.1.12`; self-review dikoreksi jadi "eksekutor melaporkan bersih; audit eksternal temukan sisa cacat".
- `MarkDown/Batches/BATCH_3_A_1_11_DBS.md` — Judul, Mini-kuis Q4, Bagian 7 (sitasi), Status akhir: identitas file diperbaiki; "sebelum koreksi 3.A.1.11" dikualifikasi; status historis `FAILED; SUPERSEDED BY 3.A.1.12`; konsep temporal tetap valid.

---

## 10. Keterbatasan Faktual

- **Pada saat pembuatan Batch 3.A.1.12, hash komit hasilnya belum tersedia**. Dokumentasi ini mencatat keterbatasan ini secara eksplisit sejak awal. Laporan eksternal pasca-komit boleh mencatatnya retrospektif.
- Batch ini hanya rekonsiliasi Markdown. Kode produksi `67439533...` tetap diterima; tidak ada tes/kode yang dibuka kembali.