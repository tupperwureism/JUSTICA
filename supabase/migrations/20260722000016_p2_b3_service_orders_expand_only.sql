-- ============================================================================
-- P2-B0 + P2-B3: baseline reconciliation and expand-only service order seam
-- PostgreSQL 17 / Supabase
-- ============================================================================

-- BASE-01: retire both the legacy checkout facade and the internal four-argument
-- primitive. The authenticated checkout contract below is the sole canonical RPC.
DROP FUNCTION IF EXISTS public.fn_client_checkout_consultation_mutex(UUID, TEXT, VARCHAR);
DROP FUNCTION IF EXISTS public.fn_book_consultation_slot_mutex(UUID, UUID, VARCHAR, TEXT);

CREATE OR REPLACE FUNCTION public.fn_book_consultation_slot_mutex(
    p_slot_id UUID,
    p_case_summary TEXT,
    p_booking_type VARCHAR DEFAULT 'STANDARD'
)
RETURNS TABLE (
    booking_id UUID,
    booking_code VARCHAR,
    escrow_id UUID,
    slot_id UUID,
    tier_id UUID,
    advocate_id UUID,
    advocate_name VARCHAR,
    amount_idr NUMERIC,
    escrow_status VARCHAR,
    created_at TIMESTAMPTZ,
    mutex_lock_id VARCHAR,
    payment_gateway_ref VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_client_id UUID := auth.uid();
    v_claims JSONB := auth.jwt();
    v_advocate_id UUID;
    v_advocate_name VARCHAR(128);
    v_tier_id UUID;
    v_slot_status VARCHAR(32);
    v_start_time TIMESTAMPTZ;
    v_price NUMERIC(15,2);
    v_wallet_id UUID;
    v_available NUMERIC(15,2);
    v_held NUMERIC(15,2);
    v_booking_id UUID := extensions.gen_random_uuid();
    v_escrow_id UUID := extensions.gen_random_uuid();
    v_booking_code VARCHAR(32);
    v_mutex_lock_id VARCHAR(64);
    v_payment_ref VARCHAR(64);
    v_now TIMESTAMPTZ := clock_timestamp();
    v_nik VARCHAR(16);
BEGIN
    IF v_client_id IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED: Sesi Klien tidak ditemukan.';
    END IF;
    IF coalesce(v_claims -> 'user_metadata' ->> 'role', '') <> 'CLIENT' THEN
        RAISE EXCEPTION 'ROLE_FORBIDDEN: Hanya akun CLIENT yang dapat melakukan checkout.';
    END IF;
    IF nullif(trim(p_case_summary), '') IS NULL THEN
        RAISE EXCEPTION 'CASE_SUMMARY_REQUIRED: Ringkasan perkara wajib diisi.';
    END IF;

    v_nik := nullif(v_claims -> 'user_metadata' ->> 'nik', '');
    IF v_nik IS NOT NULL AND length(v_nik) <> 16 THEN
        v_nik := NULL;
    END IF;

    INSERT INTO public.users_client (
        client_id, full_name, email, phone_e164, nik_ktp, kyc_status, password_hash
    ) VALUES (
        v_client_id,
        coalesce(nullif(v_claims -> 'user_metadata' ->> 'full_name', ''), 'Klien Justica'),
        coalesce(nullif(v_claims ->> 'email', ''), v_client_id::TEXT || '@gotrue.local'),
        coalesce(nullif(v_claims -> 'user_metadata' ->> 'phone', ''), '+620000000000'),
        v_nik,
        'UNVERIFIED',
        '!GOTRUE_MANAGED!'
    ) ON CONFLICT (client_id) DO NOTHING;

    SELECT slot.advocate_id, advocate.full_name, slot.tier_id, slot.status,
           slot.start_time, tier.price_idr
    INTO v_advocate_id, v_advocate_name, v_tier_id, v_slot_status,
         v_start_time, v_price
    FROM public.consultation_slots AS slot
    JOIN public.users_advocate AS advocate ON advocate.advocate_id = slot.advocate_id
    JOIN public.advocate_service_tiers AS tier ON tier.tier_id = slot.tier_id
    WHERE slot.slot_id = p_slot_id
      AND tier.is_active = true
    FOR UPDATE OF slot;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'SLOT_NOT_FOUND: Slot tidak ditemukan atau tier tidak aktif.';
    END IF;
    IF v_slot_status <> 'AVAILABLE' OR v_start_time <= v_now THEN
        RAISE EXCEPTION 'SLOT_ALREADY_BOOKED: Slot sudah dipesan atau telah kedaluwarsa.';
    END IF;

    IF v_price > 0 THEN
        SELECT wallet.wallet_id, wallet.balance_available_idr, wallet.balance_held_idr
        INTO v_wallet_id, v_available, v_held
        FROM public.wallet_balances AS wallet
        WHERE wallet.user_id = v_client_id
          AND wallet.user_type = 'CLIENT'
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'WALLET_NOT_FOUND: Dompet Klien belum tersedia.';
        END IF;
        IF v_available < v_price THEN
            RAISE EXCEPTION 'INSUFFICIENT_FUNDS: Saldo Klien tidak mencukupi.';
        END IF;

        UPDATE public.wallet_balances
        SET balance_available_idr = v_available - v_price,
            balance_held_idr = v_held + v_price,
            updated_at = v_now
        WHERE wallet_id = v_wallet_id;
    END IF;

    UPDATE public.consultation_slots
    SET status = 'BOOKED',
        is_mutex_locked = true,
        updated_at = v_now
    WHERE consultation_slots.slot_id = p_slot_id;

    v_booking_code := 'REQ-' || to_char(v_now, 'YYYYMMDD') || '-' ||
        upper(substr(replace(v_booking_id::TEXT, '-', ''), 1, 12));
    v_mutex_lock_id := 'MUTEX-' || upper(replace(v_escrow_id::TEXT, '-', ''));
    v_payment_ref := 'WALLET-' ||
        upper(substr(replace(extensions.gen_random_uuid()::TEXT, '-', ''), 1, 24));

    INSERT INTO public.booking_sessions (
        booking_id, client_id, advocate_id, slot_id, booking_code, status,
        case_summary, meeting_method, booked_price_idr, created_at, updated_at
    ) VALUES (
        v_booking_id, v_client_id, v_advocate_id, p_slot_id, v_booking_code,
        'SCHEDULED', trim(p_case_summary),
        CASE WHEN upper(p_booking_type) = 'OFFLINE' THEN 'OFFLINE' ELSE 'ONLINE' END,
        v_price, v_now, v_now
    );

    INSERT INTO public.escrow_transactions (
        escrow_id, booking_id, client_id, advocate_id, total_amount_idr, status,
        holding_expires_at, payment_gateway_ref, is_mutex_locked, mutex_lock_id,
        created_at, updated_at
    ) VALUES (
        v_escrow_id, v_booking_id, v_client_id, v_advocate_id, v_price,
        'HELD_IN_ESCROW', v_now + INTERVAL '24 hours', v_payment_ref, true,
        v_mutex_lock_id, v_now, v_now
    );

    RETURN QUERY
    SELECT v_booking_id, v_booking_code, v_escrow_id, p_slot_id, v_tier_id,
           v_advocate_id, v_advocate_name, v_price, 'HELD_IN_ESCROW'::VARCHAR,
           v_now, v_mutex_lock_id, v_payment_ref;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_book_consultation_slot_mutex(UUID, TEXT, VARCHAR)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_book_consultation_slot_mutex(UUID, TEXT, VARCHAR)
    TO authenticated;

COMMENT ON FUNCTION public.fn_book_consultation_slot_mutex(UUID, TEXT, VARCHAR) IS
    'Canonical authenticated consultation checkout mutex. Locks slot and wallet, then creates the booking and HELD escrow atomically.';

-- BASE-04: remove public row access and expose only an allow-listed projection.
ALTER TABLE public.emeterai_stamping_logs
    ADD COLUMN IF NOT EXISTS public_verification_token UUID
    NOT NULL DEFAULT extensions.gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS uq_emeterai_public_verification_token
    ON public.emeterai_stamping_logs(public_verification_token);

DROP POLICY IF EXISTS rls_emeterai_public_verify ON public.emeterai_stamping_logs;
DROP POLICY IF EXISTS rls_emeterai_participant_read ON public.emeterai_stamping_logs;
CREATE POLICY rls_emeterai_participant_read
ON public.emeterai_stamping_logs
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.legal_opinions AS opinion
        WHERE opinion.opinion_id = emeterai_stamping_logs.opinion_id
          AND auth.uid() IN (opinion.client_id, opinion.advocate_id)
    )
);

