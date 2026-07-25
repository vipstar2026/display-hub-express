
CREATE OR REPLACE FUNCTION public.tg_orders_on_paid()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.payment_status = 'succeeded' AND (OLD.payment_status IS DISTINCT FROM 'succeeded') THEN
    PERFORM public.assign_digital_codes(NEW.id);
  END IF;
  RETURN NEW;
END $$;
