-- Phase 2 backend forensic hardening.
-- Closes the AD-P2 escrow/e-KYC binding, lock-order, WORM, ACL, notary
-- assignment, government-submission, and complete Corporate Intake gaps.

-- ============================================================================
-- 1. Authoritative escrow lock timestamp and immutable financial-state guard
-- ============================================================================

ALTER TABLE public.escrow_transactions
    ADD COLUMN funds_locked_at TIMESTAMPTZ,
    ADD COLUMN funds_lock_time_reconstructed BOOLEAN NOT NULL DEFAULT false;

UPDATE public.escrow_transactions AS escrow
SET funds_locked_at = COALESCE(
    (
        SELECT envelope.escrow_locked_at
        FROM public.signing_envelopes AS envelope
        WHERE envelope.escrow_id = escrow.escrow_id
        LIMIT 1
    ),
    escrow.updated_at
),
    funds_lock_time_reconstructed = NOT EXISTS (
        SELECT 1
        FROM public.signing_envelopes AS envelope
        WHERE envelope.escrow_id = escrow.escrow_id
          AND envelope.escrow_locked_at IS NOT NULL
    )
WHERE escrow.status <> 'PENDING_PAYMENT'
  AND escrow.funds_locked_at IS NULL;

COMMENT ON COLUMN public.escrow_transactions.funds_locked_at IS
    'Authoritative immutable timestamp when verified funds first reached HELD_IN_ESCROW.';
COMMENT ON COLUMN public.escrow_transactions.funds_lock_time_reconstructed IS
    'True only for a historical non-pending escrow whose original lock timestamp was unavailable; such rows cannot start a new e-KYC window.';

CREATE OR REPLACE FUNCTION public.fn_guard_escrow_financial_state()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status <> 'PENDING_PAYMENT' AND NEW.funds_locked_at IS NULL THEN
            NEW.funds_locked_at := COALESCE(NEW.created_at, pg_catalog.clock_timestamp());
        END IF;
        NEW.funds_lock_time_reconstructed := false;
        RETURN NEW;
    END IF;

    IF OLD.funds_locked_at IS NOT NULL
       AND NEW.funds_locked_at IS DISTINCT FROM OLD.funds_locked_at THEN
        RAISE EXCEPTION 'ESCROW_FUNDS_LOCK_TIMESTAMP_IMMUTABLE';
    END IF;
    IF NEW.funds_lock_time_reconstructed IS DISTINCT FROM
       OLD.funds_lock_time_reconstructed THEN
        RAISE EXCEPTION 'ESCROW_FUNDS_LOCK_PROVENANCE_IMMUTABLE';
    END IF;

    IF OLD.status = 'PENDING_PAYMENT'
       AND NEW.status = 'HELD_IN_ESCROW'
       AND NEW.funds_locked_at IS NULL THEN
        NEW.funds_locked_at := COALESCE(
            NEW.updated_at,
            pg_catalog.clock_timestamp()
        );
        NEW.funds_lock_time_reconstructed := false;
    END IF;

    IF NEW.status <> 'PENDING_PAYMENT' AND NEW.funds_locked_at IS NULL THEN
        RAISE EXCEPTION 'ESCROW_FUNDS_LOCK_TIMESTAMP_REQUIRED';
    END IF;

    IF OLD.status <> 'PENDING_PAYMENT' AND NEW.status = 'PENDING_PAYMENT' THEN
        RAISE EXCEPTION 'ESCROW_FINANCIAL_STATE_REWIND_FORBIDDEN';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_escrow_financial_state
BEFORE INSERT OR UPDATE OF status, funds_locked_at
ON public.escrow_transactions
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_escrow_financial_state();

ALTER TABLE public.escrow_transactions
    ENABLE ALWAYS TRIGGER trg_guard_escrow_financial_state;

