
ALTER TABLE public.payment_methods DROP CONSTRAINT IF EXISTS payment_methods_type_check;
ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_type_check
  CHECK (type IN ('bank_transfer','benefit','stc_pay','cash','wallet','card','bnpl','crypto','other'));
