CREATE OR REPLACE FUNCTION public.force_product_draft_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.status := 'draft';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_force_product_draft_on_insert ON public.products;
CREATE TRIGGER trg_force_product_draft_on_insert
BEFORE INSERT ON public.products
FOR EACH ROW EXECUTE FUNCTION public.force_product_draft_on_insert();