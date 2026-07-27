-- P2-B5B: atomic Corporate Intake, escrow lock, and e-KYC Global Halt RPCs.
-- Edge Functions, provider signature verification, and pg_cron scheduling are
-- intentionally deferred to Batch 5C.

-- ---------------------------------------------------------------------------
-- Internal WORM event primitives
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_current_compliance_event_actor()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_actor_text TEXT;
BEGIN
    v_actor_text := NULLIF(
        pg_catalog.current_setting('app.compliance_event_actor_user_id', true),
        ''
    );
    IF v_actor_text IS NOT NULL THEN
        RETURN v_actor_text::UUID;
    END IF;
    RETURN auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_append_compliance_workflow_event(
    p_corporate_case_id UUID,
    p_escrow_id UUID,
    p_envelope_id UUID,
    p_verification_id UUID,
    p_event_type VARCHAR,
    p_actor_user_id UUID,
    p_idempotency_key VARCHAR,
    p_occurred_at TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_event_id UUID;
    v_existing public.compliance_workflow_events_worm%ROWTYPE;
    v_payload TEXT;
    v_digest TEXT;
BEGIN
    IF pg_catalog.num_nonnulls(
        p_corporate_case_id,
        p_escrow_id,
        p_envelope_id,
        p_verification_id
    ) <> 1 THEN
        RAISE EXCEPTION 'COMPLIANCE_EVENT_EXACTLY_ONE_SUBJECT_REQUIRED';
    END IF;
    IF p_event_type IS NULL
       OR pg_catalog.btrim(p_event_type) = ''
       OR pg_catalog.length(p_event_type) > 64 THEN
        RAISE EXCEPTION 'COMPLIANCE_EVENT_TYPE_INVALID';
    END IF;
    IF p_idempotency_key IS NULL
       OR pg_catalog.btrim(p_idempotency_key) = ''
       OR pg_catalog.length(p_idempotency_key) > 192 THEN
        RAISE EXCEPTION 'COMPLIANCE_EVENT_IDEMPOTENCY_KEY_INVALID';
    END IF;
    IF p_occurred_at IS NULL THEN
        RAISE EXCEPTION 'COMPLIANCE_EVENT_OCCURRED_AT_REQUIRED';
    END IF;

    v_payload := pg_catalog.concat_ws(
        '|',
        pg_catalog.btrim(p_event_type),
        p_corporate_case_id::TEXT,
        p_escrow_id::TEXT,
        p_envelope_id::TEXT,
        p_verification_id::TEXT,
        p_actor_user_id::TEXT,
        pg_catalog.btrim(p_idempotency_key),
        (p_occurred_at AT TIME ZONE 'UTC')::TEXT
    );
    v_digest := pg_catalog.encode(
        extensions.digest(v_payload, 'sha256'),
        'hex'
    );

    INSERT INTO public.compliance_workflow_events_worm (
        corporate_case_id,
        escrow_id,
        envelope_id,
        verification_id,
        event_type,
        actor_user_id,
        idempotency_key,
        event_digest_sha256,
        occurred_at
    ) VALUES (
        p_corporate_case_id,
        p_escrow_id,
        p_envelope_id,
        p_verification_id,
        pg_catalog.btrim(p_event_type),
        p_actor_user_id,
        pg_catalog.btrim(p_idempotency_key),
        v_digest,
        p_occurred_at
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING event_id INTO v_event_id;

    IF v_event_id IS NOT NULL THEN
        RETURN v_event_id;
    END IF;

    SELECT event.*
    INTO v_existing
    FROM public.compliance_workflow_events_worm AS event
    WHERE event.idempotency_key = pg_catalog.btrim(p_idempotency_key);

    IF NOT FOUND
       OR v_existing.event_type <> pg_catalog.btrim(p_event_type)
       OR v_existing.corporate_case_id IS DISTINCT FROM p_corporate_case_id
       OR v_existing.escrow_id IS DISTINCT FROM p_escrow_id
       OR v_existing.envelope_id IS DISTINCT FROM p_envelope_id
       OR v_existing.verification_id IS DISTINCT FROM p_verification_id
       OR v_existing.actor_user_id IS DISTINCT FROM p_actor_user_id
       OR v_existing.occurred_at IS DISTINCT FROM p_occurred_at
       OR v_existing.event_digest_sha256 <> v_digest THEN
        RAISE EXCEPTION 'COMPLIANCE_EVENT_IDEMPOTENCY_CONFLICT';
    END IF;

    RETURN v_existing.event_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_audit_corporate_escrow_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.current_stage = 'ESCROW_LOCKED'
       AND OLD.current_stage IS DISTINCT FROM NEW.current_stage THEN
        PERFORM public.fn_append_compliance_workflow_event(
            NEW.case_id,
            NULL,
            NULL,
            NULL,
            'CORPORATE_ESCROW_LOCKED',
            public.fn_current_compliance_event_actor(),
            'corporate-case:escrow-locked:' || NEW.case_id::TEXT,
            NEW.updated_at
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_audit_escrow_state_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.status = 'HELD_IN_ESCROW'
       AND OLD.status IS DISTINCT FROM NEW.status THEN
        PERFORM public.fn_append_compliance_workflow_event(
            NULL,
            NEW.escrow_id,
            NULL,
            NULL,
            'ESCROW_FUNDS_LOCKED',
            public.fn_current_compliance_event_actor(),
            'escrow:funds-locked:' || NEW.escrow_id::TEXT,
            NEW.updated_at
        );
    END IF;

    IF NEW.status = 'REFUNDED_TO_CLIENT'
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

CREATE OR REPLACE FUNCTION public.fn_audit_signing_global_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF NEW.global_status IN ('HALTED', 'REFUND_PENDING', 'REFUNDED')
       AND OLD.global_status NOT IN ('HALTED', 'REFUND_PENDING', 'REFUNDED') THEN
        PERFORM public.fn_append_compliance_workflow_event(
            NULL,
            NULL,
            NEW.envelope_id,
            NULL,
            'EKYC_GLOBAL_HALTED',
            public.fn_current_compliance_event_actor(),
            'signing-envelope:global-halted:' || NEW.envelope_id::TEXT,
            NEW.halted_at
        );
    END IF;

    IF NEW.global_status = 'REFUNDED'
       AND OLD.global_status IS DISTINCT FROM 'REFUNDED' THEN
        PERFORM public.fn_append_compliance_workflow_event(
            NULL,
            NULL,
            NEW.envelope_id,
            NULL,
            'EKYC_GLOBAL_REFUNDED',
            public.fn_current_compliance_event_actor(),
            'signing-envelope:global-refunded:' || NEW.envelope_id::TEXT,
            NEW.refunded_at
        );
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_corporate_escrow_lock
AFTER UPDATE OF current_stage ON public.corporate_service_cases
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_corporate_escrow_lock();

CREATE TRIGGER trg_audit_escrow_state_transition
AFTER UPDATE OF status ON public.escrow_transactions
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_escrow_state_transition();

CREATE TRIGGER trg_audit_signing_global_transition
AFTER UPDATE OF global_status ON public.signing_envelopes
FOR EACH ROW EXECUTE FUNCTION public.fn_audit_signing_global_transition();

ALTER TABLE public.corporate_service_cases
    ENABLE ALWAYS TRIGGER trg_audit_corporate_escrow_lock;
ALTER TABLE public.escrow_transactions
    ENABLE ALWAYS TRIGGER trg_audit_escrow_state_transition;
ALTER TABLE public.signing_envelopes
    ENABLE ALWAYS TRIGGER trg_audit_signing_global_transition;

-- ---------------------------------------------------------------------------
-- Corporate Intake: service order mutex + case + BO declarations + escrow
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_create_corporate_intake_atomic(
    p_order_id UUID,
    p_entity_type VARCHAR,
    p_proposed_name VARCHAR,
    p_domicile_city VARCHAR,
    p_domicile_province VARCHAR,
    p_kbli_snapshot JSONB,
    p_authorized_capital_idr NUMERIC,
    p_paid_up_capital_idr NUMERIC,
    p_legal_scope_version VARCHAR,
    p_beneficial_owners JSONB,
    p_total_amount_idr NUMERIC,
    p_payment_gateway_ref VARCHAR,
    p_idempotency_key VARCHAR,
    p_actor_user_id UUID
)
RETURNS TABLE (
    corporate_case_id UUID,
    escrow_id UUID,
    replayed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order public.service_orders%ROWTYPE;
    v_case public.corporate_service_cases%ROWTYPE;
    v_escrow public.escrow_transactions%ROWTYPE;
    v_existing_event public.compliance_workflow_events_worm%ROWTYPE;
    v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
    v_event_key VARCHAR(192);
    v_request_payload TEXT;
    v_request_digest TEXT;
BEGIN
    IF p_order_id IS NULL THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_ORDER_REQUIRED';
    END IF;
    IF p_entity_type NOT IN ('PT_ORDINARY', 'PT_INDIVIDUAL_UMK', 'CV') THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_ENTITY_TYPE_INVALID';
    END IF;
    IF p_proposed_name IS NULL OR pg_catalog.btrim(p_proposed_name) = '' THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_PROPOSED_NAME_REQUIRED';
    END IF;
    IF p_domicile_city IS NULL OR pg_catalog.btrim(p_domicile_city) = ''
       OR p_domicile_province IS NULL OR pg_catalog.btrim(p_domicile_province) = '' THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_DOMICILE_REQUIRED';
    END IF;
    IF p_legal_scope_version IS NULL
       OR pg_catalog.btrim(p_legal_scope_version) = ''
       OR pg_catalog.length(p_legal_scope_version) > 32 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_LEGAL_SCOPE_VERSION_INVALID';
    END IF;
    IF p_kbli_snapshot IS NULL
       OR pg_catalog.jsonb_typeof(p_kbli_snapshot) <> 'array' THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_KBLI_ARRAY_REQUIRED';
    END IF;
    IF p_total_amount_idr IS NULL OR p_total_amount_idr <= 0 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_ESCROW_AMOUNT_INVALID';
    END IF;
    IF p_payment_gateway_ref IS NULL
       OR pg_catalog.btrim(p_payment_gateway_ref) = ''
       OR pg_catalog.length(p_payment_gateway_ref) > 64 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_PAYMENT_REFERENCE_INVALID';
    END IF;
    IF p_idempotency_key IS NULL
       OR pg_catalog.btrim(p_idempotency_key) = ''
       OR pg_catalog.length(p_idempotency_key) > 48 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_IDEMPOTENCY_KEY_INVALID';
    END IF;
    IF p_beneficial_owners IS NULL
       OR pg_catalog.jsonb_typeof(p_beneficial_owners) <> 'array'
       OR pg_catalog.jsonb_array_length(p_beneficial_owners) = 0 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_BENEFICIAL_OWNER_REQUIRED';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_array_elements(p_beneficial_owners) AS item(value)
        WHERE pg_catalog.jsonb_typeof(item.value) <> 'object'
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_BENEFICIAL_OWNER_OBJECT_REQUIRED';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_array_elements(p_beneficial_owners) AS item(value)
        CROSS JOIN LATERAL
            pg_catalog.jsonb_object_keys(item.value) AS object_key(key_name)
        WHERE key_name NOT IN (
            'declaration_version',
            'natural_person_name',
            'identity_reference',
            'control_basis',
            'percentage',
            'evidence_digest'
        )
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_BENEFICIAL_OWNER_FIELD_NOT_ALLOWED';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
            declaration_version SMALLINT,
            natural_person_name TEXT,
            identity_reference TEXT,
            control_basis TEXT,
            percentage NUMERIC,
            evidence_digest TEXT
        )
        WHERE COALESCE(owner.declaration_version, 1::SMALLINT) <= 0
           OR owner.natural_person_name IS NULL
           OR pg_catalog.btrim(owner.natural_person_name) = ''
           OR owner.identity_reference IS NULL
           OR pg_catalog.btrim(owner.identity_reference) = ''
           OR owner.control_basis NOT IN (
               'OWNERSHIP',
               'VOTING_RIGHTS',
               'APPOINTMENT_REMOVAL',
               'EFFECTIVE_CONTROL',
               'BENEFICIAL_ENTITLEMENT'
           )
           OR (owner.percentage IS NOT NULL AND owner.percentage NOT BETWEEN 0 AND 100)
           OR owner.evidence_digest IS NULL
           OR owner.evidence_digest !~ '^[0-9a-f]{64}$'
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_BENEFICIAL_OWNER_INVALID';
    END IF;
    IF (
        SELECT pg_catalog.count(*)
        FROM pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
            identity_reference TEXT
        )
    ) <> (
        SELECT pg_catalog.count(DISTINCT pg_catalog.btrim(owner.identity_reference))
        FROM pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
            identity_reference TEXT
        )
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_BENEFICIAL_OWNER_DUPLICATE';
    END IF;

    v_event_key := 'corporate-intake:' || pg_catalog.btrim(p_idempotency_key);
    v_request_payload := pg_catalog.jsonb_build_object(
        'order_id', p_order_id,
        'entity_type', p_entity_type,
        'proposed_name', pg_catalog.btrim(p_proposed_name),
        'domicile_city', pg_catalog.btrim(p_domicile_city),
        'domicile_province', pg_catalog.btrim(p_domicile_province),
        'kbli_snapshot', p_kbli_snapshot,
        'authorized_capital_idr', p_authorized_capital_idr,
        'paid_up_capital_idr', p_paid_up_capital_idr,
        'legal_scope_version', pg_catalog.btrim(p_legal_scope_version),
        'beneficial_owners', p_beneficial_owners,
        'total_amount_idr', p_total_amount_idr,
        'payment_gateway_ref', pg_catalog.btrim(p_payment_gateway_ref),
        'actor_user_id', p_actor_user_id
    )::TEXT;
    v_request_digest := pg_catalog.encode(
        extensions.digest(v_request_payload, 'sha256'),
        'hex'
    );

    SELECT event.*
    INTO v_existing_event
    FROM public.compliance_workflow_events_worm AS event
    WHERE event.idempotency_key = v_event_key;

    IF FOUND THEN
        SELECT corporate_case.*
        INTO v_case
        FROM public.corporate_service_cases AS corporate_case
        WHERE corporate_case.case_id = v_existing_event.corporate_case_id;

        SELECT escrow.*
        INTO v_escrow
        FROM public.escrow_transactions AS escrow
        WHERE escrow.corporate_case_id = v_case.case_id;

        IF NOT FOUND
           OR v_existing_event.event_type <> 'CORPORATE_INTAKE_CREATED'
           OR v_case.order_id <> p_order_id
           OR v_escrow.worm_audit_hash IS DISTINCT FROM v_request_digest THEN
            RAISE EXCEPTION 'CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT';
        END IF;

        RETURN QUERY SELECT v_case.case_id, v_escrow.escrow_id, true;
        RETURN;
    END IF;

    SELECT service_order.*
    INTO v_order
    FROM public.service_orders AS service_order
    WHERE service_order.order_id = p_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_ORDER_NOT_FOUND';
    END IF;
    IF v_order.service_type <> p_entity_type THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_ORDER_TYPE_MISMATCH';
    END IF;
    IF v_order.status <> 'DRAFT' THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_ORDER_MUST_BE_DRAFT';
    END IF;
    IF v_order.assigned_professional_id IS NOT NULL THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_PREMATURE_ASSIGNMENT_FORBIDDEN';
    END IF;

    SELECT corporate_case.*
    INTO v_case
    FROM public.corporate_service_cases AS corporate_case
    WHERE corporate_case.order_id = p_order_id
    FOR UPDATE;

    IF FOUND THEN
        SELECT event.*
        INTO v_existing_event
        FROM public.compliance_workflow_events_worm AS event
        WHERE event.idempotency_key = v_event_key
          AND event.corporate_case_id = v_case.case_id;

        SELECT escrow.*
        INTO v_escrow
        FROM public.escrow_transactions AS escrow
        WHERE escrow.corporate_case_id = v_case.case_id;

        IF FOUND
           AND v_existing_event.event_type = 'CORPORATE_INTAKE_CREATED'
           AND v_escrow.worm_audit_hash = v_request_digest THEN
            RETURN QUERY SELECT v_case.case_id, v_escrow.escrow_id, true;
            RETURN;
        END IF;
        RAISE EXCEPTION 'CORPORATE_INTAKE_ORDER_ALREADY_INITIALIZED';
    END IF;

    INSERT INTO public.corporate_service_cases (
        order_id,
        entity_type,
        proposed_name,
        domicile_city,
        domicile_province,
        kbli_snapshot,
        authorized_capital_idr,
        paid_up_capital_idr,
        current_stage,
        legal_scope_version,
        created_at,
        updated_at
    ) VALUES (
        p_order_id,
        p_entity_type,
        pg_catalog.btrim(p_proposed_name),
        pg_catalog.btrim(p_domicile_city),
        pg_catalog.btrim(p_domicile_province),
        p_kbli_snapshot,
        p_authorized_capital_idr,
        p_paid_up_capital_idr,
        'DRAFT',
        pg_catalog.btrim(p_legal_scope_version),
        v_now,
        v_now
    )
    RETURNING * INTO v_case;

    INSERT INTO public.beneficial_owners (
        case_id,
        declaration_version,
        person_type,
        natural_person_name,
        identity_reference,
        control_basis,
        percentage,
        evidence_digest,
        verification_status,
        created_at,
        updated_at
    )
    SELECT
        v_case.case_id,
        COALESCE(owner.declaration_version, 1::SMALLINT),
        'NATURAL_PERSON',
        pg_catalog.btrim(owner.natural_person_name),
        pg_catalog.btrim(owner.identity_reference),
        owner.control_basis,
        owner.percentage,
        owner.evidence_digest::CHAR(64),
        'DECLARED',
        v_now,
        v_now
    FROM pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
        declaration_version SMALLINT,
        natural_person_name TEXT,
        identity_reference TEXT,
        control_basis TEXT,
        percentage NUMERIC,
        evidence_digest TEXT
    );

    INSERT INTO public.escrow_transactions (
        booking_id,
        corporate_case_id,
        client_id,
        advocate_id,
        total_amount_idr,
        status,
        holding_expires_at,
        client_payout_ratio,
        advocate_payout_ratio,
        payment_gateway_ref,
        is_mutex_locked,
        mutex_lock_id,
        worm_audit_hash,
        created_at,
        updated_at
    ) VALUES (
        NULL,
        v_case.case_id,
        v_order.client_id,
        NULL,
        p_total_amount_idr,
        'PENDING_PAYMENT',
        v_now + INTERVAL '7 days',
        100.00,
        0.00,
        pg_catalog.btrim(p_payment_gateway_ref),
        false,
        'intake:' || pg_catalog.btrim(p_idempotency_key),
        v_request_digest,
        v_now,
        v_now
    )
    RETURNING * INTO v_escrow;

    PERFORM pg_catalog.set_config(
        'app.compliance_event_actor_user_id',
        COALESCE(p_actor_user_id::TEXT, ''),
        true
    );
    PERFORM public.fn_append_compliance_workflow_event(
        v_case.case_id,
        NULL,
        NULL,
        NULL,
        'CORPORATE_INTAKE_CREATED',
        public.fn_current_compliance_event_actor(),
        v_event_key,
        v_now
    );

    RETURN QUERY SELECT v_case.case_id, v_escrow.escrow_id, false;
END;
$$;

-- ---------------------------------------------------------------------------
-- Corporate escrow payment lock
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_lock_corporate_escrow_atomic(
    p_case_id UUID,
    p_escrow_id UUID,
    p_expected_amount_idr NUMERIC,
    p_payment_gateway_ref VARCHAR,
    p_idempotency_key VARCHAR,
    p_actor_user_id UUID
)
RETURNS TABLE (
    corporate_case_id UUID,
    escrow_id UUID,
    escrow_locked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    replayed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_case public.corporate_service_cases%ROWTYPE;
    v_escrow public.escrow_transactions%ROWTYPE;
    v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
    v_mutex_key VARCHAR(64);
BEGIN
    IF p_case_id IS NULL OR p_escrow_id IS NULL THEN
        RAISE EXCEPTION 'CORPORATE_ESCROW_LOCK_SUBJECT_REQUIRED';
    END IF;
    IF p_expected_amount_idr IS NULL OR p_expected_amount_idr <= 0 THEN
        RAISE EXCEPTION 'CORPORATE_ESCROW_LOCK_AMOUNT_INVALID';
    END IF;
    IF p_payment_gateway_ref IS NULL
       OR pg_catalog.btrim(p_payment_gateway_ref) = ''
       OR pg_catalog.length(p_payment_gateway_ref) > 64 THEN
        RAISE EXCEPTION 'CORPORATE_ESCROW_LOCK_PAYMENT_REFERENCE_INVALID';
    END IF;
    IF p_idempotency_key IS NULL
       OR pg_catalog.btrim(p_idempotency_key) = ''
       OR pg_catalog.length(p_idempotency_key) > 48 THEN
        RAISE EXCEPTION 'CORPORATE_ESCROW_LOCK_IDEMPOTENCY_KEY_INVALID';
    END IF;

    v_mutex_key := 'corporate-lock:' || pg_catalog.btrim(p_idempotency_key);

    SELECT corporate_case.*
    INTO v_case
    FROM public.corporate_service_cases AS corporate_case
    WHERE corporate_case.case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CORPORATE_ESCROW_LOCK_CASE_NOT_FOUND';
    END IF;

    SELECT escrow.*
    INTO v_escrow
    FROM public.escrow_transactions AS escrow
    WHERE escrow.escrow_id = p_escrow_id
      AND escrow.corporate_case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CORPORATE_ESCROW_LOCK_ESCROW_NOT_FOUND';
    END IF;
    IF v_escrow.total_amount_idr <> p_expected_amount_idr
       OR v_escrow.payment_gateway_ref <> pg_catalog.btrim(p_payment_gateway_ref) THEN
        RAISE EXCEPTION 'CORPORATE_ESCROW_LOCK_PAYMENT_MISMATCH';
    END IF;

    IF v_case.current_stage = 'ESCROW_LOCKED'
       AND v_escrow.status = 'HELD_IN_ESCROW' THEN
        IF v_escrow.mutex_lock_id IS DISTINCT FROM v_mutex_key THEN
            RAISE EXCEPTION 'CORPORATE_ESCROW_LOCK_IDEMPOTENCY_CONFLICT';
        END IF;
        RETURN QUERY
        SELECT
            v_case.case_id,
            v_escrow.escrow_id,
            v_escrow.updated_at,
            v_escrow.holding_expires_at,
            true;
        RETURN;
    END IF;

    IF v_case.current_stage <> 'DRAFT' THEN
        RAISE EXCEPTION 'CORPORATE_ESCROW_LOCK_CASE_STAGE_INVALID';
    END IF;
    IF v_escrow.status <> 'PENDING_PAYMENT' THEN
        RAISE EXCEPTION 'CORPORATE_ESCROW_LOCK_STATUS_INVALID';
    END IF;

    PERFORM pg_catalog.set_config(
        'app.compliance_event_actor_user_id',
        COALESCE(p_actor_user_id::TEXT, ''),
        true
    );

    UPDATE public.escrow_transactions
    SET status = 'HELD_IN_ESCROW',
        holding_expires_at = v_now + INTERVAL '7 days',
        is_mutex_locked = true,
        mutex_lock_id = v_mutex_key,
        updated_at = v_now
    WHERE escrow_transactions.escrow_id = v_escrow.escrow_id
    RETURNING * INTO v_escrow;

    PERFORM pg_catalog.set_config(
        'app.corporate_stage_transition',
        'allowed',
        true
    );
    UPDATE public.corporate_service_cases
    SET current_stage = 'ESCROW_LOCKED',
        updated_at = v_now
    WHERE corporate_service_cases.case_id = v_case.case_id
    RETURNING * INTO v_case;

    RETURN QUERY
    SELECT
        v_case.case_id,
        v_escrow.escrow_id,
        v_now,
        v_escrow.holding_expires_at,
        false;
END;
$$;

-- ---------------------------------------------------------------------------
-- Corporate stage state machine: escrow is mandatory; COMPLIANCE_HOLD absorbs.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_transition_corporate_service_case(
    p_case_id UUID,
    p_expected_stage VARCHAR,
    p_next_stage VARCHAR
)
RETURNS public.corporate_service_cases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_case public.corporate_service_cases%ROWTYPE;
    v_allowed BOOLEAN := false;
BEGIN
    SELECT corporate_case.*
    INTO v_case
    FROM public.corporate_service_cases AS corporate_case
    WHERE corporate_case.case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CORPORATE_CASE_NOT_FOUND';
    END IF;
    IF v_case.current_stage <> p_expected_stage THEN
        RAISE EXCEPTION
            'CORPORATE_STAGE_CONFLICT: expected %, found %',
            p_expected_stage,
            v_case.current_stage;
    END IF;

    v_allowed := CASE v_case.current_stage
        WHEN 'DRAFT' THEN p_next_stage = 'CANCELLED'
        WHEN 'ESCROW_LOCKED' THEN p_next_stage IN ('IDENTITY_PENDING', 'CANCELLED')
        WHEN 'IDENTITY_PENDING' THEN p_next_stage IN (
            'CDD_REVIEW',
            'CUSTOMER_ACTION_REQUIRED',
            'CANCELLED'
        )
        WHEN 'CDD_REVIEW' THEN p_next_stage IN (
            'DOCUMENTS_PENDING',
            'COMPLIANCE_HOLD',
            'CUSTOMER_ACTION_REQUIRED',
            'CANCELLED'
        )
        WHEN 'COMPLIANCE_HOLD' THEN false
        WHEN 'CUSTOMER_ACTION_REQUIRED' THEN p_next_stage IN (
            'IDENTITY_PENDING',
            'CDD_REVIEW',
            'DOCUMENTS_PENDING',
            'NOTARY_REVIEW',
            'OSS_PENDING',
            'CANCELLED'
        )
        WHEN 'DOCUMENTS_PENDING' THEN p_next_stage IN (
            'NOTARY_REVIEW',
            'CUSTOMER_ACTION_REQUIRED',
            'CANCELLED'
        )
        WHEN 'NOTARY_REVIEW' THEN p_next_stage IN (
            'AHU_SUBMITTED',
            'CUSTOMER_ACTION_REQUIRED',
            'CANCELLED'
        )
        WHEN 'AHU_SUBMITTED' THEN p_next_stage IN ('AHU_APPROVED', 'AHU_REJECTED')
        WHEN 'AHU_REJECTED' THEN p_next_stage IN (
            'NOTARY_REVIEW',
            'CUSTOMER_ACTION_REQUIRED',
            'CANCELLED'
        )
        WHEN 'AHU_APPROVED' THEN p_next_stage = 'OSS_PENDING'
        WHEN 'OSS_PENDING' THEN p_next_stage IN (
            'NIB_ISSUED',
            'OSS_REJECTED',
            'CUSTOMER_ACTION_REQUIRED'
        )
        WHEN 'OSS_REJECTED' THEN p_next_stage IN (
            'OSS_PENDING',
            'CUSTOMER_ACTION_REQUIRED',
            'CANCELLED'
        )
        WHEN 'NIB_ISSUED' THEN p_next_stage = 'COMPLETED'
        ELSE false
    END;

    IF NOT v_allowed THEN
        RAISE EXCEPTION
            'CORPORATE_STAGE_TRANSITION_FORBIDDEN: % -> %',
            v_case.current_stage,
            p_next_stage;
    END IF;

    PERFORM pg_catalog.set_config(
        'app.corporate_stage_transition',
        'allowed',
        true
    );
    UPDATE public.corporate_service_cases
    SET current_stage = p_next_stage
    WHERE corporate_service_cases.case_id = p_case_id
    RETURNING * INTO v_case;

    RETURN v_case;
END;
$$;

-- ---------------------------------------------------------------------------
-- Explicit compliance confirmation for a Party Illegal halt.
-- A generic provider rejection is never sufficient for this irreversible cause.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_confirm_party_illegal_atomic(
    p_envelope_id UUID,
    p_party_id UUID,
    p_verification_id UUID,
    p_idempotency_key VARCHAR,
    p_actor_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_envelope public.signing_envelopes%ROWTYPE;
    v_party public.signing_envelope_parties%ROWTYPE;
    v_verification public.ekyc_verification_logs%ROWTYPE;
    v_existing public.compliance_workflow_events_worm%ROWTYPE;
    v_event_key VARCHAR(192);
    v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
BEGIN
    IF p_envelope_id IS NULL OR p_party_id IS NULL OR p_verification_id IS NULL THEN
        RAISE EXCEPTION 'PARTY_ILLEGAL_CONFIRMATION_SUBJECT_REQUIRED';
    END IF;
    IF p_idempotency_key IS NULL
       OR pg_catalog.btrim(p_idempotency_key) = ''
       OR pg_catalog.length(p_idempotency_key) > 48 THEN
        RAISE EXCEPTION 'PARTY_ILLEGAL_CONFIRMATION_IDEMPOTENCY_KEY_INVALID';
    END IF;

    SELECT signing_envelope.*
    INTO v_envelope
    FROM public.signing_envelopes AS signing_envelope
    WHERE signing_envelope.envelope_id = p_envelope_id
    FOR UPDATE;

    IF NOT FOUND OR v_envelope.global_status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'PARTY_ILLEGAL_CONFIRMATION_ENVELOPE_NOT_ACTIVE';
    END IF;

    SELECT signing_party.*
    INTO v_party
    FROM public.signing_envelope_parties AS signing_party
    WHERE signing_party.party_id = p_party_id
      AND signing_party.envelope_id = p_envelope_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'PARTY_ILLEGAL_CONFIRMATION_PARTY_NOT_FOUND';
    END IF;

    SELECT verification.*
    INTO v_verification
    FROM public.ekyc_verification_logs AS verification
    WHERE verification.verification_id = p_verification_id
      AND verification.envelope_id = p_envelope_id
      AND verification.party_id = p_party_id
    FOR UPDATE;

    IF NOT FOUND
       OR v_verification.user_id <> v_party.party_user_id
       OR v_verification.status <> 'REJECTED' THEN
        RAISE EXCEPTION 'PARTY_ILLEGAL_CONFIRMATION_REJECTED_EVIDENCE_REQUIRED';
    END IF;

    v_event_key := 'party-illegal-confirmed:'
        || pg_catalog.btrim(p_idempotency_key);
    SELECT event.*
    INTO v_existing
    FROM public.compliance_workflow_events_worm AS event
    WHERE event.idempotency_key = v_event_key
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing.event_type <> 'PARTY_ILLEGAL_CONFIRMED'
           OR v_existing.verification_id IS DISTINCT FROM p_verification_id
           OR v_existing.actor_user_id IS DISTINCT FROM p_actor_user_id THEN
            RAISE EXCEPTION 'PARTY_ILLEGAL_CONFIRMATION_IDEMPOTENCY_CONFLICT';
        END IF;
        RETURN v_existing.event_id;
    END IF;

    PERFORM pg_catalog.set_config(
        'app.compliance_event_actor_user_id',
        COALESCE(p_actor_user_id::TEXT, ''),
        true
    );
    RETURN public.fn_append_compliance_workflow_event(
        NULL,
        NULL,
        NULL,
        p_verification_id,
        'PARTY_ILLEGAL_CONFIRMED',
        public.fn_current_compliance_event_actor(),
        v_event_key,
        v_now
    );
END;
$$;

-- ---------------------------------------------------------------------------
-- e-KYC Global Halt + full idempotent refund
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_global_halt_ekyc_and_refund_atomic(
    p_envelope_id UUID,
    p_party_id UUID,
    p_verification_id UUID,
    p_halt_reason public.signing_envelope_halt_reason,
    p_idempotency_key VARCHAR,
    p_actor_user_id UUID
)
RETURNS TABLE (
    envelope_id UUID,
    escrow_id UUID,
    global_status public.signing_envelope_global_status,
    escrow_status VARCHAR,
    replayed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_envelope public.signing_envelopes%ROWTYPE;
    v_party public.signing_envelope_parties%ROWTYPE;
    v_verification public.ekyc_verification_logs%ROWTYPE;
    v_case public.corporate_service_cases%ROWTYPE;
    v_escrow public.escrow_transactions%ROWTYPE;
    v_wallet public.wallet_balances%ROWTYPE;
    v_illegal_confirmation_event_id UUID;
    v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
BEGIN
    IF p_envelope_id IS NULL OR p_halt_reason IS NULL THEN
        RAISE EXCEPTION 'EKYC_GLOBAL_HALT_SUBJECT_AND_REASON_REQUIRED';
    END IF;
    IF p_idempotency_key IS NULL
       OR pg_catalog.btrim(p_idempotency_key) = ''
       OR pg_catalog.length(p_idempotency_key) > 48 THEN
        RAISE EXCEPTION 'EKYC_GLOBAL_HALT_IDEMPOTENCY_KEY_INVALID';
    END IF;

    SELECT signing_envelope.*
    INTO v_envelope
    FROM public.signing_envelopes AS signing_envelope
    WHERE signing_envelope.envelope_id = p_envelope_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EKYC_GLOBAL_HALT_ENVELOPE_NOT_FOUND';
    END IF;
    IF v_envelope.escrow_id IS NULL THEN
        RAISE EXCEPTION 'EKYC_GLOBAL_HALT_ESCROW_REQUIRED';
    END IF;

    IF v_envelope.case_type = 'CORPORATE' THEN
        SELECT corporate_case.*
        INTO v_case
        FROM public.corporate_service_cases AS corporate_case
        WHERE corporate_case.case_id = v_envelope.case_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'EKYC_GLOBAL_HALT_CORPORATE_CASE_NOT_FOUND';
        END IF;
    END IF;

    SELECT escrow.*
    INTO v_escrow
    FROM public.escrow_transactions AS escrow
    WHERE escrow.escrow_id = v_envelope.escrow_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EKYC_GLOBAL_HALT_ESCROW_NOT_FOUND';
    END IF;

    IF v_envelope.global_status = 'REFUNDED'
       AND v_escrow.status = 'REFUNDED_TO_CLIENT' THEN
        IF v_envelope.halt_reason IS DISTINCT FROM p_halt_reason
           OR pg_catalog.strpos(
               COALESCE(v_escrow.resolution_notes, ''),
               ':' || pg_catalog.btrim(p_idempotency_key) || ']'
           ) = 0 THEN
            RAISE EXCEPTION 'EKYC_GLOBAL_HALT_IDEMPOTENCY_CONFLICT';
        END IF;
        RETURN QUERY
        SELECT
            v_envelope.envelope_id,
            v_escrow.escrow_id,
            v_envelope.global_status,
            v_escrow.status,
            true;
        RETURN;
    END IF;

    IF v_envelope.global_status <> 'ACTIVE'
       OR v_envelope.status NOT IN ('DRAFT', 'SENT', 'PARTIALLY_SIGNED') THEN
        RAISE EXCEPTION 'EKYC_GLOBAL_HALT_ENVELOPE_STATE_INVALID';
    END IF;
    IF v_escrow.status <> 'HELD_IN_ESCROW' THEN
        RAISE EXCEPTION 'EKYC_GLOBAL_HALT_ESCROW_STATE_INVALID';
    END IF;

    IF p_halt_reason = 'TTL_EXPIRED' THEN
        IF p_party_id IS NOT NULL OR p_verification_id IS NOT NULL THEN
            RAISE EXCEPTION 'EKYC_GLOBAL_HALT_TTL_EVIDENCE_MUST_BE_NULL';
        END IF;
        IF v_envelope.expires_at IS NULL OR v_now < v_envelope.expires_at THEN
            RAISE EXCEPTION 'EKYC_GLOBAL_HALT_TTL_NOT_EXPIRED';
        END IF;
    ELSE
        IF p_party_id IS NULL OR p_verification_id IS NULL THEN
            RAISE EXCEPTION 'EKYC_GLOBAL_HALT_PARTY_EVIDENCE_REQUIRED';
        END IF;

        SELECT signing_party.*
        INTO v_party
        FROM public.signing_envelope_parties AS signing_party
        WHERE signing_party.party_id = p_party_id
          AND signing_party.envelope_id = v_envelope.envelope_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'EKYC_GLOBAL_HALT_PARTY_NOT_FOUND';
        END IF;

        SELECT verification.*
        INTO v_verification
        FROM public.ekyc_verification_logs AS verification
        WHERE verification.verification_id = p_verification_id
          AND verification.envelope_id = v_envelope.envelope_id
          AND verification.party_id = v_party.party_id
        FOR UPDATE;

        IF NOT FOUND
           OR v_verification.user_id <> v_party.party_user_id
           OR v_verification.status <> 'REJECTED' THEN
            RAISE EXCEPTION 'EKYC_GLOBAL_HALT_REJECTED_EVIDENCE_REQUIRED';
        END IF;

        IF p_halt_reason = 'LIVENESS_FAILED_3X'
           AND (
               v_verification.verification_type <> 'LIVENESS_OCR'
               OR v_verification.liveness_attempt_count <> 3
           ) THEN
            RAISE EXCEPTION 'EKYC_GLOBAL_HALT_THIRD_LIVENESS_FAILURE_REQUIRED';
        END IF;

        IF p_halt_reason = 'PARTY_ILLEGAL' THEN
            SELECT event.event_id
            INTO v_illegal_confirmation_event_id
            FROM public.compliance_workflow_events_worm AS event
            WHERE event.verification_id = p_verification_id
              AND event.event_type = 'PARTY_ILLEGAL_CONFIRMED'
            ORDER BY event.occurred_at DESC
            LIMIT 1
            FOR UPDATE;

            IF NOT FOUND THEN
                RAISE EXCEPTION
                    'EKYC_GLOBAL_HALT_PARTY_ILLEGAL_CONFIRMATION_REQUIRED';
            END IF;
        END IF;
    END IF;

    IF v_envelope.case_type = 'CORPORATE'
       AND v_escrow.corporate_case_id IS DISTINCT FROM v_case.case_id THEN
        RAISE EXCEPTION 'EKYC_GLOBAL_HALT_CORPORATE_SCOPE_MISMATCH';
    END IF;

    PERFORM pg_catalog.set_config(
        'app.compliance_event_actor_user_id',
        COALESCE(p_actor_user_id::TEXT, ''),
        true
    );

    UPDATE public.signing_envelopes
    SET status = CASE
            WHEN p_halt_reason = 'TTL_EXPIRED'
                THEN 'EXPIRED'::public.signing_envelope_status
            ELSE 'VOIDED'::public.signing_envelope_status
        END,
        global_status = 'REFUNDED',
        halt_reason = p_halt_reason,
        halted_at = v_now,
        refunded_at = v_now,
        updated_at = v_now
    WHERE signing_envelopes.envelope_id = v_envelope.envelope_id
    RETURNING * INTO v_envelope;

    IF v_envelope.case_type = 'CORPORATE'
       AND v_case.current_stage NOT IN ('COMPLIANCE_HOLD', 'CANCELLED') THEN
        PERFORM pg_catalog.set_config(
            'app.corporate_stage_transition',
            'allowed',
            true
        );
        UPDATE public.corporate_service_cases
        SET current_stage = 'CANCELLED',
            updated_at = v_now
        WHERE corporate_service_cases.case_id = v_case.case_id
        RETURNING * INTO v_case;
    END IF;

    INSERT INTO public.wallet_balances (
        user_id,
        user_type,
        balance_available_idr,
        balance_held_idr,
        updated_at
    ) VALUES (
        v_escrow.client_id,
        'CLIENT',
        0.00,
        0.00,
        v_now
    )
    ON CONFLICT (user_id, user_type) DO NOTHING;

    SELECT wallet.*
    INTO v_wallet
    FROM public.wallet_balances AS wallet
    WHERE wallet.user_id = v_escrow.client_id
      AND wallet.user_type = 'CLIENT'
    FOR UPDATE;

    UPDATE public.wallet_balances
    SET balance_available_idr =
            wallet_balances.balance_available_idr + v_escrow.total_amount_idr,
        updated_at = v_now
    WHERE wallet_balances.wallet_id = v_wallet.wallet_id
    RETURNING * INTO v_wallet;

    INSERT INTO public.escrow_payout_ledgers (
        escrow_id,
        wallet_id,
        mutation_type,
        amount_idr,
        description,
        executed_at
    ) VALUES (
        v_escrow.escrow_id,
        v_wallet.wallet_id,
        'REFUND_CLIENT',
        v_escrow.total_amount_idr,
        'Full refund after e-KYC Global Halt',
        v_now
    );

    UPDATE public.escrow_transactions
    SET status = 'REFUNDED_TO_CLIENT',
        client_payout_ratio = 100.00,
        advocate_payout_ratio = 0.00,
        is_mutex_locked = false,
        resolution_notes = pg_catalog.concat_ws(
            ' ',
            NULLIF(escrow_transactions.resolution_notes, ''),
            '[GLOBAL_HALT_REFUND:' || p_halt_reason::TEXT
                || ':' || pg_catalog.btrim(p_idempotency_key) || ']'
        ),
        updated_at = v_now
    WHERE escrow_transactions.escrow_id = v_escrow.escrow_id
    RETURNING * INTO v_escrow;

    RETURN QUERY
    SELECT
        v_envelope.envelope_id,
        v_escrow.escrow_id,
        v_envelope.global_status,
        v_escrow.status,
        false;
END;
$$;

-- ---------------------------------------------------------------------------
-- Privilege and stage-write hardening
-- ---------------------------------------------------------------------------

REVOKE ALL ON FUNCTION public.fn_current_compliance_event_actor()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_append_compliance_workflow_event(
    UUID, UUID, UUID, UUID, VARCHAR, UUID, VARCHAR, TIMESTAMPTZ
) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_audit_corporate_escrow_lock()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_audit_escrow_state_transition()
    FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION public.fn_audit_signing_global_transition()
    FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.fn_current_compliance_event_actor() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_append_compliance_workflow_event(
    UUID, UUID, UUID, UUID, VARCHAR, UUID, VARCHAR, TIMESTAMPTZ
) TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_audit_corporate_escrow_lock() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_audit_escrow_state_transition() TO postgres;
GRANT EXECUTE ON FUNCTION public.fn_audit_signing_global_transition() TO postgres;

REVOKE ALL ON FUNCTION public.fn_create_corporate_intake_atomic(
    UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_lock_corporate_escrow_atomic(
    UUID, UUID, NUMERIC, VARCHAR, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_confirm_party_illegal_atomic(
    UUID, UUID, UUID, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_global_halt_ekyc_and_refund_atomic(
    UUID, UUID, UUID, public.signing_envelope_halt_reason, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_transition_corporate_service_case(
    UUID, VARCHAR, VARCHAR
) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.fn_create_corporate_intake_atomic(
    UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.fn_lock_corporate_escrow_atomic(
    UUID, UUID, NUMERIC, VARCHAR, VARCHAR, UUID
) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.fn_confirm_party_illegal_atomic(
    UUID, UUID, UUID, VARCHAR, UUID
) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.fn_global_halt_ekyc_and_refund_atomic(
    UUID, UUID, UUID, public.signing_envelope_halt_reason, VARCHAR, UUID
) TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.fn_transition_corporate_service_case(
    UUID, VARCHAR, VARCHAR
) TO service_role, postgres;

-- Direct service-role stage writes would bypass the state machine because the
-- historical trigger GUC is caller-settable. Preserve non-stage maintenance but
-- require every stage mutation to execute as a SECURITY DEFINER RPC owner.
REVOKE UPDATE ON TABLE public.corporate_service_cases FROM service_role;
GRANT UPDATE (
    order_id,
    entity_type,
    proposed_name,
    domicile_city,
    domicile_province,
    kbli_snapshot,
    authorized_capital_idr,
    paid_up_capital_idr,
    target_sla_at,
    legal_scope_version,
    assigned_notary_id,
    assigned_compliance_reviewer_id,
    updated_at
) ON public.corporate_service_cases TO service_role;

-- State changes must pass through the row-locked RPCs above. Direct writes can
-- otherwise manufacture audit events without performing their financial side
-- effects. Existing provider callbacks can retain descriptive metadata writes;
-- Batch 5C will call dedicated RPCs for later state transitions.
REVOKE ALL ON TABLE public.compliance_workflow_events_worm FROM service_role;
GRANT SELECT ON TABLE public.compliance_workflow_events_worm TO service_role;

REVOKE ALL ON TABLE public.escrow_transactions FROM service_role;
GRANT SELECT ON TABLE public.escrow_transactions TO service_role;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.signing_envelopes
    FROM service_role;
GRANT INSERT (
    envelope_id,
    case_type,
    case_id,
    provider_name,
    external_envelope_id,
    document_title,
    document_sha256_hash,
    created_by,
    created_at,
    updated_at,
    escrow_id,
    escrow_locked_at,
    expires_at
) ON public.signing_envelopes TO service_role;
GRANT UPDATE (
    case_type,
    case_id,
    provider_name,
    external_envelope_id,
    document_title,
    document_sha256_hash,
    updated_at
) ON public.signing_envelopes TO service_role;
