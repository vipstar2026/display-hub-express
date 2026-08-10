CREATE OR REPLACE FUNCTION public.tg_orders_fulfill_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  it record;
  codes_text text := '';
  missing int := 0;
  inv_id uuid;
  inv_no text;
  body text;
  v_rate numeric := 0;
  v_incl boolean := false;
  net_subtotal numeric;
BEGIN
  IF NEW.payment_status::text <> 'succeeded'
     OR OLD.payment_status::text IS NOT DISTINCT FROM 'succeeded' THEN
    RETURN NEW;
  END IF;

  FOR it IN
    SELECT oi.product_id, oi.quantity, oi.product_name, p.track_stock, p.type, p.cost_price
    FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    WHERE oi.order_id = NEW.id
  LOOP
    IF it.type = 'physical' AND it.track_stock THEN
      UPDATE public.products SET stock = GREATEST(stock - it.quantity, 0) WHERE id = it.product_id;
      INSERT INTO public.inventory_movements (product_id, movement_type, quantity, cost_per_unit, reference_type, reference_id, notes)
      VALUES (it.product_id, 'sale', -it.quantity, COALESCE(it.cost_price, 0), 'order', NEW.id, 'Online order ' || NEW.order_number);
    END IF;
  END LOOP;

  SELECT COALESCE(SUM(oi.quantity - COALESCE(jsonb_array_length(oi.delivered_codes), 0)), 0)
  INTO missing
  FROM public.order_items oi
  JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = NEW.id AND p.type IN ('digital','subscription');

  IF missing > 0 THEN
    INSERT INTO public.notifications (type, title, message, severity, link, user_id)
    SELECT 'stock', 'Digital codes missing',
           'Order ' || NEW.order_number || ' needs ' || missing || ' more code(s)',
           'warning', '/admin/orders', ur.user_id
    FROM public.user_roles ur WHERE ur.role = 'admin';
  END IF;

  SELECT COALESCE(vat_percent,0), COALESCE(prices_include_vat,false)
    INTO v_rate, v_incl FROM public.site_settings WHERE id = 1;

  -- VAT-exclusive net subtotal for the tax invoice (ZATCA-style breakdown)
  net_subtotal := CASE WHEN v_incl THEN round(NEW.subtotal - COALESCE(NEW.tax,0), 3)
                       ELSE NEW.subtotal END;

  SELECT id INTO inv_id FROM public.invoices WHERE order_id = NEW.id LIMIT 1;
  IF inv_id IS NULL THEN
    inv_no := 'INV-' || to_char(now(), 'YYYY') || '-' || nextval('public.invoice_number_seq');
    INSERT INTO public.invoices (invoice_number, order_id, customer_name, customer_email, customer_phone,
                                 subtotal, tax_rate, tax, discount, total, currency, status)
    VALUES (inv_no, NEW.id, NEW.buyer_name, NEW.buyer_email, NEW.buyer_phone,
            net_subtotal,
            CASE WHEN v_rate > 0 THEN v_rate
                 WHEN net_subtotal > 0 THEN round(COALESCE(NEW.tax,0) / net_subtotal * 100, 2)
                 ELSE 0 END,
            COALESCE(NEW.tax,0), NEW.discount, NEW.total, NEW.currency, 'paid')
    RETURNING id INTO inv_id;
    UPDATE public.orders SET invoice_id = inv_id WHERE id = NEW.id AND invoice_id IS NULL;
  END IF;

  SELECT string_agg(line, E'\n') INTO codes_text FROM (
    SELECT oi.product_name || ': ' || (c->>'code') AS line
    FROM public.order_items oi,
         LATERAL jsonb_array_elements(COALESCE(oi.delivered_codes, '[]'::jsonb)) c
    WHERE oi.order_id = NEW.id
  ) s;

  body := 'Order ' || NEW.order_number || E'\n'
       || 'Total: ' || NEW.total || ' ' || NEW.currency || E'\n'
       || 'Payment: ' || COALESCE(NEW.payment_method, 'online') || E'\n\n'
       || CASE WHEN codes_text IS NOT NULL AND codes_text <> ''
               THEN 'Your digital codes:' || E'\n' || codes_text || E'\n\n'
               ELSE '' END
       || 'Track your order: /track';

  IF NOT EXISTS (SELECT 1 FROM public.email_outbox WHERE order_id = NEW.id AND template = 'order_paid') THEN
    INSERT INTO public.email_outbox (to_email, to_name, subject, body, template, order_id)
    VALUES (NEW.buyer_email, NEW.buyer_name,
            'Payment received — order ' || NEW.order_number, body, 'order_paid', NEW.id);
  END IF;

  RETURN NEW;
END;
$fn$;

-- Auto-cancel stale unpaid online orders so stock/coupons are not held forever
CREATE OR REPLACE FUNCTION public.cancel_stale_pending_orders(_minutes integer DEFAULT 30)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE n int;
BEGIN
  WITH upd AS (
    UPDATE public.orders o
    SET status = 'cancelled',
        admin_notes = COALESCE(o.admin_notes || E'\n', '') || 'Auto-cancelled: payment not completed'
    WHERE o.status::text = 'pending'
      AND o.payment_status::text IN ('pending','failed')
      AND o.channel <> 'pos'
      AND o.payment_proof_url IS NULL
      AND o.created_at < now() - make_interval(mins => _minutes)
    RETURNING 1
  )
  SELECT count(*) INTO n FROM upd;
  RETURN n;
END;
$fn$;

REVOKE ALL ON FUNCTION public.cancel_stale_pending_orders(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_stale_pending_orders(integer) TO service_role;

SELECT cron.schedule('cancel-stale-orders', '*/15 * * * *', $$SELECT public.cancel_stale_pending_orders(30)$$)
WHERE NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cancel-stale-orders');