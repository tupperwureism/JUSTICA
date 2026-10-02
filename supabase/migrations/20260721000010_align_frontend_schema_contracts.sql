-- =============================================================================
-- DB-1: Frontend contract alignment and RLS hardening
-- PostgreSQL 15+ / Supabase
-- =============================================================================

-- 1. Persisted fields required by the current frontend contracts.
ALTER TABLE public.users_client
    ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS review_anonymized_default BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS email_summary_enabled BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.users_advocate
    ADD COLUMN IF NOT EXISTS nik_ktp VARCHAR(16),
    ADD COLUMN IF NOT EXISTS advocate_organization VARCHAR(16) NOT NULL DEFAULT 'PERADI',
    ADD COLUMN IF NOT EXISTS profile_slug VARCHAR(128),
    ADD COLUMN IF NOT EXISTS experience_years SMALLINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS has_probono_quota BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS avatar_initials VARCHAR(8),
    ADD COLUMN IF NOT EXISTS bio TEXT,
    ADD COLUMN IF NOT EXISTS payout_bank_name VARCHAR(32),
    ADD COLUMN IF NOT EXISTS payout_bank_account_no VARCHAR(64),
    ADD COLUMN IF NOT EXISTS payout_bank_account_holder VARCHAR(128),
    ADD COLUMN IF NOT EXISTS npwp_number VARCHAR(32),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX IF NOT EXISTS uq_users_advocate_nik_ktp
    ON public.users_advocate(nik_ktp) WHERE nik_ktp IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_advocate_profile_slug
    ON public.users_advocate(profile_slug) WHERE profile_slug IS NOT NULL;

ALTER TABLE public.users_advocate DROP CONSTRAINT IF EXISTS chk_users_advocate_organization;
ALTER TABLE public.users_advocate ADD CONSTRAINT chk_users_advocate_organization
    CHECK (advocate_organization IN ('PERADI', 'AAI', 'KAI', 'IKADIN'));
ALTER TABLE public.users_advocate DROP CONSTRAINT IF EXISTS chk_users_advocate_experience_years;
ALTER TABLE public.users_advocate ADD CONSTRAINT chk_users_advocate_experience_years
    CHECK (experience_years >= 0 AND review_count >= 0);

ALTER TABLE public.advocate_service_tiers
    ADD COLUMN IF NOT EXISTS service_code VARCHAR(64),
    ADD COLUMN IF NOT EXISTS duration_label VARCHAR(32),
    ADD COLUMN IF NOT EXISTS price_label VARCHAR(64),
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS features JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS recommended_for TEXT,
    ADD COLUMN IF NOT EXISTS badge_text VARCHAR(64),
    ADD COLUMN IF NOT EXISTS highlight_color VARCHAR(16) NOT NULL DEFAULT 'blue',
    ADD COLUMN IF NOT EXISTS is_escrow_required BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS uq_advocate_service_tiers_service_code
    ON public.advocate_service_tiers(service_code) WHERE service_code IS NOT NULL;
ALTER TABLE public.advocate_service_tiers DROP CONSTRAINT IF EXISTS chk_tier_highlight_color;
ALTER TABLE public.advocate_service_tiers ADD CONSTRAINT chk_tier_highlight_color
    CHECK (highlight_color IN ('blue', 'gold', 'red'));
ALTER TABLE public.advocate_service_tiers DROP CONSTRAINT IF EXISTS chk_tier_features_array;
ALTER TABLE public.advocate_service_tiers ADD CONSTRAINT chk_tier_features_array
    CHECK (jsonb_typeof(features) = 'array');

ALTER TABLE public.consultation_slots
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public.booking_sessions
    ADD COLUMN IF NOT EXISTS case_summary TEXT,
    ADD COLUMN IF NOT EXISTS meeting_method VARCHAR(16) NOT NULL DEFAULT 'ONLINE',
    ADD COLUMN IF NOT EXISTS booked_price_idr NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public.booking_sessions DROP CONSTRAINT IF EXISTS chk_booking_sessions_status;
