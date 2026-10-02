# Prompt Master — Batch 3.D (verbatim record)

> Prompt di bawah adalah teks Prompt Master yang benar-benar diterima pada sesi eksekusi fresh Batch 3.D (direkam verbatim; wrapper transport `<USER_REQUEST>` tidak disertakan). Tiga pesan "Continue" berikutnya dalam sesi yang sama hanyalah pe‍rintah lanjutan sesi, bukan perubahan scope.

---

[ROLE: EXECUTOR — BATCH 3.D]
[HONESTY AND SECURITY FIRST]
[FORWARD-DRIVEN WORKFLOW]
[ONE BATCH, ONE COHERENT RESULT]
[CONTINUE AUTOMATICALLY BETWEEN CHECKPOINTS]
[NO FAKE PROVIDER, NO RAW BIOMETRICS, NO FALSE E2E CLAIM]

Execute Batch 3.D in a FRESH SESSION.

==================================================
A. REPOSITORY AND FIXED POINT
==================================================

Repository:
D:\justificadll

Required source branch:
batch-3c-notary-workspace

Required fixed-point HEAD:
3ff11db8037cadf186839e708c660ae70166ffcd

Required parent:
ccbb2fdfd40d89d519f1e06b6abbd3436dac9d1f

Target branch:
batch-3d-ekyc-signing

Required commit message:
feat(ekyc): harden callback and canonical signing workflow

First read completely:

- D:\justificadll\AGENTS.md
- D:\justificadll\.agents\ROLE.md
- D:\justificadll\MarkDown\CURRENT_STATE.md
- D:\justificadll\MarkDown\BATCH_INDEX.md
- D:\justificadll\MarkDown\Batches\README.md
- D:\justificadll\MarkDown\EKYC_AND_MULTIPARTY_SIGNING_LEGAL_MATRIX.md
- D:\justificadll\MarkDown\TRACEABILITY_MATRIX.md
- D:\justificadll\MarkDown\SYMBOLS_MAP.md
- D:\justificadll\MarkDown\SQL_SECURITY_SYMBOLS.md

Use the repository’s relevant skills, especially Supabase/PostgreSQL, frontend engineering, TDD, implementation, and security review guidance.

==================================================
B. HARD PREFLIGHT — DO THIS BEFORE ANY EDIT
==================================================

1. Verify:
   - current repository is D:\justificadll;
   - source branch is batch-3c-notary-workspace;
   - HEAD is exactly 3ff11db8037cadf186839e708c660ae70166ffcd;
   - HEAD^ is exactly ccbb2fdfd40d89d519f1e06b6abbd3436dac9d1f;
   - staged index is empty;
   - no merge, rebase, cherry-pick, revert, or sequencer is active.

2. The working tree is expected to contain many unrelated user changes. Preserve all of them.

3. Inspect physical provenance and current diffs for every prospective in-scope file. If an in-scope file already has an unknown user modification that cannot be separated safely, HARD STOP and report the exact file and diff.

4. If all gates pass:
   - create and switch to branch batch-3d-ekyc-signing from the exact fixed point;
   - do not reset, restore, checkout individual files, stash, clean, or amend.

5. Record the exact Prompt Master text actually received in:
   MarkDown/Batches/3D/PROMPT_MASTER.md

Do not reconstruct or silently modify the prompt.

==================================================
C. BATCH OBJECTIVE
==================================================

Implement and prove a secure, provider-neutral local e-KYC callback workflow and canonical signing-envelope read model.

This batch must close real local integration gaps without pretending that a live e-KYC/PSrE provider has been selected.

The accepted result may truthfully claim:

- timestamped signed e-KYC callbacks are authenticated and processed atomically;
- replay, mutated replay, party-scope mismatch, role mismatch, liveness sequence, TTL expiry, illegal-party halt, and refund transitions are fail-closed;
- frontend state comes from canonical Supabase data;
- UI retry/loading/error behavior is real and behaviorally tested;
- Justica stores metadata and digests only;
- no raw KTP, selfie, liveness media, face template, embedding, private key, credential, or raw provider payload is persisted or logged.

The result MUST NOT claim:

- a live provider integration;
- production PSrE certification;
- production-ready TTE;
- completed signing-provider initiation;
- a real provider redirect/session URL;
- biometric capture performed by Justica;
- full production E2E.

Provider selection and live provider initiation remain explicitly:

