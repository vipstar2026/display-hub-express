GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO service_role;

GRANT SELECT ON public.payment_methods_public TO anon, authenticated;
GRANT SELECT ON public.reviews_public TO anon, authenticated;
GRANT SELECT ON public.loyalty_balance TO authenticated;