# Batch 3.A.1.7 DBS — Mengapa Behavioral Isolation, Resource Safety, dan Kebenaran Dokumen Penting

Dokumen ini adalah penjelasan sederhana (DBS) untuk Batch 3.A.1.7. Bahasa yang dipakai sehari-hari, tanpa istilah teknik yang berat. Tujuannya agar pembaca non-teknis memahami kenapa batch ini ada dan apa saja yang berubah.

---

## 1. Mengapa "Render Komponen Asli" Saja Tidak Cukup

### Situasi sebelumnya (Batch 3.A.1.6)

Pada Batch 3.A.1.6, test ref-isolation sudah benar **me-load komponen produksi asli** lewat Vite SSR — itu sudah satu langkah maju. **Akan tetapi**, test tersebut hanya memeriksa:

> "Apakah tombol punya fungsi `onClick`?"

Yang diperiksa cuma **apakah fungsi handler ada**, bukan **apakah handler mengarahkan ke input yang benar**. Akibatnya:

- Kalau produksi secara diam-diam kembali ke `document.getElementById('global-input')`, handler tetap function → test tetap pass. **Bug tidak tertangkap.**
- Kalau `click` di mock adalah no-op (tidak melakukan apa-apa), handler tetap function → test tetap pass. **Bug tidak tertangkap.**

Inilah yang disebut **false-green**: test hijau tapi bug di produksi. Ini tidak aman untuk监管.

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
- Test berikutnya bisa gagal karena port conflict atau watcher Vite bentrok.
- Setiap run bisa meninggalkan watcher aktif.

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

**Di dalam test**, kita tambah nested try/finally:

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

Artinya: kalau `renderer.unmount()` gagal (misalnya act error), server Vite di **luar** tetap akan di-close oleh finally-nya `withViteModule`. Tidak ada jalur eksekusi yang meninggalkan resource terbuka.

**Mini-kuis:** Kenapa tidak cukup satu `try/finally` saja? Karena kita punya **dua resource yang harus di-cleanup**: renderer React dan server Vite. Kalau cleanup renderer gagal, kita tetap ingin cleanup server. Itu sebabnya butuhnya nested try/finally.

---

## 4. Kenapa Mutable Global Test Server Itu Risiko

Mutable global = variabel yang bisa diubah dari mana saja. Singleton Vite server lama adalah variabel `let viteServer = null` di level modul. Risikonya:

- **Concurrent tests saling timpa**: kalau dua test jalan paralel dan keduanya panggil `getViteServer()`, server pertama bisa di-close oleh test kedua. Test pertama tiba-tiba kehilangan server di tengah jalan.
- **Test kedua tidak bisa mulai bersih**: kalau test pertama gagal tanpa `closeViteServer()`, test kedua dapat server yang sudah "rusak" (modul yang sudah diload, watcher yang sudah jalan).
- **State leakage antar test**: modul yang sudah diload di cache Vite bisa bocor ke test berikutnya.

`withViteModule` menghilangkan semua itu: server baru per pemanggilan, lifecycle ketat dalam `try/finally`, tidak ada variabel bersama.

**Mini-kuis:** Apa yang terjadi kalau dua test dipanggil paralel dengan helper lama? Test kedua bisa saja menutup server yang masih dipakai test pertama. Dengan `withViteModule`, masing-masing test punya server sendiri yang tidak bisa diakses dari luar.

---

## 5. Dirty Tree vs Clean Candidate Symbol Map

### Apa itu dirty tree?

Working tree Git = salinan kerja di disk Anda. Saat ini banyak file user yang **untracked** (belum di-`git add`) dan file tracked yang punya perubahan stat/line-ending. Ini kita sebut **dirty tree** — ada "sampah" yang tidak akan masuk commit.

### Mengapa ini mengganggu generator symbol map?

Generator symbol map membaca **semua file** di working tree. Kalau di sana ada file user yang tidak masuk repo resmi (misalnya `.agents/ponytail/`, `.continue/`, mockup draft), simbol-simbol dari file itu ikut masuk ke peta simbol. Peta jadi **terkontaminasi**.

### Solusi: clean candidate

```
1. Stage HANYA file milik batch 3.A.1.7
2. git write-tree → buat tree object dari staged file saja
3. git archive <TREE_ID> → ekstrak ke folder /tmp terpisah
4. node Tools/generate_symbol_map.mjs DI folder /tmp tersebut
5. Salin MarkDown/SYMBOLS_MAP.md dan MarkDown/SQL_SECURITY_SYMBOLS.md kembali
6. Stage kedua map HANYA kalau isinya beda dari HEAD
```

Artinya: generator peta simbol jalan di **snapshot bersih** (hanya file yang akan di-commit), bukan di working tree yang kotor. Hasilnya: peta simbol tidak tercemar file user yang tidak masuk repo.

**Mini-kuis:** Kenapa tidak cukup `git status` bersih dulu baru generator dijalankan di root? Karena `git status` bisa bersih tapi working tree masih punya file yang sebenarnya TIDAK akan di-commit (untracked). Generator di root akan tetap baca file-file itu dan mencemari output. Clean candidate = snapshot eksplisit dari staged-only files.

---

## 6. Mini-Kuis Ringkasan

1. **Render asli saja tidak cukup** — butuh counter observable per mock untuk mengukur click isolation nyata.
2. **Behavioral assertion = side effect yang bisa diamati**, bukan sekadar "handler ada".
3. **Resource ownership** = setiap resource (Vite server, renderer) harus di-close di `finally`, sukses maupun gagal.
4. **Nested try/finally** = untuk dua resource berbeda, supaya cleanup yang satu tidak skip cleanup yang lain.
5. **Mutable singleton** = variabel modul-level bersama = risiko konkruensi dan leakage.
6. **Clean candidate** = generator jalan di snapshot staged-only, bukan di working tree.
7. **Dirty tree** = working tree yang punya file user/temp yang tidak akan di-commit.

---

## Status

**READY FOR EXTERNAL RE-AUDIT** (bukan PASS). Batch 3.A.1.7 menutup semua celah yang tersisa dari audit 3.A.1.6 dan dari pemeriksaan internal 3.A.1.7.
