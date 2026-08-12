# Batch 3.A.1.7 DBS — Mengapa Behavioral Isolation, Resource Safety, dan Kebenaran Dokumen Penting

Dokumen ini adalah penjelasan sederhana (DBS) untuk Batch 3.A.1.7. Bahasa yang dipakai sehari-hari, tanpa istilah teknik yang berat. Tujuannya agar pembaca non-teknis memahami kenapa batch ini ada dan apa saja yang berubah.

> Catatan rekonsiliasi: dokumen ini dikoreksi oleh `BATCH_3_A_1_8_DBS.md` untuk memperbaiki beberapa kalimat faktual (karakter aksidental, penjelasan status untracked, klaim middleware-mode, dan pembedaan behavioral vs struktural).

---

## 1. Mengapa "Render Komponen Asli" Saja Tidak Cukup

### Situasi sebelumnya (Batch 3.A.1.6)

Pada Batch 3.A.1.6, test ref-isolation sudah benar **me-load komponen produksi asli** lewat Vite SSR — itu sudah satu langkah maju. **Akan tetapi**, test tersebut hanya memeriksa:

> "Apakah tombol punya fungsi `onClick`?"

Yang diperiksa cuma **apakah fungsi handler ada**, bukan **apakah handler mengarahkan ke input yang benar**. Akibatnya:

- Kalau produksi secara diam-diam kembali ke `document.getElementById('global-input')`, handler tetap function → test tetap pass. **Bug tidak tertangkap.**
- Kalau `click` di mock adalah no-op (tidak melakukan apa-apa), handler tetap function → test tetap pass. **Bug tidak tertangkap.**

Inilah yang disebut **false-green**: test hijau tapi bug di produksi. Ini tidak aman untuk audit.

### Solusi 3.A.1.7

Sekarang test benar-benar **behavioral**:

1. Saat React me-mount dua panel, kita buat dan simpan dua mock berbeda — satu untuk setiap input file.
2. Tiap mock punya **counter observable** (`clickCount`).
3. Klik tombol panel A → counter mock panel A harus naik dari 0 ke 1.
4. Klik tombol panel B → counter mock panel B harus naik dari 0 ke 1.
5. Urutan counter harus: `[0, 0] → [1, 0] → [1, 1]`.

Kalau produksi reverts ke global DOM lookup atau bocor ref, urutan counter akan salah dan test gagal. Test ini benar-benar mengukur **click isolation**.

**Mini-kuis:** Kenapa render komponen asli tidak cukup? Karena rendering hanya membuktikan **komponen bisa di-mount**. Tidak membuktikan bahwa **event handler-nya mengarahkan ke instance ref yang benar**. Butuh counter observable pada mock per instance untuk benar-benar mengukur click isolation.

---

## 2. Side Effects dan Behavioral Assertions

Side effect = sesuatu yang **terlihat berubah** ketika kita melakukan aksi. Untuk uji ref-isolation, side effect yang kita amati adalah **`clickCount` pada mock input file**.

| Aksi | Side effect yang diharapkan |
|------|-----------------------------|
| Klik tombol panel A | `clickCount` mock A naik 1, mock B tetap 0 |
| Klik tombol panel B | `clickCount` mock A tetap 1, mock B naik ke 1 |

Kalau side effect tidak sesuai, test gagal dan kita tahu ada bug di produksi. Ini berbeda dengan test "cek apakah handler ada" — yang tidak mengukur side effect apa-apa.

**Mini-kuis:** Apa bedanya `assert.ok(handler)` dengan `assert.deepEqual([counterA, counterB], [1, 0])`? Yang pertama hanya membuktikan **fungsi ada**; yang kedua membuktikan **fungsi benar-benar mengubah state observable**. Hanya yang kedua yang benar-benar behavioral.

---

## 3. Resource Ownership dengan `try/finally`

### Masalah: server Vite bisa "bocor"

Pada helper lama (`loadComponent/closeViteServer`), server Vite dibuat pakai singleton module-level. Kalau test gagal di tengah jalan, kita mungkin lupa memanggil `closeViteServer()`. Akibatnya:

- Server Vite tetap hidup di memory sampai proses Node selesai.
- Setiap run bisa meninggalkan watcher aktif.
- Modul yang sudah diload bisa bocor ke test berikutnya (state leakage antar test).

### Solusi: `withViteModule` + `try/finally`

```typescript
export async function withViteModule<T>(
  modulePath: string,
  callback: (loaded: T) => Promise<void>,
): Promise<void> {
  const server = await createServer({ /* middleware-mode */ });
  try {
    const loaded = (await server.ssrLoadModule(modulePath)) as T;
    await callback(loaded);
  } finally {
    await server.close();
  }
}
```