ALTER TABLE public.booking_sessions ADD CONSTRAINT chk_booking_sessions_status CHECK (
    status IN ('PENDING_PAYMENT', 'SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED_AFK')
);
ALTER TABLE public.booking_sessions DROP CONSTRAINT IF EXISTS chk_booking_meeting_method;
ALTER TABLE public.booking_sessions ADD CONSTRAINT chk_booking_meeting_method
    CHECK (meeting_method IN ('ONLINE', 'OFFLINE'));
ALTER TABLE public.booking_sessions DROP CONSTRAINT IF EXISTS chk_booking_price;
ALTER TABLE public.booking_sessions ADD CONSTRAINT chk_booking_price
    CHECK (booked_price_idr >= 0);

ALTER TABLE public.escrow_transactions
    ADD COLUMN IF NOT EXISTS mutex_lock_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS worm_audit_hash VARCHAR(64),
    ADD COLUMN IF NOT EXISTS resolution_notes TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public.legal_opinions
    ADD COLUMN IF NOT EXISTS template_id VARCHAR(32),
    ADD COLUMN IF NOT EXISTS opponent_name VARCHAR(128),
    ADD COLUMN IF NOT EXISTS clauses_jsonb JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public.legal_opinions DROP CONSTRAINT IF EXISTS chk_legal_opinion_template;
ALTER TABLE public.legal_opinions ADD CONSTRAINT chk_legal_opinion_template CHECK (
    template_id IS NULL OR template_id IN ('SOMASI_TERBUKA', 'PERJANJIAN_DAMAI', 'GUGATAN_SEDERHANA')
);
ALTER TABLE public.legal_opinions DROP CONSTRAINT IF EXISTS chk_legal_opinion_clauses_array;
ALTER TABLE public.legal_opinions ADD CONSTRAINT chk_legal_opinion_clauses_array
    CHECK (jsonb_typeof(clauses_jsonb) = 'array');

ALTER TABLE public.case_irac_notes
    ADD COLUMN IF NOT EXISTS case_title VARCHAR(256),
    ADD COLUMN IF NOT EXISTS story_of_facts TEXT,
    ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS relevant_articles JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.case_irac_notes DROP CONSTRAINT IF EXISTS chk_irac_confidence_score;
ALTER TABLE public.case_irac_notes ADD CONSTRAINT chk_irac_confidence_score
    CHECK (confidence_score IS NULL OR confidence_score BETWEEN 0 AND 100);
ALTER TABLE public.case_irac_notes DROP CONSTRAINT IF EXISTS chk_irac_relevant_articles_array;
ALTER TABLE public.case_irac_notes ADD CONSTRAINT chk_irac_relevant_articles_array
    CHECK (jsonb_typeof(relevant_articles) = 'array');

ALTER TABLE public.dispute_cases
    ADD COLUMN IF NOT EXISTS reported_by_client_id UUID REFERENCES public.users_client(client_id) ON DELETE RESTRICT,
    ADD COLUMN IF NOT EXISTS evidence_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS escrow_frozen_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE public.dispute_cases DROP CONSTRAINT IF EXISTS chk_dispute_category;
ALTER TABLE public.dispute_cases ADD CONSTRAINT chk_dispute_category CHECK (
    dispute_category IN (
        'DELIVERABLE_LATE', 'QUALITY_ISSUE', 'ETHICS',
        'ADVOCATE_ABSENT_SLA', 'DELIVERABLE_QUALITY',
        'ETHICS_OFF_PLATFORM', 'CONFLICT_OF_INTEREST'
    )
);
ALTER TABLE public.dispute_cases DROP CONSTRAINT IF EXISTS chk_dispute_status;
ALTER TABLE public.dispute_cases ADD CONSTRAINT chk_dispute_status CHECK (
    status IN (
        'OPEN', 'INVESTIGATING', 'UNDER_MEDIATION', 'APPEALED',
        'RESOLVED_SPLIT', 'RESOLVED_REFUND', 'RESOLVED_RELEASE', 'CLOSED'
    )
);
ALTER TABLE public.dispute_cases DROP CONSTRAINT IF EXISTS chk_dispute_evidence_array;
ALTER TABLE public.dispute_cases ADD CONSTRAINT chk_dispute_evidence_array
    CHECK (jsonb_typeof(evidence_paths) = 'array');

