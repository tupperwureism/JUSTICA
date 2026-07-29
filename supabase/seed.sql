-- Local-only deterministic RBAC accounts for UI and Auth integration testing.
-- These credentials are intentionally public and MUST NOT be used outside the
-- local Supabase development stack.

BEGIN;

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    created_at,
    updated_at,
    is_sso_user,
    is_anonymous
)
VALUES
    (
        '00000000-0000-0000-0000-000000000000',
        '11111111-1111-4111-8111-111111111111',
        'authenticated',
        'authenticated',
        'client@test.com',
        extensions.crypt('password123', extensions.gen_salt('bf')),
        clock_timestamp(),
        '',
        '',
        '',
        '',
        '',
        '',
        '{"provider":"email","providers":["email"],"role":"CLIENT"}'::JSONB,
        '{"role":"CLIENT","full_name":"Test Client"}'::JSONB,
        false,
        clock_timestamp(),
        clock_timestamp(),
        false,
        false
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        '22222222-2222-4222-8222-222222222222',
        'authenticated',
        'authenticated',
        'notary@test.com',
        extensions.crypt('password123', extensions.gen_salt('bf')),
        clock_timestamp(),
        '',
        '',
        '',
        '',
        '',
        '',
        '{"provider":"email","providers":["email"],"role":"NOTARY"}'::JSONB,
        '{"role":"ADVOCATE","professional_role":"NOTARY","full_name":"Test Notary"}'::JSONB,
        false,
        clock_timestamp(),
        clock_timestamp(),
        false,
        false
    ),
    (
        '00000000-0000-0000-0000-000000000000',
        '33333333-3333-4333-8333-333333333333',
        'authenticated',
        'authenticated',
        'admin@test.com',
        extensions.crypt('password123', extensions.gen_salt('bf')),
        clock_timestamp(),
        '',
        '',
        '',
        '',
        '',
        '',
        '{"provider":"email","providers":["email"],"role":"ADMIN","role_group":"SUPER_ADMIN"}'::JSONB,
        '{"role":"ADMIN","role_group":"SUPER_ADMIN","full_name":"Test Admin"}'::JSONB,
        false,
        clock_timestamp(),
        clock_timestamp(),
        false,
        false
    )
ON CONFLICT (id) DO UPDATE
SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_app_meta_data = EXCLUDED.raw_app_meta_data,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = EXCLUDED.updated_at,
    deleted_at = NULL,
    banned_until = NULL,
    is_sso_user = false,
    is_anonymous = false;