CREATE OR REPLACE FUNCTION public.fn_audit_escrow_state_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.status = 'HELD_IN_ESCROW'
       AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
        PERFORM public.fn_append_compliance_workflow_event(
            NULL,
            NEW.escrow_id,
            NULL,
            NULL,
            'ESCROW_FUNDS_LOCKED',
            public.fn_current_compliance_event_actor(),
            'escrow:funds-locked:' || NEW.escrow_id::TEXT,
            NEW.funds_locked_at
        );
    END IF;

    IF TG_OP = 'UPDATE'
       AND NEW.status = 'REFUNDED_TO_CLIENT'
       AND OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM public.fn_append_compliance_workflow_event(
            NULL,
            NEW.escrow_id,
            NULL,
            NULL,
            'ESCROW_REFUNDED_TO_CLIENT',
            public.fn_current_compliance_event_actor(),
            'escrow:refunded-to-client:' || NEW.escrow_id::TEXT,
            NEW.updated_at
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER trg_audit_escrow_state_transition ON public.escrow_transactions;
CREATE TRIGGER trg_audit_escrow_state_transition
AFTER INSERT OR UPDATE OF status ON public.escrow_transactions
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_escrow_state_transition();
ALTER TABLE public.escrow_transactions
    ENABLE ALWAYS TRIGGER trg_audit_escrow_state_transition;

-- ============================================================================
-- 2. Database-enforced envelope-to-escrow scope and seven-day window
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_validate_signing_envelope_escrow_binding()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_escrow public.escrow_transactions%ROWTYPE;
BEGIN
    IF NEW.escrow_id IS NULL THEN
        IF NEW.escrow_locked_at IS NOT NULL OR NEW.expires_at IS NOT NULL THEN
            RAISE EXCEPTION 'SIGNING_ESCROW_WINDOW_WITHOUT_ESCROW_FORBIDDEN';
        END IF;
        RETURN NEW;
    END IF;

    SELECT escrow.*
    INTO v_escrow
    FROM public.escrow_transactions AS escrow
    WHERE escrow.escrow_id = NEW.escrow_id
    FOR KEY SHARE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SIGNING_ESCROW_NOT_FOUND';
    END IF;
    IF v_escrow.status <> 'HELD_IN_ESCROW'
       OR v_escrow.funds_locked_at IS NULL
       OR v_escrow.funds_lock_time_reconstructed THEN
        RAISE EXCEPTION 'SIGNING_ESCROW_MUST_BE_HELD';
    END IF;
    IF NEW.escrow_locked_at IS DISTINCT FROM v_escrow.funds_locked_at THEN
        RAISE EXCEPTION 'SIGNING_ESCROW_LOCK_TIMESTAMP_MISMATCH';
    END IF;
    IF NEW.expires_at IS DISTINCT FROM v_escrow.funds_locked_at + INTERVAL '7 days' THEN
        RAISE EXCEPTION 'SIGNING_ESCROW_DEADLINE_MISMATCH';
    END IF;

    IF NEW.case_type = 'CORPORATE'
       AND (
           v_escrow.corporate_case_id IS DISTINCT FROM NEW.case_id
           OR v_escrow.booking_id IS NOT NULL
       ) THEN
        RAISE EXCEPTION 'SIGNING_CORPORATE_ESCROW_SCOPE_MISMATCH';
    END IF;
    IF NEW.case_type = 'CONSULTATION'
       AND (
           v_escrow.booking_id IS DISTINCT FROM NEW.case_id
           OR v_escrow.corporate_case_id IS NOT NULL
       ) THEN
        RAISE EXCEPTION 'SIGNING_CONSULTATION_ESCROW_SCOPE_MISMATCH';
    END IF;

    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.signing_envelopes AS envelope
        JOIN public.escrow_transactions AS escrow
          ON escrow.escrow_id = envelope.escrow_id
        WHERE envelope.escrow_id IS NOT NULL
          AND (
              envelope.escrow_locked_at IS DISTINCT FROM escrow.funds_locked_at
              OR envelope.expires_at IS DISTINCT FROM escrow.funds_locked_at + INTERVAL '7 days'
              OR (envelope.case_type = 'CORPORATE'
                  AND escrow.corporate_case_id IS DISTINCT FROM envelope.case_id)
              OR (envelope.case_type = 'CONSULTATION'
                  AND escrow.booking_id IS DISTINCT FROM envelope.case_id)
          )
    ) THEN
        RAISE EXCEPTION 'SIGNING_ESCROW_BINDING_RECONCILIATION_REQUIRED';
    END IF;
END;
$$;

CREATE TRIGGER trg_validate_signing_envelope_escrow_binding
BEFORE INSERT OR UPDATE OF escrow_id, escrow_locked_at, expires_at, case_type, case_id
ON public.signing_envelopes
FOR EACH ROW EXECUTE FUNCTION public.fn_validate_signing_envelope_escrow_binding();

ALTER TABLE public.signing_envelopes
    ENABLE ALWAYS TRIGGER trg_validate_signing_envelope_escrow_binding;
ALTER TABLE public.signing_envelopes
    ENABLE ALWAYS TRIGGER trg_validate_signing_envelope_case;

-- ============================================================================
-- 3. Notary assignment and government-submission state guards
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_guard_corporate_notary_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_escrow public.escrow_transactions%ROWTYPE;
BEGIN
    IF NEW.assigned_notary_id IS NULL
       OR NEW.assigned_notary_id IS NOT DISTINCT FROM OLD.assigned_notary_id THEN
        RETURN NEW;
    END IF;

    SELECT escrow.*
    INTO v_escrow
    FROM public.escrow_transactions AS escrow
    WHERE escrow.corporate_case_id = NEW.case_id
    FOR KEY SHARE;

    IF NOT FOUND
       OR v_escrow.status <> 'HELD_IN_ESCROW'
       OR v_escrow.funds_locked_at IS NULL
       OR NEW.current_stage IN ('DRAFT', 'CANCELLED') THEN
        RAISE EXCEPTION 'NOTARY_ASSIGNMENT_REQUIRES_HELD_ESCROW';
    END IF;
    IF NOT public.fn_is_verified_advocate(NEW.assigned_notary_id) THEN
        RAISE EXCEPTION 'NOTARY_ASSIGNMENT_REQUIRES_VERIFIED_PROFESSIONAL';
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_corporate_notary_assignment
BEFORE UPDATE OF assigned_notary_id ON public.corporate_service_cases
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_corporate_notary_assignment();
ALTER TABLE public.corporate_service_cases
    ENABLE ALWAYS TRIGGER trg_guard_corporate_notary_assignment;
