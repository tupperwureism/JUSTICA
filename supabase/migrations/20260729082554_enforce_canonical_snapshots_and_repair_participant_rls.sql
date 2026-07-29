-- Canonical snapshot immutability and participant RLS repair.
-- The private schema is intentionally absent from Supabase Data API schemas.

CREATE SCHEMA private AUTHORIZATION postgres;

REVOKE ALL ON SCHEMA private
    FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA private TO authenticated, postgres;

CREATE OR REPLACE FUNCTION private.fn_current_phase2_admin_role_group()
RETURNS VARCHAR
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT admin_user.role_group
    FROM public.users_admin AS admin_user
    WHERE admin_user.admin_id = (SELECT auth.uid())
      AND admin_user.role_group IN ('COMPLIANCE_OFFICER', 'SUPER_ADMIN')
$$;

REVOKE ALL ON FUNCTION private.fn_current_phase2_admin_role_group()
    FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.fn_current_phase2_admin_role_group()
    TO authenticated, postgres;

COMMENT ON FUNCTION private.fn_current_phase2_admin_role_group() IS
    'Internal RLS helper. Resolves only the current auth.uid() to an allowed Phase 2 admin role; accepts no caller identity.';

CREATE OR REPLACE FUNCTION private.fn_enforce_canonical_intake_snapshot()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_order_ids UUID[] := ARRAY[]::UUID[];
    v_order_id UUID;
    v_old_order_id UUID;
    v_new_order_id UUID;
    v_order public.service_orders%ROWTYPE;
    v_catalog public.corporate_pricing_catalogs%ROWTYPE;
    v_case public.corporate_service_cases%ROWTYPE;
    v_escrow public.escrow_transactions%ROWTYPE;
