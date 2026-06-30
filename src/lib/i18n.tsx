import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "ar" | "en" | "ur";

type Dict = Record<string, string>;

const dictionaries: Record<Lang, Dict> = {
  ar: {
    "site.tagline": "متجرك المتخصص للستلايت و IPTV",
    "nav.home": "الرئيسية",
    "nav.shop": "المتجر",
    "nav.cart": "السلة",
    "nav.account": "حسابي",
    "nav.admin": "لوحة التحكم",
    "nav.signin": "دخول",
    "nav.signout": "خروج",
    "shop.all": "كل المنتجات",
    "shop.featured": "منتجات مميزة",
    "shop.search": "ابحث عن منتج...",
    "shop.empty": "لا توجد منتجات",
    "shop.outOfStock": "نفذ المخزون",
    "shop.addToCart": "أضف للسلة",
    "shop.buyNow": "اشتر الآن",
    "shop.price": "السعر",
    "shop.quantity": "الكمية",
    "shop.subtotal": "الإجمالي الفرعي",
    "shop.shipping": "الشحن",
    "shop.total": "الإجمالي",
    "shop.checkout": "إتمام الشراء",
    "shop.continueShopping": "متابعة التسوق",
    "shop.emptyCart": "سلتك فارغة",
    "auth.signin": "تسجيل الدخول",
    "auth.signup": "إنشاء حساب",
    "auth.email": "البريد الإلكتروني",
    "auth.password": "كلمة المرور",
    "auth.name": "الاسم",
    "auth.continueGoogle": "متابعة مع جوجل",
    "auth.haveAccount": "لديك حساب؟",
    "auth.noAccount": "ليس لديك حساب؟",
    "admin.dashboard": "لوحة المعلومات",
    "admin.products": "المنتجات",
    "admin.categories": "الفئات",
    "admin.orders": "الطلبات",
    "admin.codes": "أكواد IPTV",
    "admin.users": "المستخدمون",
    "admin.settings": "الإعدادات",
    "admin.overview": "نظرة عامة",
    "admin.catalog": "الكاتالوج",
    "admin.sales": "المبيعات",
    "admin.customers": "العملاء",
    "admin.system": "النظام",
    "admin.search": "ابحث في لوحة التحكم...",
    "admin.revenue": "الإيرادات",
    "admin.totalRevenue": "إجمالي الإيرادات",
    "admin.todayOrders": "طلبات اليوم",
    "admin.pendingOrders": "طلبات قيد المعالجة",
    "admin.customersCount": "عدد العملاء",
    "admin.last14Days": "آخر 14 يوم",
    "admin.recentOrders": "أحدث الطلبات",
    "admin.topProducts": "الأكثر مبيعاً",
    "admin.lowStock": "مخزون منخفض",
    "admin.viewAll": "عرض الكل",
    "admin.alerts": "تنبيهات",
    "admin.noData": "لا توجد بيانات",
    "admin.status": "الحالة",
    "admin.welcome": "مرحباً بك في مركز التحكم",
    "admin.welcomeSub": "نظرة شاملة على أداء متجرك",
    "admin.ordersByStatus": "الطلبات حسب الحالة",
    "admin.quickActions": "إجراءات سريعة",
    "admin.addProduct": "إضافة منتج",
    "admin.addCategory": "إضافة فئة",
    "admin.viewStore": "عرض المتجر",

    "home.hero.title": "أفضل أجهزة الستلايت و IPTV",
    "home.hero.sub": "رسيفرات • أطباق • LNB • اشتراكات IPTV • إكسسوارات",
    "home.hero.cta": "تصفح المتجر",
    "home.cats": "تسوق حسب الفئة",
    "home.featured": "منتجات مميزة",
    "home.why": "لماذا VIPSTAR؟",
    "home.why.1.t": "منتجات أصلية",
    "home.why.1.d": "ضمان أصلي على كل الأجهزة",
    "home.why.2.t": "توصيل سريع",
    "home.why.2.d": "شحن دولي خلال أيام",
    "home.why.3.t": "دعم 24/7",
    "home.why.3.d": "فريق فني خبير لمساعدتك",
  },
  en: {
    "site.tagline": "Your specialist Satellite & IPTV store",
    "nav.home": "Home",
    "nav.shop": "Shop",
    "nav.cart": "Cart",
    "nav.account": "Account",
    "nav.admin": "Admin",
    "nav.signin": "Sign in",
    "nav.signout": "Sign out",
    "shop.all": "All products",
    "shop.featured": "Featured",
    "shop.search": "Search products...",
    "shop.empty": "No products",
    "shop.outOfStock": "Out of stock",
    "shop.addToCart": "Add to cart",
    "shop.buyNow": "Buy now",
    "shop.price": "Price",
    "shop.quantity": "Qty",
    "shop.subtotal": "Subtotal",
    "shop.shipping": "Shipping",
    "shop.total": "Total",
    "shop.checkout": "Checkout",
    "shop.continueShopping": "Continue shopping",
    "shop.emptyCart": "Your cart is empty",
    "auth.signin": "Sign in",
    "auth.signup": "Create account",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.name": "Name",
    "auth.continueGoogle": "Continue with Google",
    "auth.haveAccount": "Have an account?",
    "auth.noAccount": "Don't have an account?",
    "admin.dashboard": "Dashboard",
    "admin.products": "Products",
    "admin.categories": "Categories",
    "admin.orders": "Orders",
    "admin.codes": "IPTV Codes",
    "admin.users": "Users",
    "admin.settings": "Settings",
    "home.hero.title": "Premium Satellite & IPTV gear",
    "home.hero.sub": "Receivers • Dishes • LNB • IPTV Subscriptions • Accessories",
    "home.hero.cta": "Shop now",
    "home.cats": "Shop by category",
    "home.featured": "Featured products",
    "home.why": "Why VIPSTAR?",
    "home.why.1.t": "Genuine products",
    "home.why.1.d": "Authentic warranty on every device",
    "home.why.2.t": "Fast delivery",
    "home.why.2.d": "International shipping within days",
    "home.why.3.t": "24/7 support",
    "home.why.3.d": "Expert tech team ready to help",
  },
  ur: {
    "site.tagline": "سیٹلائٹ اور IPTV کا ماہر اسٹور",
    "nav.home": "ہوم",
    "nav.shop": "اسٹور",
    "nav.cart": "کارٹ",
    "nav.account": "اکاؤنٹ",
    "nav.admin": "ایڈمن",
    "nav.signin": "سائن ان",
    "nav.signout": "سائن آؤٹ",
    "shop.all": "تمام مصنوعات",
    "shop.featured": "نمایاں",
    "shop.search": "تلاش...",
    "shop.empty": "کوئی مصنوعات نہیں",
    "shop.outOfStock": "اسٹاک ختم",
    "shop.addToCart": "کارٹ میں شامل کریں",
    "shop.buyNow": "ابھی خریدیں",
    "shop.price": "قیمت",
    "shop.quantity": "تعداد",
    "shop.subtotal": "ذیلی کل",
    "shop.shipping": "شپنگ",
    "shop.total": "کل",
    "shop.checkout": "چیک آؤٹ",
    "shop.continueShopping": "خریداری جاری رکھیں",
    "shop.emptyCart": "آپ کا کارٹ خالی ہے",
    "auth.signin": "سائن ان",
    "auth.signup": "اکاؤنٹ بنائیں",
    "auth.email": "ای میل",
    "auth.password": "پاس ورڈ",
    "auth.name": "نام",
    "auth.continueGoogle": "گوگل کے ساتھ جاری رکھیں",
    "auth.haveAccount": "اکاؤنٹ ہے؟",
    "auth.noAccount": "اکاؤنٹ نہیں ہے؟",
    "admin.dashboard": "ڈیش بورڈ",
    "admin.products": "مصنوعات",
    "admin.categories": "زمرہ جات",
    "admin.orders": "آرڈرز",
    "admin.codes": "IPTV کوڈز",
    "admin.users": "صارفین",
    "admin.settings": "ترتیبات",
    "home.hero.title": "بہترین سیٹلائٹ اور IPTV آلات",
    "home.hero.sub": "ریسیورز • ڈشز • LNB • IPTV سبسکرپشنز • لوازمات",
    "home.hero.cta": "ابھی خریدیں",
    "home.cats": "زمرہ کے مطابق خریداری",
    "home.featured": "نمایاں مصنوعات",
    "home.why": "VIPSTAR کیوں؟",
    "home.why.1.t": "اصلی مصنوعات",
    "home.why.1.d": "ہر ڈیوائس پر اصل وارنٹی",
    "home.why.2.t": "تیز ترسیل",
    "home.why.2.d": "دنوں میں بین الاقوامی شپنگ",
    "home.why.3.t": "24/7 سپورٹ",
    "home.why.3.d": "ماہر ٹیکنیکل ٹیم آپ کی مدد کے لیے",
  },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ar");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = (localStorage.getItem("vipstar-lang") as Lang) || "ar";
    setLangState(saved);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const dir = lang === "en" ? "ltr" : "rtl";
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("vipstar-lang", l);
  };

  const t = (key: string) => dictionaries[lang][key] ?? dictionaries.en[key] ?? key;
  const dir: "rtl" | "ltr" = lang === "en" ? "ltr" : "rtl";

  return <Ctx.Provider value={{ lang, setLang, t, dir }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be inside I18nProvider");
  return c;
}

export function localizedName(row: Record<string, unknown>, base: string, lang: Lang): string {
  const v = row[`${base}_${lang}`] ?? row[`${base}_en`];
  return typeof v === "string" ? v : "";
}
