
CREATE TABLE public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  name_ur text,
  type text NOT NULL CHECK (type IN ('bank_transfer','benefit','stc_pay','cash','wallet','other')),
  icon text,
  instructions_ar text,
  instructions_en text,
  instructions_ur text,
  account_details jsonb DEFAULT '{}'::jsonb,
  requires_proof boolean DEFAULT true,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  fee_amount numeric(10,3) DEFAULT 0,
  fee_percent numeric(5,2) DEFAULT 0,
  min_amount numeric(10,3) DEFAULT 0,
  max_amount numeric(10,3),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_methods TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_methods TO authenticated;
GRANT ALL ON public.payment_methods TO service_role;

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone views active payment methods"
  ON public.payment_methods FOR SELECT
  USING (is_active = true OR private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins manage payment methods"
  ON public.payment_methods FOR ALL
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_payment_methods_updated
  BEFORE UPDATE ON public.payment_methods
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method_id uuid REFERENCES public.payment_methods(id),
  ADD COLUMN IF NOT EXISTS payment_proof_url text,
  ADD COLUMN IF NOT EXISTS payment_reference text,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS payment_confirmed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS customer_notes text;

CREATE POLICY "Customers upload own proofs"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "View own proofs or admin"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'payment-proofs' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR private.has_role(auth.uid(), 'admin'::public.app_role)
  ));

CREATE POLICY "Admins delete proofs"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'payment-proofs' AND private.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.payment_methods (code, name_ar, name_en, name_ur, type, icon, instructions_ar, instructions_en, account_details, requires_proof, sort_order) VALUES
('bank_nbb', 'تحويل بنكي - NBB', 'Bank Transfer - NBB', 'بینک ٹرانسفر - NBB', 'bank_transfer', 'landmark',
 'حوّل المبلغ إلى الحساب أدناه ثم ارفع صورة إيصال التحويل.',
 'Transfer the amount to the account below then upload a screenshot of the receipt.',
 '{"bank":"National Bank of Bahrain","account_name":"VIPSTAR","iban":"BH00NBOB00000000000000","account_number":"0000000000","swift":"NBOBBHBM"}'::jsonb,
 true, 1),
('benefit_pay', 'بنفت باي', 'Benefit Pay', 'بینیفٹ پے', 'benefit', 'smartphone',
 'أرسل المبلغ عبر تطبيق Benefit Pay إلى الرقم أدناه ثم ارفع لقطة الشاشة.',
 'Send the amount via Benefit Pay app to the number below then upload a screenshot.',
 '{"phone":"+973 0000 0000","name":"VIPSTAR"}'::jsonb,
 true, 2),
('cash_delivery', 'الدفع عند الاستلام', 'Cash on Delivery', 'کیش آن ڈیلیوری', 'cash', 'banknote',
 'ادفع نقداً عند استلام الطلب. متاح داخل البحرين فقط.',
 'Pay in cash upon delivery. Available inside Bahrain only.',
 '{}'::jsonb,
 false, 3);