BEGIN
    IF TG_TABLE_SCHEMA <> 'public' THEN
        RAISE EXCEPTION 'CANONICAL_SNAPSHOT_UNEXPECTED_SCHEMA';
    END IF;

    CASE TG_TABLE_NAME
        WHEN 'service_orders' THEN
            IF TG_OP <> 'INSERT' THEN
                v_order_ids := pg_catalog.array_append(
                    v_order_ids,
                    OLD.order_id
                );
            END IF;
            IF TG_OP <> 'DELETE' THEN
                v_order_ids := pg_catalog.array_append(
                    v_order_ids,
                    NEW.order_id
                );
            END IF;
        WHEN 'service_fee_lines', 'payment_milestones' THEN
            IF TG_OP <> 'INSERT' THEN
                v_order_ids := pg_catalog.array_append(
                    v_order_ids,
                    OLD.order_id
                );
            END IF;
            IF TG_OP <> 'DELETE' THEN
                v_order_ids := pg_catalog.array_append(
                    v_order_ids,
                    NEW.order_id
                );
            END IF;
        WHEN 'corporate_service_cases' THEN
            IF TG_OP <> 'INSERT' THEN
                v_order_ids := pg_catalog.array_append(
                    v_order_ids,
                    OLD.order_id
                );
            END IF;
            IF TG_OP <> 'DELETE' THEN
                v_order_ids := pg_catalog.array_append(
                    v_order_ids,
                    NEW.order_id
                );
            END IF;
        WHEN 'escrow_transactions' THEN
            IF TG_OP <> 'INSERT' AND OLD.corporate_case_id IS NOT NULL THEN
                SELECT corporate_case.order_id
                INTO v_old_order_id
                FROM public.corporate_service_cases AS corporate_case
                WHERE corporate_case.case_id = OLD.corporate_case_id;
                v_order_ids := pg_catalog.array_append(
                    v_order_ids,
                    v_old_order_id
                );
            END IF;
            IF TG_OP <> 'DELETE' AND NEW.corporate_case_id IS NOT NULL THEN
                SELECT corporate_case.order_id
                INTO v_new_order_id
                FROM public.corporate_service_cases AS corporate_case
                WHERE corporate_case.case_id = NEW.corporate_case_id;
                v_order_ids := pg_catalog.array_append(
                    v_order_ids,
                    v_new_order_id
                );
            END IF;
        ELSE
            RAISE EXCEPTION 'CANONICAL_SNAPSHOT_UNEXPECTED_TABLE';
    END CASE;

    FOR v_order_id IN
        SELECT DISTINCT candidate.order_id
        FROM pg_catalog.unnest(v_order_ids) AS candidate(order_id)
        WHERE candidate.order_id IS NOT NULL
        ORDER BY candidate.order_id
    LOOP
        -- This deferred validator must not acquire parent locks after the
        -- originating DML already holds child/case/escrow row locks. Canonical
        -- identifiers and accepted terms are protected by ENABLE ALWAYS
        -- immutability guards; an MVCC consistency read avoids lock inversion.
        SELECT service_order.*
        INTO v_order
        FROM public.service_orders AS service_order
        WHERE service_order.order_id = v_order_id;

        IF NOT FOUND OR v_order.accepted_pricing_catalog_id IS NULL THEN
            CONTINUE;
        END IF;

        SELECT catalog.*
        INTO v_catalog
        FROM public.corporate_pricing_catalogs AS catalog
        WHERE catalog.catalog_id = v_order.accepted_pricing_catalog_id
          AND catalog.status IN ('ACTIVE', 'RETIRED');

        IF NOT FOUND
           OR v_order.service_type IS DISTINCT FROM v_catalog.service_type
           OR v_order.currency IS DISTINCT FROM v_catalog.currency
           OR v_order.accepted_quote_version
                IS DISTINCT FROM v_catalog.quote_version THEN
            RAISE EXCEPTION 'CANONICAL_SNAPSHOT_ORDER_HEADER_MISMATCH';
        END IF;

        IF EXISTS (
            (
                SELECT
                    catalog_line.fee_line_code,
                    catalog_line.fee_type,
                    catalog_line.description,
                    catalog_line.amount,
                    v_catalog.currency,
                    v_catalog.quote_version
                FROM public.corporate_pricing_fee_lines AS catalog_line
                WHERE catalog_line.catalog_id = v_catalog.catalog_id
            )
            EXCEPT ALL
            (
                SELECT
                    snapshot_line.fee_line_code,
                    snapshot_line.fee_type,
                    snapshot_line.description,
                    snapshot_line.amount,
                    snapshot_line.currency,
                    snapshot_line.quote_version
                FROM public.service_fee_lines AS snapshot_line
                WHERE snapshot_line.order_id = v_order_id
            )
        ) OR EXISTS (
            (
                SELECT
                    snapshot_line.fee_line_code,
                    snapshot_line.fee_type,
                    snapshot_line.description,
                    snapshot_line.amount,
                    snapshot_line.currency,
                    snapshot_line.quote_version
                FROM public.service_fee_lines AS snapshot_line
                WHERE snapshot_line.order_id = v_order_id
            )
            EXCEPT ALL
            (
                SELECT
                    catalog_line.fee_line_code,
                    catalog_line.fee_type,
                    catalog_line.description,
                    catalog_line.amount,
                    v_catalog.currency,
                    v_catalog.quote_version
                FROM public.corporate_pricing_fee_lines AS catalog_line
                WHERE catalog_line.catalog_id = v_catalog.catalog_id
            )
        ) OR EXISTS (
            SELECT 1
            FROM public.service_fee_lines AS snapshot_line
            WHERE snapshot_line.order_id = v_order_id
              AND snapshot_line.accepted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'CANONICAL_SNAPSHOT_FEE_LINES_MISMATCH';
        END IF;

        IF EXISTS (
            (
                SELECT
                    catalog_milestone.milestone_type,
                    catalog_milestone.sequence_number,
                    catalog_milestone.amount,
                    v_catalog.currency,
                    v_catalog.quote_version,
                    catalog_milestone.releasable_party,
                    catalog_milestone.evidence_condition,
                    catalog_milestone.dispute_refund_rule,
                    catalog_milestone.due_offset_anchor,
                    catalog_milestone.due_offset_days
                FROM public.corporate_pricing_milestones AS catalog_milestone
                WHERE catalog_milestone.catalog_id = v_catalog.catalog_id
            )
            EXCEPT ALL
            (
                SELECT
                    snapshot_milestone.milestone_type,
                    snapshot_milestone.sequence_number,
                    snapshot_milestone.amount,
                    snapshot_milestone.currency,
                    snapshot_milestone.quote_version,
                    snapshot_milestone.releasable_party,
                    snapshot_milestone.evidence_condition,
                    snapshot_milestone.dispute_refund_rule,
                    snapshot_milestone.due_offset_anchor,
                    snapshot_milestone.due_offset_days
                FROM public.payment_milestones AS snapshot_milestone
                WHERE snapshot_milestone.order_id = v_order_id
            )
        ) OR EXISTS (
            (
                SELECT
                    snapshot_milestone.milestone_type,
                    snapshot_milestone.sequence_number,
                    snapshot_milestone.amount,
                    snapshot_milestone.currency,
                    snapshot_milestone.quote_version,
                    snapshot_milestone.releasable_party,
                    snapshot_milestone.evidence_condition,
                    snapshot_milestone.dispute_refund_rule,
                    snapshot_milestone.due_offset_anchor,
                    snapshot_milestone.due_offset_days
                FROM public.payment_milestones AS snapshot_milestone
                WHERE snapshot_milestone.order_id = v_order_id
            )
            EXCEPT ALL
            (
                SELECT
                    catalog_milestone.milestone_type,
                    catalog_milestone.sequence_number,
                    catalog_milestone.amount,
                    v_catalog.currency,
                    v_catalog.quote_version,
                    catalog_milestone.releasable_party,
                    catalog_milestone.evidence_condition,
                    catalog_milestone.dispute_refund_rule,
                    catalog_milestone.due_offset_anchor,
                    catalog_milestone.due_offset_days
                FROM public.corporate_pricing_milestones AS catalog_milestone
                WHERE catalog_milestone.catalog_id = v_catalog.catalog_id
            )
        ) THEN
            RAISE EXCEPTION 'CANONICAL_SNAPSHOT_MILESTONES_MISMATCH';
        END IF;

        SELECT corporate_case.*
        INTO v_case
        FROM public.corporate_service_cases AS corporate_case
        WHERE corporate_case.order_id = v_order_id;

        IF NOT FOUND
           OR v_case.entity_type IS DISTINCT FROM v_order.service_type THEN
            RAISE EXCEPTION 'CANONICAL_SNAPSHOT_CASE_MISMATCH';
        END IF;

        IF v_case.legal_scope_version
                IS DISTINCT FROM v_catalog.legal_scope_version THEN
            RAISE EXCEPTION 'CANONICAL_SNAPSHOT_LEGAL_SCOPE_MISMATCH';
        END IF;

        SELECT escrow.*
        INTO v_escrow
        FROM public.escrow_transactions AS escrow
        WHERE escrow.corporate_case_id = v_case.case_id;

        IF NOT FOUND
           OR v_escrow.client_id IS DISTINCT FROM v_order.client_id
           OR v_escrow.total_amount_idr
                IS DISTINCT FROM v_catalog.total_amount_idr THEN
            RAISE EXCEPTION 'CANONICAL_SNAPSHOT_ESCROW_MISMATCH';
        END IF;
    END LOOP;

    RETURN NULL;
END;
$$;

REVOKE ALL ON FUNCTION private.fn_enforce_canonical_intake_snapshot()
    FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.fn_enforce_canonical_intake_snapshot()
    TO postgres;

CREATE CONSTRAINT TRIGGER trg_assert_canonical_snapshot_service_order
AFTER INSERT OR UPDATE OR DELETE ON public.service_orders
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION private.fn_enforce_canonical_intake_snapshot();

CREATE CONSTRAINT TRIGGER trg_assert_canonical_snapshot_fee_line
AFTER INSERT OR UPDATE OR DELETE ON public.service_fee_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION private.fn_enforce_canonical_intake_snapshot();

CREATE CONSTRAINT TRIGGER trg_assert_canonical_snapshot_milestone
AFTER INSERT OR UPDATE OR DELETE ON public.payment_milestones
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION private.fn_enforce_canonical_intake_snapshot();

CREATE CONSTRAINT TRIGGER trg_assert_canonical_snapshot_case
AFTER INSERT OR UPDATE OR DELETE ON public.corporate_service_cases
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION private.fn_enforce_canonical_intake_snapshot();

CREATE CONSTRAINT TRIGGER trg_assert_canonical_snapshot_escrow
AFTER INSERT OR UPDATE OR DELETE ON public.escrow_transactions
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
EXECUTE FUNCTION private.fn_enforce_canonical_intake_snapshot();

ALTER TABLE public.service_orders
    ENABLE ALWAYS TRIGGER trg_assert_canonical_snapshot_service_order;
ALTER TABLE public.service_fee_lines
    ENABLE ALWAYS TRIGGER trg_assert_canonical_snapshot_fee_line;
ALTER TABLE public.payment_milestones
    ENABLE ALWAYS TRIGGER trg_assert_canonical_snapshot_milestone;
ALTER TABLE public.corporate_service_cases
    ENABLE ALWAYS TRIGGER trg_assert_canonical_snapshot_case;
ALTER TABLE public.escrow_transactions
    ENABLE ALWAYS TRIGGER trg_assert_canonical_snapshot_escrow;

REVOKE ALL ON TABLE public.service_fee_lines,
    public.payment_milestones
    FROM service_role;
GRANT SELECT ON TABLE public.service_fee_lines,
    public.payment_milestones
    TO service_role;

REVOKE UPDATE (legal_scope_version)
    ON public.corporate_service_cases
    FROM service_role;

ALTER POLICY rls_service_orders_participant_read
ON public.service_orders
USING (
    client_id = (SELECT auth.uid())
    OR (
        assigned_professional_id = (SELECT auth.uid())
        AND public.fn_is_verified_advocate((SELECT auth.uid()))
    )
    OR (
        SELECT private.fn_current_phase2_admin_role_group()
    ) IS NOT NULL
);

ALTER POLICY rls_service_fee_lines_participant_read
ON public.service_fee_lines
USING (
    EXISTS (
        SELECT 1
        FROM public.service_orders AS service_order
        WHERE service_order.order_id = service_fee_lines.order_id
          AND (
              service_order.client_id = (SELECT auth.uid())
              OR (
                  service_order.assigned_professional_id = (SELECT auth.uid())
                  AND public.fn_is_verified_advocate((SELECT auth.uid()))
              )
              OR (
                  SELECT private.fn_current_phase2_admin_role_group()
              ) IS NOT NULL
          )
    )
);

ALTER POLICY rls_payment_milestones_participant_read
ON public.payment_milestones
USING (
    EXISTS (
        SELECT 1
        FROM public.service_orders AS service_order
        WHERE service_order.order_id = payment_milestones.order_id
          AND (
              service_order.client_id = (SELECT auth.uid())
              OR (
                  service_order.assigned_professional_id = (SELECT auth.uid())
                  AND public.fn_is_verified_advocate((SELECT auth.uid()))
              )
              OR (
                  SELECT private.fn_current_phase2_admin_role_group()
              ) IS NOT NULL
          )
    )
);

ALTER POLICY rls_corporate_cases_participant_read
ON public.corporate_service_cases
USING (
    EXISTS (
        SELECT 1
        FROM public.service_orders AS orders
        WHERE orders.order_id = corporate_service_cases.order_id
          AND (
              orders.client_id = (SELECT auth.uid())
              OR orders.assigned_professional_id = (SELECT auth.uid())
          )
    )
    OR assigned_notary_id = (SELECT auth.uid())
    OR assigned_compliance_reviewer_id = (SELECT auth.uid())
    OR (
        SELECT private.fn_current_phase2_admin_role_group()
    ) IS NOT NULL
);

ALTER POLICY rls_corporate_parties_participant_read
ON public.corporate_parties
USING (
    EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        JOIN public.service_orders AS orders
          ON orders.order_id = cases.order_id
        WHERE cases.case_id = corporate_parties.case_id
          AND (
              orders.client_id = (SELECT auth.uid())
              OR orders.assigned_professional_id = (SELECT auth.uid())
          )
    )
    OR EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        WHERE cases.case_id = corporate_parties.case_id
          AND cases.assigned_notary_id = (SELECT auth.uid())
    )
    OR (
        SELECT private.fn_current_phase2_admin_role_group()
    ) IS NOT NULL
);

