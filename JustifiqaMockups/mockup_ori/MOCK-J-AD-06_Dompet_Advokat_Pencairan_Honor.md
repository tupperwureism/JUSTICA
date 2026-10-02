# MOCK-J-AD-06 [ORI]: Dompet Advokat & Ledger Pencairan Honor Escrow Justica

## 1. METADATA SPESIFIKASI (ENGINEERING EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-AD-06` |
| **Nama Halaman** | Dompet Digital Advokat & Ledger Pencairan Escrow (`advocate.justica.id/wallet`) |
| **Aktor Target** | Mitra Advokat Berlisensi Mahkamah Agung & SIPP |
| **Ref. Use Case** | `J-UC05` (`ST-J-07`: Escrow Release Ledger), `J-UC19` (`ST-J-17`: Pencairan Honor & Riwayat Penghasilan Advokat) |
| **Peta Navigasi (`from` -> `to`)** | `MOCK-J-AD-02A` -> `MOCK-J-AD-06` -> `MOCK-J-AD-02A` (Command Center) |
| **Kepatuhan Keamanan** | Automated Escrow Ledger Handshake, BI-FAST Bank Transfer KMS, MFA OTP Payout Guard |

---

## 2. DIAGRAM WIREFRAME LOGIS (PLANTUML SALT)

```plantuml
@startsalt
{+
  {* <b>JUSTICA ADVOCATE</b> - Dompet & Ledger Escrow | [ Command Center ] | [ ☀ / ☾ ] }
  --
  {
    === DOMPET ADVOKAT & LEDGER PENCAIRAN HONOR ESCROW (ST-J-17)
    "Dana honorarium dicairkan secara otomatis dari rekening Escrow setelah klien menyetujui deliverable hukum atau durasi auto-release terpenuhi."
  }
  --
  {
    {#
      <b>SALDO TERSEDIA (SIAP CAIR)</b> | <b>SALDO TERTAHAN DALAM ESCROW</b> | <b>REKENING PENCAIRAN TERDAFTAR</b>
      {
        <size:18><b>Rp 12.500.000</b></size>
        [ <b>CAIRKAN KE REKENING BANK</b> ]
      } | {
        <size:18><b>Rp 4.200.000</b></size>
        Status: Menunggu Sign-off Klien
      } | {
        Bank Mandiri - 123000998877
        a.n. Dr. Mahendra, S.H., M.H.
        Status: <color:green><b>VERIFIED (KYC Match)</b></color>
      }
    }
  }
  --
  {
    <b>MUTASI LEDGER ESCROW IMMUTABLE</b>
    {#
      <b>ID Transaksi</b> | <b>Waktu</b> | <b>Klien & Perkara</b> | <b>Nominal</b> | <b>Status Escrow</b>
      #ESC-9012 | 12 Jul 2026 | Klien Terverifikasi #8192 | Rp 3.500.000 | <color:green><b>RELEASED (Deliverable Approved)</b></color>
      #ESC-9015 | 13 Jul 2026 | Klien Terverifikasi #4410 | Rp 4.200.000 | <color:orange><b>LOCKED IN ESCROW (In Review)</b></color>
    }
  }
}
@endsalt
```
