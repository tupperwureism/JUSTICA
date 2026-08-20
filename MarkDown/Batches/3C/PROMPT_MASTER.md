[HONESTY AND SECURITY FIRST]
[ONE PROMPT = ONE COHERENT END-TO-END BATCH]
[PRODUCTION-GRADE LOCAL IMPLEMENTATION — NOT DEPLOYMENT OR GO-LIVE APPROVAL]
[CONTINUE AUTOMATICALLY THROUGH ALL CHECKPOINTS]
[DO NOT ASK FOR “CONTINUE”]
[DO NOT CLAIM PASS; EXECUTOR ENDS AT READY FOR EXTERNAL RE-AUDIT]

# BATCH 3.C — BROWSER-SAFE NOTARY ASSIGNMENT AND CDD APPROVAL WORKSPACE

## 0. Objective

Implement Batch 3.C as real application code, completely separate from Final Report/document-generation work.

Deliver a browser-safe Notary Workspace covering:

1. authorized Administrator listing eligible corporate cases and verified Notaries;
2. atomic Notary assignment after corporate escrow is held;
3. assigned Notary loading every assigned corporate case, not only the latest case;
4. assigned Notary approving an existing canonical CDD assessment;
5. atomic transition `CDD_REVIEW → DOCUMENTS_PENDING` together with CDD approval;
6. idempotent replay, conflict handling, authorization, frontend retry, and canonical refresh;
7. real database, Edge Function, service/hook, Administrator UI, Notary UI, tests, and batch documentation.

This batch must not fake AHU/OSS, Kemenkumham stamping, document anchoring, e-KYC, signing, payout, or production deployment.

---

# 1. Repository and fixed point

Repository/product worktree:

`D:\justificadll`

Expected product fixed point:

- starting branch: `batch-3b-corporate-escrow`
- fixed-point HEAD: `e1620733da62b0851ae9d74b27f4a46886e1fb16`
- target branch: `batch-3c-notary-workspace`

The Final Report branch/worktree is unrelated to this batch. Never modify:

- `MarkDown/FinalReport/**`
- `MarkDown/Batches/FINAL_REPORT/**`
- any report-generation worktree
- any DOCX or PDF deliverable

## HARD PREFLIGHT

Before editing:

1. Read root `AGENTS.md` and `.agents/ROLE.md`.
2. Run:
   - `git branch --show-current`
   - `git rev-parse HEAD`
   - `git status --short`
   - `git diff --cached --name-only`
3. Verify there is no merge, rebase, cherry-pick, revert, or sequencer operation.
4. Staged index must be empty.
5. HEAD must be exactly:

   `e1620733da62b0851ae9d74b27f4a46886e1fb16`

6. Starting branch may be:
   - `batch-3b-corporate-escrow`; then create `batch-3c-notary-workspace`, or
   - `batch-3c-notary-workspace` if the execution environment created it from the exact fixed point.
7. If the target branch already exists unexpectedly at another commit: HARD STOP.
8. The working tree is known to contain extensive unrelated user work. Preserve it completely.
9. Do not use `reset`, `restore`, `checkout -- <file>`, `stash`, `clean`, amend, or broad formatting.
10. Inspect textual diffs of every intended in-scope existing file. Stat/CRLF drift alone is not an edit; verify using textual diff. If an in-scope file contains unknown substantive user edits, HARD STOP and report the exact file/diff.

After preflight, create/switch to:

`batch-3c-notary-workspace`

Do not push.

---

# 2. Required instruction and source-reading order

Read these before implementation:

1. `AGENTS.md`
2. `.agents/ROLE.md`
3. `MarkDown/CURRENT_STATE.md`
4. `MarkDown/BATCH_INDEX.md`
5. `MarkDown/ADR/ADR-003-release-claims-and-phase-gates.md`
6. `MarkDown/SYMBOLS_MAP.md`
7. `MarkDown/SQL_SECURITY_SYMBOLS.md`
8. `MarkDown/Batches/README.md`
9. Relevant migrations:
   - `supabase/migrations/20260722000017_p2_b4_corporate_concierge_and_bo.sql`
   - `supabase/migrations/20260722000020_p2_b8_notary_workspace_and_kemenkumham_seams.sql`
   - `supabase/migrations/20260722000021_phase2_holistic_security_hardening.sql`
   - `supabase/migrations/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql`
   - `supabase/migrations/20260728000025_phase2_backend_forensic_hardening.sql`
   - `supabase/migrations/20260729082554_enforce_canonical_snapshots_and_repair_participant_rls.sql`
   - Batch 3.B/3.B.1 settlement migrations
