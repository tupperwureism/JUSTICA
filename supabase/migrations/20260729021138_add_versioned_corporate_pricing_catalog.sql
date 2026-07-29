-- Versioned corporate quotes. This migration deliberately contains no commercial
-- pricing values; local-only fixtures live exclusively in supabase/seed.sql.

CREATE TABLE public.corporate_pricing_catalogs (
    catalog_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    service_type VARCHAR(32) NOT NULL,
    quote_version SMALLINT NOT NULL,
    legal_scope_version VARCHAR(32) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'IDR',
    total_amount_idr NUMERIC(18,2) NOT NULL,
    status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
    effective_from TIMESTAMPTZ NOT NULL,
    effective_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
    CONSTRAINT uq_corporate_pricing_catalog_service_version
        UNIQUE (service_type, quote_version),
    CONSTRAINT chk_corporate_pricing_catalog_service_type CHECK (
        service_type IN ('PT_ORDINARY', 'PT_INDIVIDUAL_UMK', 'CV')
    ),
    CONSTRAINT chk_corporate_pricing_catalog_quote_version CHECK (
        quote_version > 0
    ),
    CONSTRAINT chk_corporate_pricing_catalog_legal_scope_version CHECK (
        pg_catalog.btrim(legal_scope_version) <> ''
    ),
    CONSTRAINT chk_corporate_pricing_catalog_currency CHECK (
        currency ~ '^[A-Z]{3}$'
    ),
    CONSTRAINT chk_corporate_pricing_catalog_total CHECK (
        total_amount_idr > 0
    ),
    CONSTRAINT chk_corporate_pricing_catalog_status CHECK (
        status IN ('DRAFT', 'ACTIVE', 'RETIRED')
    ),
    CONSTRAINT chk_corporate_pricing_catalog_effective_interval CHECK (
        effective_until IS NULL OR effective_until > effective_from
    )
);

CREATE UNIQUE INDEX uq_corporate_pricing_catalog_one_active_service
    ON public.corporate_pricing_catalogs (service_type)
    WHERE status = 'ACTIVE';

CREATE TABLE public.corporate_pricing_fee_lines (
    fee_line_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    catalog_id UUID NOT NULL,
    fee_line_code VARCHAR(64) NOT NULL,
    fee_type VARCHAR(32) NOT NULL,
    description VARCHAR(256) NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
    CONSTRAINT fk_corporate_pricing_fee_lines_catalog FOREIGN KEY (catalog_id)
        REFERENCES public.corporate_pricing_catalogs(catalog_id) ON DELETE RESTRICT,
    CONSTRAINT uq_corporate_pricing_fee_lines_code
        UNIQUE (catalog_id, fee_line_code),
    CONSTRAINT chk_corporate_pricing_fee_lines_code CHECK (
        pg_catalog.btrim(fee_line_code) <> ''
    ),
    CONSTRAINT chk_corporate_pricing_fee_lines_type CHECK (
        fee_type IN (
            'JUSTICA_FEE', 'NOTARY_FEE', 'PNBP', 'PSRE', 'EKYC',
            'EMETERAI', 'TAX', 'OTHER_APPROVED'
        )
    ),
    CONSTRAINT chk_corporate_pricing_fee_lines_description CHECK (
        pg_catalog.btrim(description) <> ''
    ),
    CONSTRAINT chk_corporate_pricing_fee_lines_amount CHECK (amount > 0)
);

CREATE TABLE public.corporate_pricing_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    catalog_id UUID NOT NULL,
    milestone_type VARCHAR(32) NOT NULL,
    sequence_number SMALLINT NOT NULL,
    amount NUMERIC(18,2) NOT NULL,
    releasable_party VARCHAR(32) NOT NULL,
    evidence_condition VARCHAR(512) NOT NULL,
    dispute_refund_rule VARCHAR(512) NOT NULL,
    due_offset_anchor VARCHAR(64),
    due_offset_days SMALLINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
    CONSTRAINT fk_corporate_pricing_milestones_catalog FOREIGN KEY (catalog_id)
        REFERENCES public.corporate_pricing_catalogs(catalog_id) ON DELETE RESTRICT,
    CONSTRAINT uq_corporate_pricing_milestones_type
        UNIQUE (catalog_id, milestone_type),
    CONSTRAINT uq_corporate_pricing_milestones_sequence
        UNIQUE (catalog_id, sequence_number),
    CONSTRAINT chk_corporate_pricing_milestones_type CHECK (
        milestone_type IN ('DEPOSIT_INTAKE', 'NOTARY_READY', 'AHU_COMPLETE', 'OSS_COMPLETE')
    ),
    CONSTRAINT chk_corporate_pricing_milestones_sequence CHECK (
        sequence_number > 0
    ),
    CONSTRAINT chk_corporate_pricing_milestones_amount CHECK (amount > 0),
    CONSTRAINT chk_corporate_pricing_milestones_releasable_party CHECK (
        releasable_party IN (
            'JUSTICA', 'ASSIGNED_PROFESSIONAL', 'NOTARY',
            'GOVERNMENT', 'PROVIDER', 'CLIENT'
        )
    ),
    CONSTRAINT chk_corporate_pricing_milestones_evidence_condition CHECK (
        pg_catalog.btrim(evidence_condition) <> ''
    ),
    CONSTRAINT chk_corporate_pricing_milestones_dispute_refund_rule CHECK (
        pg_catalog.btrim(dispute_refund_rule) <> ''
    ),
    CONSTRAINT chk_corporate_pricing_milestones_due_offset CHECK (
        (due_offset_anchor IS NULL AND due_offset_days IS NULL)
        OR (
            due_offset_anchor IS NOT NULL
            AND pg_catalog.btrim(due_offset_anchor) <> ''
            AND due_offset_days >= 0
        )
    )
);

