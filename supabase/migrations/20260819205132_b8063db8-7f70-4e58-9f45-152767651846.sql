
-- 1) Public digital availability map (no code values exposed)
CREATE OR REPLACE FUNCTION public.digital_stock_map()
RETURNS TABLE(product_id uuid, available integer)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id,
         public.digital_stock_available(p.id)
  FROM public.products p
  WHERE p.status = 'active' AND p.type IN ('digital','subscription');
$$;

REVOKE ALL ON FUNCTION public.digital_stock_map() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.digital_stock_map() TO anon, authenticated, service_role;

-- 2) Payment methods: drop SECURITY DEFINER view in favour of
--    column-level grants + an RLS policy scoped to active rows.
DROP VIEW IF EXISTS public.payment_methods_public;

CREATE VIEW public.payment_methods_public
WITH (security_invoker = true) AS
SELECT id, code, name_ar, name_en, name_ur, name_bn, type, icon,
       instructions_ar, instructions_en, instructions_ur, instructions_bn,
       account_details, requires_proof, is_active, sort_order,
       fee_amount, fee_percent, min_amount, max_amount,
       is_gateway, gateway_provider, test_mode, supported_currencies,
       logo_url, created_at, updated_at
FROM public.payment_methods
WHERE is_active = true;

DROP POLICY IF EXISTS "Anyone can view active payment methods" ON public.payment_methods;
CREATE POLICY "Anyone can view active payment methods"
ON public.payment_methods
FOR SELECT
TO anon, authenticated
USING (is_active = true);

GRANT SELECT (id, code, name_ar, name_en, name_ur, name_bn, type, icon,
       instructions_ar, instructions_en, instructions_ur, instructions_bn,
       account_details, requires_proof, is_active, sort_order,
       fee_amount, fee_percent, min_amount, max_amount,
       is_gateway, gateway_provider, test_mode, supported_currencies,
       logo_url, created_at, updated_at)
ON public.payment_methods TO anon, authenticated;

GRANT SELECT ON public.payment_methods_public TO anon, authenticated;