ALTER TABLE public.corporate_service_cases
    ENABLE ALWAYS TRIGGER trg_guard_corporate_case_stage_mutation;
ALTER TABLE public.corporate_service_cases
    ENABLE ALWAYS TRIGGER trg_validate_corporate_service_case_order;

CREATE OR REPLACE FUNCTION public.fn_guard_government_submission_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_allowed BOOLEAN;
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.submission_status NOT IN ('DRAFT', 'SUBMITTED') THEN
            RAISE EXCEPTION 'GOVERNMENT_SUBMISSION_INITIAL_STATE_INVALID';
        END IF;
        RETURN NEW;
    END IF;

    IF (
        NEW.case_id,
        NEW.target_system,
        NEW.authorized_notary_id,
        NEW.submission_payload_digest_sha256,
        NEW.idempotency_key,
        NEW.created_at
    ) IS DISTINCT FROM (
        OLD.case_id,
        OLD.target_system,
        OLD.authorized_notary_id,
        OLD.submission_payload_digest_sha256,
        OLD.idempotency_key,
        OLD.created_at
    ) THEN
        RAISE EXCEPTION 'GOVERNMENT_SUBMISSION_IDENTITY_IMMUTABLE';
    END IF;

    v_allowed := CASE OLD.submission_status
        WHEN 'DRAFT' THEN NEW.submission_status IN ('DRAFT', 'SUBMITTED')
        WHEN 'SUBMITTED' THEN NEW.submission_status IN (
            'SUBMITTED',
            'REJECTED',
            'APPROVED'
        )
        WHEN 'REJECTED' THEN NEW.submission_status = 'REJECTED'
        WHEN 'APPROVED' THEN NEW.submission_status = 'APPROVED'
        ELSE false
    END;

    IF NOT v_allowed THEN
        RAISE EXCEPTION
            'GOVERNMENT_SUBMISSION_TRANSITION_FORBIDDEN: % -> %',
            OLD.submission_status,
            NEW.submission_status;
    END IF;
    RETURN NEW;
END;
$$;

-- PostgreSQL executes same-kind triggers by name. The z-prefix deliberately
-- places the guard after trg_sync_notary_submission_contract has normalized
-- the compatibility columns.
CREATE TRIGGER trg_z_guard_government_submission_transition
BEFORE INSERT OR UPDATE ON public.government_submission_jobs
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_government_submission_transition();
ALTER TABLE public.government_submission_jobs
    ENABLE ALWAYS TRIGGER trg_sync_notary_submission_contract;
ALTER TABLE public.government_submission_jobs
    ENABLE ALWAYS TRIGGER trg_z_guard_government_submission_transition;

-- ============================================================================
-- 4. Deadlock-safe signing-party and wallet lock ordering
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_guard_signing_party_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_envelope_status public.signing_envelope_status;
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'SIGNING_PARTY_APPEND_ONLY';
    END IF;

    BEGIN
        SELECT envelope.status
        INTO v_envelope_status
        FROM public.signing_envelopes AS envelope
        WHERE envelope.envelope_id = COALESCE(NEW.envelope_id, OLD.envelope_id)
        FOR KEY SHARE NOWAIT;
    EXCEPTION
        WHEN lock_not_available THEN
            RAISE EXCEPTION 'SIGNING_ENVELOPE_CONCURRENT_TRANSITION_RETRY';
    END;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SIGNING_ENVELOPE_NOT_FOUND';
    END IF;
    IF TG_OP = 'INSERT' THEN
        IF v_envelope_status IS DISTINCT FROM 'DRAFT' THEN
            RAISE EXCEPTION 'SIGNING_PARTIES_LOCKED_AFTER_SEND';
        END IF;
        RETURN NEW;
    END IF;
    IF v_envelope_status IN ('COMPLETED', 'VOIDED', 'EXPIRED')
       OR OLD.signing_status <> 'PENDING' THEN
        RAISE EXCEPTION 'SIGNING_PARTY_TERMINAL_IMMUTABLE';
    END IF;
    IF (
        NEW.envelope_id,
        NEW.party_user_id,
        NEW.party_role,
        NEW.signer_email,
        NEW.signing_order,
        NEW.created_at
    ) IS DISTINCT FROM (
        OLD.envelope_id,
        OLD.party_user_id,
        OLD.party_role,
        OLD.signer_email,
        OLD.signing_order,
        OLD.created_at
    ) THEN
        RAISE EXCEPTION 'SIGNING_PARTY_IDENTITY_FIELDS_IMMUTABLE';
    END IF;
    IF NEW.signing_status = 'SIGNED' AND EXISTS (
        SELECT 1
        FROM public.signing_envelope_parties AS earlier_party
        WHERE earlier_party.envelope_id = OLD.envelope_id
          AND earlier_party.signing_order < OLD.signing_order
          AND earlier_party.signing_status <> 'SIGNED'
    ) THEN
        RAISE EXCEPTION 'SIGNING_ORDER_PREDECESSOR_INCOMPLETE';
    END IF;
    NEW.updated_at := pg_catalog.clock_timestamp();
    RETURN NEW;
