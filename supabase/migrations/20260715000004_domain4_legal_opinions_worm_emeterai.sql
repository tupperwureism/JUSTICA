-- ============================================================================
-- JUSTICA PHYSICAL DATABASE MIGRATION SCRIPT
-- Phase 4B - Batch 4: Domain 4 (Legal Opinions, IRAC Notes & e-Meterai)
-- Target DBMS: PostgreSQL 15+ / Supabase
-- Compliance: 1-to-1 Bi-Directional Mapping with Baseline commit 0cad127
-- Includes: WORM Append-Only Immutability Triggers & SHA-256 Verification
-- ============================================================================

-- ============================================================================
-- WORM APPEND-ONLY IMMUTABILITY FUNCTION
-- Function: fn_prevent_worm_mutation()
-- Rejects any UPDATE or DELETE on cryptographically sealed tables
-- ============================================================================
CREATE OR REPLACE FUNCTION fn_prevent_worm_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'WORM Vault Violation: UPDATE or DELETE operations are strictly prohibited on append-only table %.', TG_TABLE_NAME;
END;
$$;


-- ============================================================================
-- 18. TABLE: legal_opinions (Opini Hukum & Kuota 2x Revisi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS legal_opinions (
    opinion_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id       UUID         NOT NULL,
    advocate_id      UUID         NOT NULL,
    client_id        UUID         NOT NULL,
    document_title   VARCHAR(256) NOT NULL,
    revision_counter SMALLINT     NOT NULL DEFAULT 0,
    status           VARCHAR(32)  NOT NULL,
    pdf_storage_path VARCHAR(256) NOT NULL,
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_opinion_booking FOREIGN KEY (booking_id)
        REFERENCES booking_sessions(booking_id) ON DELETE RESTRICT,
    CONSTRAINT fk_opinion_advocate FOREIGN KEY (advocate_id)
        REFERENCES users_advocate(advocate_id) ON DELETE RESTRICT,
    CONSTRAINT fk_opinion_client FOREIGN KEY (client_id)
        REFERENCES users_client(client_id) ON DELETE RESTRICT,
    CONSTRAINT chk_opinion_revision_counter CHECK (
        revision_counter >= 0 AND revision_counter <= 2
    ),
    CONSTRAINT chk_opinion_status CHECK (
        status IN (
            'DRAFT',
            'CLIENT_REVIEW',
            'REVISION_REQUESTED',
            'FINAL_APPROVED',
            'STAMPED_SIGNED'
        )
    )
);

-- Indexing for client and advocate deliverable dashboard
CREATE INDEX IF NOT EXISTS idx_legal_opinions_client ON legal_opinions(client_id, status);
CREATE INDEX IF NOT EXISTS idx_legal_opinions_advocate ON legal_opinions(advocate_id, status);

-- Enable Row-Level Security (RLS)
ALTER TABLE legal_opinions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can view and approve their own legal opinions
CREATE POLICY rls_legal_opinions_client_access ON legal_opinions
    FOR ALL
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

-- RLS Policy: Advocates can draft and update opinions for their own clients
CREATE POLICY rls_legal_opinions_advocate_access ON legal_opinions
    FOR ALL
    USING (advocate_id = auth.uid())
    WITH CHECK (advocate_id = auth.uid());


-- ============================================================================
-- 19. TABLE: document_revisions (Jejak Riwayat Putaran Revisi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_revisions (
    revision_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opinion_id           UUID     NOT NULL,
    revision_round       SMALLINT NOT NULL,
    client_feedback_text TEXT     NOT NULL,
    submitted_at         TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_revision_opinion FOREIGN KEY (opinion_id)
        REFERENCES legal_opinions(opinion_id) ON DELETE CASCADE,
    CONSTRAINT chk_revision_round CHECK (revision_round IN (1, 2))
);

-- Indexing for revision history lookups
CREATE INDEX IF NOT EXISTS idx_document_revisions_opinion ON document_revisions(opinion_id, revision_round);

-- Enable Row-Level Security (RLS)
ALTER TABLE document_revisions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Participants of the opinion can view revision history
CREATE POLICY rls_document_revisions_participant_access ON document_revisions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM legal_opinions lo
            WHERE lo.opinion_id = document_revisions.opinion_id
              AND (lo.client_id = auth.uid() OR lo.advocate_id = auth.uid())
        )
    );


