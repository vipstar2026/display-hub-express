CREATE SEQUENCE IF NOT EXISTS public.journal_entry_seq START 1001;

CREATE OR REPLACE FUNCTION public.post_order_journal(_order_id uuid, _reverse boolean DEFAULT false)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  o record;
  a_cash uuid; a_sales uuid; a_vat uuid; a_cogs uuid; a_inv uuid;
  je uuid;
  net numeric; cogs numeric := 0;
  sign int := CASE WHEN _reverse THEN -1 ELSE 1 END;
  ref text := CASE WHEN _reverse THEN 'order_refund' ELSE 'order_paid' END;
BEGIN
  SELECT id, order_number, total, tax, currency, payment_method INTO o
  FROM public.orders WHERE id = _order_id;
  IF o.id IS NULL THEN RETURN NULL; END IF;

  IF EXISTS (SELECT 1 FROM public.journal_entries
             WHERE reference_type = ref AND reference_id = _order_id) THEN
    RETURN NULL;
  END IF;

  SELECT id INTO a_cash  FROM public.accounts WHERE code = '1010';
  SELECT id INTO a_sales FROM public.accounts WHERE code = '4000';
  SELECT id INTO a_vat   FROM public.accounts WHERE code = '2100';
  SELECT id INTO a_cogs  FROM public.accounts WHERE code = '5000';
  SELECT id INTO a_inv   FROM public.accounts WHERE code = '1200';
  IF a_cash IS NULL OR a_sales IS NULL OR a_vat IS NULL THEN RETURN NULL; END IF;

  net := COALESCE(o.total,0) - COALESCE(o.tax,0);

  SELECT COALESCE(SUM(oi.quantity * COALESCE(p.cost_price,0)),0) INTO cogs
  FROM public.order_items oi JOIN public.products p ON p.id = oi.product_id
  WHERE oi.order_id = _order_id AND p.type = 'physical';

  INSERT INTO public.journal_entries (entry_number, entry_date, description, reference_type, reference_id, total_debit, total_credit)
  VALUES ('JE-' || to_char(now(),'YYYY') || '-' || nextval('public.journal_entry_seq'),
          current_date,
          CASE WHEN _reverse THEN 'Refund for order ' ELSE 'Payment for order ' END || o.order_number,
          ref, _order_id,
          COALESCE(o.total,0) + cogs, COALESCE(o.total,0) + cogs)
  RETURNING id INTO je;

  INSERT INTO public.journal_lines (entry_id, account_id, debit, credit, description) VALUES
    (je, a_cash,  GREATEST(sign,0) * COALESCE(o.total,0), GREATEST(-sign,0) * COALESCE(o.total,0), 'Payment received'),
    (je, a_sales, GREATEST(-sign,0) * net, GREATEST(sign,0) * net, 'Sales revenue'),
    (je, a_vat,   GREATEST(-sign,0) * COALESCE(o.tax,0), GREATEST(sign,0) * COALESCE(o.tax,0), 'VAT payable');

  IF cogs > 0 AND a_cogs IS NOT NULL AND a_inv IS NOT NULL THEN
    INSERT INTO public.journal_lines (entry_id, account_id, debit, credit, description) VALUES
      (je, a_cogs, GREATEST(sign,0) * cogs, GREATEST(-sign,0) * cogs, 'Cost of goods sold'),
      (je, a_inv,  GREATEST(-sign,0) * cogs, GREATEST(sign,0) * cogs, 'Inventory');
  END IF;

  RETURN je;
END;
$fn$;

REVOKE ALL ON FUNCTION public.post_order_journal(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.post_order_journal(uuid, boolean) TO service_role;

CREATE OR REPLACE FUNCTION public.tg_orders_journal()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.payment_status::text = 'succeeded'
     AND OLD.payment_status::text IS DISTINCT FROM 'succeeded' THEN
    PERFORM public.post_order_journal(NEW.id, false);
  ELSIF NEW.payment_status::text = 'refunded'
     AND OLD.payment_status::text IS DISTINCT FROM 'refunded' THEN
    PERFORM public.post_order_journal(NEW.id, true);
  END IF;
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_orders_journal ON public.orders;
CREATE TRIGGER trg_orders_journal
AFTER UPDATE OF payment_status ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_orders_journal();