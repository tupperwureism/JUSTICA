[ROLE: IMPLEMENTATION EXECUTOR — BATCH 3.C.1]
[HONESTY AND SECURITY FIRST]
[ONE PROMPT = ONE COMPLETE CORRECTION BATCH]
[LOCAL IMPLEMENTATION ONLY — NO PRODUCTION DEPLOYMENT]
[CONTINUE AUTOMATICALLY THROUGH CHECKPOINTS]
[FINAL STATUS MUST BE READY FOR EXTERNAL RE-AUDIT, NEVER SELF-CERTIFIED PASS]

Repository:
D:\justificadll

Required branch:
batch-3c-notary-workspace

Required fixed-point HEAD:
1a6c89e00d8d6087542b9bb230d50197f020f23f

Required parent implementation:
e1620733da62b0851ae9d74b27f4a46886e1fb16

New commit message:
fix(notary): repair canonical assignment and CDD boundaries

==================================================
1. OBJECTIVE
==================================================

Complete Batch 3.C.1 by repairing the externally audited Batch 3.C implementation.

Batch 3.C at commit 1a6c89e contains useful frontend, Edge Function, and database scaffolding, but it is NOT accepted because its database path contradicts the canonical schema and lifecycle.

This correction batch must make the following paths genuinely operational against a clean disposable database:

1. Administrator lists eligible corporate cases and verified active Notaries.
2. Administrator explicitly selects and confirms a Notary assignment.
3. Assignment validates held corporate escrow and performs only the assignment.
4. Assignment does NOT change corporate case stage.
5. Assigned, verified active Notary can approve an existing canonical CDD assessment when the case is already CDD_REVIEW.
6. CDD approval and canonical transition CDD_REVIEW → DOCUMENTS_PENDING occur atomically.
7. Exact retries are idempotent; mutated reuse conflicts.
8. Browser cannot call privileged RPCs or mutate assignment/CDD tables directly.
9. Frontend success is displayed only after canonical refresh confirms the mutation.
10. Clean migration replay, actual SQL runtime regression, generated database types, and all verification gates pass.

Do not start Batch 3.D.

==================================================
2. HARD PREFLIGHT
==================================================

Before editing:

1. Read completely:
   - AGENTS.md
   - .agents/ROLE.md
   - MarkDown/CURRENT_STATE.md
   - MarkDown/BATCH_INDEX.md
   - MarkDown/Batches/README.md
   - MarkDown/Batches/3C/PROMPT_MASTER.md
   - MarkDown/Batches/3C/BATCH.md
   - MarkDown/Batches/3C/LEARNING.md

2. Navigate from:
   - MarkDown/SYMBOLS_MAP.md
   - MarkDown/SQL_SECURITY_SYMBOLS.md
   - targeted rg searches and authoritative source files.

3. Verify physically:
   - branch is exactly batch-3c-notary-workspace;
   - HEAD is exactly 1a6c89e00d8d6087542b9bb230d50197f020f23f;
   - HEAD^ is e1620733da62b0851ae9d74b27f4a46886e1fb16;
   - staged index is empty;
   - no merge, rebase, cherry-pick, revert, or sequencer operation is active;
   - all Batch 3.C in-scope files match HEAD unless inherited WIP is explicitly identified and audited.

4. The dirty working tree contains unrelated user work. Preserve it exactly.

HARD STOP when:
- branch or HEAD differs;
- staged index is not empty;
- a Git operation is active;
- an in-scope file contains unknown inherited edits;
- a required architectural decision cannot be proven from repository source.

Never move HEAD, reset, restore, checkout, stash, clean, amend, or delete unrelated files.

==================================================
3. AUTHORITATIVE CONTRACTS
==================================================

Treat migrations and code as truth. AI reports and Batch 3.C documentation are claims requiring verification.

Read these exact contracts before implementation:

