# Batch 3.A.1.3 DBS — Mengapa Evidence Replay dan Validation Boundary Harus Ditingkatkan

## 1. Ambiguous Success pada Operasi Jaringan

Saat mengunggah file ke Supabase Storage dengan `upsert:false`, ada kemungkinan **race condition jaringan**: object benar-benar tersimpan di server, tetapi respons HTTP tidak pernah sampai ke client (timeout, koneksi terputus, proxy drop). Client mengira gagal dan mempertahankan checkpoint `PREPARED`. Saat user klik *Retry*, client mengirim request upload ulang ke path yang sama. Storage mengembalikan `409 Conflict` dengan statusCode `ResourceAlreadyExists` (atau `KeyAlreadyExists` / legacy `already_exists`).

**Masalah:** Implementasi sebelumnya memperlakukan **semua** `409` atau object dengan `code: 'ResourceAlreadyExists'` sebagai error biasa, sehingga finalize tidak pernah dipanggil.

**Solusi:** Hanya menerima `StorageApiError` resmi dari `@supabase/supabase-js` dengan `status === 409` **dan** `statusCode` dalam allowlist `{ResourceAlreadyExists, KeyAlreadyExists, already_exists}`. Arbitrary object `{status:409, statusCode:'ResourceAlreadyExists'}` ditolak. Generic `409` dengan statusCode lain ditolak. Setelah duplicate diterima: checkpoint diubah ke `UPLOADED`, finalize dilanjutkan. Finalize server tetap menjadi validator otoritatif (ownership, path, ukuran, MIME, magic bytes, digest).

> **File:** `corporateEvidenceService.ts` — `parseStorageDuplicateCode`, `isStorageApiError`, `uploadEvidence`  
> **Test:** `useCorporateEvidenceUploads.test.ts` — 7 test behavioural ambiguous success

## 2. Mengapa `upsert:false` Tetap Dipertahankan

`upsert:true` akan menimpa object yang sudah ada tanpa error. Ini berbahaya karena:
- Menghilangkan proteksi idempotency — retry bisa menimpa file orang lain jika path collision
- Finalize server memvalidasi ownership dan digest; `upsert:true` memungkinkan *time-of-check-to-time-of-use* (TOCTOU) di mana file diganti setelah prepare tapi sebelum finalize
- Audit trail butuh bukti object tidak berubah setelah prepare

Dengan `upsert:false` + duplicate handling yang benar, kita mendapatkan: **exactly-once semantics** untuk upload, finalize tetap validator otoritatif.

## 3. Duplicate Storage Bukan Otomatis Aman

Hanya `StorageApiError` instance dengan statusCode allowlisted yang dianggap *ambiguous success*. Alasan:
- `FunctionsHttpError`, `FunctionsRelayError`, `FunctionsFetchError` bisa memiliki context mirip tapi bukan Storage error
- Arbitrary object dari kode bisa saja meniru struktur tapi bukan error asli
- Network error biasa (ECONNRESET, timeout) tidak punya statusCode

Parser hanya mempercayai `error instanceof StorageApiError` + `error.status === 409` + `error.statusCode in allowlist`.

## 4. Finalize sebagai Authoritative Verifier

Setelah duplicate diterima dan checkpoint jadi `UPLOADED`, `finalizeEvidence` dipanggil. Edge Function `corporate-evidence/finalize`:
- Memverifikasi ownership (evidenceId milik client yang benar)
- Memverifikasi path, ukuran, MIME, magic bytes, SHA-256 digest
- Mengembalikan `evidenceReference` (UUID) yang hanya valid jika semua check lolos

Jadi meski client "lolos" duplicate check, finalize tetap bisa menolak jika file tidak valid. Duplicate handling hanya memungkinkan *retry* sampai ke finalize, bukan *bypass* validasi.

## 5. Validasi pada Public Service Boundary

`submitCorporateIntake` adalah boundary publik dari service Corporate Intake. Validasi `orderId` dan `idempotencyKey` (UUID pattern) harus dilakukan **sebelum** side effect apapun:
- `toIntakePayload`
- `canonicalPayloadFingerprint`
- `inFlightIntake` Map lookup/insertion
- `requireActor` (gateway call)
- `gateway.invokeCorporateIntake`

Jika invalid → `Phase2IntegrationError('INVALID_PAYLOAD')` dilempar, **tanpa** actor/gateway call, **tanpa** Map entry. Ini mencegah:
- Pollution `inFlightIntake` dengan key invalid
- Actor call yang tidak perlu (latency, rate limit)
- Race condition pada Map cleanup

> **File:** `phase2IntegrationService.ts` — `submitCorporateIntake` awal validasi UUID  
> **Test:** `intakeIdempotencyConflict.test.ts` — 3 test invalid identifier rejection

