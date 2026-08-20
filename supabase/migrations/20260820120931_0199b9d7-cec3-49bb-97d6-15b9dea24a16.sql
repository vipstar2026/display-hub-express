REVOKE ALL ON FUNCTION public.verify_cron_key(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_key(text, text) TO service_role;