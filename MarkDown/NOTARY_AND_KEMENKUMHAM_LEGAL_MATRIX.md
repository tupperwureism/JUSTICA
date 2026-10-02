# Notary & Kemenkumham Legal Matrix

> Status: kontrol desain P2-B8, bukan opini hukum, pengganti minuta, akses resmi AHU/OSS, atau bukti bahwa dokumen telah menjadi akta autentik. Go-live wajib memperoleh persetujuan notaris penanggung jawab dan penasihat hukum Indonesia.

## Dasar hukum dan batas produk

UU No. 2 Tahun 2014 mengubah UU No. 30 Tahun 2004 tentang Jabatan Notaris dan menempatkan notaris sebagai pejabat umum yang berwenang membuat akta autentik sesuai bentuk, tata cara, kewajiban, larangan, serta protokol yang ditentukan UUJN. Unggahan PDF, tanda tangan elektronik, e-Meterai, atau hash WORM Justifiqa **tidak dengan sendirinya** menjadikan dokumen sebagai akta autentik dan tidak menggantikan pembacaan, penandatanganan, minuta, repertorium, penyimpanan protokol, maupun kewajiban merahasiakan isi akta.

Perpres No. 13 Tahun 2018 mewajibkan penerapan prinsip mengenali Pemilik Manfaat Korporasi. Permenkum No. 2 Tahun 2025 tentang Verifikasi dan Pengawasan Pemilik Manfaat Korporasi memperkuat verifikasi, pengawasan, dan kepatuhan pelaporan; Pemilik Manfaat tetap orang perseorangan. Sistem hanya menyimpan referensi identitas terlindungi dan digest bukti, bukan KTP/NPWP mentah di tabel workflow.

Sumber pemerintah:

- [JDIH BPK — UU No. 2 Tahun 2014](https://peraturan.bpk.go.id/Details/38565/uu-no-2-tahun-2014)
- [JDIH BPK — UU No. 30 Tahun 2004](https://peraturan.bpk.go.id/Details/40758)
- [JDIH BPK — Perpres No. 13 Tahun 2018](https://peraturan.bpk.go.id/Home/Details/73583/perpres-no-13-tahun-2018)
- [JDIH BPK — Permenkum No. 2 Tahun 2025](https://peraturan.bpk.go.id/Details/314767/permenkum-no-2-tahun-2025)

## Matriks kontrol

| Risiko/kewajiban | Aturan mutlak | Kontrol teknis dan bukti keluar |
|---|---|---|
| Kewenangan notaris | Hanya notaris yang sah, aktif, dan secara eksplisit ditugaskan boleh memproses perkara. Akun advokat biasa tidak otomatis memperoleh hak notaris. | `assigned_notary_id = auth.uid()`, verifikasi registry profesional, assignment audit, pencabutan akses segera saat penugasan berakhir. |
| Akta autentik | Workflow digital hanya alat bantu. Keautentikan mengikuti UUJN dan tindakan pejabat berwenang, bukan label UI atau hash. | Checklist formalitas, identitas penghadap, waktu/tempat, pembacaan, tanda tangan, minuta/protokol, serta review notaris di luar klaim otomatis platform. |
| Rahasia jabatan | Isi akta, keterangan penghadap, KTP, NPWP, saham, dan dokumen pendukung tidak boleh bocor ke notaris lain atau tenant lain. | RLS default-deny; object bucket privat; signed URL singkat; redaksi log; audit akses; tidak ada public URL. |
| Strict Notary Tenant Isolation | Notaris A hanya membaca/menulis kasus dengan `corporate_service_cases.assigned_notary_id = auth.uid()`. Notaris A dilarang keras melihat data kasus Notaris B. | Policy per relasi melalui `case_id`; negative test cross-notary untuk case, parties, BO, job, anchor, dan object path. |
| Akses klien | Klien hanya membaca status/dokumen kasus miliknya melalui `service_orders.client_id = auth.uid()`. Klien tidak memperoleh credential, payload mentah, catatan rahasia notaris, atau keputusan internal PMPJ. | Projection allow-list, policy client-owner, pemisahan `compliance_assessments`, dan uji enumerasi UUID. |
| Beneficial Owner | Korporasi menetapkan Pemilik Manfaat orang perseorangan berdasarkan basis kendali/manfaat dan bukti yang dapat diverifikasi. | Deklarasi berversi, natural-person-only, persentase/basis kontrol, evidence digest SHA-256, reviewer/date, dan referensi AHU. |
| Pengajuan AHU/OSS | Credential, token, cookie, CAPTCHA response, raw request, dan raw response tidak boleh disimpan di database workflow. Integrasi hanya melalui kanal resmi/berizin. | Metadata job, idempotency key, digest payload, nomor registrasi eksternal, timestamp, retry terkontrol, secret manager. |
| Integritas dokumen | Akta, SK Kemenkumham, dan NIB terikat ke byte final yang tepat dengan lowercase SHA-256 dan `case_id`. | `document_integrity_anchors` append-only; serial unik bila tersedia; jenis dokumen eksplisit; tamper test. |
| WORM | Trigger database adalah kontrol append-only aplikasi, bukan true WORM terhadap administrator database. | Replikasi Phase 3 ke object-lock archive, retention policy, legal hold, restore drill, dan verifikasi hash independen. |
| Upload berbahaya | Nama file/MIME dari browser tidak dipercaya; dokumen tidak boleh dipublikasikan sebelum pemeriksaan. | Server-side MIME sniffing, ukuran/ekstensi allow-list, malware scan, karantina, hashing server-side, object key acak. |
| Perubahan penugasan | Pergantian notaris tidak boleh memberi akses paralel terselubung atau mengubah jejak lama. | Assignment transition terotorisasi, revoke signed URL/session, audit append-only, dan re-check RLS pada setiap request. |

## State dan kontrak pengajuan

```text
DRAFT -> SUBMITTED -> APPROVED
                  \-> REJECTED -> DRAFT (revisi eksplisit, job/idempotency baru)
target: AHU_SABH | AHU_SABU | AHU_BO | OSS_RBA
```

1. Notaris tertugas mengunggah dokumen ke bucket privat; server melakukan scan dan menghitung SHA-256 dari byte final.
2. Transaksi singkat mencatat anchor WORM dan job idempoten. Tidak ada credential pemerintah atau body mentah di database.
3. Adapter pemerintah berjalan di luar transaksi database, lalu menyimpan nomor registrasi dan keputusan terautentikasi.
4. Klien hanya melihat status aman dan dokumen final yang memang boleh disampaikan.

## Exit gate

- Uji Notaris A versus Notaris B untuk seluruh tabel dan object storage menghasilkan deny.
- Uji klien lain/anon menghasilkan deny; klien pemilik hanya menerima projection yang diizinkan.
- Duplicate submission/idempotency, digest mismatch, file tampered, malware, retry, rejection, dan reassignment diuji.
- Counsel/notaris menyetujui scope dokumen dan formalitas; tidak ada klaim “akta autentik otomatis”.
- Rekonsiliasi nomor AHU/NIB dan hash terhadap dokumen final lulus sebelum status `APPROVED`/`NIB_ISSUED`.
