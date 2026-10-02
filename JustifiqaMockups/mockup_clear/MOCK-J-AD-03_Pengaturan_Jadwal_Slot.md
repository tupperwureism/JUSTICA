# MOCK-J-AD-03 [CLEAR]: Pengaturan Jadwal & Slot Advokat Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-AD-03` |
| **Nama Halaman** | Pengaturan Jadwal Praktik (`advocate.justica.id/schedule`) |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Mitra Advokat Berlisensi Mahkamah Agung |
| **Ref. Use Case** | `J-UC03` (`ST-J-05`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA ADVOCATE</b> • Kalender Praktik | [ Command Center ] | [ ☀ / ☾ ] }
  --
  {
    === ATUR JADWAL KONSULTASI ANDA
    "Tentukan hari dan jam operasional untuk konsultasi daring dan luring."
  }
  --
  {
    [X] Senin  | 09:00 - 15:00 WIB
    [X] Selasa | 09:00 - 16:00 WIB
    [X] Rabu   | 10:00 - 14:00 WIB
  }
  --
  {
    [  <b>SIMPAN JADWAL</b>  ]
  }
}
@endsalt
```
