ALTER VIEW public.payment_methods_public SET (security_invoker = true);

GRANT SELECT (
  id, code, name_ar, name_en, name_ur, type, icon,
  instructions_ar, instructions_en, instructions_ur,
  account_details, requires_proof, is_active, sort_order,
  fee_amount, fee_percent, min_amount, max_amount,
  is_gateway, gateway_provider, test_mode, supported_currencies,
  logo_url, created_at, updated_at
) ON public.payment_methods TO anon, authenticated;

DROP POLICY IF EXISTS "Public can read active payment methods" ON public.payment_methods;
CREATE POLICY "Public can read active payment methods"
  ON public.payment_methods FOR SELECT
  TO anon, authenticated
  USING (is_active = true);