ALTER POLICY rls_beneficial_owners_participant_read
ON public.beneficial_owners
USING (
    EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        JOIN public.service_orders AS orders
          ON orders.order_id = cases.order_id
        WHERE cases.case_id = beneficial_owners.case_id
          AND (
              orders.client_id = (SELECT auth.uid())
              OR orders.assigned_professional_id = (SELECT auth.uid())
          )
    )
    OR EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        WHERE cases.case_id = beneficial_owners.case_id
          AND cases.assigned_notary_id = (SELECT auth.uid())
    )
    OR (
        SELECT private.fn_current_phase2_admin_role_group()
    ) IS NOT NULL
);

ALTER POLICY rls_compliance_assessments_restricted_read
ON public.compliance_assessments
USING (
    EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        JOIN public.service_orders AS orders
          ON orders.order_id = cases.order_id
        WHERE cases.case_id = compliance_assessments.case_id
          AND orders.assigned_professional_id = (SELECT auth.uid())
    )
    OR EXISTS (
        SELECT 1
        FROM public.corporate_service_cases AS cases
        WHERE cases.case_id = compliance_assessments.case_id
          AND (
              cases.assigned_notary_id = (SELECT auth.uid())
              OR cases.assigned_compliance_reviewer_id =
                    (SELECT auth.uid())
          )
    )
    OR (
        SELECT private.fn_current_phase2_admin_role_group()
    ) IS NOT NULL
);