## 6. Factory State vs Module-Level Singleton

`EMPTY_INTAKE_DRAFT` sebelumnya adalah `const` module-level. Setiap `useState(EMPTY_INTAKE_DRAFT)` berbagi **referensi objek yang sama**, termasuk `clientRowId` yang di-generate sekali saat module load. Dua Wizard instance akan punya `beneficialOwners[0].clientRowId` identik → React key collision, state corruption.

**Solusi:** Factory `createEmptyCorporateIntakeDraft(createId?)` yang menghasilkan **objek baru** setiap pemanggilan. `createId` opsional untuk test deterministik. Wizard memakai lazy init: `useState(() => createEmptyCorporateIntakeDraft())`.

> **File:** `corporateIntake.ts` — `createEmptyCorporateIntakeDraft`  
> **File:** `CorporateIntakeWizard.tsx` — `useState(() => createEmptyCorporateIntakeDraft())`  
> **Test:** `corporateIntakeModel.test.ts` — `addBeneficialOwner` menghasilkan `clientRowId` unik

## 7. React Ref vs Global DOM Lookup

`BeneficialOwnerEvidencePanel` sebelumnya:
```tsx
const inputId = `owner-evidence-${clientRowId}`;
<input id={inputId} ... />
<Button onClick={() => document.getElementById(inputId)?.click()} />
```

Masalah: `clientRowId` bukan jaminan keunikan DOM global (bisa collision di luar panel, SSR mismatch, portal). Global lookup juga brittle saat struktur DOM berubah.

**Solusi:** `useRef<HTMLInputElement>`:
```tsx
const fileInputRef = useRef<HTMLInputElement>(null);
<input ref={fileInputRef} ... />
<Button onClick={() => fileInputRef.current?.click()} />
```

Ref terikat pada instance komponen, tidak bocor ke DOM global, aman untuk multiple panel, SSR, dan test (react-test-renderer `createNodeMock` untuk ref).

> **File:** `BeneficialOwnerEvidencePanel.tsx` — `useRef`  
> **File:** `BeneficialOwnerFields.tsx` — hapus `clientRowId` prop  
> **Test:** `useCorporateEvidenceUploads.test.ts` — ref isolation tests (existing)

## 8. Perbedaan Runtime Test dan TypeScript Test Typecheck

- `npm run test:phase2` — menjalankan **runtime test** (Node.js test runner). Validasi perilaku: state machine, retry logic, error parsing, React rendering.
- `npm run typecheck:phase2-tests` — menjalankan `tsc --noEmit` pada `tsconfig.phase2-tests.json` yang `include: ["src", "test"]`. Validasi **static types**: tidak ada `any` implisit, `globalThis` declarations, unused locals/params.

Keduanya wajib lulus. Runtime test hijau tapi typecheck merah = ada bug tipe yang akan muncul di production. Typecheck hijau tapi runtime merah = logika salah meski tipe benar.

## 9. Mini-Kuis / Checklist

- [ ] Upload `upsert:false` tetap dipertahankan?
- [ ] Duplicate handling hanya untuk `StorageApiError` instance dengan `status===409` dan `statusCode` allowlisted?
- [ ] Arbitrary object `{status:409, statusCode:'ResourceAlreadyExists'}` ditolak?
- [ ] Generic `409` dengan statusCode lain ditolak?
- [ ] `orderId` dan `idempotencyKey` divalidasi UUID di awal `submitCorporateIntake`?
- [ ] Invalid identifier tidak memanggil actor/gateway/Map?
- [ ] `createEmptyCorporateIntakeDraft` menghasilkan `clientRowId` baru tiap call?
- [ ] `CorporateIntakeWizard` memakai lazy init `useState(() => createEmptyCorporateIntakeDraft())`?
- [ ] `BeneficialOwnerEvidencePanel` memakai `useRef` bukan `document.getElementById`?
- [ ] `tsconfig.phase2-tests.json` extend `tsconfig.app.json`, include `src` dan `test`?
- [ ] `test/test-globals.d.ts` deklarasi `globalThis.IS_REACT_ACT_ENVIRONMENT`?
- [ ] `npm run typecheck:phase2-tests` lulus tanpa error?
- [ ] `npm run test:phase2` 103 test lulus?
- [ ] Handler tests (intake 21, evidence 10) lulus?
- [ ] Symbol map generate/check/test lulus?
- [ ] `npx tsc -b`, `npm run lint`, `npm run build` lulus?
- [ ] Tidak ada file unrelated di-staged?

**Catatan:** Dokumentasi ini digantikan oleh BATCH_3_A_1_4_DBS.md.