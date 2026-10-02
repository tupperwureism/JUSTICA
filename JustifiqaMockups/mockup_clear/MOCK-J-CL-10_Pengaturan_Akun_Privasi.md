# MOCK-J-CL-10 [CLEAR]: Pengaturan Akun, Keamanan MFA, & Manajemen Privasi Klien Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-10` |
| **Nama Halaman** | Pengaturan Keamanan MFA, Profil Identitas, & Privasi Data Klien |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Klien Hukum Terverifikasi (*Verified Legal Client*) |
| **Ref. Use Case** | `J-UC01` (`ST-J-01`), `J-UC02` (`ST-J-02`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Pengaturan Akun & Keamanan | [ Dasbor Saya ] | [ < Kembali ] | [ ☀ Light / ☾ Dark ] }
  --
  {
    === PENGATURAN IDENTITAS, KEAMANAN MULTI-FAKTOR (MFA), & PRIVASI UU PDP
    "Kelola kredensial keamanan akun Anda serta kontrol visibilitas data pribadi sesuai amanat Undang-Undang Perlindungan Data Pribadi."
  }
  --
  {/ <b>[ TAB 1: KEAMANAN & MFA ]</b> | [ TAB 2: IDENTITAS & PRIVASI UU PDP ] }
  --
  {
    <b>TAB 1: KREDENSIAL & AUTENTIKASI MULTI-FAKTOR (MFA)</b>
    --
    Status MFA Saat Ini        | <color:green><b>AKTIF (WHATSAPP & AUTHENTICATOR APP)</b></color>
    Nomor WhatsApp Terdaftar   | "+6281234567890 (Verified)"
    Kata Sandi Akses           | "••••••••••••••••••••••••"
    [  <b>UBAH KATA SANDI UTAMA</b>  ] | [  <b>ATUR ULANG PERANGKAT MFA</b>  ]
    --
    <b>DAFTAR PERANGKAT BER-TOKEN AES-256 AKTIF</b>
    {#
      <b>Perangkat & Browser</b> | <b>IP Address & Lokasi</b> | <b>Aktivitas Terakhir</b> | <b>Aksi Keamanan</b>
      Windows 11 (Chrome 126) | 103.28.12.91 (Jakarta, ID)  | Sesi Ini (Aktif Sekarang) | [ PERANGKAT INI ]
      iPhone 15 Pro (Safari)  | 103.28.12.44 (Jakarta, ID)  | 09 Juli 2026 — 19:40 WIB  | [ <b>CABUT AKSES</b> ]
    }
  }
  --
  {
    <b>TAB 2: KONTROL DATA PRIBADI & RIGHT TO BE FORGOTTEN (UU PDP)</b>
    --
    [X] Izinkan anonimisasi nama saya pada ulasan publik advokat secara *default*.
    [ ] Kirimkan ringkasan analitis sesi konsultasi ke email pribadi saya.
    --
    ! <color:red><b>ZONA PENGHAPUSAN AKUN (RIGHT TO BE FORGOTTEN):</b></color>
    "Sesuai UU PDP Pasal 8, Anda berhak mengajukan penghapusan data pribadi Anda setelah seluruh perkara dan kewajiban Escrow selesai."
    [  <b>AJUKAN PENGHAPUSAN DATA PRIBADI & TUTUP AKUN</b>  ]
  }
}
@endsalt
```
