# Batch 3.A.1.4 DBS — Mengapa Evidence Replay dan Verification Gaps Harus Ditutup (Pasca-Audit)

## Latar Belakang

External audit commit `e0e2787` menemukan **tujuh kegagalan nyata** yang harus diperbaiki sebelum lanjut ke Batch 3.B. Batch 3.A.1.4 memperbaiki semuanya.

---

## 1. Receiver / Binding Method (Web Crypto Crash)

**Masalah:** `crypto.randomUUID` adalah method yang butuh receiver `Crypto` (objek `this` harus bertipe `Crypto`). Di factory lama:
```typescript
const idFn = createId ?? crypto.randomUUID  // ❌ tanpa receiver
idFn()  // TypeError: Value of "this" must be of type Crypto
```

**Solusi:** Wrapper arrow function mempertahankan receiver:
```typescript
const defaultCreateId = () => crypto.randomUUID()  // ✅ this = crypto
```

**Contoh kecil:**
```js
// Salah
const fn = crypto.randomUUID
fn()  // Error: invalid this

// Benar
const fn = () => crypto.randomUUID()
fn()  // OK
```

**Mini-kuis:** Mengapa `crypto.randomUUID` butuh receiver? Karena method native browser butuh akses ke state internal `Crypto` (entropy pool). Arrow function `() => crypto.randomUUID()` mem-bind `this` ke `crypto` secara otomatis.

---

## 2. Ambiguous Network Success (Storage Duplicate)

**Masalah:** Upload file ke Supabase Storage dengan `upsert:false`. Kalo object tersimpan tapi response HTTP hilang (timeout, proxy drop), client ngira gagal → retry → Storage balas `409 Conflict` dengan `statusCode: 'ResourceAlreadyExists'`.

Implementasi lama: **semua** `409` ditangani sama → finalize tidak pernah dipanggil.

**Solusi:** Hanya terima **instance asli** `StorageApiError` dengan:
- `status === 409`
- `statusCode` dalam allowlist: `ResourceAlreadyExists`, `KeyAlreadyExists`, `already_exists`

Arbitrary object `{status:409, statusCode:'ResourceAlreadyExists'}` → **DITOLAK**
Generic `409` dengan statusCode lain → **DITOLAK**

**Contoh kecil:**
```ts
// ✅ Diterima (instance asli)
throw new StorageApiError('Duplicate', 409, 'ResourceAlreadyExists')

// ❌ Ditolak (plain object)
throw { status: 409, statusCode: 'ResourceAlreadyExists' }

// ❌ Ditolak (generic conflict code)
throw new StorageApiError('Conflict', 409, 'SomeOtherCode')
```

**Mini-kuis:** Kenapa arbitrary object ditolak? Karena kode test atau bug bisa bikin object mirip tapi bukan error Storage asli. Instance check memastikan error benar-benar dari Supabase client.

---

## 3. Adapter Seam & Dependency Injection

**Masalah:** `corporateEvidenceGateway` hardcoded pakai Supabase client → test pakai `StubAdapter` yang langsung lempar `StorageApiError` mentah → **false-green** (test lulus tapi production gagal).

**Solusi:** Factory injectable:
```typescript
interface GatewayDependencies {
  invokeFunction(path: string, body: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>
  uploadObject(bucket: string, objectPath: string, file: File, options: { contentType: string; upsert: boolean }): Promise<{ error: StorageApiError | null }>
}

function createCorporateEvidenceGateway(deps: GatewayDependencies): EvidenceGateway
```

- **Production:** `createDefaultDependencies()` pakai Supabase client asli
- **Test:** Inject dependencies yang return raw `StorageApiError` → test **production gateway**, bukan stub

**Contoh kecil:**
```ts
// Test pakai production gateway factory
const deps = {
  invokeFunction: async (path, body) => ({ data: { evidenceId: body.evidenceId, objectPath: '...' }, error: null }),
  uploadObject: async () => { throw new StorageApiError('Duplicate', 409, 'ResourceAlreadyExists') }
}
const gateway = createCorporateEvidenceGateway(deps)
// gateway ini jalan di code path YANG SAMA dengan production
```