ALTER POLICY rls_compliance_assessments_restricted_insert
ON public.compliance_assessments
WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND (
        EXISTS (
            SELECT 1
            FROM public.corporate_service_cases AS cases
            JOIN public.service_orders AS orders
              ON orders.order_id = cases.order_id
            WHERE cases.case_id = compliance_assessments.case_id
              AND orders.assigned_professional_id = (SELECT auth.uid())
              AND compliance_assessments.reviewer_role = 'ADVOCATE'
        )
        OR EXISTS (
            SELECT 1
            FROM public.corporate_service_cases AS cases
            WHERE cases.case_id = compliance_assessments.case_id
              AND cases.assigned_notary_id = (SELECT auth.uid())
              AND compliance_assessments.reviewer_role = 'NOTARY'
        )
        OR (
            SELECT private.fn_current_phase2_admin_role_group()
        ) = compliance_assessments.reviewer_role
    )
);

ALTER POLICY rls_compliance_assessments_restricted_update
ON public.compliance_assessments
USING (
    reviewer_id = (SELECT auth.uid())
    AND (
        EXISTS (
            SELECT 1
            FROM public.corporate_service_cases AS cases
            JOIN public.service_orders AS orders
              ON orders.order_id = cases.order_id
            WHERE cases.case_id = compliance_assessments.case_id
              AND orders.assigned_professional_id = (SELECT auth.uid())
        )
        OR EXISTS (
            SELECT 1
            FROM public.corporate_service_cases AS cases
            WHERE cases.case_id = compliance_assessments.case_id
              AND (
                  cases.assigned_notary_id = (SELECT auth.uid())
                  OR cases.assigned_compliance_reviewer_id =
                        (SELECT auth.uid())
              )
        )
        OR (
            SELECT private.fn_current_phase2_admin_role_group()
        ) IS NOT NULL
    )
)
WITH CHECK (
    reviewer_id = (SELECT auth.uid())
    AND (
        EXISTS (
            SELECT 1
            FROM public.corporate_service_cases AS cases
            JOIN public.service_orders AS orders
              ON orders.order_id = cases.order_id
            WHERE cases.case_id = compliance_assessments.case_id
              AND orders.assigned_professional_id = (SELECT auth.uid())
              AND compliance_assessments.reviewer_role = 'ADVOCATE'
        )
        OR EXISTS (
            SELECT 1
            FROM public.corporate_service_cases AS cases
            WHERE cases.case_id = compliance_assessments.case_id
              AND cases.assigned_notary_id = (SELECT auth.uid())
              AND compliance_assessments.reviewer_role = 'NOTARY'
        )
        OR (
            SELECT private.fn_current_phase2_admin_role_group()
        ) = compliance_assessments.reviewer_role
    )
);

