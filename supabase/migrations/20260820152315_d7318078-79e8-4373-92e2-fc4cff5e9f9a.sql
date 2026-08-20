UPDATE public.payment_methods SET test_mode = false WHERE test_mode IS DISTINCT FROM false;
ALTER TABLE public.payment_methods ALTER COLUMN test_mode SET DEFAULT false;