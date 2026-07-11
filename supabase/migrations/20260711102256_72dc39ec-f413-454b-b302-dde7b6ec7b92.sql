
-- 1) Restrict payment_methods SELECT to admins only
DROP POLICY IF EXISTS "Anyone views active payment methods" ON public.payment_methods;

CREATE POLICY "Admins view all payment methods"
ON public.payment_methods
FOR SELECT
USING (private.has_role(auth.uid(), 'admin'::app_role));

-- 2) Public-safe view without credentials/account_details
CREATE OR REPLACE VIEW public.payment_methods_public
WITH (security_invoker = true) AS
SELECT
  id, code, name_ar, name_en, name_ur, type, icon,
  instructions_ar, instructions_en, instructions_ur,
  requires_proof, is_active, sort_order,
  fee_amount, fee_percent, min_amount, max_amount,
  is_gateway, gateway_provider, test_mode,
  supported_currencies, logo_url, created_at, updated_at
FROM public.payment_methods
WHERE is_active = true;

GRANT SELECT ON public.payment_methods_public TO anon, authenticated;

-- Need base-table SELECT for the invoker view; keep sensitive columns protected via column privileges
GRANT SELECT (
  id, code, name_ar, name_en, name_ur, type, icon,
  instructions_ar, instructions_en, instructions_ur,
  requires_proof, is_active, sort_order,
  fee_amount, fee_percent, min_amount, max_amount,
  is_gateway, gateway_provider, test_mode,
  supported_currencies, logo_url, created_at, updated_at
) ON public.payment_methods TO anon, authenticated;

-- Add a public read policy limited to active rows; column privileges above stop credentials/account_details exposure
CREATE POLICY "Public views active payment methods (safe columns)"
ON public.payment_methods
FOR SELECT
USING (is_active = true);

-- 3) Lock down validate_coupon to authenticated users only
REVOKE EXECUTE ON FUNCTION public.validate_coupon(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(text) TO authenticated;
