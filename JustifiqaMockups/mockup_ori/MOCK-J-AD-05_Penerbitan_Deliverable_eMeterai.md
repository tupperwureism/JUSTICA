# MOCK-J-AD-05 [ORI]: Penerbitan Deliverable & Pembubuhan e-Meterai Peruri SHA-256 Justica

## 1. METADATA SPESIFIKASI (ENGINEERING EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-AD-05` |
| **Nama Halaman** | Penerbitan Opini Hukum & Pembubuhan e-Meterai Peruri (`advocate.justica.id/deliverable/new`) |
| **Aktor Target** | Mitra Advokat Berlisensi Mahkamah Agung & SIPP |
| **Ref. Use Case** | `J-UC12` (`ST-J-12`: Pembuatan & Verifikasi Deliverable Opini Hukum), `J-UC14` (`ST-J-12`: Pembubuhan e-Meterai Peruri SHA-256) |
| **Peta Navigasi (`from` -> `to`)** | `MOCK-J-AD-04` -> `MOCK-J-AD-05` -> `MOCK-J-AD-02A` (Command Center) |
| **Kepatuhan Keamanan** | Peruri KMS Integration, SHA-256 Digital Hash Generation, 2-Round Quota Guard, Hard Thread Lock |

---

## 2. DIAGRAM WIREFRAME LOGIS (PLANTUML SALT)

```plantuml
@startsalt
{+
  {* <b>JUSTICA ADVOCATE</b> - Penerbitan Deliverable | [ Command Center ] | [ ☀ / ☾ ] }
  --
  {
    === FORMULIR PENERBITAN DELIVERABLE OPINI HUKUM & E-METERAI RESMI (ST-J-12)
    "Unggah dokumen opini hukum atau draf perjanjian yang telah final. Sistem akan membubuhkan e-Meterai Peruri resmi dan menghasilkan hash SHA-256."
  }
  --
  {
    {#
      <b>1. DATA DOKUMEN & KLIEN TARGET</b> | <b>2. STATUS REVISI & KETENTUAN QUOTA</b>
      {
        ID Klien Target: #CL-882910
        Judul Dokumen  : "Pendapat Hukum & Klausul NDA Final"
        File Terunggah : `Legal_Opinion_NDA_v1.pdf` (2.4 MB)
      } | {
        Sisa Putaran Revisi : <b>2 / 2 Putaran Revisi Gratis (2-Round Quota)</b>
        Status Thread       : <color:green><b>OPEN FOR REVIEW (Akan Hard Locked setelah Approved)</b></color>
        Otomatisasi e-Meterai: <color:blue><b>PERURI KMS READY (SHA-256 Sign)</b></color>
      }
    }
  }
  --
  {
    [X] Saya menyatakan dokumen hukum ini disusun secara profesional sesuai Kode Etik Advokat dan hukum yang berlaku di Indonesia.
  }
  --
  {
    [  <b>TERBITKAN DOKUMEN & BUBUHKAN E-METERAI RESMI</b>  ] | [ Simpan Draf ]
  }
}
@endsalt
```
