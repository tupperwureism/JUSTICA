"""
Batch 2: Replace SD-05→SD-14, SD-06→SD-08, SD-07→SD-11, insert SD-12, replace SD-17→SD-18
in unified_plantuml_codes.md
"""
import re

FILE = r'd:\justificadll\MarkDown\unified_plantuml_codes.md'

with open(FILE, 'r', encoding='utf-8') as f:
    content = f.read()

# ============================================================
# REPLACEMENT DIAGRAMS
# ============================================================

SD_08 = r"""### SD-08: Sequence Diagram - Registrasi Klien (UC-01)
*Diagram ini merepresentasikan alur registrasi klien dengan validasi duplikasi NIK/BPJS (Kes), verifikasi email domain .ac.id untuk psikolog magang (Psi), serta consent granular per domain.*

```plantuml
@startuml
autonumber
skinparam sequenceArrowThickness 2
skinparam maxMessageSize 250

title SD-08: Registrasi Klien (UC-01)

actor "Klien" as K
participant ":HalamanRegisterUI" as UI
participant ":RegistrationController" as RC
participant ":ValidationService" as VS
participant ":ConsentService" as CS
participant ":DB_User" as DB

== FASE 1: Input Data & Validasi Format ==

K -> UI : 1. Input data (nama, email, noHP, NIK, password)
UI -> RC : 2. registerKlien(formData)
RC -> VS : 3. validateFormat(formData)

alt [Format Tidak Valid]
    VS --> RC : 4a. FORMAT_ERROR(fields[])
    RC --> UI : 5a. tampilkanErrorFormat()
    UI --> K : 6a. Highlight field bermasalah
else [Format Valid]
    VS --> RC : 4b. FORMAT_OK
end

== FASE 2: Cek Duplikasi (Domain-Aware) ==

RC -> DB : 7. cekDuplikasi(email, noHP)
DB --> RC : 8. isDuplicate: true/false

alt [Duplikasi Ditemukan]
    RC --> UI : 9a. tampilkanErrorDuplikasi("Email/HP sudah terdaftar")
    UI --> K : 10a. Pesan error + link "Lupa Password?"
else [Data Baru - Lanjut]

    RC -> VS : 9b. validateNIK(NIK)
    VS --> RC : 10b. NIK_VALID / NIK_INVALID
    note right : Validasi format NIK 16 digit\n+ cek duplikasi NIK di DB

    == FASE 3: Consent Collection ==

    RC -> CS : 11. getRequiredConsents(domain)
    CS --> RC : 12. consentForms[privacyPolicy, termsOfService, dataSensitif]
    RC --> UI : 13. renderConsentForms(consentForms)
    UI --> K : 14. Tampilkan checkbox consent (wajib centang semua)

    K -> UI : 15. Centang semua consent + klik "Daftar"
    UI -> RC : 16. submitRegistration(formData, consents[])

    RC -> CS : 17. recordConsent(userId, consents[], version, timestamp)
    CS -> DB : 18. saveConsent(consentRecord)
    DB --> CS : 19. CONSENT_SAVED

    RC -> DB : 20. saveNewUser(formData, status=ACTIVE)
    DB --> RC : 21. USER_CREATED(userId)

    RC --> UI : 22. tampilkanRegistrasiBerhasil()
    UI --> K : 23. Redirect ke halaman Login
end

@enduml
```
"""

