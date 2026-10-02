# MOCK-J-ADM-01 [ORI]: Portal Backoffice Kepatuhan SLA & Audit Trail Administrator Justica

## 1. METADATA SPESIFIKASI (ENGINEERING EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-ADM-01` |
| **Nama Halaman** | Command Center Kepatuhan SLA & Audit Trail Sistem (`admin.justica.id/compliance`) |
| **Aktor Target** | Administrator Kepatuhan & Auditor Internal Justica |
| **Ref. Use Case** | `J-UC08` (`ST-J-10`: Monitoring Kepatuhan SLA & Audit Trail Immuted), `J-UC11` (`ST-J-11`: Verifikasi e-Meterai & KMS Log) |
| **Peta Navigasi (`from` -> `to`)** | `MOCK-J-GATEWAY-01` -> `MOCK-J-ADM-01` -> `MOCK-J-ADM-02` (Pusat Mediasi Sengketa) |
| **Kepatuhan Keamanan** | Zero-Knowledge E2EE Privacy Guard (Metadata-Only Access), WORM Immutable SHA-256 Audit Ledger, FIDO2 Admin MFA |

---

## 2. DIAGRAM WIREFRAME LOGIS (PLANTUML SALT)

```plantuml
@startsalt
{+
  {* <b>JUSTICA ADMIN BACKOFFICE</b> - Kepatuhan & Audit | [ Pusat Mediasi Dispute (ADM-02) ] | [ Admin: FIDO2 Verified ] | [ ☀ / ☾ ] }
  --
  {
    === COMMAND CENTER PENGAWASAN KEPATUHAN SLA & AUDIT TRAIL IMMUTABLE (ST-J-10 / ST-J-11)
    "Pengawasan sistem secara real-time berdasarkan metadata sesi dan log audit WORM. Administrator tidak memiliki akses ke dalam teks/audio percakapan E2EE (Strict Zero-Knowledge Guard)."
  }
  --
  {
    {#
      <b>STATISTIK SLA & KEPATUHAN HARIAN</b> | <b>STATUS INTEGRASI KMS & PERURI</b> | <b>PRIVACY ENFORCEMENT GUARD</b>
      {
        Total Sesi Aktif   : <b>142 Sesi E2EE / Dual QR</b>
        Kepatuhan SLA (<5m): <color:green><b>98.4% On-Time</b></color>
        AFK Auto-Refund    : <b>2 Kejadian Triggered</b>
      } | {
        KMS Key Rotation  : <color:green><b>HEALTHY (AES-256 GCM)</b></color>
        Peruri e-Meterai  : <color:green><b>SYNCED (API v2.4)</b></color>
        WORM Storage Node : <b>100% Immutable SHA-256</b>
      } | {
        Zero-Knowledge Access: <color:blue><b>ENFORCED (No Key Access)</b></color>
        DLP Inline Filter    : <color:green><b>ACTIVE</b></color>
      }
    }
  }
  --
  {
    <b>LOG AUDIT TRAIL IMMUTABLE (WORM VAULT INSPECTION)</b>
    {#
      <b>Timestamp UTC</b> | <b>Event ID</b> | <b>Aktor & Peran</b> | <b>Tindakan Sistemik</b> | <b>Hash SHA-256 Validasi</b> | <b>Status Audit</b>
      2026-07-13 06:12:01 | #AUD-8812 | Advokat Dr. Mahendra | Check-in Dual QR Handshake | `e3b0c44298fc1c149a...` | <color:green>VERIFIED</color>
      2026-07-13 06:14:22 | #AUD-8815 | System SLA Monitor   | AFK Refund Triggered (#CL-991) | `a9f238d102bc45e812...` | <color:green>VERIFIED</color>
      2026-07-13 06:18:40 | #AUD-8820 | Peruri KMS Service   | e-Meterai Stamping (#DLV-441) | `7c4a8d09ca3762af61...` | <color:green>VERIFIED</color>
    }
  }
  --
  {
    [  <b>EKSPORT LAPORAN AUDIT TRAIL CRYPTOGRAPHIC SIGNED</b>  ] | [ Filter Berdasarkan Rentang Tanggal ]
  }
}
@endsalt
```
