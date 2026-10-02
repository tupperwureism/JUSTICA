# Buku Panduan Operasional & Teknis: Protokol Fair-Clock & Pre-Chat MoU Justifiqa

**Versi**: 1.0  
**Tanggal**: 20 Juli 2026  
**Referensi Utama**: `DOMAIN_COMPLIANCE_MATRIX.md` (Bagian 1.3), `ERD_DATABASE_SCHEMA_SPECIFICATION.md`  
**Database Backup Schema**: `02_domain2_consultation_fairclock_sla.sql` (`booking_sessions`, `escrow_transactions`)

---

## 1. Pokok Aturan & Pemicu Arloji Fair-Clock
- **Prinsip Dasar**: Klien hanya membayar untuk **waktu konsultasi efektif** bersama Advokat, bukan untuk waktu tunggu (*waiting time*).
- **Trigger Ticking (`advocate_first_reply_at`)**: Arloji 30 menit (`fair_clock_started_at`) **BARU BERJALAN** pada detik ketika Advokat mengirimkan pesan balasan pertamanya.
- **SLA Guardrails 3 Lapis**:
  1. *Lapis 1 (Maks. 15 Menit/Jeda)*: Jika jeda melebihi 15 menit, sistem melakukan *Auto-Resume*.
  2. *Lapis 2 (Akumulasi 30 Menit/Sesi)*: Batas maksimal jeda adalah 2 kali atau total 30 menit.
  3. *Lapis 3 (Anti-Malpractice)*: Jeda hanya boleh digunakan untuk meninjau bukti hukum, bukan untuk meninggalkan sesi.

---

## 2. Aturan Pre-Chat Clickwrap Agreement (MoU 3 Klausul)
- **Mandat Blocking Pop-up**: Kedua belah pihak (Klien & Advokat) wajib menekan tombol **`[ SAYA MENYETUJUI 3 KLAUSUL KEPATUHAN DI ATAS & MASUK RUANG CHAT ]`** sebelum pintu obrolan E2EE dapat dibuka.
- **Sifat UI Blocking**: Pop-up dipasang dengan `fixed inset-0 z-50` berlatar belakang `backdrop-blur-sm bg-slate-950/85`. Pop-up **TIDAK MEMILIKI tombol X** dan **menolak ditutup via klik luar/overlay**.
- **Kepatuhan Geometri Kartu (`Anti-Overflow Guardrail`)**:
  - `Card`: `max-h-[85vh] flex flex-col overflow-hidden`
  - `CardContent`: `flex-1 overflow-y-auto pr-2`
  - `CardFooter`: `shrink-0 border-t pt-4 mt-auto`
- **Keberlakuan Pada Semua Tier (Termasuk Tier 3 Unlimited/Retainer)**:
  Walaupun Klien/Advokat berada di Tier 3 (Tanpa Batas Durasi obrolan), mereka **TETAP WAJIB menyetujui MoU di awal sesi**. Hal ini dikarenakan 3 klausul MoU mengatur tentang **Larangan Off-Platform**, **Persetujuan DLP**, dan **Pelepasan Tanggung Jawab Hukum (`Pasal 1320 KUHPerdata` & `UU PDP`)**, bukan tentang batas durasi 30 menit.

---

## 3. Matriks Penanganan Edge Cases (No-Show / AFK / Evasion) & Backup Database

| Skenario Kejadian | Status di `booking_sessions` | Status di `escrow_transactions` | Catatan Ledger & Tindakan Sistem |
| :--- | :--- | :--- | :--- |
| **Advokat AFK / Menolak MoU** *(SLA awal > 15 menit tanpa balasan pertama)* | `status = 'CANCELLED_AFK'` | `status = 'REFUNDED_TO_CLIENT'` | Dana Rp 500.000 dikembalikan 100% kepada Klien (*Full Refund*). Advokat terkena penalti reputasi (*Strike 1*). |
| **Klien AFK / Menolak MoU / Klik Batal** *(Advokat sudah setuju MoU & siap di ruang)* | `status = 'CANCELLED_AFK'` | `status = 'RELEASED_TO_ADVOCATE'` | Kompensasi waktu tunggu Advokat (*Asymmetric Attribution*). Mutasi dicatat pada `escrow_payout_ledgers` (`mutation_type = 'RELEASE_ADVOCATE'`). Klien kehilangan hak *refund*. |
| **Pelanggaran Ajakan Offline Liar Level 2** *(Terdeteksi DLP Circumvention)* | `status = 'CANCELLED_AFK'` | `status = 'RELEASED_TO_ADVOCATE'` | Obrolan dibekukan seketika (*Instant Freeze*). Escrow dicairkan 100% ke Advokat yang jujur. Akun Klien nakal di-*blacklist*. |
| **Sesi Tier 3 (Pro Retainer / Unlimited)** | `status = 'ACTIVE'` *(hingga diselesaikan)* | `status = 'HELD_IN_ESCROW'` *(hingga deliverable disetujui)* | Arloji menampilkan lencana `[ ∞ UNLIMITED SESSION ] • Tier 3 Retainer Active` dan menghitung maju *Elapsed Time* tanpa memutus obrolan. |

---

## 4. Referensi Query Penguncian & Mutasi Escrow (Database Trigger Baseline)
```sql
-- Penguncian baris Escrow saat Klien AFK dan pencairan kompensasi ke Advokat
BEGIN;
SELECT escrow_id, total_amount_idr, status 
FROM escrow_transactions 
WHERE escrow_id = :escrow_id FOR UPDATE;

UPDATE escrow_transactions 
SET status = 'RELEASED_TO_ADVOCATE' 
WHERE escrow_id = :escrow_id AND status = 'HELD_IN_ESCROW';

INSERT INTO escrow_payout_ledgers (
    ledger_id, escrow_id, wallet_id, mutation_type, amount_idr, description
) VALUES (
    gen_random_uuid(), :escrow_id, :advocate_wallet_id, 'RELEASE_ADVOCATE', 
    :net_amount_idr, 'Kompensasi Klien No-Show / AFK pada Pre-Chat MoU'
);

UPDATE booking_sessions 
SET status = 'CANCELLED_AFK' 
WHERE booking_id = :booking_id;
COMMIT;
```
