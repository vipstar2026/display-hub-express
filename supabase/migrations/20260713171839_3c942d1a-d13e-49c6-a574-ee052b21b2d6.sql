
ALTER VIEW public.payment_methods_public SET (security_invoker = true);

-- Ensure the querying user can read the safe columns on the base table
GRANT SELECT (
  id, code, name_ar, name_en, name_ur, type, icon,
  instructions_ar, instructions_en, instructions_ur,
  account_details, requires_proof, is_active, sort_order,
  fee_amount, fee_percent, min_amount, max_amount,
  is_gateway, gateway_provider, test_mode, supported_currencies,
  logo_url, created_at, updated_at
) ON public.payment_methods TO anon, authenticated;

-- Public row visibility for active methods (credentials/config columns remain protected via column grants)
DROP POLICY IF EXISTS "payment_methods_public_read_active" ON public.payment_methods;
CREATE POLICY "payment_methods_public_read_active"
ON public.payment_methods
FOR SELECT
TO anon, authenticated
USING (is_active = true);