SD_11 = r"""### SD-11: Sequence Diagram - Registrasi Mitra Profesional (UC-07)
*Diagram ini merepresentasikan alur registrasi mitra dengan upload berkas domain-specific: STR + SIP + BPJS Provider (Kes), SIPP + HIMPSI Membership (Psi), KTA Peradi + SK Pengacara (Huk). Status awal PENDING_VERIFICATION.*

```plantuml
@startuml
autonumber
skinparam sequenceArrowThickness 2
skinparam maxMessageSize 250

title SD-11: Registrasi Mitra Profesional (UC-07)

actor "Mitra" as M
participant ":HalamanRegisterMitraUI" as UI
participant ":MitraRegistrationController" as MRC
participant ":FileUploadService" as FU
participant ":ValidationService" as VS
participant ":NotificationService" as NS
participant ":DB_Mitra" as DB

== FASE 1: Input Data Pribadi ==

M -> UI : 1. Input data (nama, email, noHP, password, domain)
UI -> MRC : 2. registerMitra(formData)
MRC -> VS : 3. validateFormat(formData)
VS --> MRC : 4. FORMAT_OK / FORMAT_ERROR

alt [Format Error]
    MRC --> UI : 5a. tampilkanError()
    UI --> M : 6a. Highlight field bermasalah
end

== FASE 2: Upload Berkas Domain-Specific ==

alt [Domain = Kesehatan]
    MRC --> UI : 7a. renderUploadForm([STR, SIP, BPJS_Provider])
    UI --> M : 8a. Form upload: STR + SIP + No. BPJS Provider
    M -> UI : 9a. Upload file STR, SIP, input BPJS
    UI -> FU : 10a. uploadFiles([str.pdf, sip.pdf])
    FU --> UI : 11a. fileUrls[]
    note right : STR (Surat Tanda Registrasi)\nSIP (Surat Izin Praktik)\nBPJS Provider ID
else [Domain = Psikologi]
    MRC --> UI : 7b. renderUploadForm([SIPP, HIMPSI_Member, Ijazah])
    UI --> M : 8b. Form upload: SIPP + Kartu HIMPSI + Ijazah
    M -> UI : 9b. Upload file SIPP, HIMPSI, Ijazah
    UI -> FU : 10b. uploadFiles([sipp.pdf, himpsi.pdf, ijazah.pdf])
    FU --> UI : 11b. fileUrls[]
    note right : SIPP (Surat Izin Praktik Psikolog)\nHIMPSI Membership Card
else [Domain = Hukum]
    MRC --> UI : 7c. renderUploadForm([KTA_Peradi, SK_Pengacara, Ijazah])
    UI --> M : 8c. Form upload: KTA Peradi + SK + Ijazah
    M -> UI : 9c. Upload file KTA, SK, Ijazah
    UI -> FU : 10c. uploadFiles([kta.pdf, sk.pdf, ijazah.pdf])
    FU --> UI : 11c. fileUrls[]
    note right : KTA Peradi (Kartu Tanda Advokat)\nSK Pengangkatan Pengacara
end

== FASE 3: Simpan & Status Pending ==

UI -> MRC : 12. submitMitraRegistration(formData, fileUrls[])
MRC -> DB : 13. saveMitra(formData, fileUrls, status=PENDING_VERIFICATION)
DB --> MRC : 14. MITRA_CREATED(mitraId)

MRC -> NS : 15. sendNotif(mitra, "Pendaftaran diterima, menunggu verifikasi Admin")
NS --> MRC : 16. NOTIF_SENT
MRC -> NS : 17. sendNotif(admin, "Mitra baru mendaftar, silakan verifikasi")
NS --> MRC : 18. NOTIF_SENT

MRC --> UI : 19. tampilkanPendingScreen()
UI --> M : 20. "Akun Anda sedang dalam proses verifikasi (est. 1x24 jam)"

@enduml
```
"""

SD_12 = r"""### SD-12: Sequence Diagram - Login Mitra dengan MFA (UC-08)
*Diagram ini merepresentasikan alur login khusus Mitra Profesional yang mewajibkan Multi-Factor Authentication (TOTP/SMS) sebagai compliance data sensitif pasien/klien.*

```plantuml
@startuml
autonumber
skinparam sequenceArrowThickness 2
skinparam maxMessageSize 250

title SD-12: Login Mitra dengan MFA (UC-08)

actor "Mitra" as M
participant ":HalamanLoginMitraUI" as UI
participant ":AuthController" as AC
participant ":MFAService" as MFA
participant ":AuditLogService" as AL
participant ":DB_Auth" as DB

== FASE 1: Kredensial Primer ==

M -> UI : 1. Input email + password
UI -> AC : 2. loginMitra(email, password)
AC -> DB : 3. verifyCredentials(email, hashPassword)
DB --> AC : 4. {valid: true, mitraId, domain, mfaMethod}

alt [Kredensial Salah]
    AC -> AL : 5a. logFailedLogin(email, ip, timestamp)
    AC --> UI : 6a. "Email atau password salah"
    UI --> M : 7a. Tampilkan error + sisa percobaan
else [Kredensial Benar]

    == FASE 2: Multi-Factor Authentication ==

    alt [MFA Method = TOTP (Authenticator App)]
        AC -> MFA : 5b. requestTOTP(mitraId)
        MFA --> AC : 6b. TOTP_REQUESTED
        AC --> UI : 7b. Tampilkan input 6-digit TOTP
        UI --> M : 8b. "Masukkan kode dari Authenticator App"
        M -> UI : 9b. Input kode TOTP
        UI -> AC : 10b. verifyTOTP(mitraId, code)
        AC -> MFA : 11b. validateTOTP(mitraId, code)
        MFA --> AC : 12b. TOTP_VALID / TOTP_INVALID
    else [MFA Method = SMS OTP]
        AC -> MFA : 5c. sendSMSOTP(mitraId, noHP)
        MFA --> AC : 6c. OTP_SENT(expiresIn=300s)
        AC --> UI : 7c. Tampilkan input 4-digit OTP
        UI --> M : 8c. "Kode OTP terkirim ke HP Anda"
        M -> UI : 9c. Input kode OTP
        UI -> AC : 10c. verifyOTP(mitraId, code)
        AC -> MFA : 11c. validateOTP(mitraId, code)
        MFA --> AC : 12c. OTP_VALID / OTP_INVALID
    end

    alt [MFA Invalid]
        AC -> AL : 13a. logFailedMFA(mitraId, method, ip)
        AC --> UI : 14a. "Kode verifikasi salah"
    else [MFA Valid]

        == FASE 3: Session & Audit ==

        AC -> DB : 13b. createSession(mitraId, ip, userAgent)
        DB --> AC : 14b. sessionToken + refreshToken
        AC -> AL : 15. logSuccessLogin(mitraId, ip, domain, mfaMethod)
        note right : Audit log wajib untuk\nakses data sensitif pasien/klien
        AL --> AC : 16. LOG_SAVED(WORM)
        AC --> UI : 17. redirect(dashboardMitra, sessionToken)
        UI --> M : 18. Tampilkan Dashboard Mitra
    end
end

@enduml
```
"""

