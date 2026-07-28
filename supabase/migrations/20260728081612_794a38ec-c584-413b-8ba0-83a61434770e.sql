-- 1) Staff fields on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS staff_notes text,
  ADD COLUMN IF NOT EXISTS is_suspended boolean NOT NULL DEFAULT false;

CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update all profiles"
ON public.profiles FOR UPDATE TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 2) Granular per-user permissions
CREATE TABLE IF NOT EXISTS public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL,
  granted_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, permission)
);

GRANT SELECT ON public.user_permissions TO authenticated;
GRANT ALL ON public.user_permissions TO service_role;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own permissions"
ON public.user_permissions FOR SELECT TO authenticated
USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Permission check helper
CREATE OR REPLACE FUNCTION public.has_permission(_user_id uuid, _permission text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
  SELECT private.has_role(_user_id, 'admin'::public.app_role)
      OR EXISTS (SELECT 1 FROM public.user_permissions up
                 WHERE up.user_id = _user_id AND up.permission = _permission);
$$;
REVOKE ALL ON FUNCTION public.has_permission(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_permission(uuid, text) TO authenticated;

-- 4) Extended admin listing
CREATE OR REPLACE FUNCTION public.admin_list_users_full()
RETURNS TABLE(
  id uuid, email text, display_name text, avatar_url text, phone text,
  job_title text, department text, staff_notes text, is_suspended boolean,
  email_confirmed boolean, created_at timestamptz, last_sign_in_at timestamptz,
  roles text[], permissions text[], orders_count bigint, total_spent numeric
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  RETURN QUERY
  SELECT u.id, u.email::text, p.display_name, p.avatar_url, p.phone,
         p.job_title, p.department, p.staff_notes, COALESCE(p.is_suspended,false),
         (u.email_confirmed_at IS NOT NULL), u.created_at, u.last_sign_in_at,
         COALESCE((SELECT array_agg(r.role::text ORDER BY r.role::text) FROM public.user_roles r WHERE r.user_id = u.id), ARRAY[]::text[]),
         COALESCE((SELECT array_agg(up.permission ORDER BY up.permission) FROM public.user_permissions up WHERE up.user_id = u.id), ARRAY[]::text[]),
         COALESCE((SELECT count(*) FROM public.orders o WHERE o.buyer_id = u.id), 0)::bigint,
         COALESCE((SELECT sum(o.total) FROM public.orders o WHERE o.buyer_id = u.id AND o.payment_status = 'succeeded'), 0)
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_list_users_full() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users_full() TO authenticated;

-- 5) Set the full permission set for a user
CREATE OR REPLACE FUNCTION public.admin_set_user_permissions(_user_id uuid, _permissions text[])
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  DELETE FROM public.user_permissions WHERE user_id = _user_id
    AND NOT (permission = ANY(COALESCE(_permissions, ARRAY[]::text[])));
  INSERT INTO public.user_permissions (user_id, permission, granted_by)
  SELECT _user_id, perm, auth.uid()
  FROM unnest(COALESCE(_permissions, ARRAY[]::text[])) AS perm
  ON CONFLICT (user_id, permission) DO NOTHING;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_set_user_permissions(uuid, text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_user_permissions(uuid, text[]) TO authenticated;

-- 6) Update staff details
CREATE OR REPLACE FUNCTION public.admin_update_user_profile(_user_id uuid, payload jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'private'
AS $$
BEGIN
  IF NOT private.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;
  INSERT INTO public.profiles (id) VALUES (_user_id) ON CONFLICT (id) DO NOTHING;
  UPDATE public.profiles p SET
    display_name = CASE WHEN payload ? 'display_name' THEN NULLIF(payload->>'display_name','') ELSE p.display_name END,
    phone        = CASE WHEN payload ? 'phone' THEN NULLIF(payload->>'phone','') ELSE p.phone END,
    job_title    = CASE WHEN payload ? 'job_title' THEN NULLIF(payload->>'job_title','') ELSE p.job_title END,
    department   = CASE WHEN payload ? 'department' THEN NULLIF(payload->>'department','') ELSE p.department END,
    staff_notes  = CASE WHEN payload ? 'staff_notes' THEN NULLIF(payload->>'staff_notes','') ELSE p.staff_notes END,
    is_suspended = CASE WHEN payload ? 'is_suspended' THEN (payload->>'is_suspended')::boolean ELSE p.is_suspended END,
    updated_at = now()
  WHERE p.id = _user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_update_user_profile(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_update_user_profile(uuid, jsonb) TO authenticated;
