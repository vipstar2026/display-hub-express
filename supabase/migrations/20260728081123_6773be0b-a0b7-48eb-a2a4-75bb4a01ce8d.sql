-- 1) Remove the row-level public read that exposed all columns (incl. credentials/config)
DROP POLICY IF EXISTS "Public can read active payment methods" ON public.payment_methods;

-- 2) Remove any anon/authenticated direct table access
REVOKE ALL ON public.payment_methods FROM anon;
REVOKE ALL ON public.payment_methods FROM authenticated;

-- 3) Admins keep full access through their RLS policies
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;

-- 4) Public reads go through the safe-column view, which runs as its owner
--    (definer) so it does not need base-table access for anon.
ALTER VIEW public.payment_methods_public SET (security_invoker = false);
REVOKE ALL ON public.payment_methods_public FROM anon, authenticated;
GRANT SELECT ON public.payment_methods_public TO anon, authenticated;
