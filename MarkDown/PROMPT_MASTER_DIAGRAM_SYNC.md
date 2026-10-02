# [SYSTEM DIRECTIVE: PROMPT MASTER — DIAGRAM & DOCUMENTATION SYNCHRONIZATION]
**Role:** Sol xHigh (Architect) → **Target Executor:** Sol High / Nemotron
**Goal:** Menyatukan (*merge*) seluruh desain arsitektur diagram Fase 2 ke dalam file PlantUML utama dan menstandarkan nomenklatur proyek menjadi "Justifiqa".

---

## 0. PRECONDITION & FILE WHITELIST
Executor **HANYA** diizinkan membaca dan memodifikasi file-file dokumentasi (*Markdown*) berikut di dalam folder `MarkDown/`. **DILARANG KERAS** menyentuh file kode (`.ts`, `.tsx`, `.sql`, `.py`).

**Sumber Data (Read-Only):**
- `MarkDown/PHASE_2_ACTIVITY_DIAGRAMS.md`
- `MarkDown/PHASE_2_SEQUENCE_DIAGRAMS.md`
- `MarkDown/PHASE_2_USE_CASES_AND_DIAGRAMS.md`

**Target Modifikasi (Write/Update):**
- `MarkDown/plantuml_activity_diagrams.md`
- `MarkDown/plantuml_sequence_diagrams.md`
- `MarkDown/plantuml_uc_diagrams.md`

---

## 1. TUGAS 1: SINKRONISASI ACTIVITY DIAGRAM (AD)
1. Buka `plantuml_activity_diagrams.md`.
2. Injeksi/tambahkan diagram P2-01 (Corporate Intake) dan P2-02 (Notary & e-KYC) dari file `PHASE_2_ACTIVITY_DIAGRAMS.md`.
3. Pastikan format sintaks PlantUML (`@startuml` ... `@enduml`) tidak pecah dan terstruktur rapi.

## 2. TUGAS 2: SINKRONISASI SEQUENCE DIAGRAM (SD)
1. Buka `plantuml_sequence_diagrams.md`.
2. Masukkan alur arsitektural P2-01 dan P2-02 dari `PHASE_2_SEQUENCE_DIAGRAMS.md`.
3. Pastikan diagram interaksi aktor baru (Corporate Concierge, Notaris, Escrow) selaras dengan *Sequence Diagram* yang sudah ada.

## 3. TUGAS 3: REVISI USE CASE (UC) DIAGRAM
1. Buka `plantuml_uc_diagrams.md`.
2. Integrasikan *Use Case* baru dari Fase 2.
3. Perbarui hierarki Aktor (tambahkan *Corporate Client*, *Notary*, *Escrow System*).

## 4. TUGAS 4: STANDARISASI NOMENKLATUR "JUSTIFIQA" (ANTI-JUSTICA)
- Lakukan penyisiran *Find and Replace* di seluruh 6 file *Markdown* di atas.
- Ganti semua penyebutan **"Justica"** menjadi **"Justifiqa"**.
- Merek dagang proyek ini adalah **Justifiqa**, tidak boleh ada satu pun diagram yang masih menggunakan nama lama.

---

## 5. DEFINITION OF DONE (KONDISI SELESAI)
- [ ] 3 file master PlantUML (`plantuml_activity_diagrams.md`, `plantuml_sequence_diagrams.md`, `plantuml_uc_diagrams.md`) sudah merangkum secara utuh dari Fase 1 hingga Fase 2.
- [ ] Tidak ada lagi sebutan "Justica" di dalam diagram, semuanya wajib "Justifiqa".
- [ ] Kode sumber sistem (frontend/backend) 100% tidak tersentuh.
- [ ] Semua blok PlantUML bisa di-*render* (tidak ada sintaks `@startuml` yang cacat).
- [ ] Buat komit dengan pesan: `docs: synchronize phase 2 diagrams and standardize Justifiqa nomenclature`

---

**END OF PROMPT MASTER.**
**Executor: Kerjakan tanpa asumsi, perbarui file secara harfiah, lalu laporkan status komit.**