10. Relevant application source:
   - `justifiqa-frontend/src/services/phase2IntegrationService.ts`
   - `justifiqa-frontend/src/services/phase2SupabaseGateway.ts`
   - `justifiqa-frontend/src/hooks/useNotaryWorkspaceIntegration.ts`
   - `justifiqa-frontend/src/components/corporate/AdvocateCorporateCaseManager.tsx`
   - `justifiqa-frontend/src/components/corporate/notary/**`
   - `justifiqa-frontend/src/components/admin/**`
   - `justifiqa-frontend/src/pages/AdminDashboardPage.tsx`
   - `justifiqa-frontend/src/pages/admin/AdminLoginPage.tsx`
   - `justifiqa-frontend/src/router/**`
   - existing Phase 2 tests
11. Treat these as target architecture only, not proof of implementation:
   - `MarkDown/PHASE_2_ACTIVITY_DIAGRAMS.md`
   - `MarkDown/PHASE_2_SEQUENCE_DIAGRAMS.md`

If supported, read and follow:

- `.agents/skills/implement/SKILL.md`
- `.agents/skills/tdd/SKILL.md`
- `.agents/skills/frontend-ui-engineering/SKILL.md`
- `.agents/skills/code-review/SKILL.md`

Code, migrations, configuration, Git, and executed tests override narrative documents.

---

# 3. Locked scope decisions

## 3.1 Included

Implement exactly:

- minimal verified Notary qualification profile;
- Administrator assignment queue;
- atomic Notary assignment;
- multi-case assigned-Notary workspace;
- atomic CDD approval and case transition;
- Edge Function authorization boundary;
- frontend wiring and behavioral tests;
- SQL runtime and migration replay;
- database types and symbol maps;
- Batch 3.C DBB, Prompt Master, and DBS;
- narrowly factual control-plane updates.

## 3.2 Explicitly excluded

Do not implement or modify:

- Final Report files;
- live AHU/SABH/SABU/AHU-BO/OSS integration;
- official-government credentials, cookies, tokens, or request bodies;
- `government_submission_jobs` mutations;
- Kemenkumham/NIB approval claims;
- document upload, Storage bucket, WORM document anchor, or stamping completion;
- `submitNotaryStamping()` success;
- e-KYC/signing/biometrics/Batch 3.D;
- payout/release logic;
- payment provider initiation or webhook settlement;
- Qualifa;
- deployment, remote migration, merge, push, or go-live approval.

The stamping modal may remain visibly blocked/future work. It must not show fake success.

---

# 4. Locked domain and security decisions

## 4.1 Notary identity

`users_advocate` alone is not sufficient evidence that a user is a Notary.

Create a minimal qualification table such as:

`public.notary_profiles`

Use the existing advocate/auth UUID as its key so existing portal authentication remains compatible, but require a separate verified Notary profile for new assignments and CDD approval.

Minimum contract:

- `notary_id UUID PRIMARY KEY`
- FK to the existing authenticated professional record
- `license_number`
- jurisdiction city/province
- lifecycle status:
  - `PENDING`
  - `VERIFIED_ACTIVE`
  - `SUSPENDED`
  - `REVOKED`
- `verified_by_admin_id`
- `verified_at`
- timestamps

Requirements:

- RLS enabled and forced.
- Browser cannot create, verify, suspend, revoke, or edit Notary qualification.
- Do not trust JWT metadata to prove Notary status.
- New assignment requires:
  - `notary_profiles.status = VERIFIED_ACTIVE`;
  - existing professional verification predicate also passes.
