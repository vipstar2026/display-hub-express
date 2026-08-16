-- Column-level privileges: hide internal staff-only fields from regular users
REVOKE SELECT, UPDATE ON public.profiles FROM authenticated;

GRANT SELECT (id, display_name, avatar_url, phone, created_at, updated_at)
  ON public.profiles TO authenticated;

GRANT UPDATE (display_name, avatar_url, phone, updated_at)
  ON public.profiles TO authenticated;

GRANT ALL ON public.profiles TO service_role;