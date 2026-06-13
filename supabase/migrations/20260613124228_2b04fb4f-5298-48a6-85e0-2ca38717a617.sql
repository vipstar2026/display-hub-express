
-- 1. site_settings: hide sensitive keys from public read
DROP POLICY IF EXISTS "Site settings public read" ON public.site_settings;
CREATE POLICY "Site settings public read non-sensitive"
ON public.site_settings FOR SELECT
USING (key NOT IN ('payment_gateways','payment_gateway_secrets','smtp','api_keys','secrets'));

-- 2. support_tickets: users do not need to read tickets; remove SELECT policy to hide admin_notes
DROP POLICY IF EXISTS "Users view own tickets" ON public.support_tickets;

-- 3. user_roles: harden against self-escalation to admin
CREATE OR REPLACE FUNCTION public.prevent_admin_self_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'admin' THEN
    -- Allow if no admin exists yet (bootstrap) OR caller is already an admin
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
       AND NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only existing admins may grant the admin role';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.prevent_admin_self_assignment() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS trg_prevent_admin_self_assignment ON public.user_roles;
CREATE TRIGGER trg_prevent_admin_self_assignment
BEFORE INSERT OR UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.prevent_admin_self_assignment();

-- 4. Lock down SECURITY DEFINER functions: revoke EXECUTE from anon (and public)
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.auto_approve_admin_vendor() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_vendor_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- 5. Storage: vendor-assets bucket — block public listing (files still accessible by direct public URL)
DROP POLICY IF EXISTS "Public read vendor-assets" ON storage.objects;
