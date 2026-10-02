# JUSTIFIQA BCE SEAM & LIFELINE ARCHITECTURAL STANDARD
**Status:** APPROVED (Single Source of Truth)  
**Standard Compliance:** 5-Lifeline BCE Architecture (Actor -> Boundary Client -> Boundary Server -> Control -> Entity)  
**Principle Reference:** `codebase-design` Deep Module & Seam Architecture  

---

## 1. ARCHITECTURAL SEAM & DEEP MODULE MODEL

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 JUSTIFIQA BCE SEAM MODEL                               │
│                                                                                        │
│  [ACTOR] ──> [BOUNDARY CLIENT] ──Seam 1──> [BOUNDARY SERVER] ──Seam 2──> [CONTROL]     │
│                   (FE UI)                  (API Controller)            (Domain Service)│
│                                                   │                           │        │
│                                            Shallow Adapter              Deep Module    │
│                                            (HTTP Transport)          (Rich Core Rules) │
│                                                                               │        │
│                                                                            Seam 3      │
│                                                                               │        │
│                                                                               ▼        │
│                                                                           [ENTITY]     │
│                                                                         (Repository)   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Seam Definitions
1. **Seam 1 — HTTP/Transport Interface (`Boundary Client / FE` -> `Boundary Server / API Controller`)**:
   - **Interface**: REST/WebSocket API endpoints, JWT/mTLS authentication, payload schema validation, HTTP status codes.
   - **Module (`Boundary Server`)**: Shallow Transport Adapter. Responsible strictly for request validation, parameter extraction, routing to `Control`, and response serialization. MUST NOT contain business logic or domain rules.

2. **Seam 2 — Domain Core Interface (`Boundary Server / API Controller` -> `Control / Domain Service`)**:
   - **Interface**: Clean domain method calls (e.g., `startConsultation(clientId, advocateId, tier)`).
   - **Module (`Control / Domain Service`)**: Deep Module containing rich business logic, state machines, SLA enforcement, E2EE thread locking, and audit orchestration.

3. **Seam 3 — Persistence Interface (`Control / Domain Service` -> `Entity / Repository & Vault`)**:
   - **Interface**: Atomic CRUD operations and append-only ledger entries.
   - **Module (`Entity`)**: Encapsulates relational DB tables (PostgreSQL) and encrypted WORM Vault storage.

---

## 2. STANDARD BCE LIFELINE MAPPING MATRIX (5-LIFELINE MANDATE)

All Sequence Diagrams (`SD-J-XX`) MUST strictly adhere to the following naming convention and 5-lifeline separation:

| Domain & Diagram Code | Lifeline 1: Actor | Lifeline 2: Boundary Client (`FE`) | Lifeline 3: Boundary Server (`CTRL`) | Lifeline 4: Control (`SVC`) | Lifeline 5: Entity (`REPO / DB`) |
|---|---|---|---|---|---|
| **1. Authentication & Registration (`SD-J-01, J-02`)** | `Klien / Advokat` | `AuthUI` | `AuthController` | `IdentityAuthService` | `UserRepository & DB` |
| **2. Consultation & Escrow (`SD-J-03, J-05, J-11`)** | `Klien / Advokat` | `ConsultationUI` | `ConsultationController` | `EscrowFairClockService` | `ConsultationRepository & Ledger` |
| **3. IRAC Note & Legal Diagnosis (`SD-J-08`)** | `Advokat` | `IRACWorkspaceUI` | `IRACNoteController` | `LegalDiagnosisService` | `IRACNoteRepository & WORM Vault` |
| **4. Document Drafting & Clause Revision (`SD-J-10`)** | `Advokat / Klien` | `DraftingUI` | `DocumentDraftController` | `DocumentReviewService` | `DocumentVersionRepository & DB` |
| **5. Advocate Directory & Booking (`SD-J-04`)** | `Klien` | `AdvocateDirectoryUI` | `DirectoryController` | `AdvocateMatchingService` | `AdvocateProfileRepository & DB` |
| **6. Rating, Review & Reputation (`SD-J-06, J-13`)** | `Klien` | `RatingReviewUI` | `ReputationController` | `AdvocateReputationService` | `ReviewRepository & DB` |
| **7. KYC & Verification (`SD-J-14, J-15`)** | `Advokat / Admin` | `KYCVerificationUI` | `KYCController` | `AdvocateVerificationService` | `KYCDocumentRepository & DB` |
| **8. Audit & Dispute Arbitration (`SD-J-16, J-21`)** | `Auditor / Admin` | `DisputeResolutionUI` | `DisputeController` | `DisputeArbitrationService` | `AuditLogRepository & WORM Vault` |

---

## 3. PLANTUML ACTIVATION BAR & SYNTAX MANDATE

1. Every call across seams MUST use exact activation pairs (`++` / `--`).
2. **STRICT PROHIBITION**: NEVER use shorthand deactivation on reply arrows toward Actors (`FE --> Actor --` is forbidden).
3. Actors are deactivated only at the end of the diagram (`deactivate Actor`).