INSERT INTO auth.identities (
    id,
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
VALUES
    (
        '11111111-1111-4111-8111-1111111111a1',
        'client@test.com',
        '11111111-1111-4111-8111-111111111111',
        '{"sub":"11111111-1111-4111-8111-111111111111","email":"client@test.com","email_verified":true,"phone_verified":false}'::JSONB,
        'email',
        clock_timestamp(),
        clock_timestamp(),
        clock_timestamp()
    ),
    (
        '22222222-2222-4222-8222-2222222222a2',
        'notary@test.com',
        '22222222-2222-4222-8222-222222222222',
        '{"sub":"22222222-2222-4222-8222-222222222222","email":"notary@test.com","email_verified":true,"phone_verified":false}'::JSONB,
        'email',
        clock_timestamp(),
        clock_timestamp(),
        clock_timestamp()
    ),
    (
        '33333333-3333-4333-8333-3333333333a3',
        'admin@test.com',
        '33333333-3333-4333-8333-333333333333',
        '{"sub":"33333333-3333-4333-8333-333333333333","email":"admin@test.com","email_verified":true,"phone_verified":false}'::JSONB,
        'email',
        clock_timestamp(),
        clock_timestamp(),
        clock_timestamp()
    )
ON CONFLICT (provider_id, provider) DO UPDATE
SET
    user_id = EXCLUDED.user_id,
    identity_data = EXCLUDED.identity_data,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    updated_at = EXCLUDED.updated_at;

INSERT INTO public.users_client (
    client_id,
    full_name,
    email,
    phone_e164,
    kyc_status,
    password_hash,
    created_at,
    updated_at
)
VALUES (
    '11111111-1111-4111-8111-111111111111',
    'Test Client',
    'client@test.com',
    '+6281111111101',
    'VERIFIED',
    extensions.crypt('password123', extensions.gen_salt('bf')),
    clock_timestamp(),
    clock_timestamp()
)
ON CONFLICT (client_id) DO UPDATE
SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone_e164 = EXCLUDED.phone_e164,
    kyc_status = EXCLUDED.kyc_status,
    password_hash = EXCLUDED.password_hash,
    updated_at = EXCLUDED.updated_at;

-- A dedicated Notary profile table does not exist yet. The current UI/RBAC
-- contract projects a Notary through users_advocate while Auth app metadata
-- retains the canonical NOTARY domain role.
INSERT INTO public.users_advocate (
    advocate_id,
    full_name,
    email,
    phone_e164,
    sipp_license_no,
    peradi_card_no,
    specialization_primary,
    kyc_status,
    is_online,
    average_rating,
    advocate_organization,
    profile_slug,
    experience_years,
    avatar_initials,
    bio,
    created_at,
    updated_at
)
VALUES (
    '22222222-2222-4222-8222-222222222222',
    'Test Notary',
    'notary@test.com',
    '+6281111111102',
    'LOCAL-NOTARY-TEST-001',
    'LOCAL-PROFILE-TEST-001',
    'CORPORATE_NOTARIAL',
    'VERIFIED',
    true,
    5.00,
    'PERADI',
    'test-notary',
    10,
    'TN',
    'Local fixture account for assigned-notary UI and RBAC testing only.',
    clock_timestamp(),
    clock_timestamp()
)
ON CONFLICT (advocate_id) DO UPDATE
SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone_e164 = EXCLUDED.phone_e164,
    sipp_license_no = EXCLUDED.sipp_license_no,
    peradi_card_no = EXCLUDED.peradi_card_no,
    specialization_primary = EXCLUDED.specialization_primary,
    kyc_status = EXCLUDED.kyc_status,
    is_online = EXCLUDED.is_online,
    average_rating = EXCLUDED.average_rating,
    advocate_organization = EXCLUDED.advocate_organization,
    profile_slug = EXCLUDED.profile_slug,
    experience_years = EXCLUDED.experience_years,
    avatar_initials = EXCLUDED.avatar_initials,
    bio = EXCLUDED.bio,
    updated_at = EXCLUDED.updated_at;

INSERT INTO public.users_admin (
    admin_id,
    full_name,
    email,
    role_group,
    fido2_enabled,
    created_at
)
VALUES (
    '33333333-3333-4333-8333-333333333333',
    'Test Admin',
    'admin@test.com',
    'SUPER_ADMIN',
    false,
    clock_timestamp()
)
ON CONFLICT (admin_id) DO UPDATE
SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role_group = EXCLUDED.role_group,
    fido2_enabled = EXCLUDED.fido2_enabled;

COMMIT;

-- LOCAL_TEST_ONLY: deterministic synthetic quote fixture for local catalog and
-- lifecycle tests. The amounts below are not commercial or production prices.
BEGIN;

INSERT INTO public.corporate_pricing_catalogs (
    catalog_id,
    service_type,
    quote_version,
    legal_scope_version,
    currency,
    total_amount_idr,
    status,
    effective_from
)
SELECT
    'b1000000-0000-4000-8000-000000000001'::UUID,
    'CV',
    1,
    'LOCAL_TEST_ONLY_SCOPE_V1',
    'IDR',
    300,
    'DRAFT',
    pg_catalog.clock_timestamp()
WHERE NOT EXISTS (
    SELECT 1
    FROM public.corporate_pricing_catalogs
    WHERE catalog_id = 'b1000000-0000-4000-8000-000000000001'::UUID
);

INSERT INTO public.corporate_pricing_fee_lines (
    catalog_id,
    fee_line_code,
    fee_type,
    description,
    amount
)
SELECT
    'b1000000-0000-4000-8000-000000000001'::UUID,
    fixture.fee_line_code,
    fixture.fee_type,
    fixture.description,
    fixture.amount
FROM (VALUES
    ('LOCAL_TEST_ONLY_CORE', 'JUSTICA_FEE', 'Synthetic local test fee A', 100::NUMERIC),
    ('LOCAL_TEST_ONLY_ADMIN', 'OTHER_APPROVED', 'Synthetic local test fee B', 200::NUMERIC)
) AS fixture(fee_line_code, fee_type, description, amount)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.corporate_pricing_fee_lines AS line
    WHERE line.catalog_id = 'b1000000-0000-4000-8000-000000000001'::UUID
      AND line.fee_line_code = fixture.fee_line_code
);

INSERT INTO public.corporate_pricing_milestones (
    catalog_id,
    milestone_type,
    sequence_number,
    amount,
    releasable_party,
    evidence_condition,
    dispute_refund_rule,
    due_offset_anchor,
    due_offset_days
)
SELECT
    'b1000000-0000-4000-8000-000000000001'::UUID,
    fixture.milestone_type,
    fixture.sequence_number,
    fixture.amount,
    fixture.releasable_party,
    fixture.evidence_condition,
    fixture.dispute_refund_rule,
    'LOCAL_TEST_ONLY_EVENT',
    fixture.due_offset_days
FROM (VALUES
    ('DEPOSIT_INTAKE', 1::SMALLINT, 150::NUMERIC, 'JUSTICA', 'Synthetic local condition A', 'Synthetic local refund rule A', 0::SMALLINT),
    ('OSS_COMPLETE', 2::SMALLINT, 150::NUMERIC, 'GOVERNMENT', 'Synthetic local condition B', 'Synthetic local refund rule B', 7::SMALLINT)
) AS fixture(
    milestone_type,
    sequence_number,
    amount,
    releasable_party,
    evidence_condition,
    dispute_refund_rule,
    due_offset_days
)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.corporate_pricing_milestones AS milestone
    WHERE milestone.catalog_id = 'b1000000-0000-4000-8000-000000000001'::UUID
      AND milestone.milestone_type = fixture.milestone_type
);

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.corporate_pricing_catalogs
        WHERE catalog_id = 'b1000000-0000-4000-8000-000000000001'::UUID
          AND status = 'DRAFT'
    ) THEN
        PERFORM public.fn_activate_corporate_pricing_catalog(
            'b1000000-0000-4000-8000-000000000001'::UUID
        );
    END IF;
END;
$$;

COMMIT;