-- ============================================================================
-- 20. TABLE: emeterai_stamping_logs (Penandatanganan e-Meterai Peruri SHA-256)
-- ============================================================================
CREATE TABLE IF NOT EXISTS emeterai_stamping_logs (
    stamping_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opinion_id           UUID        NOT NULL,
    peruri_serial_number VARCHAR(64) NOT NULL,
    sha256_document_hash VARCHAR(64) NOT NULL,
    stamped_at           TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status               VARCHAR(32) NOT NULL DEFAULT 'SUCCESS',
    CONSTRAINT uq_emeterai_serial UNIQUE (peruri_serial_number),
    CONSTRAINT fk_emeterai_opinion FOREIGN KEY (opinion_id)
        REFERENCES legal_opinions(opinion_id) ON DELETE RESTRICT
);

-- Indexing for Public Verification Portal (MOCK-J-PUBLIC-VERIFY) by SHA-256 hash
CREATE INDEX IF NOT EXISTS idx_emeterai_sha256_hash ON emeterai_stamping_logs(sha256_document_hash);

-- Enable Row-Level Security (RLS)
ALTER TABLE emeterai_stamping_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public read access for SHA-256 document authenticity verification
CREATE POLICY rls_emeterai_public_verify ON emeterai_stamping_logs
    FOR SELECT
    USING (true);

-- WORM Trigger: Prevent UPDATE or DELETE on e-Meterai stamping logs
CREATE TRIGGER trg_worm_emeterai_stamping_logs
    BEFORE UPDATE OR DELETE ON emeterai_stamping_logs
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_worm_mutation();


-- ============================================================================
-- 21. TABLE: case_irac_notes (Catatan Analisis IRAC 4-Tab Advokat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS case_irac_notes (
    irac_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id       UUID        NOT NULL,
    advocate_id      UUID        NOT NULL,
    issue_text       TEXT        NOT NULL,
    rule_text        TEXT        NOT NULL,
    analysis_text    TEXT        NOT NULL,
    conclusion_text  TEXT        NOT NULL,
    worm_hash_sha256 VARCHAR(64) NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_case_irac_booking_advocate UNIQUE (booking_id, advocate_id),
    CONSTRAINT fk_irac_booking FOREIGN KEY (booking_id)
        REFERENCES booking_sessions(booking_id) ON DELETE RESTRICT,
    CONSTRAINT fk_irac_advocate FOREIGN KEY (advocate_id)
        REFERENCES users_advocate(advocate_id) ON DELETE RESTRICT
);

-- Indexing for advocate case notes and 10-year WORM compliance retention
CREATE INDEX IF NOT EXISTS idx_case_irac_advocate ON case_irac_notes(advocate_id, created_at);

-- Enable Row-Level Security (RLS)
ALTER TABLE case_irac_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Advocates can read their own IRAC case notes (MOCK-J-AD-04)
CREATE POLICY rls_case_irac_advocate_read ON case_irac_notes
    FOR SELECT
    USING (advocate_id = auth.uid());

-- WORM Trigger: Prevent UPDATE or DELETE on IRAC case notes (10-Year WORM retention)
CREATE TRIGGER trg_worm_case_irac_notes
    BEFORE UPDATE OR DELETE ON case_irac_notes
    FOR EACH ROW
    EXECUTE FUNCTION fn_prevent_worm_mutation();

-- ============================================================================
-- END OF BATCH 4 DDL, RLS & WORM MIGRATION (DOMAIN 4: TABLES 18 TO 21)
-- ============================================================================
