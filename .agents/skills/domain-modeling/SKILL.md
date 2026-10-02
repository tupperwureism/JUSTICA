---
name: domain-modeling
description: Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural decision, or when another skill needs to maintain the domain model.
---

# Domain Modeling

Actively build and sharpen the project's domain model as you design. This is the *active* discipline — challenging terms, inventing edge-case scenarios, and writing the glossary and decisions down the moment they crystallise. (Merely *reading* `CONTEXT.md` for vocabulary is not this skill — that's a one-line habit any skill can do. This skill is for when you're changing the model, not just consuming it.)

## File structure

Most repos have a single context:

```
/
├── CONTEXT.md
├── docs/
│   └── adr/
│       ├── 0001-event-sourced-orders.md
│       └── 0002-postgres-for-write-model.md
└── src/
```

If a `CONTEXT-MAP.md` exists at the root, the repo has multiple contexts. The map points to where each one lives:

```
/
├── CONTEXT-MAP.md
├── docs/
│   └── adr/                          ← system-wide decisions
├── src/
│   ├── ordering/
│   │   ├── CONTEXT.md
│   │   └── docs/adr/                 ← context-specific decisions
│   └── billing/
│       ├── CONTEXT.md
│       └── docs/adr/
```

Create files lazily — only when you have something to write. If no `CONTEXT.md` exists, create one when the first term is resolved. If no `docs/adr/` exists, create it when the first ADR is needed.

## During the session

### Challenge against the glossary

When the user uses a term that conflicts with the existing language in `CONTEXT.md`, call it out immediately. "Your glossary defines 'cancellation' as X, but you seem to mean Y — which is it?"

### Sharpen fuzzy language

When the user uses vague or overloaded terms, propose a precise canonical term. "You're saying 'account' — do you mean the Customer or the User? Those are different things."

### Discuss concrete scenarios

When domain relationships are being discussed, stress-test them with specific scenarios. Invent scenarios that probe edge cases and force the user to be precise about the boundaries between concepts.

### Cross-reference with code

When the user states how something works, check whether the code agrees. If you find a contradiction, surface it: "Your code cancels entire Orders, but you just said partial cancellation is possible — which is right?"

### Update CONTEXT.md inline

When a term is resolved, update `CONTEXT.md` right there. Don't batch these up — capture them as they happen. Use the format in [CONTEXT-FORMAT.md](./CONTEXT-FORMAT.md).

`CONTEXT.md` should be totally devoid of implementation details. Do not treat `CONTEXT.md` as a spec, a scratch pad, or a repository for implementation decisions. It is a glossary and nothing else.

### Offer ADRs sparingly

Only offer to create an ADR when all three are true:

1. **Hard to reverse** — the cost of changing your mind later is meaningful
2. **Surprising without context** — a future reader will wonder "why did they do it this way?"
3. **The result of a real trade-off** — there were genuine alternatives and you picked one for specific reasons

If any of the three is missing, skip the ADR. Use the format in [ADR-FORMAT.md](./ADR-FORMAT.md).

---

## Technical Rigor Standards (UML, Database Schema & Security Architecture)

When practicing domain modeling, designing sequence diagrams, or defining database structures, you **MUST adhere strictly to the following domain technical rigor standards**:

### 1. Component-Level BCE Sequence Diagram Supremacy (`5-Lifeline BCE`)
- All Sequence Diagrams (SD) MUST implement decoupled **Boundary-Control-Entity (BCE)** architecture separating at least 5 lifelines:
  `Actor` -> `Frontend UI (Boundary Client)` -> `API Controller / Gateway (Boundary Server)` -> `Domain / Application Service (Control)` -> `Repository & Database / WORM Vault (Entity)`.
- **NEVER** simplify API Controller and Business Service into a single monolithic `Backend` lifeline.
- **SD > AD Supremacy:** Sequence Diagrams represent systemic and programmatic reality. All decision blocks (`if/else`) and retry/loop loops from Activity Diagrams MUST map 1-to-1 to SD syntax (`alt`, `opt`, `loop`), complete with HTTP status codes and API endpoints.
- **Clean Activation Bars:** All activation bars MUST accurately reflect when a component is actively processing data (`zero stacking`, no broken/dead activations during active internal processing).

### 2. Physical & Logical Crow's Foot ERD Supremacy
- All entity relationship diagrams MUST explicitly specify physical PostgreSQL/Supabase data types (`UUID`, `VARCHAR(N)`, `TIMESTAMPTZ`, `NUMERIC(15,2)`, `JSONB`), Primary Key (`PK`) and Foreign Key (`FK`) status, and exact cardinality ratios (`1 ||--o{ N`).

### 3. ACID Transactional & Concurrency Mutex Lock
- All financially sensitive and scheduling tables (`escrow_transactions`, `consultation_slots`, `wallet_balances`) MUST define row-level locking mechanisms (`SELECT ... FOR UPDATE` / Optimistic Versioning) to prevent double-booking and race conditions.

### 4. Decoupled Storage Tiers & Zero-Knowledge E2EE Isolation
- Maintain absolute physical decoupling between OLTP transactional tables and WORM Immutable Vault audit logs (`audit_logs_worm`).
- **NEVER** store plaintext E2EE messages or private keys on the primary database server.

### 5. PL/pgSQL Function & Procedure Security Hardening (`proconfig & proacl Supremacy`)
- All PL/pgSQL functions (`FUNCTION` / Stored Procedure) MUST explicitly define `SET search_path = public` in their function header (`proconfig`) to prevent Search Path Hijacking (`function_search_path_mutable`).
- For all `SECURITY DEFINER` functions, MUST explicitly revoke direct execution rights from public/anonymous roles (`REVOKE ALL ON FUNCTION ... FROM PUBLIC, anon, authenticated;`) and grant authorization only to `service_role` / `postgres` to prevent public RPC exploitation (`anon/authenticated_security_definer_function_executable`).

