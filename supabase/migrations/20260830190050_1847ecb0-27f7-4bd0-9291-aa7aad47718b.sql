-- 1) Unify has_role: rewrite every function and policy to public.has_role, then drop private.has_role
DO $$
DECLARE r record; def text;
BEGIN
  FOR r IN
    SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prokind = 'f'
      AND pg_get_functiondef(p.oid) ILIKE '%private.has_role%'
  LOOP
    def := regexp_replace(pg_get_functiondef(r.oid), 'private\.has_role', 'public.has_role', 'g');
    EXECUTE def;
  END LOOP;
END $$;

DO $$
DECLARE r record; role_list text; using_expr text; check_expr text; stmt text;
BEGIN
  FOR r IN
    SELECT pp.schemaname, pp.tablename, pp.policyname, pp.permissive, pp.roles AS rls_roles, pp.cmd, pp.qual, pp.with_check
    FROM pg_policies pp
    WHERE pp.qual ILIKE '%private.has_role%' OR pp.with_check ILIKE '%private.has_role%'
  LOOP
    role_list := array_to_string(r.rls_roles, ', ');
    using_expr := regexp_replace(COALESCE(r.qual, ''), 'private\.has_role', 'public.has_role', 'g');
    check_expr := regexp_replace(COALESCE(r.with_check, ''), 'private\.has_role', 'public.has_role', 'g');
    stmt := format('CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s',
                   r.policyname, r.schemaname, r.tablename,
                   CASE WHEN r.permissive = 'PERMISSIVE' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
                   r.cmd, role_list);
    IF r.qual IS NOT NULL THEN stmt := stmt || format(' USING (%s)', using_expr); END IF;
    IF r.with_check IS NOT NULL THEN stmt := stmt || format(' WITH CHECK (%s)', check_expr); END IF;
    BEGIN
      EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
      EXECUTE stmt;
    EXCEPTION WHEN insufficient_privilege THEN
      RAISE NOTICE 'skipped policy % on %.%', r.policyname, r.schemaname, r.tablename;
    END;
  END LOOP;
END $$;

DROP FUNCTION IF EXISTS private.has_role(uuid, public.app_role);

-- 2) Mask gateway credentials for the admin UI
CREATE OR REPLACE FUNCTION public.admin_list_payment_methods()
RETURNS SETOF public.payment_methods
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE row_out public.payment_methods%ROWTYPE;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RETURN; END IF;
  FOR row_out IN SELECT * FROM public.payment_methods ORDER BY sort_order, name_en LOOP
    SELECT COALESCE(jsonb_object_agg(k, '***set***'), '{}'::jsonb)
      INTO row_out.credentials
      FROM jsonb_each_text(COALESCE(row_out.credentials, '{}'::jsonb)) AS t(k, v)
     WHERE COALESCE(v, '') <> '';
    SELECT COALESCE(jsonb_object_agg(k, CASE WHEN k ~* '(key|token|secret|password|pass)' AND COALESCE(v,'') <> '' THEN '***set***' ELSE v END), '{}'::jsonb)
      INTO row_out.config
      FROM jsonb_each_text(COALESCE(row_out.config, '{}'::jsonb)) AS t(k, v);
    RETURN NEXT row_out;
  END LOOP;
END;
$function$;

-- write-only credential updates: empty/masked values leave the stored value untouched
CREATE OR REPLACE FUNCTION public.admin_set_payment_credentials(_id uuid, _values jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE merged jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  SELECT COALESCE(credentials, '{}'::jsonb) INTO merged FROM public.payment_methods WHERE id = _id;
  IF merged IS NULL THEN RAISE EXCEPTION 'payment_method_not_found'; END IF;
  SELECT merged || COALESCE(jsonb_object_agg(k, v), '{}'::jsonb)
    INTO merged
    FROM jsonb_each_text(COALESCE(_values, '{}'::jsonb)) AS t(k, v)
   WHERE COALESCE(v, '') <> '' AND v <> '***set***';
  UPDATE public.payment_methods SET credentials = merged, updated_at = now() WHERE id = _id;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_set_payment_credentials(uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_payment_credentials(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_payment_methods() TO authenticated;

-- 3) Refund safety enforced in the database
CREATE OR REPLACE FUNCTION public.tg_payment_refunds_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE total numeric(18,3); paid numeric(18,3);
BEGIN
  SELECT expected_amount INTO paid FROM public.payment_attempts WHERE id = NEW.attempt_id;
  SELECT COALESCE(sum(amount), 0) INTO total
    FROM public.payment_refunds
   WHERE attempt_id = NEW.attempt_id
     AND id <> NEW.id
     AND state IN ('processing', 'succeeded', 'requires_review');
  IF NEW.state IN ('processing', 'succeeded', 'requires_review')
     AND round(total + NEW.amount, 3) > round(COALESCE(paid, 0), 3) THEN
    RAISE EXCEPTION 'refund_exceeds_paid_amount';
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS payment_refunds_guard ON public.payment_refunds;
CREATE TRIGGER payment_refunds_guard
BEFORE INSERT OR UPDATE ON public.payment_refunds
FOR EACH ROW EXECUTE FUNCTION public.tg_payment_refunds_guard();

CREATE OR REPLACE FUNCTION public.begin_payment_refund(_actor uuid, _order_id uuid, _amount numeric DEFAULT NULL, _reason text DEFAULT NULL)
RETURNS TABLE(refund_id uuid, attempt_id uuid, provider text, external_payment_id text, currency text, amount numeric, remaining numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE a public.payment_attempts%ROWTYPE; refunded numeric(18,3); rem numeric(18,3); amt numeric(18,3); new_id uuid;
BEGIN
  IF NOT public.has_role(_actor, 'admin'::public.app_role) THEN RAISE EXCEPTION 'not_authorized'; END IF;
  PERFORM 1 FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'order_not_found'; END IF;

  SELECT * INTO a FROM public.payment_attempts
   WHERE order_id = _order_id AND state IN ('succeeded', 'refunded')
   ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  IF NOT FOUND OR a.external_payment_id IS NULL THEN RAISE EXCEPTION 'no_refundable_payment'; END IF;

  SELECT COALESCE(sum(r.amount), 0) INTO refunded
    FROM public.payment_refunds r
   WHERE r.attempt_id = a.id AND r.state IN ('processing', 'succeeded', 'requires_review');
  rem := round(a.expected_amount - refunded, 3);
  amt := round(COALESCE(_amount, rem), 3);
  IF amt <= 0 OR amt > rem THEN RAISE EXCEPTION 'invalid_refund_amount'; END IF;

  INSERT INTO public.payment_refunds(attempt_id, amount, currency, state, idempotency_key, reason, requested_by)
  VALUES (a.id, amt, a.currency, 'processing', 'refund:' || a.id || ':' || gen_random_uuid(), _reason, _actor)
  RETURNING id INTO new_id;

  RETURN QUERY SELECT new_id, a.id, a.provider, a.external_payment_id, a.currency, amt, rem;
END;
$function$;

REVOKE ALL ON FUNCTION public.begin_payment_refund(uuid, uuid, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.begin_payment_refund(uuid, uuid, numeric, text) TO service_role;