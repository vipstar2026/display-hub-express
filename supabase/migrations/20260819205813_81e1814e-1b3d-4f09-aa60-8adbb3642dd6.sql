
-- Allow the public reviews view (security_invoker) to resolve reviewer display info
GRANT SELECT (id, display_name, avatar_url) ON public.profiles TO anon, authenticated;

DROP POLICY IF EXISTS "profiles_public_display" ON public.profiles;
CREATE POLICY "profiles_public_display"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);