Strukturnya:

1. **Sebelum try**: server dibuat. Tidak ada state global.
2. **Di dalam try**: modul di-load, callback dijalankan. Kalau keduanya gagal, error propagate ke finally.
3. **Di dalam finally**: server selalu di-close, sukses maupun gagal.

Tidak ada singleton, tidak ada state modul-level, tidak ada kemungkinan lupa close.

### Catatan faktual tentang "middleware mode"

Vite dalam mode middleware **tidak mendengarkan port aplikasi** — server dipakai lewat API internal, bukan lewat HTTP listen. Klaim risiko terkait nomor port aplikasi yang tertulis di versi DBS sebelumnya tidak akurat untuk mode ini. Risiko faktual dari helper lama adalah kebocoran resource (handle server, watcher Vite), cache modul yang bocor, dan interferensi antar test.

### Di dalam test: nested try/finally

```typescript
await withViteModule(path, async ({ BeneficialOwnerEvidencePanel }) => {
  let renderer;
  try {
    // render, click, assert
  } finally {
    if (renderer) {
      act(() => { renderer.unmount(); });
    }
  }
});
```

Kalau `renderer.unmount()` gagal (misalnya act error), server Vite di **luar** tetap akan di-close oleh finally-nya `withViteModule`. Tidak ada jalur eksekusi yang meninggalkan resource terbuka.

**Mini-kuis:** Kenapa tidak cukup satu `try/finally` saja? Karena kita punya **dua resource yang harus di-cleanup**: renderer React dan server Vite. Kalau cleanup renderer gagal, kita tetap ingin cleanup server. Itu sebabnya butuhnya nested try/finally.

---

## 4. Pembedaan Bukti: Behavioral vs Struktural

Dokumen ini penting karena mencampur dua jenis bukti:

- **Bukti behavioral** = test yang benar-benar menjalankan kode dan mengamati side effect. Untuk ref-isolation, buktinya adalah urutan counter `[0,0] → [1,0] → [1,1]`.
- **Bukti struktural** = inspeksi visual kode yang menunjukkan struktur kontrol yang dimaksud. Untuk resource safety, buktinya adalah blok `try/finally` di implementasi `withViteModule` dan nested try/finally di test.

Keduanya valid, tapi **tidak boleh saling mengklaim**. Tes 3.A.1.7:

- **Membuktikan secara behavioral**: counter transisi benar.
- **Menunjukkan secara struktural**: `try/finally` ada di implementasi, dan `await server.close()` berada dalam blok `finally`.

### Apa yang TIDAK dibuktikan secara behavioral

Tes 3.A.1.7 **tidak** menyuntikkan kegagalan pada `createServer`, `ssrLoadModule`, atau `server.close`. Artinya, klaim "kalau renderer unmount melempar, server Vite tetap ter-close" adalah klaim **struktural** — benar secara pembacaan kode, tetapi **tidak diuji oleh test**. Untuk membuktikan klaim tersebut secara behavioral, butuh test tambahan yang stub salah satu dari fungsi itu agar melempar, dan kemudian assert bahwa server.close() tetap dipanggil. Test itu tidak ada di 3.A.1.7.

Mengakui keterbatasan ini bukan berarti helper salah; artinya, dokumentasi tidak boleh mengklaim bukti yang lebih kuat dari yang sebenarnya diberikan.

**Mini-kuis:** Apakah "server.close() selalu dipanggil" fakta struktural atau behavioral di 3.A.1.7? Struktural — terlihat di kode, tapi tidak ada test yang membuktikan path failure-nya.

---

## 5. Kenapa Mutable Global Test Server Itu Risiko

Mutable global = variabel yang bisa diubah dari mana saja. Singleton Vite server lama adalah variabel `let viteServer = null` di level modul. Risikonya:

- **Concurrent tests saling timpa**: kalau dua test jalan paralel dan keduanya panggil `getViteServer()`, server pertama bisa di-close oleh test kedua. Test pertama tiba-tiba kehilangan server di tengah jalan.
- **Test kedua tidak bisa mulai bersih**: kalau test pertama gagal tanpa `closeViteServer()`, test kedua dapat server yang sudah "rusak" (modul yang sudah diload, watcher yang sudah jalan).
- **State leakage antar test**: modul yang sudah diload di cache Vite bisa bocor ke test berikutnya.

