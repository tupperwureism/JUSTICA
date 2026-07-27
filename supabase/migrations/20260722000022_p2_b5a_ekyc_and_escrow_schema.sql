-- P2-B5A: schema-only refinements for the seven-day e-KYC compliance window,
-- global halt metadata, corporate escrow scope, and append-only compliance events.
-- Workflow RPCs, provider callbacks, schedulers, and Edge Functions are deferred.

CREATE TYPE public.signing_envelope_global_status AS ENUM (
    'ACTIVE',
    'HALTED',
    'REFUND_PENDING',
    'REFUNDED',
    'COMPLETED'
);

CREATE TYPE public.signing_envelope_halt_reason AS ENUM (
    'PARTY_ILLEGAL',
    'LIVENESS_FAILED_3X',
    'TTL_EXPIRED'
);

-- A party key is paired with its envelope so an e-KYC row cannot point to a
-- party belonging to a different signing envelope.
ALTER TABLE public.signing_envelope_parties
    ADD CONSTRAINT uq_signing_party_envelope_pair
        UNIQUE (envelope_id, party_id);

ALTER TABLE public.ekyc_verification_logs
    ADD COLUMN envelope_id UUID,
    ADD COLUMN party_id UUID,
    ADD COLUMN liveness_attempt_count SMALLINT NOT NULL DEFAULT 0,
    ADD CONSTRAINT fk_ekyc_signing_party
        FOREIGN KEY (envelope_id, party_id)
        REFERENCES public.signing_envelope_parties(envelope_id, party_id)
        ON DELETE RESTRICT,
    ADD CONSTRAINT chk_ekyc_party_scope CHECK (
        (envelope_id IS NULL AND party_id IS NULL)
        OR (envelope_id IS NOT NULL AND party_id IS NOT NULL)
    ),
    ADD CONSTRAINT chk_ekyc_liveness_attempt_range CHECK (
        (verification_type = 'LIVENESS_OCR' AND liveness_attempt_count BETWEEN 0 AND 3)
        OR (verification_type <> 'LIVENESS_OCR' AND liveness_attempt_count = 0)
    );

COMMENT ON COLUMN public.ekyc_verification_logs.envelope_id IS
    'Signing envelope aggregate for this metadata-only verification attempt.';
COMMENT ON COLUMN public.ekyc_verification_logs.party_id IS
    'Envelope party verified by this attempt; raw biometric evidence remains prohibited.';
COMMENT ON COLUMN public.ekyc_verification_logs.liveness_attempt_count IS
    'Liveness attempt counter capped at exactly three; zero before the first attempt and for non-liveness checks.';

CREATE INDEX idx_ekyc_envelope_party_attempt
    ON public.ekyc_verification_logs(
        envelope_id,
        party_id,
        verification_type,
        liveness_attempt_count DESC
    )
    WHERE envelope_id IS NOT NULL AND party_id IS NOT NULL;
CREATE UNIQUE INDEX uq_ekyc_liveness_attempt_ordinal
    ON public.ekyc_verification_logs(
        envelope_id,
        party_id,
        liveness_attempt_count
    )
    WHERE verification_type = 'LIVENESS_OCR'
      AND envelope_id IS NOT NULL
      AND party_id IS NOT NULL
      AND liveness_attempt_count > 0;

-- Existing rows remain valid with a null compliance window. Every newly linked
-- escrow window must be exactly seven 24-hour periods.
ALTER TABLE public.signing_envelopes
    ADD COLUMN escrow_id UUID,
    ADD COLUMN escrow_locked_at TIMESTAMPTZ,
    ADD COLUMN expires_at TIMESTAMPTZ,
    ADD COLUMN global_status public.signing_envelope_global_status,
    ADD COLUMN halt_reason public.signing_envelope_halt_reason,
    ADD COLUMN halted_at TIMESTAMPTZ,
    ADD COLUMN refunded_at TIMESTAMPTZ,
    ADD COLUMN is_legacy_halt_unclassified BOOLEAN NOT NULL DEFAULT false,
    ADD CONSTRAINT fk_signing_envelope_escrow
        FOREIGN KEY (escrow_id)
        REFERENCES public.escrow_transactions(escrow_id)
        ON DELETE RESTRICT,
    ADD CONSTRAINT chk_signing_escrow_window CHECK (
        (escrow_id IS NULL AND escrow_locked_at IS NULL AND expires_at IS NULL)
        OR (
            escrow_id IS NOT NULL
            AND escrow_locked_at IS NOT NULL
            AND expires_at = escrow_locked_at + INTERVAL '7 days'
        )
    );