END;
$$;

ALTER TABLE public.signing_envelope_parties
    ENABLE ALWAYS TRIGGER trg_guard_signing_party_mutation;

CREATE OR REPLACE FUNCTION public.fn_release_escrow_to_advocate_mutex(
    p_escrow_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_escrow public.escrow_transactions%ROWTYPE;
    v_client_wallet public.wallet_balances%ROWTYPE;
    v_advocate_wallet public.wallet_balances%ROWTYPE;
    v_net_payout NUMERIC(15,2);
BEGIN
    SELECT escrow.*
    INTO v_escrow
    FROM public.escrow_transactions AS escrow
    WHERE escrow.escrow_id = p_escrow_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ESCROW_NOT_FOUND';
    END IF;
    IF auth.uid() IS NOT NULL AND (
        auth.uid() <> v_escrow.client_id
        OR COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', '') <> 'CLIENT'
    ) THEN
        RAISE EXCEPTION 'ESCROW_RELEASE_FORBIDDEN';
    END IF;
    IF v_escrow.status NOT IN ('HELD_IN_ESCROW', 'HOLDING_PERIOD_24H') THEN
        RAISE EXCEPTION 'INVALID_ESCROW_STATUS: %', v_escrow.status;
    END IF;
    IF v_escrow.booking_id IS NULL OR v_escrow.advocate_id IS NULL THEN
        RAISE EXCEPTION 'CONSULTATION_ESCROW_SCOPE_REQUIRED';
    END IF;
    IF NOT EXISTS (
        SELECT 1
        FROM public.legal_opinions AS opinion
        WHERE opinion.booking_id = v_escrow.booking_id
          AND opinion.client_id = v_escrow.client_id
          AND opinion.status = 'STAMPED_SIGNED'
    ) THEN
        RAISE EXCEPTION 'SIGNED_DELIVERABLE_REQUIRED';
    END IF;

    INSERT INTO public.wallet_balances (user_id, user_type)
    VALUES (v_escrow.advocate_id, 'ADVOCATE')
    ON CONFLICT (user_id, user_type) DO NOTHING;

    -- All payout paths lock their escrow first. Wallets are then locked in a
    -- single deterministic UUID order, preventing cross-client/advocate cycles.
    PERFORM wallet.wallet_id
    FROM public.wallet_balances AS wallet
    WHERE (wallet.user_id = v_escrow.client_id AND wallet.user_type = 'CLIENT')
       OR (wallet.user_id = v_escrow.advocate_id AND wallet.user_type = 'ADVOCATE')
    ORDER BY wallet.wallet_id
    FOR UPDATE;

    SELECT wallet.*
    INTO v_client_wallet
    FROM public.wallet_balances AS wallet
    WHERE wallet.user_id = v_escrow.client_id
      AND wallet.user_type = 'CLIENT';
    SELECT wallet.*
    INTO v_advocate_wallet
    FROM public.wallet_balances AS wallet
    WHERE wallet.user_id = v_escrow.advocate_id
      AND wallet.user_type = 'ADVOCATE';

    IF v_escrow.total_amount_idr > 0
       AND (
           v_client_wallet.wallet_id IS NULL
           OR v_client_wallet.balance_held_idr < v_escrow.total_amount_idr
       ) THEN
        RAISE EXCEPTION 'HELD_BALANCE_MISMATCH';
    END IF;

    UPDATE public.wallet_balances
    SET balance_held_idr = balance_held_idr - v_escrow.total_amount_idr,
        updated_at = pg_catalog.clock_timestamp()
    WHERE wallet_id = v_client_wallet.wallet_id
      AND v_escrow.total_amount_idr > 0;

    v_net_payout := v_escrow.total_amount_idr
        * v_escrow.advocate_payout_ratio / 100.00;
    UPDATE public.wallet_balances
    SET balance_available_idr = balance_available_idr + v_net_payout,
        updated_at = pg_catalog.clock_timestamp()
    WHERE wallet_id = v_advocate_wallet.wallet_id;

    UPDATE public.escrow_transactions
    SET status = 'RELEASED_TO_ADVOCATE',
        is_mutex_locked = false,
        updated_at = pg_catalog.clock_timestamp()
    WHERE escrow_id = p_escrow_id;
    UPDATE public.booking_sessions
    SET status = 'COMPLETED',
        updated_at = pg_catalog.clock_timestamp()
    WHERE booking_id = v_escrow.booking_id;
    INSERT INTO public.escrow_payout_ledgers (
        escrow_id,
        wallet_id,
        mutation_type,
        amount_idr,
        description
    ) VALUES (
        p_escrow_id,
        v_advocate_wallet.wallet_id,
        'RELEASE_ADVOCATE',
        v_net_payout,
        'Pencairan dana Escrow setelah persetujuan deliverable WORM oleh Klien'
    );
    RETURN true;
END;
$$;

-- ============================================================================
-- 5. Complete Corporate Intake command (AD01-01..03)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_create_corporate_intake_complete_atomic(
    p_order_id UUID,
    p_client_id UUID,
    p_entity_type VARCHAR,
    p_proposed_name VARCHAR,
    p_domicile_city VARCHAR,
    p_domicile_province VARCHAR,
    p_kbli_snapshot JSONB,
    p_authorized_capital_idr NUMERIC,
    p_paid_up_capital_idr NUMERIC,
    p_legal_scope_version VARCHAR,
    p_corporate_parties JSONB,
    p_beneficial_owners JSONB,
    p_fee_lines JSONB,
    p_payment_milestones JSONB,
    p_total_amount_idr NUMERIC,
    p_payment_gateway_ref VARCHAR,
    p_idempotency_key VARCHAR,
    p_actor_user_id UUID
)
RETURNS TABLE (
    order_id UUID,
    corporate_case_id UUID,
    escrow_id UUID,
    replayed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_case_id UUID;
    v_escrow_id UUID;
    v_existing_escrow public.escrow_transactions%ROWTYPE;
    v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
    v_payload TEXT;
    v_digest TEXT;
BEGIN
    IF p_order_id IS NULL OR p_client_id IS NULL THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_ORDER_AND_CLIENT_REQUIRED';
    END IF;
    IF p_corporate_parties IS NULL
       OR pg_catalog.jsonb_typeof(p_corporate_parties) <> 'array'
       OR pg_catalog.jsonb_array_length(p_corporate_parties) = 0 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_PARTIES_REQUIRED';
    END IF;
    IF p_fee_lines IS NULL
       OR pg_catalog.jsonb_typeof(p_fee_lines) <> 'array'
       OR pg_catalog.jsonb_array_length(p_fee_lines) = 0
       OR p_payment_milestones IS NULL
       OR pg_catalog.jsonb_typeof(p_payment_milestones) <> 'array'
       OR pg_catalog.jsonb_array_length(p_payment_milestones) = 0 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_FINANCIAL_TERMS_REQUIRED';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_array_elements(p_corporate_parties) AS item(value)
        CROSS JOIN LATERAL pg_catalog.jsonb_object_keys(item.value) AS key(name)
        WHERE key.name NOT IN (
            'party_type',
            'role',
            'display_name',
            'identity_reference',
            'ownership_percentage',
            'voting_percentage',
            'effective_from'
        )
    ) OR EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_array_elements(p_fee_lines) AS item(value)
        CROSS JOIN LATERAL pg_catalog.jsonb_object_keys(item.value) AS key(name)
        WHERE key.name NOT IN (
            'fee_line_code',
            'fee_type',
            'description',
            'amount'
        )
    ) OR EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_array_elements(p_payment_milestones) AS item(value)
        CROSS JOIN LATERAL pg_catalog.jsonb_object_keys(item.value) AS key(name)
        WHERE key.name NOT IN (
            'milestone_type',
            'sequence_number',
            'amount',
            'releasable_party',
            'evidence_condition',
            'dispute_refund_rule',
            'due_at'
        )
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_FIELD_NOT_ALLOWED';
    END IF;
    IF (
        SELECT COALESCE(pg_catalog.sum(line.amount), 0)
        FROM pg_catalog.jsonb_to_recordset(p_fee_lines) AS line(amount NUMERIC)
    ) IS DISTINCT FROM p_total_amount_idr
       OR (
        SELECT COALESCE(pg_catalog.sum(milestone.amount), 0)
        FROM pg_catalog.jsonb_to_recordset(p_payment_milestones)
            AS milestone(amount NUMERIC)
    ) IS DISTINCT FROM p_total_amount_idr THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_FINANCIAL_TOTAL_MISMATCH';
    END IF;

    v_payload := pg_catalog.jsonb_build_object(
        'order_id', p_order_id,
        'client_id', p_client_id,
        'entity_type', p_entity_type,
        'proposed_name', p_proposed_name,
        'domicile_city', p_domicile_city,
        'domicile_province', p_domicile_province,
        'kbli_snapshot', p_kbli_snapshot,
        'authorized_capital_idr', p_authorized_capital_idr,
        'paid_up_capital_idr', p_paid_up_capital_idr,
        'legal_scope_version', p_legal_scope_version,
        'corporate_parties', p_corporate_parties,
        'beneficial_owners', p_beneficial_owners,
        'fee_lines', p_fee_lines,
        'payment_milestones', p_payment_milestones,
        'total_amount_idr', p_total_amount_idr,
        'payment_gateway_ref', p_payment_gateway_ref,
        'actor_user_id', p_actor_user_id
    )::TEXT;
    v_digest := pg_catalog.encode(
        extensions.digest(v_payload, 'sha256'),
        'hex'
    );

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_order_id::TEXT, 0)
    );

    SELECT escrow.*
    INTO v_existing_escrow
    FROM public.corporate_service_cases AS corporate_case
    JOIN public.escrow_transactions AS escrow
      ON escrow.corporate_case_id = corporate_case.case_id
    WHERE corporate_case.order_id = p_order_id;

    IF FOUND THEN
        IF v_existing_escrow.worm_audit_hash IS DISTINCT FROM v_digest THEN
            RAISE EXCEPTION 'CORPORATE_INTAKE_COMPLETE_IDEMPOTENCY_CONFLICT';
        END IF;
        RETURN QUERY
        SELECT
            p_order_id,
            v_existing_escrow.corporate_case_id,
            v_existing_escrow.escrow_id,
            true;
        RETURN;
    END IF;
    IF EXISTS (
        SELECT 1 FROM public.service_orders WHERE service_orders.order_id = p_order_id
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_ORDER_ALREADY_EXISTS';
    END IF;

    INSERT INTO public.service_orders (
        order_id,
        client_id,
        service_type,
        status,
        currency,
        created_at,
        updated_at
    ) VALUES (
        p_order_id,
        p_client_id,
        p_entity_type,
        'DRAFT',
        'IDR',
        v_now,
        v_now
    );

    INSERT INTO public.service_fee_lines (
        order_id,
        fee_line_code,
        fee_type,
        description,
        amount,
        currency,
        quote_version,
        accepted_at,
        created_at,
        updated_at
    )
    SELECT
        p_order_id,
        pg_catalog.btrim(line.fee_line_code),
        line.fee_type,
        pg_catalog.btrim(line.description),
        line.amount,
        'IDR',
        1,
        v_now,
        v_now,
        v_now
    FROM pg_catalog.jsonb_to_recordset(p_fee_lines) AS line(
        fee_line_code TEXT,
        fee_type TEXT,
        description TEXT,
        amount NUMERIC
    );

    INSERT INTO public.payment_milestones (
        order_id,
        milestone_type,
        sequence_number,
        amount,
        currency,
        quote_version,
        status,
        releasable_party,
        evidence_condition,
        dispute_refund_rule,
        due_at,
        created_at,
        updated_at
    )
    SELECT
        p_order_id,
        milestone.milestone_type,
        milestone.sequence_number,
        milestone.amount,
        'IDR',
        1,
        'PENDING',
        milestone.releasable_party,
        milestone.evidence_condition,
        milestone.dispute_refund_rule,
        milestone.due_at,
        v_now,
        v_now
    FROM pg_catalog.jsonb_to_recordset(p_payment_milestones) AS milestone(
        milestone_type TEXT,
        sequence_number SMALLINT,
        amount NUMERIC,
        releasable_party TEXT,
        evidence_condition TEXT,
        dispute_refund_rule TEXT,
        due_at TIMESTAMPTZ
    );

    SELECT created.corporate_case_id, created.escrow_id
    INTO v_case_id, v_escrow_id
    FROM public.fn_create_corporate_intake_atomic(
        p_order_id,
        p_entity_type,
        p_proposed_name,
        p_domicile_city,
        p_domicile_province,
        p_kbli_snapshot,
        p_authorized_capital_idr,
        p_paid_up_capital_idr,
        p_legal_scope_version,
        p_beneficial_owners,
        p_total_amount_idr,
        p_payment_gateway_ref,
        p_idempotency_key,
        p_actor_user_id
    ) AS created;

    INSERT INTO public.corporate_parties (
        case_id,
        party_type,
        role,
        display_name,
        identity_reference,
        ownership_percentage,
        voting_percentage,
        effective_from,
        created_at,
        updated_at
    )
    SELECT
        v_case_id,
        COALESCE(party.party_type, 'NATURAL_PERSON'),
        party.role,
        pg_catalog.btrim(party.display_name),
        pg_catalog.btrim(party.identity_reference),
        party.ownership_percentage,
        party.voting_percentage,
        COALESCE(party.effective_from, v_now::DATE),
        v_now,
        v_now
    FROM pg_catalog.jsonb_to_recordset(p_corporate_parties) AS party(
        party_type TEXT,
        role TEXT,
        display_name TEXT,
        identity_reference TEXT,
        ownership_percentage NUMERIC,
        voting_percentage NUMERIC,
        effective_from DATE
    );

    UPDATE public.escrow_transactions
    SET worm_audit_hash = v_digest,
        updated_at = v_now
    WHERE escrow_transactions.escrow_id = v_escrow_id;

    UPDATE public.service_orders
    SET status = 'PAYMENT_PENDING',
        accepted_quote_version = 1,
        submitted_at = v_now,
        updated_at = v_now
    WHERE service_orders.order_id = p_order_id;

    RETURN QUERY SELECT p_order_id, v_case_id, v_escrow_id, false;
END;
$$;

-- The partial primitive remains owner-only for the complete wrapper.
REVOKE ALL ON FUNCTION public.fn_create_corporate_intake_atomic(
    UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_create_corporate_intake_atomic(
    UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) TO postgres;

REVOKE ALL ON FUNCTION public.fn_create_corporate_intake_complete_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, JSONB, JSONB, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_create_corporate_intake_complete_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, JSONB, JSONB, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) TO service_role, postgres;

COMMENT ON FUNCTION public.fn_create_corporate_intake_complete_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, JSONB, JSONB, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) IS
    'Canonical AD01-01..03 command: atomically creates order, accepted fee lines, milestones, case, parties, natural-person BO declarations, escrow, and WORM evidence.';

