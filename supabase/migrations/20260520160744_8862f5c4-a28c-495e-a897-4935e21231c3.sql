-- Auto-approve vendors owned by admins so admin can add products instantly
CREATE OR REPLACE FUNCTION public.auto_approve_admin_vendor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF public.has_role(NEW.owner_id, 'admin') THEN
    NEW.status := 'approved';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_approve_admin_vendor ON public.vendors;
CREATE TRIGGER trg_auto_approve_admin_vendor
BEFORE INSERT ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.auto_approve_admin_vendor();