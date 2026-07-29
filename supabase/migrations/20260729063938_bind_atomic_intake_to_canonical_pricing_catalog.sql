-- Bind corporate intake to a server-selected immutable pricing snapshot.
-- This migration intentionally adds no commercial values and no browser table
-- access. The only service-role boundary is the canonical intake RPC.

ALTER TABLE public.service_orders
    ADD COLUMN accepted_pricing_catalog_id UUID;

ALTER TABLE public.service_orders
    ADD CONSTRAINT fk_service_orders_accepted_pricing_catalog
    FOREIGN KEY (accepted_pricing_catalog_id)
    REFERENCES public.corporate_pricing_catalogs(catalog_id)
    ON DELETE RESTRICT;

CREATE INDEX idx_service_orders_accepted_pricing_catalog
    ON public.service_orders(accepted_pricing_catalog_id)
    WHERE accepted_pricing_catalog_id IS NOT NULL;

COMMENT ON COLUMN public.service_orders.accepted_pricing_catalog_id IS
    'Immutable accepted pricing snapshot. NULL is retained only for legacy orders; fn_create_corporate_intake_from_catalog_atomic always sets it.';

ALTER TABLE public.payment_milestones
    ADD COLUMN due_offset_anchor VARCHAR(64),
    ADD COLUMN due_offset_days SMALLINT,
    ADD CONSTRAINT chk_payment_milestones_due_offset CHECK (
        (due_offset_anchor IS NULL AND due_offset_days IS NULL)
        OR (
            due_offset_anchor IS NOT NULL
            AND pg_catalog.btrim(due_offset_anchor) <> ''
            AND due_offset_days IS NOT NULL
            AND due_offset_days >= 0
        )
    );

ALTER TABLE public.corporate_pricing_milestones
    DROP CONSTRAINT chk_corporate_pricing_milestones_due_offset,
    ADD CONSTRAINT chk_corporate_pricing_milestones_due_offset CHECK (
        (due_offset_anchor IS NULL AND due_offset_days IS NULL)
        OR (
            due_offset_anchor IS NOT NULL
            AND pg_catalog.btrim(due_offset_anchor) <> ''
            AND due_offset_days IS NOT NULL
            AND due_offset_days >= 0
        )
    );

COMMENT ON COLUMN public.payment_milestones.due_offset_anchor IS
    'Snapshot of the catalog lifecycle anchor. due_at remains NULL until that anchor actually occurs.';
COMMENT ON COLUMN public.payment_milestones.due_offset_days IS
    'Non-negative relative offset from due_offset_anchor; never converted to a timestamp during intake.';

CREATE OR REPLACE FUNCTION public.fn_protect_payment_milestone_terms()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.status <> 'DRAFT' THEN
            RAISE EXCEPTION 'MILESTONE_TERMS_IMMUTABLE: Non-draft milestones cannot be deleted.';
        END IF;
        RETURN OLD;
    END IF;
    IF OLD.status <> 'DRAFT' AND NEW.status = 'DRAFT' THEN
        RAISE EXCEPTION 'MILESTONE_DRAFT_REENTRY_FORBIDDEN';
    END IF;
    IF (OLD.status <> 'DRAFT' OR NEW.status <> 'DRAFT') AND (
        NEW.order_id IS DISTINCT FROM OLD.order_id
        OR NEW.milestone_type IS DISTINCT FROM OLD.milestone_type
        OR NEW.sequence_number IS DISTINCT FROM OLD.sequence_number
        OR NEW.amount IS DISTINCT FROM OLD.amount
        OR NEW.currency IS DISTINCT FROM OLD.currency
        OR NEW.quote_version IS DISTINCT FROM OLD.quote_version
        OR NEW.releasable_party IS DISTINCT FROM OLD.releasable_party
        OR NEW.evidence_condition IS DISTINCT FROM OLD.evidence_condition
        OR NEW.dispute_refund_rule IS DISTINCT FROM OLD.dispute_refund_rule
        OR NEW.due_offset_anchor IS DISTINCT FROM OLD.due_offset_anchor
        OR NEW.due_offset_days IS DISTINCT FROM OLD.due_offset_days
    ) THEN
        RAISE EXCEPTION 'MILESTONE_TERMS_IMMUTABLE: Non-draft milestone financial terms cannot be changed.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_guard_service_order_accepted_terms()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF OLD.status <> 'DRAFT' AND NEW.status = 'DRAFT' THEN
        RAISE EXCEPTION 'SERVICE_ORDER_DRAFT_REENTRY_FORBIDDEN';
    END IF;
    IF (
        OLD.status <> 'DRAFT'
        OR NEW.status <> 'DRAFT'
        OR OLD.accepted_pricing_catalog_id IS NOT NULL
        OR NEW.accepted_pricing_catalog_id IS NOT NULL
    ) AND (
        NEW.service_type IS DISTINCT FROM OLD.service_type
        OR NEW.currency IS DISTINCT FROM OLD.currency
        OR NEW.accepted_quote_version IS DISTINCT FROM OLD.accepted_quote_version
        OR NEW.accepted_pricing_catalog_id IS DISTINCT FROM OLD.accepted_pricing_catalog_id
    ) THEN
        RAISE EXCEPTION 'SERVICE_ORDER_ACCEPTED_TERMS_IMMUTABLE';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_guard_service_order_accepted_terms
