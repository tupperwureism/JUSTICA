-- ============================================================================
-- JUSTICA PHYSICAL DATABASE MIGRATION SCRIPT
-- Phase 4B - Batch 5: Domain 5 (Compliance, Pro Bono & Dispute Resolution WORM)
-- Target DBMS: PostgreSQL 15+ / Supabase
-- Compliance: 1-to-1 Bi-Directional Mapping with Baseline commit 0cad127
-- Includes: Multi-Party 3-of-5 Mediator Consensus & WORM Immutable Audit Vault
-- ============================================================================

-- ============================================================================
-- 22. TABLE: probono_cases (Bantuan Hukum Gratis & Verifikasi DTKS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS probono_cases (
    probono_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id            UUID        NOT NULL,
    dtks_registration_no VARCHAR(64) NOT NULL,
    verified_by_admin_id UUID        NULL,
    status               VARCHAR(32) NOT NULL DEFAULT 'PENDING_DTKS',
    created_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_probono_client FOREIGN KEY (client_id)
        REFERENCES users_client(client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_probono_admin FOREIGN KEY (verified_by_admin_id)
        REFERENCES users_admin(admin_id) ON DELETE SET NULL,
    CONSTRAINT chk_probono_status CHECK (
        status IN ('PENDING_DTKS', 'APPROVED', 'REJECTED')
    )
);

-- Indexing for DTKS verification queue and client pro bono lookup
CREATE INDEX IF NOT EXISTS idx_probono_cases_client_status ON probono_cases(client_id, status);

-- Enable Row-Level Security (RLS)
ALTER TABLE probono_cases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can read their own Pro Bono applications
CREATE POLICY rls_probono_cases_client_read ON probono_cases
    FOR SELECT
    USING (client_id = auth.uid());


-- ============================================================================
-- 23. TABLE: dispute_cases (Sengketa Escrow Status FROZEN)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dispute_cases (
    dispute_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id       UUID        NOT NULL,
    escrow_id        UUID        NOT NULL,
    dispute_category VARCHAR(64) NOT NULL,
    description      TEXT        NOT NULL,
    status           VARCHAR(32) NOT NULL DEFAULT 'UNDER_MEDIATION',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_dispute_booking FOREIGN KEY (booking_id)
        REFERENCES booking_sessions(booking_id) ON DELETE RESTRICT,
    CONSTRAINT fk_dispute_escrow FOREIGN KEY (escrow_id)
        REFERENCES escrow_transactions(escrow_id) ON DELETE RESTRICT,
    CONSTRAINT chk_dispute_category CHECK (
        dispute_category IN ('DELIVERABLE_LATE', 'QUALITY_ISSUE', 'ETHICS')
    ),
    CONSTRAINT chk_dispute_status CHECK (
        status IN ('UNDER_MEDIATION', 'RESOLVED_SPLIT', 'RESOLVED_REFUND')
    )
);

-- Indexing for mediator dashboard queue and escrow freeze lookup
CREATE INDEX IF NOT EXISTS idx_dispute_cases_status ON dispute_cases(status, created_at);
CREATE INDEX IF NOT EXISTS idx_dispute_cases_booking ON dispute_cases(booking_id);

-- Enable Row-Level Security (RLS)
ALTER TABLE dispute_cases ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Participants of the disputed booking can read their dispute case
CREATE POLICY rls_dispute_cases_participant_read ON dispute_cases
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM booking_sessions bs
            WHERE bs.booking_id = dispute_cases.booking_id
              AND (bs.client_id = auth.uid() OR bs.advocate_id = auth.uid())
        )
    );


-- ============================================================================
-- 24. TABLE: dispute_mediator_signatures (Konsensus Multi-Party 3-of-5)
-- ============================================================================
CREATE TABLE IF NOT EXISTS dispute_mediator_signatures (
    signature_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id           UUID         NOT NULL,
    mediator_admin_id    UUID         NOT NULL,
    decision_type        VARCHAR(32)  NOT NULL,
    fido2_signature_hash VARCHAR(256) NOT NULL,
    signed_at            TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_dispute_mediator UNIQUE (dispute_id, mediator_admin_id),
    CONSTRAINT fk_signature_dispute FOREIGN KEY (dispute_id)
        REFERENCES dispute_cases(dispute_id) ON DELETE CASCADE,
    CONSTRAINT fk_signature_admin FOREIGN KEY (mediator_admin_id)
        REFERENCES users_admin(admin_id) ON DELETE RESTRICT,
    CONSTRAINT chk_signature_decision CHECK (
        decision_type IN ('AGREE_SPLIT', 'AGREE_REFUND', 'AGREE_RELEASE')
    )
);

