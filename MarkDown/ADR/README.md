# Architecture Decision Records

Direktori ini menyimpan keputusan aktif yang lintas batch. Satu ADR menjawab satu keputusan material: konteks, pilihan, keputusan, konsekuensi, dan evidence.

## Status ADR

- `ACCEPTED`: berlaku sekarang.
- `SUPERSEDED`: diganti ADR lain tetapi dipertahankan.
- `DEPRECATED`: tidak lagi dipakai dan tidak memiliki pengganti langsung.
- `PROPOSED`: belum diputuskan.

## Index

| ADR | Status | Keputusan |
|---|---|---|
| [ADR-001](ADR-001-documentation-control-plane.md) | `ACCEPTED` | Control plane dokumentasi dan paket batch kanonik |
| [ADR-002](ADR-002-justifiqa-active-product-scope.md) | `ACCEPTED` | Justifiqa adalah scope produk aktif; Qualifa menjadi arsip/research |
| [ADR-003](ADR-003-release-claims-and-phase-gates.md) | `ACCEPTED` | Local acceptance dipisahkan dari production approval |

`MarkDown/decision_log.md` adalah arsip keputusan lama. Isinya dapat menjadi evidence historis, tetapi bukan indeks keputusan aktif setelah control plane ini dibuat.

## Format ADR baru

Setiap ADR baru minimal memuat: Status, Date, Context, Decision, Consequences, Alternatives, dan Evidence. Perubahan keputusan dibuat dengan ADR penerus; jangan menulis ulang alasan historis tanpa jejak.
