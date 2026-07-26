
-- Admin: list users with email + roles (joins auth.users safely via SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text,
  avatar_url text,
  phone text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    p.display_name,
    p.avatar_url,
    p.phone,
    u.created_at,
    u.last_sign_in_at,
    COALESCE((SELECT array_agg(r.role::text ORDER BY r.role::text) FROM public.user_roles r WHERE r.user_id = u.id), ARRAY[]::text[]) AS roles
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.id = u.id
  ORDER BY u.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- Admin: toggle any role (admin/moderator/customer) on a user
CREATE OR REPLACE FUNCTION public.admin_toggle_user_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE existed boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) INTO existed;
  IF existed THEN
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = _role;
    RETURN false;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _role)
      ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_toggle_user_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_role(uuid, app_role) TO authenticated;

-- Digital codes: stats per product for admin
CREATE OR REPLACE FUNCTION public.admin_digital_codes_stats()
RETURNS TABLE (product_id uuid, product_name text, total_codes bigint, used_codes bigint, available_codes bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY
  SELECT p.id, COALESCE(p.name_en, p.name_ar) AS product_name,
    COUNT(dc.id)::bigint,
    COUNT(dc.id) FILTER (WHERE dc.is_used)::bigint,
    COUNT(dc.id) FILTER (WHERE NOT dc.is_used)::bigint
  FROM public.products p
  LEFT JOIN public.digital_codes dc ON dc.product_id = p.id
  WHERE p.type IN ('digital','subscription')
  GROUP BY p.id, p.name_en, p.name_ar
  ORDER BY COALESCE(p.name_en, p.name_ar);
END;
$$;

REVOKE ALL ON FUNCTION public.admin_digital_codes_stats() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_digital_codes_stats() TO authenticated;
