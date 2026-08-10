# Batch 3.A.1.5 DBS — Mengapa Finalize Contract dan Verification Artifact Harus Dibenarkan

## Latar Belakang

External audit commit `cc05bcf` menemukan **empat kegagalan nyata** yang harus diperbaiki sebelum lanjut ke Batch 3.B. Batch 3.A.1.5 memperbaiki semuanya, **NAMUN external audit menemukan bahwa perbaikan tidak lengkap**.

---

## 1. Finalize Payload Double-Wrapped

**Masalah:** Di `corporateEvidenceService.ts`, method `finalize` memanggil `deps.invokeFunction` dengan payload yang dibungkus `body` dua kali:

```typescript
// createDefaultDependencies().invokeFunction sudah melakukan:
supabase.functions.invoke(path, { body })

// Tapi finalize memanggil:
deps.invokeFunction('corporate-evidence/finalize', {
  body: { evidenceId: input.evidenceId, idempotencyKey: input.idempotencyKey },  // ❌ double wrap
})
```

Hasilnya payload yang dikirim ke Edge Function: `{ body: { body: { evidenceId: "...", idempotencyKey: "..." } } }`

**Solusi:** Hapus wrapper `body` di pemanggilan `invokeFunction`:

```typescript
const { data, error } = await deps.invokeFunction('corporate-evidence/finalize', {
  evidenceId: input.evidenceId,
  idempotencyKey: input.idempotencyKey,
});
```

**Contoh kecil:**
```ts
// ❌ Salah - double wrap
invokeFunction('path', { body: { a: 1 } })
// invokeFunction internal: supabase.functions.invoke('path', { body: { body: { a: 1 } } })

// ✅ Benar - single wrap
invokeFunction('path', { a: 1 })
// invokeFunction internal: supabase.functions.invoke('path', { body: { a: 1 } })
```

**Mini-kuis:** Mengapa `createDefaultDependencies().invokeFunction` sudah wrap `body`? Karena `supabase.functions.invoke` signature-nya adalah `invoke(path, { body })`. Jadi pemanggil tidak perlu wrap lagi.

---

## 2. Ref-Isolation Test Tidak Merender Komponen Produksi

**Masalah:** Test `BeneficialOwnerEvidencePanel ref isolation` menggunakan komponen test double (`TestPanelA`, `TestPanelB`), bukan komponen produksi `BeneficialOwnerEvidencePanel`. External audit menilai ini bukan behavioral test yang valid.

**Solusi yang Diterapkan di Batch 3.A.1.5 (TIDAK CUKUP):** Karena Node.js test runner tidak bisa import `.tsx` langsung, ditambah test verifikasi source code yang:
1. Membaca file `BeneficialOwnerEvidencePanel.tsx`
2. Memverifikasi `useRef<HTMLInputElement>` digunakan
3. Memverifikasi `fileInputRef.current?.click()` digunakan
4. Memverifikasi `document.getElementById` **tidak** digunakan
5. Memverifikasi `ref={fileInputRef}` attached ke input element

**Contoh kecil:**
```ts
// test verifikasi source code
const source = readFileSync(componentPath, 'utf8');
assert.ok(source.includes('useRef<HTMLInputElement>'));
assert.ok(source.includes('fileInputRef.current?.click()'));
assert.ok(!source.includes('document.getElementById'));
assert.ok(source.includes('ref={fileInputRef}'));
```

**Mini-kuis:** Kenapa tidak bisa import `.tsx` di Node.js test? Karena Node.js native ESM tidak support TypeScript/JSX tanpa transpiler. Test runner pakai `node --test` tanpa Vite/bundler.

**Catatan Audit:** Verifikasi source code **bukan** behavioral test. External audit meminta test yang benar-benar me-render komponen produksi dan memverifikasi perilaku ref isolation secara aktual.

---

## 3. Symbol Map Terkontaminasi Dirty Working Tree

**Masalah:** Symbol map generator dijalankan di working tree kotor (ada file user untracked, deleted diagrams, dll) → output map mencantumkan file yang bukan bagian repo → `git diff --check` gagal.

