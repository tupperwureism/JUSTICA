[ROLE]
You are the sole executor for Justifiqa Batch 3.C.2. Work autonomously until the required local commit and post-commit audit succeed, or stop only on a verified HARD STOP.

[CORE PRINCIPLES]
- Honesty and security first.
- Repository source, migrations, Git objects, and actual command results are truth.
- AI reports and DBB documents are untrusted claims until physically verified.
- One prompt equals one complete corrective batch.
- Local implementation only; no production approval.
- Do not expose hidden chain-of-thought. Report observable evidence only.
- Read and obey repository AGENTS.md and .agents/ROLE.md.
- Use applicable repository skills if available; do not install anything.

==================================================
1. BATCH IDENTITY
==================================================

Batch: 3.C.2 — Close Notary Workspace Runtime, Idempotency, ACL, and Canonical Refresh Gaps

Repository:
D:\justificadll

Required branch:
batch-3c-notary-workspace

Required fixed-point HEAD:
3e5e4a705241a82ef9b669892cd4dd2230fc0033

Required parent of fixed point:
1a6c89e00d8d6087542b9bb230d50197f020f23f

Required commit message:
fix(notary): close runtime and idempotency gaps

Executor final status:
READY FOR EXTERNAL RE-AUDIT

Never self-certify PASS. External acceptance belongs to a separate auditor.

==================================================
2. HARD PREFLIGHT
==================================================

Before editing, verify physically:

1. Current repository is D:\justificadll.
2. Branch is exactly batch-3c-notary-workspace.
3. HEAD is exactly:
   3e5e4a705241a82ef9b669892cd4dd2230fc0033
4. HEAD^ is exactly:
   1a6c89e00d8d6087542b9bb230d50197f020f23f
5. Staged index is empty.
6. No merge, rebase, cherry-pick, revert, or sequencer operation is active.
7. The in-scope files listed below are clean against HEAD.
8. A large unrelated dirty working tree is expected and must remain untouched.
9. The executor report’s alternative full SHA
   3e5e4a7ec4e8f192b0c39fba08892699f8d1dae7
   is invalid. Do not use it.

If any required branch, HEAD, parent, index, active Git operation, or in-scope provenance condition fails, HARD STOP. Report evidence and do not move HEAD automatically.

Forbidden Git operations:

- reset
- restore
- checkout
- stash
- clean
- amend
- rebase
- merge
- cherry-pick
- force operations
- push

Do not delete or modify unrelated user files.

==================================================
3. REQUIRED READING ORDER
==================================================

Read only what is relevant, in this order:

1. AGENTS.md
2. .agents/ROLE.md
3. MarkDown/SYMBOLS_MAP.md
4. MarkDown/SQL_SECURITY_SYMBOLS.md
5. MarkDown/CURRENT_STATE.md
6. MarkDown/BATCH_INDEX.md
7. MarkDown/Batches/README.md
8. MarkDown/Batches/3C_1/PROMPT_MASTER.md
9. MarkDown/Batches/3C_1/BATCH.md
10. supabase/migrations/20260715000001_domain1_identity_rbac_licensing.sql
11. supabase/migrations/20260721000015_harden_verified_advocate_rls_helper.sql
12. supabase/migrations/20260722000016_p2_b3_service_orders_expand_only.sql
13. supabase/migrations/20260722000017_p2_b4_corporate_concierge_and_bo.sql
14. supabase/migrations/20260722000022_p2_b5a_ekyc_and_escrow_schema.sql
15. supabase/migrations/20260722000023_p2_b5b_ekyc_and_escrow_rpcs.sql
16. supabase/migrations/20260820000001_add_browser_safe_notary_workspace_boundary.sql
17. Tools/notary_workspace_runtime.sql
18. supabase/functions/notary-workspace/handler.ts
19. supabase/functions/notary-workspace/index.ts
20. supabase/functions/notary-workspace/handler.test.ts
21. Relevant frontend hook, service, component, gateway, type, and tests listed in the allowlist.

Do not assume that `public.audit_events` exists. Verify every referenced table, function, column, constraint, privilege, and lifecycle transition from repository migrations.

==================================================
4. OBJECTIVE AND DEFINITION OF DONE
==================================================

Repair Batch 3.C.1 so that:

1. Both privileged RPC success paths execute against the real canonical schema.
2. Audit events use the existing canonical WORM compliance event primitive.
3. Migration history has a valid forward correction; do not rewrite the committed 3.C.1 migration.
4. Exact replay is serialized and zero-write, including concurrent first use.
5. Reuse with a new key or mutated payload is rejected.
6. Direct service-role mutation of `assigned_notary_id` is removed.
7. Database and Edge boundaries validate UUID-formatted idempotency keys.
8. Admin assignment success requires refreshed canonical server data.
9. CDD success requires refreshed case and assessment data.
10. Refresh failure retains the exact mutation attempt and exact idempotency key.
11. Browser code never manufactures `replayed=true` from current state.
12. SQL runtime fixtures satisfy the actual clean schema.
13. Clean disposable migration replay, real SQL runtime, and real concurrency verification pass.
14. `database.types.ts` is regenerated mechanically from the clean migrated database, never hand-edited.
15. Required tests, typechecks, lint, build, maps, reviews, and Git checks pass.
16. One local corrective commit is created.
17. No Batch 3.D work begins.

==================================================
5. LOCKED EXTERNAL AUDIT FINDINGS
==================================================

Treat every item below as a required finding-to-fix-to-test entry.

FINDING A — Nonexistent audit table, P0
FINDING B — Invalid migration evolution
FINDING C — Missing idempotency serialization
FINDING D — New key must not mimic replay
FINDING E — Direct service-role assignment bypass
FINDING F — SQL runtime claim was false and fixtures are invalid
FINDING G — Manual generated-type edit
FINDING H — Admin canonical refresh fails open
FINDING I — CDD refresh fails open and loses retry identity
FINDING J — Browser manufactures replay
FINDING K — Report provenance

==================================================
6. CANONICAL RPC BEHAVIOR
==================================================

6.1 Assignment RPC
6.2 CDD RPC

==================================================
7. TDD AND REQUIRED BEHAVIORAL TESTS
==================================================

7.1 SQL runtime
7.2 Real concurrency probe
7.3 Edge tests
7.4 Frontend tests

==================================================
8. DISPOSABLE DATABASE VERIFICATION
==================================================

==================================================
9. DOCUMENTATION PACKAGE
==================================================

==================================================
10. CHECKPOINT AND RECOVERY PROTOCOL
==================================================

==================================================
11. FULL VERIFICATION GATES
==================================================

==================================================
12. TWO-AXIS REVIEW
==================================================

==================================================
13. MUTATION ALLOWLIST
==================================================

==================================================
14. STAGING AND COMMIT
==================================================

==================================================
15. HARD STOP CONDITIONS
==================================================

==================================================
16. REQUIRED FINAL REPORT
==================================================
