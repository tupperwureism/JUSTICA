---
name: forensic-audit
description: Universal 360-degree forensic line-by-line verification audit across all software development phases (UML, API, ERD, Wireframes, and Code) to ensure zero missing entities, rules, or edge cases before declaring completion or phase transition.
---

# Universal Forensic Self-Audit ("Eagle-Eye / Forget-Less System")

Execute this rigorous self-audit automatically before declaring any phase, artifact, or batch "100% complete" or asking the user for sign-off. Never rely on macro-level memory abstractions or general summaries.

## 1. Core Principles & Mandates
1. **Anti-Macro Assumption Mandate:** Never claim a task, phase, or deliverable is "100% complete" based on macro-level memory or implicit assumptions.
2. **Physical Line-by-Line Inspection:** Always open and inspect the physical contents of master specifications, visual diagrams, and code files using physical read tools before auditing.
3. **Cross-Document & Cross-Section Synchronization:** Auditing a single section is not enough. You must verify consistency across all related sections (e.g., visual diagrams vs data dictionaries vs state transition charts vs code implementations).
4. **True Discrete Batch Execution Mandate (`1 Prompt = 1 Batch Done`):** When executing remediation work resulting from a forensic audit, NEVER combine multiple batches into a single prompt response. Complete exactly 1 discrete batch, record it in 1 Git commit, and stop to wait for user evaluation and sign-off.

## 2. Universal Audit Protocol
Before certifying any phase or deliverable:
1. **Load Audit Vectors:** Inspect `UNIVERSAL-AUDIT-VECTORS.md` in this skill directory to select and apply the universal and phase-specific inspection vectors relevant to the current task.
2. **Execute Bi-Directional Set Equality & Micro Verification:** Extract element sets ($S_A$ and $S_B$) from compared documents to prove $S_A - S_B = \emptyset$ and $S_B - S_A = \emptyset$. Trace every functional requirement, entity, state, branch, and constraint line-by-line.
3. **Check Compiler & Syntax Integrity:** Ensure visual diagram definitions (PlantUML/Mermaid) or code files compile cleanly without preprocessor or syntax errors.
4. **Enforce Hardening Rules:** Verify that concurrency controls (e.g., Mutex Row Locks), immutability rules (WORM vaults), and guard rules are explicitly defined and represented.

## 3. Mandatory Proof Matrix & Certification Gate
1. **Generate Traceability Proof:** Use the template in `TRACEABILITY-MATRIX-TEMPLATE.md` to produce a concrete 1-to-1 verification matrix proving 100% coverage.
2. **Zero-Omission Gate:** Only declare "100% Complete" or request phase transition sign-off when the verification matrix demonstrates `0 missing items / 0 gaps`.
