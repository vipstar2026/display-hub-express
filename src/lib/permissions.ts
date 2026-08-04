export type PermKey = string;

export type PermissionDef = {
  key: PermKey;
  ar: string;
  en: string;
  ur: string;
  bn: string;
};

export type PermissionGroup = {
  key: string;
  ar: string;
  en: string;
  ur: string;
  bn: string;
  items: PermissionDef[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "catalog",
    ar: "المنتجات والكتالوج",
    en: "Products & Catalog",
    ur: "مصنوعات و کیٹلاگ",
    bn: "পণ্য ও ক্যাটালগ",
    items: [
      { key: "products.view", ar: "عرض المنتجات", en: "View products", ur: "مصنوعات دیکھیں", bn: "পণ্য দেখা" },
      { key: "products.manage", ar: "إضافة وتعديل المنتجات", en: "Add & edit products", ur: "مصنوعات شامل/ترمیم", bn: "পণ্য যোগ ও সম্পাদনা" },
      { key: "products.delete", ar: "حذف المنتجات", en: "Delete products", ur: "مصنوعات حذف کریں", bn: "পণ্য মুছে ফেলা" },
      { key: "categories.manage", ar: "إدارة الأقسام", en: "Manage categories", ur: "زمرہ جات کا انتظام", bn: "ক্যাটাগরি ব্যবস্থাপনা" },
      { key: "codes.manage", ar: "إدارة الأكواد الرقمية", en: "Manage digital codes", ur: "ڈیجیٹل کوڈز", bn: "ডিজিটাল কোড ব্যবস্থাপনা" },
      { key: "banners.manage", ar: "إدارة البانرات والعروض", en: "Manage banners & flash sales", ur: "بینرز و سیلز", bn: "ব্যানার ও ফ্ল্যাশ সেল" },
    ],
  },
  {
    key: "sales",
    ar: "المبيعات والطلبات",
    en: "Sales & Orders",
    ur: "فروخت و آرڈرز",
    bn: "বিক্রয় ও অর্ডার",
    items: [
      { key: "orders.view", ar: "عرض الطلبات", en: "View orders", ur: "آرڈرز دیکھیں", bn: "অর্ডার দেখা" },
      { key: "orders.manage", ar: "تحديث حالة الطلبات", en: "Update order status", ur: "آرڈر اسٹیٹس", bn: "অর্ডার স্ট্যাটাস আপডেট" },
      { key: "orders.refund", ar: "الاسترجاع والإلغاء", en: "Refund & cancel", ur: "رقم واپسی/منسوخی", bn: "রিফান্ড ও বাতিল" },
      { key: "pos.use", ar: "استخدام نقطة البيع", en: "Use POS", ur: "پی او ایس استعمال", bn: "পিওএস ব্যবহার" },
      { key: "invoices.manage", ar: "الفواتير", en: "Invoices", ur: "انوائسز", bn: "ইনভয়েস" },
      { key: "coupons.manage", ar: "الكوبونات والخصومات", en: "Coupons & discounts", ur: "کوپن و رعایت", bn: "কুপন ও ছাড়" },
      { key: "shipping.manage", ar: "الشحن والمناطق", en: "Shipping & zones", ur: "شپنگ و زونز", bn: "শিপিং ও জোন" },
    ],
  },
  {
    key: "finance",
    ar: "المالية والمحاسبة",
    en: "Finance & Accounting",
    ur: "مالیات و اکاؤنٹنگ",
    bn: "অর্থ ও হিসাবরক্ষণ",
    items: [
      { key: "payments.view", ar: "عرض المدفوعات", en: "View payments", ur: "ادائیگیاں دیکھیں", bn: "পেমেন্ট দেখা" },
      { key: "payments.manage", ar: "إدارة طرق الدفع", en: "Manage payment methods", ur: "ادائیگی کے طریقے", bn: "পেমেন্ট পদ্ধতি ব্যবস্থাপনা" },
      { key: "payments.verify", ar: "تأكيد الدفع اليدوي", en: "Verify manual payments", ur: "دستی ادائیگی تصدیق", bn: "ম্যানুয়াল পেমেন্ট যাচাই" },
      { key: "accounting.view", ar: "عرض القيود المحاسبية", en: "View accounting", ur: "اکاؤنٹنگ دیکھیں", bn: "হিসাব দেখা" },
      { key: "accounting.manage", ar: "إدارة القيود والحسابات", en: "Manage journal & accounts", ur: "جرنل و اکاؤنٹس", bn: "জার্নাল ও অ্যাকাউন্ট ব্যবস্থাপনা" },
      { key: "suppliers.manage", ar: "الموردون وأوامر الشراء", en: "Suppliers & purchase orders", ur: "سپلائرز و خریداری", bn: "সরবরাহকারী ও ক্রয় আদেশ" },
      { key: "inventory.manage", ar: "إدارة المخزون", en: "Manage inventory", ur: "انوینٹری", bn: "ইনভেন্টরি ব্যবস্থাপনা" },
    ],
  },
  {
    key: "content",
    ar: "المحتوى والتسويق",
    en: "Content & Marketing",
    ur: "مواد و مارکیٹنگ",
    bn: "কনটেন্ট ও মার্কেটিং",
    items: [
      { key: "blog.manage", ar: "المدونة والأخبار", en: "Blog & news", ur: "بلاگ و خبریں", bn: "ব্লগ ও সংবাদ" },
      { key: "reviews.moderate", ar: "مراجعة التقييمات", en: "Moderate reviews", ur: "ریویو کنٹرول", bn: "রিভিউ মডারেশন" },
      { key: "newsletter.manage", ar: "النشرة البريدية والحملات", en: "Newsletter & campaigns", ur: "نیوز لیٹر و مہمات", bn: "নিউজলেটার ও ক্যাম্পেইন" },
      { key: "messages.manage", ar: "رسائل الزوار والرد عليها", en: "Visitor messages & replies", ur: "پیغامات و جواب", bn: "দর্শনার্থীর বার্তা ও উত্তর" },
    ],
  },
  {
    key: "system",
    ar: "النظام والإدارة",
    en: "System & Administration",
    ur: "سسٹم و انتظام",
    bn: "সিস্টেম ও প্রশাসন",
    items: [
      { key: "analytics.view", ar: "التقارير والتحليلات", en: "Reports & analytics", ur: "رپورٹس و تجزیات", bn: "রিপোর্ট ও বিশ্লেষণ" },
      { key: "settings.manage", ar: "إعدادات الموقع", en: "Site settings", ur: "سائٹ ترتیبات", bn: "সাইট সেটিংস" },
      { key: "users.view", ar: "عرض المستخدمين", en: "View users", ur: "صارفین دیکھیں", bn: "ব্যবহারকারী দেখা" },
      { key: "users.manage", ar: "إدارة المستخدمين والصلاحيات", en: "Manage users & permissions", ur: "صارفین و اختیارات", bn: "ব্যবহারকারী ও অনুমতি ব্যবস্থাপনা" },
      { key: "backup.manage", ar: "النسخ الاحتياطي", en: "Backups", ur: "بیک اپ", bn: "ব্যাকআপ" },
    ],
  },
];