-- ============================================================================
-- 6. WORM, ACL, constraint-validation, and internal-function hardening
-- ============================================================================

CREATE OR REPLACE FUNCTION public.fn_guard_provider_webhook_event_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'PROVIDER_WEBHOOK_EVENT_APPEND_ONLY';
    END IF;
    IF (
        NEW.event_id,
        NEW.order_id,
        NEW.provider_name,
        NEW.provider_event_id,
        NEW.event_type,
        NEW.payload_digest_sha256,
        NEW.received_at
    ) IS DISTINCT FROM (
        OLD.event_id,
        OLD.order_id,
        OLD.provider_name,
        OLD.provider_event_id,
        OLD.event_type,
        OLD.payload_digest_sha256,
        OLD.received_at
    ) THEN
        RAISE EXCEPTION 'PROVIDER_WEBHOOK_EVENT_IDENTITY_IMMUTABLE';
    END IF;
    IF OLD.signature_verified AND NOT NEW.signature_verified THEN
        RAISE EXCEPTION 'PROVIDER_WEBHOOK_SIGNATURE_VERDICT_IMMUTABLE';
    END IF;
    IF OLD.processed_status = 'PROCESSED' AND NEW IS DISTINCT FROM OLD THEN
        RAISE EXCEPTION 'PROVIDER_WEBHOOK_PROCESSED_EVENT_IMMUTABLE';
    END IF;
    IF NOT (
        (OLD.processed_status = 'PENDING'
            AND NEW.processed_status IN ('PENDING', 'PROCESSED', 'FAILED', 'RETRYING'))
        OR (OLD.processed_status = 'FAILED'
            AND NEW.processed_status IN ('FAILED', 'RETRYING'))
        OR (OLD.processed_status = 'RETRYING'
            AND NEW.processed_status IN ('RETRYING', 'PROCESSED', 'FAILED'))
        OR (OLD.processed_status = 'PROCESSED'
            AND NEW.processed_status = 'PROCESSED')
    ) THEN
        RAISE EXCEPTION 'PROVIDER_WEBHOOK_STATE_TRANSITION_FORBIDDEN';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_provider_webhook_event_mutation
