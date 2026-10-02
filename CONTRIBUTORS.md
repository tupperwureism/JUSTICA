# Contributors & Project Attribution

## Founding Architect & Creator

- **Shalom Kurniawan** ([@tupperwureism](https://github.com/tupperwureism))
  - **Role:** Founding Creator & Lead System Architect
  - **Email:** trusukkendal@gmail.com
  - **Contributions:**
    - Original conceptualization of the LegalTech & Notary platform (evolved from LifeQ SuperApp).
    - Architectural split decision (ADR-002: Justifiqa as active scope, Qualifa as archived research).
    - Design and formal proof of core security foundations:
      - Boundary-Control-Entity (BCE) pattern.
      - ACID Row-Level Mutex Locking for escrow transactions (`SELECT ... FOR UPDATE`).
      - Write-Once-Read-Many (WORM) audit ledger & tamper-proof vault.
      - 36 versioned PostgreSQL migrations with strict multi-tenant Row Level Security (RLS).
      - Single-flight fail-closed state machines for client & notary workspaces.

---

## Future Contributors

All developers contributing to this repository are welcomed to append their details below while preserving the original authorship above:

| Name / GitHub Handle | Contribution Scope | Date |
|---|---|---|
| *(Future Contributors)* | *(Feature / Scope)* | *(Date)* |
