# Batch 3.A.1.6 DBS — Mengapa Behavioral Verification Harus Dibenarkan

> **STATUS OVERRIDE (Batch 3.A.1.7):** Dokumen ini adalah penjelasan sederhana (DBS) untuk Batch 3.A.1.6. Setelah audit eksternal pada 3.A.1.6, status dokumen ini berubah menjadi **FAILED EXTERNAL AUDIT / SUPERSEDED BY 3.A.1.7**. Penjelasan sederhana untuk status baru ada di `BATCH_3_A_1_7_DBS.md`.

## Latar Belakang

External audit pada Batch 3.A.1.5 menemukan **enam kegagalan nyata** yang harus diperbaiki. Batch 3.A.1.6 memperbaiki sebagian besar dengan **behavioral testing nyata**, bukan source-text inspection. Setelah audit lanjutan (3.A.1.7), satu butir ref-isolation ternyata masih false-green dan ditutup pada 3.A.1.7.

---

## 1. Behavioral Testing vs Source-Text Testing

### Masalah di 3.A.1.5

Test ref-isolation di Batch 3.A.1.5 **hanya membaca source code sebagai teks**:

```typescript
// test yang TIDAK behavioral - hanya string matching
const source = readFileSync(componentPath, 'utf8');
assert.ok(source.includes('useRef<HTMLInputElement>'));
assert.ok(source.includes('fileInputRef.current?.click()'));
assert.ok(!source.includes('document.getElementById'));
```

**Mengapa ini bukan behavioral test?**
- Test pass jika source code **mengandung string** tertentu
- Test **tidak menjalankan** komponen
- Test **tidak memverifikasi perilaku aktual** (click isolation)
- Komponen bisa saja pakai `useRef` tapi buggy di runtime

### Solusi 3.A.1.6 (tidak cukup)

Batch 3.A.1.6 sudah **me-render komponen produksi aktual** via Vite SSR — sebuah langkah maju dari source-text. **Akan tetapi**, audit 3.A.1.7 menemukan bahwa test 3.A.1.6 hanya memeriksa:

```typescript
// 3.A.1.6: render real component, tapi assertion terlalu lemah
assert.ok(typeof buttons[0].props.onClick === 'function');
assert.ok(typeof buttons[1].props.onClick === 'function');
```

Artinya, test hanya membuktikan **handler ada** — bukan **handler mengarahkan ke input yang benar**. Ini masih **false-green** karena:

- Jika produksi reverts ke `document.getElementById('global-input')` di runtime, handler tetap berupa function → assertion tetap pass.
- Jika `click` adalah no-op, handler tetap function → assertion tetap pass.

### Solusi nyata di 3.A.1.7

3.A.1.7 memperkenalkan **counter observable per file-input mock**:

```typescript
const fileInputMocks: Array<{ clickCount: number }> = [];

// Di createNodeMock:
const mock = { clickCount: 0, click() { this.clickCount += 1; }, ... };
fileInputMocks.push(mock);
return mock;

// Assertion sequence:
assert.deepEqual([fileInputMocks[0].clickCount, fileInputMocks[1].clickCount], [0, 0]);
act(() => { buttons[0].props.onClick(); });
assert.deepEqual([fileInputMocks[0].clickCount, fileInputMocks[1].clickCount], [1, 0]);
act(() => { buttons[1].props.onClick(); });
assert.deepEqual([fileInputMocks[0].clickCount, fileInputMocks[1].clickCount], [1, 1]);
```

Sekarang test benar-benar behavioral: **counter naik pada mock yang benar, urutan [0,0] → [1,0] → [1,1]**. Jika produksi bug (no-op, global DOM lookup, ref bocor), counter tidak akan bergerak sesuai urutan itu dan test gagal.

**Mini-kuis:** Kenapa "render real component" saja tidak cukup? Karena rendering hanya membuktikan komponen **bisa di-mount**. Tidak membuktikan bahwa **event handler-nya mengarahkan ke instance ref yang benar**. Butuh observable counter pada mock per instance untuk benar-benar mengukur click isolation.

---

## 2. Kenapa Fake Component Menghasilkan False-Green

### Fake Test di 3.A.1.5

```typescript
// FAKE - bukan komponen produksi
const TestPanelA = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return createElement('div', {},
    createElement('input', { ref: fileInputRef, type: 'file', ... }),
    createElement('button', { onClick: () => { fileInputRef.current?.click(); ... }}, 'Pilih file A')
  );
};
```

**Masalah:**
- `TestPanelA`/`TestPanelB` **ditulis ulang** di file test
- Bukan kode produksi yang di-deploy ke user
- Kalau produksi pakai `document.getElementById('global-file-input')`, test fake tetap lolos
- **False-green**: test hijau tapi bug di produksi

### Real Test di 3.A.1.6

- Import **komponen produksi asli** via `loadComponent()`
- Render dengan **React test renderer nyata**
- Verifikasi **perilaku aktual**: klik button A → hanya input A yang ter-trigger
- Kalau produksi bug (pakai global ID), test **AKAN GAGAL**