BEFORE UPDATE ON public.service_orders
FOR EACH ROW
EXECUTE FUNCTION public.fn_guard_service_order_accepted_terms();

ALTER TABLE public.service_orders
    ENABLE ALWAYS TRIGGER trg_guard_service_order_accepted_terms;

CREATE OR REPLACE FUNCTION public.fn_resolve_corporate_pricing_catalog(
    p_service_type VARCHAR,
    p_catalog_id UUID DEFAULT NULL
)
RETURNS TABLE (
    catalog_id UUID,
    quote_version SMALLINT,
    legal_scope_version VARCHAR,
    currency CHAR(3),
    total_amount_idr NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_catalog public.corporate_pricing_catalogs%ROWTYPE;
    v_fee_total NUMERIC;
    v_milestone_total NUMERIC;
    v_fee_count BIGINT;
    v_milestone_count BIGINT;
    v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
BEGIN
    IF p_service_type IS NULL
       OR p_service_type NOT IN ('PT_ORDINARY', 'PT_INDIVIDUAL_UMK', 'CV') THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_SERVICE_TYPE_INVALID';
    END IF;

    IF p_catalog_id IS NULL THEN
        SELECT catalog.*
        INTO v_catalog
        FROM public.corporate_pricing_catalogs AS catalog
        WHERE catalog.service_type = p_service_type
          AND catalog.status = 'ACTIVE'
          AND catalog.effective_from <= v_now
          AND (
              catalog.effective_until IS NULL
              OR catalog.effective_until > v_now
          )
        FOR SHARE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'CORPORATE_PRICING_ACTIVE_CATALOG_NOT_FOUND';
        END IF;

        v_now := pg_catalog.clock_timestamp();
        IF v_catalog.status <> 'ACTIVE'
           OR v_catalog.effective_from > v_now
           OR (
                v_catalog.effective_until IS NOT NULL
                AND v_catalog.effective_until <= v_now
           ) THEN
            RAISE EXCEPTION 'CORPORATE_PRICING_ACTIVE_CATALOG_NOT_FOUND';
        END IF;
    ELSE
        SELECT catalog.*
        INTO v_catalog
        FROM public.corporate_pricing_catalogs AS catalog
        WHERE catalog.catalog_id = p_catalog_id
          AND catalog.service_type = p_service_type
          AND catalog.status IN ('ACTIVE', 'RETIRED')
        FOR SHARE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'CORPORATE_PRICING_REPLAY_CATALOG_INVALID';
        END IF;
    END IF;

    IF v_catalog.currency <> 'IDR' THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_CURRENCY_NOT_SUPPORTED';
    END IF;
    IF v_catalog.total_amount_idr::TEXT IN (
        'NaN', 'Infinity', '-Infinity'
    ) OR EXISTS (
        SELECT 1
        FROM public.corporate_pricing_fee_lines AS line
        WHERE line.catalog_id = v_catalog.catalog_id
          AND line.amount::TEXT IN ('NaN', 'Infinity', '-Infinity')
    ) OR EXISTS (
        SELECT 1
        FROM public.corporate_pricing_milestones AS milestone
        WHERE milestone.catalog_id = v_catalog.catalog_id
          AND milestone.amount::TEXT IN ('NaN', 'Infinity', '-Infinity')
    ) THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_AMOUNT_INVALID';
    END IF;

    SELECT pg_catalog.count(*), COALESCE(pg_catalog.sum(line.amount), 0)
    INTO v_fee_count, v_fee_total
    FROM public.corporate_pricing_fee_lines AS line
    WHERE line.catalog_id = v_catalog.catalog_id;

    SELECT pg_catalog.count(*), COALESCE(pg_catalog.sum(milestone.amount), 0)
    INTO v_milestone_count, v_milestone_total
    FROM public.corporate_pricing_milestones AS milestone
    WHERE milestone.catalog_id = v_catalog.catalog_id;

    IF v_fee_count = 0 OR v_milestone_count = 0 THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_TERMS_REQUIRED';
    END IF;
    IF v_fee_total IS DISTINCT FROM v_catalog.total_amount_idr
       OR v_milestone_total IS DISTINCT FROM v_catalog.total_amount_idr THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_TOTAL_MISMATCH';
    END IF;

    RETURN QUERY
    SELECT
        v_catalog.catalog_id,
        v_catalog.quote_version,
        v_catalog.legal_scope_version,
        v_catalog.currency,
        v_catalog.total_amount_idr;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_create_corporate_intake_from_catalog_atomic(
    p_order_id UUID,
    p_client_id UUID,
    p_entity_type VARCHAR,
    p_proposed_name VARCHAR,
    p_domicile_city VARCHAR,
    p_domicile_province VARCHAR,
    p_kbli_snapshot JSONB,
    p_authorized_capital_idr NUMERIC,
    p_paid_up_capital_idr NUMERIC,
    p_corporate_parties JSONB,
    p_beneficial_owners JSONB,
    p_payment_gateway_ref VARCHAR,
    p_idempotency_key VARCHAR,
    p_actor_user_id UUID
)
RETURNS TABLE (
    order_id UUID,
    corporate_case_id UUID,
    escrow_id UUID,
    pricing_catalog_id UUID,
    quote_version SMALLINT,
    legal_scope_version VARCHAR,
    total_amount_idr NUMERIC,
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
    v_event public.compliance_workflow_events_worm%ROWTYPE;
    v_catalog_id UUID;
    v_quote_version SMALLINT;
    v_legal_scope_version VARCHAR;
    v_currency CHAR(3);
    v_total_amount_idr NUMERIC;
    v_case_id UUID;
    v_escrow_id UUID;
    v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
    v_event_key VARCHAR(192);
    v_canonical_kbli JSONB;
    v_canonical_parties JSONB;
    v_canonical_bos JSONB;
    v_canonical_fees JSONB;
    v_canonical_milestones JSONB;
    v_payload TEXT;
    v_digest TEXT;
BEGIN
    IF p_order_id IS NULL THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_ORDER_REQUIRED';
    END IF;
    IF p_client_id IS NULL OR p_actor_user_id IS NULL
       OR p_client_id IS DISTINCT FROM p_actor_user_id THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_CLIENT_ACTOR_MISMATCH';
    END IF;
    IF p_entity_type IS NULL
       OR p_entity_type NOT IN ('PT_ORDINARY', 'PT_INDIVIDUAL_UMK', 'CV') THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_ENTITY_TYPE_INVALID';
    END IF;
    IF p_proposed_name IS NULL
       OR pg_catalog.btrim(p_proposed_name) = ''
       OR pg_catalog.length(pg_catalog.btrim(p_proposed_name)) > 256 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_PROPOSED_NAME_INVALID';
    END IF;
    IF p_domicile_city IS NULL
       OR pg_catalog.btrim(p_domicile_city) = ''
       OR pg_catalog.length(pg_catalog.btrim(p_domicile_city)) > 128
       OR p_domicile_province IS NULL
       OR pg_catalog.btrim(p_domicile_province) = ''
       OR pg_catalog.length(pg_catalog.btrim(p_domicile_province)) > 128 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_DOMICILE_INVALID';
    END IF;
    IF p_authorized_capital_idr IS NULL
       OR p_paid_up_capital_idr IS NULL
       OR p_authorized_capital_idr::TEXT IN (
            'NaN', 'Infinity', '-Infinity'
       )
       OR p_paid_up_capital_idr::TEXT IN (
            'NaN', 'Infinity', '-Infinity'
       )
       OR p_authorized_capital_idr < 0
       OR p_paid_up_capital_idr < 0
       OR p_paid_up_capital_idr > p_authorized_capital_idr THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_CAPITAL_INVALID';
    END IF;
    IF p_payment_gateway_ref IS NULL
       OR pg_catalog.btrim(p_payment_gateway_ref) = ''
       OR pg_catalog.length(pg_catalog.btrim(p_payment_gateway_ref)) > 64 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_PAYMENT_REFERENCE_INVALID';
    END IF;
    IF p_idempotency_key IS NULL
       OR pg_catalog.btrim(p_idempotency_key) = ''
       OR pg_catalog.length(pg_catalog.btrim(p_idempotency_key)) > 48 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_IDEMPOTENCY_KEY_INVALID';
    END IF;

    IF p_kbli_snapshot IS NULL
       OR pg_catalog.jsonb_typeof(p_kbli_snapshot) <> 'array'
       OR pg_catalog.jsonb_array_length(p_kbli_snapshot) = 0
       OR EXISTS (
            SELECT 1
            FROM pg_catalog.jsonb_array_elements(p_kbli_snapshot) AS item(value)
            WHERE pg_catalog.jsonb_typeof(item.value) <> 'string'
               OR pg_catalog.btrim(item.value #>> '{}') = ''
               OR pg_catalog.length(pg_catalog.btrim(item.value #>> '{}')) > 16
       ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_KBLI_INVALID';
    END IF;

    SELECT pg_catalog.jsonb_agg(
        pg_catalog.to_jsonb(pg_catalog.btrim(item.value #>> '{}'))
        ORDER BY pg_catalog.btrim(item.value #>> '{}')
    )
    INTO v_canonical_kbli
    FROM pg_catalog.jsonb_array_elements(p_kbli_snapshot) AS item(value);

    IF pg_catalog.jsonb_array_length(v_canonical_kbli) <> (
        SELECT pg_catalog.count(DISTINCT pg_catalog.btrim(item.value #>> '{}'))
        FROM pg_catalog.jsonb_array_elements(p_kbli_snapshot) AS item(value)
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_KBLI_DUPLICATE';
    END IF;

    IF p_corporate_parties IS NULL
       OR pg_catalog.jsonb_typeof(p_corporate_parties) <> 'array'
       OR pg_catalog.jsonb_array_length(p_corporate_parties) = 0 THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_PARTIES_REQUIRED';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_array_elements(p_corporate_parties) AS item(value)
        WHERE pg_catalog.jsonb_typeof(item.value) <> 'object'
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_PARTY_OBJECT_REQUIRED';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_array_elements(p_corporate_parties) AS item(value)
        CROSS JOIN LATERAL
            pg_catalog.jsonb_object_keys(item.value) AS object_key(key_name)
        WHERE object_key.key_name NOT IN (
            'party_type',
            'role',
            'display_name',
            'identity_reference',
            'ownership_percentage',
            'voting_percentage',
            'effective_from'
        )
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_PARTY_FIELD_NOT_ALLOWED';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_to_recordset(p_corporate_parties) AS party(
            party_type TEXT,
            role TEXT,
            display_name TEXT,
            identity_reference TEXT,
            ownership_percentage NUMERIC,
            voting_percentage NUMERIC,
            effective_from DATE
        )
        WHERE COALESCE(party.party_type, 'NATURAL_PERSON')
                NOT IN ('NATURAL_PERSON', 'LEGAL_ENTITY')
           OR party.role NOT IN (
                'FOUNDER', 'SHAREHOLDER', 'DIRECTOR', 'COMMISSIONER',
                'ACTIVE_PARTNER', 'PASSIVE_PARTNER'
           )
           OR party.display_name IS NULL
           OR pg_catalog.btrim(party.display_name) = ''
           OR pg_catalog.length(pg_catalog.btrim(party.display_name)) > 256
           OR party.identity_reference IS NULL
           OR pg_catalog.btrim(party.identity_reference) = ''
           OR pg_catalog.length(pg_catalog.btrim(party.identity_reference)) > 128
           OR (
                party.ownership_percentage IS NOT NULL
                AND party.ownership_percentage NOT BETWEEN 0 AND 100
           )
           OR (
                party.voting_percentage IS NOT NULL
                AND party.voting_percentage NOT BETWEEN 0 AND 100
           )
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_PARTY_INVALID';
    END IF;

    SELECT pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
            'party_type', COALESCE(party.party_type, 'NATURAL_PERSON'),
            'role', party.role,
            'display_name', pg_catalog.btrim(party.display_name),
            'identity_reference', pg_catalog.btrim(party.identity_reference),
            'ownership_percentage', party.ownership_percentage,
            'voting_percentage', party.voting_percentage,
            'effective_from', party.effective_from
        )
        ORDER BY
            pg_catalog.btrim(party.identity_reference),
            party.role,
            pg_catalog.btrim(party.display_name),
            COALESCE(party.party_type, 'NATURAL_PERSON'),
            party.ownership_percentage NULLS FIRST,
            party.voting_percentage NULLS FIRST,
            party.effective_from NULLS FIRST
    )
    INTO v_canonical_parties
    FROM pg_catalog.jsonb_to_recordset(p_corporate_parties) AS party(
        party_type TEXT,
        role TEXT,
        display_name TEXT,
        identity_reference TEXT,
        ownership_percentage NUMERIC,
        voting_percentage NUMERIC,
        effective_from DATE
    );

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
        WHERE object_key.key_name NOT IN (
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
           OR pg_catalog.length(pg_catalog.btrim(owner.natural_person_name)) > 256
           OR owner.identity_reference IS NULL
           OR pg_catalog.btrim(owner.identity_reference) = ''
           OR pg_catalog.length(pg_catalog.btrim(owner.identity_reference)) > 128
           OR owner.control_basis NOT IN (
                'OWNERSHIP', 'VOTING_RIGHTS', 'APPOINTMENT_REMOVAL',
                'EFFECTIVE_CONTROL', 'BENEFICIAL_ENTITLEMENT'
           )
           OR (
                owner.percentage IS NOT NULL
                AND owner.percentage NOT BETWEEN 0 AND 100
           )
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
        SELECT pg_catalog.count(
            DISTINCT pg_catalog.btrim(owner.identity_reference)
        )
        FROM pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
            identity_reference TEXT
        )
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_BENEFICIAL_OWNER_DUPLICATE';
    END IF;

    SELECT pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
            'declaration_version',
                COALESCE(owner.declaration_version, 1::SMALLINT),
            'natural_person_name',
                pg_catalog.btrim(owner.natural_person_name),
            'identity_reference',
                pg_catalog.btrim(owner.identity_reference),
            'control_basis', owner.control_basis,
            'percentage', owner.percentage,
            'evidence_digest', owner.evidence_digest
        )
        ORDER BY pg_catalog.btrim(owner.identity_reference)
    )
    INTO v_canonical_bos
    FROM pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
        declaration_version SMALLINT,
        natural_person_name TEXT,
        identity_reference TEXT,
        control_basis TEXT,
        percentage NUMERIC,
        evidence_digest TEXT
    );

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(p_order_id::TEXT, 0)
    );

    SELECT service_order.*
    INTO v_order
    FROM public.service_orders AS service_order
    WHERE service_order.order_id = p_order_id
    FOR UPDATE;

    IF FOUND THEN
        IF v_order.accepted_pricing_catalog_id IS NULL THEN
            RAISE EXCEPTION 'CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT';
        END IF;
        IF v_order.client_id IS DISTINCT FROM p_client_id
           OR v_order.service_type IS DISTINCT FROM p_entity_type THEN
            RAISE EXCEPTION 'CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT';
        END IF;
        SELECT resolved.catalog_id,
               resolved.quote_version,
               resolved.legal_scope_version,
               resolved.currency,
               resolved.total_amount_idr
        INTO v_catalog_id,
             v_quote_version,
             v_legal_scope_version,
             v_currency,
             v_total_amount_idr
        FROM public.fn_resolve_corporate_pricing_catalog(
            v_order.service_type,
            v_order.accepted_pricing_catalog_id
        ) AS resolved;
    ELSE
        SELECT resolved.catalog_id,
               resolved.quote_version,
               resolved.legal_scope_version,
               resolved.currency,
               resolved.total_amount_idr
        INTO v_catalog_id,
             v_quote_version,
             v_legal_scope_version,
             v_currency,
             v_total_amount_idr
        FROM public.fn_resolve_corporate_pricing_catalog(
            p_entity_type,
            NULL
        ) AS resolved;
    END IF;

    SELECT pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
            'fee_line_code', line.fee_line_code,
            'fee_type', line.fee_type,
            'description', line.description,
            'amount', line.amount,
            'currency', v_currency,
            'quote_version', v_quote_version
        )
        ORDER BY line.fee_line_code
    )
    INTO v_canonical_fees
    FROM public.corporate_pricing_fee_lines AS line
    WHERE line.catalog_id = v_catalog_id;

    SELECT pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
            'milestone_type', milestone.milestone_type,
            'sequence_number', milestone.sequence_number,
            'amount', milestone.amount,
            'currency', v_currency,
            'quote_version', v_quote_version,
            'releasable_party', milestone.releasable_party,
            'evidence_condition', milestone.evidence_condition,
            'dispute_refund_rule', milestone.dispute_refund_rule,
            'due_offset_anchor', milestone.due_offset_anchor,
            'due_offset_days', milestone.due_offset_days
        )
        ORDER BY milestone.sequence_number, milestone.milestone_type
    )
    INTO v_canonical_milestones
    FROM public.corporate_pricing_milestones AS milestone
    WHERE milestone.catalog_id = v_catalog_id;

    v_event_key := 'corporate-intake:' || pg_catalog.btrim(p_idempotency_key);
    v_payload := pg_catalog.jsonb_build_object(
        'order_id', p_order_id,
        'client_id', p_client_id,
        'entity_type', p_entity_type,
        'proposed_name', pg_catalog.btrim(p_proposed_name),
        'domicile_city', pg_catalog.btrim(p_domicile_city),
        'domicile_province', pg_catalog.btrim(p_domicile_province),
        'kbli_snapshot', v_canonical_kbli,
        'authorized_capital_idr', p_authorized_capital_idr,
        'paid_up_capital_idr', p_paid_up_capital_idr,
        'corporate_parties', v_canonical_parties,
        'beneficial_owners', v_canonical_bos,
        'payment_gateway_ref', pg_catalog.btrim(p_payment_gateway_ref),
        'idempotency_key', pg_catalog.btrim(p_idempotency_key),
        'actor_user_id', p_actor_user_id,
        'pricing_catalog_id', v_catalog_id,
        'quote_version', v_quote_version,
        'legal_scope_version', v_legal_scope_version,
        'currency', v_currency,
        'total_amount_idr', v_total_amount_idr,
        'fee_lines', v_canonical_fees,
        'payment_milestones', v_canonical_milestones
    )::TEXT;
    v_digest := pg_catalog.encode(
        extensions.digest(v_payload, 'sha256'),
        'hex'
    );

    IF v_order.order_id IS NOT NULL THEN
        SELECT corporate_case.*
        INTO v_case
        FROM public.corporate_service_cases AS corporate_case
        WHERE corporate_case.order_id = p_order_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT';
        END IF;

        SELECT escrow.*
        INTO v_escrow
        FROM public.escrow_transactions AS escrow
        WHERE escrow.corporate_case_id = v_case.case_id;

        SELECT event.*
        INTO v_event
        FROM public.compliance_workflow_events_worm AS event
        WHERE event.idempotency_key = v_event_key;

        IF v_escrow.escrow_id IS NULL
           OR v_event.event_id IS NULL
           OR v_event.event_type
                IS DISTINCT FROM 'CORPORATE_INTAKE_CREATED'
           OR v_event.corporate_case_id IS DISTINCT FROM v_case.case_id
           OR v_order.client_id IS DISTINCT FROM p_client_id
           OR v_order.service_type IS DISTINCT FROM p_entity_type
           OR v_order.currency IS DISTINCT FROM v_currency
           OR v_order.accepted_quote_version
                IS DISTINCT FROM v_quote_version
           OR v_order.accepted_pricing_catalog_id
                IS DISTINCT FROM v_catalog_id
           OR v_case.entity_type IS DISTINCT FROM p_entity_type
           OR v_case.proposed_name
                IS DISTINCT FROM pg_catalog.btrim(p_proposed_name)
           OR v_case.domicile_city
                IS DISTINCT FROM pg_catalog.btrim(p_domicile_city)
           OR v_case.domicile_province
                IS DISTINCT FROM pg_catalog.btrim(p_domicile_province)
           OR v_case.kbli_snapshot IS DISTINCT FROM v_canonical_kbli
           OR v_case.authorized_capital_idr
                IS DISTINCT FROM p_authorized_capital_idr
           OR v_case.paid_up_capital_idr
                IS DISTINCT FROM p_paid_up_capital_idr
           OR v_case.legal_scope_version
                IS DISTINCT FROM v_legal_scope_version
           OR v_escrow.client_id IS DISTINCT FROM p_client_id
           OR v_escrow.total_amount_idr
                IS DISTINCT FROM v_total_amount_idr
           OR v_escrow.payment_gateway_ref
                IS DISTINCT FROM pg_catalog.btrim(p_payment_gateway_ref)
           OR v_escrow.worm_audit_hash IS DISTINCT FROM v_digest THEN
            RAISE EXCEPTION 'CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT';
        END IF;

        RETURN QUERY
        SELECT
            p_order_id,
            v_case.case_id,
            v_escrow.escrow_id,
            v_catalog_id,
            v_quote_version,
            v_legal_scope_version,
            v_total_amount_idr,
            true;
        RETURN;
    END IF;

    INSERT INTO public.service_orders (
        order_id,
        client_id,
        service_type,
        status,
        currency,
        accepted_quote_version,
        accepted_pricing_catalog_id,
        created_at,
        updated_at
    ) VALUES (
        p_order_id,
        p_client_id,
        p_entity_type,
        'DRAFT',
        v_currency,
        v_quote_version,
        v_catalog_id,
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
        line.fee_line_code,
        line.fee_type,
        line.description,
        line.amount,
        v_currency,
        v_quote_version,
        v_now,
        v_now,
        v_now
    FROM public.corporate_pricing_fee_lines AS line
    WHERE line.catalog_id = v_catalog_id
    ORDER BY line.fee_line_code;

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
        due_offset_anchor,
        due_offset_days,
        created_at,
        updated_at
    )
    SELECT
        p_order_id,
        milestone.milestone_type,
        milestone.sequence_number,
        milestone.amount,
        v_currency,
        v_quote_version,
        'PENDING',
        milestone.releasable_party,
        milestone.evidence_condition,
        milestone.dispute_refund_rule,
        NULL,
        milestone.due_offset_anchor,
        milestone.due_offset_days,
        v_now,
        v_now
    FROM public.corporate_pricing_milestones AS milestone
    WHERE milestone.catalog_id = v_catalog_id
    ORDER BY milestone.sequence_number, milestone.milestone_type;

    SELECT created.corporate_case_id, created.escrow_id
    INTO v_case_id, v_escrow_id
    FROM public.fn_create_corporate_intake_atomic(
        p_order_id,
        p_entity_type,
        pg_catalog.btrim(p_proposed_name),
        pg_catalog.btrim(p_domicile_city),
        pg_catalog.btrim(p_domicile_province),
        v_canonical_kbli,
        p_authorized_capital_idr,
        p_paid_up_capital_idr,
        v_legal_scope_version,
        v_canonical_bos,
        v_total_amount_idr,
        pg_catalog.btrim(p_payment_gateway_ref),
        pg_catalog.btrim(p_idempotency_key),
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
        party.party_type,
        party.role,
        party.display_name,
        party.identity_reference,
        party.ownership_percentage,
        party.voting_percentage,
        COALESCE(party.effective_from, v_now::DATE),
        v_now,
        v_now
    FROM pg_catalog.jsonb_to_recordset(v_canonical_parties) AS party(
        party_type TEXT,
        role TEXT,
        display_name TEXT,
        identity_reference TEXT,
        ownership_percentage NUMERIC,
        voting_percentage NUMERIC,
        effective_from DATE
    );

    UPDATE public.escrow_transactions AS escrow
    SET worm_audit_hash = v_digest,
        updated_at = v_now
    WHERE escrow.escrow_id = v_escrow_id;

    UPDATE public.service_orders AS service_order
    SET status = 'PAYMENT_PENDING',
        submitted_at = v_now,
        updated_at = v_now
    WHERE service_order.order_id = p_order_id;

    RETURN QUERY
    SELECT
        p_order_id,
        v_case_id,
        v_escrow_id,
        v_catalog_id,
        v_quote_version,
        v_legal_scope_version,
        v_total_amount_idr,
        false;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_guard_service_order_accepted_terms()
    FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_guard_service_order_accepted_terms()
    TO postgres;

REVOKE ALL ON FUNCTION public.fn_resolve_corporate_pricing_catalog(VARCHAR, UUID)
    FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_resolve_corporate_pricing_catalog(VARCHAR, UUID)
    TO postgres;

REVOKE ALL ON FUNCTION public.fn_create_corporate_intake_from_catalog_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    JSONB, JSONB, VARCHAR, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_create_corporate_intake_from_catalog_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    JSONB, JSONB, VARCHAR, VARCHAR, UUID
) TO service_role, postgres;

REVOKE ALL ON FUNCTION public.fn_create_corporate_intake_complete_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, JSONB, JSONB, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_create_corporate_intake_complete_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, JSONB, JSONB, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) TO postgres;

REVOKE ALL ON FUNCTION public.fn_create_corporate_intake_atomic(
    UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_create_corporate_intake_atomic(
    UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) TO postgres;

COMMENT ON FUNCTION public.fn_resolve_corporate_pricing_catalog(VARCHAR, UUID) IS
    'Owner-only canonical pricing resolver. service_role and browser roles must enter through the catalog-backed intake RPC.';
COMMENT ON FUNCTION public.fn_create_corporate_intake_from_catalog_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    JSONB, JSONB, VARCHAR, VARCHAR, UUID
) IS
    'Canonical service-role intake boundary. All financial and legal terms are selected and snapshotted server-side from the immutable pricing catalog.';
COMMENT ON FUNCTION public.fn_create_corporate_intake_complete_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, JSONB, JSONB, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) IS
    'LEGACY OWNER-ONLY: accepts caller-supplied financial terms and must never be used as an Edge Function or browser boundary.';
COMMENT ON FUNCTION public.fn_create_corporate_intake_atomic(
    UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    VARCHAR, JSONB, NUMERIC, VARCHAR, VARCHAR, UUID
) IS
    'Partial owner-only corporate intake primitive. Not an Edge Function or browser boundary.';