REVOKE SELECT ON TABLE public.emeterai_stamping_logs FROM PUBLIC, anon;
GRANT SELECT ON TABLE public.emeterai_stamping_logs TO authenticated;

CREATE OR REPLACE FUNCTION public.fn_verify_public_legal_document(p_sha256_hash TEXT)
RETURNS TABLE (
    verification_id UUID,
    digest_match BOOLEAN,
    document_type VARCHAR,
    document_title VARCHAR,
    finalized_at TIMESTAMPTZ,
    signature_provider_status VARCHAR,
    emeterai_serial VARCHAR,
    emeterai_status VARCHAR,
    warning VARCHAR
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
SET statement_timeout = '2s'
AS $$
DECLARE
    v_digest TEXT := lower(trim(p_sha256_hash));
BEGIN
    IF v_digest !~ '^[0-9a-f]{64}$' THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT stamp.public_verification_token,
           true,
           'LEGAL_OPINION'::VARCHAR,
           opinion.document_title,
           stamp.stamped_at,
           'NOT_RECORDED'::VARCHAR,
           stamp.peruri_serial_number,
           stamp.status,
           'Kecocokan digest tidak dengan sendirinya membuktikan keabsahan transaksi.'::VARCHAR
    FROM public.emeterai_stamping_logs AS stamp
    JOIN public.legal_opinions AS opinion ON opinion.opinion_id = stamp.opinion_id
    WHERE lower(stamp.sha256_document_hash) = v_digest
    ORDER BY stamp.stamped_at DESC
    LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_verify_public_legal_document(TEXT)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_verify_public_legal_document(TEXT)
    TO anon, authenticated;

COMMENT ON FUNCTION public.fn_verify_public_legal_document(TEXT) IS
    'Public allow-listed verification projection. Never returns identity, biometric, contact, storage, internal ownership, CDD, BO, or STR data.';

-- P2-B3: generic service-order seam. Existing consultation and escrow tables are
-- referenced only by foreign keys; their columns, policies, triggers, and RPCs are unchanged.
CREATE TABLE public.service_orders (
    order_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    client_id UUID NOT NULL,
    service_type VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    origin_booking_id UUID,
    assigned_professional_id UUID,
    currency CHAR(3) NOT NULL DEFAULT 'IDR',
    accepted_quote_version SMALLINT,
    submitted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT fk_service_orders_client FOREIGN KEY (client_id)
        REFERENCES public.users_client(client_id) ON DELETE RESTRICT,
    CONSTRAINT fk_service_orders_origin_booking FOREIGN KEY (origin_booking_id)
        REFERENCES public.booking_sessions(booking_id) ON DELETE RESTRICT,
    CONSTRAINT fk_service_orders_professional FOREIGN KEY (assigned_professional_id)
        REFERENCES public.users_advocate(advocate_id) ON DELETE RESTRICT,
    CONSTRAINT chk_service_orders_type CHECK (
        service_type IN ('PT_ORDINARY', 'PT_INDIVIDUAL_UMK', 'CV')
    ),
    CONSTRAINT chk_service_orders_status CHECK (
        status IN (
            'DRAFT', 'INTAKE_PENDING', 'PAYMENT_PENDING', 'ACTIVE',
            'COMPLIANCE_HOLD', 'CUSTOMER_ACTION_REQUIRED',
            'CANCELLED', 'COMPLETED'
        )
    ),
    CONSTRAINT chk_service_orders_currency CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_service_orders_quote_version CHECK (
        accepted_quote_version IS NULL OR accepted_quote_version > 0
    ),
    CONSTRAINT chk_service_orders_lifecycle CHECK (
        (status = 'DRAFT' OR submitted_at IS NOT NULL)
        AND (status <> 'COMPLETED' OR completed_at IS NOT NULL)
        AND (completed_at IS NULL OR submitted_at IS NOT NULL)
        AND (completed_at IS NULL OR completed_at >= submitted_at)
    )
);

CREATE TABLE public.service_fee_lines (
    fee_line_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    order_id UUID NOT NULL,
    fee_line_code VARCHAR(64) NOT NULL,
    fee_type VARCHAR(32) NOT NULL,
    description VARCHAR(256) NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'IDR',
    quote_version SMALLINT NOT NULL DEFAULT 1,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT fk_service_fee_lines_order FOREIGN KEY (order_id)
        REFERENCES public.service_orders(order_id) ON DELETE RESTRICT,
    CONSTRAINT uq_service_fee_lines_code_version
        UNIQUE (order_id, quote_version, fee_line_code),
    CONSTRAINT chk_service_fee_lines_type CHECK (
        fee_type IN (
            'JUSTICA_FEE', 'NOTARY_FEE', 'PNBP', 'PSRE', 'EKYC',
            'EMETERAI', 'TAX', 'OTHER_APPROVED'
        )
    ),
    CONSTRAINT chk_service_fee_lines_amount CHECK (amount >= 0),
    CONSTRAINT chk_service_fee_lines_currency CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_service_fee_lines_quote_version CHECK (quote_version > 0),
    CONSTRAINT chk_service_fee_lines_acceptance CHECK (
        accepted_at IS NULL OR accepted_at >= created_at
    )
);

CREATE TABLE public.payment_milestones (
    milestone_id UUID PRIMARY KEY DEFAULT extensions.gen_random_uuid(),
    order_id UUID NOT NULL,
    milestone_type VARCHAR(32) NOT NULL,
    sequence_number SMALLINT NOT NULL,
    amount NUMERIC(15,2) NOT NULL,
    currency CHAR(3) NOT NULL DEFAULT 'IDR',
    quote_version SMALLINT NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    releasable_party VARCHAR(32) NOT NULL,
    evidence_condition VARCHAR(512) NOT NULL,
    dispute_refund_rule VARCHAR(1024) NOT NULL,
    due_at TIMESTAMPTZ,
    funded_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
    CONSTRAINT fk_payment_milestones_order FOREIGN KEY (order_id)
        REFERENCES public.service_orders(order_id) ON DELETE RESTRICT,
    CONSTRAINT uq_payment_milestones_type_version
        UNIQUE (order_id, quote_version, milestone_type),
    CONSTRAINT uq_payment_milestones_sequence_version
        UNIQUE (order_id, quote_version, sequence_number),
    CONSTRAINT chk_payment_milestones_type CHECK (
        milestone_type IN ('DEPOSIT_INTAKE', 'NOTARY_READY', 'AHU_COMPLETE', 'OSS_COMPLETE')
    ),
    CONSTRAINT chk_payment_milestones_sequence CHECK (sequence_number > 0),
    CONSTRAINT chk_payment_milestones_amount CHECK (amount >= 0),
    CONSTRAINT chk_payment_milestones_currency CHECK (currency ~ '^[A-Z]{3}$'),
    CONSTRAINT chk_payment_milestones_quote_version CHECK (quote_version > 0),
    CONSTRAINT chk_payment_milestones_status CHECK (
        status IN (
            'DRAFT', 'PENDING', 'FUNDED', 'RELEASABLE', 'RELEASED',
            'DISPUTED', 'REFUNDED', 'CANCELLED'
        )
    ),
    CONSTRAINT chk_payment_milestones_releasable_party CHECK (
        releasable_party IN (
            'JUSTICA', 'ASSIGNED_PROFESSIONAL', 'NOTARY',
            'GOVERNMENT', 'PROVIDER', 'CLIENT'
        )
    ),
    CONSTRAINT chk_payment_milestones_timestamps CHECK (
        (funded_at IS NULL OR funded_at >= created_at)
        AND (released_at IS NULL OR funded_at IS NOT NULL)
        AND (released_at IS NULL OR released_at >= funded_at)
        AND (status <> 'RELEASED' OR released_at IS NOT NULL)
    )
);

CREATE INDEX idx_service_orders_client_status
    ON public.service_orders(client_id, status, created_at DESC);
CREATE INDEX idx_service_orders_professional_status
    ON public.service_orders(assigned_professional_id, status, created_at DESC)
    WHERE assigned_professional_id IS NOT NULL;
CREATE INDEX idx_service_orders_origin_booking
    ON public.service_orders(origin_booking_id)
    WHERE origin_booking_id IS NOT NULL;
CREATE INDEX idx_service_fee_lines_order_quote
    ON public.service_fee_lines(order_id, quote_version, fee_type);
CREATE INDEX idx_service_fee_lines_accepted_quote
    ON public.service_fee_lines(order_id, quote_version)
    WHERE accepted_at IS NOT NULL;
CREATE INDEX idx_payment_milestones_order_status
    ON public.payment_milestones(order_id, status, sequence_number);

CREATE OR REPLACE FUNCTION public.fn_protect_accepted_service_fee_line()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' AND OLD.accepted_at IS NOT NULL THEN
        RAISE EXCEPTION 'ACCEPTED_FEE_LINE_IMMUTABLE: Accepted fee lines cannot be deleted.';
    END IF;
    IF TG_OP = 'UPDATE' AND OLD.accepted_at IS NOT NULL AND NEW IS DISTINCT FROM OLD THEN
        RAISE EXCEPTION 'ACCEPTED_FEE_LINE_IMMUTABLE: Accepted fee lines cannot be changed.';
    END IF;
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_accepted_service_fee_line
BEFORE UPDATE OR DELETE ON public.service_fee_lines
FOR EACH ROW EXECUTE FUNCTION public.fn_protect_accepted_service_fee_line();

CREATE OR REPLACE FUNCTION public.fn_protect_payment_milestone_terms()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.status <> 'DRAFT' THEN
            RAISE EXCEPTION 'MILESTONE_TERMS_IMMUTABLE: Non-draft milestones cannot be deleted.';
        END IF;
        RETURN OLD;
    END IF;
    IF OLD.status <> 'DRAFT' AND (
        NEW.order_id IS DISTINCT FROM OLD.order_id
        OR NEW.milestone_type IS DISTINCT FROM OLD.milestone_type
        OR NEW.sequence_number IS DISTINCT FROM OLD.sequence_number
        OR NEW.amount IS DISTINCT FROM OLD.amount
        OR NEW.currency IS DISTINCT FROM OLD.currency
        OR NEW.quote_version IS DISTINCT FROM OLD.quote_version
        OR NEW.releasable_party IS DISTINCT FROM OLD.releasable_party
        OR NEW.evidence_condition IS DISTINCT FROM OLD.evidence_condition
        OR NEW.dispute_refund_rule IS DISTINCT FROM OLD.dispute_refund_rule
    ) THEN
        RAISE EXCEPTION 'MILESTONE_TERMS_IMMUTABLE: Non-draft milestone financial terms cannot be changed.';
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_protect_payment_milestone_terms
BEFORE UPDATE OR DELETE ON public.payment_milestones
FOR EACH ROW EXECUTE FUNCTION public.fn_protect_payment_milestone_terms();

CREATE OR REPLACE FUNCTION public.fn_assert_service_order_financial_reconciliation()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID := coalesce(NEW.order_id, OLD.order_id);
    v_order public.service_orders%ROWTYPE;
    v_fee_total NUMERIC(15,2);
    v_milestone_total NUMERIC(15,2);
    v_fee_count INTEGER;
    v_milestone_count INTEGER;
BEGIN
    SELECT * INTO v_order
    FROM public.service_orders
    WHERE order_id = v_order_id;

    IF NOT FOUND OR v_order.status = 'DRAFT' THEN
        RETURN coalesce(NEW, OLD);
    END IF;
    IF v_order.accepted_quote_version IS NULL THEN
        RAISE EXCEPTION 'ACCEPTED_QUOTE_REQUIRED: Non-draft service order requires an accepted quote version.';
    END IF;
    IF EXISTS (
        SELECT 1 FROM public.service_fee_lines
        WHERE order_id = v_order_id
          AND quote_version = v_order.accepted_quote_version
          AND accepted_at IS NOT NULL
          AND currency <> v_order.currency
    ) OR EXISTS (
        SELECT 1 FROM public.payment_milestones
        WHERE order_id = v_order_id
          AND quote_version = v_order.accepted_quote_version
          AND status <> 'CANCELLED'
          AND currency <> v_order.currency
    ) THEN
        RAISE EXCEPTION 'SERVICE_ORDER_CURRENCY_MISMATCH: Accepted fees and active milestones must use the order currency.';
    END IF;

    SELECT coalesce(sum(amount), 0), count(*)
    INTO v_fee_total, v_fee_count
    FROM public.service_fee_lines
    WHERE order_id = v_order_id
      AND quote_version = v_order.accepted_quote_version
      AND accepted_at IS NOT NULL
      AND currency = v_order.currency;

    SELECT coalesce(sum(amount), 0), count(*)
    INTO v_milestone_total, v_milestone_count
    FROM public.payment_milestones
    WHERE order_id = v_order_id
      AND quote_version = v_order.accepted_quote_version
      AND status <> 'CANCELLED'
      AND currency = v_order.currency;

    IF v_fee_count = 0 OR v_milestone_count = 0 OR v_fee_total <> v_milestone_total THEN
        RAISE EXCEPTION
            'SERVICE_ORDER_FINANCIAL_MISMATCH: Accepted fees (%) must equal active milestones (%).',
            v_fee_total, v_milestone_total;
    END IF;
    RETURN coalesce(NEW, OLD);
END;
$$;

CREATE CONSTRAINT TRIGGER trg_reconcile_service_order
AFTER INSERT OR UPDATE ON public.service_orders
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.fn_assert_service_order_financial_reconciliation();

CREATE CONSTRAINT TRIGGER trg_reconcile_service_fee_lines
AFTER INSERT OR UPDATE OR DELETE ON public.service_fee_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.fn_assert_service_order_financial_reconciliation();

CREATE CONSTRAINT TRIGGER trg_reconcile_payment_milestones
AFTER INSERT OR UPDATE OR DELETE ON public.payment_milestones
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION public.fn_assert_service_order_financial_reconciliation();

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders FORCE ROW LEVEL SECURITY;
ALTER TABLE public.service_fee_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_fee_lines FORCE ROW LEVEL SECURITY;
ALTER TABLE public.payment_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_milestones FORCE ROW LEVEL SECURITY;

CREATE POLICY rls_service_orders_participant_read
ON public.service_orders
FOR SELECT TO authenticated
USING (
    client_id = auth.uid()
    OR (
        assigned_professional_id = auth.uid()
        AND public.fn_is_verified_advocate(auth.uid())
    )
    OR EXISTS (
        SELECT 1 FROM public.users_admin AS admin_user
        WHERE admin_user.admin_id = auth.uid()
          AND admin_user.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
    )
);

CREATE POLICY rls_service_fee_lines_participant_read
ON public.service_fee_lines
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.service_orders AS service_order
        WHERE service_order.order_id = service_fee_lines.order_id
          AND (
              service_order.client_id = auth.uid()
              OR (
                  service_order.assigned_professional_id = auth.uid()
                  AND public.fn_is_verified_advocate(auth.uid())
              )
              OR EXISTS (
                  SELECT 1 FROM public.users_admin AS admin_user
                  WHERE admin_user.admin_id = auth.uid()
                    AND admin_user.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
              )
          )
    )
);

CREATE POLICY rls_payment_milestones_participant_read
ON public.payment_milestones
FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.service_orders AS service_order
        WHERE service_order.order_id = payment_milestones.order_id
          AND (
              service_order.client_id = auth.uid()
              OR (
                  service_order.assigned_professional_id = auth.uid()
                  AND public.fn_is_verified_advocate(auth.uid())
              )
              OR EXISTS (
                  SELECT 1 FROM public.users_admin AS admin_user
                  WHERE admin_user.admin_id = auth.uid()
                    AND admin_user.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
              )
          )
    )
);

REVOKE ALL ON TABLE public.service_orders, public.service_fee_lines,
    public.payment_milestones FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.service_orders, public.service_fee_lines,
    public.payment_milestones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.service_orders,
    public.service_fee_lines, public.payment_milestones TO service_role;

REVOKE ALL ON FUNCTION public.fn_protect_accepted_service_fee_line(),
    public.fn_protect_payment_milestone_terms(),
    public.fn_assert_service_order_financial_reconciliation()
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_protect_accepted_service_fee_line(),
    public.fn_protect_payment_milestone_terms(),
    public.fn_assert_service_order_financial_reconciliation()
    TO postgres;