- supabase/migrations/20260715000001_domain1_identity_rbac_licensing.sql
- supabase/migrations/20260721000015_harden_verified_advocate_rls_helper.sql
- supabase/migrations/20260722000016_p2_b3_service_orders_expand_only.sql
- supabase/migrations/20260722000017_p2_b4_corporate_concierge_and_bo.sql
- supabase/migrations/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql
- supabase/migrations/20260728000025_phase2_backend_forensic_hardening.sql
- supabase/migrations/20260813064656_preserve_corporate_payment_webhook_replay.sql
- supabase/migrations/20260820000001_add_browser_safe_notary_workspace_boundary.sql
- supabase/functions/_shared/rest.ts
- supabase/functions/notary-workspace/handler.ts
- supabase/functions/notary-workspace/index.ts
- Tools/notary_workspace_runtime.sql
- relevant frontend service, hook, component, and test files from commit 1a6c89e.

Locked schema facts:

1. users_admin has no is_active column.
   Authorization uses the existing canonical admin record and role_group:
   - COMPLIANCE_OFFICER
   - SUPER_ADMIN

2. users_advocate has no is_verified column.
   Advocate verification is represented by kyc_status='VERIFIED' and the canonical helper:
   public.fn_is_verified_advocate(UUID)

3. service_orders has no escrow_status or funds_locked_at columns.

4. Corporate held-fund evidence belongs to escrow_transactions:
   - corporate_case_id
   - status='HELD_IN_ESCROW'
   - funds_locked_at IS NOT NULL

5. The canonical corporate case lifecycle is protected by:
   - fn_guard_corporate_case_stage_mutation()
   - fn_transition_corporate_service_case(...)

6. Legal path after escrow:
   ESCROW_LOCKED → IDENTITY_PENDING → CDD_REVIEW → DOCUMENTS_PENDING

7. Notary assignment must leave current_stage unchanged at ESCROW_LOCKED.

8. Batch 3.D/e-KYC owns the path that advances ESCROW_LOCKED through IDENTITY_PENDING into CDD_REVIEW. Do not fake or skip it in Batch 3.C.1.

9. CDD approval is available only when the case has already reached CDD_REVIEW through the canonical lifecycle.

==================================================
4. LOCKED DATABASE CORRECTIONS
==================================================

The migration 20260820000001 is an unaccepted, undeployed local Batch 3.C migration that cannot clean-replay. Repair this migration file in place.

Do NOT add a later migration that assumes the broken migration can apply first. Do not modify any earlier migration.

4.1 Notary profile and authorization

- Remove every reference to users_admin.is_active.
- Remove every reference to users_advocate.is_verified.
- Admin qualification: canonical users_admin record plus allowed role_group.
- Notary qualification requires BOTH:
  - notary_profiles.status='VERIFIED_ACTIVE';
  - public.fn_is_verified_advocate(notary_id) is true.
- Apply the same predicates at trusted database and Edge boundaries.
- Browser may SELECT only the minimum policy-authorized projection.
- Browser may not create, verify, suspend, revoke, or edit Notary qualifications.

4.2 Atomic assignment RPC

Keep the existing public signature unless a proven PostgreSQL reason requires otherwise:

public.fn_assign_corporate_notary_atomic(
  UUID,
  UUID,
  UUID,
  VARCHAR
)

Required behavior:

1. Validate arguments and UUID-formatted idempotency key.
2. Validate the admin using canonical users_admin fields.
3. Validate the selected Notary using notary_profiles plus fn_is_verified_advocate().
4. Serialize the operation by operation type plus idempotency key.
5. Lock rows in a deterministic order.
6. Lock the corporate case and its relevant escrow_transactions row.
7. Require:
   - case stage exactly ESCROW_LOCKED;
   - case not cancelled;
   - escrow status HELD_IN_ESCROW;
   - funds_locked_at non-null.
8. If unassigned, update assigned_notary_id only.
9. Do NOT update current_stage.
10. Same operation, same key, and same canonical payload:
    - return the original IDs;
    - replayed=true;
    - zero effective writes.