-- 2. Security-invoker contract views map snake_case persistence to camelCase UI DTOs.
CREATE OR REPLACE VIEW public.frontend_advocate_catalog_v
WITH (security_invoker = true) AS
SELECT
    a.advocate_id::TEXT AS id,
    COALESCE(a.profile_slug, a.advocate_id::TEXT) AS slug,
    a.full_name AS name,
    a.sipp_license_no AS license,
    a.advocate_organization AS "licenseBody",
    a.average_rating::DOUBLE PRECISION AS rating,
    a.review_count AS "reviewCount",
    a.specialization_primary AS specialty,
    a.experience_years AS "experienceYears",
    a.is_online AS "isOnline",
    a.has_probono_quota AS "hasProBonoQuota",
    COALESCE(a.avatar_initials, '') AS "avatarInitials",
    COALESCE(a.bio, '') AS bio,
    COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', COALESCE(t.service_code, t.tier_id::TEXT),
                'label', t.tier_name,
                'duration', COALESCE(t.duration_label, t.duration_minutes::TEXT || ' Menit', 'Fleksibel'),
                'price', t.price_idr,
                'priceLabel', COALESCE(t.price_label, 'Rp ' || trim(to_char(t.price_idr, 'FM999G999G999'))),
                'description', COALESCE(t.description, '')
            ) ORDER BY t.tier_level
        ) FILTER (WHERE t.tier_id IS NOT NULL),
        '[]'::jsonb
    ) AS services
FROM public.users_advocate a
LEFT JOIN public.advocate_service_tiers t
    ON t.advocate_id = a.advocate_id AND t.is_active = true
WHERE a.kyc_status = 'VERIFIED'
GROUP BY a.advocate_id;

CREATE OR REPLACE VIEW public.frontend_consultation_slots_v
WITH (security_invoker = true) AS
SELECT
    s.slot_id::TEXT AS id,
    s.advocate_id::TEXT AS "advocateId",
    a.full_name AS "advocateName",
    a.peradi_card_no AS "advocateTitle",
    a.average_rating::DOUBLE PRECISION AS "advocateRating",
    a.specialization_primary AS specialty,
    to_char(s.start_time AT TIME ZONE 'Asia/Jakarta', 'DD Mon YYYY HH24:MI') || ' - ' ||
        to_char(s.end_time AT TIME ZONE 'Asia/Jakarta', 'HH24:MI') || ' WIB' AS "slotTimeLabel",
    (s.status = 'BOOKED') AS "isBooked"
FROM public.consultation_slots s
JOIN public.users_advocate a ON a.advocate_id = s.advocate_id;

CREATE OR REPLACE VIEW public.frontend_escrow_transactions_v
WITH (security_invoker = true) AS
SELECT
    e.escrow_id::TEXT AS id,
    b.slot_id::TEXT AS "slotId",
    COALESCE(t.service_code, t.tier_id::TEXT) AS "tierId",
    c.email AS "clientEmail",
    a.full_name AS "advocateName",
    e.total_amount_idr AS amount,
    CASE
        WHEN e.status = 'PENDING_PAYMENT' THEN 'PENDING'
        WHEN e.status IN ('HELD_IN_ESCROW', 'HOLDING_PERIOD_24H', 'FROZEN_DISPUTE') THEN 'HELD'
        WHEN e.status IN ('RELEASED_TO_ADVOCATE', 'RESOLVED_SPLIT_SETTLEMENT') THEN 'RELEASED'
        WHEN e.status = 'REFUNDED_TO_CLIENT' THEN 'REFUNDED'
    END AS status,
    e.created_at AS "createdAt",
    e.mutex_lock_id AS "mutexLockId",
    e.worm_audit_hash AS "wormAuditHash"
