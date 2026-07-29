INSERT INTO storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
VALUES (
    'corporate-intake-evidence',
    'corporate-intake-evidence',
    false,
    10485760,
    ARRAY['application/pdf', 'image/jpeg', 'image/png']::TEXT[]
)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE public.corporate_intake_evidence_artifacts (
    evidence_id UUID PRIMARY KEY,
    client_id UUID NOT NULL
        REFERENCES public.users_client(client_id) ON DELETE RESTRICT,
    evidence_type VARCHAR(32) NOT NULL
        CHECK (evidence_type = 'BENEFICIAL_OWNER_IDENTITY'),
    bucket_id VARCHAR(63) NOT NULL
        CHECK (bucket_id = 'corporate-intake-evidence'),
    object_path TEXT NOT NULL UNIQUE,
    storage_object_id UUID NULL,
    status VARCHAR(24) NOT NULL
        CHECK (status IN (
            'PENDING_UPLOAD', 'HASHED', 'CONSUMED', 'REJECTED', 'EXPIRED'
        )),
    declared_mime VARCHAR(64) NOT NULL
        CHECK (declared_mime IN (
            'application/pdf', 'image/jpeg', 'image/png'
        )),
    declared_byte_size BIGINT NOT NULL
        CHECK (declared_byte_size BETWEEN 1 AND 10485760),
    detected_mime VARCHAR(64) NULL
        CHECK (
            detected_mime IS NULL
            OR detected_mime IN ('application/pdf', 'image/jpeg', 'image/png')
        ),
    actual_byte_size BIGINT NULL
        CHECK (
            actual_byte_size IS NULL
            OR actual_byte_size BETWEEN 1 AND 10485760
        ),
    sha256_digest CHAR(64) NULL
        CHECK (
            sha256_digest IS NULL
            OR sha256_digest ~ '^[0-9a-f]{64}$'
        ),
    prepare_idempotency_key VARCHAR(48) NOT NULL
        CHECK (
            pg_catalog.btrim(prepare_idempotency_key) <> ''
            AND prepare_idempotency_key = pg_catalog.btrim(prepare_idempotency_key)
        ),
    finalize_idempotency_key VARCHAR(48) NULL
        CHECK (
            finalize_idempotency_key IS NULL
            OR (
                pg_catalog.btrim(finalize_idempotency_key) <> ''
                AND finalize_idempotency_key =
                    pg_catalog.btrim(finalize_idempotency_key)
            )
        ),
    rejection_code VARCHAR(64) NULL
        CHECK (
            rejection_code IS NULL
            OR rejection_code IN (
                'MIME_MISMATCH',
                'MAGIC_BYTES_INVALID',
                'SIZE_INVALID',
                'EMPTY_FILE'
            )
        ),
    expires_at TIMESTAMPTZ NOT NULL,
    finalized_at TIMESTAMPTZ NULL,
    consumed_order_id UUID NULL
        REFERENCES public.service_orders(order_id) ON DELETE RESTRICT,
    consumed_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT pg_catalog.clock_timestamp(),
    CONSTRAINT corporate_intake_evidence_prepare_key_unique
        UNIQUE (client_id, prepare_idempotency_key),
    CONSTRAINT corporate_intake_evidence_state_consistent CHECK (
        (
            status = 'PENDING_UPLOAD'
            AND storage_object_id IS NULL
            AND detected_mime IS NULL
            AND actual_byte_size IS NULL
            AND sha256_digest IS NULL
            AND finalize_idempotency_key IS NULL
            AND rejection_code IS NULL
            AND finalized_at IS NULL
            AND consumed_order_id IS NULL
            AND consumed_at IS NULL
        )
        OR (
            status = 'HASHED'
            AND storage_object_id IS NOT NULL
            AND detected_mime IS NOT NULL
            AND actual_byte_size IS NOT NULL
            AND sha256_digest IS NOT NULL
            AND finalize_idempotency_key IS NOT NULL
            AND rejection_code IS NULL
            AND finalized_at IS NOT NULL
            AND consumed_order_id IS NULL
            AND consumed_at IS NULL
        )
        OR (
            status = 'CONSUMED'
            AND storage_object_id IS NOT NULL
            AND detected_mime IS NOT NULL
            AND actual_byte_size IS NOT NULL
            AND sha256_digest IS NOT NULL
            AND finalize_idempotency_key IS NOT NULL
            AND rejection_code IS NULL
            AND finalized_at IS NOT NULL
            AND consumed_order_id IS NOT NULL
            AND consumed_at IS NOT NULL
        )
        OR (
            status = 'REJECTED'
            AND rejection_code IS NOT NULL
            AND consumed_order_id IS NULL
            AND consumed_at IS NULL
        )
        OR (
            status = 'EXPIRED'
            AND rejection_code IS NULL
            AND consumed_order_id IS NULL
            AND consumed_at IS NULL
        )
    )
);

