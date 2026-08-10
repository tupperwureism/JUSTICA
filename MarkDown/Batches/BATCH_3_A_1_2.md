# Batch 3.A.1.2 — Evidence Retry and Intake Error Recovery

## Status

- Fixed point: `490ca2691f7004cc941896ad5670a343aab3724c`
- Branch: `batch-3a-corporate-intake`
- Scope: forward correction lokal; tanpa deploy, push, merge, migration, atau Batch 3.B
- External Controller Audit: **PENDING**

## Latar Belakang dan WIP Warisan

Batch memulihkan 14 path WIP GLM 5.2: tiga file modified dan sebelas file
untracked. Baseline controller direproduksi tepat pada 69/72 test pass dengan
tiga RED:

1. idempotency key sama dengan `orderId` berbeda tidak fail-closed;
2. identifier sama dengan payload berbeda tidak fail-closed;
3. finalisasi File A yang terlambat menimpa File B.

Baseline tambahan: typecheck gagal karena `useRef` tidak terpakai; lint memiliki
7 warning. Lima artefak eksperimen `_debug*`/`_tmpReducerDebug` dibuang sesuai
daftar eksplisit prompt dan tidak diganti dengan test hijau palsu.

## Checkpoint Implementasi

### C1 — Error boundary Supabase

- `FunctionsHttpError.context` dibaca asinkron melalui `clone().json()`.
- Hanya body object dengan `code` string allowlisted yang diterima.
- Relay/fetch/plain error, body rusak, unknown code, dan arbitrary object `.code`
  menghasilkan fallback aman.
- Parser evidence memakai pola yang sama; kode Storage dipisahkan ke allowlist
  Storage yang sempit.
- Gateway intake menunggu parser sebelum memetakan error UI.

### C2 — Single-flight intake

- Map dikunci oleh `idempotencyKey` dan menyimpan `orderId`, canonical payload
  fingerprint, serta Promise aktif.
- Replay identik berbagi Promise dan satu gateway call.
- Perbedaan order atau fingerprint ditolak lokal sebagai
  `INTAKE_IDEMPOTENCY_CONFLICT` tanpa call kedua.
- Cleanup memakai identitas Promise agar tidak menghapus entry baru.

### C3 — Evidence state machine

- `BeneficialOwnerDraft.clientRowId` dibuat sekali ketika row dibuat dan dipakai
  sebagai React key/task key serta target add/remove/update.
- Hook production memakai reducer observable dengan checkpoint
  `NEW → PREPARED → UPLOADED → FINALIZED`.
- Retry mempertahankan `evidenceId`, `idempotencyKey`, File, dan `objectPath`;
  step yang sudah sukses tidak diulang.
- Setiap patch asinkron membawa `clientRowId` dan `evidenceId`; reducer serta
  current-attempt lookup menolak completion attempt lama atau row yang dihapus.
- Tidak ada dummy File atau object path kosong.

### C4 — UI production

- `BeneficialOwnerFields` memakai hook production dan tidak mengakses Supabase.
- Progress per row memakai `role=status`/`aria-live`; error memakai `role=alert`;
  retry, replacement file, nama file, dan evidence reference ditampilkan.
- Completion mengubah draft melalui functional updater terhadap state terbaru.
- `clientRowId` tidak masuk payload Edge Function karena pemetaan payload explicit.

## Test yang Dibuat/Diperbaiki

- Real `FunctionsHttpError` + `Response`, malformed/unknown body, relay/fetch,
  arbitrary `.code`, dan non-leakage detail.
- Retry count dan stable ID untuk ketiga checkpoint.
- Observable React state, reverse completion, replacement race, removal race,
  serta attempt baru.
- Single-flight exact replay dan dua bentuk conflict tanpa gateway call kedua.
- Presentational feedback runtime untuk progress, safe error, dan retry control.
- Tipe gateway test memakai `declaredMime`, `declaredByteSize`, dan `contentType`.

## Verifikasi Aktual

- `npm run test:phase2` — 81/81 pass.
- `npx tsc -b` — pass.
- `npm run lint` — pass, 0 warning.
- Corporate Intake handler — 21/21 pass.
- Corporate Evidence handler — 10/10 pass.
- `npm run build` — pass; hanya warning chunk size/dynamic-import Vite yang tidak
  mengubah exit status.
- Review spec/security dan React/Supabase menemukan celah conflict ordering,
  response correlation, retry single-flight, controlled test, UI integration,
  dan semantics accessibility; seluruh temuan diperbaiki dan re-review bersih.
- Clean-candidate symbol generation/check — pass; archive memakai
  `core.autocrlf=false` agar blob LF tetap deterministik pada host Windows.
- Symbol-map library test — 7/7 pass.
- Secret scan dan staged audit dicatat pada handoff commit setelah seluruh gate
  staging selesai.

## Batasan

- State retry evidence hanya hidup selama sesi halaman; persistensi lintas reload
  bukan scope batch ini.
- Test React menampilkan deprecation notice dari `react-test-renderer`; bukan
  warning lint dan tidak mengubah assertion.
- Tidak ada perubahan migration/RPC/RLS/ACL, payment webhook, Notary, e-KYC,
  Qualifa, atau Edge Function Batch 3.B.

## Next Exact Action

Jalankan external controller re-audit terhadap commit koreksi batch ini. Jangan
memulai Batch 3.B sebelum audit eksternal memberi keputusan baru.
