DROP POLICY IF EXISTS "Public can read active payment methods" ON public.payment_methods;

REVOKE SELECT ON public.payment_methods FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;

ALTER VIEW public.payment_methods_public SET (security_invoker = off);
GRANT SELECT ON public.payment_methods_public TO anon, authenticated;