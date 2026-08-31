// VIPSTAR — Payment providers catalog (2026)
// Manual configuration: every provider lists its credential fields + a step-by-step setup guide.

export type FieldKind = "text" | "password" | "url" | "select";

export interface ProviderField {
  key: string;
  label_ar: string;
  label_en: string;
  kind?: FieldKind;
  placeholder?: string;
  options?: string[];
  hint_ar?: string;
  hint_en?: string;
  required?: boolean;
}

export interface ProviderEndpoint {
  label_ar: string;
  label_en: string;
  /** absolute path on this site, e.g. /api/public/payments/afs */
  path: string;
  hint_ar?: string;
  hint_en?: string;
}

export interface PaymentProvider {
  code: string;
  name_ar: string;
  name_en: string;
  /** matches payment_methods.type */
  type: string;
  kind: "gateway" | "manual";
  icon: string;
  currencies: string[];
  docs?: string;
  fields: ProviderField[];
  /** Read-only URLs the merchant must register with the provider */
  endpoints?: ProviderEndpoint[];
  steps_ar: string[];
  steps_en: string[];
}



export const PAYMENT_PROVIDERS: PaymentProvider[] = [
  /* ── Manual / offline ─────────────────────────────── */
  {
    code: "bank_transfer",
    name_ar: "تحويل بنكي (IBAN)",
    name_en: "Bank Transfer (IBAN)",
    type: "bank_transfer",
    kind: "manual",
    icon: "landmark",
    currencies: ["BHD", "USD", "SAR"],
    fields: [
      { key: "bank_name", label_ar: "اسم البنك", label_en: "Bank name", placeholder: "National Bank of Bahrain", required: true },
      { key: "account_name", label_ar: "اسم صاحب الحساب", label_en: "Account holder", placeholder: "VIPSTAR", required: true },
      { key: "account_number", label_ar: "رقم الحساب", label_en: "Account number" },
      { key: "iban", label_ar: "الآيبان IBAN", label_en: "IBAN", placeholder: "BH00NBOB00000000000000", required: true },
      { key: "swift", label_ar: "سويفت / BIC", label_en: "SWIFT / BIC", placeholder: "NBOBBHBM" },
      { key: "branch", label_ar: "الفرع", label_en: "Branch" },
    ],
    steps_ar: [
      "افتح تطبيق البنك واستخرج رقم الآيبان الكامل للحساب التجاري.",
      "اكتب اسم صاحب الحساب تماماً كما هو مسجّل في البنك.",
      "أضف رمز السويفت إذا كنت تستقبل تحويلات دولية.",
      "فعّل خيار «يتطلب إثبات دفع» ليرفع العميل صورة الإيصال.",
      "بعد وصول المبلغ، افتح الطلب من صفحة الطلبات وحدّث حالة الدفع إلى «مدفوع».",
    ],
    steps_en: [
      "Open your bank app and copy the full IBAN of the business account.",
      "Enter the account holder name exactly as registered with the bank.",
      "Add the SWIFT code if you receive international transfers.",
      "Enable “Requires payment proof” so the customer uploads the receipt.",
      "Once funds arrive, open the order and mark the payment as paid.",
    ],
  },
  {
    code: "benefit_pay",
    name_ar: "بنفت بي (BenefitPay)",
    name_en: "BenefitPay (Wallet)",
    type: "benefit",
    kind: "manual",
    icon: "smartphone",
    currencies: ["BHD"],
    fields: [
      { key: "phone", label_ar: "رقم الهاتف المرتبط", label_en: "Linked phone", placeholder: "+973 3xxxxxxx", required: true },
      { key: "display_name", label_ar: "الاسم الظاهر في التطبيق", label_en: "Display name" },
      { key: "qr_url", label_ar: "رابط صورة رمز QR", label_en: "QR image URL", kind: "url" },
    ],
    steps_ar: [
      "افتح تطبيق BenefitPay ← Request Money ← احفظ صورة رمز QR الخاص بمحلّك.",
      "ارفع صورة الـQR إلى الوسائط وانسخ الرابط هنا.",
      "أدخل رقم الهاتف المسجّل في التطبيق بصيغة دولية.",
      "اطلب إثبات الدفع (لقطة شاشة) من العميل عند الشراء.",
    ],
    steps_en: [
      "Open BenefitPay → Request Money → save your shop QR image.",
      "Upload the QR image to media and paste its URL here.",
      "Enter the phone number registered in the app in international format.",
      "Ask the customer for a payment screenshot as proof.",
    ],
  },
  {
    code: "stc_pay",
    name_ar: "STC Pay",
    name_en: "STC Pay",
    type: "stc_pay",
    kind: "manual",
    icon: "smartphone",
    currencies: ["BHD", "SAR"],
    fields: [
      { key: "phone", label_ar: "رقم محفظة STC Pay", label_en: "STC Pay number", placeholder: "+9665xxxxxxxx", required: true },
      { key: "account_name", label_ar: "اسم المستفيد", label_en: "Beneficiary name" },
      { key: "qr_url", label_ar: "رابط رمز QR", label_en: "QR image URL", kind: "url" },
    ],
    steps_ar: [
      "من تطبيق STC Pay اختر «استلام الأموال» واحفظ رمز QR.",
      "أدخل رقم المحفظة واسم المستفيد كما يظهر للعميل.",
      "فعّل إثبات الدفع لمطابقة رقم العملية.",
    ],
    steps_en: [
      "In STC Pay choose “Receive money” and save the QR code.",
      "Enter the wallet number and beneficiary name shown to the customer.",
      "Enable payment proof to match the transaction reference.",
    ],
  },
  {
    code: "cash_on_delivery",
    name_ar: "الدفع عند الاستلام",
    name_en: "Cash on Delivery",
    type: "cash",
    kind: "manual",
    icon: "banknote",
    currencies: ["BHD"],
    fields: [
      { key: "coverage", label_ar: "المناطق المشمولة", label_en: "Covered areas", placeholder: "المنامة، المحرق، الرفاع" },
      { key: "extra_fee", label_ar: "رسوم إضافية", label_en: "Extra fee", placeholder: "1.000" },
    ],
    steps_ar: [
      "حدّد المناطق التي يغطيها مندوب التوصيل.",
      "أضف الرسوم الإضافية في حقل «رسوم (BHD)» بالأسفل.",
      "اضبط حد أقصى للمبلغ لتقليل المخاطر.",
    ],
    steps_en: [
      "Define the areas your courier covers.",
      "Add any surcharge in the “Fee (BHD)” field below.",
      "Set a maximum amount to reduce risk.",
    ],
  },
  {
    code: "cash_in_store",
    name_ar: "الدفع في المحل",
    name_en: "Pay in Store",
    type: "cash",
    kind: "manual",
    icon: "banknote",
    currencies: ["BHD"],
    fields: [
      { key: "address", label_ar: "عنوان المحل", label_en: "Store address" },
      { key: "hours", label_ar: "أوقات العمل", label_en: "Opening hours", placeholder: "9:00 - 22:00" },
    ],
    steps_ar: ["اكتب عنوان المحل بوضوح.", "أضف أوقات الدوام ليأتي العميل في الوقت المناسب."],
    steps_en: ["Write the store address clearly.", "Add opening hours so customers arrive on time."],
  },
  {
    code: "crypto_manual",
    name_ar: "عملات رقمية (محفظة يدوية)",
    name_en: "Crypto (manual wallet)",
    type: "crypto",
    kind: "manual",
    icon: "wallet",
    currencies: ["USDT", "BTC"],
    fields: [
      { key: "network", label_ar: "الشبكة", label_en: "Network", kind: "select", options: ["TRC20", "ERC20", "BEP20", "Bitcoin", "Solana"] },
      { key: "asset", label_ar: "العملة", label_en: "Asset", placeholder: "USDT" },
      { key: "wallet_address", label_ar: "عنوان المحفظة", label_en: "Wallet address", required: true },
      { key: "memo", label_ar: "Memo / Tag (إن وجد)", label_en: "Memo / Tag (if any)" },
    ],
    steps_ar: [
      "انسخ عنوان الاستلام من محفظتك مع التأكد من الشبكة الصحيحة.",
      "أدخل اسم العملة والشبكة حتى لا يرسل العميل على شبكة خاطئة.",
      "اطلب رقم العملية (TxID) كإثبات دفع.",
    ],
    steps_en: [
      "Copy the receiving address from your wallet and verify the network.",
      "Enter asset and network so the customer does not send on a wrong chain.",
      "Ask for the transaction hash (TxID) as proof.",
    ],
  },

  /* ── Gateways ─────────────────────────────────────── */
  {
    code: "benefit_gateway",
    name_ar: "بوابة بنفت (BENEFIT BPG)",
    name_en: "BENEFIT Payment Gateway",
    type: "benefit",
    kind: "gateway",
    icon: "credit-card",
    currencies: ["BHD"],
    fields: [
      { key: "tranportal_id", label_ar: "Tranportal ID", label_en: "Tranportal ID", required: true },
      { key: "tranportal_password", label_ar: "Tranportal Password", label_en: "Tranportal password", kind: "password", required: true },
      { key: "resource_key", label_ar: "Terminal Resource Key (32 حرفاً)", label_en: "Terminal Resource Key (32 chars)", kind: "password", required: true },
      { key: "merchant_id", label_ar: "رقم التاجر", label_en: "Merchant ID" },
      { key: "api_endpoint", label_ar: "رابط الـAPI", label_en: "API endpoint", placeholder: "https://test.benefit-gateway.bh/payment/API/hosted.htm" },
      { key: "response_url", label_ar: "رابط الاستجابة/الإشعار", label_en: "Response / notification URL", placeholder: "https://vipstar.cc/api/public/payments/benefit" },
      { key: "error_url", label_ar: "رابط الخطأ", label_en: "Error URL", placeholder: "https://vipstar.cc/api/public/payments/benefit" },
      { key: "currency", label_ar: "العملة", label_en: "Currency", placeholder: "BHD" },
      { key: "currency_code", label_ar: "رمز العملة الرقمي", label_en: "Numeric currency code", placeholder: "048" },
    ],
    steps_ar: [
      "بوابة بنفت تكامل مستقل تماماً عن AFS (تدفق trandata عبر hosted.htm).",
      "من بوابة التاجر ستحصل على Tranportal ID وكلمة المرور وTerminal Resource Key (32 حرفاً).",
      "أدخل البيانات هنا وأبقِ وضع الاختبار مفعّلاً حتى نجاح الحالات الأربع (CAPTURED / NOT CAPTURED / CANCELED / DENIED BY RISK).",
      "زوّد البنك برابط الاستجابة والخطأ: https://vipstar.cc/api/public/payments/benefit",
    ],
    steps_en: [
      "BENEFIT BPG is a fully separate integration from AFS (trandata flow via hosted.htm).",
      "From the merchant portal you get the Tranportal ID, password and the 32-character Terminal Resource Key.",
      "Enter them here and keep Test mode on until all four test cases pass (CAPTURED / NOT CAPTURED / CANCELED / DENIED BY RISK).",
      "Give the bank the response and error URL: https://vipstar.cc/api/public/payments/benefit",
    ],


  },
  {
    code: "afs",
    name_ar: "AFS — الشركة العربية للخدمات المالية (Copy & Pay)",
    name_en: "AFS — Arab Financial Services (Copy & Pay)",
    type: "card",
    kind: "gateway",
    icon: "credit-card",
    currencies: ["BHD", "USD", "SAR", "AED", "EUR"],
    docs: "https://afs.docs.oppwa.com/",
    // AFS runs in LIVE mode only — there is no test/sandbox configuration.
    fields: [
      { key: "live_entity_id", label_ar: "Entity ID (معرّف الكيان) — LIVE", label_en: "Entity ID — LIVE", placeholder: "8acda4cd...", required: true,
        hint_ar: "معرّف الإنتاج من AFS — لكل عملة/قناة معرّف مختلف.", hint_en: "Production entity from AFS — each currency/channel has its own ID." },
      { key: "live_access_token", label_ar: "Access Token (رمز الوصول) — LIVE", label_en: "Access Token — LIVE", kind: "password", required: true,
        hint_ar: "سرّي تماماً — يُستخدم من الخادم فقط.", hint_en: "Strictly secret — used server-side only." },
      { key: "payment_type", label_ar: "نوع العملية", label_en: "Payment type", kind: "select", options: ["DB", "PA"],
        hint_ar: "DB = خصم مباشر، PA = حجز مبلغ ثم تحصيل لاحقاً.", hint_en: "DB = direct debit, PA = pre-authorize then capture." },
      { key: "brands", label_ar: "البطاقات المسموحة", label_en: "Allowed card brands", placeholder: "VISA MASTER AMEX MADA",
        hint_ar: "افصل بمسافة. اكتب فقط البطاقات المفعّلة في عقدك مع AFS. مهم: بطاقات BENEFIT المحلية يجب أن تمر عبر بوابة Benefit فقط — إدراجها هنا يؤدي لرفض تلقائي (Deny by ReD Shield).",
        hint_en: "Space separated. List only brands enabled in your AFS contract. Important: BENEFIT debit cards must use the Benefit gateway only — listing them here causes automatic decline (Deny by ReD Shield)." },
      { key: "widget_lang", label_ar: "لغة نموذج الدفع", label_en: "Widget language", kind: "select", options: ["ar", "en"] },
      { key: "webhook_decryption_key", label_ar: "مفتاح فك تشفير الويب هوك", label_en: "Webhook decryption key", kind: "password",
        hint_ar: "مفتاح hex يرسله البنك بعد تسجيل رابط الإشعارات أدناه.",
        hint_en: "Hex key issued by the bank after registering the webhook URL below." },
    ],
    endpoints: [
      { label_ar: "رابط الإشعارات (Webhook)", label_en: "Webhook / notification URL", path: "/api/public/payments/afs",
        hint_ar: "سجّله لدى AFS ثم اطلب مفتاح فك التشفير (hex).", hint_en: "Register with AFS, then request the hex decryption key." },
      { label_ar: "رابط نتيجة الدفع (3D Secure)", label_en: "Shopper result URL (3D Secure)", path: "/pay/result",
        hint_ar: "يُرسل تلقائياً مع كل عملية — سجّله لدى AFS كنطاق عودة مسموح.", hint_en: "Sent automatically per transaction — register it with AFS as an allowed return URL." },
      { label_ar: "رابط المطابقة التلقائية (Cron)", label_en: "Reconciliation endpoint (cron)", path: "/api/public/afs-reconcile",
        hint_ar: "يعمل دورياً لتحديث العمليات المعلّقة.", hint_en: "Runs periodically to settle pending attempts." },
    ],
    steps_ar: [
      "افتح بريد التفعيل من AFS وانسخ Entity ID و Access Token الخاصين بالإنتاج (LIVE).",
      "اختر نوع العملية DB (خصم فوري) إلا إذا اتفقت مع AFS على الحجز PA.",
      "اكتب البطاقات المسموحة كما فُعّلت لك في العقد (VISA MASTER عادة) — بطاقات BENEFIT تعمل عبر بوابة Benefit فقط وليس عبر AFS.",
      "انسخ «رابط الإشعارات» من قسم الروابط أدناه وسجّله لدى AFS.",
      "بعد التسجيل اطلب من AFS مفتاح فك التشفير (hex) وضعه في حقل مفتاح فك تشفير الويب هوك.",
      "سجّل «رابط نتيجة الدفع» لدى AFS كنطاق عودة مسموح.",
      "احفظ ثم جرّب طلباً بمبلغ صغير وراجع «سجل عمليات الدفع».",
    ],
    steps_en: [
      "Open the AFS activation email and copy the LIVE Entity ID and Access Token.",
      "Choose payment type DB (immediate debit) unless AFS agreed on PA pre-auth.",
      "List the card brands enabled in your contract (usually VISA MASTER) — BENEFIT cards go through the Benefit gateway only, not AFS.",
      "Copy the webhook URL from the endpoints box below and register it with AFS.",
      "Once registered, ask AFS for the hex decryption key and paste it into the webhook decryption key field.",
      "Register the shopper result URL with AFS as an allowed return URL.",
      "Save, then run a small live order and review the payment transactions log.",
    ],

  },
];


export const providerByCode = (code: string) => PAYMENT_PROVIDERS.find((p) => p.code === code);
