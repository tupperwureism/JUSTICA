# Phase 2 Use Cases and UML Sequence Diagrams

## Bagian A: Pembaruan Use Case dan Aktor

### Aktor Baru

| Aktor | Peran |
| --- | --- |
| Notaris Terdaftar | Memverifikasi berkas pendirian badan usaha, memberi cap notaris, dan mengunci status dokumen legal. |
| Computer Vision AI (Forensic Verification) | Mesin AI forensik yang mengekstraksi liveness (anti-editan), OCR KTP, dan mendeteksi TTD di layar laptop/device — semuanya dianalisis secara bersamaan dalam satu frame foto pembuktian. |

### Use Case Baru

| Use Case | Aktor Utama | Hasil Sistem |
| --- | --- | --- |
| Mendirikan PT/CV berstandar PPATK | Klien, Notaris Terdaftar | Data corporate intake tersimpan, diverifikasi notaris, dan diaudit oleh WORM Trigger. |
| Menandatangani Dokumen via Verifikasi Biometrik AI Liveness | Klien, Computer Vision AI (Forensic Verification) | Dalam alur **Forensik Jual Beli Tanah**, identitas pihak tervalidasi hanya setelah Klien memegang KTP dan laptop/device berisi TTD final secara fisik dalam satu foto pembuktian — mencapai tingkat *Absolute Non-Repudiation* sebelum status KYC pihak dikunci Hijau dan dokumen disahkan multi-party. |

## Bagian B: Sequence Diagram

### Alur Corporate Intake dan Notary Stamping

```plantuml
@startuml
actor Klien
participant "Corporate UI" as UI
database "Supabase DB" as DB
actor Notaris

Klien -> UI: Isi data pendirian PT/CV
activate UI
UI -> DB: Simpan corporate intake
activate DB
DB --> UI: Intake tersimpan
deactivate DB
UI --> Klien: Konfirmasi intake diterima
deactivate UI

Notaris -> DB: Tarik data corporate intake
activate DB
DB --> Notaris: Data intake tersedia
deactivate DB

Notaris -> DB: Stamping dan update status WORM
activate DB
DB --> Notaris: Status WORM terkunci
deactivate DB

DB -> UI: Notifikasi status stamping
activate UI
UI --> Klien: Notifikasi hasil notary stamping
deactivate UI
@enduml
```

### Alur e-KYC Forensik Computer Vision — High-Stakes Property Transaction (Jual Beli Tanah)

*Sequence Diagram 1-to-1 dengan AD-P2-02 di `PHASE_2_ACTIVITY_DIAGRAMS.md`. Fokus forensik identitas multi-pihak; **tidak mencakup alur escrow pembayaran**.*

```plantuml
@startuml
title SD-P2-02: High-Stakes Property Transaction — e-KYC Forensik Computer Vision (Jual Beli Tanah)

actor Klien
participant "Sistem UI" as UI
participant "CV AI" as CV
database "Supabase BaaS" as DB

Klien -> UI: Akses tautan email (Auto-login)
activate UI
UI -> UI: Basic liveness check

Klien -> UI: Baca & setujui e-kertas (1..n),\nTTD final e-kertas

UI -> Klien: Tampilkan instruksi foto\n(KTP kiri + Laptop/TTD Final kanan)
Klien -> UI: Upload foto forensik

loop Max 3 percobaan forensik
  UI -> CV: Request analisis gambar (foto)
  activate CV
  CV -> CV: Verifikasi liveness\nOCR KTP\nDeteksi layar & TTD
  CV -> DB: Kirim hasil ekstraksi data
  deactivate CV

  activate DB
  DB -> DB: Validasi vs Database Dukcapil/Pemerintah

  alt Sukses (Validasi Cocok)
    DB -> DB: Lock status KYC pihak -> Hijau (GREEN)
    DB -> DB: Simpan ekyc_verification_logs\n(reference_id, digest SHA-256 — TANPA media)
    DB -> DB: Cek: semua pihak sudah berstatus Hijau?
    alt Belum semua pihak Hijau
      DB -> DB: Menunggu pihak lain\nmenyelesaikan KYC forensik
      note over DB: Sinkronisasi multi-party\nJual Beli Tanah
    else Semua pihak Hijau
      DB -> DB: Case e-KYC forensik selesai\nuntuk seluruh pihak
    end
    DB --> UI: Status sinkronisasi KYC
    deactivate DB
    UI --> Klien: Proses verifikasi selesai
    break
  else Gagal Total (Limit Habis — percobaan == 3)
    DB -> DB: Global Broadcast:\nProses Gagal (Pihak Ilegal Terdeteksi)
    note over DB: Stop — case terminal
    deactivate DB
    break
  else Gagal (KTP beda / foto editan / ilegal)\ndan percobaan < 3
    DB -> DB: Catat percobaan gagal,\nincrement counter
    DB --> UI: Verifikasi gagal — minta foto ulang
    deactivate DB
    UI --> Klien: Instruksi foto ulang\n(sesuai forensik)
    Klien -> UI: Upload foto forensik (ulang)
  end
end

deactivate UI

@enduml
```
