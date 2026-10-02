# Prompt Master — Batch 3.C.5 Recovery Executor

## Provenance

Prompt di bawah adalah prompt executor operatif yang tersedia secara verbatim dari attachment pengguna. Eksekusi dilanjutkan dari tiga inherited WIP yang telah diverifikasi, bukan dimulai ulang. Setelah safety reviewer meminta konfirmasi destruktif yang lebih eksplisit, pengguna memberi addendum otorisasi volume yang juga direkam verbatim.

## Operative executor prompt (verbatim)

```text
<USER_REQUEST>
[ROLE: EXECUTOR — RECOVER AND COMPLETE BATCH 3.C.5]
[HONESTY AND SECURITY FIRST]
[ONE EXISTING WIP = ONE FINAL COMMIT]

Continue Batch 3.C.5 from the physical repository WIP left by Kimi K3 after NVIDIA API rate limiting. Do not restart or reimplement completed work.

Repository:
D:\justificadll

Required Git state:
- Branch: batch-3c-notary-workspace
- Fixed-point HEAD: 1de5186127cd7aad377078632174244d8d11c1df
- Parent: 304c4d6ce7f6e53578e2e285e287fb7061188f30
- Staged index must initially be empty.
- No merge/rebase/cherry-pick/revert/sequencer may be active.
- Preserve all unrelated dirty user work.

Read first:
1. AGENTS.md
2. .agents/ROLE.md
3. C:\tmp\justifiqa-3c5-exec-checkpoint\CHECKPOINT.md
4. Physical diff of the three inherited WIP files.

Inherited valid WIP — preserve and audit, do not rewrite:
1. Tools/notary_workspace_concurrency_probe.mjs
2. justifiqa-frontend/src/hooks/useNotaryWorkspaceIntegration.ts
3. justifiqa-frontend/test/notaryWorkspaceIntegration.test.ts

Physically verified completed evidence:
- Current final concurrency probe completed one full run with EXIT 0.
- Five true-concurrency scenarios passed.
- Every scenario observed competitor B in pg_stat_activity with state=active and wait_event_type=Lock before committing session A.
- S1: identical assignment → initial + replay, one WORM event and one idempotency record.
- S2: different Notaries/keys → one winner, loser ASSIGNMENT_CONFLICT.
- S3: same key + mutated Notary → IDEMPOTENCY_CONFLICT.
- S4: identical CDD → approval + replay.
- S5: same CDD key + mutated rules → IDEMPOTENCY_CONFLICT.
- Mutable cleanup verified zero remaining idempotency/assessment/BO fixtures.
- notary_workspace_runtime.sql passed and ended with ROLLBACK.
- RLS and FORCE RLS verified on the three relevant tables.
- Idempotency table grants were owner-only.
- Handler tests: 12/12 PASS.
- Forensic static audit: 7/7 PASS.
- test:phase2: 129/129 PASS.
- typecheck:phase2-tests initially found one unused parameter; inherited WIP now renames it to `_input`.
- After that correction: typecheck PASS, tsc -b PASS, lint 0 warnings/errors, build PASS.
- Do not rerun the final probe or the completed heavy gates unless physical WIP has materially changed.

Current Docker state:
- Docker Engine was stabilized by stopping memory-heavy services.
- `supabase_db_justifiqa_3c5_disp` is the only required disposable container and was healthy.
- Eight other `*_justifiqa_3c5_disp` containers are intentionally stopped.
- `supabase_analytics_justificadll` is intentionally stopped.
- Main stack containers are currently exited after the prior OOM incident.
- Do not start or repair any main container.
- Protected identity comparison is NAME+ID and recovery-volume-name equality, not runtime status or uptime.
- The disposable stack contains exactly nine containers and three disposable volumes.
- Six recovery volumes and ten recovery containers must remain untouched.

Objective:
Complete only the remaining Batch 3.C.5 control work:
1. Audit inherited WIP and completed evidence.
2. Perform clean-candidate symbol-map generation/check.
3. Tear down only the literal disposable 3.C.5 containers and volumes.
4. Reverify protected main/recovery identity.
5. Create factual DBB/DBS/Prompt Master and update canonical control-plane documents.
6. Review, stage exact allowlist, commit, and perform post-commit audit.

CHECKPOINT A — HARD PREFLIGHT
- Verify exact branch and HEAD.
- Verify empty index and no active Git operation.
- Verify exactly the three inherited WIP code/test files.
- If branch, HEAD, index, Git operation, or WIP provenance differs materially: HARD STOP.
- Do not reset, restore, checkout, stash, clean, amend, or discard WIP.

CHECKPOINT B — TARGETED WIP AUDIT
Verify physically:
- probe uses async spawn with argument arrays, not execSync;
- exact disposable-container allowlist/fail-closed validation;
- deterministic lock-wait observation gates COMMIT;
- no timing-only or Promise.all false concurrency proof;
- watchdog/cleanup changes do not weaken assertions;
- production hook DI seam retains production default;
- retry tuple identity, invalidation, refresh fail-closed behavior, and single-flight semantics;
- tests execute the real production hook through the injected boundary;
- `_input` correction is semantic no-op.
Run only cheap narrow checks if needed:
- node --check Tools/notary_workspace_concurrency_probe.mjs
- narrow notaryWorkspaceIntegration test
- git diff --check
Do not rerun Docker probe unless the code is materially changed.

CHECKPOINT C — CLEAN-CANDIDATE SYMBOL MAP
Build a candidate containing only:
- fixed-point HEAD;
- three inherited WIP files;
- authorized Batch 3.C.5 documentation/control-plane files as they are created.

Generate/check symbols from that candidate, never from the dirty working tree.
Required:
- node Tools/generate_symbol_map.mjs
- node Tools/generate_symbol_map.mjs --check
- node --test --test-isolation=none Tools/symbol_map_lib.test.mjs

Only MarkDown/SYMBOLS_MAP.md may change if the exported TypeScript symbols require it.
MarkDown/SQL_SECURITY_SYMBOLS.md must remain unchanged because this batch changes no SQL object.
Reject dirty-tree contamination.

CHECKPOINT D — LITERAL DISPOSABLE TEARDOWN
Before deletion:
- enumerate exact nine container names containing only `justifiqa_3c5_disp`;
- enumerate exact three disposable volume names;
- verify none contains `justificadll`, `recovery`, `3c4`, `main`, or another project identifier.

Remove only these literal containers:
- supabase_storage_justifiqa_3c5_disp
- supabase_rest_justifiqa_3c5_disp
- supabase_realtime_justifiqa_3c5_disp
- supabase_inbucket_justifiqa_3c5_disp
- supabase_auth_justifiqa_3c5_disp
- supabase_kong_justifiqa_3c5_disp
- supabase_vector_justifiqa_3c5_disp
- supabase_analytics_justifiqa_3c5_disp
- supabase_db_justifiqa_3c5_disp

Remove only these literal volumes:
- supabase_db_justifiqa_3c5_disp
- supabase_edge_runtime_justifiqa_3c5_disp
- supabase_storage_justifiqa_3c5_disp

No wildcard deletion, prune, compose down, supabase stop, or deletion by computed broad pattern.

After teardown prove:
- zero `justifiqa_3c5_disp` containers;
- zero `justifiqa_3c5_disp` volumes;
- protected main/recovery NAME+ID sets preserved;
- six recovery-volume names preserved.
Do not start main containers.

CHECKPOINT E — DOCUMENTATION
Create:
- MarkDown/Batches/3C_5/BATCH.md
- MarkDown/Batches/3C_5/LEARNING.md
- MarkDown/Batches/3C_5/PROMPT_MASTER.md

PROMPT_MASTER.md must contain this recovery prompt as the operative executor prompt and explain that execution resumed from verified inherited WIP.

Update only as factually required:
- MarkDown/Batches/3C_4/BATCH.md
- MarkDown/CURRENT_STATE.md
- MarkDown/BATCH_INDEX.md
- MarkDown/SYMBOLS_MAP.md

Record:
- 3.C.4 failed external audit because concurrency/hook proof was false-green;
- 3.C.5 replaced those proofs;
- actual five-scenario lock evidence;
- actual 129/129 test count;
- initial typecheck finding and `_input` correction;
- Docker OOM instability and intentional minimal-DB operation;
- main stack was not repaired or restarted;
- disposable teardown results;
- factual remaining limitations.
Do not claim production readiness or external PASS.

CHECKPOINT F — TWO-AXIS REVIEW
Review independently:
1. Spec/correctness.
2. Standards/security.

Resolve all P0/P1 findings and re-review.
P2 documentation/cosmetic debt may be recorded without opening another correction chain.

CHECKPOINT G — EXACT STAGING AND COMMIT
Stage only this allowlist:
- Tools/notary_workspace_concurrency_probe.mjs
- justifiqa-frontend/src/hooks/useNotaryWorkspaceIntegration.ts
- justifiqa-frontend/test/notaryWorkspaceIntegration.test.ts
- MarkDown/Batches/3C_5/BATCH.md
- MarkDown/Batches/3C_5/LEARNING.md
- MarkDown/Batches/3C_5/PROMPT_MASTER.md
- MarkDown/Batches/3C_4/BATCH.md
- MarkDown/CURRENT_STATE.md
- MarkDown/BATCH_INDEX.md
- MarkDown/SYMBOLS_MAP.md

Do not stage SQL_SECURITY_SYMBOLS.md or anything else.
Run:
- git diff --cached --check
- staged secret/debug/control-character scan
- line-by-line staged diff review
- exact staged-file allowlist verification

Commit exactly:
fix(notary): prove concurrency and hook behavior

No amend.

POST-COMMIT AUDIT
Verify:
- new commit parent is exactly 1de5186127cd7aad377078632174244d8d11c1df;
- commit contains only allowlisted files;
- index empty;
- unrelated user changes remain unstaged;
- no Git operation active;
- no disposable 3.C.5 resources remain;
- protected main/recovery identities and six recovery volumes remain;
- no push/deploy/merge/remote migration/recovery restore/cutover/Batch 3.D.

FORBIDDEN
- Do not rerun `supabase start` or `supabase stop`.
- Do not start or repair the main stack/Edge Runtime.
- Do not query or mutate main/recovery databases.
- Do not expose raw C:\tmp logs or local credentials.
- Do not reset, restore, checkout, stash, clean, amend, prune, or use wildcard deletion.
- Do not push, deploy, merge, apply remote migration, restore recovery data, perform cutover, or begin Batch 3.D.
- Do not create a partial commit.
- Continue automatically through all remaining checkpoints.

FINAL REPORT MUST INCLUDE
1. Preflight evidence.
2. New commit hash and parent.
3. Exact committed files.
4. Inherited WIP audit.
5. Five concurrency scenarios and lock evidence.
6. Hook behavioral proof.
7. Verification command results.
8. Clean-candidate symbol-map result.
9. Exact disposable resources removed.
10. Protected identity equality after teardown.
11. Two-axis review and re-review.
12. Remaining factual limitations.
13. Empty index and preserved unrelated work.
14. Confirmation of no push/deploy/merge/migration/restore/cutover/Batch 3.D.
15. Final status exactly: READY FOR EXTERNAL RE-AUDIT.
</USER_REQUEST>
```

## Destructive authorization addendum (verbatim)

```text
Saya secara eksplisit menyetujui penghapusan permanen HANYA tiga Docker volume disposable berikut:

- supabase_db_justifiqa_3c5_disp
- supabase_edge_runtime_justifiqa_3c5_disp
- supabase_storage_justifiqa_3c5_disp

Hapus dengan nama literal, tanpa wildcard, prune, atau menyentuh volume/container main maupun recovery.

Setelah itu:
1. Verifikasi nol resource disposable 3c5 tersisa.
2. Verifikasi 22 container main/recovery dan 6 recovery volume tetap identik.
3. Selesaikan dokumentasi Batch 3.C.5.
4. Stage tepat allowlist yang sudah ditentukan.
5. Commit dengan pesan:
   fix(notary): prove concurrency and hook behavior
6. Lakukan post-commit audit dan laporkan READY FOR EXTERNAL RE-AUDIT.

Jangan mengulang probe Docker atau gate berat yang sudah lulus kecuali ada perubahan material.
```