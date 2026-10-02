# MOCK-J-AD-01 [CLEAR]: Portal Login & Autentikasi Mitra Advokat Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-AD-01` |
| **Nama Halaman** | Portal Autentikasi & Keamanan Mitra Advokat |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Mitra Advokat Berlisensi Mahkamah Agung & SIPP PERADI/AAI/KAI |
| **Ref. Use Case** | `J-UC02` (`ST-J-02`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Portal Mitra Advokat Berlisensi | [ < Kembali ke Gerbang ] | [ ☀ Light / ☾ Dark ] }
  --
  {
    === AUTENTIKASI KEAMANAN TINGGI MITRA ADVOKAT
    "Khusus bagi Advokat tersumpah yang terdaftar resmi pada Sistem Informasi Penelusuran Perkara (SIPP) Mahkamah Agung."
  }
  --
  {
    Nomor Induk Advokat (NIA / SIPP) | "18293/PERADI/2015               "
    Alamat Email Profesional         | "mahendra.k@lawfirm.id           "
    Kata Sandi Keamanan KMS          | "••••••••••••••••••••••••          "
    --
    Kode Keamanan MFA (6-Digit OTP)  | "4  8  1  9  0  2                   "
    PIN e-Meterai Peruri KMS (6-Digit)| "••••••                            "
    --
    [X] Sesi Kerja Enkripsi E2EE Terproteksi (Hardware-bound Session Token)
    --
    [  <b>MASUK KE COMMAND CENTER ADVOKAT</b>  ] | [ Lupa PIN KMS / Kredensial? ]
  }
}
@endsalt
```