- Preserve the existing `assigned_notary_id` compatibility FK unless changing it is proven safe and replay-tested.
- Existing assignment rows without a new profile must not be silently rewritten.
- A local test fixture may be added to `seed.sql` only when clearly marked `LOCAL_TEST_ONLY` and based on existing fixture users. Never add real personal data.

## 4.2 Administrator authorization

Assignment may only be initiated by a real row in `users_admin` whose role is:

- `COMPLIANCE_OFFICER`, or
- `SUPER_ADMIN`.

Never authorize using caller-provided `actorId`, browser role, or mutable user metadata alone.

The current six-digit field on the Admin login page is not proof of real MFA. Do not claim it is MFA.

For this batch:

- do not expand scope into complete MFA enrollment;
- remove or correct false “verified MFA/TOTP/FIDO2” success claims wherever this assignment UI directly relies on them;
- record real AAL2/FIDO2 enforcement as a production-readiness limitation.

## 4.3 Eligible assignment

A case is eligible only when:

- its escrow row exists;
- escrow status is `HELD_IN_ESCROW`;
- `funds_locked_at` is non-null;
- case stage is `ESCROW_LOCKED`;
- case is not cancelled;
- selected Notary is verified and active.

Assignment behavior:

- lock the case and relevant escrow rows;
- unassigned → selected Notary: success;
- exact same assignment replay: success with `replayed=true`, zero effective writes;
- assignment to a different Notary after assignment: `ASSIGNMENT_CONFLICT`;
- concurrent assignments must not produce last-write-wins;
- do not automatically choose a Notary;
- do not automatically transition the case merely to appear complete.

## 4.4 CDD approval

CDD screening results must already exist canonically. The browser and Notary cannot manufacture PEP/sanctions screening results.

Approval requires:

- caller is the case’s assigned, verified active Notary;
- case stage is exactly `CDD_REVIEW`;
- all relevant BO records required by the existing contract are `VERIFIED`;
- the referenced CDD assessment belongs to the case and assigned Notary;
- rules version matches;
- PEP and sanctions values are only `NO_MATCH` or `NOT_APPLICABLE`;
- decision is `PENDING`, or already `APPROVED` for exact replay.

One atomic RPC must:

1. lock the case and assessment;
2. validate all prerequisites;
3. update CDD decision to `APPROVED`;
4. set `assessed_at`;
5. transition the case from `CDD_REVIEW` to `DOCUMENTS_PENDING`;
6. return canonical IDs/stage and replay status.

If either update or transition fails, there must be zero partial writes.

Exact replay returns `replayed=true`. A changed payload using the same idempotency key must return `IDEMPOTENCY_CONFLICT`.

## 4.5 Direct browser mutations

Remove the existing browser-side direct update of `compliance_assessments`.

After this batch:

- authenticated browser may retain narrowly necessary RLS-protected reads;
- browser must not directly insert/update CDD decisions;
- browser must not directly update `assigned_notary_id`;
- privileged mutation functions must be revoked from `PUBLIC`, `anon`, and `authenticated`;
- only their intended server boundary/owner may execute them;
- do not broaden ACL or bypass FORCE RLS to make tests green.

---

# 5. Required backend architecture

Create one Edge Function:

`supabase/functions/notary-workspace/`

Use the established repository handler-factory pattern:

- `index.ts` is thin;
- `handler.ts` contains production logic with dependency injection;
- `handler.test.ts` tests the real handler behavior.

Configure in `supabase/config.toml`:

`verify_jwt = true`

The function must:

1. verify the Supabase user session;
2. derive actor ID server-side;
3. authorize actor through canonical database rows;
4. use a service client only inside the Edge Function;
5. call privileged mutation RPCs rather than browser/table mutation;
6. sanitize errors and responses;
7. never log JWT, service-role key, license number, CDD rationale, raw SQL error, or PII;
8. preserve explicit localhost CORS behavior consistent with existing functions; no wildcard origin.

Supported operations:

- `list_assignment_context`
  - Administrator only.
  - Returns minimal eligible-case projections and minimal verified-Notary projections.
- `assign_notary`
  - Administrator only.
  - Inputs: `caseId`, `notaryId`, `idempotencyKey`.