FROM public.escrow_transactions e
JOIN public.booking_sessions b ON b.booking_id = e.booking_id
JOIN public.consultation_slots s ON s.slot_id = b.slot_id
JOIN public.advocate_service_tiers t ON t.tier_id = s.tier_id
JOIN public.users_client c ON c.client_id = e.client_id
JOIN public.users_advocate a ON a.advocate_id = e.advocate_id;

CREATE OR REPLACE VIEW public.frontend_irac_analysis_v
WITH (security_invoker = true) AS
SELECT
    irac_id::TEXT AS id,
    COALESCE(case_title, '') AS "caseTitle",
    COALESCE(story_of_facts, '') AS "storyOfFacts",
    issue_text AS issue,
    rule_text AS rule,
    analysis_text AS application,
    conclusion_text AS conclusion,
    COALESCE(confidence_score, 0)::DOUBLE PRECISION AS "confidenceScore",
    created_at AS "generatedAt",
    relevant_articles AS "relevantArticles"
FROM public.case_irac_notes;

CREATE OR REPLACE VIEW public.frontend_legal_document_drafts_v
WITH (security_invoker = true) AS
SELECT
    lo.opinion_id::TEXT AS id,
    lo.template_id AS "templateId",
    lo.document_title AS title,
    c.full_name AS "clientName",
    a.full_name AS "advocateName",
    COALESCE(lo.opponent_name, '') AS "opponentName",
    lo.created_at AS "createdAt",
    lo.clauses_jsonb AS clauses
FROM public.legal_opinions lo
JOIN public.users_client c ON c.client_id = lo.client_id
JOIN public.users_advocate a ON a.advocate_id = lo.advocate_id;

GRANT SELECT ON public.frontend_advocate_catalog_v, public.frontend_consultation_slots_v TO anon, authenticated;
GRANT SELECT ON public.frontend_escrow_transactions_v, public.frontend_irac_analysis_v,
    public.frontend_legal_document_drafts_v TO authenticated;

-- 3. Reassert RLS on every persisted domain table.
ALTER TABLE public.users_client ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_advocate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users_admin ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_active_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sipp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advocate_service_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advocate_sanctions_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_handshakes_totp ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advocate_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_payout_ledgers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_pph21_withholdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_governance_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_opinions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emeterai_stamping_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_irac_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.probono_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispute_mediator_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs_worm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- 4. Replace over-broad participant policies and require verified advocate KYC.
DROP POLICY IF EXISTS rls_users_client_self_access ON public.users_client;
DROP POLICY IF EXISTS rls_users_client_self_read ON public.users_client;
DROP POLICY IF EXISTS rls_users_client_self_update ON public.users_client;
CREATE POLICY rls_users_client_self_read ON public.users_client
    FOR SELECT USING (client_id = auth.uid());
CREATE POLICY rls_users_client_self_update ON public.users_client
    FOR UPDATE USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS rls_users_advocate_self_update ON public.users_advocate;
CREATE POLICY rls_users_advocate_self_update ON public.users_advocate
    FOR UPDATE
    USING (advocate_id = auth.uid() AND kyc_status = 'VERIFIED')
    WITH CHECK (advocate_id = auth.uid() AND kyc_status = 'VERIFIED');

DROP POLICY IF EXISTS rls_booking_sessions_client_access ON public.booking_sessions;
DROP POLICY IF EXISTS rls_booking_sessions_client_read ON public.booking_sessions;
DROP POLICY IF EXISTS rls_booking_sessions_client_insert ON public.booking_sessions;
DROP POLICY IF EXISTS rls_booking_sessions_client_update ON public.booking_sessions;
CREATE POLICY rls_booking_sessions_client_read ON public.booking_sessions
    FOR SELECT USING (client_id = auth.uid());
