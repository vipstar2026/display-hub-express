CREATE TABLE IF NOT EXISTS public.email_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email text NOT NULL,
  to_name text,
  subject text NOT NULL,
  body text NOT NULL,
  template text NOT NULL DEFAULT 'generic',
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued',
  error text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_outbox TO authenticated;
GRANT ALL ON public.email_outbox TO service_role;

ALTER TABLE public.email_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage email outbox"
ON public.email_outbox FOR ALL TO authenticated
USING (private.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER email_outbox_touch BEFORE UPDATE ON public.email_outbox
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE SEQUENCE IF NOT EXISTS public.invoice_number_seq START 1000;

CREATE OR REPLACE FUNCTION public.tg_orders_fulfill_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  it record;
  codes_text text := '';
  missing int := 0;
  inv_id uuid;
  inv_no text;
  body text;
BEGIN
  IF NEW.payment_status::text <> 'succeeded'
     OR OLD.payment_status::text IS NOT DISTINCT FROM 'succeeded' THEN
    RETURN NEW;
  END IF;

  -- 1) stock deduction for physical, tracked products
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

  -- 2) digital codes shortfall check (codes are assigned by trg_orders_on_paid)
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

  -- 3) invoice (once)
  SELECT id INTO inv_id FROM public.invoices WHERE order_id = NEW.id LIMIT 1;
  IF inv_id IS NULL THEN
    inv_no := 'INV-' || to_char(now(), 'YYYY') || '-' || nextval('public.invoice_number_seq');
    INSERT INTO public.invoices (invoice_number, order_id, customer_name, customer_email, customer_phone,
                                 subtotal, tax_rate, tax, discount, total, currency, status)
    VALUES (inv_no, NEW.id, NEW.buyer_name, NEW.buyer_email, NEW.buyer_phone,
            NEW.subtotal,
            CASE WHEN NEW.subtotal > 0 THEN round(NEW.tax / NEW.subtotal * 100, 2) ELSE 0 END,
            NEW.tax, NEW.discount, NEW.total, NEW.currency, 'paid')
    RETURNING id INTO inv_id;
    UPDATE public.orders SET invoice_id = inv_id WHERE id = NEW.id AND invoice_id IS NULL;
  END IF;

  -- 4) queue confirmation email with delivered codes
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
$$;

REVOKE EXECUTE ON FUNCTION public.tg_orders_fulfill_paid() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_orders_fulfill_paid ON public.orders;
CREATE TRIGGER trg_orders_fulfill_paid
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_orders_fulfill_paid();