**Solusi:** Clean candidate tree:
1. Stage hanya source/test/docs batch (bukan generated maps)
2. `git write-tree` → dapat `TREE_ID`
3. `git archive <TREE_ID>` → materialisasikan snapshot bersih di temp dir
4. Jalankan generator di snapshot bersih
5. Copy back hanya `SYMBOLS_MAP.md` dan `SQL_SECURITY_SYMBOLS.md`
6. Stage kedua map tersebut
7. `git write-tree` lagi → final candidate → `git archive` → jalankan `--check` dan library tests

**Contoh kecil:**
```bash
# Stage hanya file batch
git add justifiqa-frontend/src/services/corporateEvidenceService.ts \
        justifiqa-frontend/test/beneficialOwnerEvidenceIntegration.test.ts \
        MarkDown/Batches/BATCH_3_A_1_5.md \
        MarkDown/Batches/BATCH_3_A_1_5_DBS.md

# Clean candidate
TREE_ID=$(git write-tree)
git archive $TREE_ID | tar -x -C /tmp/clean-snapshot
cd /tmp/clean-snapshot
node Tools/generate_symbol_map.mjs
cp MarkDown/SYMBOLS_MAP.md MarkDown/SQL_SECURITY_SYMBOLS.md $REPO_ROOT/MarkDown/
cd $REPO_ROOT
git add MarkDown/SYMBOLS_MAP.md MarkDown/SQL_SECURITY_SYMBOLS.md

# Verify
node Tools/generate_symbol_map.mjs --check
node --test --test-isolation=none Tools/symbol_map_lib.test.mjs
```

**Mini-kuis:** Kenapa tidak cukup `git status` bersih? Karena working tree user ada file untracked/deleted yang tidak mau di-commit tapi generator tetap baca kalau jalan dari root.

---

## 4. DBB/DBS Stale serta git diff --check Gagal

**Masalah:** Dokumentasi tidak mencerminkan state aktual, ada trailing whitespace, quality gates tidak lulus.

**Solusi:**
- Update `BATCH_3_A_1_5.md` dan `BATCH_3_A_1_5_DBS.md` faktual
- Hapus trailing whitespace
- Jalankan `git diff --check` pada staged files
- Pastikan semua gate lulus: test, typecheck, build, lint, handler tests, symbol map

**Mini-kuis:** Apa yang diverifikasi `git diff --check`? Trailing whitespace, indent dengan spasi bukan tab, non-ASCII characters, dll.

---

## 5. Mini-Kuis Ringkas

1. **Finalize payload:** `invokeFunction('finalize', { body: { ... } })` vs `invokeFunction('finalize', { ... })` — mana yang benar? **Tanpa `body` wrapper**
2. **Ref verification:** Test apa yang verifikasi komponen produksi pakai `useRef`? **Source code verification test** (di batch ini), **Behavioral render test** (di Batch 3.A.1.6)
3. **Clean candidate:** Generator dijalankan di snapshot dari `git archive <TREE_ID>`, bukan working tree langsung.
4. **Export singleton:** `EMPTY_INTAKE_DRAFT` masih diekspor? **Tidak, sudah dihapus di batch sebelumnya, diganti factory.**

---

## External Audit Findings (Batch 3.A.1.5 GAGAL)

| # | Temuan | Mengapa Gagal |
|---|--------|---------------|
| 1 | Fake/source-text tests | Test ref-isolation pakai `TestPanelA`/`TestPanelB` fake, bukan komponen produksi |
| 2 | No exact finalize payload regression | Tidak ada test yang capture payload prepare/finalize aktual |
| 3 | Lint 8 warnings | Unused vars/params di test files |
| 4 | git diff --check fail | Whitespace issues di working tree |
| 5 | Symbol map contaminated | Generator jalan di dirty tree, include unrelated files |
| 6 | DBB stale after commit | Docs tidak match committed state |

---

## Status

**SUPERSEDED BY BATCH 3.A.1.6** — Batch ini GAGAL external audit. Lihat `BATCH_3_A_1_6_DBS.md` untuk versi terbenar.