-- The previous schema already allowed terminal envelopes. Backfill the new
-- aggregate status before making it mandatory. Historic VOIDED rows cannot be
-- assigned a compliance reason honestly, so they retain an explicit legacy
-- classification until a later reviewed reconciliation.
ALTER TABLE public.signing_envelopes
    DISABLE TRIGGER trg_guard_signing_envelope_mutation;

UPDATE public.signing_envelopes
SET global_status = CASE status
        WHEN 'COMPLETED' THEN 'COMPLETED'::public.signing_envelope_global_status
        WHEN 'VOIDED' THEN 'HALTED'::public.signing_envelope_global_status
        WHEN 'EXPIRED' THEN 'HALTED'::public.signing_envelope_global_status
        ELSE 'ACTIVE'::public.signing_envelope_global_status
    END,
    halt_reason = CASE status
        WHEN 'EXPIRED' THEN 'TTL_EXPIRED'::public.signing_envelope_halt_reason
        ELSE NULL
    END,
    halted_at = CASE
        WHEN status IN ('VOIDED', 'EXPIRED') THEN updated_at
        ELSE NULL
    END,
    is_legacy_halt_unclassified = (status = 'VOIDED');

ALTER TABLE public.signing_envelopes
    ENABLE ALWAYS TRIGGER trg_guard_signing_envelope_mutation;

ALTER TABLE public.signing_envelopes
    ALTER COLUMN global_status SET DEFAULT 'ACTIVE',
    ALTER COLUMN global_status SET NOT NULL,
    ADD CONSTRAINT chk_signing_global_halt_state CHECK (
        (global_status IN ('ACTIVE', 'COMPLETED')
            AND halt_reason IS NULL
            AND halted_at IS NULL
            AND NOT is_legacy_halt_unclassified)
        OR (global_status IN ('HALTED', 'REFUND_PENDING', 'REFUNDED')
            AND halted_at IS NOT NULL
            AND (
                (halt_reason IS NOT NULL AND NOT is_legacy_halt_unclassified)
                OR (halt_reason IS NULL AND is_legacy_halt_unclassified)
            ))
    ),
    ADD CONSTRAINT chk_signing_global_refund_state CHECK (
        (global_status = 'REFUNDED' AND refunded_at IS NOT NULL)
        OR (global_status <> 'REFUNDED' AND refunded_at IS NULL)
    ),
    ADD CONSTRAINT chk_signing_global_status_consistency CHECK (
        (global_status = 'ACTIVE'
            AND status IN ('DRAFT', 'SENT', 'PARTIALLY_SIGNED'))
        OR (global_status = 'COMPLETED' AND status = 'COMPLETED')
        OR (global_status IN ('HALTED', 'REFUND_PENDING', 'REFUNDED')
            AND (
                (halt_reason = 'TTL_EXPIRED' AND status = 'EXPIRED')
                OR (halt_reason IN ('PARTY_ILLEGAL', 'LIVENESS_FAILED_3X')
                    AND status = 'VOIDED')
                OR (is_legacy_halt_unclassified
                    AND halt_reason IS NULL
                    AND status = 'VOIDED')
            ))
    );

COMMENT ON COLUMN public.signing_envelopes.escrow_locked_at IS
    'Authoritative start of the e-KYC response window after escrow reaches HELD_IN_ESCROW.';
COMMENT ON COLUMN public.signing_envelopes.expires_at IS
    'Exact compliance deadline: escrow_locked_at plus seven 24-hour periods.';
COMMENT ON COLUMN public.signing_envelopes.global_status IS
    'Aggregate-wide status shared by every party; HALTED and refund states are global.';
COMMENT ON COLUMN public.signing_envelopes.halt_reason IS
    'Compliance reason that globally halts all parties; contains no raw provider or biometric payload.';
COMMENT ON COLUMN public.signing_envelopes.is_legacy_halt_unclassified IS
    'True only for a pre-B5A VOIDED envelope whose historical halt reason cannot be reconstructed honestly.';