COMMENT ON TABLE public.corporate_pricing_catalogs IS
    'Versioned internal corporate quote catalog. Browser access is intentionally default-deny.';
COMMENT ON COLUMN public.corporate_pricing_milestones.due_offset_anchor IS
    'Stable server-defined lifecycle anchor for a relative due offset; never an absolute browser timestamp.';

CREATE OR REPLACE FUNCTION public.fn_touch_corporate_pricing_record_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := pg_catalog.clock_timestamp();
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_guard_corporate_pricing_catalog_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.status <> 'DRAFT' THEN
            RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_IMMUTABLE';
        END IF;
        RETURN OLD;
    END IF;

    IF OLD.status = 'DRAFT' THEN
        IF NEW.status = 'DRAFT' THEN
            RETURN NEW;
        END IF;
        IF NEW.status = 'ACTIVE'
           AND pg_catalog.current_setting(
               'justifiqa.corporate_pricing_activation',
               true
           ) = OLD.catalog_id::TEXT THEN
            RETURN NEW;
        END IF;
        RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_TRANSITION_FORBIDDEN';
    END IF;

    IF OLD.status = 'ACTIVE'
       AND NEW.status = 'RETIRED'
       AND pg_catalog.current_setting(
           'justifiqa.corporate_pricing_retirement',
           true
       ) = OLD.catalog_id::TEXT THEN
        IF (
            NEW.service_type,
            NEW.quote_version,
            NEW.legal_scope_version,
            NEW.currency,
            NEW.total_amount_idr,
            NEW.effective_from,
            NEW.effective_until,
            NEW.created_at
        ) IS DISTINCT FROM (
            OLD.service_type,
            OLD.quote_version,
            OLD.legal_scope_version,
            OLD.currency,
            OLD.total_amount_idr,
            OLD.effective_from,
            OLD.effective_until,
            OLD.created_at
        ) THEN
            RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_IMMUTABLE';
        END IF;
        RETURN NEW;
    END IF;

    IF OLD.status = 'ACTIVE' AND NEW.status <> OLD.status THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_TRANSITION_FORBIDDEN';
    END IF;

    RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_IMMUTABLE';
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_guard_corporate_pricing_catalog_child_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_old_catalog_id UUID;
    v_new_catalog_id UUID;
    v_catalog_status VARCHAR(16);
