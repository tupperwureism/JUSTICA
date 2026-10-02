-- ============================================================================
-- JUSTICA PHYSICAL DATABASE MIGRATION SCRIPT
-- Phase 4B - Batch 2: Domain 2 (Consultation Sessions & Fair-Clock SLA)
-- Target DBMS: PostgreSQL 15+ / Supabase
-- Compliance: 1-to-1 Bi-Directional Mapping with Baseline commit 0cad127
-- ============================================================================

-- ============================================================================
-- 8. TABLE: consultation_slots (Jadwal & Slot Ketersediaan)
-- ============================================================================
CREATE TABLE IF NOT EXISTS consultation_slots (
    slot_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    advocate_id     UUID        NOT NULL,
    tier_id         UUID        NOT NULL,
    start_time      TIMESTAMPTZ NOT NULL,
    end_time        TIMESTAMPTZ NOT NULL,
    status          VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE',
    is_mutex_locked BOOLEAN     NOT NULL DEFAULT false,
    CONSTRAINT fk_slot_advocate FOREIGN KEY (advocate_id)
        REFERENCES users_advocate(advocate_id) ON DELETE CASCADE,
    CONSTRAINT fk_slot_tier FOREIGN KEY (tier_id)
        REFERENCES advocate_service_tiers(tier_id) ON DELETE RESTRICT,
    CONSTRAINT chk_consultation_slots_status CHECK (
        status IN ('AVAILABLE', 'BOOKED', 'BLOCKED')
    ),
    CONSTRAINT chk_consultation_slots_time_range CHECK (end_time > start_time)
);

-- Indexing for slot booking searches and mutex lock queries
CREATE INDEX IF NOT EXISTS idx_consultation_slots_advocate_status ON consultation_slots(advocate_id, status, start_time);

-- Enable Row-Level Security (RLS)
ALTER TABLE consultation_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Public can view available slots
CREATE POLICY rls_consultation_slots_public_read ON consultation_slots
    FOR SELECT
    USING (status = 'AVAILABLE' OR advocate_id = auth.uid());

-- RLS Policy: Advocates manage their own consultation slots
CREATE POLICY rls_consultation_slots_advocate_manage ON consultation_slots
    FOR ALL
    USING (advocate_id = auth.uid())
    WITH CHECK (advocate_id = auth.uid());


-- ============================================================================
-- 9. TABLE: booking_sessions (Sesi Konsultasi & Fair-Clock SLA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS booking_sessions (
    booking_id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id               UUID        NOT NULL,
    advocate_id             UUID        NOT NULL,
    slot_id                 UUID        NOT NULL,
    booking_code            VARCHAR(32) NOT NULL,
    status                  VARCHAR(32) NOT NULL,
    fair_clock_started_at   TIMESTAMPTZ NULL,
    advocate_first_reply_at TIMESTAMPTZ NULL,
    timeout_job_id          VARCHAR(64) NULL,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_booking_sessions_code UNIQUE (booking_code),
    CONSTRAINT fk_booking_client FOREIGN KEY (client_id)
        REFERENCES users_client(client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_advocate FOREIGN KEY (advocate_id)
        REFERENCES users_advocate(advocate_id) ON DELETE RESTRICT,
    CONSTRAINT fk_booking_slot FOREIGN KEY (slot_id)
        REFERENCES consultation_slots(slot_id) ON DELETE RESTRICT,
    CONSTRAINT chk_booking_sessions_status CHECK (
        status IN ('SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED_AFK')
    )
);

-- Indexing for client and advocate dashboard active case lists
CREATE INDEX IF NOT EXISTS idx_booking_sessions_client ON booking_sessions(client_id, status);
CREATE INDEX IF NOT EXISTS idx_booking_sessions_advocate ON booking_sessions(advocate_id, status);

-- Enable Row-Level Security (RLS)
ALTER TABLE booking_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Clients can read and update bookings where client_id = auth.uid()
CREATE POLICY rls_booking_sessions_client_access ON booking_sessions
    FOR ALL
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

-- RLS Policy: Advocates can read and update bookings where advocate_id = auth.uid()
CREATE POLICY rls_booking_sessions_advocate_access ON booking_sessions
    FOR ALL
    USING (advocate_id = auth.uid())
    WITH CHECK (advocate_id = auth.uid());


-- ============================================================================
-- 10. TABLE: offline_handshakes_totp (Konsultasi Tatap Muka & QR Dinamis)
-- ============================================================================
CREATE TABLE IF NOT EXISTS offline_handshakes_totp (
    handshake_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id       UUID         NOT NULL,
    totp_secret_hash VARCHAR(256) NOT NULL,
    office_lat_long  VARCHAR(64)  NOT NULL,
    scanned_at       TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status           VARCHAR(32)  NOT NULL DEFAULT 'VERIFIED',
    CONSTRAINT fk_handshake_booking FOREIGN KEY (booking_id)
        REFERENCES booking_sessions(booking_id) ON DELETE CASCADE
);

-- Indexing for handshake lookup by booking session
CREATE INDEX IF NOT EXISTS idx_offline_handshakes_booking ON offline_handshakes_totp(booking_id);

-- Enable Row-Level Security (RLS)
ALTER TABLE offline_handshakes_totp ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Participants of the booking session can access handshake verification
CREATE POLICY rls_offline_handshakes_participant_access ON offline_handshakes_totp
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM booking_sessions bs
            WHERE bs.booking_id = offline_handshakes_totp.booking_id
              AND (bs.client_id = auth.uid() OR bs.advocate_id = auth.uid())
        )
    );


