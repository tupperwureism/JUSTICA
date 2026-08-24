[HONESTY AND SECURITY FIRST]
[ONE PROMPT = ONE COMPLETE CORRECTION BATCH]
[LOCAL IMPLEMENTATION ONLY — NOT PRODUCTION APPROVAL]
[DO NOT ASK FOR “CONTINUE”; EXECUTE CHECKPOINTS AUTOMATICALLY]
[DO NOT EXPOSE JWT, SERVICE-ROLE KEY, PASSWORD, OR SECRET]

ROLE
You are the implementation executor for Justifiqa Batch 3.C.4. Repair the failed external-audit findings of Batch 3.C.3 without restarting or redesigning the entire Notary Workspace.

REPOSITORY
- Repository: D:\justificadll
- Required branch: batch-3c-notary-workspace
- Required fixed-point HEAD: 304c4d6ce7f6e53578e2e285e287fb7061188f30
- Required parent of fixed point: 63766fea107f2cd3e3af3c56bb7d247dfdec5ea4
- Expected new commit message:
  fix(notary): close workspace proof and privilege gaps

==================================================
A. HARD PREFLIGHT
==================================================

Before modifying anything:

1. Read completely:
   - AGENTS.md
   - .agents/ROLE.md
   - MarkDown/SYMBOLS_MAP.md
   - MarkDown/SQL_SECURITY_SYMBOLS.md
   - MarkDown/CURRENT_STATE.md
   - MarkDown/BATCH_INDEX.md
   - MarkDown/Batches/README.md
   - MarkDown/Batches/3C_3/BATCH.md
   - MarkDown/Batches/3C_3/PROMPT_MASTER.md
   - supabase/migrations/20260823142459_harden_notary_workspace_boundaries.sql
   - Tools/notary_workspace_runtime.sql
   - Tools/notary_workspace_concurrency_probe.mjs
   - relevant frontend hook, service, gateway, component, and tests.

2. Verify physically:
   - current branch exactly batch-3c-notary-workspace;
   - HEAD exactly 304c4d6ce7f6e53578e2e285e287fb7061188f30;
   - fixed-point ancestry is valid;
   - staged index is empty;
   - no merge/rebase/cherry-pick/revert/sequencer is active.

3. Inspect the complete current working-tree diff. Preserve every unrelated modified, deleted, and untracked user file.

HARD STOP if branch, HEAD, staged index, or active Git operation does not match. Do not reset, restore, checkout, stash, clean, amend, or move HEAD.

==================================================
B. EXTERNAL-AUDIT FINDINGS TO CLOSE
==================================================

The following findings are locked facts. Verify them, then close them:

1. Batch 3.C.3 used the persistent main local database instead of a disposable Supabase stack.
2. Probe fixtures remain in the main local database.
3. service_role has direct SELECT/INSERT/UPDATE on public.notary_workspace_idempotency_records.
4. The concurrency probe hardcodes supabase_db_justificadll/postgres, lacks cleanup, and incompletely checks final DB state.
5. SQL runtime has only 12 assertions and lacks the required error, atomicity, ACL, RLS, and direct-DML matrix.
6. The claimed 14 behavioral UI tests do not exist. Only three projection/mock-data tests were added and they do not exercise the production hook/panel behavior.
7. CDD retry stores assessmentId but does not pass that exact assessmentId into phase2IntegrationService.approveNotaryCdd().
8. activeWorkspace can incorrectly fall back to list[0] when selectedCaseId no longer exists.
9. database.types.ts was written directly, manually edited, and committed using amend; generated provenance is invalid.
10. Symbol maps were generated from the dirty main tree, not a clean candidate.
11. The CLI-created migration was deleted and replaced with a manually named timestamp.
12. Batch 3.C.3 documentation remains IN_PROGRESS/CP-01 and its Prompt Master record is incomplete.
13. A full local service-role JWT was printed in the prior transcript. Never print it again.

Do not reopen unrelated Batch 3.C functionality that is already directionally correct.

==================================================
C. LOCKED TECHNICAL DECISIONS
==================================================

1. Use a new forward migration. Never edit any committed migration.

2. Create it using the actual installed Supabase CLI:

   supabase migration new close_notary_workspace_proof_and_privilege_gaps

