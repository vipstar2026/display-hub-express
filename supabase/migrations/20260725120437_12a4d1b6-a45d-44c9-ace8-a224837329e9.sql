
-- Allow users to read their own notifications + broadcasts (user_id IS NULL), and mark them as read
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users mark own notifications read" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Broadcast helper (admins only)
CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(_title text, _message text, _severity text DEFAULT 'info', _link text DEFAULT NULL, _target text DEFAULT 'all')
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inserted integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _target = 'all' THEN
    -- Global broadcast: one row with NULL user_id, visible to all authenticated users
    INSERT INTO public.notifications (type, title, message, severity, link, user_id)
    VALUES ('broadcast', _title, _message, _severity, _link, NULL);
    inserted := 1;
  ELSIF _target = 'customers' THEN
    INSERT INTO public.notifications (type, title, message, severity, link, user_id)
    SELECT 'broadcast', _title, _message, _severity, _link, ur.user_id
    FROM public.user_roles ur WHERE ur.role = 'customer';
    GET DIAGNOSTICS inserted = ROW_COUNT;
  ELSIF _target = 'admins' THEN
    INSERT INTO public.notifications (type, title, message, severity, link, user_id)
    SELECT 'broadcast', _title, _message, _severity, _link, ur.user_id
    FROM public.user_roles ur WHERE ur.role = 'admin';
    GET DIAGNOSTICS inserted = ROW_COUNT;
  END IF;

  RETURN inserted;
END;
$$;

-- Notify admins when a new order is created
CREATE OR REPLACE FUNCTION public.tg_notify_new_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (type, title, message, severity, link, user_id)
  SELECT 'order',
         'New order ' || NEW.order_number,
         COALESCE(NEW.buyer_name, NEW.buyer_email) || ' · ' || NEW.total::text || ' ' || NEW.currency,
         'info',
         '/admin/orders',
         ur.user_id
  FROM public.user_roles ur WHERE ur.role = 'admin';
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_notify_new_order ON public.orders;
CREATE TRIGGER trg_notify_new_order
AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_notify_new_order();