CREATE UNIQUE INDEX corporate_intake_evidence_finalize_key_uidx
    ON public.corporate_intake_evidence_artifacts (
        client_id,
        finalize_idempotency_key
    )
    WHERE finalize_idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX corporate_intake_evidence_storage_object_uidx
    ON public.corporate_intake_evidence_artifacts (storage_object_id)
    WHERE storage_object_id IS NOT NULL;

CREATE INDEX corporate_intake_evidence_client_status_expiry_idx
    ON public.corporate_intake_evidence_artifacts (
        client_id,
        status,
        expires_at
    );

CREATE INDEX corporate_intake_evidence_consumed_order_idx
    ON public.corporate_intake_evidence_artifacts (consumed_order_id)
    WHERE consumed_order_id IS NOT NULL;

ALTER TABLE public.corporate_intake_evidence_artifacts
    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_intake_evidence_artifacts
    FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.corporate_intake_evidence_artifacts
    FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT (
    evidence_id,
    client_id,
    evidence_type,
    bucket_id,
    object_path,
    status,
    declared_mime,
    declared_byte_size,
    rejection_code,
    expires_at,
    finalized_at,
    consumed_order_id,
    consumed_at,
    created_at,
    updated_at
) ON public.corporate_intake_evidence_artifacts TO authenticated;
GRANT SELECT ON TABLE public.corporate_intake_evidence_artifacts TO service_role;

CREATE POLICY corporate_intake_evidence_select_own
ON public.corporate_intake_evidence_artifacts
FOR SELECT
TO authenticated
USING (client_id = (SELECT auth.uid()));

COMMENT ON TABLE public.corporate_intake_evidence_artifacts IS
    'Protected metadata for beneficial-owner identity evidence. Contains no raw identity number, biometric, credential, original filename, or object bytes.';
COMMENT ON COLUMN public.corporate_intake_evidence_artifacts.sha256_digest IS
    'Lowercase SHA-256 computed server-side from bytes downloaded from private Storage; never supplied by the browser.';

CREATE OR REPLACE FUNCTION public.fn_guard_corporate_intake_evidence_lifecycle()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    IF ROW(
        NEW.evidence_id,
        NEW.client_id,
        NEW.evidence_type,
        NEW.bucket_id,
        NEW.object_path,
        NEW.declared_mime,
        NEW.declared_byte_size,
        NEW.prepare_idempotency_key,
        NEW.created_at
    ) IS DISTINCT FROM ROW(
        OLD.evidence_id,
        OLD.client_id,
        OLD.evidence_type,
        OLD.bucket_id,
        OLD.object_path,
        OLD.declared_mime,
        OLD.declared_byte_size,
        OLD.prepare_idempotency_key,
        OLD.created_at
    ) THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_IMMUTABLE_FIELD';
    END IF;

    IF OLD.status IN ('CONSUMED', 'REJECTED', 'EXPIRED') THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_TERMINAL';
    END IF;

    IF NEW.status = OLD.status THEN
        IF ROW(
            NEW.storage_object_id,
            NEW.detected_mime,
            NEW.actual_byte_size,
            NEW.sha256_digest,
            NEW.finalize_idempotency_key,
            NEW.rejection_code,
            NEW.expires_at,
            NEW.finalized_at,
            NEW.consumed_order_id,
            NEW.consumed_at
        ) IS DISTINCT FROM ROW(
            OLD.storage_object_id,
            OLD.detected_mime,
            OLD.actual_byte_size,
            OLD.sha256_digest,
            OLD.finalize_idempotency_key,
            OLD.rejection_code,
            OLD.expires_at,
            OLD.finalized_at,
            OLD.consumed_order_id,
            OLD.consumed_at
        ) THEN
            RAISE EXCEPTION 'CORPORATE_EVIDENCE_REPLAY_CONFLICT';
        END IF;
    ELSIF OLD.status = 'PENDING_UPLOAD'
          AND NEW.status IN ('HASHED', 'REJECTED', 'EXPIRED') THEN
        NULL;
    ELSIF OLD.status = 'HASHED'
          AND NEW.status IN ('CONSUMED', 'EXPIRED') THEN
        IF ROW(
            NEW.storage_object_id,
            NEW.detected_mime,
            NEW.actual_byte_size,
            NEW.sha256_digest,
            NEW.finalize_idempotency_key,
            NEW.finalized_at
        ) IS DISTINCT FROM ROW(
            OLD.storage_object_id,
            OLD.detected_mime,
            OLD.actual_byte_size,
            OLD.sha256_digest,
            OLD.finalize_idempotency_key,
            OLD.finalized_at
        ) THEN
            RAISE EXCEPTION 'CORPORATE_EVIDENCE_FINAL_METADATA_IMMUTABLE';
        END IF;
    ELSE
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_TRANSITION_INVALID';
    END IF;

    NEW.updated_at := pg_catalog.clock_timestamp();
    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_guard_corporate_intake_evidence_lifecycle()
    FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_guard_corporate_intake_evidence_lifecycle()
    TO postgres;