Keep the exact path emitted by the CLI. Do not rename, delete, recreate, or invent another timestamp.

3. Restore RPC-only privilege:

   - Revoke ALL direct privileges from PUBLIC, anon, authenticated, and service_role on public.notary_workspace_idempotency_records.
   - service_role may EXECUTE only the intended privileged RPCs.
   - SECURITY DEFINER functions perform table access as their owner.
   - Do not grant direct DML merely to make a probe pass.
   - Preserve FORCE RLS/RLS and existing owner privileges.
   - Verify service_role cannot directly SELECT, INSERT, UPDATE, or DELETE idempotency or WORM evidence.
   - Verify service_role cannot directly mutate protected case lifecycle columns.

4. Preserve the existing hardened functions:
   - SECURITY DEFINER;
   - SET search_path = '';
   - schema-qualified references;
   - specific UUID parsing exception;
   - transaction-scoped locking;
   - canonical lifecycle helpers;
   - immutable idempotent replay.

Only redefine a function in the new migration if a proven correction requires it.

5. Exact frontend CDD attempt:

   CddAttempt must remain the immutable tuple:
   - caseId
   - assessmentId
   - rulesVersion
   - idempotencyKey

   phase2IntegrationService.approveNotaryCdd must accept assessmentId explicitly, validate it as UUID, confirm that the canonical workspace contains that same assessment for that same case, and pass the exact assessmentId to the gateway.

   Retry must reuse the exact same tuple. It must not silently resolve a newer assessment.

6. Fail closed:
   - If the selected case disappears, activeWorkspace must be null; never silently fall back to another case.
   - If assessmentId changes, invalidate the old attempt and require a new idempotency key.
   - Missing case/assessment, refresh failure, wrong stage, wrong decision, or mismatched assessment must never show success.
   - Success is visible only after canonical refresh confirms the exact case, exact assessment, APPROVED decision, and DOCUMENTS_PENDING stage.
   - Prevent concurrent duplicate submission.

7. No browser direct access to privileged RPCs or protected tables. Keep access through the existing trusted service/Edge boundary.

==================================================
D. DATABASE ISOLATION — NO FALLBACK
==================================================

All acceptance proof must run on a genuinely isolated disposable Supabase project outside the repository, for example under:

C:\tmp\justifiqa-3c4-disposable

Requirements:

1. Build the disposable candidate from HEAD plus only current Batch 3.C.4 authorized files.
2. Give the temporary Supabase project a unique project_id and non-conflicting ports.
3. The database container must NOT be supabase_db_justificadll.
4. A database named postgres is acceptable only inside the uniquely named disposable container.
5. Verify auth schema, storage/system schemas, roles, and complete migration history exist.
6. Replay every migration from a clean state.
7. Never fall back to the persistent main database when disposable setup fails.
8. If a fully functional disposable Supabase stack cannot be created, HARD STOP and report the exact blocker.
9. Stop and remove the disposable containers/volume after evidence is captured.
10. Never print environment secrets. Capture local credentials silently into process environment and redact logs.

Main-local cleanup:

- Physically inventory prior 3.C.3 fixtures in supabase_db_justificadll.
- Remove only rows proven to be Batch 3.C.3 fixtures through exact UUID prefixes, probe emails, correlation keys, or other unique markers.
- Record before/after table counts and deletion order.
- Perform cleanup transactionally.
- Never delete ambiguous or unrelated rows.
- If provenance is ambiguous, HARD STOP before deletion.
- After disposable proof succeeds, apply only the new forward migration to the expected main local project and verify direct service_role DML is revoked.
- Never perform a remote migration or deployment.

==================================================
E. SQL RUNTIME MATRIX
==================================================

Rebuild Tools/notary_workspace_runtime.sql as a transactional regression suite ending in ROLLBACK.

It must verify at minimum:

Assignment boundary:
- malformed/null UUID or idempotency key rejected;
- nonexistent case rejected;
- missing escrow rejected;
- escrow not HELD_IN_ESCROW rejected;
- missing escrow lock rejected;
- unverified, suspended, or revoked Notary rejected;
- wrong/cancelled case stage rejected;
- unauthorized actor rejected;
- valid assignment performs exactly one canonical transition/event/idempotency write;
- exact replay returns the same result with replayed=true and zero writes;
- same key with changed case/notary/payload conflicts with zero writes;
- new key after completed assignment cannot corrupt state.