CREATE UNIQUE INDEX uq_signing_envelope_escrow
    ON public.signing_envelopes(escrow_id)
    WHERE escrow_id IS NOT NULL;
CREATE INDEX idx_signing_envelope_compliance_deadline
    ON public.signing_envelopes(global_status, expires_at)
    WHERE global_status = 'ACTIVE' AND expires_at IS NOT NULL;

-- Preserve consultation escrow while allowing one corporate case to own an
-- escrow before a professional/notary is assigned.
ALTER TABLE public.escrow_transactions
    ALTER COLUMN booking_id DROP NOT NULL,
    ALTER COLUMN advocate_id DROP NOT NULL,
    ADD COLUMN corporate_case_id UUID,
    ADD CONSTRAINT fk_escrow_corporate_case
        FOREIGN KEY (corporate_case_id)
        REFERENCES public.corporate_service_cases(case_id)
        ON DELETE RESTRICT,
    ADD CONSTRAINT chk_escrow_exactly_one_scope CHECK (
        num_nonnulls(booking_id, corporate_case_id) = 1
    ),
    ADD CONSTRAINT chk_escrow_consultation_advocate CHECK (
        booking_id IS NULL OR advocate_id IS NOT NULL
    );

COMMENT ON COLUMN public.escrow_transactions.corporate_case_id IS
    'Corporate Intake scope. Mutually exclusive with consultation booking_id.';
COMMENT ON COLUMN public.escrow_transactions.advocate_id IS
    'Required for consultation escrow; nullable for pre-assignment Corporate Intake escrow.';

CREATE UNIQUE INDEX uq_escrow_corporate_case
    ON public.escrow_transactions(corporate_case_id)
    WHERE corporate_case_id IS NOT NULL;

CREATE POLICY rls_escrow_transactions_corporate_participant_read
ON public.escrow_transactions FOR SELECT TO authenticated
USING (
    corporate_case_id IS NOT NULL
    AND EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS corporate_case
        JOIN public.service_orders AS service_order
          ON service_order.order_id = corporate_case.order_id
        WHERE corporate_case.case_id = escrow_transactions.corporate_case_id
          AND (
              service_order.client_id = auth.uid()
              OR service_order.assigned_professional_id = auth.uid()
              OR corporate_case.assigned_notary_id = auth.uid()
              OR EXISTS (
                  SELECT 1
                  FROM public.users_admin AS admin_user
                  WHERE admin_user.admin_id = auth.uid()
                    AND admin_user.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
              )
          )
    )
);

ALTER TABLE public.corporate_service_cases
    DROP CONSTRAINT chk_corporate_cases_stage,
    ADD CONSTRAINT chk_corporate_cases_stage CHECK (current_stage IN (
        'DRAFT', 'IDENTITY_PENDING', 'CDD_REVIEW', 'DOCUMENTS_PENDING',
        'ESCROW_LOCKED', 'NOTARY_REVIEW', 'AHU_SUBMITTED', 'AHU_APPROVED',
        'OSS_PENDING', 'NIB_ISSUED', 'COMPLETED', 'COMPLIANCE_HOLD',
        'CUSTOMER_ACTION_REQUIRED', 'CANCELLED', 'AHU_REJECTED', 'OSS_REJECTED'
    ));

-- Metadata-only WORM seam. Batch 5B may append state-transition events through
-- server-only primitives, but neither service_role nor authenticated callers can
-- mutate or delete an event after insertion.
CREATE TABLE public.compliance_workflow_events_worm (
    event_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    corporate_case_id UUID REFERENCES public.corporate_service_cases(case_id)
        ON DELETE RESTRICT,
    escrow_id UUID REFERENCES public.escrow_transactions(escrow_id)
        ON DELETE RESTRICT,
    envelope_id UUID REFERENCES public.signing_envelopes(envelope_id)
        ON DELETE RESTRICT,
    verification_id UUID REFERENCES public.ekyc_verification_logs(verification_id)
        ON DELETE RESTRICT,
    event_type VARCHAR(64) NOT NULL,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE RESTRICT,
    idempotency_key VARCHAR(192) NOT NULL,
    event_digest_sha256 TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT uq_compliance_workflow_event_idempotency UNIQUE (idempotency_key),
    CONSTRAINT chk_compliance_workflow_event_subject CHECK (
        num_nonnulls(
            corporate_case_id,
            escrow_id,
            envelope_id,
            verification_id
        ) = 1
    ),
    CONSTRAINT chk_compliance_workflow_event_type CHECK (
        btrim(event_type) <> ''
    ),
    CONSTRAINT chk_compliance_workflow_event_idempotency CHECK (
        btrim(idempotency_key) <> ''
    ),
    CONSTRAINT chk_compliance_workflow_event_digest CHECK (
        event_digest_sha256 ~ '^[0-9a-f]{64}$'
    )
);