**Mini-kuis:** Apa bedanya `StubAdapter` lama vs injectable factory? StubAdapter implement `EvidenceGateway` langsung (bypass factory). Injectable factory test `createCorporateEvidenceGateway` output → code path identik production.

---

## 4. False-Green Test

**Definisi:** Test yang lulus (hijau) tapi **tidak menguji code path production**.

**Contoh kasus ini:** Test lama pakai `StubAdapter.upload` yang lempar `StorageApiError` mentah. Tapi production gateway `upload` bungkus error jadi `CorporateEvidenceError` **sebelum** sampai `uploadEvidence`. Jadi `parseStorageDuplicateCode` di production **tidak pernah** dapet raw `StorageApiError`.

**Perbaikan:** Test sekarang pakai `createCorporateEvidenceGateway` dengan injected deps → raw `StorageApiError` propagates ke `uploadEvidence` → allowlist benar-benar diuji.

---

## 5. Compile-Time Declaration vs Runtime Initialization

**Masalah:** `globalThis.IS_REACT_ACT_ENVIRONMENT = true` hanya di-set di **compile-time** (`.d.ts`) tapi tidak di-**runtime** → React test warning: `The current testing environment is not configured to support act(...)`

**Solusi:** Dua langkah:
1. **Declaration** (`test/test-globals.d.ts`): `declare global { var IS_REACT_ACT_ENVIRONMENT: boolean }`
2. **Runtime init** (`test/reactTestSetup.ts`): `globalThis.IS_REACT_ACT_ENVIRONMENT = true`
3. **Load sekali** via `node --import ./test/reactTestSetup.ts` di script `test:phase2`

**Contoh kecil:**
```ts
// test-globals.d.ts (hanya tipe)
declare global { var IS_REACT_ACT_ENVIRONMENT: boolean }

// reactTestSetup.ts (runtime)
globalThis.IS_REACT_ACT_ENVIRONMENT = true

// package.json
"test:phase2": "node --import ./test/reactTestSetup.ts --test ..."
```

**Mini-kuis:** Kenapa `.d.ts` tidak cukup? Karena TypeScript declaration hanya untuk type checking. Node.js butuh assignment **runtime** sebelum test jalan.

---

## 6. Clean-Candidate Generated Artifacts

**Masalah:** Symbol map generator dijalankan di working tree kotor (ada file user untracked, deleted diagrams, dll) → output map mencantumkan file yang bukan bagian repo → `git diff --check` gagal.

**Solusi:** Clean candidate tree:
1. Stage hanya source/test/docs batch (bukan generated maps)
2. `git write-tree` → dapat `TREE_ID`
3. `git archive <TREE_ID>` → materialisasikan snapshot bersih
4. Jalankan generator di snapshot
5. Copy back hanya `SYMBOLS_MAP.md` dan `SQL_SECURITY_SYMBOLS.md`
6. Stage kedua map tersebut
7. `git write-tree` lagi → final candidate → `git archive` → jalankan `--check` dan library tests

**Mini-kuis:** Kenapa tidak cukup `git status` bersih? Karena working tree user ada file untracked/deleted yang tidak mau di-commit tapi generator tetap baca kalau jalan dari root.

---

## 7. Mini-Kuis Ringkas

1. **Receiver binding:** `const fn = crypto.randomUUID` vs `const fn = () => crypto.randomUUID()` — mana yang benar? **Arrow function**
2. **Duplicate allowlist:** Apa tiga statusCode yang diizinkan? **`ResourceAlreadyExists`, `KeyAlreadyExists`, `already_exists`**
3. **False-green:** Test pakai `StubAdapter` yang lempar `StorageApiError` mentah. Production gateway bungkus error jadi `CorporateEvidenceError` sebelum `uploadEvidence`. Apakah test lama valid? **Tidak (false-green)**
4. **Act warning:** `globalThis.IS_REACT_ACT_ENVIRONMENT = true` di `.d.ts` cukup? **Tidak, butuh runtime init via `--import`**
5. **Clean candidate:** Generator dijalankan di snapshot dari `git archive <TREE_ID>`, bukan working tree langsung.
6. **Export singleton:** `EMPTY_INTAKE_DRAFT` masih diekspor? **Tidak, sudah dihapus, diganti factory.**

---

## Status

**READY FOR EXTERNAL RE-AUDIT** (bukan PASS)