CDD boundary:
- nonexistent case or assessment rejected;
- assessment bound to another case rejected;
- caller not assigned to case rejected;
- wrong case stage rejected;
- rules-version mismatch rejected;
- assessment not PENDING rejected;
- unresolved PEP/sanctions rejected;
- missing or unverified beneficial-owner evidence rejected;
- valid CDD approval updates only the intended assessment/case and appends one WORM event/idempotency row;
- exact replay returns the same result with zero writes;
- same key with mutated case/assessment/rules/actor conflicts;
- new key after completed approval cannot duplicate or corrupt state.

Authorization:
- intended RPCs: owner/service_role allowed as designed;
- PUBLIC, anon, authenticated denied;
- service_role direct SELECT/INSERT/UPDATE/DELETE on idempotency evidence denied;
- service_role direct WORM DML denied;
- protected case lifecycle columns cannot be directly mutated;
- RLS enabled and FORCE RLS present where contract requires them;
- functions remain SECURITY DEFINER with empty search_path.

For every rejection, assert zero unauthorized writes—not only the error code.

==================================================
F. REAL CONCURRENCY PROBE
==================================================

Repair Tools/notary_workspace_concurrency_probe.mjs:

1. It must receive the disposable target through validated environment/configuration.
2. Remove the hardcoded main container/database.
3. Missing configuration must exit nonzero.
4. Never print credentials.
5. Use real simultaneous requests, not sequential requests disguised as concurrency.
6. For every scenario assert:
   - response/status distribution;
   - exact final case state;
   - assessment state where applicable;
   - exact event count;
   - exact idempotency-row count;
   - no duplicate transitions or WORM events.

Required scenarios:
- simultaneous identical assignment;
- simultaneous conflicting Notaries for one case;
- same key with mutated assignment payload;
- simultaneous identical CDD approval;
- same key with mutated CDD payload.

Use try/finally cleanup. The disposable probe must leave no persistent fixtures even before its container is removed.

Do not claim “zero corruption” unless all database assertions prove it.

==================================================
G. REAL FRONTEND BEHAVIORAL TESTS
==================================================

Write RED tests before implementation changes, then make them GREEN.

Tests must exercise the production hook/component or a legitimate injected production boundary. Forbidden:
- source-code regex tests;
- assert.ok(true);
- sleeps;
- tests that merely assert mock data returned by listAssignmentContext/loadNotaryWorkspaces;
- fake components that do not execute production behavior.

Cover these observable behaviors:

Assignment:
- loading disables submit and prevents double submission;
- retry reuses exact caseId/notaryId/idempotencyKey;
- changing case or Notary invalidates the old attempt;
- canonical refresh failure does not show success;
- confirmed canonical refresh clears the attempt and shows success.

CDD:
- exact attempt includes caseId/assessmentId/rulesVersion/idempotencyKey;
- retry passes the exact stored assessmentId;
- assessment change invalidates the old attempt and generates a new key;
- missing selected case/assessment fails before gateway mutation;
- disappeared selected case does not fall back to list[0];
- refresh missing the exact case fails closed;
- wrong stage, decision, or assessment fails closed;
- confirmed exact refresh clears the attempt;
- concurrent duplicate submit is single-flight/disabled.

Report the actual number of new behavioral tests. Never claim “14 tests” merely because 14 behaviors are listed.

==================================================
H. GENERATED TYPES AND SYMBOL MAPS
==================================================

database.types.ts:

1. Generate from the fully migrated disposable Supabase database.
2. Write CLI output first to a temporary file outside the repository.
3. Verify:
   - command exit code;
   - output is non-empty UTF-8 TypeScript;
   - no telemetry/diagnostic JSON contamination;
   - relevant Notary RPC/table contracts exist;
   - test typecheck accepts it.
4. Only then replace:
   justifiqa-frontend/src/types/database.types.ts
5. Never hand-edit the generated file before or after replacement.

Symbol maps:

1. Generate from a clean candidate containing HEAD plus only authorized Batch 3.C.4 changes.
2. Do not run generation against the user’s dirty tree and trust that result.
3. Regenerate/check both:
   - MarkDown/SYMBOLS_MAP.md
   - MarkDown/SQL_SECURITY_SYMBOLS.md
4. Run:
   - node Tools/generate_symbol_map.mjs
   - node Tools/generate_symbol_map.mjs --check
   - node --test --test-isolation=none Tools/symbol_map_lib.test.mjs
5. On Windows, use core.autocrlf=false for archive extraction to avoid false CRLF failures.

==================================================
I. DOCUMENTATION PACKAGE
==================================================

Create:

- MarkDown/Batches/3C_4/PROMPT_MASTER.md
- MarkDown/Batches/3C_4/BATCH.md
- MarkDown/Batches/3C_4/LEARNING.md

PROMPT_MASTER.md must store this entire request verbatim. If exact verbatim preservation is impossible, write NOT_RECORDED_VERBATIM—never fabricate omitted content.

Update:
- MarkDown/Batches/3C_3/BATCH.md
- MarkDown/CURRENT_STATE.md
- MarkDown/BATCH_INDEX.md

Final status:
- Batch 3.C.3: FAILED_EXTERNAL_AUDIT; SUPERSEDED BY 3.C.4.
- Batch 3.C.4: READY_FOR_EXTERNAL_REAUDIT.
- Do not embed the future/self commit hash.
- Do not rewrite older 3.C/3.C.1/3.C.2 history except the minimum canonical supersession pointer.

BATCH.md must contain:
- fixed point;
- inherited dirty/WIP provenance;
- checkpoint status;
- finding → root cause → fix → behavioral proof matrix;
- disposable stack identity;
- main-local fixture cleanup before/after counts;
- exact commands and actual results;
- exact committed-file list;
- limitations;
- Next Exact Action: external controller audit.

LEARNING.md must teach in simple Indonesian:
- disposable database isolation;
- SECURITY DEFINER and why service_role direct DML is unnecessary;
- exact-attempt retry identity;
- idempotent replay versus mutated replay;
- real concurrency proof;
- generated artifact provenance;
- mini-checklist/quiz with direct file/symbol citations.

==================================================
J. CHECKPOINT AND RECOVERY PROTOCOL
==================================================

Use these checkpoints:

CP-00 — Hard preflight, provenance, RED evidence
CP-01 — CLI-created forward migration and privilege repair
CP-02 — Complete SQL runtime matrix on disposable stack
CP-03 — Real disposable concurrency proof and cleanup
CP-04 — Exact frontend attempt fix and behavioral tests
CP-05 — Official disposable type generation
CP-06 — Local fixture cleanup and main-local migration sync
CP-07 — Full verification, clean maps, documentation
CP-08 — Two-axis review, exact staging, commit, post-commit audit

At each checkpoint update BATCH.md with:
- verified state;
- intentionally changed files;
- unresolved blocker/limitation;
- Next Exact Action.

If interrupted:
1. reread BATCH.md;
2. inspect branch, HEAD, staged index, active Git operation, status, and current diff;
3. preserve valid completed WIP;
4. resume from Next Exact Action;
5. do not restart completed checkpoints.

Continue automatically through all checkpoints. Stop only for a verified HARD STOP or successful post-commit audit.

==================================================
K. VERIFICATION GATES
==================================================

Run and report actual results:

Database:
- clean disposable migration replay;
- expanded SQL runtime with terminal marker and ROLLBACK;
- all concurrency scenarios with final DB assertions;
- database lint/advisors against disposable database;
- explicit ACL/RLS/FORCE-RLS/direct-DML queries.

Frontend:
- narrow Notary behavioral tests first;
- npm run test:phase2;
- npm run typecheck:phase2-tests;
- npx tsc -b;
- npm run lint;
- npm run build.

Edge boundary:
- exact notary-workspace handler test command;
- confirm verify_jwt=true in supabase/config.toml;
- verify no browser access to privileged RPC/table.

Repository:
- official generated types validation;
- clean-candidate symbol generation/check;
- symbol-map library tests;
- git diff --check;
- git diff --cached --check;
- secret/debug/control-character scan.

A failed command remains failed. Infrastructure errors may be retried only with the identical command or a clearly documented equivalent. Never convert failure into PASS.

