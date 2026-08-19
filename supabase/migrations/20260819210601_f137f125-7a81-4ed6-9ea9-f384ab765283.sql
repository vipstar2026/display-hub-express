-- Restore public access to the payment-method display data used by guest checkout.
GRANT SELECT (account_details) ON public.payment_methods TO anon;
GRANT SELECT ON public.payment_methods_public TO anon, authenticated;