11. Same key with any changed operation/payload:
    - IDEMPOTENCY_CONFLICT;
    - zero writes.
12. A different assignment after the case is assigned:
    - ASSIGNMENT_CONFLICT;
    - zero writes.
13. Concurrent assignment attempts must never result in last-write-wins.
14. Idempotency records must bind:
    - operation type;
    - case;
    - actor;
    - selected Notary;
    - canonical digest;
    - canonical result.
15. Never report replay merely because the current database state happens to resemble the requested result. Replay requires the matching persisted idempotency binding.

The assignment result must report the unchanged canonical stage ESCROW_LOCKED.

4.3 Atomic CDD approval RPC

Keep the existing public signature unless a proven PostgreSQL reason requires otherwise:

public.fn_approve_notary_cdd_atomic(
  UUID,
  UUID,
  UUID,
  VARCHAR,
  VARCHAR
)

Required behavior:

1. Validate UUIDs, rules version, and UUID-formatted idempotency key.
2. Require the caller to be:
   - the case’s assigned Notary;
   - notary_profiles.status='VERIFIED_ACTIVE';
   - verified by fn_is_verified_advocate().
3. Lock the case and referenced assessment deterministically.
4. Assessment must:
   - belong to the case;
   - have assessment_level='CDD';
   - already have reviewer_id equal to the assigned Notary;
   - already have reviewer_role='NOTARY';
   - use the requested rules_version.
5. Do not take ownership of another reviewer’s assessment and do not overwrite reviewer identity to manufacture ownership.
6. Require case stage exactly CDD_REVIEW for the initial execution.
7. Require all relevant BO rows VERIFIED.
8. Require PEP and sanctions statuses only:
   - NO_MATCH; or
   - NOT_APPLICABLE.
9. Require reviewer_decision PENDING for initial execution.
10. Update the decision to APPROVED and assessed_at.
11. Transition using the canonical lifecycle mechanism:
    fn_transition_corporate_service_case(
      case_id,
      'CDD_REVIEW',
      'DOCUMENTS_PENDING'
    )
12. Do not directly bypass fn_guard_corporate_case_stage_mutation.
13. Assessment update and lifecycle transition must share one PostgreSQL transaction. Failure of either produces zero partial writes.
14. Exact replay requires the persisted matching idempotency record and returns replayed=true.
15. Wrong key, mutated payload, wrong rules version, different assessment, or different actor must not be accepted as replay.
16. A new key against an already-approved assessment is not an exact replay; reject it safely.
17. Include operation type in the idempotency digest/binding.

4.4 ACL and RLS

Prove with database assertions:

- PUBLIC, anon, and authenticated cannot execute either privileged RPC.
- authenticated cannot directly update corporate_service_cases.assigned_notary_id.
- authenticated cannot directly INSERT/UPDATE/DELETE compliance_assessments.
- service_role direct assigned_notary_id mutation is removed because the RPC is now canonical.
- If table-level service_role UPDATE currently grants the column implicitly, revoke it and restore only explicitly proven required column privileges, excluding assigned_notary_id and protected lifecycle fields.
- Do not break existing owner-executed SECURITY DEFINER RPCs.
- New tables retain ENABLE RLS and FORCE RLS.
- Do not broaden any privilege to make tests pass.

==================================================
5. LOCKED EDGE FUNCTION CORRECTIONS
==================================================

Maintain:
- supabase/functions/notary-workspace/
- verify_jwt=true
- POST/OPTIONS only
- localhost CORS for local scope
- server-derived identity
- service-role use only inside the trusted function

Correct production dependencies:

1. Admin query selects only real fields:
   - admin_id
   - role_group

2. Advocate query uses kyc_status or the equivalent canonical verified predicate, never is_verified.

3. Assignment context obtains escrow state from escrow_transactions, not service_orders.

