CREATE OR REPLACE FUNCTION public.fn_guard_corporate_pricing_catalog_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF NEW.status <> 'DRAFT' THEN
            RAISE EXCEPTION 'CORPORATE_PRICING_CATALOG_INITIAL_STATUS_INVALID';
        END IF;
        RETURN NEW;
    END IF;

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

DROP TRIGGER trg_guard_corporate_pricing_catalog_mutation
    ON public.corporate_pricing_catalogs;

CREATE TRIGGER trg_guard_corporate_pricing_catalog_mutation
BEFORE INSERT OR UPDATE OR DELETE ON public.corporate_pricing_catalogs
FOR EACH ROW EXECUTE FUNCTION public.fn_guard_corporate_pricing_catalog_mutation();

ALTER TABLE public.corporate_pricing_catalogs
    ENABLE ALWAYS TRIGGER trg_guard_corporate_pricing_catalog_mutation;
