# Kumpulan Kode PlantUML - Justifiqa Standalone Application (Domain Hukum)

Dokumen ini berisi kode PlantUML untuk Use Case Diagram **Aplikasi Mandiri Justifiqa** (Platform Konsultasi, Transaksi, Corporate Intake, & Legal-Tek Digital). Seluruh Use Case di sini selaras 1-to-1 dengan **22 Use Case Kanonik + 2 Target Phase 2** pada `TRACEABILITY_MATRIX.md`.

---

## Cara Import ke Draw.io
1. Buka Draw.io (`app.diagrams.net`).
2. Pada toolbar bagian atas, klik tombol **`+` (Insert)** atau pilih menu **Arrange -> Insert**.
3. Pilih **Advanced -> PlantUML...**.
4. Salin dan tempel kode di bawah ini, lalu klik **Insert**.

---

### Use Case Diagram - Aplikasi Mandiri Justifiqa (Domain Hukum)
*Representasi sistem mandiri Justifiqa yang mencakup seluruh alur pengguna (Klien Hukum, Advokat/Notaris Mitra, Admin Backoffice Justifiqa) beserta sistem eksternal pendukung (Payment Gateway, Escrow System, API Mekari Sign e-Meterai, Computer Vision AI).*

```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam rankdir LR

actor "Klien (Pencari Keadilan)" as Klien
actor "Advokat / Notaris (Mitra Profesional)" as Mitra
actor "Admin Justifiqa (System & Legal Admin)" as Admin
actor "Payment Gateway" as PG
actor "Escrow System" as Escrow
actor "API Mekari Sign (Peruri)" as Mekari
actor "Computer Vision AI (Forensic Verification)" as CVAI

rectangle "Aplikasi Mandiri Justifiqa (Domain Hukum)" {
  ' Client & Partner Core Flows (J-UC01 - J-UC12)
  usecase "J-UC01: Registrasi Akun Klien (Verifikasi NIK Dukcapil)" as UC01
  usecase "J-UC02: Login Akun Klien (MFA / 2FA)" as UC02
  usecase "J-UC03: Memilih & Memfilter Katalog Advokat" as UC03
  usecase "J-UC04: Melakukan Konsultasi Hukum (E2EE Chat)" as UC04
  usecase "J-UC05: Membayar Biaya Konsultasi Escrow" as UC05
  usecase "J-UC06: Memberikan Ulasan & Rating Advokat" as UC06
  
  usecase "J-UC07: Registrasi Akun Advokat / Notaris" as UC07
  usecase "J-UC08: Login Akun Advokat / Notaris (MFA / TOTP)" as UC08
  usecase "J-UC09: Mengatur Status Online & Jam Praktik" as UC09
  usecase "J-UC10: Melayani Sesi Konsultasi Hukum" as UC10
  usecase "J-UC11: Membuat Catatan Sesi IRAC Note" as UC11
  usecase "J-UC12: Membuat Draf Opini Hukum / Kontrak" as UC12
  
  ' Domain Specific Legal Flows (J-UC13 - J-UC15, J-UC22)
  usecase "J-UC13: Mengunggah Bukti Perkara Zero-Knowledge" as UC13
  usecase "J-UC14: Merender Draf Kontrak & e-Meterai Peruri" as UC14
  usecase "J-UC15: Mengajukan Konsultasi Pro Bono SKTM" as UC15
  usecase "J-UC22: Top-Up Saldo Dompet Advokat" as UC22
  
  ' Phase 2 Canonical Target Flows (J-UC23 & J-UC24)
  usecase "J-UC23: Corporate Intake & Notary Stamping PT/CV" as UC23
  usecase "J-UC24: Transaksi Properti & e-KYC Forensik Multi-Pihak" as UC24
  
  ' Independent Admin Flows (J-UC16 - J-UC21)
  usecase "J-UC16: Memverifikasi Kredensial & Lisensi Advokat" as UC16
  usecase "J-UC17: Moderasi Etik & Suspend Due Process" as UC17
  usecase "J-UC18: Memantau Laporan Keuangan Escrow & WORM Log" as UC18
  usecase "J-UC19: Mencairkan Dana Escrow & PPh 21" as UC19
  usecase "J-UC20: Autentikasi Portal Backoffice Admin (TOTP 2FA)" as UC20
  usecase "J-UC21: Melaporkan Pelanggaran Etik Advokat" as UC21
  
  ' PlantUML Architectural Notes
  note right of UC15
    Permohonan Pro Bono SKTM tetap menerbitkan
    Invoice/Escrow Ledger Rp0 (J-UC05) untuk pencatatan
    kuota bulanan advokat & kepatuhan UU 16/2011.
  end note

  ' UML Inclusion & Extension Relationships
  UC04 ..> UC05 : <<include>>
  UC12 ..> UC11 : <<extend>>
  UC14 ..> UC12 : <<include>>
  UC15 ..> UC05 : <<include>>
  UC15 ..> UC04 : <<include>>
  UC23 ..> UC05 : <<include>>
  UC24 ..> UC05 : <<include>>
  
  ' Primary Actor Associations (Klien)
  Klien -- UC01
  Klien -- UC02
  Klien -- UC03
  Klien -- UC04
  Klien -- UC05
  Klien -- UC06
  Klien -- UC13
  Klien -- UC14
  Klien -- UC15
  Klien -- UC21
  Klien -- UC23
  Klien -- UC24
  
  ' Primary Actor Associations (Mitra Advokat / Notaris)
  Mitra -- UC04
  Mitra -- UC07
  Mitra -- UC08
  Mitra -- UC09
  Mitra -- UC10
  Mitra -- UC11
  Mitra -- UC12
  Mitra -- UC13
  Mitra -- UC14
  Mitra -- UC19
  Mitra -- UC22
  Mitra -- UC23
  Mitra -- UC24
  
  ' Admin Backoffice Associations
  Admin -- UC16
  Admin -- UC17
  Admin -- UC18
  Admin -- UC20
  
  ' Supporting System Relationships
  UC05 -- PG
  UC19 -- PG
  UC22 -- PG
  
  UC05 -- Escrow
  UC23 -- Escrow
  UC24 -- Escrow
  
  UC14 -- Mekari
  UC23 -- Mekari
  
  UC24 -- CVAI
}
@enduml
```

---

**END OF FILE.**
