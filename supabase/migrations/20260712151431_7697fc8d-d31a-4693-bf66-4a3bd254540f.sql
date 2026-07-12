DROP VIEW IF EXISTS public.payment_methods_public;
CREATE VIEW public.payment_methods_public
WITH (security_invoker = false) AS
SELECT
  id, code, name_ar, name_en, name_ur, type, icon,
  instructions_ar, instructions_en, instructions_ur,
  account_details,
  requires_proof, is_active, sort_order,
  fee_amount, fee_percent, min_amount, max_amount,
  is_gateway, gateway_provider, test_mode,
  supported_currencies, logo_url, created_at, updated_at
FROM public.payment_methods
WHERE is_active = true;

GRANT SELECT ON public.payment_methods_public TO anon, authenticated;