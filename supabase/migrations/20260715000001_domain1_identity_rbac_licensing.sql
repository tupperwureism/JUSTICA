-- ============================================================================
-- JUSTICA PHYSICAL DATABASE MIGRATION SCRIPT
-- Phase 4B - Batch 1: Domain 1 (Identity, RBAC & Professional Licensing)
-- Target DBMS: PostgreSQL 15+ / Supabase (with pgcrypto extension)
-- Compliance: 1-to-1 Bi-Directional Mapping with Baseline commit 0cad127
-- ============================================================================

-- Enable required cryptographic extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLE: users_client (Klien Hukum Terverifikasi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users_client (
    client_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name       VARCHAR(128) NOT NULL,
    email           VARCHAR(128) NOT NULL,
    phone_e164      VARCHAR(20)  NOT NULL,
    nik_ktp         VARCHAR(16)  NULL,
    kyc_status      VARCHAR(32)  NOT NULL DEFAULT 'UNVERIFIED',
    password_hash   VARCHAR(256) NOT NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_client_email UNIQUE (email),
    CONSTRAINT uq_users_client_nik_ktp UNIQUE (nik_ktp),
    CONSTRAINT chk_users_client_kyc_status CHECK (
        kyc_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')
    ),
    CONSTRAINT chk_users_client_nik_length CHECK (
        nik_ktp IS NULL OR length(nik_ktp) = 16
    )
);

-- Indexing for authentication and lookup performance
CREATE INDEX IF NOT EXISTS idx_users_client_email ON users_client(email);
CREATE INDEX IF NOT EXISTS idx_users_client_kyc_status ON users_client(kyc_status);

-- Enable Row-Level Security (RLS)
ALTER TABLE users_client ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can view and edit only their own profile
CREATE POLICY rls_users_client_self_access ON users_client
    FOR ALL
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());


-- ============================================================================
-- 2. TABLE: users_advocate (Mitra Advokat Terverifikasi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users_advocate (
    advocate_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name              VARCHAR(128)  NOT NULL,
    email                  VARCHAR(128)  NOT NULL,
    phone_e164             VARCHAR(20)   NOT NULL,
    sipp_license_no        VARCHAR(64)   NOT NULL,
    peradi_card_no         VARCHAR(64)   NOT NULL,
    specialization_primary VARCHAR(64)   NOT NULL,
    kyc_status             VARCHAR(32)   NOT NULL DEFAULT 'PENDING',
    is_online              BOOLEAN       NOT NULL DEFAULT false,
    sla_strikes            SMALLINT      NOT NULL DEFAULT 0,
    average_rating         NUMERIC(3,2)  DEFAULT 0.00,
    created_at             TIMESTAMPTZ   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_advocate_email UNIQUE (email),
    CONSTRAINT uq_users_advocate_sipp UNIQUE (sipp_license_no),
    CONSTRAINT chk_users_advocate_kyc_status CHECK (
        kyc_status IN ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED')
    ),
    CONSTRAINT chk_users_advocate_sla_strikes CHECK (sla_strikes >= 0),
    CONSTRAINT chk_users_advocate_rating CHECK (
        average_rating >= 0.00 AND average_rating <= 5.00
    )
);

-- Indexing for advocate search catalog and license validation
CREATE INDEX IF NOT EXISTS idx_users_advocate_specialization ON users_advocate(specialization_primary);
CREATE INDEX IF NOT EXISTS idx_users_advocate_online_status ON users_advocate(is_online, kyc_status);

-- Enable Row-Level Security (RLS)
ALTER TABLE users_advocate ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can read active verified advocates
CREATE POLICY rls_users_advocate_public_read ON users_advocate
    FOR SELECT
    USING (kyc_status = 'VERIFIED' OR advocate_id = auth.uid());

-- RLS Policy: Advocates can update their own online status and profile
CREATE POLICY rls_users_advocate_self_update ON users_advocate
    FOR UPDATE
    USING (advocate_id = auth.uid())
    WITH CHECK (advocate_id = auth.uid());


-- ============================================================================
-- 3. TABLE: users_admin (Administrator Kepatuhan & Dewan Mediator)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users_admin (
    admin_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name     VARCHAR(128) NOT NULL,
    email         VARCHAR(128) NOT NULL,
    role_group    VARCHAR(32)  NOT NULL,
    fido2_enabled BOOLEAN      NOT NULL DEFAULT true,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_users_admin_email UNIQUE (email),
    CONSTRAINT chk_users_admin_role_group CHECK (
        role_group IN ('COMPLIANCE_OFFICER', 'DISPUTE_MEDIATOR', 'SUPER_ADMIN')
    )
);

-- Enable Row-Level Security (RLS)
ALTER TABLE users_admin ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only authenticated internal admin accounts can access
CREATE POLICY rls_users_admin_internal_access ON users_admin
    FOR ALL
    USING (admin_id = auth.uid());


-- ============================================================================
-- 4. TABLE: user_active_devices (Manajemen Sesi MFA & Perangkat Aktif)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_active_devices (
    device_session_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type           VARCHAR(16)  NOT NULL,
    user_id             UUID         NOT NULL,
    device_name         VARCHAR(64)  NOT NULL,
    hardware_token_hash VARCHAR(256) NOT NULL,
    ip_address          VARCHAR(45)  NOT NULL,
    last_active_at      TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_user_active_devices_user_type CHECK (
        user_type IN ('CLIENT', 'ADVOCATE', 'ADMIN')
    )
);

-- Indexing for quick user device lookup and session revocation
CREATE INDEX IF NOT EXISTS idx_user_active_devices_user_id ON user_active_devices(user_id, user_type);

-- Enable Row-Level Security (RLS)
ALTER TABLE user_active_devices ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view and revoke their own active devices (MOCK-J-CL-10)
CREATE POLICY rls_user_active_devices_self_manage ON user_active_devices
    FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());


