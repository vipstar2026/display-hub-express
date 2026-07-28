CREATE TABLE IF NOT EXISTS private.cron_keys (
  name text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON private.cron_keys FROM PUBLIC, anon, authenticated;

INSERT INTO private.cron_keys (name, value)
VALUES ('afs_reconcile', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

CREATE OR REPLACE FUNCTION public.verify_cron_key(_name text, _key text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'private', 'public'
AS $$
  SELECT EXISTS (SELECT 1 FROM private.cron_keys k WHERE k.name = _name AND k.value = _key);
$$;

REVOKE EXECUTE ON FUNCTION public.verify_cron_key(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_cron_key(text, text) TO service_role;