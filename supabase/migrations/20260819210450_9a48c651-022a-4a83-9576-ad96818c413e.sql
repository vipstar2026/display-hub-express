-- 1) Remove development placeholder product (verified: no order items, digital codes, wishlist, reviews, flash sales, POS, PO or inventory references)
DELETE FROM public.products WHERE id = '881c89d7-af10-47bb-9982-2545d46a232c' AND slug = 'product';

-- 2) Profiles least-privilege: split the broad display policy and remove sensitive column reads
DROP POLICY IF EXISTS "profiles_public_display" ON public.profiles;

CREATE POLICY "profiles_public_display_anon"
ON public.profiles FOR SELECT TO anon USING (true);

CREATE POLICY "profiles_public_display_auth"
ON public.profiles FOR SELECT TO authenticated USING (true);

-- authenticated visitors may only read public display columns of other users
REVOKE SELECT (phone, created_at) ON public.profiles FROM authenticated;
-- (staff_notes, job_title, department, is_suspended, updated_at were never granted)

-- 3) Payment methods: ensure secret columns can never be selected by public roles
REVOKE SELECT (credentials, config) ON public.payment_methods FROM anon, authenticated;
REVOKE SELECT (account_details) ON public.payment_methods FROM anon;