-- ============================================================================
-- 5. TABLE: sipp_verifications (Jejak Verifikasi Lisensi MA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sipp_verifications (
    verification_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id          UUID        NOT NULL,
    verified_by_admin_id UUID        NULL,
    sipp_number          VARCHAR(64) NOT NULL,
    status               VARCHAR(32) NOT NULL DEFAULT 'UNVERIFIED',
    verification_notes   TEXT        NULL,
    verified_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sipp_advocate FOREIGN KEY (advocate_id)
        REFERENCES users_advocate(advocate_id) ON DELETE CASCADE,
    CONSTRAINT fk_sipp_admin FOREIGN KEY (verified_by_admin_id)
        REFERENCES users_admin(admin_id) ON DELETE SET NULL,
    CONSTRAINT chk_sipp_verification_status CHECK (
        status IN (
            'UNVERIFIED',
            'PENDING_MANUAL_REVIEW',
            'VERIFIED_ACTIVE',
            'REJECTED_RESUBMIT',
            'SUSPENDED_SANCTION'
        )
    )
);

-- Indexing for license verification audit trail
CREATE INDEX IF NOT EXISTS idx_sipp_verifications_advocate ON sipp_verifications(advocate_id);
CREATE INDEX IF NOT EXISTS idx_sipp_verifications_status ON sipp_verifications(status);

-- Enable Row-Level Security (RLS)
ALTER TABLE sipp_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Advocates can view their own verification logs
CREATE POLICY rls_sipp_verifications_advocate_read ON sipp_verifications
    FOR SELECT
    USING (advocate_id = auth.uid());


-- ============================================================================
-- 6. TABLE: advocate_service_tiers (Katalog Tarif Tier 1, 2, 3)
-- ============================================================================
CREATE TABLE IF NOT EXISTS advocate_service_tiers (
    tier_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id      UUID          NOT NULL,
    tier_level       SMALLINT      NOT NULL,
    tier_name        VARCHAR(64)   NOT NULL,
    duration_minutes SMALLINT      NULL,
    price_idr        NUMERIC(15,2) NOT NULL,
    is_active        BOOLEAN       NOT NULL DEFAULT true,
    CONSTRAINT fk_tier_advocate FOREIGN KEY (advocate_id)
        REFERENCES users_advocate(advocate_id) ON DELETE CASCADE,
    CONSTRAINT chk_tier_level CHECK (tier_level IN (1, 2, 3)),
    CONSTRAINT chk_tier_price CHECK (price_idr >= 0)
);

-- Indexing for Tier filtering (MOCK-J-CL-02)
CREATE INDEX IF NOT EXISTS idx_advocate_service_tiers_advocate ON advocate_service_tiers(advocate_id, is_active);

-- Enable Row-Level Security (RLS)
ALTER TABLE advocate_service_tiers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view active service tiers
CREATE POLICY rls_advocate_service_tiers_public_read ON advocate_service_tiers
    FOR SELECT
    USING (is_active = true OR advocate_id = auth.uid());

-- RLS Policy: Advocates can manage their own service tiers
CREATE POLICY rls_advocate_service_tiers_advocate_manage ON advocate_service_tiers
    FOR ALL
    USING (advocate_id = auth.uid())
    WITH CHECK (advocate_id = auth.uid());


-- ============================================================================
-- 7. TABLE: advocate_sanctions_log (Riwayat Sanksi & Due Process)
-- ============================================================================
CREATE TABLE IF NOT EXISTS advocate_sanctions_log (
    sanction_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id        UUID        NOT NULL,
    issued_by_admin_id UUID        NOT NULL,
    sanction_type      VARCHAR(32) NOT NULL,
    warning_level      SMALLINT    NOT NULL,
    reason_text        TEXT        NOT NULL,
    issued_at          TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_sanction_advocate FOREIGN KEY (advocate_id)
        REFERENCES users_advocate(advocate_id) ON DELETE CASCADE,
    CONSTRAINT fk_sanction_admin FOREIGN KEY (issued_by_admin_id)
        REFERENCES users_admin(admin_id) ON DELETE RESTRICT,
    CONSTRAINT chk_sanction_warning_level CHECK (warning_level BETWEEN 1 AND 3)
);

-- Indexing for moderation queue and sanction tracking (MOCK-J-AM-03)
CREATE INDEX IF NOT EXISTS idx_advocate_sanctions_advocate ON advocate_sanctions_log(advocate_id);

-- Enable Row-Level Security (RLS)
ALTER TABLE advocate_sanctions_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Advocates can view their own disciplinary notices
CREATE POLICY rls_advocate_sanctions_advocate_read ON advocate_sanctions_log
    FOR SELECT
    USING (advocate_id = auth.uid());

-- ============================================================================
-- END OF BATCH 1 DDL & RLS MIGRATION (DOMAIN 1: TABLES 1 TO 7)
-- ============================================================================