CREATE POLICY rls_booking_sessions_client_insert ON public.booking_sessions
    FOR INSERT WITH CHECK (client_id = auth.uid());
CREATE POLICY rls_booking_sessions_client_update ON public.booking_sessions
    FOR UPDATE USING (client_id = auth.uid()) WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS rls_booking_sessions_advocate_access ON public.booking_sessions;
DROP POLICY IF EXISTS rls_booking_sessions_advocate_read ON public.booking_sessions;
DROP POLICY IF EXISTS rls_booking_sessions_advocate_update ON public.booking_sessions;
CREATE POLICY rls_booking_sessions_advocate_read ON public.booking_sessions
    FOR SELECT USING (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ));
CREATE POLICY rls_booking_sessions_advocate_update ON public.booking_sessions
    FOR UPDATE
    USING (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ))
    WITH CHECK (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ));

DROP POLICY IF EXISTS rls_consultation_slots_advocate_manage ON public.consultation_slots;
CREATE POLICY rls_consultation_slots_advocate_manage ON public.consultation_slots
    FOR ALL
    USING (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ))
    WITH CHECK (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ));

DROP POLICY IF EXISTS rls_advocate_service_tiers_advocate_manage ON public.advocate_service_tiers;
CREATE POLICY rls_advocate_service_tiers_advocate_manage ON public.advocate_service_tiers
    FOR ALL
    USING (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ))
    WITH CHECK (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ));

DROP POLICY IF EXISTS rls_escrow_transactions_advocate_read ON public.escrow_transactions;
CREATE POLICY rls_escrow_transactions_advocate_read ON public.escrow_transactions
    FOR SELECT USING (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ));

DROP POLICY IF EXISTS rls_legal_opinions_client_access ON public.legal_opinions;
DROP POLICY IF EXISTS rls_legal_opinions_client_read ON public.legal_opinions;
DROP POLICY IF EXISTS rls_legal_opinions_client_update ON public.legal_opinions;
CREATE POLICY rls_legal_opinions_client_read ON public.legal_opinions
    FOR SELECT USING (client_id = auth.uid());

DROP POLICY IF EXISTS rls_legal_opinions_advocate_access ON public.legal_opinions;
DROP POLICY IF EXISTS rls_legal_opinions_advocate_manage ON public.legal_opinions;
DROP POLICY IF EXISTS rls_legal_opinions_advocate_read ON public.legal_opinions;
DROP POLICY IF EXISTS rls_legal_opinions_advocate_insert ON public.legal_opinions;
DROP POLICY IF EXISTS rls_legal_opinions_advocate_update ON public.legal_opinions;
CREATE POLICY rls_legal_opinions_advocate_read ON public.legal_opinions
    FOR SELECT USING (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ));
CREATE POLICY rls_legal_opinions_advocate_insert ON public.legal_opinions
    FOR INSERT WITH CHECK (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ));
CREATE POLICY rls_legal_opinions_advocate_update ON public.legal_opinions
    FOR UPDATE
    USING (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ))
    WITH CHECK (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ));

DROP POLICY IF EXISTS rls_case_irac_advocate_read ON public.case_irac_notes;
DROP POLICY IF EXISTS rls_case_irac_advocate_insert ON public.case_irac_notes;
CREATE POLICY rls_case_irac_advocate_read ON public.case_irac_notes
    FOR SELECT USING (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ));
CREATE POLICY rls_case_irac_advocate_insert ON public.case_irac_notes
    FOR INSERT WITH CHECK (advocate_id = auth.uid() AND EXISTS (
        SELECT 1 FROM public.users_advocate ua
        WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
    ));

