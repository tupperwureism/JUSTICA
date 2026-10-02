CREATE OR REPLACE FUNCTION public.fn_is_verified_advocate(p_advocate_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.users_advocate
        WHERE advocate_id = p_advocate_id AND kyc_status = 'VERIFIED'
    );
$$;

REVOKE ALL ON FUNCTION public.fn_is_verified_advocate(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fn_is_verified_advocate(UUID) TO authenticated;

DROP POLICY IF EXISTS rls_booking_sessions_advocate_read ON public.booking_sessions;
CREATE POLICY rls_booking_sessions_advocate_read ON public.booking_sessions
FOR SELECT TO authenticated
USING (advocate_id = auth.uid() AND public.fn_is_verified_advocate(auth.uid()));

DROP POLICY IF EXISTS rls_escrow_transactions_advocate_read ON public.escrow_transactions;
CREATE POLICY rls_escrow_transactions_advocate_read ON public.escrow_transactions
FOR SELECT TO authenticated
USING (advocate_id = auth.uid() AND public.fn_is_verified_advocate(auth.uid()));

DROP POLICY IF EXISTS rls_legal_opinions_advocate_read ON public.legal_opinions;
CREATE POLICY rls_legal_opinions_advocate_read ON public.legal_opinions
FOR SELECT TO authenticated
USING (advocate_id = auth.uid() AND public.fn_is_verified_advocate(auth.uid()));
