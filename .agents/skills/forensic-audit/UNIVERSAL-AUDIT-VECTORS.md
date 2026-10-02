# Universal Forensic Audit Vectors (`UNIVERSAL-AUDIT-VECTORS.md`)

When executing a forensic audit, apply the following sub-atomic inspection vectors across all software development lifecycle (SDLC) phases:

---

## Vector 1: Universal String, Identity & Enum Synchronization (All Phases)
- **Bi-Directional Mathematical Set Equality Protocol (*Protokol Rekonsiliasi Himpunan Simetris*):** Whenever validating two representations of the same domain concept (e.g., Visual Diagram $A$ vs Specification Text $B$, or DDL Table $A$ vs OpenAPI Schema $B$), explicitly extract the set of all elements from $A$ as $S_A$ and the set of all elements from $B$ as $S_B$. You MUST mathematically prove bi-directional equality: $S_A - S_B = \emptyset$ and $S_B - S_A = \emptyset$. Never rely on narrative reading or asymmetric filtering.
- **1-to-1 Exact String Match:** Verify that every identifier, status string, enum value, error code, and domain term matches character-for-character across all related files (e.g., visual diagrams, data dictionaries, API schemas, and code).
- **No Orphan Values:** Ensure that values defined in a dictionary or state enum are fully represented in functional workflows and diagrams, and vice versa.

---

## Vector 2: Architecture & Interaction Rigor (UML BCE & Sequence Diagrams)
- **5-Lifeline BCE Decoupling:** Verify that Sequence Diagrams maintain strict Boundary-Control-Entity separation:
  `Actor` -> `Frontend UI (Boundary Client)` -> `API Controller / Gateway (Boundary Server)` -> `Domain / Application Service (Control)` -> `Repository & Database / WORM Vault (Entity)`.
- **Clean Activation Bars:** Ensure activation bars accurately reflect execution lifespans with zero layer stacking (*zero stacking*) and no dead/disconnected spans.
- **Activity Diagram 1-to-1 Mapping:** Ensure every decision block (`if/else`) and retry/loop from Activity Diagrams is mapped 1-to-1 to Sequence Diagram syntax (`alt`, `opt`, `loop`), complete with HTTP status codes and exact endpoints.

---

## Vector 3: Data Schema, State Machine & Concurrency Hardening (ERD & Database)
- **Physical DDL Types & Constraints:** Verify PostgreSQL physical data types (`UUID`, `VARCHAR(N)`, `TIMESTAMPTZ`, `NUMERIC(15,2)`, `JSONB`), Primary Keys (`PK`), Foreign Keys (`FK`), and cardinality ratios (`1 ||--o{ N`).
- **Compiler-Safe Diagram Syntax:** Ensure visual diagram definitions (e.g., PlantUML `!define`) do not trigger preprocessor errors when rendering complex constraints (such as composite unique keys).
- **Holistic State Machine Completeness:** Verify that State Machine diagrams include all valid transition paths, including compromise or middle-ground workflows (e.g., Split Settlement / Split Refund branches), alongside binary 0% and 100% outcomes.
- **ACID Mutex & WORM Immutability:** Verify that financial or scheduling tables define explicit row-level mutex locking (`SELECT ... FOR UPDATE`), and immutable audit trails implement append-only protection triggers.
- **PL/pgSQL Function & Procedure Security Hardening (`proconfig` & `proacl`):** Verify via catalog inspection (`pg_proc`) that every PL/pgSQL function explicitly declares `SET search_path = public` inside its header definition (`proconfig IS NOT NULL AND proconfig @> ARRAY['search_path=public']`) to eliminate `function_search_path_mutable` / Trojan Horse vulnerabilities. For all `SECURITY DEFINER` procedures (`prosecdef = t`), verify that execution privileges are strictly revoked from `PUBLIC`, `anon`, and `authenticated` roles (`proacl IS NOT NULL AND NOT (proacl::text ILIKE '%=X/postgres%' OR proacl::text ILIKE '%anon=X/postgres%' OR proacl::text ILIKE '%authenticated=X/postgres%')`) and explicitly restricted to `service_role` or `postgres` (`service_role=X/postgres`) to eliminate `anon/authenticated_security_definer_function_executable` warnings.

---

## Vector 4: API Gateway, Contracts & Security Verification (API & Service Layer)
- **Complete Schema Definitions:** Verify request/response payloads (`JSONB`, DTOs), required headers, and validation rules.
- **Authentication & RBAC:** Ensure routes explicitly declare role requirements, MFA/FIDO2 WebAuthn verification steps, and token revocation checks.
- **Error States & Rate Limiting:** Verify explicit HTTP status codes (`200`, `201`, `400`, `401`, `403`, `409`, `429`, `500`) and rate limit protection mechanisms.

---

## Vector 5: Source Code & Implementation Assurance (Code & QA)
- **Zero Unhandled Edge Cases:** Verify that code handles nulls, empty collections, timeouts, and concurrent modification exceptions explicitly.
- **Verification Matrix Proof:** Ensure every implemented function or endpoint maps 1-to-1 to a documented requirement or test specification.
