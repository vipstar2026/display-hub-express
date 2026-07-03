
-- Restrict public read to non-sensitive columns; hide credentials/config
REVOKE SELECT ON public.payment_methods FROM anon, authenticated;

GRANT SELECT (
  id, code, name_ar, name_en, name_ur, type, icon, logo_url,
  instructions_ar, instructions_en, instructions_ur, account_details,
  is_gateway, gateway_provider, test_mode, supported_currencies,
  requires_proof, is_active, sort_order, fee_amount, fee_percent,
  min_amount, max_amount, created_at, updated_at
) ON public.payment_methods TO anon, authenticated;

GRANT ALL ON public.payment_methods TO service_role;
