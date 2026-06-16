
-- Fix 1: Restrict buyer updates on orders to safe columns only.
-- Buyers may change shipping address fields, notes, or cancel the order.
-- Admins retain full access (trigger only restricts non-admins).
CREATE OR REPLACE FUNCTION public.restrict_buyer_order_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Admins bypass column restrictions
  IF private.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  -- Buyers must not change financial / ownership fields
  IF NEW.buyer_id     IS DISTINCT FROM OLD.buyer_id
  OR NEW.total        IS DISTINCT FROM OLD.total
  OR NEW.subtotal     IS DISTINCT FROM OLD.subtotal
  OR NEW.shipping     IS DISTINCT FROM OLD.shipping
  OR NEW.currency     IS DISTINCT FROM OLD.currency
  OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
  THEN
    RAISE EXCEPTION 'Buyers cannot modify financial or ownership fields on orders';
  END IF;

  -- Status: buyers may only set it to 'cancelled' (or leave unchanged)
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'cancelled'::public.order_status THEN
    RAISE EXCEPTION 'Buyers may only cancel pending orders';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_restrict_buyer_order_updates ON public.orders;
CREATE TRIGGER trg_restrict_buyer_order_updates
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.restrict_buyer_order_updates();

-- Fix 2: Tighten support_tickets INSERT policy so authenticated users
-- cannot submit tickets with user_id = NULL (orphaning them).
DROP POLICY IF EXISTS "Submit ticket as self or anonymous" ON public.support_tickets;
CREATE POLICY "Submit ticket as self or anonymous"
ON public.support_tickets
FOR INSERT
WITH CHECK (
  (auth.uid() IS NULL AND user_id IS NULL)
  OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
);
