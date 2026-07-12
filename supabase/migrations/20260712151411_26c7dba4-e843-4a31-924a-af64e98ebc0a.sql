-- Drop the public row-level policy that exposed all columns (including credentials)
DROP POLICY IF EXISTS "Public views active payment methods (safe columns)" ON public.payment_methods;

-- Revoke direct table access from anon/authenticated
REVOKE SELECT ON public.payment_methods FROM anon, authenticated;

-- Recreate the safe view with definer semantics so it can bypass RLS on the base table
DROP VIEW IF EXISTS public.payment_methods_public;
CREATE VIEW public.payment_methods_public
WITH (security_invoker = false) AS
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