BEGIN
    IF TG_OP <> 'INSERT' THEN
        v_old_catalog_id := OLD.catalog_id;
    END IF;

    IF TG_OP <> 'DELETE' THEN
        v_new_catalog_id := NEW.catalog_id;
    END IF;

    FOR v_catalog_status IN
        SELECT catalog.status
        FROM public.corporate_pricing_catalogs AS catalog
        WHERE catalog.catalog_id = ANY (ARRAY[v_old_catalog_id, v_new_catalog_id])
        ORDER BY catalog.catalog_id
        FOR KEY SHARE
    LOOP
        IF v_catalog_status IN ('ACTIVE', 'RETIRED') THEN
            RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_CHILD_IMMUTABLE';
        END IF;
    END LOOP;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_activate_corporate_pricing_catalog(
    p_catalog_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_catalog public.corporate_pricing_catalogs%ROWTYPE;
    v_fee_total NUMERIC(18,2);
    v_milestone_total NUMERIC(18,2);
    v_fee_count INTEGER;
    v_milestone_count INTEGER;
BEGIN
    SELECT catalog.*
    INTO v_catalog
    FROM public.corporate_pricing_catalogs AS catalog
    WHERE catalog.catalog_id = p_catalog_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_NOT_FOUND';
    END IF;
    IF v_catalog.status <> 'DRAFT' THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_NOT_DRAFT';
    END IF;

    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(v_catalog.service_type, 0)
    );

    IF EXISTS (
        SELECT 1
        FROM public.corporate_pricing_catalogs AS catalog
        WHERE catalog.service_type = v_catalog.service_type
          AND catalog.status = 'ACTIVE'
          AND catalog.catalog_id <> v_catalog.catalog_id
    ) THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_ACTIVE_EXISTS';
    END IF;

    SELECT COALESCE(SUM(line.amount), 0), COUNT(*)
    INTO v_fee_total, v_fee_count
    FROM public.corporate_pricing_fee_lines AS line
    WHERE line.catalog_id = p_catalog_id;

    SELECT COALESCE(SUM(milestone.amount), 0), COUNT(*)
    INTO v_milestone_total, v_milestone_count
    FROM public.corporate_pricing_milestones AS milestone
    WHERE milestone.catalog_id = p_catalog_id;

    IF v_fee_count = 0
       OR v_milestone_count = 0
       OR v_fee_total IS DISTINCT FROM v_catalog.total_amount_idr
       OR v_milestone_total IS DISTINCT FROM v_catalog.total_amount_idr THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_TOTAL_MISMATCH';
    END IF;

    PERFORM pg_catalog.set_config(
        'justifiqa.corporate_pricing_activation',
        p_catalog_id::TEXT,
        true
    );

    UPDATE public.corporate_pricing_catalogs
    SET status = 'ACTIVE'
    WHERE catalog_id = p_catalog_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_retire_corporate_pricing_catalog(
    p_catalog_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_catalog public.corporate_pricing_catalogs%ROWTYPE;
BEGIN
    SELECT catalog.*
    INTO v_catalog
    FROM public.corporate_pricing_catalogs AS catalog
    WHERE catalog.catalog_id = p_catalog_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_NOT_FOUND';
    END IF;
    IF v_catalog.status <> 'ACTIVE' THEN
        RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_NOT_ACTIVE';
    END IF;

    PERFORM pg_catalog.set_config(
        'justifiqa.corporate_pricing_retirement',
        p_catalog_id::TEXT,
        true
    );

    UPDATE public.corporate_pricing_catalogs
    SET status = 'RETIRED'
    WHERE catalog_id = p_catalog_id;
END;
$$;

CREATE TRIGGER trg_guard_corporate_pricing_catalog_mutation
BEFORE UPDATE OR DELETE ON public.corporate_pricing_catalogs
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_corporate_pricing_catalog_mutation();

CREATE TRIGGER trg_guard_corporate_pricing_fee_lines_mutation
BEFORE INSERT OR UPDATE OR DELETE ON public.corporate_pricing_fee_lines
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_corporate_pricing_catalog_child_mutation();

CREATE TRIGGER trg_guard_corporate_pricing_milestones_mutation
BEFORE INSERT OR UPDATE OR DELETE ON public.corporate_pricing_milestones
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_corporate_pricing_catalog_child_mutation();

CREATE TRIGGER trg_touch_corporate_pricing_catalogs
BEFORE UPDATE ON public.corporate_pricing_catalogs
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_corporate_pricing_record_updated_at();

CREATE TRIGGER trg_touch_corporate_pricing_fee_lines
BEFORE UPDATE ON public.corporate_pricing_fee_lines
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_corporate_pricing_record_updated_at();

CREATE TRIGGER trg_touch_corporate_pricing_milestones
BEFORE UPDATE ON public.corporate_pricing_milestones
FOR EACH ROW EXECUTE FUNCTION public.fn_touch_corporate_pricing_record_updated_at();

ALTER TABLE public.corporate_pricing_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_pricing_catalogs FORCE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_pricing_fee_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_pricing_fee_lines FORCE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_pricing_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_pricing_milestones FORCE ROW LEVEL SECURITY;

ALTER TABLE public.corporate_pricing_catalogs ENABLE ALWAYS TRIGGER trg_guard_corporate_pricing_catalog_mutation;
ALTER TABLE public.corporate_pricing_fee_lines ENABLE ALWAYS TRIGGER trg_guard_corporate_pricing_fee_lines_mutation;
ALTER TABLE public.corporate_pricing_milestones ENABLE ALWAYS TRIGGER trg_guard_corporate_pricing_milestones_mutation;

REVOKE ALL ON TABLE public.corporate_pricing_catalogs,
    public.corporate_pricing_fee_lines,
    public.corporate_pricing_milestones
    FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public.fn_touch_corporate_pricing_record_updated_at(),
    public.fn_guard_corporate_pricing_catalog_mutation(),
    public.fn_guard_corporate_pricing_catalog_child_mutation(),
    public.fn_activate_corporate_pricing_catalog(UUID),
    public.fn_retire_corporate_pricing_catalog(UUID)
    FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.fn_activate_corporate_pricing_catalog(UUID),
    public.fn_retire_corporate_pricing_catalog(UUID)
    TO postgres;
