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
  steps_ar: string[];
  steps_en: string[];
}

const cardTypes = "card";

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
    code: "stripe",
    name_ar: "Stripe",
    name_en: "Stripe",
    type: cardTypes,
    kind: "gateway",
    icon: "credit-card",
    currencies: ["USD", "EUR", "GBP", "AED"],
    docs: "https://dashboard.stripe.com/apikeys",
    fields: [
      { key: "publishable_key", label_ar: "المفتاح العام", label_en: "Publishable key", placeholder: "pk_live_...", required: true },
      { key: "secret_key", label_ar: "المفتاح السري", label_en: "Secret key", kind: "password", placeholder: "sk_live_...", required: true },
      { key: "webhook_secret", label_ar: "سر الويب هوك", label_en: "Webhook secret", kind: "password", placeholder: "whsec_..." },
    ],
    steps_ar: [
      "سجّل الدخول إلى لوحة Stripe ثم Developers ← API keys.",
      "انسخ Publishable key و Secret key (استخدم مفاتيح Test أثناء التجربة).",
      "من Developers ← Webhooks أنشئ Endpoint إلى /api/public/payments/stripe وانسخ سر التوقيع.",
      "احفظ ثم فعّل «وضع الاختبار» قبل التشغيل الفعلي.",
    ],
    steps_en: [
      "Sign in to Stripe → Developers → API keys.",
      "Copy the publishable and secret keys (use Test keys while trying).",
      "Under Developers → Webhooks add an endpoint to /api/public/payments/stripe and copy the signing secret.",
      "Save, and keep Test mode on before going live.",
    ],
  },
  {
    code: "paypal",
    name_ar: "PayPal",
    name_en: "PayPal",
    type: "wallet",
    kind: "gateway",
    icon: "wallet",
    currencies: ["USD", "EUR", "GBP"],
    docs: "https://developer.paypal.com/dashboard/applications",
    fields: [
      { key: "client_id", label_ar: "Client ID", label_en: "Client ID", required: true },
      { key: "client_secret", label_ar: "Client Secret", label_en: "Client Secret", kind: "password", required: true },
      { key: "webhook_id", label_ar: "Webhook ID", label_en: "Webhook ID" },
    ],
    steps_ar: [
      "ادخل PayPal Developer Dashboard ← My Apps & Credentials.",
      "أنشئ تطبيق REST API واختر Live أو Sandbox.",
      "انسخ Client ID و Secret إلى الحقول هنا.",
      "أضف Webhook للأحداث PAYMENT.CAPTURE.COMPLETED وانسخ الـID.",
    ],
    steps_en: [
      "Go to PayPal Developer Dashboard → My Apps & Credentials.",
      "Create a REST API app (Live or Sandbox).",
      "Copy Client ID and Secret into the fields here.",
      "Add a webhook for PAYMENT.CAPTURE.COMPLETED and copy its ID.",
    ],
  },
  {
    code: "benefit_gateway",
    name_ar: "بوابة بنفت (BENEFIT BPG)",
    name_en: "BENEFIT Payment Gateway",
    type: "benefit",
    kind: "gateway",
    icon: "credit-card",
    currencies: ["BHD"],
    fields: [
      { key: "terminal_id", label_ar: "Terminal ID / Entity ID", label_en: "Terminal ID / Entity ID", required: true },
      { key: "access_token", label_ar: "رمز الوصول (Access Token)", label_en: "Access token", kind: "password", required: true },
      { key: "password", label_ar: "كلمة مرور الطرفية", label_en: "Terminal password", kind: "password" },
      { key: "secret_key", label_ar: "المفتاح السري (توقيع الإشعارات)", label_en: "Secret key (webhook signing)", kind: "password" },
      { key: "merchant_id", label_ar: "رقم التاجر", label_en: "Merchant ID" },
      { key: "api_base", label_ar: "رابط الـAPI", label_en: "API base URL", placeholder: "https://test.benefit-gateway.bh" },
      { key: "widget_base", label_ar: "رابط أداة الدفع", label_en: "Payment widget URL" },
      { key: "flow", label_ar: "نوع التدفق", label_en: "Flow", kind: "select", options: ["copyandpay", "redirect"] },
      { key: "shopper_result_url", label_ar: "رابط نتيجة الدفع", label_en: "Shopper result URL", placeholder: "https://vipstar.cc/pay/result" },
      { key: "currency", label_ar: "العملة", label_en: "Currency", placeholder: "BHD" },
    ],
    steps_ar: [
      "قدّم طلب تاجر عبر بنكك في البحرين للحصول على حساب BENEFIT BPG.",
      "ستصلك رسالة تحتوي Terminal/Entity ID ورمز الوصول والمفتاح السري ورابط الـAPI.",
      "أدخل البيانات هنا وأبقِ وضع الاختبار مفعّلاً حتى نجاح أول عملية.",
      "زوّد البنك برابط الإشعار: https://vipstar.cc/api/public/payments/benefit",
    ],
    steps_en: [
      "Apply for a BENEFIT BPG merchant account through your Bahraini bank.",
      "You will receive Terminal/Entity ID, access token, secret key and API base URL.",
      "Enter them here and keep Test mode on until the first successful charge.",
      "Give the bank the callback URL: https://vipstar.cc/api/public/payments/benefit",
    ],

  },
  {
    code: "tap",
    name_ar: "تاب (Tap Payments)",
    name_en: "Tap Payments",
    type: cardTypes,
    kind: "gateway",
    icon: "credit-card",
    currencies: ["BHD", "SAR", "KWD", "AED"],
    docs: "https://www.tap.company",
    fields: [
      { key: "public_key", label_ar: "المفتاح العام", label_en: "Public key", placeholder: "pk_live_...", required: true },
      { key: "secret_key", label_ar: "المفتاح السري", label_en: "Secret key", kind: "password", placeholder: "sk_live_...", required: true },
      { key: "merchant_id", label_ar: "رقم التاجر", label_en: "Merchant ID" },
    ],
    steps_ar: [
      "سجّل في business.tap.company وأكمل توثيق السجل التجاري.",
      "من Developers انسخ المفتاح العام والسري.",
      "أضف Webhook إلى /api/public/payments/tap.",
    ],
    steps_en: [
      "Register at business.tap.company and complete CR verification.",
      "Copy public and secret keys from Developers.",
      "Add a webhook to /api/public/payments/tap.",
    ],
  },
  {
    code: "myfatoorah",
    name_ar: "ماي فاتورة",
    name_en: "MyFatoorah",
    type: cardTypes,
    kind: "gateway",
    icon: "credit-card",
    currencies: ["BHD", "KWD", "SAR", "AED"],
    fields: [
      { key: "api_key", label_ar: "مفتاح API (Token)", label_en: "API key (token)", kind: "password", required: true },
      { key: "vendor_code", label_ar: "كود المورد", label_en: "Vendor code" },
      { key: "country", label_ar: "الدولة", label_en: "Country", kind: "select", options: ["BHR", "KWT", "SAU", "ARE", "QAT", "OMN"] },
    ],
    steps_ar: [
      "من لوحة MyFatoorah اذهب إلى API Key وأنشئ Token جديد.",
      "اختر الدولة الصحيحة لأن رابط الخدمة يختلف حسب الدولة.",
      "الصق الـToken هنا وفعّل وضع الاختبار أولاً (بيئة demo).",
    ],
    steps_en: [
      "In the MyFatoorah portal open API Key and generate a new token.",
      "Pick the correct country — the endpoint differs per country.",
      "Paste the token here and start in Test (demo) mode.",
    ],
  },
  {
    code: "paytabs",
    name_ar: "باي تابس",
    name_en: "PayTabs",
    type: cardTypes,
    kind: "gateway",
    icon: "credit-card",
    currencies: ["BHD", "SAR", "AED", "EGP"],
    fields: [
      { key: "profile_id", label_ar: "Profile ID", label_en: "Profile ID", required: true },
      { key: "server_key", label_ar: "Server Key", label_en: "Server Key", kind: "password", required: true },
      { key: "region", label_ar: "المنطقة", label_en: "Region", kind: "select", options: ["GLOBAL", "ARE", "SAU", "EGY", "OMN", "JOR"] },
    ],
    steps_ar: [
      "من لوحة PayTabs ← Developers ← Key management.",
      "انسخ Profile ID و Server Key واختر منطقة حسابك.",
      "أضف رابط الإرجاع (Return URL) في إعدادات الملف الشخصي.",
    ],
    steps_en: [
      "In PayTabs go to Developers → Key management.",
      "Copy Profile ID and Server Key and select your region.",
      "Set the Return URL inside the profile settings.",
    ],
  },
  {
    code: "checkout_com",
    name_ar: "Checkout.com",
    name_en: "Checkout.com",
    type: cardTypes,
    kind: "gateway",
    icon: "credit-card",
    currencies: ["USD", "AED", "SAR", "BHD"],
    fields: [
      { key: "public_key", label_ar: "المفتاح العام", label_en: "Public key", placeholder: "pk_...", required: true },
      { key: "secret_key", label_ar: "المفتاح السري", label_en: "Secret key", kind: "password", placeholder: "sk_...", required: true },
      { key: "processing_channel_id", label_ar: "Processing channel ID", label_en: "Processing channel ID" },
    ],
    steps_ar: [
      "من Dashboard ← Developers ← Keys أنشئ مفتاحاً عاماً وسرياً.",
      "انسخ Processing channel ID من Settings ← Channels.",
      "أضف Webhook إلى /api/public/payments/checkout.",
    ],
    steps_en: [
      "Dashboard → Developers → Keys: create public and secret keys.",
      "Copy the processing channel ID from Settings → Channels.",
      "Add a webhook to /api/public/payments/checkout.",
    ],
  },
  {
    code: "hyperpay",
    name_ar: "هايبر باي",
    name_en: "HyperPay",
    type: cardTypes,
    kind: "gateway",
    icon: "credit-card",
    currencies: ["SAR", "BHD", "AED"],
    fields: [
      { key: "entity_id", label_ar: "Entity ID", label_en: "Entity ID", required: true },
      { key: "access_token", label_ar: "Access Token", label_en: "Access Token", kind: "password", required: true },
    ],
    steps_ar: [
      "اطلب حساب تاجر من HyperPay وستصلك بيانات الدخول.",
      "من لوحة التحكم انسخ Entity ID الخاص بكل وسيلة (VISA/MADA).",
      "أنشئ Access Token وأدخله هنا.",
    ],
    steps_en: [
      "Request a HyperPay merchant account and receive your credentials.",
      "Copy the Entity ID for each brand (VISA/MADA) from the dashboard.",
      "Generate an access token and paste it here.",
    ],
  },
  {
    code: "telr",
    name_ar: "تلر (Telr)",
    name_en: "Telr",
    type: cardTypes,
    kind: "gateway",
    icon: "credit-card",
    currencies: ["AED", "SAR", "BHD"],
    fields: [
      { key: "store_id", label_ar: "Store ID", label_en: "Store ID", required: true },
      { key: "auth_key", label_ar: "Auth Key", label_en: "Auth Key", kind: "password", required: true },
    ],
    steps_ar: ["من لوحة Telr ← Stores انسخ Store ID.", "من Integration انسخ Auth Key.", "فعّل Test mode حتى اكتمال المراجعة."],
    steps_en: ["Telr dashboard → Stores: copy the Store ID.", "From Integration copy the Auth Key.", "Keep Test mode on until review completes."],
  },
  {
    code: "apple_pay",
    name_ar: "Apple Pay",
    name_en: "Apple Pay",
    type: "wallet",
    kind: "gateway",
    icon: "smartphone",
    currencies: ["BHD", "USD", "SAR"],
    fields: [
      { key: "merchant_id", label_ar: "Merchant ID", label_en: "Merchant ID", placeholder: "merchant.cc.vipstar", required: true },
      { key: "domain_verified", label_ar: "تم توثيق النطاق (نعم/لا)", label_en: "Domain verified (yes/no)", kind: "select", options: ["yes", "no"] },
      { key: "processor", label_ar: "المعالج المرتبط", label_en: "Linked processor", kind: "select", options: ["stripe", "tap", "checkout", "paytabs", "hyperpay"] },
    ],
    steps_ar: [
      "أنشئ Merchant ID من developer.apple.com ← Identifiers.",
      "حمّل ملف التحقق وضعه في /.well-known/apple-developer-merchantid-domain-association.",
      "اربط Apple Pay بالمعالج الذي تستخدمه (Stripe/Tap...) من لوحته.",
      "لا يعمل Apple Pay إلا على HTTPS ونطاق موثّق.",
    ],
    steps_en: [
      "Create a Merchant ID at developer.apple.com → Identifiers.",
      "Download the verification file and serve it at /.well-known/apple-developer-merchantid-domain-association.",
      "Link Apple Pay to your processor (Stripe/Tap...) from its dashboard.",
      "Apple Pay only works on HTTPS with a verified domain.",
    ],
  },
  {
    code: "google_pay",
    name_ar: "Google Pay",
    name_en: "Google Pay",
    type: "wallet",
    kind: "gateway",
    icon: "smartphone",
    currencies: ["BHD", "USD", "SAR"],
    fields: [
      { key: "merchant_id", label_ar: "Merchant ID", label_en: "Merchant ID", required: true },
      { key: "gateway_merchant_id", label_ar: "Gateway Merchant ID", label_en: "Gateway Merchant ID" },
      { key: "processor", label_ar: "المعالج المرتبط", label_en: "Linked processor", kind: "select", options: ["stripe", "tap", "checkout", "paytabs", "hyperpay"] },
    ],
    steps_ar: [
      "سجّل في Google Pay & Wallet Console واحصل على Merchant ID.",
      "أدخل Gateway Merchant ID من معالج الدفع لديك.",
      "قدّم الموقع للمراجعة قبل التشغيل الفعلي.",
    ],
    steps_en: [
      "Register in the Google Pay & Wallet Console to get a Merchant ID.",
      "Enter the Gateway Merchant ID from your processor.",
      "Submit the site for review before going live.",
    ],
  },
  {
    code: "amazon_pay",
    name_ar: "أمازون باي",
    name_en: "Amazon Pay",
    type: "wallet",
    kind: "gateway",
    icon: "wallet",
    currencies: ["USD", "EUR", "GBP"],
    fields: [
      { key: "merchant_id", label_ar: "Merchant ID", label_en: "Merchant ID", required: true },
      { key: "public_key_id", label_ar: "Public Key ID", label_en: "Public Key ID" },
      { key: "private_key", label_ar: "المفتاح الخاص", label_en: "Private key", kind: "password" },
    ],
    steps_ar: ["من Seller Central ← Amazon Pay ← Integration Central.", "أنشئ زوج مفاتيح وحمّل المفتاح الخاص.", "الصق البيانات هنا واحفظها."],
    steps_en: ["Seller Central → Amazon Pay → Integration Central.", "Create a key pair and download the private key.", "Paste the values here and save."],
  },
  {
    code: "tabby",
    name_ar: "تابي (قسّطها)",
    name_en: "Tabby (BNPL)",
    type: "bnpl",
    kind: "gateway",
    icon: "credit-card",
    currencies: ["BHD", "SAR", "AED", "KWD"],
    fields: [
      { key: "public_key", label_ar: "المفتاح العام", label_en: "Public key", required: true },
      { key: "secret_key", label_ar: "المفتاح السري", label_en: "Secret key", kind: "password", required: true },
      { key: "merchant_code", label_ar: "كود التاجر", label_en: "Merchant code" },
    ],
    steps_ar: [
      "سجّل كتاجر في Tabby ووقّع العقد.",
      "من لوحة التاجر ← Developer انسخ المفاتيح وكود التاجر.",
      "حدّد الحد الأدنى والأعلى للمبلغ في الحقول بالأسفل حسب سياسة تابي.",
    ],
    steps_en: [
      "Register as a Tabby merchant and sign the agreement.",
      "Merchant dashboard → Developer: copy the keys and merchant code.",
      "Set min/max amounts below according to Tabby policy.",
    ],
  },
  {
    code: "tamara",
    name_ar: "تمارا",
    name_en: "Tamara (BNPL)",
    type: "bnpl",
    kind: "gateway",
    icon: "credit-card",
    currencies: ["SAR", "AED", "BHD"],
    fields: [
      { key: "api_token", label_ar: "API Token", label_en: "API Token", kind: "password", required: true },
      { key: "notification_token", label_ar: "Notification Token", label_en: "Notification Token", kind: "password" },
    ],
    steps_ar: ["من لوحة Tamara ← Settings ← API انسخ الـToken.", "انسخ Notification Token لتأكيد الطلبات.", "ابدأ ببيئة Sandbox."],
    steps_en: ["Tamara dashboard → Settings → API: copy the token.", "Copy the notification token for order confirmations.", "Start with the sandbox environment."],
  },
  {
    code: "coinbase_commerce",
    name_ar: "Coinbase Commerce",
    name_en: "Coinbase Commerce",
    type: "crypto",
    kind: "gateway",
    icon: "wallet",
    currencies: ["USD", "USDT", "BTC"],
    fields: [
      { key: "api_key", label_ar: "مفتاح API", label_en: "API key", kind: "password", required: true },
      { key: "webhook_secret", label_ar: "سر الويب هوك", label_en: "Webhook shared secret", kind: "password" },
    ],
    steps_ar: ["من Coinbase Commerce ← Settings ← API keys أنشئ مفتاحاً.", "أضف Webhook إلى /api/public/payments/coinbase وانسخ السر."],
    steps_en: ["Coinbase Commerce → Settings → API keys: create a key.", "Add a webhook to /api/public/payments/coinbase and copy the secret."],
  },
  {
    code: "binance_pay",
    name_ar: "Binance Pay",
    name_en: "Binance Pay",
    type: "crypto",
    kind: "gateway",
    icon: "wallet",
    currencies: ["USDT", "USD"],
    fields: [
      { key: "api_key", label_ar: "API Key", label_en: "API Key", kind: "password", required: true },
      { key: "api_secret", label_ar: "API Secret", label_en: "API Secret", kind: "password", required: true },
      { key: "merchant_id", label_ar: "Merchant ID", label_en: "Merchant ID" },
    ],
    steps_ar: ["فعّل حساب Binance Merchant.", "من Merchant Admin ← API Management أنشئ المفاتيح.", "أضف عنوان الموقع في قائمة النطاقات المسموحة."],
    steps_en: ["Activate a Binance Merchant account.", "Merchant Admin → API Management: create the keys.", "Whitelist your site domain."],
  },
  {
    code: "razorpay",
    name_ar: "Razorpay",
    name_en: "Razorpay",
    type: cardTypes,
    kind: "gateway",
    icon: "credit-card",
    currencies: ["INR", "USD"],
    fields: [
      { key: "key_id", label_ar: "Key ID", label_en: "Key ID", required: true },
      { key: "key_secret", label_ar: "Key Secret", label_en: "Key Secret", kind: "password", required: true },
      { key: "webhook_secret", label_ar: "سر الويب هوك", label_en: "Webhook secret", kind: "password" },
    ],
    steps_ar: ["من Razorpay ← Settings ← API Keys أنشئ مفتاحاً.", "انسخ Key ID و Secret فوراً (لا يظهر السر مرة أخرى).", "أضف Webhook للأحداث payment.captured."],
    steps_en: ["Razorpay → Settings → API Keys: generate a key.", "Copy Key ID and Secret immediately (shown once).", "Add a webhook for payment.captured."],
  },
  {
    code: "custom_gateway",
    name_ar: "بوابة مخصّصة (API يدوي)",
    name_en: "Custom gateway (manual API)",
    type: "other",
    kind: "gateway",
    icon: "credit-card",
    currencies: ["BHD"],
    fields: [
      { key: "base_url", label_ar: "رابط الـAPI", label_en: "API base URL", kind: "url", required: true },
      { key: "api_key", label_ar: "مفتاح API", label_en: "API key", kind: "password" },
      { key: "api_secret", label_ar: "السر", label_en: "API secret", kind: "password" },
      { key: "callback_url", label_ar: "رابط الإشعار", label_en: "Callback URL", kind: "url" },
    ],
    steps_ar: [
      "احصل على وثائق مزوّد الدفع ورابط الـAPI الأساسي.",
      "أدخل المفتاح والسر ورابط الإشعار.",
      "جرّب عملية بمبلغ صغير قبل تفعيل الوسيلة للعملاء.",
    ],
    steps_en: [
      "Get the provider docs and base API URL.",
      "Enter the key, secret and callback URL.",
      "Run a small test charge before enabling it for customers.",
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
    fields: [
      { key: "entity_id", label_ar: "Entity ID (معرّف الكيان)", label_en: "Entity ID", placeholder: "8ac7a4c7...", required: true,
        hint_ar: "يصلك من AFS في رسالة التفعيل — لكل عملة/قناة معرّف مختلف.", hint_en: "Sent by AFS on activation — each currency/channel has its own ID." },
      { key: "access_token", label_ar: "Access Token (رمز الوصول)", label_en: "Access Token", kind: "password", required: true,
        hint_ar: "سرّي تماماً — يُستخدم من الخادم فقط.", hint_en: "Strictly secret — used server-side only." },
      { key: "mode", label_ar: "البيئة", label_en: "Environment", kind: "select", options: ["test", "live"], required: true,
        hint_ar: "test = eu-test.oppwa.com، live = eu-prod.oppwa.com", hint_en: "test = eu-test.oppwa.com, live = eu-prod.oppwa.com" },
      { key: "payment_type", label_ar: "نوع العملية", label_en: "Payment type", kind: "select", options: ["DB", "PA"],
        hint_ar: "DB = خصم مباشر، PA = حجز مبلغ ثم تحصيل لاحقاً.", hint_en: "DB = direct debit, PA = pre-authorize then capture." },
      { key: "brands", label_ar: "البطاقات المسموحة", label_en: "Allowed card brands", placeholder: "VISA MASTER",
        hint_ar: "افصل بمسافة: VISA MASTER AMEX MADA BENEFIT", hint_en: "Space separated: VISA MASTER AMEX MADA BENEFIT" },
      { key: "currency", label_ar: "عملة البوابة", label_en: "Gateway currency", placeholder: "BHD",
        hint_ar: "اتركه فارغاً لاستخدام عملة الطلب.", hint_en: "Leave empty to use the order currency." },
      { key: "widget_lang", label_ar: "لغة نموذج الدفع", label_en: "Widget language", kind: "select", options: ["ar", "en"] },
      { key: "merchant_name", label_ar: "اسم التاجر الظاهر", label_en: "Merchant display name", placeholder: "VIP STAR SATELLITE" },
      { key: "shopper_result_url", label_ar: "رابط نتيجة الدفع", label_en: "Shopper result URL", kind: "url", placeholder: "https://vipstar.cc/pay/result",
        hint_ar: "الصفحة التي يعود إليها العميل بعد 3D Secure.", hint_en: "Where the customer returns after 3D Secure." },
      { key: "live_entity_id", label_ar: "Entity ID للإنتاج", label_en: "Production Entity ID", placeholder: "8acda4cd...",
        hint_ar: "يُستخدم تلقائياً عندما تكون البيئة «live».", hint_en: "Used automatically when the environment is “live”." },
      { key: "live_access_token", label_ar: "Access Token للإنتاج", label_en: "Production Access Token", kind: "password",
        hint_ar: "بيانات الإنتاج من AFS/Payon — سرّية تماماً.", hint_en: "Production credentials from AFS/Payon — strictly secret." },
      { key: "webhook_decryption_key", label_ar: "مفتاح فك تشفير الويب هوك", label_en: "Webhook decryption key", kind: "password",
        hint_ar: "مفتاح hex يرسله البنك بعد تسجيل رابط الإشعارات: https://vipstar.cc/api/public/payments/afs",
        hint_en: "Hex key issued by the bank after registering the webhook: https://vipstar.cc/api/public/payments/afs" },
      { key: "webhook_secret", label_ar: "سر الويب هوك (اختياري)", label_en: "Webhook secret (optional)", kind: "password" },
    ],
    steps_ar: [
      "افتح بريد التفعيل من AFS وانسخ Entity ID و Access Token.",
      "اختر البيئة: «test» للتجربة ببطاقات الاختبار، و«live» بعد اعتماد الحساب ودفع الرسوم.",
      "اختر نوع العملية DB (خصم فوري) إلا إذا اتفقت مع AFS على الحجز PA.",
      "اكتب البطاقات المسموحة كما فُعّلت لك في العقد (VISA MASTER عادة، وBENEFIT للبطاقات البحرينية).",
      "ضع رابط نتيجة الدفع: https://vipstar.cc/pay/result وسجّله لدى AFS.",
      "احفظ ثم جرّب طلباً بمبلغ صغير؛ راجع النتيجة في «سجل عمليات الدفع».",
      "عند الانتقال للإنتاج غيّر البيئة إلى live وبدّل Entity ID و Access Token ببيانات الإنتاج.",
    ],
    steps_en: [
      "Open the AFS activation email and copy the Entity ID and Access Token.",
      "Pick the environment: “test” for test cards, “live” after your account is approved.",
      "Choose payment type DB (immediate debit) unless AFS agreed on PA pre-auth.",
      "List the card brands enabled in your contract (usually VISA MASTER, plus BENEFIT for Bahrain).",
      "Set the shopper result URL to https://vipstar.cc/pay/result and register it with AFS.",
      "Save, then run a small test order and check the payment transactions log.",
      "For production switch the environment to live and replace both credentials with live values.",
    ],
  },
];


export const providerByCode = (code: string) => PAYMENT_PROVIDERS.find((p) => p.code === code);