CREATE TRIGGER guard_corporate_intake_evidence_lifecycle
BEFORE UPDATE ON public.corporate_intake_evidence_artifacts
FOR EACH ROW
EXECUTE FUNCTION public.fn_guard_corporate_intake_evidence_lifecycle();

ALTER TABLE public.corporate_intake_evidence_artifacts
    ENABLE ALWAYS TRIGGER guard_corporate_intake_evidence_lifecycle;

DROP POLICY IF EXISTS corporate_intake_evidence_insert_own
    ON storage.objects;
CREATE POLICY corporate_intake_evidence_insert_own
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'corporate-intake-evidence'
    AND owner_id = (SELECT auth.uid())::TEXT
    AND EXISTS (
        SELECT 1
        FROM public.corporate_intake_evidence_artifacts AS artifact
        WHERE artifact.client_id = (SELECT auth.uid())
          AND artifact.bucket_id = storage.objects.bucket_id
          AND artifact.object_path = storage.objects.name
          AND artifact.status = 'PENDING_UPLOAD'
          AND artifact.expires_at > pg_catalog.clock_timestamp()
    )
);

DROP POLICY IF EXISTS corporate_intake_evidence_select_own_object
    ON storage.objects;
CREATE POLICY corporate_intake_evidence_select_own_object
ON storage.objects
FOR SELECT
TO authenticated
USING (
    bucket_id = 'corporate-intake-evidence'
    AND owner_id = (SELECT auth.uid())::TEXT
    AND EXISTS (
        SELECT 1
        FROM public.corporate_intake_evidence_artifacts AS artifact
        WHERE artifact.client_id = (SELECT auth.uid())
          AND artifact.bucket_id = storage.objects.bucket_id
          AND artifact.object_path = storage.objects.name
          AND artifact.status IN ('PENDING_UPLOAD', 'HASHED')
          AND artifact.expires_at > pg_catalog.clock_timestamp()
    )
);