BEFORE UPDATE OR DELETE ON public.provider_webhook_events
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_provider_webhook_event_mutation();
ALTER TABLE public.provider_webhook_events
    ENABLE ALWAYS TRIGGER trg_guard_provider_webhook_event_mutation;

CREATE OR REPLACE FUNCTION public.fn_guard_payout_idempotency_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'PAYOUT_IDEMPOTENCY_KEY_APPEND_ONLY';
    END IF;
    IF (
        NEW.key_id,
        NEW.idempotency_key,
        NEW.escrow_transaction_id,
        NEW.target_user_id,
        NEW.amount,
        NEW.payout_channel,
        NEW.created_at
    ) IS DISTINCT FROM (
        OLD.key_id,
        OLD.idempotency_key,
        OLD.escrow_transaction_id,
        OLD.target_user_id,
        OLD.amount,
        OLD.payout_channel,
        OLD.created_at
    ) THEN
        RAISE EXCEPTION 'PAYOUT_IDEMPOTENCY_IDENTITY_IMMUTABLE';
    END IF;
    IF OLD.status IN ('SUCCESS', 'FAILED') AND NEW IS DISTINCT FROM OLD THEN
        RAISE EXCEPTION 'PAYOUT_IDEMPOTENCY_TERMINAL_IMMUTABLE';
    END IF;
    IF OLD.status = 'INITIATED'
       AND NEW.status NOT IN ('INITIATED', 'SUCCESS', 'FAILED') THEN
        RAISE EXCEPTION 'PAYOUT_IDEMPOTENCY_TRANSITION_FORBIDDEN';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_payout_idempotency_mutation
