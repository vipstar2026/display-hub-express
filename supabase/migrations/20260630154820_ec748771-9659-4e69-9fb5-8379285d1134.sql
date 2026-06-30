
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS barcode TEXT;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS tax NUMERIC(12,3) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_reference TEXT,
  ADD COLUMN IF NOT EXISTS invoice_id UUID,
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'online';

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, phone TEXT, email TEXT, address TEXT, notes TEXT,
  balance NUMERIC(14,3) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.suppliers TO authenticated;
GRANT ALL ON public.suppliers TO service_role;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage suppliers" ON public.suppliers FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE TRIGGER trg_suppliers_updated BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  po_number TEXT NOT NULL UNIQUE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal NUMERIC(14,3) NOT NULL DEFAULT 0,
  tax NUMERIC(14,3) NOT NULL DEFAULT 0,
  total NUMERIC(14,3) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BHD',
  notes TEXT, received_at TIMESTAMPTZ, created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_orders TO service_role;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage po" ON public.purchase_orders FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE TRIGGER trg_po_updated BEFORE UPDATE ON public.purchase_orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  cost_per_unit NUMERIC(12,3) NOT NULL,
  total NUMERIC(14,3) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.purchase_order_items TO service_role;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage po items" ON public.purchase_order_items FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  cost_per_unit NUMERIC(12,3) NOT NULL DEFAULT 0,
  reference_type TEXT, reference_id UUID, notes TEXT, created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_movements TO authenticated;
GRANT ALL ON public.inventory_movements TO service_role;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage inventory" ON public.inventory_movements FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name_ar TEXT NOT NULL, name_en TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage accounts" ON public.accounts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

INSERT INTO public.accounts (code, name_ar, name_en, type) VALUES
  ('1000','النقدية في الصندوق','Cash on Hand','asset'),
  ('1010','حساب البنك','Bank Account','asset'),
  ('1100','العملاء','Accounts Receivable','asset'),
  ('1200','المخزون','Inventory','asset'),
  ('2000','الموردون','Accounts Payable','liability'),
  ('2100','ضريبة القيمة المضافة المستحقة','VAT Payable','liability'),
  ('3000','رأس المال','Owner Equity','equity'),
  ('4000','المبيعات','Sales Revenue','income'),
  ('5000','تكلفة البضاعة المباعة','Cost of Goods Sold','expense'),
  ('5100','مصاريف تشغيلية','Operating Expenses','expense')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number TEXT NOT NULL UNIQUE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT, reference_type TEXT, reference_id UUID,
  total_debit NUMERIC(14,3) NOT NULL DEFAULT 0,
  total_credit NUMERIC(14,3) NOT NULL DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_entries TO authenticated;
GRANT ALL ON public.journal_entries TO service_role;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage journal" ON public.journal_entries FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.journal_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE RESTRICT,
  debit NUMERIC(14,3) NOT NULL DEFAULT 0,
  credit NUMERIC(14,3) NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_lines TO authenticated;
GRANT ALL ON public.journal_lines TO service_role;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage journal lines" ON public.journal_lines FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE SEQUENCE IF NOT EXISTS public.invoice_seq START 1000;
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE DEFAULT ('INV-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.invoice_seq')::text, 6, '0')),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  pos_sale_id UUID,
  customer_name TEXT, customer_email TEXT, customer_phone TEXT,
  subtotal NUMERIC(14,3) NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 10.00,
  tax NUMERIC(14,3) NOT NULL,
  discount NUMERIC(14,3) NOT NULL DEFAULT 0,
  total NUMERIC(14,3) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BHD',
  status TEXT NOT NULL DEFAULT 'issued',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "customer view own invoices" ON public.invoices FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid()));
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE TABLE IF NOT EXISTS public.pos_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cashier_id UUID NOT NULL,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at TIMESTAMPTZ,
  opening_cash NUMERIC(14,3) NOT NULL DEFAULT 0,
  closing_cash NUMERIC(14,3), expected_cash NUMERIC(14,3), difference NUMERIC(14,3),
  status TEXT NOT NULL DEFAULT 'open', notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_sessions TO authenticated;
GRANT ALL ON public.pos_sessions TO service_role;
ALTER TABLE public.pos_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage pos sessions" ON public.pos_sessions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.pos_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_number TEXT NOT NULL UNIQUE DEFAULT ('POS-' || to_char(now(),'YYYYMMDD') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6)),
  session_id UUID REFERENCES public.pos_sessions(id) ON DELETE SET NULL,
  cashier_id UUID NOT NULL,
  customer_name TEXT, customer_phone TEXT,
  subtotal NUMERIC(14,3) NOT NULL,
  tax NUMERIC(14,3) NOT NULL DEFAULT 0,
  discount NUMERIC(14,3) NOT NULL DEFAULT 0,
  total NUMERIC(14,3) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_reference TEXT, paid_amount NUMERIC(14,3), change_amount NUMERIC(14,3) DEFAULT 0,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_sales TO authenticated;
GRANT ALL ON public.pos_sales TO service_role;
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage pos sales" ON public.pos_sales FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.pos_sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL, sku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,3) NOT NULL,
  cost_per_unit NUMERIC(12,3) NOT NULL DEFAULT 0,
  discount NUMERIC(12,3) NOT NULL DEFAULT 0,
  total NUMERIC(14,3) NOT NULL
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pos_sale_items TO authenticated;
GRANT ALL ON public.pos_sale_items TO service_role;
ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage pos sale items" ON public.pos_sale_items FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, title TEXT NOT NULL, message TEXT, link TEXT,
  severity TEXT NOT NULL DEFAULT 'info',
  is_read BOOLEAN NOT NULL DEFAULT false,
  user_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage notifications" ON public.notifications FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, actor_email TEXT,
  action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id UUID,
  details JSONB, ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin view activity" ON public.activity_log FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "admin insert activity" ON public.activity_log FOR INSERT TO authenticated
  WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'tap',
  provider_charge_id TEXT,
  amount NUMERIC(14,3) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BHD',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT, redirect_url TEXT,
  raw_response JSONB, failure_reason TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payment_transactions TO authenticated;
GRANT ALL ON public.payment_transactions TO service_role;
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin manage tx" ON public.payment_transactions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin'::public.app_role)) WITH CHECK (private.has_role(auth.uid(),'admin'::public.app_role));
CREATE POLICY "customer view own tx" ON public.payment_transactions FOR SELECT TO authenticated
  USING (order_id IN (SELECT id FROM public.orders WHERE buyer_id = auth.uid()));
CREATE TRIGGER trg_tx_updated BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_inv_mov_product ON public.inventory_movements(product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_lines_account ON public.journal_lines(account_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON public.journal_entries(entry_date DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON public.activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pos_sales_session ON public.pos_sales(session_id);
CREATE INDEX IF NOT EXISTS idx_tx_order ON public.payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON public.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
