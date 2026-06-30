
# خطة نظام المبيعات والمحاسبة المتكامل

نظرًا لحجم العمل الكبير، سأنفذها على **3 مراحل متتابعة** خلال هذه الرسالة وما بعدها. كل مرحلة قابلة للاستخدام بمفردها.

---

## المرحلة 1 — قاعدة البيانات + Tap Payments + الفواتير (هذه الرسالة)

### 1) Migration جديد يضيف الجداول التالية
- `suppliers` — الموردون (اسم، هاتف، رصيد).
- `purchase_orders` + `purchase_order_items` — مشتريات من الموردين (تكلفة البضاعة).
- `inventory_movements` — حركة المخزون (شراء، بيع، تعديل، مرتجع) مع `cost_per_unit`.
- `accounting_entries` — قيود يومية (مدين/دائن، حساب، مرجع طلب/شراء).
- `accounts` — دليل الحسابات (مبيعات، تكلفة بضاعة، ضريبة 10%، نقدية، بنك، موردون، عملاء).
- `invoices` — فواتير رسمية (رقم متسلسل، VAT 10%، إجمالي قبل/بعد الضريبة، PDF URL).
- `pos_sessions` — جلسات الكاشير (افتتاح/إغلاق، نقدية أول/آخر).
- `pos_transactions` — معاملات نقدية/بطاقة في POS.
- `notifications` — تنبيهات داخلية (طلب جديد، مخزون منخفض).
- `activity_log` — سجل العمليات الإدارية (من فعل ماذا ومتى).
- `payment_transactions` — معاملات Tap (charge_id، status، 3DS redirect).

كل جدول مع GRANT + RLS صحيحة + has_role admin.

### 2) دفع Tap Payments (البحرين)
- ربط Tap عبر مفتاحين (secret_key + publishable_key) عن طريق `add_secret`.
- Server function `create_tap_charge` → ينشئ Charge ويرجع `redirect_url` للعميل لتأكيد 3D Secure / Benefit / KNET.
- Server route عام `/api/public/tap/webhook` للتحقق من التوقيع وتحديث الطلب → تفعيل أكواد IPTV تلقائيًا + إنشاء فاتورة + قيود محاسبية.
- صفحة `/orders/success` و `/orders/failed` للعودة من Tap.

### 3) الفواتير PDF
- Server function `generate_invoice_pdf` ترجع PDF (jsPDF أو pdf-lib) ثلاثي اللغة بشعار VIPSTAR، VAT breakdown، QR للتحقق.
- زر "تحميل/طباعة فاتورة" داخل صفحة الطلب وفي لوحة الإدارة.

---

## المرحلة 2 — POS + الطباعة الحرارية (رسالة منفصلة)

- صفحة `/admin/pos` كاشير: بحث/مسح باركود، إضافة منتجات، خصم، اختيار طريقة دفع (نقد/بطاقة/Tap)، طباعة إيصال 80mm.
- افتتاح/إغلاق وردية + تسوية الصندوق.
- إيصال HTML قابل للطباعة على طابعة حرارية مباشرة (CSS `@media print` بمقاس 80mm).

## المرحلة 3 — المحاسبة + التقارير + التنبيهات (رسالة منفصلة)

- صفحات لوحة التحكم:
  - `/admin/accounting` — يومية، دفتر الأستاذ، ميزان مراجعة، الأرباح/الخسائر.
  - `/admin/suppliers` + `/admin/purchases` — موردون وأوامر شراء.
  - `/admin/inventory` — حركة المخزون، تنبيهات نفاد، جرد.
  - `/admin/reports` — مبيعات يومية/شهرية، أفضل المنتجات، ربحية كل منتج، تصدير CSV/Excel.
  - `/admin/notifications` — مركز التنبيهات.
- جرس تنبيهات realtime في الهيدر (طلب جديد، مخزون منخفض).
- Activity log مرئي في كل عملية حساسة.

---

## التفاصيل التقنية

- **العملة:** BHD (3 خانات) في كل مكان (موجود بالفعل في `src/lib/format.ts`).
- **الضريبة:** VAT البحرين 10% — تُحسب تلقائيًا في الفاتورة (سعر شامل ↔ مستخرج منه).
- **التوافق:** كل الصفحات Responsive (mobile-first) باستخدام Tailwind + sidebar الموجود.
- **الأمان:** كل العمليات الإدارية محمية بـ `has_role(admin)` + RLS + middleware `requireSupabaseAuth`.
- **Webhook Tap:** يتم التحقق من HMAC signature قبل أي كتابة.
- **PDF:** نولده server-side بـ `pdf-lib` (متوافق مع Worker runtime، بلا native deps).

---

## ما أحتاجه منك للبدء

1. تأكيد المتابعة بالمرحلة 1 الآن.
2. مفاتيح Tap البحرين — سأطلبها بزر آمن (`add_secret`) بعد موافقتك:
   - `TAP_SECRET_KEY` (يبدأ بـ `sk_test_` أو `sk_live_`)
   - `TAP_PUBLIC_KEY` (يبدأ بـ `pk_test_` أو `pk_live_`)
   - `TAP_WEBHOOK_SECRET` (من لوحة Tap → Webhooks)

تحصل عليها من: https://dashboard.tap.company → Developers → API Credentials

**هل أبدأ بالمرحلة 1؟**