DROP POLICY IF EXISTS rls_dispute_cases_participant_read ON public.dispute_cases;
DROP POLICY IF EXISTS rls_dispute_cases_client_insert ON public.dispute_cases;
CREATE POLICY rls_dispute_cases_participant_read ON public.dispute_cases
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.booking_sessions bs
        WHERE bs.booking_id = dispute_cases.booking_id
          AND (
              bs.client_id = auth.uid() OR
              (bs.advocate_id = auth.uid() AND EXISTS (
                  SELECT 1 FROM public.users_advocate ua
                  WHERE ua.advocate_id = auth.uid() AND ua.kyc_status = 'VERIFIED'
              ))
          )
    ));
CREATE POLICY rls_dispute_cases_client_insert ON public.dispute_cases
    FOR INSERT WITH CHECK (
        reported_by_client_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.booking_sessions bs
            WHERE bs.booking_id = dispute_cases.booking_id AND bs.client_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS rls_document_revisions_participant_access ON public.document_revisions;
DROP POLICY IF EXISTS rls_document_revisions_participant_read ON public.document_revisions;
DROP POLICY IF EXISTS rls_document_revisions_client_insert ON public.document_revisions;
CREATE POLICY rls_document_revisions_participant_read ON public.document_revisions
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.legal_opinions lo
        WHERE lo.opinion_id = document_revisions.opinion_id
          AND (lo.client_id = auth.uid() OR lo.advocate_id = auth.uid())
    ));
CREATE POLICY rls_document_revisions_client_insert ON public.document_revisions
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.legal_opinions lo
        WHERE lo.opinion_id = document_revisions.opinion_id AND lo.client_id = auth.uid()
    ));

DROP POLICY IF EXISTS rls_offline_handshakes_participant_access ON public.offline_handshakes_totp;
DROP POLICY IF EXISTS rls_offline_handshakes_participant_read ON public.offline_handshakes_totp;
DROP POLICY IF EXISTS rls_offline_handshakes_participant_insert ON public.offline_handshakes_totp;
CREATE POLICY rls_offline_handshakes_participant_read ON public.offline_handshakes_totp
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.booking_sessions bs
        WHERE bs.booking_id = offline_handshakes_totp.booking_id
          AND (bs.client_id = auth.uid() OR bs.advocate_id = auth.uid())
    ));
CREATE POLICY rls_offline_handshakes_participant_insert ON public.offline_handshakes_totp
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.booking_sessions bs
        WHERE bs.booking_id = offline_handshakes_totp.booking_id
          AND (bs.client_id = auth.uid() OR bs.advocate_id = auth.uid())
    ));

DROP POLICY IF EXISTS rls_chat_sessions_metadata_participants ON public.chat_sessions_metadata;
DROP POLICY IF EXISTS rls_chat_sessions_metadata_participant_read ON public.chat_sessions_metadata;
DROP POLICY IF EXISTS rls_chat_sessions_metadata_participant_insert ON public.chat_sessions_metadata;
CREATE POLICY rls_chat_sessions_metadata_participant_read ON public.chat_sessions_metadata
    FOR SELECT USING (EXISTS (
        SELECT 1 FROM public.booking_sessions bs
        WHERE bs.booking_id = chat_sessions_metadata.booking_id
          AND (bs.client_id = auth.uid() OR bs.advocate_id = auth.uid())
    ));
CREATE POLICY rls_chat_sessions_metadata_participant_insert ON public.chat_sessions_metadata
    FOR INSERT WITH CHECK (EXISTS (
        SELECT 1 FROM public.booking_sessions bs
        WHERE bs.booking_id = chat_sessions_metadata.booking_id
          AND (bs.client_id = auth.uid() OR bs.advocate_id = auth.uid())
    ));

DROP POLICY IF EXISTS rls_advocate_reviews_public_read ON public.advocate_reviews;
DROP POLICY IF EXISTS rls_advocate_reviews_participant_read ON public.advocate_reviews;
CREATE POLICY rls_advocate_reviews_participant_read ON public.advocate_reviews
    FOR SELECT USING (client_id = auth.uid() OR advocate_id = auth.uid());
