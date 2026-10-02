# MOCK-J-ADM-02 [ORI]: Pusat Investigasi Mediasi Sengketa Escrow & Whistleblowing Administrator Justica

## 1. METADATA SPESIFIKASI (ENGINEERING EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-ADM-02` |
| **Nama Halaman** | Pusat Mediasi Sengketa Layanan & Whistleblowing Etik (`admin.justica.id/dispute-center`) |
| **Aktor Target** | Dewan Mediator & Administrator Kepatuhan Justica |
| **Ref. Use Case** | `J-UC15` (`ST-J-13`), `J-UC21` (`ST-J-19`: Investigasi & Mediasi Pelanggaran Etik Advokat) |
| **Peta Navigasi (`from` -> `to`)** | `MOCK-J-ADM-01` -> `MOCK-J-ADM-02` -> `MOCK-J-ADM-01` (Kembali ke Kepatuhan) |
| **Kepatuhan Keamanan** | Multi-Party Mediator Consensus Key (3-of-5 Threshold Sign-off), Immediate Escrow Mutex Lock, WORM Evidence Decryption |

---

## 2. DIAGRAM WIREFRAME LOGIS (PLANTUML SALT)

```plantuml
@startsalt
{+
  {* <b>JUSTICA ADMIN BACKOFFICE</b> - Pusat Mediasi | [ Portal Kepatuhan (ADM-01) ] | [ Dewan Mediator ] | [ ☀ / ☾ ] }
  --
  {
    === PUSAT MEDIASI SENGKETA ESCROW & INVESTIGASI WHISTLEBLOWING ETIK ADVOKAT (ST-J-19)
    "Pengelolaan sengketa layanan dan laporan pelanggaran etik advokat. Dana Escrow berada dalam status FROZEN (Mutex Lock) hingga keputusan mediasi ditandatangani melalui Multi-Party Consensus Key."
  }
  --
  {
    {#
      <b>STATISTIK SENGKETA AKTIF</b> | <b>ESCROW FREEZE STATUS</b> | <b>MULTI-PARTY CONSENSUS KEY</b>
      {
        Sengketa Dalam Investigasi: <b>3 Kasus Aktif</b>
        Laporan Whistleblowing   : <b>1 Kasus (Etik Advokat)</b>
      } | {
        Total Escrow Terkunci: <color:red><b>Rp 18.400.000 (FROZEN)</b></color>
        Status Lock Engine   : <b>Active Mutex Lock</b>
      } | {
        Ambang Batas Sign-off: <b>3 dari 5 Mediator</b>
        Integritas Bukti     : <color:green><b>100% SHA-256 Verified</b></color>
      }
    }
  }
  --
  {
    <b>DAFTAR KASUS DALAM PROSES INVESTIGASI & MEDIASI</b>
    {#
      <b>ID Kasus</b> | <b>Jenis Laporan</b> | <b>Pihak Pelapor (Klien)</b> | <b>Pihak Terlapor (Advokat)</b> | <b>Nominal Escrow</b> | <b>Status Mediasi</b> | <b>Tindakan Eksekusi</b>
      #DSP-1102 | Sengketa Deliverable | Klien Terverifikasi #8192 | Dr. Mahendra, S.H. | Rp 4.200.000 | <color:orange>MEDIASI AKTIF</color> | [ <b>BUKA BUKTI WORM</b> ]
      #WHS-2201 | Whistleblowing Etik  | Klien Terverifikasi #3319 | Adv. Raden K., S.H. | Rp 0 (Pro Bono) | <color:red>INVESTIGASI ETIK</color> | [ <b>PANEL SANKSI ETIK</b> ]
    }
  }
  --
  {
    <b>PANEL KEPUTUSAN EKSEKUSI ESCROW (REQUIRES CONSENSUS KEY)</b>
    --
    {
      [  <b>EKSEKUSI REFUND KE KLIEN (FULL REFUND)</b>  ] | [  <b>EKSEKUSI RELEASE KE ADVOKAT (RESOLVED)</b>  ] | [  <b>SPLIT 50:50 MEDIATION SETTLEMENT</b>  ]
    }
  }
}
@endsalt
```