SD_14 = r"""### SD-14: Sequence Diagram - Catatan Sesi dan Output Dokumen (UC-11 dan UC-12)
*Diagram ini merepresentasikan alur pengisian catatan sesi dengan template domain-specific: SOAP Note + ICD-10 (Kes), DAP Note + Risk Assessment (Psi), Case Memo + Legal Opinion IRAC (Huk), serta penerbitan output dokumen.*

```plantuml
@startuml
autonumber
skinparam sequenceArrowThickness 2
skinparam maxMessageSize 250

title SD-14: Catatan Sesi dan Output Dokumen (UC-11 dan UC-12)

actor "Mitra" as M
participant ":FormCatatanSesi" as UI
participant ":SessionNoteController" as SNC
participant ":TemplateEngine" as TE
participant ":DocumentGenerator" as DG
participant ":EncryptionService" as ES
participant ":DB_Catatan" as DB

== FASE 1: Isi Catatan Sesi (UC-11) ==

M -> UI : 1. Buka form catatan sesi
UI -> SNC : 2. loadTemplate(sessionId, domain)

alt [Domain = Kesehatan]
    SNC -> TE : 3a. getSOAPTemplate()
    TE --> SNC : 4a. template{Subjective, Objective, Assessment(ICD-10), Plan}
    note right : SOAP Note format\ndengan kode ICD-10
else [Domain = Psikologi]
    SNC -> TE : 3b. getDAPTemplate()
    TE --> SNC : 4b. template{Data, Assessment, Plan, RiskLevel}
    note right : DAP Note + kolom\nRisk Assessment (crisis flag)
else [Domain = Hukum]
    SNC -> TE : 3c. getCaseMemoTemplate()
    TE --> SNC : 4c. template{Issue, Rule, Application, Conclusion}
    note right : IRAC method untuk\nlegal opinion terstruktur
end

SNC --> UI : 5. renderTemplate(template)
UI --> M : 6. Tampilkan form terstruktur sesuai domain

M -> UI : 7. Isi semua field catatan + klik "Simpan"
UI -> SNC : 8. saveCatatan(sessionId, noteData)
SNC -> ES : 9. encryptNote(noteData, fieldLevel=true)
ES --> SNC : 10. encryptedNote
SNC -> DB : 11. saveEncryptedNote(sessionId, encryptedNote)
DB --> SNC : 12. NOTE_SAVED

== FASE 2: Output Dokumen (UC-12 - Extend) ==

alt [Domain = Kesehatan dan hasilAssessment memerlukan Resep]
    M -> UI : 13a. Klik "Buat Resep Elektronik"
    UI -> SNC : 14a. generatePrescription(sessionId, obatList[])
    SNC -> DG : 15a. buildResepPDF(format=Permenkes73)
    DG --> SNC : 16a. resepPDF + digitalSignature
    note right : Format Permenkes 73/2016\n+ tanda tangan digital dokter
    SNC -> DB : 17a. saveResep(sessionId, resepPDF)
else [Domain = Psikologi dan hasilAssessment ada Tugas]
    M -> UI : 13b. Klik "Buat Lembar Tugas"
    UI -> SNC : 14b. generateHomework(sessionId, taskList[])
    SNC -> DG : 15b. buildHomeworkPDF()
    DG --> SNC : 16b. homeworkPDF
    SNC -> DB : 17b. saveHomework(sessionId, homeworkPDF)
else [Domain = Hukum dan hasilAnalisis ada Legal Opinion]
    M -> UI : 13c. Klik "Buat Legal Opinion"
    UI -> SNC : 14c. generateLegalOpinion(sessionId, iracData)
    SNC -> DG : 15c. buildLegalOpinionPDF(privilegeMarked=true)
    DG --> SNC : 16c. opinionPDF + privilegeStamp
    note right : Auto-stamp "PRIVILEGED\nand CONFIDENTIAL"
    SNC -> DB : 17c. saveLegalOpinion(sessionId, opinionPDF, retention=10yr)
end

SNC --> UI : 18. notifySaved("Catatan & dokumen berhasil disimpan")
UI --> M : 19. Tampilkan konfirmasi + preview dokumen

@enduml
```
"""