**Mini-kuis:** Apa beda `useRef` vs `document.getElementById`?
- `useRef`: React creates **new ref per component instance** → isolasi otomatis
- `document.getElementById`: **Global singleton** → semua instance share same DOM element → bug

---

## 3. Single Wrapping Supabase Invoke Payloads

### Kontrak

```typescript
// createDefaultDependencies().invokeFunction INTERNAL:
async invokeFunction(path, body) {
  const { supabase } = await import('@/lib/supabase');
  return supabase.functions.invoke(path, { body: body as Record<string, unknown> });
  //                                                      ^^^^^ WRAP DI SINI
}
```

### Pemanggilan yang Benar (Single Wrap)

```typescript
// Pemanggil HANYA pass plain domain payload:
deps.invokeFunction('corporate-evidence/finalize', {
  evidenceId: input.evidenceId,      // plain
  idempotencyKey: input.idempotencyKey  // plain
});

// invokeFunction internal → supabase.functions.invoke(path, {
//   body: { evidenceId: "...", idempotencyKey: "..." }  // SINGLE wrap
// })
```

### Pemanggilan Salah (Double Wrap)

```typescript
// ❌ JIKA pemanggil wrap lagi:
deps.invokeFunction('corporate-evidence/finalize', {
  body: { evidenceId: "...", idempotencyKey: "..." }  // DOUBLE WRAP!
});

// invokeFunction internal → supabase.functions.invoke(path, {
//   body: { body: { evidenceId: "...", ... } }  // NESTED BODY!
// })
```

### Regression Test di 3.A.1.6

```typescript
test('exact prepare/finalize invoke payload shape — no double body wrapper', async () => {
  const invokeCalls: Array<{ path: string; payload: Record<string, unknown> }> = [];

  const deps = {
    invokeFunction: async (path, payload) => {
      invokeCalls.push({ path, payload });  // CAPTURE ACTUAL CALL
      // ... return mock response
    },
    // ...
  };

  // Run full flow through PRODUCTION gateway
  const gateway = createCorporateEvidenceGateway(deps);
  await view.current.start(ROW_A, file);
  await view.current.retry(ROW_A);

  // ASSERT prepare payload
  const preparePayload = invokeCalls.find(c => c.path === 'corporate-evidence/prepare').payload;
  assert.equal(Object.keys(preparePayload).length, 4); // evidenceId, declaredMime, declaredByteSize, idempotencyKey
  assert.ok(!('body' in preparePayload)); // NO NESTED BODY

  // ASSERT finalize payload
  const finalizePayload = invokeCalls.find(c => c.path === 'corporate-evidence/finalize').payload;
  assert.equal(Object.keys(finalizePayload).length, 2); // evidenceId, idempotencyKey ONLY
  assert.ok(!('body' in finalizePayload)); // NO NESTED BODY

  // This test FAILS if someone restores double-wrapper
});
```

**Mini-kuis:** Mengapa test ini behavioral? Karena memanggil **gateway produksi asli** (`createCorporateEvidenceGateway`) dan capture **actual invokeFunction calls**, bukan regex source code.

---

## 4. Compiler/Linter Gates

### TypeScript: Strict Mode untuk Phase 2 Tests

**Sebelum (3.A.1.5 — WEAK):**
```json
{
  "compilerOptions": {
    "noUnusedLocals": false,           // ❌ allow unused
    "noUnusedParameters": false,       // ❌ allow unused params
    "erasableSyntaxOnly": false,       // ❌ allow non-erasable
    "noFallthroughCasesInSwitch": false // ❌ allow fallthrough
  }
}
```

**Sesudah (3.A.1.6 — STRICT):**
```json
{
  "compilerOptions": {
    // All weakening overrides REMOVED
    // Inherits strict settings from tsconfig.app.json
  }
}
```

**Hasil:** `npm run typecheck:phase2-tests` → **0 errors**

### Linter: Zero Warnings

**Sebelum:** 8 warnings (unused vars/params)
**Sesudah:** 0 warnings, 0 errors

**Perbaikan:**
- Hapus import tidak dipakai (`BeneficialOwnerDraft`)
- Prefix parameter tidak dipakai dengan `_` (`_objectPath`, `_file`)
- Hapus dead code (`createMockFileInput`, `fileRef`, `useRef` import)

**Mini-kuis:** Kenapa tidak pakai `// eslint-disable`? Karena menyembunyikan masalah asli. Fix root cause (hapus kode tidak dipakai) lebih baik dari suppress warning.

---

## 5. Clean-Candidate Generated Artifacts (Rekonsiliasi Faktual oleh 3.A.1.8)

### Catatan penting

