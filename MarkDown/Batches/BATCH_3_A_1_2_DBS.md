# Batch 3.A.1.2 DBS — Mengapa Retry dan Error Parsing Harus Nyata

## 1. `FunctionsHttpError` adalah respons HTTP

Supabase membedakan `FunctionsHttpError`, `FunctionsRelayError`, dan
`FunctionsFetchError`. Hanya jenis pertama membawa application response yang
dapat diperiksa. Parser aman menerima instance `FunctionsHttpError`, clone
`Response`, membaca JSON secara async, lalu memeriksa allowlist. Object buatan
seperti `{ code: 'IDEMPOTENCY_CONFLICT' }` ditolak. Message, detail, hint, stack,
JWT, dan detail SQL tidak diteruskan.

## 2. Checkpoint membuat retry resumable

```text
NEW --prepare--> PREPARED --upload--> UPLOADED --finalize--> FINALIZED
```

- gagal di `NEW`: ulang prepare dengan ID sama;
- gagal di `PREPARED`: ulang upload dengan `objectPath` tersimpan;
- gagal di `UPLOADED`: ulang finalize saja;
- `FINALIZED`: retry tidak melakukan network.

Dummy File atau path kosong menyamarkan state korup, sehingga state yang tidak
lengkap harus fail-closed dengan pesan aman.

## 3. React state dan ref punya tugas berbeda

Progress, error, checkpoint, dan reference berada di reducer karena state itulah
yang harus memicu render. Ref hanya menjadi lookup internal current attempt untuk
menilai apakah completion asinkron masih memiliki row.

## 4. Stable row identity dan generation guard

Array index berubah ketika row dihapus. `clientRowId` dibuat sekali bersama row
dan dipakai untuk React key, task, update, remove, serta callback finalisasi. Setiap
action async juga membawa `evidenceId`; reducer menerapkan patch hanya bila ID itu
masih attempt aktif. File lama, row terhapus, dan reverse completion tidak dapat
menulis ke row yang salah. `clientRowId` tidak dikirim ke backend.

## 5. Idempotency berbeda dari single-flight

Idempotency adalah kontrak replay server. Single-flight adalah deduplikasi client
selama Promise aktif:

```text
idempotencyKey → { orderId, canonicalPayloadFingerprint, promise }
```

Key dan payload identik berbagi Promise. Key sama dengan order atau payload
berbeda adalah conflict lokal dan tidak menghasilkan gateway call kedua.

## 6. Test hijau palsu

`assert.ok(true)`, pemeriksaan source text, atau sleep tebakan tidak membuktikan
behavior. Test batch memakai gateway seam, controlled Promise, call counter, real
`Response`, reducer render state, serta output presentational runtime.

## 7. Clean-candidate symbol map

Working tree pengguna sangat kotor. Candidate dibentuk dari staged index melalui
`write-tree` + `archive`; generator berjalan pada tree itu sehingga map committed
tidak memuat file untracked/deletion pengguna.

## Mini-checklist

- [ ] Parser hanya menerima `FunctionsHttpError` allowlisted.
- [ ] Retry tidak membuat evidence/idempotency ID baru.
- [ ] Async patch membawa row ID dan evidence ID.
- [ ] `clientRowId` tidak ada di payload backend.
- [ ] Konflik single-flight tidak memanggil gateway kedua.
- [ ] Symbol map berasal dari staged clean candidate.