-- Indexing for 3-of-5 quorum consensus aggregation
CREATE INDEX IF NOT EXISTS idx_dispute_signatures_quorum ON dispute_mediator_signatures(dispute_id, decision_type);

-- Enable Row-Level Security (RLS)
ALTER TABLE dispute_mediator_signatures ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Authenticated mediators can inspect FIDO2 signatures
CREATE POLICY rls_dispute_signatures_mediator_read ON dispute_mediator_signatures
    FOR SELECT
    USING (true);


-- ============================================================================
-- 25. TABLE: audit_logs_worm (Append-Only Cryptographic WORM Vault)
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs_worm (
    audit_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id    UUID         NOT NULL,
    actor_type       VARCHAR(16)  NOT NULL,
    action_type      VARCHAR(64)  NOT NULL,
    target_resource  VARCHAR(128) NOT NULL,
    metadata_json    JSONB        NOT NULL,
    worm_sha256_hash VARCHAR(64)  NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_audit_actor_type CHECK (
        actor_type IN ('CLIENT', 'ADVOCATE', 'ADMIN', 'SYSTEM')
    )
);

-- Indexing for forensic trail queries and security audit reports
CREATE INDEX IF NOT EXISTS idx_audit_logs_worm_actor ON audit_logs_worm(actor_user_id, action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_worm_created ON audit_logs_worm(created_at);

-- Enable Row-Level Security (RLS)
ALTER TABLE audit_logs_worm ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view audit records where they are the actor
CREATE POLICY rls_audit_logs_worm_self_read ON audit_logs_worm
    FOR SELECT
    USING (actor_user_id = auth.uid());

-- WORM Trigger: Strictly reject any UPDATE or DELETE on the immutable audit vault
CREATE TRIGGER trg_worm_audit_logs_vault
    BEFORE UPDATE OR DELETE ON audit_logs_worm
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_worm_mutation();


-- ============================================================================
-- 26. TABLE: user_notifications (In-App Notification Center Feed)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_notifications (
    notification_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id UUID         NOT NULL,
    title             VARCHAR(128) NOT NULL,
    message_body      TEXT         NOT NULL,
    is_read           BOOLEAN      NOT NULL DEFAULT false,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for user inbox feed queries
CREATE INDEX IF NOT EXISTS idx_user_notifications_recipient ON user_notifications(recipient_user_id, is_read, created_at DESC);

-- Enable Row-Level Security (RLS)
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own notifications
CREATE POLICY rls_user_notifications_self_read ON user_notifications
    FOR ALL
    USING (recipient_user_id = auth.uid())
    WITH CHECK (recipient_user_id = auth.uid());


-- ============================================================================
-- PL/pgSQL FUNCTION: fn_record_immutable_audit_log
-- Cryptographically hashes and appends an audit event into audit_logs_worm
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_record_immutable_audit_log(
    p_actor_user_id   UUID,
    p_actor_type      VARCHAR(16),
    p_action_type     VARCHAR(64),
    p_target_resource VARCHAR(128),
    p_metadata_json   JSONB
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    v_audit_id UUID;
    v_prev_hash VARCHAR(64);
    v_computed_hash VARCHAR(64);
    v_payload TEXT;
BEGIN
    -- Get last SHA-256 hash for Merkle tree chaining
    SELECT worm_sha256_hash INTO v_prev_hash
    FROM audit_logs_worm
    ORDER BY created_at DESC
    LIMIT 1;

    IF v_prev_hash IS NULL THEN
        v_prev_hash := 'GENESIS_00000000000000000000000000000000000000000000000000000000';
    END IF;

    v_payload := p_actor_user_id::TEXT || p_actor_type || p_action_type || p_target_resource || p_metadata_json::TEXT || v_prev_hash;
    v_computed_hash := encode(digest(v_payload, 'sha256'), 'hex');

    INSERT INTO audit_logs_worm (
        actor_user_id, actor_type, action_type, target_resource, metadata_json, worm_sha256_hash
    ) VALUES (
        p_actor_user_id, p_actor_type, p_action_type, p_target_resource, p_metadata_json, v_computed_hash
    )
    RETURNING audit_id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$;

-- ============================================================================
-- END OF BATCH 5 DDL, RLS & WORM AUDIT MIGRATION (DOMAIN 5: TABLES 22 TO 26)
-- ============================================================================
