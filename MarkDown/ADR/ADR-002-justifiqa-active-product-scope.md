# ADR-002: Justifiqa as the Active Product Scope

- Status: `ACCEPTED`
- Date: 2026-08-13

## Context

Repository masih menyimpan diagram dan narasi Qualifa sebagai sejarah/research. Pengguna memutuskan Qualifa tidak perlu dipelihara atau dimasukkan ke roadmap aktif Justifiqa. Traceability gate telah mengklasifikasikan seluruh mapping Qualifa sebagai `OUT_OF_SCOPE`.

## Decision

- Scope implementasi, demo, audit, Definition of Done, dan Laporan Tugas Akhir aktif adalah **Justifiqa**.
- Artefak Qualifa boleh dipertahankan sebagai arsip/research agar sejarah tidak hilang.
- Artefak Qualifa tidak diperbaiki, diperluas, atau dipakai sebagai blocker batch Justifiqa kecuali pengguna membuka keputusan baru.
- Klaim target Qualifa tidak boleh dihitung sebagai capability Justifiqa.

## Consequences

- Agen tidak menghabiskan waktu pada domain psikologi yang tidak lagi bernilai bagi delivery.
- Dokumen lama yang memuat Qualifa wajib diberi interpretasi `OUT_OF_SCOPE`, bukan `TARGET`.
- Penghapusan fisik artefak Qualifa adalah cleanup batch terpisah karena dapat merusak referensi historis.

## Alternatives considered

- **Menghapus seluruh artefak segera:** ditunda karena perlu audit reference/provenance terpisah.
- **Menjaga Qualifa sebagai future roadmap:** ditolak; akan terus membingungkan status dan DoD Justifiqa.

## Evidence

- `MarkDown/TRACEABILITY_MATRIX.md`, terutama Bagian III.B.1 dan rekap `OUT_OF_SCOPE`.
- `MarkDown/plantuml_sequence_diagrams.md`, bagian archived Qualifa reference mapping.
- `MarkDown/plantuml_activity_diagrams.md`, banner archived/out-of-scope Qualifa.
