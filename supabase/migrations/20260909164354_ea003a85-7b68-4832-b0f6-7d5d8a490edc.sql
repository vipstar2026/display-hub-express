REVOKE SELECT (cost_price) ON public.products FROM anon;
REVOKE SELECT (cost_price) ON public.products FROM authenticated;

CREATE OR REPLACE FUNCTION public.get_product_costs()
RETURNS TABLE (id uuid, name_en text, name_ar text, sku text, stock integer, cost_price numeric)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name_en, p.name_ar, p.sku, p.stock, p.cost_price
  FROM public.products p
  WHERE public.has_role(auth.uid(), 'admin')
  ORDER BY p.name_en
$$;

REVOKE ALL ON FUNCTION public.get_product_costs() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_product_costs() TO authenticated, service_role;