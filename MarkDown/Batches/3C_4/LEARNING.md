# DBS (Dokumen Belajar Sesi) — Batch 3.C.4: Close Workspace Proof and Privilege Gaps

## 1. Konteks dan Ringkasan Masalah

External audit terhadap Batch 3.C.3 menemukan 13 finding yang menghalangi penerimaan, termasuk:
1. Replay migrasi lokal tidak boleh berasumsi bersih tanpa pembuktian independen;
2. Sisa fixture probe 3.C.3 tertinggal di database lokal;
3. Hak istimewa direct DML `service_role` pada `notary_workspace_idempotency_records` dan `compliance_workflow_events_worm` harus dicabut total (RPC-only privilege boundary);
4. Concurrency probe hardcoded ke main database, tanpa cleanup try/finally, dan belum memvalidasi kondisi baris database secara tuntas;
5. Runtime SQL suite belum memverifikasi seluruh matriks penolakan/zero-write dan hak akses direct DML;
6. Test frontend memerlukan cakupan pengujian behavioral yang komprehensif;
7. Service frontend CDD retry belum meneruskan `assessmentId` eksplisit ke gateway;
8. Hook `useNotaryWorkspaceIntegration` `activeWorkspace` memiliki risiko fallback tidak aman saat `selectedCaseId` tidak ditemukan;
9. Sinkronisasi tipe resmi dan symbol map generator harus dijalankan melalui candidate bersih tanpa menyalin uncommitted user files.

## 2. Akar Masalah Teknis

1. **Privilege Boundary & Policy Leak**:
   - Kebijakan RLS permisif seperti `p_notary_idempotency_service_role` secara tidak sengaja mengizinkan `service_role` melakukan bypass RPC via direct REST insert/update pada tabel bukti idempotensi.
   - Tabel WORM `compliance_workflow_events_worm` dan bukti idempotensi harus beroperasi murni melalui fungsi `SECURITY DEFINER` milik database owner tanpa izin DML langsung bagi `service_role`, `authenticated`, `anon`, atau `PUBLIC`.
2. **Frontend Idempotency & Attempt Tracking**:
   - `CddAttempt` yang menyimpan `assessmentId` harus memvalidasi kesesuaian `assessmentId` tersebut secara eksplisit di level `phase2IntegrationService` sebelum meneruskan ke gateway.
   - Fallback `activeWorkspace` harus fail-closed (`null`), bukan `list[0]`, apabila perkara yang dipilih tidak lagi ditemukan di dalam daftar server yang disegarkan.
3. **Disposable Verification Protocol**:
   - Pengujian SQL atomicity dan race condition concurrency harus dijalankan pada container terisolasi yang disposable, memverifikasi tidak hanya HTTP status code tetapi juga jumlah baris database, status mutasi, dan idempotency record yang tercipta.

## 3. Tindakan Korektif yang Diterapkan

1. **Forward Migration (`20260824071758_close_notary_workspace_proof_and_privilege_gaps.sql`)**:
   - Mencabut seluruh izin direct `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` pada `public.notary_workspace_idempotency_records` dan `public.compliance_workflow_events_worm` dari `PUBLIC, anon, authenticated, service_role`.
   - Menghapus policy permisif `p_notary_idempotency_service_role`.
   - Mengukuhkan pembatasan mutasi kolom `assigned_notary_id` dan `current_stage` pada `corporate_service_cases`.
   - Memastikan eksekusi RPC `fn_assign_corporate_notary_atomic` dan `fn_approve_notary_cdd_atomic` dibatasi secara ketat hanya untuk `service_role`.
2. **Runtime Matrix & Concurrency Probe**:
   - Memperluas `Tools/notary_workspace_runtime.sql` untuk mencakup seluruh matriks penolakan assignment dan CDD dengan asersi zero-write, asersi atomisitas, asersi idempotency conflict, asersi direct DML denial untuk `service_role` dan non-admin, dan diakhiri dengan `ROLLBACK`.
   - Memperbarui `Tools/notary_workspace_concurrency_probe.mjs` agar menerima nama container dinamis (`DISPOSABLE_DB_CONTAINER`), gagal fail-closed dengan exit code 1 bila konfigurasi tidak tersedia, menguji 5 skenario konkurensi terkunci dengan asersi baris tabel, dan membersihkan fixture dalam blok `finally`.
3. **Frontend Service & Hook Hardening**:
   - `phase2IntegrationService.approveNotaryCdd` menerima parameter `assessmentId?: string`, memvalidasi format UUID-nya, memastikan kecocokannya dengan assessment kanonik workspace, dan meneruskannya ke gateway.
   - `useNotaryWorkspaceIntegration` mengembalikan `activeWorkspace = null` jika `selectedCaseId` tidak ditemukan dalam data server, menjaga `currentAttempt` tetap stabil pada retry yang sama, dan menginvalidasi attempt jika `caseId` atau `assessmentId` berganti.
   - Menambahkan unit dan behavioral tests di `justifiqa-frontend/test/notaryWorkspaceIntegration.test.ts` (total 121 tests passed).
4. **Symbol Maps & Cleanup**:
   - Menghasilkan `MarkDown/SYMBOLS_MAP.md` dan `MarkDown/SQL_SECURITY_SYMBOLS.md` melalui candidate bersih dari HEAD + authorized batch files, menjaga file uncommitted pengguna tetap utuh tanpa kontaminasi.
   - Membersihkan stack disposable container dan sisa direktori sementara.

## 4. Pelajaran untuk Batch Selanjutnya

1. **Strict RPC-Only Invariant**: Tabel WORM audit dan idempotency ledger tidak boleh memiliki policy atau grant DML langsung kepada role caller apapun, termasuk `service_role`. Akses hanya boleh melalui `SECURITY DEFINER` functions yang tervalidasi.
2. **Fail-Closed Workspace Selection**: Di frontend, saat entity terpilih tidak ditemukan pada query refresh, jangan pernah fallback ke item pertama; selalu kembalikan `null` untuk mencegah aksi tidak sengaja pada data yang salah.
3. **Candidate Map Generation**: Selalu gunakan isolasi candidate saat membuat symbol map bila working tree pengguna sedang aktif, agar file kerja pengguna tidak terserap ke dalam peta simbol.