Versi sebelumnya dari bagian ini memuat **resep penambahan berkas (`staging`) historis yang tidak aman**. Perintah tersebut (yang menyarankan penambahan berkas seperti `corporateEvidenceService.ts`) adalah **contoh usang yang salah**: file tersebut sebenarnya tidak pernah masuk commit `12c0b4e657aed485e87801e0ac541f08a6a76c90` (commit 3.A.1.6). Bagian ini sudah direkonsiliasi oleh Batch 3.A.1.8 dan kemudian diperjelas lagi oleh Batch 3.A.1.9, agar mencerminkan kenyataan dan tidak menyarankan perintah yang bisa mengotori commit lain. Dokumen ini tidak lagi memuat instruksi yang dapat dieksekusi.

### Apa yang sebenarnya dikomit oleh 3.A.1.6

Output faktual dari `git show --name-only --format= 12c0b4e657aed485e87801e0ac541f08a6a76c90`:

```
MarkDown/Batches/BATCH_3_A_1_5.md
MarkDown/Batches/BATCH_3_A_1_5_DBS.md
MarkDown/Batches/BATCH_3_A_1_6.md
MarkDown/Batches/BATCH_3_A_1_6_DBS.md
MarkDown/SQL_SECURITY_SYMBOLS.md
MarkDown/SYMBOLS_MAP.md
justifiqa-frontend/test/beneficialOwnerEvidenceIntegration.test.ts
justifiqa-frontend/test/corporateIntakeModel.test.ts
justifiqa-frontend/test/useCorporateEvidenceUploads.test.ts
justifiqa-frontend/test/viteSsrTestHelper.ts
justifiqa-frontend/tsconfig.phase2-tests.json
```

Catatan faktual:

- `justifiqa-frontend/src/services/corporateEvidenceService.ts` **tidak masuk commit `12c0b4e`**. Versi DBS sebelumnya yang mencantumkannya dalam resep penambahan berkas historis adalah keliru.
- `justifiqa-frontend/test/viteSsrTestHelper.ts` **dipositif secara fisik** dalam `12c0b4e`, namun berada di luar *allowlist* dokumentasi 3.A.1.6 saat itu. Otorisasi eksplisit untuk helper ini diberikan kemudian oleh Batch 3.A.1.7 untuk tujuan tunggal: memuat komponen produksi nyata dan memastikan cleanup yang tahan pengecualian.

### Akar masalah: dirty-tree contamination pada generator

Generator peta simbol (`Tools/symbol_map_lib.mjs`) sebenarnya hanya memindai tiga akar tetap:

- `justifiqa-frontend/src` — berkas TypeScript/TSX.
- `database/migrations` — berkas SQL, hanya bila path itu ada.
- `supabase/migrations` — berkas SQL.

Generator **tidak** memindai `.agents/ponytail`, `.continue/`, mockup, diagram, atau artefak build. Direktori-direktori tersebut hanya relevan bagi manusia, bukan oleh generator. Kontaminasi yang muncul di peta simbol tidak mungkin datang dari direktori yang tidak dipindai; kontaminasi hanya mungkin datang dari **berkas kotor/untracked yang kebetulan berada di salah satu akar tetap di atas**. Ini menyederhanakan cerita: alasan prosedur clean-candidate tetap penting adalah untuk **mencegah berkas kotor di dalam akar tetap ikut terhitung**.

### Mengapa prosedur clean-candidate tetap relevan

Tanpa clean-candidate, generator akan memindai akar tetap dari working tree yang kotor. Jika ada berkas `.ts/.tsx/.sql` untracked di salah satu akar itu, simbol dari berkas untracked akan ikut muncul di peta simbol, sehingga peta tidak lagi merepresentasikan **snapshot commit kandidat**. Clean-candidate = menjalankan generator di snapshot `git write-tree` yang hanya berisi staged files, sehingga peta simbol benar-benar mencerminkan apa yang akan dikomit.

**Mini-kuis:** Mengapa direktori seperti `.agents/` tidak relevan bagi generator? Karena `Tools/symbol_map_lib.mjs` hanya menelusuri tiga akar tetap (`justifiqa-frontend/src`, `database/migrations`, `supabase/migrations`). Direktori lain tidak pernah disentuh; satu-satunya sumber kontaminasi adalah berkas yang hidup di dalam salah satu akar itu sendiri.

---

## 6. Mini-Kuis Ringkas

1. **Behavioral vs source-text:** Test yang render komponen produksi dan verifikasi click isolation = **Behavioral**. Test yang `readFileSync` + `includes` = **Source-text**.
2. **False-green:** Fake component test lolos tapi produksi bug karena fake component tidak share code dengan produksi.
3. **Single wrap:** `invokeFunction('finalize', { evidenceId, idempotencyKey })` — TANPA `body` wrapper.
4. **Compiler gates:** `npm run typecheck:phase2-tests` harus 0 error, `npm run lint` harus 0 warning.
5. **Clean candidate:** Generator jalan di `git archive <TREE_ID>` snapshot, bukan working tree.

---

## Status

**FAILED EXTERNAL AUDIT — SUPERSEDED BY 3.A.1.7** (bukan PASS). Butir 1 (ref-isolation) belum benar-benar tertutup di 3.A.1.6; ditutup oleh 3.A.1.7. Butir lainnya tetap valid.