COMMENT ON TABLE public.compliance_workflow_events_worm IS
    'Append-only Corporate/e-KYC compliance metadata. Raw identity documents, biometric media, credentials, and provider payloads are prohibited.';

CREATE INDEX idx_compliance_workflow_events_corporate
    ON public.compliance_workflow_events_worm(corporate_case_id, occurred_at DESC)
    WHERE corporate_case_id IS NOT NULL;
CREATE INDEX idx_compliance_workflow_events_escrow
    ON public.compliance_workflow_events_worm(escrow_id, occurred_at DESC)
    WHERE escrow_id IS NOT NULL;
CREATE INDEX idx_compliance_workflow_events_envelope
    ON public.compliance_workflow_events_worm(envelope_id, occurred_at DESC)
    WHERE envelope_id IS NOT NULL;
CREATE INDEX idx_compliance_workflow_events_verification
    ON public.compliance_workflow_events_worm(verification_id, occurred_at DESC)
    WHERE verification_id IS NOT NULL;

CREATE TRIGGER trg_worm_compliance_workflow_events
BEFORE UPDATE OR DELETE ON public.compliance_workflow_events_worm
FOR EACH ROW EXECUTE FUNCTION public.fn_prevent_worm_mutation();
ALTER TABLE public.compliance_workflow_events_worm
    ENABLE ALWAYS TRIGGER trg_worm_compliance_workflow_events;

ALTER TABLE public.ekyc_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ekyc_verification_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.signing_envelopes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signing_envelopes FORCE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_transactions FORCE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_workflow_events_worm ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_workflow_events_worm FORCE ROW LEVEL SECURITY;

CREATE POLICY rls_compliance_workflow_events_compliance_read
ON public.compliance_workflow_events_worm FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.users_admin AS admin_user
        WHERE admin_user.admin_id = auth.uid()
          AND admin_user.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    )
);

REVOKE ALL ON TABLE public.ekyc_verification_logs
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.signing_envelopes
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.escrow_transactions
    FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.compliance_workflow_events_worm
    FROM PUBLIC, anon, authenticated;

GRANT SELECT ON TABLE public.ekyc_verification_logs TO authenticated;
GRANT SELECT ON TABLE public.signing_envelopes TO authenticated;
GRANT SELECT ON TABLE public.escrow_transactions TO authenticated;
GRANT SELECT ON TABLE public.compliance_workflow_events_worm TO authenticated;

GRANT ALL ON TABLE public.ekyc_verification_logs TO service_role;
GRANT ALL ON TABLE public.escrow_transactions TO service_role;
GRANT SELECT, INSERT ON TABLE public.compliance_workflow_events_worm TO service_role;

-- Replace the earlier table-wide grant so normal service_role writes cannot
-- manufacture or toggle the migration-only legacy classification.
REVOKE ALL ON TABLE public.signing_envelopes FROM service_role;
GRANT SELECT ON TABLE public.signing_envelopes TO service_role;
GRANT INSERT (
    envelope_id,
    case_type,
    case_id,
    provider_name,
    external_envelope_id,
    document_title,
    document_sha256_hash,
    status,
    created_by,
    created_at,
    updated_at,
    completed_at,
    escrow_id,
    escrow_locked_at,
    expires_at,
    global_status,
    halt_reason,
    halted_at,
    refunded_at
) ON public.signing_envelopes TO service_role;
GRANT UPDATE (
    case_type,
    case_id,
    provider_name,
    external_envelope_id,
    document_title,
    document_sha256_hash,
    status,
    updated_at,
    completed_at,
    escrow_id,
    escrow_locked_at,
    expires_at,
    global_status,
    halt_reason,
    halted_at,
    refunded_at
) ON public.signing_envelopes TO service_role;