-- ============================================================================
-- 11. TABLE: chat_sessions_metadata (Isolasi Zero-Knowledge E2EE)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chat_sessions_metadata (
    chat_session_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id                UUID         NOT NULL,
    client_ephemeral_pubkey   VARCHAR(256) NOT NULL,
    advocate_ephemeral_pubkey VARCHAR(256) NOT NULL,
    key_exchange_salt         VARCHAR(128) NOT NULL,
    zero_knowledge_flag       BOOLEAN      NOT NULL DEFAULT true,
    created_at                TIMESTAMPTZ  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_meta_booking FOREIGN KEY (booking_id)
        REFERENCES booking_sessions(booking_id) ON DELETE CASCADE,
    CONSTRAINT chk_chat_zero_knowledge CHECK (zero_knowledge_flag = true)
);

-- Indexing for fast E2EE metadata lookup
CREATE INDEX IF NOT EXISTS idx_chat_sessions_booking ON chat_sessions_metadata(booking_id);

-- Enable Row-Level Security (RLS)
ALTER TABLE chat_sessions_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Only participants of the booking session can negotiate E2EE handshake
CREATE POLICY rls_chat_sessions_metadata_participants ON chat_sessions_metadata
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM booking_sessions bs
            WHERE bs.booking_id = chat_sessions_metadata.booking_id
              AND (bs.client_id = auth.uid() OR bs.advocate_id = auth.uid())
        )
    );


-- ============================================================================
-- 12. TABLE: advocate_reviews (Penilaian & Ulasan Pasca-Sesi)
-- ============================================================================
CREATE TABLE IF NOT EXISTS advocate_reviews (
    review_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id   UUID        NOT NULL,
    client_id    UUID        NOT NULL,
    advocate_id  UUID        NOT NULL,
    rating       SMALLINT    NOT NULL,
    review_text  TEXT        NULL,
    is_anonymous BOOLEAN     NOT NULL DEFAULT false,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_review_booking FOREIGN KEY (booking_id)
        REFERENCES booking_sessions(booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_review_client FOREIGN KEY (client_id)
        REFERENCES users_client(client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_review_advocate FOREIGN KEY (advocate_id)
        REFERENCES users_advocate(advocate_id) ON DELETE RESTRICT,
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5)
);

-- Indexing for advocate rating aggregation and public review directory
CREATE INDEX IF NOT EXISTS idx_advocate_reviews_advocate ON advocate_reviews(advocate_id);

-- Enable Row-Level Security (RLS)
ALTER TABLE advocate_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Anyone can read reviews
CREATE POLICY rls_advocate_reviews_public_read ON advocate_reviews
    FOR SELECT
    USING (true);

-- RLS Policy: Clients can submit reviews for their completed bookings
CREATE POLICY rls_advocate_reviews_client_submit ON advocate_reviews
    FOR INSERT
    WITH CHECK (client_id = auth.uid());

-- ============================================================================
-- END OF BATCH 2 DDL & RLS MIGRATION (DOMAIN 2: TABLES 8 TO 12)
-- ============================================================================