BEFORE UPDATE OR DELETE ON public.payout_idempotency_keys
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_payout_idempotency_mutation();
ALTER TABLE public.payout_idempotency_keys
    ENABLE ALWAYS TRIGGER trg_guard_payout_idempotency_mutation;

ALTER TABLE public.escrow_payout_ledgers FORCE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_payout_ledgers
    ENABLE ALWAYS TRIGGER trg_worm_escrow_payout_ledgers_vault;
DROP POLICY IF EXISTS rls_payout_ledgers_wallet_owner_read
    ON public.escrow_payout_ledgers;
CREATE POLICY rls_payout_ledgers_wallet_owner_read
ON public.escrow_payout_ledgers
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.wallet_balances AS wallet
        WHERE wallet.wallet_id = escrow_payout_ledgers.wallet_id
          AND wallet.user_id = auth.uid()
    )
);

REVOKE ALL ON TABLE public.escrow_payout_ledgers
    FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.escrow_payout_ledgers TO authenticated;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.escrow_payout_ledgers FROM service_role;
GRANT SELECT, INSERT ON TABLE public.escrow_payout_ledgers TO service_role;

REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.provider_webhook_events FROM service_role;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.payout_idempotency_keys FROM service_role;
REVOKE UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.document_integrity_anchors FROM service_role;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.government_submission_jobs FROM service_role;
REVOKE DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON TABLE public.corporate_service_cases,
             public.corporate_parties,
             public.beneficial_owners,
             public.compliance_assessments,
             public.signing_envelope_parties
    FROM service_role;

