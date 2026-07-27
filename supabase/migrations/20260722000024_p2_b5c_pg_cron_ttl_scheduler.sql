-- P2-B5C: invoke the authenticated TTL Edge Function every five minutes.
-- Required Vault secret names:
--   p2_functions_base_url     e.g. https://<project-ref>.supabase.co/functions/v1
--   p2_ttl_sweeper_secret     same value as Edge secret TTL_SWEEPER_SECRET
-- The command deliberately becomes a no-op until both secrets are provisioned.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.fn_lock_corporate_escrow_webhook_atomic(
    p_order_id UUID,
    p_case_id UUID,
    p_escrow_id UUID,
    p_expected_amount_idr NUMERIC,
    p_payment_gateway_ref VARCHAR,
    p_idempotency_key VARCHAR
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
BEGIN
    SELECT corporate_case.*
    INTO v_case
    FROM public.corporate_service_cases AS corporate_case
    WHERE corporate_case.case_id = p_case_id
    FOR UPDATE;

    IF NOT FOUND OR v_case.order_id IS DISTINCT FROM p_order_id THEN
        RAISE EXCEPTION 'CORPORATE_ESCROW_WEBHOOK_ORDER_CASE_MISMATCH';
    END IF;

    RETURN QUERY
    SELECT lock_result.*
    FROM public.fn_lock_corporate_escrow_atomic(
        p_case_id,
        p_escrow_id,
        p_expected_amount_idr,
        p_payment_gateway_ref,
        p_idempotency_key,
        NULL
    ) AS lock_result;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_lock_corporate_escrow_webhook_atomic(
    UUID, UUID, UUID, NUMERIC, VARCHAR, VARCHAR
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_lock_corporate_escrow_webhook_atomic(
    UUID, UUID, UUID, NUMERIC, VARCHAR, VARCHAR
) TO service_role;

-- The provider callback must not race the TTL sweeper. This narrow orchestration
-- primitive records minimized callback metadata and invokes the B5B terminal
-- RPCs while holding the same envelope and party row locks.
CREATE OR REPLACE FUNCTION public.fn_process_ekyc_callback_atomic(
    p_envelope_id UUID,
    p_party_id UUID,
    p_user_id UUID,
    p_user_role public.ekyc_user_role,
    p_provider_name VARCHAR,
    p_provider_reference_id VARCHAR,
    p_verification_type public.ekyc_verification_type,
    p_outcome VARCHAR,
    p_liveness_attempt_count SMALLINT,
    p_result_digest_sha256 TEXT,
    p_verified_at TIMESTAMPTZ,
    p_idempotency_key VARCHAR
)
RETURNS TABLE (
    verification_id UUID,
    global_status public.signing_envelope_global_status,
    expired BOOLEAN,
    replayed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_envelope public.signing_envelopes%ROWTYPE;
    v_party public.signing_envelope_parties%ROWTYPE;
    v_existing public.ekyc_verification_logs%ROWTYPE;
    v_verification public.ekyc_verification_logs%ROWTYPE;
    v_status public.ekyc_verification_status;
    v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
    v_previous_attempts INTEGER;
    v_ttl_key VARCHAR(48);
    v_replayed BOOLEAN := false;
BEGIN
    IF p_envelope_id IS NULL OR p_party_id IS NULL OR p_user_id IS NULL THEN
        RAISE EXCEPTION 'EKYC_CALLBACK_SUBJECT_REQUIRED';
    END IF;
    IF p_provider_name IS NULL OR pg_catalog.btrim(p_provider_name) = ''
       OR pg_catalog.length(p_provider_name) > 64
       OR p_provider_reference_id IS NULL
       OR pg_catalog.btrim(p_provider_reference_id) = ''
       OR pg_catalog.length(p_provider_reference_id) > 192 THEN
        RAISE EXCEPTION 'EKYC_CALLBACK_PROVIDER_REFERENCE_INVALID';
    END IF;
    IF p_outcome NOT IN (
        'PASSED',
        'LIVENESS_FAILED',
        'ILLEGAL_CONFIRMED',
        'REQUIRES_MANUAL_REVIEW'
    ) THEN
        RAISE EXCEPTION 'EKYC_CALLBACK_OUTCOME_INVALID';
    END IF;
    IF p_result_digest_sha256 IS NULL
       OR p_result_digest_sha256 !~ '^[0-9a-f]{64}$'
       OR p_verified_at IS NULL THEN
        RAISE EXCEPTION 'EKYC_CALLBACK_EVIDENCE_METADATA_INVALID';
    END IF;
    IF p_idempotency_key IS NULL
       OR pg_catalog.btrim(p_idempotency_key) = ''
       OR pg_catalog.length(p_idempotency_key) > 48 THEN
        RAISE EXCEPTION 'EKYC_CALLBACK_IDEMPOTENCY_KEY_INVALID';
    END IF;
    IF (
        p_outcome = 'LIVENESS_FAILED'
        AND (
            p_verification_type <> 'LIVENESS_OCR'
            OR p_liveness_attempt_count NOT BETWEEN 1 AND 3
        )
    ) OR (
        p_outcome <> 'LIVENESS_FAILED'
        AND p_liveness_attempt_count <> 0
    ) THEN
        RAISE EXCEPTION 'EKYC_CALLBACK_LIVENESS_ATTEMPT_INVALID';
    END IF;

    v_status := CASE p_outcome
        WHEN 'PASSED' THEN 'PASSED'::public.ekyc_verification_status
        WHEN 'REQUIRES_MANUAL_REVIEW'
            THEN 'REQUIRES_MANUAL_REVIEW'::public.ekyc_verification_status
        ELSE 'REJECTED'::public.ekyc_verification_status
    END;

    SELECT signing_envelope.*
    INTO v_envelope
    FROM public.signing_envelopes AS signing_envelope
    WHERE signing_envelope.envelope_id = p_envelope_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'EKYC_CALLBACK_ENVELOPE_NOT_FOUND';
    END IF;

    SELECT verification.*
    INTO v_existing
    FROM public.ekyc_verification_logs AS verification
    WHERE verification.provider_name = pg_catalog.btrim(p_provider_name)
      AND verification.provider_reference_id =
          pg_catalog.btrim(p_provider_reference_id)
    FOR UPDATE;

    IF FOUND THEN
        v_replayed := true;
        IF v_existing.envelope_id IS DISTINCT FROM p_envelope_id
           OR v_existing.party_id IS DISTINCT FROM p_party_id
           OR v_existing.user_id IS DISTINCT FROM p_user_id
           OR v_existing.user_role IS DISTINCT FROM p_user_role
           OR v_existing.verification_type IS DISTINCT FROM p_verification_type
           OR v_existing.status IS DISTINCT FROM v_status
           OR v_existing.liveness_attempt_count IS DISTINCT FROM
                p_liveness_attempt_count
           OR v_existing.result_digest_sha256 IS DISTINCT FROM
                p_result_digest_sha256
           OR v_existing.verified_at IS DISTINCT FROM p_verified_at THEN
            RAISE EXCEPTION 'EKYC_CALLBACK_IDEMPOTENCY_CONFLICT';
        END IF;
    END IF;

    IF v_envelope.expires_at IS NULL THEN
        RAISE EXCEPTION 'EKYC_CALLBACK_WINDOW_NOT_STARTED';
    END IF;
    IF v_envelope.global_status = 'ACTIVE'
       AND v_now >= v_envelope.expires_at THEN
        v_ttl_key := pg_catalog.substr(
            pg_catalog.encode(
                extensions.digest(
                    'ttl-expired:' || p_envelope_id::TEXT,
                    'sha256'
                ),
                'hex'
            ),
            1,
            48
        );
        PERFORM public.fn_global_halt_ekyc_and_refund_atomic(
            p_envelope_id,
            NULL,
            NULL,
            'TTL_EXPIRED',
            v_ttl_key,
            NULL
        );
        RETURN QUERY
        SELECT
            NULL::UUID,
            'REFUNDED'::public.signing_envelope_global_status,
            true,
            false;
        RETURN;
    END IF;
    IF v_envelope.global_status <> 'ACTIVE' THEN
        IF v_replayed THEN
            RETURN QUERY
            SELECT
                v_existing.verification_id,
                v_envelope.global_status,
                false,
                true;
            RETURN;
        END IF;
        RAISE EXCEPTION 'EKYC_CALLBACK_ENVELOPE_NOT_ACTIVE';
    END IF;

    IF v_replayed THEN
        IF p_outcome = 'ILLEGAL_CONFIRMED' THEN
            PERFORM public.fn_confirm_party_illegal_atomic(
                p_envelope_id,
                p_party_id,
                v_existing.verification_id,
                p_idempotency_key,
                NULL
            );
            PERFORM public.fn_global_halt_ekyc_and_refund_atomic(
                p_envelope_id,
                p_party_id,
                v_existing.verification_id,
                'PARTY_ILLEGAL',
                p_idempotency_key,
                NULL
            );
            v_envelope.global_status := 'REFUNDED';
        ELSIF p_outcome = 'LIVENESS_FAILED'
              AND p_liveness_attempt_count = 3 THEN
            PERFORM public.fn_global_halt_ekyc_and_refund_atomic(
                p_envelope_id,
                p_party_id,
                v_existing.verification_id,
                'LIVENESS_FAILED_3X',
                p_idempotency_key,
                NULL
            );
            v_envelope.global_status := 'REFUNDED';
        END IF;
        RETURN QUERY
        SELECT
            v_existing.verification_id,
            v_envelope.global_status,
            false,
            true;
        RETURN;
    END IF;

    SELECT signing_party.*
    INTO v_party
    FROM public.signing_envelope_parties AS signing_party
    WHERE signing_party.envelope_id = p_envelope_id
      AND signing_party.party_id = p_party_id
    FOR UPDATE;

    IF NOT FOUND OR v_party.party_user_id <> p_user_id THEN
        RAISE EXCEPTION 'EKYC_CALLBACK_PARTY_SCOPE_MISMATCH';
    END IF;
    IF (v_party.party_role = 'CLIENT' AND p_user_role <> 'client')
       OR (v_party.party_role = 'ADVOCATE' AND p_user_role <> 'advocate')
       OR v_party.party_role NOT IN ('CLIENT', 'ADVOCATE')
       OR (
           p_verification_type = 'SIPP_BIOMETRIC'
           AND v_party.party_role <> 'ADVOCATE'
       ) THEN
        RAISE EXCEPTION 'EKYC_CALLBACK_ROLE_VERIFICATION_MISMATCH';
    END IF;

    IF p_outcome = 'LIVENESS_FAILED' THEN
        SELECT pg_catalog.count(*)::INTEGER
        INTO v_previous_attempts
        FROM public.ekyc_verification_logs AS verification
        WHERE verification.envelope_id = p_envelope_id
          AND verification.party_id = p_party_id
          AND verification.verification_type = 'LIVENESS_OCR'
          AND verification.status = 'REJECTED'
          AND verification.liveness_attempt_count BETWEEN 1
              AND p_liveness_attempt_count - 1;

        IF v_previous_attempts <> p_liveness_attempt_count - 1 THEN
            RAISE EXCEPTION 'EKYC_CALLBACK_LIVENESS_ATTEMPT_OUT_OF_SEQUENCE';
        END IF;
    END IF;

    INSERT INTO public.ekyc_verification_logs (
        envelope_id,
        party_id,
        user_id,
        user_role,
        provider_name,
        provider_reference_id,
        verification_type,
        status,
        liveness_attempt_count,
        result_digest_sha256,
        verified_at
    ) VALUES (
        p_envelope_id,
        p_party_id,
        p_user_id,
        p_user_role,
        pg_catalog.btrim(p_provider_name),
        pg_catalog.btrim(p_provider_reference_id),
        p_verification_type,
        v_status,
        p_liveness_attempt_count,
        p_result_digest_sha256,
        p_verified_at
    )
    RETURNING * INTO v_verification;

    IF p_outcome = 'ILLEGAL_CONFIRMED' THEN
        PERFORM public.fn_confirm_party_illegal_atomic(
            p_envelope_id,
            p_party_id,
            v_verification.verification_id,
            p_idempotency_key,
            NULL
        );
        PERFORM public.fn_global_halt_ekyc_and_refund_atomic(
            p_envelope_id,
            p_party_id,
            v_verification.verification_id,
            'PARTY_ILLEGAL',
            p_idempotency_key,
            NULL
        );
        v_envelope.global_status := 'REFUNDED';
    ELSIF p_outcome = 'LIVENESS_FAILED'
          AND p_liveness_attempt_count = 3 THEN
        PERFORM public.fn_global_halt_ekyc_and_refund_atomic(
            p_envelope_id,
            p_party_id,
            v_verification.verification_id,
            'LIVENESS_FAILED_3X',
            p_idempotency_key,
            NULL
        );
        v_envelope.global_status := 'REFUNDED';
    END IF;

    RETURN QUERY
    SELECT
        v_verification.verification_id,
        v_envelope.global_status,
        false,
        false;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_process_ekyc_callback_atomic(
    UUID, UUID, UUID, public.ekyc_user_role, VARCHAR, VARCHAR,
    public.ekyc_verification_type, VARCHAR, SMALLINT, TEXT, TIMESTAMPTZ, VARCHAR
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_process_ekyc_callback_atomic(
    UUID, UUID, UUID, public.ekyc_user_role, VARCHAR, VARCHAR,
    public.ekyc_verification_type, VARCHAR, SMALLINT, TEXT, TIMESTAMPTZ, VARCHAR
) TO service_role;

-- Force every provider write through the row-locked callback primitive.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
ON TABLE public.ekyc_verification_logs FROM service_role;
GRANT SELECT ON TABLE public.ekyc_verification_logs TO service_role;

DO $$
DECLARE
    v_existing_job_id BIGINT;
BEGIN
    SELECT job.jobid
    INTO v_existing_job_id
    FROM cron.job AS job
    WHERE job.jobname = 'p2-ekyc-ttl-sweeper';

    IF v_existing_job_id IS NOT NULL THEN
        PERFORM cron.unschedule(v_existing_job_id);
    END IF;
END;
$$;

SELECT cron.schedule(
    'p2-ekyc-ttl-sweeper',
    '*/5 * * * *',
    $schedule$
    SELECT net.http_post(
        url := config.functions_base_url || '/cron-ttl-sweeper',
        headers := pg_catalog.jsonb_build_object(
            'Content-Type', 'application/json',
            'x-cron-secret', config.sweeper_secret
        ),
        body := '{}'::JSONB,
        timeout_milliseconds := 10000
    )
    FROM (
        SELECT
            (
                SELECT secret.decrypted_secret
                FROM vault.decrypted_secrets AS secret
                WHERE secret.name = 'p2_functions_base_url'
                LIMIT 1
            ) AS functions_base_url,
            (
                SELECT secret.decrypted_secret
                FROM vault.decrypted_secrets AS secret
                WHERE secret.name = 'p2_ttl_sweeper_secret'
                LIMIT 1
            ) AS sweeper_secret
    ) AS config
    WHERE config.functions_base_url IS NOT NULL
      AND config.sweeper_secret IS NOT NULL;
    $schedule$
);
