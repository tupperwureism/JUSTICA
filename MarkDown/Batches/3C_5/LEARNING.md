# DBS — Batch 3.C.5: Bukti Konkurensi Nyata dan Hook Fail-Closed

## Mengapa `Promise.all` belum tentu concurrent

`Promise.all` hanya menggabungkan promise. Jika setiap pekerjaan menjalankan API sinkron seperti `execSync`, event loop tetap diblokir dan pekerjaan kedua baru mulai setelah pekerjaan pertama selesai. Probe 3.C.5 memakai dua proses `psql` persisten dari [`Tools/notary_workspace_concurrency_probe.mjs`](../../../Tools/notary_workspace_concurrency_probe.mjs). Session B dikirim saat transaksi A masih terbuka, lalu monitor PostgreSQL wajib melihat B sedang menunggu lock sebelum A boleh COMMIT.

Pelajarannya: bukti race condition memerlukan barrier yang mengamati overlap nyata, bukan sekadar dua fungsi yang diletakkan di `Promise.all` atau jeda waktu.

## Lock observation sebagai causal gate

Probe memeriksa `pg_stat_activity` dan menerima bukti hanya bila competitor B memiliki `state='active'` dan `wait_event_type='Lock'`. COMMIT A berada setelah observasi itu. Urutan kausalnya adalah:

1. A membuka transaksi dan menyelesaikan RPC sambil menahan lock;
2. B memulai RPC yang bersaing;
3. monitor melihat B blocked pada lock;
4. baru kemudian A COMMIT;
5. B menghasilkan replay atau conflict yang diharapkan.

Timeout dan polling hanya watchdog transport. Durasi bukan bukti konkurensi.

## Idempotency attempt adalah satu tuple

Pada [`useNotaryWorkspaceIntegration.ts`](../../../justifiqa-frontend/src/hooks/useNotaryWorkspaceIntegration.ts), attempt CDD bukan hanya idempotency key. Identitas lengkapnya adalah `caseId`, `assessmentId`, `rulesVersion`, dan `idempotencyKey`. Retry harus mengirim tuple yang sama; perubahan case, assessment, atau rules membuat attempt lama tidak valid.

Ini mencegah key lama dipakai untuk payload baru. Fresh execute setelah invalidasi membuat key baru dari state kanonik terbaru.

## Dependency injection yang sempit

Hook menerima `NotaryWorkspaceService`, yaitu `Pick` dari service produksi yang hanya memuat tiga method yang benar-benar dipakai. Default argument tetap `phase2IntegrationService`, sehingga caller produksi tidak berubah. Test di [`notaryWorkspaceIntegration.test.ts`](../../../justifiqa-frontend/test/notaryWorkspaceIntegration.test.ts) merender hook asli dan hanya mengganti boundary I/O.

DI seperti ini berguna karena test membuktikan state transition hook—loading, retry, reset, refresh, dan single-flight—tanpa membuat salinan logika produksi atau membuka privileged browser boundary.

## Refresh setelah mutation harus fail-closed

RPC sukses belum cukup untuk membuat UI mengklaim sukses. Hook menyegarkan daftar kanonik dan memeriksa exact case, exact assessment, stage `DOCUMENTS_PENDING`, dan decision `APPROVED`. Refresh gagal, case hilang, atau stage/decision salah membuat mutation berstatus error. Saat selected case hilang, workspace menjadi `null`, bukan berpindah diam-diam ke item pertama.

## Clean candidate pada working tree kotor

Generator symbol map tidak boleh membaca ratusan perubahan pengguna yang tidak termasuk batch. Candidate dibentuk dari fixed-point HEAD, lalu hanya tiga WIP diotorisasi yang ditimpa. Hasilnya menambahkan satu export TypeScript dan mempertahankan hash SQL map. Ini membedakan "generator berhasil" dari "generator berhasil atas input yang benar".

## Teardown dengan allowlist literal

Resource disposable dihapus hanya setelah nama aktual sama persis dengan allowlist dan tidak mengandung identifier main/recovery. Penghapusan volume memerlukan persetujuan eksplisit karena permanen. Setelah teardown, equality NAME+ID container terlindungi dan daftar recovery volume dibandingkan kembali dengan baseline.