ALTER TABLE public.document_integrity_anchors
    VALIDATE CONSTRAINT chk_corporate_anchor_case;
ALTER TABLE public.document_integrity_anchors
    VALIDATE CONSTRAINT chk_psre_anchor_envelope;

REVOKE ALL ON FUNCTION public.fn_guard_escrow_financial_state()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_validate_signing_envelope_escrow_binding()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_guard_corporate_notary_assignment()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_guard_government_submission_transition()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_guard_provider_webhook_event_mutation()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_guard_payout_idempotency_mutation()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_guard_corporate_case_stage_mutation()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_touch_corporate_record_updated_at()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_validate_corporate_service_case_order()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_guard_signing_party_mutation()
    FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.fn_guard_escrow_financial_state() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_validate_signing_envelope_escrow_binding() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_guard_corporate_notary_assignment() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_guard_government_submission_transition() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_guard_provider_webhook_event_mutation() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_guard_payout_idempotency_mutation() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_guard_corporate_case_stage_mutation() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_touch_corporate_record_updated_at() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_validate_corporate_service_case_order() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_guard_signing_party_mutation() TO postgres;

REVOKE ALL ON FUNCTION public.fn_release_escrow_to_advocate_mutex(UUID)
    FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_release_escrow_to_advocate_mutex(UUID)
    TO authenticated, service_role, postgres;

-- Trigger helpers are invoked by PostgreSQL, never as application RPCs.
-- Empty search_path plus owner-only EXECUTE removes every remaining name-
-- resolution and inherited-default-ACL surface from the Phase 2 chain.
ALTER FUNCTION public.fn_protect_accepted_service_fee_line()
    SET search_path = '';
ALTER FUNCTION public.fn_protect_payment_milestone_terms()
    SET search_path = '';
ALTER FUNCTION public.fn_assert_service_order_financial_reconciliation()
    SET search_path = '';
ALTER FUNCTION public.fn_validate_corporate_service_case_order()
    SET search_path = '';
ALTER FUNCTION public.fn_touch_corporate_record_updated_at()
    SET search_path = '';
ALTER FUNCTION public.fn_guard_corporate_case_stage_mutation()
    SET search_path = '';
ALTER FUNCTION public.fn_validate_signing_envelope_case()
    SET search_path = '';
ALTER FUNCTION public.fn_guard_ekyc_log_mutation()
    SET search_path = '';
ALTER FUNCTION public.fn_guard_signing_envelope_mutation()
    SET search_path = '';
ALTER FUNCTION public.fn_guard_signing_party_mutation()
    SET search_path = '';
ALTER FUNCTION public.fn_sync_notary_submission_contract()
    SET search_path = '';
ALTER FUNCTION public.fn_validate_document_integrity_anchor()
    SET search_path = '';
ALTER FUNCTION public.fn_assert_completed_envelope_anchor()
    SET search_path = '';

REVOKE ALL ON FUNCTION public.fn_protect_accepted_service_fee_line(),
    public.fn_protect_payment_milestone_terms(),
    public.fn_assert_service_order_financial_reconciliation(),
    public.fn_validate_corporate_service_case_order(),
    public.fn_touch_corporate_record_updated_at(),
    public.fn_guard_corporate_case_stage_mutation(),
    public.fn_validate_signing_envelope_case(),
    public.fn_guard_ekyc_log_mutation(),
    public.fn_guard_signing_envelope_mutation(),
    public.fn_guard_signing_party_mutation(),
    public.fn_sync_notary_submission_contract(),
    public.fn_validate_document_integrity_anchor(),
    public.fn_assert_completed_envelope_anchor()
    FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_protect_accepted_service_fee_line(),
    public.fn_protect_payment_milestone_terms(),
    public.fn_assert_service_order_financial_reconciliation(),
    public.fn_validate_corporate_service_case_order(),
    public.fn_touch_corporate_record_updated_at(),
    public.fn_guard_corporate_case_stage_mutation(),
    public.fn_validate_signing_envelope_case(),
    public.fn_guard_ekyc_log_mutation(),
    public.fn_guard_signing_envelope_mutation(),
    public.fn_guard_signing_party_mutation(),
    public.fn_sync_notary_submission_contract(),
    public.fn_validate_document_integrity_anchor(),
    public.fn_assert_completed_envelope_anchor()
    TO postgres;

-- Phase 2 composes these pre-existing privileged helpers into the escrow and
-- notarial paths.  Their bodies already schema-qualify every relation and
-- extension call, so an empty path removes the remaining pg_temp shadowing
-- surface without changing behaviour.
ALTER FUNCTION public.fn_record_immutable_audit_log(
    UUID, VARCHAR, VARCHAR, VARCHAR, JSONB
) SET search_path = '';
ALTER FUNCTION public.fn_mutate_wallet_balance_mutex(
    UUID, NUMERIC, VARCHAR, UUID
) SET search_path = '';
ALTER FUNCTION public.fn_refund_escrow_to_client_mutex(UUID, TEXT)
    SET search_path = '';
ALTER FUNCTION public.fn_is_verified_advocate(UUID)
    SET search_path = '';
