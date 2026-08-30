-- 1. profiles: remove overly broad public read policies
DROP POLICY IF EXISTS "profiles_public_display_anon" ON public.profiles;
DROP POLICY IF EXISTS "profiles_public_display_auth" ON public.profiles;

-- 2. newsletter_campaigns: scope admin policy to authenticated
DROP POLICY IF EXISTS "admins manage newsletter campaigns" ON public.newsletter_campaigns;
CREATE POLICY "admins manage newsletter campaigns"
ON public.newsletter_campaigns FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 3. payment_methods: scope admin policies to authenticated
DROP POLICY IF EXISTS "Admins manage payment methods" ON public.payment_methods;
CREATE POLICY "Admins manage payment methods"
ON public.payment_methods FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins view all payment methods" ON public.payment_methods;
CREATE POLICY "Admins view all payment methods"
ON public.payment_methods FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 4. contact_messages: stop broadcasting via realtime
ALTER PUBLICATION supabase_realtime DROP TABLE public.contact_messages;