DROP POLICY IF EXISTS rls_advocate_reviews_client_submit ON public.advocate_reviews;
CREATE POLICY rls_advocate_reviews_client_submit ON public.advocate_reviews
    FOR INSERT WITH CHECK (
        client_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.booking_sessions bs
            WHERE bs.booking_id = advocate_reviews.booking_id
              AND bs.client_id = auth.uid()
              AND bs.advocate_id = advocate_reviews.advocate_id
              AND bs.status = 'COMPLETED'
        )
    );

DROP POLICY IF EXISTS rls_probono_cases_client_insert ON public.probono_cases;
CREATE POLICY rls_probono_cases_client_insert ON public.probono_cases
    FOR INSERT WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS rls_user_notifications_self_read ON public.user_notifications;
DROP POLICY IF EXISTS rls_user_notifications_self_select ON public.user_notifications;
DROP POLICY IF EXISTS rls_user_notifications_self_update ON public.user_notifications;
CREATE POLICY rls_user_notifications_self_select ON public.user_notifications
    FOR SELECT USING (recipient_user_id = auth.uid());
CREATE POLICY rls_user_notifications_self_update ON public.user_notifications
    FOR UPDATE USING (recipient_user_id = auth.uid())
    WITH CHECK (recipient_user_id = auth.uid());

-- 5. Admin/compliance access is granted only through trusted JWT app_metadata.
DROP POLICY IF EXISTS rls_users_admin_internal_access ON public.users_admin;
DROP POLICY IF EXISTS rls_users_admin_self_read ON public.users_admin;
DROP POLICY IF EXISTS rls_users_admin_self_update ON public.users_admin;
CREATE POLICY rls_users_admin_self_read ON public.users_admin
    FOR SELECT USING (admin_id = auth.uid());
CREATE POLICY rls_users_admin_self_update ON public.users_admin
    FOR UPDATE USING (admin_id = auth.uid()) WITH CHECK (admin_id = auth.uid());

DROP POLICY IF EXISTS rls_users_advocate_compliance_read ON public.users_advocate;
DROP POLICY IF EXISTS rls_users_advocate_compliance_update ON public.users_advocate;
CREATE POLICY rls_users_advocate_compliance_read ON public.users_advocate
    FOR SELECT USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );
CREATE POLICY rls_users_advocate_compliance_update ON public.users_advocate
    FOR UPDATE USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    ) WITH CHECK (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );

DROP POLICY IF EXISTS rls_sipp_verifications_compliance_manage ON public.sipp_verifications;
DROP POLICY IF EXISTS rls_sipp_verifications_compliance_read ON public.sipp_verifications;
DROP POLICY IF EXISTS rls_sipp_verifications_compliance_insert ON public.sipp_verifications;
DROP POLICY IF EXISTS rls_sipp_verifications_compliance_update ON public.sipp_verifications;
CREATE POLICY rls_sipp_verifications_compliance_read ON public.sipp_verifications
    FOR SELECT USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );
CREATE POLICY rls_sipp_verifications_compliance_insert ON public.sipp_verifications
    FOR INSERT WITH CHECK (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );
CREATE POLICY rls_sipp_verifications_compliance_update ON public.sipp_verifications
    FOR UPDATE USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    ) WITH CHECK (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );

DROP POLICY IF EXISTS rls_advocate_sanctions_compliance_manage ON public.advocate_sanctions_log;
DROP POLICY IF EXISTS rls_advocate_sanctions_compliance_read ON public.advocate_sanctions_log;
DROP POLICY IF EXISTS rls_advocate_sanctions_compliance_insert ON public.advocate_sanctions_log;
CREATE POLICY rls_advocate_sanctions_compliance_read ON public.advocate_sanctions_log
    FOR SELECT USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );
CREATE POLICY rls_advocate_sanctions_compliance_insert ON public.advocate_sanctions_log
    FOR INSERT WITH CHECK (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );

DROP POLICY IF EXISTS rls_probono_cases_compliance_manage ON public.probono_cases;
DROP POLICY IF EXISTS rls_probono_cases_compliance_read ON public.probono_cases;
DROP POLICY IF EXISTS rls_probono_cases_compliance_update ON public.probono_cases;
CREATE POLICY rls_probono_cases_compliance_read ON public.probono_cases
    FOR SELECT USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );
CREATE POLICY rls_probono_cases_compliance_update ON public.probono_cases
    FOR UPDATE USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    ) WITH CHECK (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );

DROP POLICY IF EXISTS rls_dispute_cases_mediator_manage ON public.dispute_cases;
DROP POLICY IF EXISTS rls_dispute_cases_mediator_read ON public.dispute_cases;
DROP POLICY IF EXISTS rls_dispute_cases_mediator_update ON public.dispute_cases;
CREATE POLICY rls_dispute_cases_mediator_read ON public.dispute_cases
    FOR SELECT USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('DISPUTE_MEDIATOR', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );
CREATE POLICY rls_dispute_cases_mediator_update ON public.dispute_cases
    FOR UPDATE USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('DISPUTE_MEDIATOR', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    ) WITH CHECK (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('DISPUTE_MEDIATOR', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );

DROP POLICY IF EXISTS rls_dispute_signatures_mediator_manage ON public.dispute_mediator_signatures;
DROP POLICY IF EXISTS rls_dispute_signatures_mediator_read ON public.dispute_mediator_signatures;
DROP POLICY IF EXISTS rls_dispute_signatures_mediator_insert ON public.dispute_mediator_signatures;
CREATE POLICY rls_dispute_signatures_mediator_read ON public.dispute_mediator_signatures
    FOR SELECT USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('DISPUTE_MEDIATOR', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );
CREATE POLICY rls_dispute_signatures_mediator_insert ON public.dispute_mediator_signatures
    FOR INSERT WITH CHECK (
        mediator_admin_id = auth.uid() AND
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('DISPUTE_MEDIATOR', 'SUPER_ADMIN')
    );

DROP POLICY IF EXISTS rls_booking_sessions_mediator_read ON public.booking_sessions;
CREATE POLICY rls_booking_sessions_mediator_read ON public.booking_sessions
    FOR SELECT USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('DISPUTE_MEDIATOR', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );

DROP POLICY IF EXISTS rls_legal_opinions_mediator_read ON public.legal_opinions;
CREATE POLICY rls_legal_opinions_mediator_read ON public.legal_opinions
    FOR SELECT USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('DISPUTE_MEDIATOR', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );

DROP POLICY IF EXISTS rls_escrow_transactions_mediator_read ON public.escrow_transactions;
CREATE POLICY rls_escrow_transactions_mediator_read ON public.escrow_transactions
    FOR SELECT USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('DISPUTE_MEDIATOR', 'COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );

DROP POLICY IF EXISTS rls_audit_logs_compliance_read ON public.audit_logs_worm;
CREATE POLICY rls_audit_logs_compliance_read ON public.audit_logs_worm
    FOR SELECT USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );

DROP POLICY IF EXISTS rls_governance_configs_admin_manage ON public.platform_governance_configs;
DROP POLICY IF EXISTS rls_governance_configs_admin_insert ON public.platform_governance_configs;
DROP POLICY IF EXISTS rls_governance_configs_admin_update ON public.platform_governance_configs;
CREATE POLICY rls_governance_configs_admin_insert ON public.platform_governance_configs
    FOR INSERT WITH CHECK (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );
CREATE POLICY rls_governance_configs_admin_update ON public.platform_governance_configs
    FOR UPDATE USING (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    ) WITH CHECK (
        COALESCE(auth.jwt() -> 'app_metadata' ->> 'role_group', auth.jwt() -> 'app_metadata' ->> 'role')
            IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    );

-- Public USING(true) remains only on intentionally public transparency surfaces:
-- platform_governance_configs and emeterai_stamping_logs.
