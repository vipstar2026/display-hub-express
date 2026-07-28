export type PermKey = string;

export type PermissionDef = {
  key: PermKey;
  ar: string;
  en: string;
  ur: string;
};

export type PermissionGroup = {
  key: string;
  ar: string;
  en: string;
  ur: string;
  items: PermissionDef[];
};

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    key: "catalog",
    ar: "المنتجات والكتالوج",
    en: "Products & Catalog",
    ur: "مصنوعات و کیٹلاگ",
    items: [
      { key: "products.view", ar: "عرض المنتجات", en: "View products", ur: "مصنوعات دیکھیں" },
      { key: "products.manage", ar: "إضافة وتعديل المنتجات", en: "Add & edit products", ur: "مصنوعات شامل/ترمیم" },
      { key: "products.delete", ar: "حذف المنتجات", en: "Delete products", ur: "مصنوعات حذف کریں" },
      { key: "categories.manage", ar: "إدارة الأقسام", en: "Manage categories", ur: "زمرہ جات کا انتظام" },
      { key: "codes.manage", ar: "إدارة الأكواد الرقمية", en: "Manage digital codes", ur: "ڈیجیٹل کوڈز" },
      { key: "banners.manage", ar: "إدارة البانرات والعروض", en: "Manage banners & flash sales", ur: "بینرز و سیلز" },
    ],
  },
  {
    key: "sales",
    ar: "المبيعات والطلبات",
    en: "Sales & Orders",
    ur: "فروخت و آرڈرز",
    items: [
      { key: "orders.view", ar: "عرض الطلبات", en: "View orders", ur: "آرڈرز دیکھیں" },
      { key: "orders.manage", ar: "تحديث حالة الطلبات", en: "Update order status", ur: "آرڈر اسٹیٹس" },
      { key: "orders.refund", ar: "الاسترجاع والإلغاء", en: "Refund & cancel", ur: "رقم واپسی/منسوخی" },
      { key: "pos.use", ar: "استخدام نقطة البيع", en: "Use POS", ur: "پی او ایس استعمال" },
      { key: "invoices.manage", ar: "الفواتير", en: "Invoices", ur: "انوائسز" },
      { key: "coupons.manage", ar: "الكوبونات والخصومات", en: "Coupons & discounts", ur: "کوپن و رعایت" },
      { key: "shipping.manage", ar: "الشحن والمناطق", en: "Shipping & zones", ur: "شپنگ و زونز" },
    ],
  },
  {
    key: "finance",
    ar: "المالية والمحاسبة",
    en: "Finance & Accounting",
    ur: "مالیات و اکاؤنٹنگ",
    items: [
      { key: "payments.view", ar: "عرض المدفوعات", en: "View payments", ur: "ادائیگیاں دیکھیں" },
      { key: "payments.manage", ar: "إدارة طرق الدفع", en: "Manage payment methods", ur: "ادائیگی کے طریقے" },
      { key: "payments.verify", ar: "تأكيد الدفع اليدوي", en: "Verify manual payments", ur: "دستی ادائیگی تصدیق" },
      { key: "accounting.view", ar: "عرض القيود المحاسبية", en: "View accounting", ur: "اکاؤنٹنگ دیکھیں" },
      { key: "accounting.manage", ar: "إدارة القيود والحسابات", en: "Manage journal & accounts", ur: "جرنل و اکاؤنٹس" },
      { key: "suppliers.manage", ar: "الموردون وأوامر الشراء", en: "Suppliers & purchase orders", ur: "سپلائرز و خریداری" },
      { key: "inventory.manage", ar: "إدارة المخزون", en: "Manage inventory", ur: "انوینٹری" },
    ],
  },
  {
    key: "content",
    ar: "المحتوى والتسويق",
    en: "Content & Marketing",
    ur: "مواد و مارکیٹنگ",
    items: [
      { key: "blog.manage", ar: "المدونة والأخبار", en: "Blog & news", ur: "بلاگ و خبریں" },
      { key: "reviews.moderate", ar: "مراجعة التقييمات", en: "Moderate reviews", ur: "ریویو کنٹرول" },
      { key: "newsletter.manage", ar: "النشرة البريدية والحملات", en: "Newsletter & campaigns", ur: "نیوز لیٹر و مہمات" },
      { key: "messages.manage", ar: "رسائل الزوار والرد عليها", en: "Visitor messages & replies", ur: "پیغامات و جواب" },
    ],
  },
  {
    key: "system",
    ar: "النظام والإدارة",
    en: "System & Administration",
    ur: "سسٹم و انتظام",
    items: [
      { key: "analytics.view", ar: "التقارير والتحليلات", en: "Reports & analytics", ur: "رپورٹس و تجزیات" },
      { key: "settings.manage", ar: "إعدادات الموقع", en: "Site settings", ur: "سائٹ ترتیبات" },
      { key: "users.view", ar: "عرض المستخدمين", en: "View users", ur: "صارفین دیکھیں" },
      { key: "users.manage", ar: "إدارة المستخدمين والصلاحيات", en: "Manage users & permissions", ur: "صارفین و اختیارات" },
      { key: "backup.manage", ar: "النسخ الاحتياطي", en: "Backups", ur: "بیک اپ" },
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
  permissions: PermKey[];
}[] = [
  {
    key: "full",
    ar: "مدير عام (كل الصلاحيات)",
    en: "Full manager (all permissions)",
    ur: "مکمل منتظم",
    permissions: ALL_PERMISSIONS,
  },
  {
    key: "sales",
    ar: "موظف مبيعات",
    en: "Sales staff",
    ur: "سیلز اسٹاف",
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
    permissions: ["orders.view", "orders.manage", "messages.manage", "reviews.moderate", "products.view"],
  },
  { key: "none", ar: "بدون صلاحيات", en: "No permissions", ur: "کوئی اختیار نہیں", permissions: [] },
];

export function permLabel(def: { ar: string; en: string; ur: string }, lang: string) {
  return lang === "en" ? def.en : lang === "ur" ? def.ur : def.ar;
}
