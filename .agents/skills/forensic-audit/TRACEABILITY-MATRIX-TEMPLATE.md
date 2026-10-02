# Universal Forensic Traceability Matrix Template (`TRACEABILITY-MATRIX-TEMPLATE.md`)

When presenting the results of a forensic audit or certifying completion of a phase, generate and present a concrete Traceability Matrix following this markdown structure:

```markdown
### MATRIKS VERIFIKASI FORENSIK EAGLE-EYE (*360-DEGREE TRACEABILITY PROOF*)

| Upstream Source / Specification | Downstream Target / Component | Physical Line / Location Proof | Verification Status | Notes / Discrepancy Found |
| :--- | :--- | :--- | :---: | :--- |
| `[Requirement ID / Document Section]` | `[File Path / Table / Function / Diagram Block]` | `[Line Number / Function Name]` | `<color:green>COMPLETE</color>` / `<color:red>DISCREPANCY</color>` | `[Exact notes on string sync, constraint, or hardening rule]` |
```

## Matrix Certification Rules
1. Every item from the upstream specification must have a dedicated row in the matrix.
2. If any row shows `<color:red>DISCREPANCY</color>`, certification fails and phase-gate advancement is blocked until the discrepancy is remediated.
3. Once all rows are `<color:green>COMPLETE</color>` with `0 omissions / 0 gaps`, present the final certified matrix to the user for explicit phase sign-off.