SD_18 = r"""### SD-18: Sequence Diagram - Mengelola Saldo dan Penarikan Dana Mitra (UC-17)
*Diagram ini merepresentasikan alur pengecekan saldo, pengajuan pencairan dana dengan logika auto-disburse (< Rp 5 juta) vs manual approval (>= Rp 5 juta), validasi NPWP dan rekening BPJS (Kes), serta mekanisme escrow untuk dana pro bono (Huk).*

```plantuml
@startuml
autonumber
skinparam sequenceArrowThickness 2
skinparam maxMessageSize 250

title SD-18: Mengelola Saldo dan Penarikan Dana Mitra (UC-17)

actor "Mitra" as M
actor "Admin Sistem\n(Sub-role Finansial)" as A
participant ":DashboardSaldo" as UI
participant ":WalletController" as WC
participant ":PayoutService" as PS
participant ":ValidationService" as VS
participant ":BankGateway" as BG
participant ":NotificationService" as NS
participant ":DB_Wallet" as DB

== FASE 1: Cek Saldo & Riwayat ==

M -> UI : 1. Buka halaman "Saldo Pendapatan"
UI -> WC : 2. getWalletInfo(mitraId)
WC -> DB : 3. fetchBalance(mitraId)
DB --> WC : 4. {available, pending, frozen, totalEarned}
WC --> UI : 5. renderSaldoCard(balanceData)
UI --> M : 6. Tampilkan saldo + riwayat penarikan

== FASE 2: Ajukan Penarikan ==

M -> UI : 7. Klik "Tarik Dana" + input nominal
UI -> WC : 8. requestWithdrawal(mitraId, nominal, rekeningTujuan)

WC -> VS : 9. validateWithdrawal(mitraId, nominal)

alt [Saldo Tidak Cukup]
    VS --> WC : 10a. INSUFFICIENT_BALANCE
    WC --> UI : 11a. "Saldo tidak mencukupi"
    UI --> M : 12a. Tampilkan error
else [Saldo Cukup]
    VS --> WC : 10b. BALANCE_OK

    WC -> VS : 11b. validateBankAccount(mitraId, domain)

    alt [Domain = Kesehatan]
        VS -> VS : 12b-kes. validateNPWP(npwp) + validateBPJSProvider(bpjsId)
        note right : Kes: wajib NPWP\n+ rekening BPJS Provider
    else [Domain = Hukum dan isProbono]
        VS -> VS : 12b-huk. checkEscrowStatus(sessionId)
        note right : Huk Pro Bono: dana\ndi-escrow sampai selesai
    end

    VS --> WC : 13b. ACCOUNT_VALID

    == FASE 2.5: Gerbang Nominal ==

    WC -> DB : 14. freezeBalance(mitraId, nominal)
    DB --> WC : 15. BALANCE_FROZEN

    alt [Nominal < 5.000.000 (Auto-Disburse)]
        WC -> PS : 16a. autoPayout(mitraId, nominal, rekening)
        PS -> BG : 17a. pushWithdrawal(amount, bankAccount)
        BG --> PS : 18a. CALLBACK(status=SUCCESS/FAILED)

        alt [Callback SUCCESS]
            PS -> DB : 19a-ok. updateStatus(withdrawalId, SUCCESS)
            PS -> DB : 20a-ok. deductBalance(mitraId, nominal)
            PS -> NS : 21a-ok. sendNotif(mitra, "Penarikan Rp X berhasil")
        else [Callback FAILED / TIMEOUT]
            PS -> DB : 19a-fail. unfreezeBalance(mitraId, nominal)
            PS -> DB : 20a-fail. updateStatus(withdrawalId, FAILED)
            PS -> NS : 21a-fail. sendNotif(mitra, "Penarikan gagal, saldo dikembalikan")
        end

    else [Nominal >= 5.000.000 (Manual Approval)]
        WC -> DB : 16b. createPendingApproval(withdrawalId, nominal)
        WC -> NS : 17b. sendNotif(admin, "Penarikan >= 5jt menunggu approval")
        WC --> UI : 18b. "Penarikan dalam antrian persetujuan Admin"
        UI --> M : 19b. Status = PENDING_APPROVAL

        == FASE 3: Admin Approval ==

        A -> UI : 20b. Buka panel "Permintaan Penarikan Dana"
        A -> UI : 21b. Review detail penarikan

        alt [Admin Setuju]
            A -> UI : 22b-ok. Klik "Approve & Cairkan"
            UI -> PS : 23b-ok. approveAndDisburse(withdrawalId)
            PS -> BG : 24b-ok. pushWithdrawal(amount, bankAccount)
            BG --> PS : 25b-ok. CALLBACK(status)

            alt [SUCCESS]
                PS -> DB : 26b-ok. updateStatus(SUCCESS)
                PS -> DB : 27b-ok. deductBalance(mitraId, nominal)
                PS -> NS : 28b-ok. sendNotif(mitra, "Penarikan disetujui & berhasil dicairkan")
            else [FAILED]
                PS -> DB : 26b-fail. unfreezeBalance(mitraId, nominal)
                PS -> NS : 27b-fail. sendNotif(mitra, "Pencairan gagal, saldo dikembalikan")
            end

        else [Admin Tolak]
            A -> UI : 22b-no. Klik "Reject" + alasan
            UI -> WC : 23b-no. rejectWithdrawal(withdrawalId, reason)
            WC -> DB : 24b-no. unfreezeBalance(mitraId, nominal)
            WC -> DB : 25b-no. updateStatus(withdrawalId, REJECTED)
            WC -> NS : 26b-no. sendNotif(mitra, "Penarikan ditolak: " + reason)
        end
    end
end

@enduml
```
"""