`withViteModule` menghilangkan semua itu: server baru per pemanggilan, lifecycle ketat dalam `try/finally`, tidak ada variabel bersama.

**Mini-kuis:** Apa yang terjadi kalau dua test dipanggil paralel dengan helper lama? Test kedua bisa saja menutup server yang masih dipakai test pertama. Dengan `withViteModule`, masing-masing test punya server sendiri yang tidak bisa diakses dari luar.

---

## 6. Dirty Tree vs Clean Candidate Symbol Map

### Apa itu dirty tree?

Working tree Git = salinan kerja di disk Anda. Ada dua jenis kondisi:

- **Tracked file dengan perubahan lokal** (dirty tracked) — perubahan yang sudah terlacak tapi belum di-commit.
- **Untracked file** — file baru yang belum pernah ditambahkan ke Git. **`git status` menampilkan untracked file secara default**, kecuali diabaikan oleh `.gitignore` atau disembunyikan oleh flag seperti `--untracked-files=no`.

Jadi klaim bahwa "git status bersih" bisa menyiratkan tidak ada tracked-dirty dan tidak ada untracked, **atau** ada untracked tapi disembunyikan dari tampilan. Generator tidak peduli pada tampilan `git status`; ia membaca filesystem.

### Mengapa ini mengganggu generator symbol map?

`Tools/symbol_map_lib.mjs` hanya menelusuri tiga akar tetap:

- `justifiqa-frontend/src` — TypeScript/TSX.
- `database/migrations` — SQL, hanya bila path itu ada.
- `supabase/migrations` — SQL.

Ia **tidak** pernah membaca `.agents/`, `.continue/`, mockup, diagram, atau artefak build. Kontaminasi peta simbol tidak mungkin datang dari direktori yang tidak dipindai; kontaminasi hanya mungkin datang dari **berkas untracked/dirty yang hidup di salah satu akar tetap di atas**. Jadi cukup pastikan tidak ada `.ts`/`.tsx`/`.sql` untracked di tiga akar itu.

### Solusi: clean candidate

```
1. Stage HANYA file milik batch 3.A.1.7
2. git write-tree → buat tree object dari staged file saja
3. git archive <TREE_ID> → ekstrak ke folder terpisah (di luar repo)
4. node Tools/generate_symbol_map.mjs DI folder tersebut
5. Salin MarkDown/SYMBOLS_MAP.md dan MarkDown/SQL_SECURITY_SYMBOLS.md kembali
6. Stage kedua map HANYA kalau isinya beda dari HEAD
```

Generator peta simbol jalan di **snapshot bersih** (hanya file yang akan di-commit), bukan di working tree yang kotor. Hasilnya: peta simbol tidak tercemar file user.

**Mini-kuis:** Mengapa direktori seperti `.agents/` tidak relevan bagi generator? Karena `Tools/symbol_map_lib.mjs` hanya menelusuri tiga akar tetap (`justifiqa-frontend/src`, `database/migrations`, `supabase/migrations`). Direktori lain tidak pernah disentuh; satu-satunya sumber kontaminasi adalah berkas yang hidup di dalam salah satu akar itu sendiri.

---

## 7. Mini-Kuis Ringkasan

1. **Render asli saja tidak cukup** — butuh counter observable per mock untuk mengukur click isolation nyata.
2. **Behavioral assertion = side effect yang bisa diamati**, bukan sekadar "handler ada".
3. **Resource ownership** = setiap resource (Vite server, renderer) harus di-close di `finally`, sukses maupun gagal.
4. **Nested try/finally** = untuk dua resource berbeda, supaya cleanup yang satu tidak skip cleanup yang lain.
5. **Vite middleware mode** = tidak mendengarkan port aplikasi; risiko faktual adalah kebocoran handle/watcher/cache.
6. **Behavioral vs struktural** = transisi counter dibuktikan behavioral; urutan `try/finally` dibuktikan struktural; tidak ada test failure-path.
7. **Mutable singleton** = variabel modul-level bersama = risiko konkruensi dan leakage.
8. **Clean candidate** = generator jalan di snapshot staged-only, bukan di working tree.
9. **Dirty tree** = working tree yang punya file user/temp yang tidak akan di-commit.

---

## Status

**IMPLEMENTATION ACCEPTED; DOCUMENTATION AUDIT FAILED; SUPERSEDED BY 3.A.1.8.** Implementasi helper dan test tidak dibuka kembali; dokumen ini dikoreksi oleh 3.A.1.8 agar klaim struktural tidak keliru disebut bukti behavioral, dan agar penjelasan tentang mode Vite serta akar generator menjadi faktual.