4. Never substitute a fallback such as:
   escrowStatus ?? 'HELD_IN_ESCROW'
   A missing or malformed escrow projection must fail closed.

5. list_assignment_context may include minimal ESCROW_LOCKED cases needed to confirm assignment, but:
   - eligibility must be derived server-side;
   - UI mutation is enabled only for unassigned eligible cases;
   - no fake escrow/status metadata comes from the browser.

6. approve_cdd must require both:
   - VERIFIED_ACTIVE Notary profile;
   - verified advocate predicate.

7. assign_notary must reject caller-supplied:
   - adminId;
   - actorId;
   - role;
   - escrow status;
   - case stage;
   - verification status.
   Do not silently accept and ignore spoof fields.

8. Parse real RestError.details from the shared PostgREST client using an explicit allowlist of known database markers.

9. Unknown PostgREST/SQL errors map to SERVER_ERROR without leaking:
   - SQL text;
   - schema names;
   - JWT;
   - service-role key;
   - raw database details;
   - PII.

10. Add behavioral tests using actual RestError instances. Tests that inject an already-mapped HttpError do not prove production error parsing.

11. Export/refactor production dependency construction only as needed for real integration testing. Do not duplicate handler logic.

==================================================
6. LOCKED FRONTEND CORRECTIONS
==================================================

6.1 Administrator assignment

- Keep Supabase access in service/gateway/hook boundaries.
- Do not automatically select the first case.
- Do not automatically select the first Notary.
- Require explicit user selection of both.
- Require an explicit confirmation step before mutation.
- Keep loading, disabled, accessible error, retry, and success states.
- A retry must reuse the exact same:
  - caseId;
  - notaryId;
  - idempotencyKey.
- Do not clear the attempt key until canonical confirmation succeeds.
- After RPC success, refresh canonical assignment context.
- Report UI success only if refreshed data confirms:
  - matching caseId;
  - assignedNotaryId equals the selected Notary;
  - stage remains ESCROW_LOCKED.
- Refresh failure or mismatch must not display success.
- Assigned cases must not remain actionable for a second assignment.

6.2 Notary CDD approval

- Generate the CDD attempt idempotency key before entering the gateway.
- Store it as part of the mutation attempt.
- Retry must reuse the exact same key and payload.
- Never generate the key inside each gateway invocation.
- After RPC success, refresh the selected workspace.
- Report success only when canonical refresh confirms:
  - reviewer_decision='APPROVED';
  - current_stage='DOCUMENTS_PENDING';
  - same case and assessment.
- Refresh failure or mismatch must fail closed.
- Do not manufacture CDD screening results in the browser.

6.3 Error contract

- Parse structured FunctionsHttpError response JSON using a real Response clone.
- Allowlist stable server codes.
- Convert them to existing safe Phase2IntegrationError codes.
- Unknown or malformed responses use a generic safe fallback.
- Do not show raw PHASE2_QUERY_FAILED, SQL, JWT, PostgREST, or internal details to users.

6.4 Preserve honest future work

The following remain blocked/future work:

- AHU/OSS/SABH/SABU live submission;
- Notary stamping;
- document anchoring completion;
- Batch 3.D e-KYC/signing;
- payout/release;
- production deployment.

Do not add fake success buttons or mock production results.

==================================================
7. GENERATED TYPES AND RUNTIME TEST REPAIR
==================================================

7.1 Repair Tools/notary_workspace_runtime.sql

Remove every obsolete/fictitious fixture field, including:

- users_admin.is_active;
- users_advocate.is_verified;
- users_advocate.license_number;
- service_orders.base_fee_idr;
- service_orders.total_amount_idr;
- service_orders.escrow_status;
- service_orders.funds_locked_at;
- service_orders.current_status.

Use the actual canonical schema.

Held funds must be represented through escrow_transactions.

The SQL runtime must run inside a transaction and finish with ROLLBACK.

7.2 Required SQL behaviors

Test behaviorally:

- clean migration applies;
- eligible assignment succeeds;
- assignment leaves stage ESCROW_LOCKED;
- escrow missing rejected;
- escrow not held rejected;
- funds_locked_at null rejected;
- unverified/suspended/revoked Notary rejected;
- invalid admin rejected;
- exact assignment replay is zero-write;
- same key mutated payload conflicts;
- different Notary after assignment conflicts;
- concurrent different assignments cannot both win;
- direct authenticated assignment denied;
- case prepared canonically through IDENTITY_PENDING into CDD_REVIEW for CDD tests;
- assigned Notary CDD approval succeeds;
- another reviewer’s assessment rejected;
- rules mismatch rejected;
- unresolved screening rejected;
- unverified BO rejected;
- CDD approval and transition are atomic;
- exact CDD replay is zero-write;
- new or mutated key after approval is not accepted as replay;
- direct authenticated CDD mutation denied;
- privileged RPC ACLs are correct;
- transaction ends with rollback and leaves no fixture residue.

No assert.ok(true, source-regex test, sleep-based race claim, or mocked SQL “E2E” is acceptable.

7.3 Clean disposable database

Run all repository migrations from zero against a disposable database/container.

Do not reset or mutate the user’s main local database.

Prove:

- all migrations apply in order;
- repaired 20260820000001 applies without schema drift;
- SQL runtime passes against that clean schema;
- database lint has no new Batch 3.C.1 error;
- disposable resources are stopped/removed safely after evidence collection.

7.4 Generated types

Regenerate:

justifiqa-frontend/src/types/database.types.ts

from the verified disposable/local schema through an official mechanical Supabase/pg-meta path.

Never hand-edit it.

Verify it contains:

- notary_profiles;
- notary_workspace_idempotency_records;
- fn_assign_corporate_notary_atomic;
- fn_approve_notary_cdd_atomic.

==================================================
8. TDD CHECKPOINTS AND RECOVERY
==================================================

CP-00 — Preflight and provenance
- Verify branch, fixed point, index, active Git operations, and in-scope cleanliness.
- Record inherited dirty work without modifying it.

CP-01 — Correction DBB and failing tests
- Create:
  - MarkDown/Batches/3C_1/BATCH.md
  - MarkDown/Batches/3C_1/PROMPT_MASTER.md
  - MarkDown/Batches/3C_1/LEARNING.md
- Copy this Prompt Master faithfully into PROMPT_MASTER.md.
- Mark Batch 3.C as FAILED_EXTERNAL_AUDIT / superseded by 3.C.1.
- Write narrow tests that fail for the audited defects before repairing production code.

CP-02 — Database repair
- Repair the unaccepted 20260820000001 migration in place.
- Repair SQL runtime.
- Prove clean replay and transactional behavior.

CP-03 — Edge repair
- Correct physical schema queries, authorization, spoof rejection, and RestError mapping.
- Run focused handler tests.

CP-04 — Frontend repair
- Stable attempts/retry.
- Explicit selection and confirmation.
- Canonical-refresh success gates.
- Structured safe errors.
- Run focused frontend tests.

CP-05 — Full verification
- Disposable migration replay.
- SQL runtime.
- Handler tests.
- Frontend tests.
- Type generation.
- Typecheck, lint, build.
- ACL and scope checks.

CP-06 — Two-axis review and re-review
- Axis A: spec/correctness.
- Axis B: standards/security.
- Fix every P0/P1.
- Re-run affected tests and review again.
- P2 cosmetic debt may be recorded without opening another correction chain.

CP-07 — Documentation, exact staging, commit, post-commit audit
- Update canonical status documents.
- Generate maps from a clean candidate.
- Stage only allowlisted files.
- Commit once.
- Verify the resulting commit.

At each checkpoint update BATCH.md with:

- verified state;
- files intentionally changed;
- actual command results;
- unresolved blocker/limitation;
- Next Exact Action.

If interrupted:

1. reread AGENTS.md and MarkDown/Batches/3C_1/BATCH.md;
2. inspect git status and current diff;
3. preserve valid WIP;
4. continue from Next Exact Action;
5. do not restart completed checkpoints;
6. do not ask for “Continue” unless a genuine HARD STOP requires user authority.

==================================================
9. REQUIRED VERIFICATION GATES
==================================================

Run the narrowest tests first, then all applicable gates:

Database:
- clean disposable migration replay from zero;
- Tools/notary_workspace_runtime.sql;
- relevant backend forensic static/runtime checks;
- database lint;
- ACL/RLS assertions.

Edge Function:
- notary-workspace handler tests;
- shared HTTP/validation tests affected by the change;
- actual production dependency path against disposable PostgREST/database;
- verify_jwt=true confirmation.

Frontend:
- focused Notary workspace integration tests;
- retry/idempotency tests;
- canonical-refresh success-gate tests;
- npm run test:phase2;
- npm run typecheck:phase2-tests;
- npx tsc -b;
- npm run lint;
- npm run build.

Repository:
- node Tools/generate_symbol_map.mjs;
- node Tools/generate_symbol_map.mjs --check;
- node --test --test-isolation=none Tools/symbol_map_lib.test.mjs;
- git diff --check;
- git diff --cached --check;
- staged secret/debug/control-character scan.

If the dirty working tree would contaminate symbol maps, generate and verify them from a clean candidate containing exactly HEAD plus authorized Batch 3.C.1 changes.

On Windows, use core.autocrlf=false for the clean candidate archive.

A sandbox-only spawn EPERM may be retried with the identical command outside the sandbox. Record it honestly.

Do not claim a pass for a command that did not complete.

==================================================
10. ALLOWED MUTATION SCOPE
==================================================

Allowed production/database files:

- supabase/migrations/20260820000001_add_browser_safe_notary_workspace_boundary.sql
- Tools/notary_workspace_runtime.sql
- supabase/functions/notary-workspace/handler.ts
- supabase/functions/notary-workspace/index.ts
- supabase/functions/notary-workspace/handler.test.ts
- supabase/config.toml only if a factual correction is required

Allowed frontend files:

- justifiqa-frontend/src/components/admin/AdminNotaryAssignmentPanel.tsx
- justifiqa-frontend/src/components/corporate/AdvocateCorporateCaseManager.tsx
- justifiqa-frontend/src/hooks/useNotaryWorkspaceIntegration.ts
- justifiqa-frontend/src/services/phase2IntegrationService.ts
- justifiqa-frontend/src/services/phase2SupabaseGateway.ts
- justifiqa-frontend/src/types/database.types.ts
- justifiqa-frontend/test/notaryWorkspaceIntegration.test.ts
- justifiqa-frontend/test/phase2IntegrationService.test.ts
- justifiqa-frontend/package.json only if an existing test script must include a legitimate new test

Allowed documentation/maps:

- MarkDown/Batches/3C/BATCH.md
- MarkDown/Batches/3C_1/**
- MarkDown/CURRENT_STATE.md
- MarkDown/BATCH_INDEX.md
- MarkDown/DEMO_GUIDE.md
- MarkDown/SYMBOLS_MAP.md
- MarkDown/SQL_SECURITY_SYMBOLS.md

A new focused test helper may be added only under:
- justifiqa-frontend/test/
- supabase/functions/notary-workspace/

and only when genuinely required for behavioral testing.

Do not modify:

- Final Report worktree/artifacts;
- Batch 3.D;
- payment webhook;
- Corporate Intake;
- pricing catalog;
- unrelated migrations;
- Qualifa;
- unrelated user WIP.

==================================================
11. DOCUMENTATION REQUIREMENTS
==================================================

MarkDown/Batches/3C/BATCH.md:

- preserve historical implementation information;
- change acceptance status to:
  FAILED_EXTERNAL_AUDIT; SUPERSEDED BY 3.C.1
- list the material defects factually;
- do not falsify historical test claims—label them executor-reported and explain why they were insufficient.

MarkDown/Batches/3C_1/BATCH.md must contain:

- fixed point and branch;
- inherited WIP/provenance;
- finding → root cause → fix → behavioral test matrix;
- actual clean replay evidence;
- actual SQL/HTTP/frontend test results;
- exact files committed;
- limitations;
- Next Exact Action;
- status READY FOR EXTERNAL RE-AUDIT.

MarkDown/Batches/3C_1/LEARNING.md must explain in simple Indonesian:

- canonical schema versus invented columns;
- escrow as a separate aggregate/table;
- lifecycle transition guard;
- atomic CDD decision plus transition;
- idempotency binding and exact replay;
- row/advisory locking and concurrency;
- server-derived actor authorization;
- canonical refresh as a success gate;
- why mocks cannot prove database integration.

Include direct file/symbol citations, small examples, checklist, and mini-quiz.

Update CURRENT_STATE, BATCH_INDEX, and DEMO_GUIDE only with factual post-correction status.

Do not edit the Final Report in this batch.

==================================================
12. REVIEW REQUIREMENTS
==================================================

Before staging, perform two independent reviews:

Axis A — Spec/correctness:
- every external audit finding closed;
- assignment leaves ESCROW_LOCKED;
- correct escrow table;
- canonical CDD transition;
- ownership enforcement;
- stable replay behavior;
- clean migration replay;
- generated types synchronized.

Axis B — Standards/security:
- server-derived actors;
- verified Notary predicate at both boundaries;
- no spoof fields;
- no direct browser privileged mutations;
- least-privilege ACL;
- no raw database leakage;
- concurrency and retry safety;
- dirty-tree/map hygiene;
- no scope creep.

Resolve every P0/P1 and rerun affected gates. Re-review after fixes.

Executor status remains READY FOR EXTERNAL RE-AUDIT. External controller decides PASS.

==================================================
13. STAGING AND COMMIT
==================================================

Before staging:

- git diff --check must pass;
- inspect every in-scope diff;
- verify no unrelated file was modified by this batch;
- verify no secrets, JWTs, service-role keys, database URLs, real NIK/KTP, passwords, or PII appear.

Stage only files actually required from the allowlist.

Do not stage unrelated dirty files.

Commit exactly:

fix(notary): repair canonical assignment and CDD boundaries

Do not amend, push, deploy, merge, apply remote migrations, or begin Batch 3.D.

Post-commit verify:

- HEAD^ equals 1a6c89e00d8d6087542b9bb230d50197f020f23f;
- commit contains only authorized Batch 3.C.1 files;
- staged index is empty;
- in-scope working tree is clean;
- unrelated user changes remain unstaged;
- no Git operation is active.

==================================================
14. MANDATORY FINAL REPORT
==================================================

Report exactly:

1. Preflight evidence.
2. New commit hash, parent, branch, and message.
3. Exact committed files.
4. Finding-to-fix-to-test matrix for every external audit finding.
5. Final assignment state behavior.
6. Final CDD ownership and transition behavior.
7. Exact idempotency and concurrency behavior.
8. Final Edge authorization and error parsing behavior.
9. Frontend stable-attempt and canonical-refresh behavior.
10. Generated database type evidence.
11. Clean disposable migration replay result.
12. SQL runtime result and rollback confirmation.
13. Handler and frontend test counts.
14. Typecheck, lint, build, database lint, map, and diff-check results.
15. ACL/RLS matrix for PUBLIC, anon, authenticated, service_role, and owner.
16. Two-axis review findings and re-review result.
17. Factual remaining limitations.
18. Confirmation that index is empty and unrelated changes remain unstaged.
19. Confirmation of no push/deploy/merge/remote migration/Batch 3.D.
20. Final status:
    READY FOR EXTERNAL RE-AUDIT

Continue automatically until the required commit and post-commit audit succeed, or stop only on a verified HARD STOP.