# ============================================================
# PERFORM REPLACEMENTS
# ============================================================

def find_section(text, header_pattern):
    """Find a section from ### header to next --- separator"""
    match = re.search(header_pattern, text)
    if not match:
        return None, None
    start = match.start()
    # Find the --- separator before this header (go back)
    # Actually find the next --- after the section content
    rest = text[match.end():]
    # Find next ### or ## or end of "---" that precedes next section
    next_section = re.search(r'\n---\n\n### ', rest)
    if next_section:
        end = match.end() + next_section.start()
    else:
        # Try finding --- before ## section
        next_section = re.search(r'\n---\n\n## ', rest)
        if next_section:
            end = match.end() + next_section.start()
        else:
            end = len(text)
    return start, end

# 1. Replace SD-05 with SD-14
start, end = find_section(content, r'### SD-05: Sequence Diagram')
if start is not None:
    content = content[:start] + SD_14.strip() + content[end:]
    print(f"✅ SD-05 → SD-14 replaced (was at char {start})")
else:
    print("❌ SD-05 not found")

# 2. Replace SD-06 with SD-08 (re-find after previous edit)
start, end = find_section(content, r'### SD-06: Sequence Diagram')
if start is not None:
    content = content[:start] + SD_08.strip() + content[end:]
    print(f"✅ SD-06 → SD-08 replaced")
else:
    print("❌ SD-06 not found")

# 3. Replace SD-07 with SD-11 + SD-12 (two diagrams replace one)
start, end = find_section(content, r'### SD-07: Sequence Diagram')
if start is not None:
    combined = SD_11.strip() + "\n\n---\n\n" + SD_12.strip()
    content = content[:start] + combined + content[end:]
    print(f"✅ SD-07 → SD-11 + SD-12 replaced")
else:
    print("❌ SD-07 not found")

# 4. Replace SD-17 with SD-18
start, end = find_section(content, r'### SD-17: Sequence Diagram')
if start is not None:
    content = content[:start] + SD_18.strip() + content[end:]
    print(f"✅ SD-17 → SD-18 replaced")
else:
    print("❌ SD-17 not found")

# Write back
with open(FILE, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"\n📄 File saved. Total size: {len(content)} bytes")