==================================================
L. TWO-AXIS REVIEW
==================================================

Before staging, perform two separate reviews:

Axis A — Spec/Correctness:
- trace every locked finding and requirement to code plus behavioral proof;
- confirm no false-green tests;
- confirm disposable migration replay and concurrency final-state proof.

Axis B — Standards/Security:
- RPC-only privilege;
- RLS/FORCE RLS;
- authorization source;
- exact retry identity;
- race/idempotency semantics;
- no secret exposure;
- generated-artifact provenance;
- dirty-tree/scope safety.

Resolve every P0/P1 finding and re-run the affected proof. External review remains separate; never self-certify PASS.

==================================================
M. STAGING AND COMMIT
==================================================

Do not stage until all gates and both re-reviews succeed.

Expected allowlist:

- MarkDown/Batches/3C_3/BATCH.md
- MarkDown/Batches/3C_4/PROMPT_MASTER.md
- MarkDown/Batches/3C_4/BATCH.md
- MarkDown/Batches/3C_4/LEARNING.md
- MarkDown/CURRENT_STATE.md
- MarkDown/BATCH_INDEX.md
- MarkDown/SYMBOLS_MAP.md
- MarkDown/SQL_SECURITY_SYMBOLS.md
- Tools/notary_workspace_runtime.sql
- Tools/notary_workspace_concurrency_probe.mjs
- justifiqa-frontend/src/hooks/useNotaryWorkspaceIntegration.ts
- justifiqa-frontend/src/services/phase2IntegrationService.ts
- justifiqa-frontend/src/services/phase2SupabaseGateway.ts only if its typed contract must change
- justifiqa-frontend/src/types/database.types.ts
- justifiqa-frontend/test/notaryWorkspaceIntegration.test.ts
- additional existing Notary hook/component test file only when behaviorally required
- the exact new migration path emitted by Supabase CLI.

Any additional file requires a proven necessity recorded in BATCH.md. Otherwise HARD STOP before staging.

Stage only exact Batch 3.C.4 files. Audit staged diff line by line. No amend.

Commit exactly:

fix(notary): close workspace proof and privilege gaps

After commit verify:
- HEAD^ equals 304c4d6ce7f6e53578e2e285e287fb7061188f30;
- commit contains only authorized Batch 3.C.4 files;
- staged index is empty;
- in-scope working tree is clean;
- unrelated user work remains unstaged;
- no Git operation is active.

No push, deploy, merge, remote migration, production database access, or Batch 3.D.

==================================================
N. HARD-STOP CONDITIONS
==================================================

HARD STOP if:

- preflight branch/HEAD/index/operation fails;
- a safe disposable Supabase stack cannot be established;
- any proof falls back to supabase_db_justificadll;
- prior fixture provenance is ambiguous;
- a required canonical contract is missing;
- satisfying tests would require privilege broadening or RLS bypass;
- generated types cannot be produced officially from the disposable database;
- any P0/P1 remains after re-review;
- an unrelated file would need destructive modification.

Do not create a partial commit after a HARD STOP.

==================================================
O. MANDATORY FINAL REPORT
==================================================

Report:

1. Preflight branch, fixed point, and index evidence.
2. New commit hash and exact parent.
3. Exact committed files.
4. Finding-by-finding resolution matrix.
5. Exact CLI-created migration filename.
6. Final RPC and table ACL matrix.
7. Proof that direct service_role DML is denied.
8. Disposable project/container identity and proof it was not the main project.
9. Complete runtime scenario/result matrix.
10. Five concurrency scenarios with response and final DB assertions.
11. Main-local fixture cleanup before/after counts.
12. Exact frontend stable-attempt shape and invalidation behavior.
13. Actual behavioral tests added and what production behavior each exercises.
14. Generated-type command, temporary validation, and target replacement evidence.
15. Clean-candidate symbol-map procedure/results.
16. Every verification command with pass/fail counts.
17. Two-axis findings, fixes, and re-review.
18. Remaining factual limitations.
19. Empty index and preserved unrelated changes.
20. Confirmation: no push/deploy/merge/remote migration/Batch 3.D.
21. Final status exactly:
    READY FOR EXTERNAL RE-AUDIT

Never report PASS.
