-- Signed-in users must not read credentials/config either
REVOKE SELECT ON public.payment_methods FROM authenticated;
GRANT SELECT (
  id, code, name_ar, name_en, name_ur, type, icon,
  instructions_ar, instructions_en, instructions_ur,
  account_details, requires_proof, is_active, sort_order,
  fee_amount, fee_percent, min_amount, max_amount,
  is_gateway, gateway_provider, test_mode, supported_currencies,
  logo_url, created_at, updated_at
) ON public.payment_methods TO authenticated;

-- Admin-only full read (includes credentials/config)
CREATE OR REPLACE FUNCTION public.admin_list_payment_methods()
RETURNS SETOF public.payment_methods
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
  SELECT * FROM public.payment_methods
  WHERE private.has_role(auth.uid(), 'admin'::public.app_role)
  ORDER BY sort_order, name_en;
$$;

REVOKE ALL ON FUNCTION public.admin_list_payment_methods() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_payment_methods() TO authenticated;