ALTER POLICY rls_ekyc_logs_subject_read
ON public.ekyc_verification_logs
USING (
    user_id = (SELECT auth.uid())
    OR (
        SELECT private.fn_current_phase2_admin_role_group()
    ) IS NOT NULL
);

ALTER POLICY rls_escrow_transactions_corporate_participant_read
ON public.escrow_transactions
USING (
    corporate_case_id IS NOT NULL
    AND (
        EXISTS (
            SELECT 1
            FROM public.corporate_service_cases AS corporate_case
            JOIN public.service_orders AS service_order
              ON service_order.order_id = corporate_case.order_id
            WHERE corporate_case.case_id =
                    escrow_transactions.corporate_case_id
              AND (
                  service_order.client_id = (SELECT auth.uid())
                  OR service_order.assigned_professional_id =
                        (SELECT auth.uid())
              )
        )
        OR EXISTS (
            SELECT 1
            FROM public.corporate_service_cases AS corporate_case
            WHERE corporate_case.case_id =
                    escrow_transactions.corporate_case_id
              AND corporate_case.assigned_notary_id =
                    (SELECT auth.uid())
        )
        OR (
            SELECT private.fn_current_phase2_admin_role_group()
        ) IS NOT NULL
          )
);

ALTER POLICY rls_compliance_workflow_events_compliance_read
ON public.compliance_workflow_events_worm
USING (
    (
        SELECT private.fn_current_phase2_admin_role_group()
    ) IS NOT NULL
);