- `approve_cdd`
  - Assigned verified Notary only.
  - Inputs: `caseId`, `assessmentId`, `rulesVersion`, `idempotencyKey`.

Do not accept `actorId`, role, escrow status, case stage, CDD result, or Notary verification status from the request body.

Use safe stable response/error codes, including:

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `INVALID_PAYLOAD`
- `RESOURCE_NOT_FOUND`
- `NOTARY_NOT_VERIFIED`
- `ESCROW_NOT_HELD`
- `ASSIGNMENT_CONFLICT`
- `CDD_NOT_READY`
- `STAGE_CONFLICT`
- `IDEMPOTENCY_CONFLICT`
- `SERVER_ERROR`

Unknown database errors map to `SERVER_ERROR`; never relay raw database messages.

---

# 6. Required database work

Use the official Supabase migration workflow to create one new migration with a descriptive name such as:

`add_browser_safe_notary_workspace_boundary`

Migration requirements:

- add the verified Notary profile contract;
- add only the minimum idempotency/audit persistence needed by assignment and CDD approval;
- create atomic assignment RPC;
- create atomic CDD approval + transition RPC;
- preserve existing lifecycle guards;
- use row locks in deterministic order;
- reject non-finite/invalid input where relevant;
- enforce immutable idempotency bindings;
- revoke browser execution;
- remove authenticated direct CDD mutation grants/policies;
- revoke service-role direct `assigned_notary_id` update if the new RPC becomes its canonical mutation path;
- do not modify historical migrations.

Recommended function names:

- `public.fn_assign_corporate_notary_atomic(...)`
- `public.fn_approve_notary_cdd_atomic(...)`

Exact signatures may be refined after reading the existing conventions, but document them explicitly in DBB.

Create:

`Tools/notary_workspace_runtime.sql`

It must run in a transaction and finish with `ROLLBACK`.

Test:

- eligible assignment succeeds;
- exact replay is zero-write;
- changed replay conflicts;
- unverified/suspended Notary rejected;
- non-admin rejected;
- escrow not held rejected;
- concurrent different assignment cannot both win;
- direct authenticated case assignment denied;
- direct authenticated CDD mutation denied;
- assigned Notary can read own case;
- unrelated professional cannot read/mutate it;
- CDD approval and stage transition are atomic;
- invalid BO/screening/rules/stage rejected with zero partial writes;
- exact CDD replay succeeds;
- mutation after replay conflicts;
- `PUBLIC`, `anon`, and `authenticated` cannot execute privileged RPCs.

Run a clean disposable-database migration replay. Do not reset the user’s main local database.

Regenerate:

`justifiqa-frontend/src/types/database.types.ts`

using an official mechanical generation path. Never hand-edit generated database types.

---

# 7. Required frontend work

## 7.1 Administrator assignment UI

Add a real assignment panel to the existing Administrator portal, preferably as a focused component under:

`justifiqa-frontend/src/components/admin/`

It must:

- load assignment context through `notary-workspace`;
- show only eligible cases and verified active Notaries returned by the server;
- require explicit Administrator selection and confirmation;
- retain the exact `caseId + notaryId + idempotencyKey` on retry;
- prevent duplicate concurrent submission;
- refresh canonical assignment state after success;
- use accessible labels, `role="alert"` for errors, and stable loading state;
- not show mock audit claims or fake success.

Do not redesign the whole Administrator portal.

## 7.2 Notary workspace

Update the existing Notary integration so it handles every assigned case rather than `.limit(1)` latest-case behavior.

Requirements:

- return an array/list of assigned workspaces;
- allow selection of a case;
- preserve RLS-protected reads;
- approve CDD only through the Edge Function;
- use stable idempotency keys on retry;
- refresh canonical workspace after mutation;
- display success only when canonical refresh shows:
  - assessment `APPROVED`; and
  - case stage `DOCUMENTS_PENDING`;
- unrelated Notaries must see no case;
- never expose private rationale or anti-tipping-off information to the client UI.

## 7.3 Existing blocked actions

`submitNotaryStamping()` and the Kemenkumham stamping UI must remain honestly blocked/future work.

Do not:

- invent upload success;
- insert document anchors from the browser;
- accept browser-computed digest as canonical;
- claim AHU/NIB was verified;
- mutate `government_submission_jobs`.

---

# 8. TDD requirements

Use red → green → refactor.

Write behavioral tests before or alongside implementation. Do not use:

- `assert.ok(true)`;
- regex/source-text inspection as proof of behavior;
- arbitrary sleeps;
- fake mocks that bypass the production boundary being claimed;
- claims of E2E when only a unit mock ran.

Required tests include:

## Edge handler

- missing/invalid JWT → 401;
- wrong role → 403;
- admin row/role checked server-side;
- Notary profile checked server-side;
- actor ID from body ignored/rejected;
- assignment success/replay/conflict;
- CDD success/replay/conflict;
- safe error mapping;
- raw SQL/JWT/PII not leaked.

## Frontend/service/hook

- assignment retry reuses exact attempt;
- reset clears retry context;
- single-flight blocks duplicate request;
- changed payload with same idempotency key conflicts before a second call where applicable;
- multiple assigned cases remain selectable;
- canonical refresh is required before success;
- other Notary’s case does not appear;
- CDD mutation uses Edge Function, not direct table update;
- stamping remains blocked;
- accessible loading/error/success states.

## SQL

All lifecycle, ACL, replay, concurrency, and rollback cases listed in Section 6.

---

# 9. Documentation package

Create:

`MarkDown/Batches/3C/BATCH.md`
`MarkDown/Batches/3C/PROMPT_MASTER.md`
`MarkDown/Batches/3C/LEARNING.md`

## BATCH.md

Record:

- objective;
- fixed point;
- branch;
- scope/non-scope;
- locked decisions;
- source discovery;
- checkpoint state;
- exact changed files;
- RPC/Edge contracts;
- test commands and factual results;
- limitations;
- next exact action;
- final executor status.

Do not predict the future commit hash.

## PROMPT_MASTER.md

Store this Prompt Master verbatim. If the environment cannot recover it verbatim, write `NOT_RECORDED_VERBATIM`; do not reconstruct and call it verbatim.

## LEARNING.md

Explain in Indonesian:

- trusted server boundary;
- authentication versus authorization;
- verified Notary qualification profile;
- atomic multi-row transition;
- row locking and idempotency;
- replay versus conflict;
- RLS reads versus privileged writes;
- frontend single-flight and retry;
- why AHU/OSS and stamping remain excluded.

Include direct paths to the implemented source and a short mini-quiz.

## Control-plane updates

Only after the implementation gates pass:

- add/update Batch 3.C in `MarkDown/BATCH_INDEX.md`;
- update `MarkDown/CURRENT_STATE.md` to `READY_FOR_EXTERNAL_REAUDIT`, not `ACCEPTED_LOCAL`;
- update `MarkDown/DEMO_GUIDE.md` factually;
- update presentation readiness copy/tests only to say the Batch 3.C candidate is pending external audit;
- do not mark it `ACCEPTED_LOCAL`; only an external auditor may do so;
- keep the broader SD-P2-01/Notary stamping scope `PARTIAL` or future where appropriate.

Do not touch Final Report files.

---

# 10. Checkpoints and interruption recovery

Maintain the current checkpoint and `Next Exact Action` inside `MarkDown/Batches/3C/BATCH.md`.

Use:

- CP-00 — preflight, branch, provenance
- CP-01 — discovery and locked contract
- CP-02 — TDD red evidence
- CP-03 — migration, RPC, SQL runtime
- CP-04 — Edge Function boundary
- CP-05 — Administrator + Notary frontend wiring
- CP-06 — integration and full verification
- CP-07 — DBB/DBS/maps/control-plane + two-axis review
- CP-08 — exact staging, commit, and post-commit audit

If interrupted:

1. inspect physical Git state;
2. read the DBB checkpoint;
3. audit the current diff;
4. preserve valid work;
5. resume from the first unfinished checkpoint;
6. do not restart completed work.

Continue automatically after every completed checkpoint. Stop only for:

- fixed-point mismatch;
- active Git operation;
- staged contamination;
- unknown substantive in-scope user WIP;
- unavailable canonical business/security decision that cannot safely be inferred;
- repeated unrecoverable infrastructure blocker.

---

# 11. Verification gates

Run the narrowest tests first, then all relevant gates.

Required final gates:

- new Notary frontend/service/hook tests;
- `npm run test:phase2`;
- `npm run typecheck:phase2-tests`;
- `npx tsc -b`;
- `npm run lint`;
- `npm run build`;
- Notary Edge handler tests;
- relevant existing Corporate Intake and Payment Webhook handler tests;
- `Tools/notary_workspace_runtime.sql` with rollback;
- Phase 2 forensic static tests;
- relevant Phase 2 forensic SQL runtime;
- database lint;
- clean disposable migration replay;
- official generated database types verification;
- `node Tools/generate_symbol_map.mjs`;
- `node Tools/generate_symbol_map.mjs --check`;
- `node --test --test-isolation=none Tools/symbol_map_lib.test.mjs`;
- `git diff --check`;
- `git diff --cached --check`;
- staged secret/control-character/debug scan.

If the main working tree is dirty, generate/check symbol maps from a clean candidate containing exactly:

`HEAD + authorized Batch 3.C changes`

Do not stage inherited dirty map content.

A Windows sandbox `spawn EPERM` may be retried using the identical command outside the sandbox. Report it precisely; do not convert infrastructure failure into product PASS.

For HTTP/database integration proof, prefer the actual locally served Edge Function. If Edge Runtime cannot run on Windows, a production handler factory invoked through a real HTTP wrapper against real local Auth/PostgREST/database may be used, but report the exact boundary and do not call it deployed Edge-runtime E2E.

---

# 12. Two-axis review

Before staging, perform:

## Axis A — spec/correctness

Verify:

- every locked requirement;
- assignment eligibility;
- authorization;
- row-lock ordering;
- replay/conflict behavior;
- CDD atomicity;
- multi-case workspace;
- canonical refresh;
- no fake stamping/AHU/OSS.

## Axis B — standards/security

Verify:

- no browser privileged mutation;
- no arbitrary JWT role trust;
- no unverified Notary assignment;
- no raw PII/credential/SQL leakage;
- no ACL broadening;
- no false MFA claim;
- no race, retry, or stale-state bug;
- accessibility and React state correctness;
- dirty-tree isolation;
- documentation is factual.

Resolve all P0/P1 findings and re-review. P2 cosmetic or historical debt may be recorded without opening an endless correction chain.

---

# 13. Staging and commit

Stage only files actually belonging to Batch 3.C.

Before commit:

1. print exact staged file list;
2. ensure every staged file is within scope;
3. inspect staged diff;
4. run cached whitespace and secret scans;
5. confirm unrelated user work remains unstaged.

Commit exactly:

`feat(notary): wire browser-safe assignment and approval workspace`

Do not amend, push, deploy, merge, or begin Batch 3.D.

After commit verify:

- parent is exactly `e1620733da62b0851ae9d74b27f4a46886e1fb16`;
- commit contains only Batch 3.C files;
- staged index is empty;
- no Git operation is active;
- unrelated user changes remain preserved and unstaged.

---

# 14. Required final report

Return:

1. preflight evidence;
2. new branch;
3. commit hash and exact parent;
4. exact committed file list;
5. database objects and ACL;
6. Edge Function operations;
7. Administrator assignment behavior;
8. Notary multi-case workspace behavior;
9. exact CDD approval and transition behavior;
10. replay/concurrency evidence;
11. exact test commands and pass/fail counts;
12. migration replay and SQL rollback evidence;
13. two-axis findings and resolutions;
14. limitations:
    - no live AHU/OSS;
    - no stamping/document anchor;
    - no Batch 3.D;
    - no production MFA/go-live proof;
15. confirmation of no push/deploy/merge/remote migration;
16. post-commit Git state;
17. final status exactly:

`READY FOR EXTERNAL RE-AUDIT`

Never self-certify `PASS` or `ACCEPTED_LOCAL`.

Start now. Continue through CP-08 without asking for further confirmation.
