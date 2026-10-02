# MOCK-J-CL-01 [CLEAR]: Portal Registrasi & Login Klien Hukum Justica

## 1. METADATA SPESIFIKASI (PRODUCT UI EDITION)
| Atribut | Nilai Spesifikasi |
| :--- | :--- |
| **ID Mockup** | `MOCK-J-CL-01` |
| **Nama Halaman** | Portal Registrasi & Autentikasi Klien Hukum Justica |
| **Gaya Desain (*Design System*)** | **Professional Corporate Slate UI** (*Light / Dark Mode Ready*) |
| **Aktor Target** | Klien Hukum (*Client*) |
| **Ref. Use Case** | `J-UC01` (`ST-J-01`), `J-UC02` (`ST-J-02`) |

---

## 2. DIAGRAM WIREFRAME BERSIH (END-USER UI SALTWIREFRAME)

```plantuml
@startsalt
{+
  {* <b>JUSTICA</b> • Platform Konsultasi & Layanan Hukum Profesional | [ ☀ Light / ☾ Dark ] }
  --
  {
    === MASUK KE PORTAL KLIEN
    "Silakan masuk atau daftarkan identitas Anda untuk memulai konsultasi hukum terverifikasi."
  }
  --
  {/ <b>[ Masuk Akun ]</b> | [ Daftar Baru ] }
  --
  {
    <b>1. MASUK KE AKUN ANDA</b>
    --
    Email atau NIK Terdaftar  | "budi.santoso@email.com            "
    Kata Sandi                | "••••••••••••••••••••••••          "
    [X] Ingat saya di perangkat ini
    --
    Kode Keamanan OTP (6-Digit) | "8  4  9  2  0  1                   "
    [ Kirim Ulang Kode (00:59) ]
    --
    [  <b>MASUK SEKARANG</b>  ] | [ Lupa Kata Sandi? ]
  }
  --
  {
    <b>2. PENDAFTARAN AKUN BARU (ALTERNATIF TAB)</b>
    --
    Nomor Induk Kependudukan (NIK) | "3171234567890001                  "
    Nama Lengkap Sesuai KTP        | "Budi Santoso                        "
    Nomor WhatsApp Terverifikasi   | "+6281234567890                      "
    Alamat Email Aktif             | "budi.santoso@email.com              "
    Kata Sandi Baru                | "••••••••••••••••••••••••          "
    Konfirmasi Kata Sandi          | "••••••••••••••••••••••••          "
    --
    [X] Saya menyetujui Ketentuan Layanan & Kebijakan Privasi Justica
    --
    [  <b>DAFTAR SEKARANG</b>  ]
  }
  --
  {
    ! <color:red><b>INFORMASI AKUN:</b></color>
    "Akun Anda sedang dalam peninjauan oleh tim kepatuhan layanan. Silakan hubungi pusat bantuan."
  }
  --
  {
    © 2026 JUSTICA Legal Platform • Semua percakapan dilindungi kerahasiaan hubungan advokat-klien.
  }
}
@endsalt
```

---

## 3. SPESIFIKASI INTERAKSI PENGGUNA (*USER EXPERIENCE FLOW*)
1. **Pemisahan Tab Masuk & Daftar:** Pengguna dapat beralih dengan mulus antara form masuk akun dan pendaftaran baru.
2. **Verifikasi Dua Langkah (OTP):** Kode keamanan dikirimkan ke nomor WhatsApp atau email pengguna demi kenyamanan dan perlindungan akun.
3. **Pesan Privasi & Kerahasiaan:** Menjamin rasa aman pengguna tanpa menampilkan jargon teknis yang rumit.