BLOCKED_BY_PROVIDER_SELECTION

Do not invent VIDA, Privy, ASLI RI, Verihubs, Mekari Sign, credentials, URLs, callback formats, SDKs, certificates, or legal approval.

==================================================
D. LOCKED ARCHITECTURAL INVARIANTS
==================================================

1. Zero raw biometric storage is absolute.

Prohibited in database, Storage, logs, analytics, error messages, tests, fixtures, documentation examples, URLs, and generated artifacts:

- raw KTP/NIK;
- cropped identity documents;
- selfie/photo/video/audio;
- liveness frames;
- biometric templates or embeddings;
- provider credentials or complete raw callback payloads.

Allowed persistence is limited to minimized metadata:

- envelope/party/user identifiers;
- trusted role binding;
- provider name and opaque reference;
- verification type and status;
- bounded attempt count;
- lowercase SHA-256 evidence/audit-bundle digest;
- timestamps and minimal workflow metadata.

2. Callback authentication order:

- enforce POST;
- apply a bounded request-body size;
- preserve exact raw request bytes;
- verify timestamped HMAC against exact raw bytes;
- reject stale, malformed, missing, or invalid signatures;
- only after successful signature verification may JSON be parsed;
- validate an exact allowlist of fields;
- only after validation may any database read or mutation occur.

Invalid authentication or malformed payload must cause zero database calls.

3. The browser is untrusted.

- Never accept authoritative user identity, role, envelope ownership, signing order, provider outcome, document digest, or workflow status from browser state.
- Bind every callback subject to canonical envelope and party rows inside the trusted database boundary.
- Browser code must not call privileged RPCs directly and must perform no direct INSERT/UPDATE/UPSERT/DELETE on protected tables.
- service_role must never be exposed to browser code.

4. Atomicity and replay:

- callback state mutation must pass through one atomic SECURITY DEFINER RPC;
- use row locking and canonical constraints, not client timing;
- identical provider-event replay must return the original canonical result with zero duplicate writes;
- reuse of the same provider-event identifier with altered payload must fail with an idempotency conflict;
- callback replay must remain safe after later workflow progression;
- no check-then-write race outside the transaction may be treated as proof of idempotency.

5. Workflow rules:

- liveness failures must be strictly sequential and capped at three;
- third liveness failure globally halts the envelope and uses the canonical idempotent refund transition;
- confirmed illegal-party outcome globally halts all parties and uses the canonical refund transition;
- expired seven-day window is fail-closed;
- manual-review status must not automatically become a final legal rejection;
- terminal history remains append-only/WORM;
- document digest must never silently change within an existing envelope.

6. UI truthfulness:

- remove any hard-coded/default provider claim such as silently presenting VIDA when no canonical provider exists;
- do not present OTP or a provider-session action as working if the production provider boundary is unavailable;
- no fake success, fake redirect, simulated provider completion, or mock button in production UI;
- loading must be observable and prevent duplicate submission;
- retry must preserve the exact attempt tuple;
- reset/invalidation must clear stale retry context;
- refresh failure, missing envelope, wrong document scope, changed participant, and stale response must fail closed;
- a PASSED identity verification is not automatically equivalent to a completed multi-party signature;
- party and envelope status displayed by the UI must come from canonical rows.

==================================================
E. REQUIRED DISCOVERY
==================================================

Physically inspect at minimum:

- supabase/functions/ekyc-callback/index.ts
- supabase/functions/_shared/http.ts
- supabase/functions/_shared/webhook.ts
- supabase/functions/_shared/validation.ts
- supabase/functions/_shared/rest.ts
- supabase/config.toml
- supabase/migrations/20260722000018_p2_b5_b6_ekyc_and_signing_seams.sql
- supabase/migrations/20260722000022_p2_b5a_ekyc_and_escrow_schema.sql
- supabase/migrations/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql
- supabase/migrations/20260722000024_p2_b5c_pg_cron_ttl_scheduler.sql
- supabase/migrations/20260728000025_phase2_backend_forensic_hardening.sql
- justifiqa-frontend/src/hooks/useEkycIntegration.ts
- justifiqa-frontend/src/services/phase2IntegrationService.ts
- justifiqa-frontend/src/services/phase2SupabaseGateway.ts
- justifiqa-frontend/src/components/signing/EkycVerificationWizard.tsx
- justifiqa-frontend/src/components/signing/MultiPartySigningPanel.tsx
- justifiqa-frontend/src/components/signing/ekyc/*
- justifiqa-frontend/test/phase2IntegrationService.test.ts
- applicable generated database types and existing test infrastructure.

Determine actual behavior from source. Do not trust old documentation summaries.

==================================================
F. REQUIRED IMPLEMENTATION
==================================================

F1. Callback boundary

Refactor the e-KYC callback into a testable production handler boundary:

- keep index.ts thin;
- expose a handler or narrow dependency-injected handler factory;
- retain production dependencies by default;
- never create a test-only implementation that diverges from production;
- remove unnecessary pre-read logic if the atomic RPC already owns replay validation;
- sanitize database/RPC errors into stable public error codes;
- do not leak SQL text, internal table names, service credentials, provider payloads, or raw identifiers in UI-facing errors/logs;
- keep verify_jwt=false only because this is an external signed callback; HMAC verification is mandatory.

F2. Database contract

Audit the existing callback RPC and related guards line by line.

If a P0/P1 correctness, replay, privilege, search_path, scope-binding, nullable-comparison, terminal-state, or concurrency defect exists:

- add a new forward-only migration;
- do not edit historical migrations;
- use hardened search_path;
- revoke PUBLIC, anon, and authenticated execution;
- grant only the minimum trusted role;
- prevent direct protected-table DML where the canonical RPC is required.

Do not add a migration merely to create activity. If the existing contract is correct, prove it with tests and record that no schema change was needed.

F3. Provider initiation boundary

Live provider selection is unavailable.

Therefore:

- do not manufacture an external envelope ID, provider session, redirect URL, OTP acceptance, or SDK result;
- production initiation must fail with a stable, honest code such as BLOCKED_BY_PROVIDER_SELECTION;
- distinguish this expected blocker from server failure;
- UI must explain the blocker without implying successful initiation.

A narrow provider adapter interface may be created only if it improves the production boundary and the unconfigured production adapter fails closed. A fake adapter may exist only inside tests and must never be imported by production code.

F4. Frontend canonical integration

Harden the actual hook/service/UI:

- dependency injection only at a narrow testable boundary;
- maintain the production default;
- exact-attempt retry semantics;
- single-flight protection;
- stale-response/generation guard;
- refresh after successful server mutation;
- reject mismatched envelope/document/party results;
- reset or selection changes invalidate old attempts;
- accessible status and role=alert behavior;
- no hard-coded provider claim;
- no source-text-only tests.

F5. Multi-party signing boundary

Do not fabricate signing completion.

This batch may expose and verify the canonical signing-envelope read model and party ordering/status already stored in Supabase.

If discovery proves a provider-neutral signing callback mutation is already sufficiently specified by canonical migrations and legal matrix, it may be implemented only with:

- signed callback verification;
- frozen document digest;
- exact recipient/envelope binding;
- enforced signing order;
- atomic transition;
- idempotent replay;
- terminal-state protection;
- metadata-only event evidence.

If these inputs are not fully specified, keep signing mutation explicitly blocked and document the missing provider contract. Do not guess.

==================================================
G. TESTS — REAL BEHAVIOR ONLY
==================================================

Use TDD for changed behavior.

Required handler tests include:

- method rejection;
- missing/malformed signature;
- invalid signature;
- stale timestamp;
- exact raw-body verification;
- oversized/malformed JSON;
- unknown fields;
- invalid UUID, role, verification type, outcome, digest, timestamp, and attempt combinations;
- zero database call before authentication and validation;
- stable sanitized error mapping;
- valid callback;
- identical replay;
- mutated replay conflict;
- envelope/party/user/role mismatch;
- out-of-order liveness attempt;
- third liveness failure global halt/refund;
- illegal-party global halt/refund;
- expired window;
- manual review;
- absence of raw biometric persistence/logging.

Required frontend behavioral tests include:

- production hook/service boundary, not source regex;
- canonical workspace load;
- honest provider-blocked state;
- no default provider claim;
- loading and double-submit prevention;
- exact retry tuple;
- reset/invalidation;
- stale response ignored;
- refresh error retained and exposed;
- missing/mismatched envelope fails closed;
- PASSED e-KYC does not fabricate SIGNED/COMPLETED;
- canonical party order and status.

Forbidden tests:

- assert.ok(true);
- tests that only search production source text;
- fake components substituted for production components;
- sleep-based concurrency proof;
- mocks presented as HTTP/database E2E;
- a test that passes when the production path is disconnected.

==================================================
H. DATABASE AND DOCKER SAFETY
==================================================

The machine contains protected main and recovery Docker resources.

Before any Docker mutation:

1. Confirm docker version, docker ps -a, and docker volume ls respond normally.
2. Capture exact container names, IDs, states, and exact volume names.
3. Treat every existing resource containing any of these identifiers as protected:
   - justificadll
   - recovery
   - 3c4
   - 3c5
   - main
   - b3b1
4. Never stop, restart, rename, remove, mount, inspect data from, or use a protected resource as fallback.
5. Never run docker prune, system prune, volume prune, supabase stop --no-backup, or wildcard deletion.
6. Do not restart Docker Desktop or WSL. If the API returns HTTP 500, hangs, or becomes unstable, preserve WIP, write a checkpoint, and HARD STOP.

Use only an isolated disposable Batch 3.D environment whose resources are unmistakably named with:

justifiqa_3d_disp

The exact database container permitted for SQL/runtime probes is:

supabase_db_justifiqa_3d_disp

The probe must require this exact name and reject fallback or names containing protected identifiers.

Prefer the smallest disposable topology needed. Do not start analytics or unrelated services merely for convenience.

A disposable resource may be removed only when:

- it was created and recorded by this Batch 3.D session;
- its exact literal name and ID were recorded;
- evidence has already been captured;
- removal does not touch any pre-existing resource.

After teardown, re-enumerate Docker and prove all protected names and IDs remain unchanged.

If these invariants cannot be proven, HARD STOP. Never use the main database to make a mandatory test pass.

==================================================
I. VERIFICATION GATES
==================================================

Run narrow tests first, then all applicable gates.

At minimum, when relevant:

- e-KYC callback handler tests;
- shared webhook/crypto/validation tests;
- new frontend e-KYC behavioral tests;
- npm run test:phase2;
- npm run typecheck:phase2-tests;
- npx tsc -b;
- npm run lint;
- npm run build;
- SQL runtime assertions against the exact disposable database;
- clean migration replay if a new migration exists;
- database lint/advisor checks where available;
- git diff --check;
- git diff --cached --check;
- staged secret/control-character/debug scan.

For SQL runtime proof:

- use real transactions and real constraints/RPCs;
- prove rollback and zero contamination;
- prove exact row counts and terminal state;
- distinguish handler-factory + real database proof from a real deployed Edge Runtime HTTP E2E;
- never call a simulation “production E2E”.

If a Docker or sandbox command fails, report the exact infrastructure failure. Do not convert it into PASS.

==================================================
J. GENERATED MAPS
==================================================

If TypeScript exports or PostgreSQL symbols change:

- regenerate MarkDown/SYMBOLS_MAP.md;
- regenerate MarkDown/SQL_SECURITY_SYMBOLS.md;
- run node Tools/generate_symbol_map.mjs;
- run node Tools/generate_symbol_map.mjs --check;
- run node --test --test-isolation=none Tools/symbol_map_lib.test.mjs.

Because the working tree is dirty, generate and verify from a clean candidate containing only:

- fixed-point HEAD;
- authorized Batch 3.D changes.

On Windows use a method equivalent to:

git -c core.autocrlf=false archive <candidate-tree>

Do not generate maps from the dirty working tree and do not copy unrelated dirty files into the candidate.

==================================================
K. DOCUMENTATION PACKAGE
==================================================

Create:

- MarkDown/Batches/3D/BATCH.md
- MarkDown/Batches/3D/PROMPT_MASTER.md
- MarkDown/Batches/3D/LEARNING.md

BATCH.md must include:

- objective;
- input fixed point;
- exact scope;
- checkpoint status;
- finding-to-fix-to-test matrix;
- changed files;
- exact commands and pass/fail counts;
- Docker/disposable evidence;
- security and privacy invariants;
- factual limitations;
- next exact action;
- final executor status.

LEARNING.md must explain in Indonesian:

- why exact raw bytes matter for HMAC;
- callback authentication ordering;
- idempotent replay versus mutated replay;
- row locking and atomic RPC behavior;
- why zero raw biometric storage is mandatory;
- difference between e-KYC PASSED and TTE/signing COMPLETED;
- why live provider selection remains a separate gate;
- retry, single-flight, stale-response guard, and canonical refresh;
- direct citations to actual source paths.

Update only if materially changed:

- MarkDown/CURRENT_STATE.md
- MarkDown/BATCH_INDEX.md
- MarkDown/TRACEABILITY_MATRIX.md
- MarkDown/DEMO_GUIDE.md

Do not rewrite historical DBB/DBS merely for formatting.

Do not touch FinalReport, Qualifa, Batch 3.A, 3.B, or 3.C historical records.

==================================================
L. CHECKPOINTS AND RECOVERY
==================================================

Maintain these checkpoints:

CP-00 — hard preflight and provenance
CP-01 — discovery and threat/contract matrix
CP-02 — RED behavioral tests
CP-03 — callback/database correction
CP-04 — frontend canonical integration
CP-05 — isolated runtime and full verification
CP-06 — DBB/DBS/maps and two-axis review
CP-07 — exact staging, commit, and post-commit audit

After every checkpoint:

- update MarkDown/Batches/3D/BATCH.md or CHECKPOINT.md;
- state what is physically complete;
- state the next exact action;
- continue automatically.

If interrupted, resume from physical repository state. Do not restart completed checkpoints and do not discard valid WIP.

Stop only when:

- a verified HARD STOP condition exists; or
- CP-07 and post-commit verification have succeeded.

==================================================
M. TWO-AXIS REVIEW
==================================================

Before commit, perform:

Axis A — specification/correctness:

- callback contract;
- actor/party/envelope binding;
- replay and mutated replay;
- liveness sequencing;
- TTL/global halt/refund;
- signing state honesty;
- frontend retry/invalidation;
- test evidentiary quality.

Axis B — standards/security:

- zero raw biometrics;
- HMAC before parsing/mutation;
- RLS/ACL/search_path;
- no privileged browser path;
- no secret/raw payload leakage;
- no fake provider;
- Docker isolation;
- dirty-tree preservation;
- documentation accuracy.

Fix every in-scope P0/P1, rerun the affected tests, and perform one re-review.

Record P2/documentation debt without opening an endless correction chain unless it materially changes correctness or safety.

==================================================
N. STAGING AND COMMIT
==================================================

Only after every mandatory gate passes:

1. Determine the exact final allowlist from files physically changed by Batch 3.D.
2. Stage each allowed path explicitly.
3. Do not use git add ., git add -A, wildcard staging, or directory-wide staging that may capture user work.
4. Verify staged files one by one.
5. Run git diff --cached --check.
6. Inspect the staged diff.
7. Scan the staged diff for secrets, raw PII/biometrics, debug artifacts, and unrelated files.
8. Commit exactly:

feat(ekyc): harden callback and canonical signing workflow

Do not amend, push, deploy, merge, or apply remote migrations.

==================================================
O. POST-COMMIT AUDIT
==================================================

Verify:

- commit parent is exactly 3ff11db8037cadf186839e708c660ae70166ffcd;
- commit contains only Batch 3.D files;
- staged index is empty;
- in-scope working files are clean;
- unrelated user changes remain unstaged;
- no Git operation is active;
- protected Docker resources retain their prior names and IDs;
- disposable Batch 3.D resources were either safely removed or explicitly reported;
- no push, deploy, merge, remote migration, or next batch occurred.

Final executor status must be exactly one of:

READY FOR EXTERNAL RE-AUDIT
BLOCKED — <verified reason>

Never self-certify PASS or ACCEPTED_LOCAL.

==================================================
P. FINAL REPORT
==================================================

Report:

1. preflight evidence;
2. branch, new commit, and parent;
3. exact committed files;
4. actual implementation boundary;
5. every finding and resolution;
6. callback authentication order;
7. replay/mutated-replay evidence;
8. liveness, TTL, halt, and refund evidence;
9. frontend retry/single-flight/invalidation behavior;
10. provider-selection blocker;
11. zero-biometric-storage evidence;
12. SQL/HTTP/frontend test counts;
13. Docker isolation and teardown evidence;
14. maps and clean-candidate evidence;
15. two-axis review and re-review results;
16. factual limitations;
17. post-commit Git state;
18. confirmation that no push/deploy/merge/remote migration occurred;
19. final status.

Begin now. Do not ask for Continue. Do not merely narrate the next action.