CREATE OR REPLACE FUNCTION public.fn_is_corporate_intake_client(
    p_client_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT p_client_id IS NOT NULL
       AND EXISTS (
            SELECT 1
            FROM public.users_client AS client
            WHERE client.client_id = p_client_id
       );
$$;

REVOKE ALL ON FUNCTION public.fn_is_corporate_intake_client(UUID)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_is_corporate_intake_client(UUID)
    TO service_role, postgres;

COMMENT ON FUNCTION public.fn_is_corporate_intake_client(UUID) IS
    'Service-only canonical Client-profile check for authenticated evidence Edge Functions; caller identity must first be verified from the JWT.';

CREATE OR REPLACE FUNCTION public.fn_prepare_corporate_intake_evidence_atomic(
    p_evidence_id UUID,
    p_client_id UUID,
    p_declared_mime VARCHAR,
    p_declared_byte_size BIGINT,
    p_idempotency_key VARCHAR,
    p_actor_user_id UUID
)
RETURNS TABLE (
    evidence_id UUID,
    bucket_id VARCHAR,
    object_path TEXT,
    status VARCHAR,
    expires_at TIMESTAMPTZ,
    replayed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_existing public.corporate_intake_evidence_artifacts%ROWTYPE;
    v_extension TEXT;
    v_path TEXT;
    v_now TIMESTAMPTZ := pg_catalog.clock_timestamp();
    v_lock_a TEXT;
    v_lock_b TEXT;
BEGIN
    IF p_evidence_id IS NULL
       OR p_client_id IS NULL
       OR p_actor_user_id IS NULL
       OR p_client_id IS DISTINCT FROM p_actor_user_id THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_ACTOR_MISMATCH';
    END IF;
    v_extension := CASE p_declared_mime
        WHEN 'application/pdf' THEN 'pdf'
        WHEN 'image/jpeg' THEN 'jpg'
        WHEN 'image/png' THEN 'png'
        ELSE NULL
    END;
    IF v_extension IS NULL THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_MIME_INVALID';
    END IF;
    IF p_declared_byte_size IS NULL
       OR p_declared_byte_size NOT BETWEEN 1 AND 10485760 THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_SIZE_INVALID';
    END IF;
    IF p_idempotency_key IS NULL
       OR pg_catalog.btrim(p_idempotency_key) = ''
       OR p_idempotency_key IS DISTINCT FROM pg_catalog.btrim(p_idempotency_key)
       OR pg_catalog.length(p_idempotency_key) > 48 THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_IDEMPOTENCY_KEY_INVALID';
    END IF;
    IF NOT EXISTS (
        SELECT 1
        FROM public.users_client AS client
        WHERE client.client_id = p_client_id
    ) THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_CLIENT_NOT_FOUND';
    END IF;

    v_path := pg_catalog.lower(p_client_id::TEXT)
        || '/' || pg_catalog.lower(p_evidence_id::TEXT)
        || '/source.' || v_extension;
    v_lock_a := 'evidence-id:' || p_evidence_id::TEXT;
    v_lock_b := 'evidence-key:' || p_client_id::TEXT || ':' || p_idempotency_key;
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(LEAST(v_lock_a, v_lock_b), 0)
    );
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(GREATEST(v_lock_a, v_lock_b), 0)
    );

    SELECT artifact.*
    INTO v_existing
    FROM public.corporate_intake_evidence_artifacts AS artifact
    WHERE artifact.evidence_id = p_evidence_id
       OR (
            artifact.client_id = p_client_id
            AND artifact.prepare_idempotency_key = p_idempotency_key
       )
    ORDER BY (artifact.evidence_id = p_evidence_id) DESC
    LIMIT 1
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing.evidence_id IS DISTINCT FROM p_evidence_id
           OR v_existing.client_id IS DISTINCT FROM p_client_id
           OR v_existing.declared_mime IS DISTINCT FROM p_declared_mime
           OR v_existing.declared_byte_size IS DISTINCT FROM p_declared_byte_size
           OR v_existing.prepare_idempotency_key IS DISTINCT FROM p_idempotency_key
           OR v_existing.object_path IS DISTINCT FROM v_path THEN
            RAISE EXCEPTION 'CORPORATE_EVIDENCE_IDEMPOTENCY_CONFLICT';
        END IF;
        RETURN QUERY SELECT
            v_existing.evidence_id,
            v_existing.bucket_id,
            v_existing.object_path,
            v_existing.status,
            v_existing.expires_at,
            true;
        RETURN;
    END IF;

    INSERT INTO public.corporate_intake_evidence_artifacts (
        evidence_id,
        client_id,
        evidence_type,
        bucket_id,
        object_path,
        status,
        declared_mime,
        declared_byte_size,
        prepare_idempotency_key,
        expires_at,
        created_at,
        updated_at
    )
    VALUES (
        p_evidence_id,
        p_client_id,
        'BENEFICIAL_OWNER_IDENTITY',
        'corporate-intake-evidence',
        v_path,
        'PENDING_UPLOAD',
        p_declared_mime,
        p_declared_byte_size,
        p_idempotency_key,
        v_now + INTERVAL '24 hours',
        v_now,
        v_now
    )
    RETURNING
        corporate_intake_evidence_artifacts.evidence_id,
        corporate_intake_evidence_artifacts.bucket_id,
        corporate_intake_evidence_artifacts.object_path,
        corporate_intake_evidence_artifacts.status,
        corporate_intake_evidence_artifacts.expires_at,
        false
    INTO
        evidence_id,
        bucket_id,
        object_path,
        status,
        expires_at,
        replayed;
    RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_finalize_corporate_intake_evidence_atomic(
    p_evidence_id UUID,
    p_client_id UUID,
    p_storage_object_id UUID,
    p_detected_mime VARCHAR,
    p_actual_byte_size BIGINT,
    p_sha256_digest VARCHAR,
    p_idempotency_key VARCHAR,
    p_actor_user_id UUID
)
RETURNS TABLE (
    evidence_id UUID,
    evidence_reference TEXT,
    status VARCHAR,
    expires_at TIMESTAMPTZ,
    replayed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_artifact public.corporate_intake_evidence_artifacts%ROWTYPE;
    v_now TIMESTAMPTZ;
    v_lock_a TEXT;
    v_lock_b TEXT;
    v_lock_c TEXT;
BEGIN
    IF p_evidence_id IS NULL
       OR p_client_id IS NULL
       OR p_actor_user_id IS NULL
       OR p_client_id IS DISTINCT FROM p_actor_user_id THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_ACTOR_MISMATCH';
    END IF;
    IF p_storage_object_id IS NULL
       OR p_detected_mime NOT IN (
            'application/pdf', 'image/jpeg', 'image/png'
       )
       OR p_actual_byte_size IS NULL
       OR p_actual_byte_size NOT BETWEEN 1 AND 10485760
       OR p_sha256_digest IS NULL
       OR p_sha256_digest !~ '^[0-9a-f]{64}$' THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_FINAL_METADATA_INVALID';
    END IF;
    IF p_idempotency_key IS NULL
       OR pg_catalog.btrim(p_idempotency_key) = ''
       OR p_idempotency_key IS DISTINCT FROM pg_catalog.btrim(p_idempotency_key)
       OR pg_catalog.length(p_idempotency_key) > 48 THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_IDEMPOTENCY_KEY_INVALID';
    END IF;

    v_lock_a := 'evidence-id:' || p_evidence_id::TEXT;
    v_lock_b := 'evidence-finalize-key:' || p_client_id::TEXT
        || ':' || p_idempotency_key;
    v_lock_c := 'evidence-storage-object:' || p_storage_object_id::TEXT;
    PERFORM pg_catalog.pg_advisory_xact_lock(
        pg_catalog.hashtextextended(lock_key, 0)
    )
    FROM pg_catalog.unnest(ARRAY[v_lock_a, v_lock_b, v_lock_c])
        AS ordered_lock(lock_key)
    ORDER BY lock_key;
    SELECT artifact.*
    INTO v_artifact
    FROM public.corporate_intake_evidence_artifacts AS artifact
    WHERE artifact.evidence_id = p_evidence_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_NOT_FOUND';
    END IF;
    IF v_artifact.client_id IS DISTINCT FROM p_client_id THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_OWNER_MISMATCH';
    END IF;
    v_now := pg_catalog.clock_timestamp();
    IF v_artifact.status IN ('HASHED', 'CONSUMED') THEN
        IF ROW(
            v_artifact.storage_object_id,
            v_artifact.detected_mime,
            v_artifact.actual_byte_size,
            v_artifact.sha256_digest,
            v_artifact.finalize_idempotency_key
        ) IS DISTINCT FROM ROW(
            p_storage_object_id,
            p_detected_mime,
            p_actual_byte_size,
            p_sha256_digest::CHAR(64),
            p_idempotency_key
        ) THEN
            RAISE EXCEPTION 'CORPORATE_EVIDENCE_IDEMPOTENCY_CONFLICT';
        END IF;
        IF v_artifact.status = 'HASHED'
           AND v_artifact.expires_at <= v_now THEN
            RAISE EXCEPTION 'CORPORATE_EVIDENCE_STATE_INVALID';
        END IF;
        RETURN QUERY SELECT
            v_artifact.evidence_id,
            pg_catalog.lower(v_artifact.evidence_id::TEXT),
            v_artifact.status,
            v_artifact.expires_at,
            true;
        RETURN;
    END IF;
    IF v_artifact.status <> 'PENDING_UPLOAD'
       OR v_artifact.expires_at <= v_now THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_STATE_INVALID';
    END IF;
    IF v_artifact.declared_mime IS DISTINCT FROM p_detected_mime
       OR v_artifact.declared_byte_size IS DISTINCT FROM p_actual_byte_size THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_DECLARATION_MISMATCH';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM public.corporate_intake_evidence_artifacts AS artifact
        WHERE artifact.client_id = p_client_id
          AND artifact.finalize_idempotency_key = p_idempotency_key
          AND artifact.evidence_id <> p_evidence_id
    ) THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_IDEMPOTENCY_CONFLICT';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM public.corporate_intake_evidence_artifacts AS artifact
        WHERE artifact.storage_object_id = p_storage_object_id
          AND artifact.evidence_id <> p_evidence_id
    ) THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_STORAGE_OBJECT_CONFLICT';
    END IF;

    UPDATE public.corporate_intake_evidence_artifacts AS artifact
    SET storage_object_id = p_storage_object_id,
        status = 'HASHED',
        detected_mime = p_detected_mime,
        actual_byte_size = p_actual_byte_size,
        sha256_digest = p_sha256_digest::CHAR(64),
        finalize_idempotency_key = p_idempotency_key,
        expires_at = v_now + INTERVAL '7 days',
        finalized_at = v_now
    WHERE artifact.evidence_id = p_evidence_id
    RETURNING artifact.*
    INTO v_artifact;

    RETURN QUERY SELECT
        v_artifact.evidence_id,
        pg_catalog.lower(v_artifact.evidence_id::TEXT),
        v_artifact.status,
        v_artifact.expires_at,
        false;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_reject_corporate_intake_evidence_atomic(
    p_evidence_id UUID,
    p_client_id UUID,
    p_rejection_code VARCHAR,
    p_actor_user_id UUID
)
RETURNS TABLE (
    evidence_id UUID,
    status VARCHAR,
    replayed BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_artifact public.corporate_intake_evidence_artifacts%ROWTYPE;
BEGIN
    IF p_evidence_id IS NULL
       OR p_client_id IS NULL
       OR p_actor_user_id IS NULL
       OR p_client_id IS DISTINCT FROM p_actor_user_id THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_ACTOR_MISMATCH';
    END IF;
    IF p_rejection_code NOT IN (
        'MIME_MISMATCH',
        'MAGIC_BYTES_INVALID',
        'SIZE_INVALID',
        'EMPTY_FILE'
    ) THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_REJECTION_CODE_INVALID';
    END IF;
    SELECT artifact.*
    INTO v_artifact
    FROM public.corporate_intake_evidence_artifacts AS artifact
    WHERE artifact.evidence_id = p_evidence_id
    FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_NOT_FOUND';
    END IF;
    IF v_artifact.client_id IS DISTINCT FROM p_client_id THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_OWNER_MISMATCH';
    END IF;
    IF v_artifact.status = 'REJECTED'
       AND v_artifact.rejection_code = p_rejection_code THEN
        RETURN QUERY SELECT v_artifact.evidence_id, v_artifact.status, true;
        RETURN;
    END IF;
    IF v_artifact.status <> 'PENDING_UPLOAD' THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_STATE_INVALID';
    END IF;
    UPDATE public.corporate_intake_evidence_artifacts AS artifact
    SET status = 'REJECTED',
        rejection_code = p_rejection_code
    WHERE artifact.evidence_id = p_evidence_id
    RETURNING artifact.*
    INTO v_artifact;
    RETURN QUERY SELECT v_artifact.evidence_id, v_artifact.status, false;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_expire_corporate_intake_evidence_batch(
    p_batch_size INTEGER DEFAULT 100
)
RETURNS TABLE (
    evidence_id UUID,
    previous_status VARCHAR,
    status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF p_batch_size IS NULL OR p_batch_size NOT BETWEEN 1 AND 500 THEN
        RAISE EXCEPTION 'CORPORATE_EVIDENCE_BATCH_SIZE_INVALID';
    END IF;
    RETURN QUERY
    WITH candidates AS (
        SELECT artifact.evidence_id, artifact.status
        FROM public.corporate_intake_evidence_artifacts AS artifact
        WHERE artifact.status IN ('PENDING_UPLOAD', 'HASHED')
          AND artifact.expires_at <= pg_catalog.clock_timestamp()
        ORDER BY artifact.expires_at, artifact.evidence_id
        LIMIT p_batch_size
        FOR UPDATE SKIP LOCKED
    ),
    expired AS (
        UPDATE public.corporate_intake_evidence_artifacts AS artifact
        SET status = 'EXPIRED'
        FROM candidates
        WHERE artifact.evidence_id = candidates.evidence_id
        RETURNING
            artifact.evidence_id,
            candidates.status AS previous_status,
            artifact.status
    )
    SELECT expired.evidence_id, expired.previous_status, expired.status
    FROM expired
    ORDER BY expired.evidence_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_get_corporate_intake_evidence_storage_object(
    p_evidence_id UUID,
    p_client_id UUID
)
RETURNS TABLE (
    evidence_id UUID,
    client_id UUID,
    bucket_id VARCHAR,
    object_path TEXT,
    status VARCHAR,
    declared_mime VARCHAR,
    declared_byte_size BIGINT,
    expires_at TIMESTAMPTZ,
    artifact_storage_object_id UUID,
    artifact_detected_mime VARCHAR,
    artifact_actual_byte_size BIGINT,
    artifact_sha256_digest CHAR(64),
    artifact_finalize_idempotency_key VARCHAR,
    storage_object_id UUID,
    storage_owner_id TEXT,
    stored_mime TEXT,
    stored_byte_size BIGINT
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
    SELECT
        artifact.evidence_id,
        artifact.client_id,
        artifact.bucket_id,
        artifact.object_path,
        artifact.status,
        artifact.declared_mime,
        artifact.declared_byte_size,
        artifact.expires_at,
        artifact.storage_object_id,
        artifact.detected_mime,
        artifact.actual_byte_size,
        artifact.sha256_digest,
        artifact.finalize_idempotency_key,
        object.id,
        object.owner_id,
        object.metadata ->> 'mimetype',
        CASE
            WHEN (object.metadata ->> 'size') ~ '^[0-9]+$'
            THEN (object.metadata ->> 'size')::BIGINT
            ELSE NULL
        END
    FROM public.corporate_intake_evidence_artifacts AS artifact
    LEFT JOIN storage.objects AS object
      ON object.bucket_id = artifact.bucket_id
     AND object.name = artifact.object_path
    WHERE artifact.evidence_id = p_evidence_id
      AND artifact.client_id = p_client_id;
$$;

CREATE OR REPLACE FUNCTION public.fn_create_corporate_intake_from_evidence_atomic(
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
    v_internal_bos JSONB;
    v_expected_count INTEGER;
    v_locked_count INTEGER;
    v_now TIMESTAMPTZ;
    v_result RECORD;
BEGIN
    IF p_order_id IS NULL
       OR p_client_id IS NULL
       OR p_actor_user_id IS NULL
       OR p_client_id IS DISTINCT FROM p_actor_user_id THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_CLIENT_ACTOR_MISMATCH';
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
        WHERE object_key.key_name NOT IN (
            'declaration_version',
            'natural_person_name',
            'evidence_reference',
            'control_basis',
            'percentage'
        )
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_BENEFICIAL_OWNER_FIELD_NOT_ALLOWED';
    END IF;
    IF EXISTS (
        SELECT 1
        FROM pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
            declaration_version SMALLINT,
            natural_person_name TEXT,
            evidence_reference TEXT,
            control_basis TEXT,
            percentage NUMERIC
        )
        WHERE COALESCE(owner.declaration_version, 1::SMALLINT) <= 0
           OR owner.natural_person_name IS NULL
           OR pg_catalog.btrim(owner.natural_person_name) = ''
           OR pg_catalog.length(pg_catalog.btrim(owner.natural_person_name)) > 256
           OR owner.evidence_reference IS NULL
           OR NOT pg_catalog.pg_input_is_valid(
                pg_catalog.btrim(owner.evidence_reference),
                'uuid'
           )
           OR owner.control_basis NOT IN (
                'OWNERSHIP', 'VOTING_RIGHTS', 'APPOINTMENT_REMOVAL',
                'EFFECTIVE_CONTROL', 'BENEFICIAL_ENTITLEMENT'
           )
           OR (
                owner.percentage IS NOT NULL
                AND owner.percentage NOT BETWEEN 0 AND 100
           )
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_BENEFICIAL_OWNER_INVALID';
    END IF;

    v_expected_count := pg_catalog.jsonb_array_length(p_beneficial_owners);
    IF v_expected_count <> (
        SELECT pg_catalog.count(
            DISTINCT pg_catalog.btrim(owner.evidence_reference)::UUID
        )
        FROM pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
            evidence_reference TEXT
        )
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_EVIDENCE_REFERENCE_DUPLICATE';
    END IF;

    WITH requested AS (
        SELECT
            pg_catalog.btrim(owner.evidence_reference)::UUID AS evidence_id
        FROM pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
            evidence_reference TEXT
        )
    ),
    locked AS MATERIALIZED (
        SELECT artifact.*
        FROM public.corporate_intake_evidence_artifacts AS artifact
        JOIN requested
          ON requested.evidence_id = artifact.evidence_id
        ORDER BY artifact.evidence_id
        FOR UPDATE
    )
    SELECT pg_catalog.count(*)
    INTO v_locked_count
    FROM locked;

    IF v_locked_count <> v_expected_count THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_EVIDENCE_NOT_FOUND';
    END IF;
    v_now := pg_catalog.clock_timestamp();
    IF EXISTS (
        SELECT 1
        FROM public.corporate_intake_evidence_artifacts AS artifact
        JOIN pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
            evidence_reference TEXT
        )
          ON artifact.evidence_id =
             pg_catalog.btrim(owner.evidence_reference)::UUID
        WHERE artifact.client_id IS DISTINCT FROM p_client_id
           OR artifact.evidence_type <> 'BENEFICIAL_OWNER_IDENTITY'
           OR artifact.sha256_digest IS NULL
           OR artifact.detected_mime IS NULL
           OR artifact.actual_byte_size IS NULL
           OR (
                artifact.status = 'HASHED'
                AND artifact.expires_at <= v_now
           )
           OR (
                artifact.status = 'CONSUMED'
                AND artifact.consumed_order_id IS DISTINCT FROM p_order_id
           )
           OR artifact.status NOT IN ('HASHED', 'CONSUMED')
    ) THEN
        RAISE EXCEPTION 'CORPORATE_INTAKE_EVIDENCE_STATE_INVALID';
    END IF;

    SELECT pg_catalog.jsonb_agg(
        pg_catalog.jsonb_build_object(
            'declaration_version',
                COALESCE(owner.declaration_version, 1::SMALLINT),
            'natural_person_name',
                pg_catalog.btrim(owner.natural_person_name),
            'identity_reference',
                pg_catalog.lower(artifact.evidence_id::TEXT),
            'control_basis', owner.control_basis,
            'percentage', owner.percentage,
            'evidence_digest', artifact.sha256_digest
        )
        ORDER BY artifact.evidence_id
    )
    INTO v_internal_bos
    FROM pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
        declaration_version SMALLINT,
        natural_person_name TEXT,
        evidence_reference TEXT,
        control_basis TEXT,
        percentage NUMERIC
    )
    JOIN public.corporate_intake_evidence_artifacts AS artifact
      ON artifact.evidence_id =
         pg_catalog.btrim(owner.evidence_reference)::UUID;

    SELECT result.*
    INTO v_result
    FROM public.fn_create_corporate_intake_from_catalog_atomic(
        p_order_id,
        p_client_id,
        p_entity_type,
        p_proposed_name,
        p_domicile_city,
        p_domicile_province,
        p_kbli_snapshot,
        p_authorized_capital_idr,
        p_paid_up_capital_idr,
        p_corporate_parties,
        v_internal_bos,
        p_payment_gateway_ref,
        p_idempotency_key,
        p_actor_user_id
    ) AS result;

    UPDATE public.corporate_intake_evidence_artifacts AS artifact
    SET status = 'CONSUMED',
        consumed_order_id = p_order_id,
        consumed_at = v_now
    WHERE artifact.evidence_id IN (
        SELECT pg_catalog.btrim(owner.evidence_reference)::UUID
        FROM pg_catalog.jsonb_to_recordset(p_beneficial_owners) AS owner(
            evidence_reference TEXT
        )
    )
      AND artifact.status = 'HASHED';

    RETURN QUERY SELECT
        v_result.order_id,
        v_result.corporate_case_id,
        v_result.escrow_id,
        v_result.pricing_catalog_id,
        v_result.quote_version,
        v_result.legal_scope_version,
        v_result.total_amount_idr,
        v_result.replayed;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_prepare_corporate_intake_evidence_atomic(
    UUID, UUID, VARCHAR, BIGINT, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_prepare_corporate_intake_evidence_atomic(
    UUID, UUID, VARCHAR, BIGINT, VARCHAR, UUID
) TO service_role, postgres;

REVOKE ALL ON FUNCTION public.fn_finalize_corporate_intake_evidence_atomic(
    UUID, UUID, UUID, VARCHAR, BIGINT, VARCHAR, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_finalize_corporate_intake_evidence_atomic(
    UUID, UUID, UUID, VARCHAR, BIGINT, VARCHAR, VARCHAR, UUID
) TO service_role, postgres;

REVOKE ALL ON FUNCTION public.fn_reject_corporate_intake_evidence_atomic(
    UUID, UUID, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_reject_corporate_intake_evidence_atomic(
    UUID, UUID, VARCHAR, UUID
) TO service_role, postgres;

REVOKE ALL ON FUNCTION public.fn_expire_corporate_intake_evidence_batch(INTEGER)
    FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_expire_corporate_intake_evidence_batch(INTEGER)
    TO service_role, postgres;

REVOKE ALL ON FUNCTION public.fn_get_corporate_intake_evidence_storage_object(
    UUID, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_get_corporate_intake_evidence_storage_object(
    UUID, UUID
) TO service_role, postgres;

REVOKE ALL ON FUNCTION public.fn_create_corporate_intake_from_evidence_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    JSONB, JSONB, VARCHAR, VARCHAR, UUID
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_create_corporate_intake_from_evidence_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    JSONB, JSONB, VARCHAR, VARCHAR, UUID
) TO service_role, postgres;

REVOKE EXECUTE ON FUNCTION public.fn_create_corporate_intake_from_catalog_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    JSONB, JSONB, VARCHAR, VARCHAR, UUID
) FROM service_role;
GRANT EXECUTE ON FUNCTION public.fn_create_corporate_intake_from_catalog_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    JSONB, JSONB, VARCHAR, VARCHAR, UUID
) TO postgres;

COMMENT ON FUNCTION public.fn_create_corporate_intake_from_evidence_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    JSONB, JSONB, VARCHAR, VARCHAR, UUID
) IS
    'Canonical service-role intake boundary. Resolves server-computed evidence digests and consumes evidence atomically; callers cannot supply digests or financial terms.';
COMMENT ON FUNCTION public.fn_create_corporate_intake_from_catalog_atomic(
    UUID, UUID, VARCHAR, VARCHAR, VARCHAR, VARCHAR, JSONB, NUMERIC, NUMERIC,
    JSONB, JSONB, VARCHAR, VARCHAR, UUID
) IS
    'OWNER-ONLY canonical pricing primitive. Accepts internal evidence digests and must not be exposed to service_role or browsers.';
