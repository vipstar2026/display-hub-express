
DROP POLICY IF EXISTS payment_methods_public_read_active ON public.payment_methods;
REVOKE SELECT ON public.payment_methods FROM anon, authenticated;
GRANT SELECT ON public.payment_methods_public TO anon, authenticated;
