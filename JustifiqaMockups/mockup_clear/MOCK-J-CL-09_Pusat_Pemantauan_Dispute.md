# MOCK-J-CL-09 [CLEAR]: Pusat Pemantauan Status Dispute & Mediasi Escrow Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-09` |
| **Nama Halaman** | Dasbor Pusat Pemantauan Sengketa & Mediasi Escrow Klien |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Klien Hukum Terverifikasi (*Verified Legal Client*) |
| **Ref. Use Case** | `J-UC21` (`ST-J-19`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Pusat Mediasi & Sengketa | [ Dasbor Saya ] | [ Ajukan Dispute Baru ] | [ ☀ Light / ☾ Dark ] }
  --
  {
    === PUSAT PEMANTAUAN SENGKETA & MEDIASI REKENING ESCROW
    "Pantau perkembangan investigasi sengketa Anda dan rekomendasi mediasi resmi dari Dewan Kepatuhan Justica."
  }
  --
  {
    <b>1. DAFTAR TIKET SENGKETA AKTIF ANDA</b>
    --
    {#
      <b>ID Dispute</b> | <b>Perkara Terkait</b> | <b>Advokat Terlapor</b> | <b>Status Escrow</b> | <b>Tahap Investigasi</b> | <b>Aksi</b>
      DSP-202607-001 | REQ-202607-001 | Dr. Mahendra K., S.H. | <color:red><b>ESCROW FROZEN</b></color> | MEDIASI DALAM PROSES | [ <b>LIHAT MEDIASI</b> ]
    }
  }
  --
  {
    <b>2. RUANG MEDIASI & REKAM JEJAK INVESTIGASI (#DSP-202607-001)</b>
    --
    {
      <b>Mediator Ditunjuk:</b> Dewan Kepatuhan Justica (Sertifikasi Arbiter BANI #8812)
      <b>Nominal Escrow Ditahan:</b> Rp 450.000 (100% Secured in Escrow)
      --
      [10/07 14:10] <b>Klien:</b> Mengajukan laporan sengketa atas kualitas deliverable.
      [10/07 14:12] <b>Sistem Justica:</b> Rekening Escrow resmi DIBEKUKAN otomatis.
      [10/07 14:25] <b>Mediator Justica:</b> Memeriksa log E2EE (Hash SHA-256) & bukti revisi berkas.
      [10/07 14:40] <b>Rekomendasi Mediator:</b> Pengembalian dana (Refund Escrow 100%) ke Klien.
    }
    --
    [  <b>SETUJUI REKOMENDASI & CAIRKAN REFUND 100%</b>  ] | [ Ajukan Banding ke Dewan Etik ]
  }
}
@endsalt
```
