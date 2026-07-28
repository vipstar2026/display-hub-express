ALTER VIEW public.payment_methods_public SET (security_invoker = false);
GRANT SELECT ON public.payment_methods_public TO anon, authenticated;