export const ALL_PERMISSIONS: PermKey[] = PERMISSION_GROUPS.flatMap((g) => g.items.map((i) => i.key));

/** Ready-made task bundles for common staff roles. */
export const PERMISSION_PRESETS: {
  key: string;
  ar: string;
  en: string;
  ur: string;
  bn: string;
  permissions: PermKey[];
}[] = [
  {
    key: "full",
    ar: "مدير عام (كل الصلاحيات)",
    en: "Full manager (all permissions)",
    ur: "مکمل منتظم",
    bn: "পূর্ণ ব্যবস্থাপক (সব অনুমতি)",
    permissions: ALL_PERMISSIONS,
  },
  {
    key: "sales",
    ar: "موظف مبيعات",
    en: "Sales staff",
    ur: "سیلز اسٹاف",
    bn: "বিক্রয় কর্মী",
    permissions: [
      "products.view", "orders.view", "orders.manage", "pos.use",
      "invoices.manage", "payments.view", "payments.verify", "messages.manage",
    ],
  },
  {
    key: "inventory",
    ar: "أمين المخزون",
    en: "Inventory keeper",
    ur: "انوینٹری انچارج",
    bn: "ইনভেন্টরি দায়িত্বপ্রাপ্ত",
    permissions: [
      "products.view", "products.manage", "categories.manage", "codes.manage",
      "inventory.manage", "suppliers.manage",
    ],
  },
  {
    key: "accountant",
    ar: "محاسب",
    en: "Accountant",
    ur: "اکاؤنٹنٹ",
    bn: "হিসাবরক্ষক",
    permissions: [
      "orders.view", "invoices.manage", "payments.view", "payments.verify",
      "accounting.view", "accounting.manage", "suppliers.manage", "analytics.view",
    ],
  },
  {
    key: "marketing",
    ar: "تسويق ومحتوى",
    en: "Marketing & content",
    ur: "مارکیٹنگ و مواد",
    bn: "মার্কেটিং ও কনটেন্ট",
    permissions: [
      "products.view", "banners.manage", "coupons.manage", "blog.manage",
      "reviews.moderate", "newsletter.manage", "messages.manage", "analytics.view",
    ],
  },
  {
    key: "support",
    ar: "دعم العملاء",
    en: "Customer support",
    ur: "کسٹمر سپورٹ",
    bn: "গ্রাহক সহায়তা",
    permissions: ["orders.view", "orders.manage", "messages.manage", "reviews.moderate", "products.view"],
  },
  { key: "none", ar: "بدون صلاحيات", en: "No permissions", ur: "کوئی اختیار نہیں", bn: "কোনো অনুমতি নেই", permissions: [] },
];

export function permLabel(def: { ar: string; en: string; ur: string; bn?: string }, lang: string) {
  if (lang === "en") return def.en;
  if (lang === "ur") return def.ur;
  if (lang === "bn") return def.bn || def.en;
  return def.ar;
}
