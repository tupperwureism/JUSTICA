# MOCK-J-ADM-02 [CLEAR]: Pusat Mediasi & Whistleblowing Admin Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-ADM-02` |
| **Nama Halaman** | Pusat Mediasi Sengketa (`admin.justica.id/dispute-center`) |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Dewan Mediator & Administrator Kepatuhan Justica |
| **Ref. Use Case** | `J-UC15`, `J-UC21` |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA ADMIN</b> • Pusat Mediasi | [ Portal Kepatuhan ] | [ ☀ / ☾ ] }
  --
  {
    === MEDIASI SENGKETA & INVESTIGASI WHISTLEBLOWING
    "Kelola sengketa layanan dan putuskan pencairan atau pengembalian dana Escrow yang tertahan."
  }
  --
  {
    Kasus Sengketa Aktif : <b>3 Kasus</b>
    Dana Escrow Tertahan : Rp 18.400.000 (Frozen)
  }
  --
  {
    [  <b>EKSEKUSI REFUND KLIEN</b>  ] | [  <b>EKSEKUSI RELEASE ADVOKAT</b>  ]
  }
}
@endsalt
```
