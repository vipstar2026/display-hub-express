import { useI18n, type Lang } from "./i18n";

type AdminDict = {
  // common
  loading: string;
  save: string;
  saveChanges: string;
  saveAll: string;
  delete: string;
  edit: string;
  cancel: string;
  search: string;
  searchPlaceholder: string;
  actions: string;
  status: string;
  all: string;
  none: string;
  refresh: string;
  back: string;
  new: string;
  add: string;
  saved: string;
  updated: string;
  deleted: string;
  required: string;
  failed: string;
  confirmDelete: string;
  optional: string;

  // statuses
  st_pending: string;
  st_approved: string;
  st_suspended: string;
  st_active: string;
  st_inactive: string;
  st_draft: string;
  st_out_of_stock: string;
  st_processing: string;
  st_paid: string;
  st_shipped: string;
  st_completed: string;
  st_cancelled: string;
  st_open: string;
  st_in_progress: string;
  st_resolved: string;
  st_closed: string;

  // overview/dashboard
  ovTagline: string;
  ovWelcome: string;
  ovSub: string;
  ovNewProduct: string;
  ovSiteSettings: string;
  ovPreview: string;
  ovRevenue30: string;
  ovTotal: string;
  ovOrders: string;
  ovOrdersProcessing: string;
  ovProducts: string;
  ovProductsActive: string;
  ovVendors: string;
  ovVendorsPending: string;
  ovAlert: string;
  ovStable: string;
  ovReview: string;
  ovOk: string;
  ovLast14: string;
  ovRevenueCurve: string;
  ovPeriodTotal: string;
  ovShortcuts: string;
  ovManageProducts: string;
  ovProcessOrders: string;
  ovApproveVendors: string;
  ovEditCats: string;
  ovRecentOrders: string;
  ovViewAll: string;
  ovNoOrders: string;
  ovTopSelling: string;
  ovBySales: string;
  ovNoData: string;
  ovSold: string;
  ovVendorsAlert: string;
  ovVendorsAlertSub: string;
  ovOrdersAlert: string;
  ovOrdersAlertSub: string;
  ovUsersTotal: string;

  // vendors page
  venTitle: string;
  venSub: string;
  venStore: string;
  venSlug: string;
  venJoined: string;
  venNo: string;
  venApprove: string;
  venSuspend: string;
  venSetPending: string;
  venUpdated: (status: string) => string;

  // products
  prTitle: string;
  prSub: string;
  prAdd: string;
  prCol_title: string;
  prCol_vendor: string;
  prCol_price: string;
  prCol_stock: string;
  prNo: string;

  // categories
  catTitle: string;
  catSub: string;
  catName: string;
  catSlug: string;
  catIcon: string;
  catOrder: string;
  catImage: string;
  catEditTitle: string;
  catNewTitle: string;
  catNo: string;
  catNameReq: string;
  catSlugAuto: string;
  catIconHint: string;

  // orders
  orTitle: string;
  orSub: string;
  orCol_order: string;
  orCol_customer: string;
  orCol_total: string;
  orCol_payment: string;
  orNo: string;
  orCod: string;

  // users
  usTitle: string;
  usSub: string;
  usCol_user: string;
  usCol_roles: string;
  usCol_joined: string;
  usCol_manage: string;
  usUnnamed: string;
  usNo: string;
  usGranted: (r: string) => string;
  usRemoved: (r: string) => string;
  role_admin: string;
  role_vendor: string;
  role_customer: string;

  // settings
  seTitle: string;
  seSub: string;
  seSavedToast: string;
  seHero: string;
  seHeroSub: string;
  seHeroTitle: string;
  seHeroSubtitle: string;
  seCtaLabel: string;
  seCtaLink: string;
  seAnnouncement: string;
  seAnnouncementSub: string;
  seAnnEnable: string;
  seAnnMessage: string;
  seAnnLink: string;
  seContact: string;
  seContactSub: string;
  seCtPhone: string;
  seCtEmail: string;
  seCtWhats: string;
  seCtAddress: string;
  seSocial: string;
  seSocialSub: string;
  seFacebook: string;
  seInstagram: string;
  seTwitter: string;
  seYoutube: string;
  seSaveAll: string;

  // payments
  payTitle: string;
  paySub: string;
  payEnabled: string;
  payLiveCount: string;
  payNeedKeys: string;
  payMode: string;
  payModeTest: string;
  payModeLive: string;
  payProvider: string;
  payPubKey: string;
  payPubKeyHint: string;
  payWebhook: string;
  payWebhookHint: string;
  payNotLinked: string;
  paySecretNote: string;
  payBank: string;
  payAccountName: string;
  payIban: string;
  payHowTitle: string;
  payHow1: string;
  payHow2: string;
  payHow3: string;
  payHow4: string;
  payG_card: string;
  payG_cardSub: string;
  payG_benefit: string;
  payG_benefitSub: string;
  payG_apple: string;
  payG_appleSub: string;
  payG_google: string;
  payG_googleSub: string;
  payG_bank: string;
  payG_bankSub: string;
  payG_cod: string;
  payG_codSub: string;
  paySaved: string;
  paySaveFail: string;

  // support
  supTitle: string;
  supSub: string;
  supTotal: string;
  supSearchPh: string;
  supNoTickets: string;
  supSelectTicket: string;
  supTicket: string;
  supCustomerMsg: string;
  supStatusLabel: string;
  supInternalNotes: string;
  supNotesPh: string;
  supSaveNotes: string;
  supReplyEmail: string;
  supDeleteTicket: string;
  supConfirmDelete: string;
  supStatusUpdated: string;
  supNotesSaved: string;

  // catalog page
  caBack: string;
  caTitleSub: (count: number) => string;
  caNotFound: string;
  caBackToProducts: string;
  caAddProduct: string;
  caNoProducts: string;
  caAddFirst: string;
  caCol_product: string;
};

function mk(lang: Lang): AdminDict {
  const ar: AdminDict = {
    loading: "جارٍ التحميل…", save: "حفظ", saveChanges: "حفظ التغييرات", saveAll: "حفظ جميع الإعدادات",
    delete: "حذف", edit: "تعديل", cancel: "إلغاء", search: "بحث", searchPlaceholder: "ابحث…",
    actions: "إجراءات", status: "الحالة", all: "الكل", none: "—", refresh: "تحديث", back: "رجوع",
    new: "جديد", add: "إضافة", saved: "تم الحفظ", updated: "تم التحديث", deleted: "تم الحذف",
    required: "حقل مطلوب", failed: "فشلت العملية", confirmDelete: "هل تريد الحذف نهائياً؟", optional: "اختياري",
    st_pending: "قيد الانتظار", st_approved: "معتمد", st_suspended: "موقوف",
    st_active: "نشط", st_inactive: "غير نشط", st_draft: "مسودة", st_out_of_stock: "نفد المخزون",
    st_processing: "قيد المعالجة", st_paid: "مدفوع", st_shipped: "تم الشحن",
    st_completed: "مكتمل", st_cancelled: "ملغي",
    st_open: "مفتوح", st_in_progress: "قيد المعالجة", st_resolved: "تم الحل", st_closed: "مغلق",
    ovTagline: "مركز التحكم",
    ovWelcome: "مرحبًا بك في", ovSub: "منصة موحدة لإدارة المتجر كاملًا — منتجات، طلبات، بائعون، أقسام، مستخدمون، ومحتوى الموقع.",
    ovNewProduct: "منتج جديد", ovSiteSettings: "إعدادات الموقع", ovPreview: "معاينة الموقع",
    ovRevenue30: "إيرادات 30 يوم", ovTotal: "الإجمالي", ovOrders: "الطلبات", ovOrdersProcessing: "قيد المعالجة",
    ovProducts: "المنتجات", ovProductsActive: "نشطة", ovVendors: "البائعون", ovVendorsPending: "بانتظار الموافقة",
    ovAlert: "تنبيه", ovStable: "مستقر", ovReview: "مراجعة", ovOk: "تمام",
    ovLast14: "آخر 14 يوم", ovRevenueCurve: "منحنى الإيرادات", ovPeriodTotal: "مجموع الفترة",
    ovShortcuts: "اختصارات سريعة",
    ovManageProducts: "إدارة المنتجات", ovProcessOrders: "معالجة الطلبات",
    ovApproveVendors: "اعتماد البائعين", ovEditCats: "تحرير الأقسام",
    ovRecentOrders: "آخر الطلبات", ovViewAll: "عرض الكل ←", ovNoOrders: "لا توجد طلبات حتى الآن.",
    ovTopSelling: "الأكثر مبيعًا", ovBySales: "حسب إجمالي المبيعات", ovNoData: "لا توجد بيانات.",
    ovSold: "مبيع",
    ovVendorsAlert: "بائع بانتظار الموافقة", ovVendorsAlertSub: "راجع واعتمد البائعين الجدد ←",
    ovOrdersAlert: "طلب قيد المعالجة", ovOrdersAlertSub: "عالج وحدّث حالات التنفيذ ←",
    ovUsersTotal: "مستخدم مسجل عبر المنصة",
    venTitle: "البائعون", venSub: "اعتمد، ارفض، أو علّق متاجر البائعين.",
    venStore: "المتجر", venSlug: "المُعرّف", venJoined: "تاريخ الانضمام", venNo: "لا يوجد بائعون.",
    venApprove: "اعتماد", venSuspend: "تعليق", venSetPending: "إعادة للانتظار",
    venUpdated: (s) => `تم تحديث البائع: ${s}`,
    prTitle: "المنتجات", prSub: "إدارة المنتجات لجميع البائعين.", prAdd: "إضافة منتج",
    prCol_title: "العنوان", prCol_vendor: "البائع", prCol_price: "السعر", prCol_stock: "المخزون", prNo: "لا توجد منتجات.",
    catTitle: "الأقسام", catSub: "تنظيم تصنيفات الكتالوج.",
    catName: "الاسم", catSlug: "المُعرّف", catIcon: "اسم الأيقونة", catOrder: "الترتيب", catImage: "رابط الصورة",
    catEditTitle: "تعديل قسم", catNewTitle: "قسم جديد", catNo: "لا توجد أقسام بعد.",
    catNameReq: "الاسم مطلوب", catSlugAuto: "يُولّد تلقائياً", catIconHint: "اسم Lucide",
    orTitle: "الطلبات", orSub: "عرض وتحديث الطلبات في المتجر بالكامل.",
    orCol_order: "الطلب", orCol_customer: "العميل", orCol_total: "الإجمالي", orCol_payment: "الدفع", orNo: "لا توجد طلبات.",
    orCod: "الدفع عند الاستلام",
    usTitle: "المستخدمون والصلاحيات", usSub: "منح أو إلغاء صلاحيات الإدارة والبائع والعميل.",
    usCol_user: "المستخدم", usCol_roles: "الصلاحيات الحالية", usCol_joined: "تاريخ التسجيل", usCol_manage: "إدارة",
    usUnnamed: "بدون اسم", usNo: "لا يوجد مستخدمون.",
    usGranted: (r) => `تم منح صلاحية ${r}`, usRemoved: (r) => `تم إلغاء صلاحية ${r}`,
    role_admin: "مدير", role_vendor: "بائع", role_customer: "عميل",
    seTitle: "إعدادات الموقع", seSub: "تحكم بالمحتوى العام الذي يظهر في جميع صفحات الموقع.",
    seSavedToast: "تم حفظ إعدادات الموقع",
    seHero: "بانر الواجهة", seHeroSub: "العنوان الذي يراه الزوار أول مرة في الصفحة الرئيسية.",
    seHeroTitle: "العنوان", seHeroSubtitle: "العنوان الفرعي", seCtaLabel: "نص زر الإجراء", seCtaLink: "رابط زر الإجراء",
    seAnnouncement: "شريط الإعلان", seAnnouncementSub: "شريط صغير يظهر أعلى كل صفحة.",
    seAnnEnable: "تفعيل الإعلان", seAnnMessage: "الرسالة", seAnnLink: "رابط (اختياري)",
    seContact: "معلومات التواصل", seContactSub: "تستخدم في تذييل الموقع وصفحات التواصل.",
    seCtPhone: "الهاتف", seCtEmail: "البريد الإلكتروني", seCtWhats: "واتساب", seCtAddress: "العنوان",
    seSocial: "روابط التواصل الاجتماعي", seSocialSub: "تظهر في تذييل الموقع.",
    seFacebook: "فيسبوك", seInstagram: "إنستغرام", seTwitter: "تويتر / X", seYoutube: "يوتيوب",
    seSaveAll: "حفظ جميع الإعدادات",
    payTitle: "بوابات الدفع الإلكتروني",
    paySub: "تحكم بطرق الدفع المتاحة للعملاء عند إتمام الشراء، وأضف مفاتيح الربط متى ما أردت تفعيل بوابة فعلية.",
    payEnabled: "بوابات مفعّلة", payLiveCount: "وضع الإنتاج", payNeedKeys: "بانتظار المفاتيح",
    payMode: "وضع التشغيل", payModeTest: "تجريبي", payModeLive: "إنتاج",
    payProvider: "مزود الخدمة",
    payPubKey: "المفتاح العلني (Publishable)", payPubKeyHint: "مفتاح علني — يمكن تخزينه هنا",
    payWebhook: "رابط Webhook", payWebhookHint: "يُرسل من بوابة الدفع إلى متجرك",
    payNotLinked: "لم يتم الربط بعد",
    paySecretNote: "المفتاح السري (Secret Key) لا يُخزَّن في قاعدة البيانات لأسباب أمنية — يُحفظ كـ Secret في إعدادات الخادم عند تفعيل الربط الفعلي.",
    payBank: "اسم البنك", payAccountName: "اسم المستفيد", payIban: "IBAN",
    payHowTitle: "كيف يعمل الربط؟",
    payHow1: "إيقاف أي بوابة يخفيها فوراً عن صفحة إتمام الشراء.",
    payHow2: "الوضع التجريبي يسمح بمحاكاة الدفع دون تحصيل فعلي.",
    payHow3: "عند ربط مفاتيح بوابة فعلية (Stripe / Tap / Benefit) يتم تحويل العميل تلقائياً لإتمام الدفع الآمن.",
    payHow4: "يمكنك إضافة مفتاح Publishable هنا والمفتاح السري يُحفظ كسر مشفّر في إعدادات الخادم.",
    payG_card: "بطاقات الائتمان", payG_cardSub: "Visa · Mastercard · Mada",
    payG_benefit: "BenefitPay", payG_benefitSub: "بوابة بِنِفت البحرينية",
    payG_apple: "Apple Pay", payG_appleSub: "دفع سريع وآمن على أجهزة Apple",
    payG_google: "Google Pay", payG_googleSub: "ادفع ببطاقتك في Google Wallet",
    payG_bank: "تحويل بنكي", payG_bankSub: "حوالة مباشرة إلى حساب المتجر",
    payG_cod: "الدفع عند الاستلام", payG_codSub: "تحصيل نقدي عند توصيل الطلب للعميل",
    paySaved: "تم حفظ إعدادات بوابات الدفع", paySaveFail: "فشل الحفظ",
    supTitle: "مركز الدعم الفني", supSub: "إدارة جميع تذاكر العملاء والمساعدة",
    supTotal: "الإجمالي", supSearchPh: "بحث بالاسم، البريد، الموضوع...",
    supNoTickets: "لا توجد تذاكر تطابق البحث", supSelectTicket: "اختر تذكرة لعرض التفاصيل",
    supTicket: "تذكرة", supCustomerMsg: "رسالة العميل", supStatusLabel: "الحالة",
    supInternalNotes: "ملاحظات داخلية", supNotesPh: "ملاحظات للفريق فقط...",
    supSaveNotes: "حفظ الملاحظات", supReplyEmail: "رد بالبريد", supDeleteTicket: "حذف",
    supConfirmDelete: "حذف هذه التذكرة نهائياً؟",
    supStatusUpdated: "تم تحديث الحالة", supNotesSaved: "تم حفظ الملاحظات",
    caBack: "كل المنتجات",
    caTitleSub: (n) => `إدارة منتجات هذا القسم (${n})`,
    caNotFound: "القسم غير موجود.", caBackToProducts: "← العودة للمنتجات",
    caAddProduct: "إضافة منتج", caNoProducts: "لا توجد منتجات بعد في هذا القسم.",
    caAddFirst: "أضف أول منتج", caCol_product: "المنتج",
  };

  const en: AdminDict = {
    loading: "Loading…", save: "Save", saveChanges: "Save changes", saveAll: "Save all settings",
    delete: "Delete", edit: "Edit", cancel: "Cancel", search: "Search", searchPlaceholder: "Search…",
    actions: "Actions", status: "Status", all: "All", none: "—", refresh: "Refresh", back: "Back",
    new: "New", add: "Add", saved: "Saved", updated: "Updated", deleted: "Deleted",
    required: "Required", failed: "Operation failed", confirmDelete: "Delete permanently?", optional: "optional",
    st_pending: "Pending", st_approved: "Approved", st_suspended: "Suspended",
    st_active: "Active", st_inactive: "Inactive", st_draft: "Draft", st_out_of_stock: "Out of stock",
    st_processing: "Processing", st_paid: "Paid", st_shipped: "Shipped",
    st_completed: "Completed", st_cancelled: "Cancelled",
    st_open: "Open", st_in_progress: "In progress", st_resolved: "Resolved", st_closed: "Closed",
    ovTagline: "Command Center",
    ovWelcome: "Welcome to", ovSub: "Unified console to run your whole store — products, orders, vendors, categories, users, and site content.",
    ovNewProduct: "New product", ovSiteSettings: "Site settings", ovPreview: "Preview site",
    ovRevenue30: "30-day revenue", ovTotal: "Total", ovOrders: "Orders", ovOrdersProcessing: "processing",
    ovProducts: "Products", ovProductsActive: "active", ovVendors: "Vendors", ovVendorsPending: "pending approval",
    ovAlert: "Alert", ovStable: "Stable", ovReview: "Review", ovOk: "OK",
    ovLast14: "Last 14 days", ovRevenueCurve: "Revenue curve", ovPeriodTotal: "Period total",
    ovShortcuts: "Quick shortcuts",
    ovManageProducts: "Manage products", ovProcessOrders: "Process orders",
    ovApproveVendors: "Approve vendors", ovEditCats: "Edit categories",
    ovRecentOrders: "Recent orders", ovViewAll: "View all →", ovNoOrders: "No orders yet.",
    ovTopSelling: "Top selling", ovBySales: "By total sales", ovNoData: "No data.",
    ovSold: "sold",
    ovVendorsAlert: "vendor(s) pending approval", ovVendorsAlertSub: "Review and approve new vendors →",
    ovOrdersAlert: "order(s) processing", ovOrdersAlertSub: "Process and update fulfillment statuses →",
    ovUsersTotal: "registered users on the platform",
    venTitle: "Vendors", venSub: "Approve, reject, or suspend seller stores.",
    venStore: "Store", venSlug: "Slug", venJoined: "Joined", venNo: "No vendors.",
    venApprove: "Approve", venSuspend: "Suspend", venSetPending: "Set pending",
    venUpdated: (s) => `Vendor ${s}`,
    prTitle: "Products", prSub: "Moderate listings across all vendors.", prAdd: "Add product",
    prCol_title: "Title", prCol_vendor: "Vendor", prCol_price: "Price", prCol_stock: "Stock", prNo: "No products.",
    catTitle: "Categories", catSub: "Organize the catalog taxonomy.",
    catName: "Name", catSlug: "Slug", catIcon: "Icon name", catOrder: "Order", catImage: "Image URL",
    catEditTitle: "Edit category", catNewTitle: "New category", catNo: "No categories yet.",
    catNameReq: "Name is required", catSlugAuto: "auto-generated", catIconHint: "lucide name",
    orTitle: "Orders", orSub: "View and update orders across the marketplace.",
    orCol_order: "Order", orCol_customer: "Customer", orCol_total: "Total", orCol_payment: "Payment", orNo: "No orders.",
    orCod: "COD",
    usTitle: "Users & Roles", usSub: "Grant or revoke admin, vendor, and customer roles.",
    usCol_user: "User", usCol_roles: "Current roles", usCol_joined: "Joined", usCol_manage: "Manage",
    usUnnamed: "Unnamed", usNo: "No users.",
    usGranted: (r) => `Granted ${r}`, usRemoved: (r) => `Removed ${r}`,
    role_admin: "admin", role_vendor: "vendor", role_customer: "customer",
    seTitle: "Site settings", seSub: "Control the general content shown across all site pages.",
    seSavedToast: "Site settings saved",
    seHero: "Hero banner", seHeroSub: "The headline visitors see first on the home page.",
    seHeroTitle: "Title", seHeroSubtitle: "Subtitle", seCtaLabel: "CTA label", seCtaLink: "CTA link",
    seAnnouncement: "Announcement bar", seAnnouncementSub: "A small bar shown at the top of every page.",
    seAnnEnable: "Enable announcement", seAnnMessage: "Message", seAnnLink: "Link (optional)",
    seContact: "Contact info", seContactSub: "Used in the site footer and contact pages.",
    seCtPhone: "Phone", seCtEmail: "Email", seCtWhats: "WhatsApp", seCtAddress: "Address",
    seSocial: "Social links", seSocialSub: "Shown in the site footer.",
    seFacebook: "Facebook", seInstagram: "Instagram", seTwitter: "Twitter / X", seYoutube: "YouTube",
    seSaveAll: "Save all settings",
    payTitle: "Payment gateways",
    paySub: "Control which payment methods customers see at checkout, and add integration keys when you're ready to enable real gateways.",
    payEnabled: "Enabled gateways", payLiveCount: "Live mode", payNeedKeys: "Awaiting keys",
    payMode: "Mode", payModeTest: "Test", payModeLive: "Live",
    payProvider: "Provider",
    payPubKey: "Publishable / Public key", payPubKeyHint: "Public key — safe to store here",
    payWebhook: "Webhook URL", payWebhookHint: "Called by the payment gateway into your store",
    payNotLinked: "Not linked yet",
    paySecretNote: "The Secret Key is not stored in the database for security — it's saved as a Secret in server settings when the live integration is enabled.",
    payBank: "Bank name", payAccountName: "Account name", payIban: "IBAN",
    payHowTitle: "How does linking work?",
    payHow1: "Disabling any gateway instantly hides it from the checkout page.",
    payHow2: "Test mode allows simulating payments without real charges.",
    payHow3: "When real gateway keys (Stripe / Tap / Benefit) are linked, customers are redirected automatically for secure payment.",
    payHow4: "You can add a Publishable key here; the Secret key is stored encrypted in server settings.",
    payG_card: "Credit cards", payG_cardSub: "Visa · Mastercard · Mada",
    payG_benefit: "BenefitPay", payG_benefitSub: "Bahrain's Benefit gateway",
    payG_apple: "Apple Pay", payG_appleSub: "Fast secure payment on Apple devices",
    payG_google: "Google Pay", payG_googleSub: "Pay with your card in Google Wallet",
    payG_bank: "Bank transfer", payG_bankSub: "Direct transfer to the store account",
    payG_cod: "Cash on delivery", payG_codSub: "Cash collected on order delivery",
    paySaved: "Payment gateways saved", paySaveFail: "Save failed",
    supTitle: "Support center", supSub: "Manage all customer support tickets",
    supTotal: "Total", supSearchPh: "Search by name, email, subject…",
    supNoTickets: "No tickets match the search", supSelectTicket: "Select a ticket to view details",
    supTicket: "Ticket", supCustomerMsg: "Customer message", supStatusLabel: "Status",
    supInternalNotes: "Internal notes", supNotesPh: "Notes for the team only…",
    supSaveNotes: "Save notes", supReplyEmail: "Reply by email", supDeleteTicket: "Delete",
    supConfirmDelete: "Delete this ticket permanently?",
    supStatusUpdated: "Status updated", supNotesSaved: "Notes saved",
    caBack: "All products",
    caTitleSub: (n) => `Manage products in this category (${n})`,
    caNotFound: "Category not found.", caBackToProducts: "← Back to products",
    caAddProduct: "Add product", caNoProducts: "No products yet in this category.",
    caAddFirst: "Add the first product", caCol_product: "Product",
  };

  const ur: AdminDict = {
    loading: "لوڈ ہو رہا ہے…", save: "محفوظ کریں", saveChanges: "تبدیلیاں محفوظ کریں", saveAll: "تمام ترتیبات محفوظ کریں",
    delete: "حذف کریں", edit: "ترمیم", cancel: "منسوخ", search: "تلاش", searchPlaceholder: "تلاش کریں…",
    actions: "اعمال", status: "حالت", all: "سب", none: "—", refresh: "ریفریش", back: "واپس",
    new: "نیا", add: "شامل کریں", saved: "محفوظ ہو گیا", updated: "اپ ڈیٹ ہو گیا", deleted: "حذف ہو گیا",
    required: "ضروری ہے", failed: "ناکامی", confirmDelete: "مستقل طور پر حذف کریں؟", optional: "اختیاری",
    st_pending: "زیر التواء", st_approved: "منظور", st_suspended: "معطل",
    st_active: "فعال", st_inactive: "غیر فعال", st_draft: "مسودہ", st_out_of_stock: "اسٹاک ختم",
    st_processing: "زیرِ عمل", st_paid: "ادا شدہ", st_shipped: "بھیج دیا گیا",
    st_completed: "مکمل", st_cancelled: "منسوخ",
    st_open: "کھلا", st_in_progress: "زیرِ عمل", st_resolved: "حل ہو گیا", st_closed: "بند",
    ovTagline: "کمانڈ سینٹر",
    ovWelcome: "خوش آمدید", ovSub: "اپنے پورے اسٹور کو چلانے کے لیے ایک متحد کنسول — پروڈکٹس، آرڈرز، وینڈرز، زمرے، صارفین، اور سائٹ مواد۔",
    ovNewProduct: "نیا پروڈکٹ", ovSiteSettings: "سائٹ کی ترتیبات", ovPreview: "سائٹ کا پیش منظر",
    ovRevenue30: "30 دن کی آمدنی", ovTotal: "کل", ovOrders: "آرڈرز", ovOrdersProcessing: "زیرِ عمل",
    ovProducts: "پروڈکٹس", ovProductsActive: "فعال", ovVendors: "وینڈرز", ovVendorsPending: "منظوری کا منتظر",
    ovAlert: "انتباہ", ovStable: "مستحکم", ovReview: "جائزہ", ovOk: "ٹھیک",
    ovLast14: "آخری 14 دن", ovRevenueCurve: "آمدنی کا منحنی خط", ovPeriodTotal: "مدت کا کل",
    ovShortcuts: "فوری شارٹ کٹس",
    ovManageProducts: "پروڈکٹس کا انتظام", ovProcessOrders: "آرڈرز پر کارروائی",
    ovApproveVendors: "وینڈرز کی منظوری", ovEditCats: "زمروں میں ترمیم",
    ovRecentOrders: "حالیہ آرڈرز", ovViewAll: "سب دیکھیں ←", ovNoOrders: "ابھی کوئی آرڈر نہیں۔",
    ovTopSelling: "سب سے زیادہ فروخت", ovBySales: "کل فروخت کے مطابق", ovNoData: "کوئی ڈیٹا نہیں۔",
    ovSold: "فروخت",
    ovVendorsAlert: "وینڈر منظوری کے منتظر", ovVendorsAlertSub: "نئے وینڈرز کا جائزہ لیں اور منظور کریں ←",
    ovOrdersAlert: "آرڈر زیرِ عمل", ovOrdersAlertSub: "آرڈرز پر کارروائی کریں اور حالت اپ ڈیٹ کریں ←",
    ovUsersTotal: "پلیٹ فارم پر رجسٹرڈ صارفین",
    venTitle: "وینڈرز", venSub: "وینڈر اسٹورز کو منظور، مسترد، یا معطل کریں۔",
    venStore: "اسٹور", venSlug: "سلگ", venJoined: "شامل ہوا", venNo: "کوئی وینڈر نہیں۔",
    venApprove: "منظور", venSuspend: "معطل", venSetPending: "زیر التواء",
    venUpdated: (s) => `وینڈر ${s}`,
    prTitle: "پروڈکٹس", prSub: "تمام وینڈرز کی فہرستوں کا انتظام۔", prAdd: "پروڈکٹ شامل کریں",
    prCol_title: "عنوان", prCol_vendor: "وینڈر", prCol_price: "قیمت", prCol_stock: "اسٹاک", prNo: "کوئی پروڈکٹ نہیں۔",
    catTitle: "زمرے", catSub: "کیٹلاگ کی درجہ بندی منظم کریں۔",
    catName: "نام", catSlug: "سلگ", catIcon: "آئیکن کا نام", catOrder: "ترتیب", catImage: "تصویر کا URL",
    catEditTitle: "زمرہ میں ترمیم", catNewTitle: "نیا زمرہ", catNo: "ابھی کوئی زمرہ نہیں۔",
    catNameReq: "نام ضروری ہے", catSlugAuto: "خودکار", catIconHint: "lucide نام",
    orTitle: "آرڈرز", orSub: "مارکیٹ پلیس کے تمام آرڈرز دیکھیں اور اپ ڈیٹ کریں۔",
    orCol_order: "آرڈر", orCol_customer: "گاہک", orCol_total: "کل", orCol_payment: "ادائیگی", orNo: "کوئی آرڈر نہیں۔",
    orCod: "ڈلیوری پر ادائیگی",
    usTitle: "صارفین اور کردار", usSub: "ایڈمن، وینڈر اور کسٹمر کے کردار دیں یا واپس لیں۔",
    usCol_user: "صارف", usCol_roles: "موجودہ کردار", usCol_joined: "شامل ہوا", usCol_manage: "انتظام",
    usUnnamed: "بے نام", usNo: "کوئی صارف نہیں۔",
    usGranted: (r) => `${r} عطا کر دیا گیا`, usRemoved: (r) => `${r} ہٹا دیا گیا`,
    role_admin: "ایڈمن", role_vendor: "وینڈر", role_customer: "کسٹمر",
    seTitle: "سائٹ کی ترتیبات", seSub: "سائٹ کے تمام صفحات پر دکھائے جانے والے عام مواد کو کنٹرول کریں۔",
    seSavedToast: "سائٹ کی ترتیبات محفوظ ہو گئیں",
    seHero: "ہیرو بینر", seHeroSub: "مرکزی صفحے پر سب سے پہلے دکھائی دینے والی سرخی۔",
    seHeroTitle: "عنوان", seHeroSubtitle: "ذیلی عنوان", seCtaLabel: "CTA لیبل", seCtaLink: "CTA لنک",
    seAnnouncement: "اعلان بار", seAnnouncementSub: "ہر صفحے کے اوپر دکھائی جانے والی چھوٹی بار۔",
    seAnnEnable: "اعلان فعال کریں", seAnnMessage: "پیغام", seAnnLink: "لنک (اختیاری)",
    seContact: "رابطہ معلومات", seContactSub: "سائٹ فوٹر اور رابطہ صفحات میں استعمال ہوتی ہیں۔",
    seCtPhone: "فون", seCtEmail: "ای میل", seCtWhats: "واٹس ایپ", seCtAddress: "پتہ",
    seSocial: "سوشل لنکس", seSocialSub: "سائٹ فوٹر میں دکھائی جاتی ہیں۔",
    seFacebook: "فیس بک", seInstagram: "انسٹاگرام", seTwitter: "ٹویٹر / X", seYoutube: "یوٹیوب",
    seSaveAll: "تمام ترتیبات محفوظ کریں",
    payTitle: "ادائیگی گیٹ ویز",
    paySub: "چیک آؤٹ پر گاہکوں کو دستیاب ادائیگی کے طریقے کنٹرول کریں، اور لائیو گیٹ وے کو فعال کرنے کے لیے انضمام کی چابیاں شامل کریں۔",
    payEnabled: "فعال گیٹ ویز", payLiveCount: "لائیو موڈ", payNeedKeys: "چابیوں کا منتظر",
    payMode: "موڈ", payModeTest: "ٹیسٹ", payModeLive: "لائیو",
    payProvider: "فراہم کنندہ",
    payPubKey: "پبلشایبل کلید", payPubKeyHint: "عوامی کلید — یہاں محفوظ کر سکتے ہیں",
    payWebhook: "Webhook URL", payWebhookHint: "ادائیگی گیٹ وے سے آپ کے اسٹور پر بھیجی جاتی ہے",
    payNotLinked: "ابھی منسلک نہیں",
    paySecretNote: "سیکیورٹی کی وجہ سے سیکریٹ کلید ڈیٹا بیس میں محفوظ نہیں کی جاتی — لائیو انضمام کے فعال ہونے پر یہ سرور کی ترتیبات میں سیکریٹ کے طور پر محفوظ ہوتی ہے۔",
    payBank: "بینک کا نام", payAccountName: "اکاؤنٹ کا نام", payIban: "IBAN",
    payHowTitle: "ربط کیسے کام کرتا ہے؟",
    payHow1: "کسی بھی گیٹ وے کو غیر فعال کرنا اسے فوراً چیک آؤٹ صفحے سے چھپا دیتا ہے۔",
    payHow2: "ٹیسٹ موڈ حقیقی چارجز کے بغیر ادائیگی کی نقل کرنے کی اجازت دیتا ہے۔",
    payHow3: "جب اصلی گیٹ وے کیز (Stripe / Tap / Benefit) منسلک ہوں تو گاہکوں کو خودکار طور پر محفوظ ادائیگی کے لیے بھیجا جاتا ہے۔",
    payHow4: "آپ یہاں پبلشایبل کلید شامل کر سکتے ہیں؛ سیکریٹ کلید سرور کی ترتیبات میں خفیہ شکل میں محفوظ ہوتی ہے۔",
    payG_card: "کریڈٹ کارڈز", payG_cardSub: "Visa · Mastercard · Mada",
    payG_benefit: "BenefitPay", payG_benefitSub: "بحرین کا Benefit گیٹ وے",
    payG_apple: "Apple Pay", payG_appleSub: "Apple ڈیوائسز پر تیز محفوظ ادائیگی",
    payG_google: "Google Pay", payG_googleSub: "Google Wallet میں اپنے کارڈ سے ادائیگی",
    payG_bank: "بینک ٹرانسفر", payG_bankSub: "اسٹور اکاؤنٹ میں براہ راست منتقلی",
    payG_cod: "ڈلیوری پر ادائیگی", payG_codSub: "آرڈر کی ڈلیوری پر نقد وصولی",
    paySaved: "ادائیگی گیٹ ویز محفوظ ہو گئے", paySaveFail: "محفوظ نہیں ہو سکا",
    supTitle: "سپورٹ سینٹر", supSub: "تمام کسٹمر سپورٹ ٹکٹس کا انتظام",
    supTotal: "کل", supSearchPh: "نام، ای میل، موضوع سے تلاش…",
    supNoTickets: "کوئی ٹکٹ تلاش سے مماثل نہیں", supSelectTicket: "تفصیلات دیکھنے کے لیے ٹکٹ منتخب کریں",
    supTicket: "ٹکٹ", supCustomerMsg: "گاہک کا پیغام", supStatusLabel: "حالت",
    supInternalNotes: "اندرونی نوٹس", supNotesPh: "صرف ٹیم کے لیے نوٹس…",
    supSaveNotes: "نوٹس محفوظ کریں", supReplyEmail: "ای میل سے جواب", supDeleteTicket: "حذف",
    supConfirmDelete: "اس ٹکٹ کو مستقل طور پر حذف کریں؟",
    supStatusUpdated: "حالت اپ ڈیٹ ہو گئی", supNotesSaved: "نوٹس محفوظ ہو گئے",
    caBack: "تمام پروڈکٹس",
    caTitleSub: (n) => `اس زمرے کے پروڈکٹس کا انتظام (${n})`,
    caNotFound: "زمرہ نہیں ملا۔", caBackToProducts: "← پروڈکٹس پر واپس",
    caAddProduct: "پروڈکٹ شامل کریں", caNoProducts: "اس زمرے میں ابھی کوئی پروڈکٹ نہیں۔",
    caAddFirst: "پہلا پروڈکٹ شامل کریں", caCol_product: "پروڈکٹ",
  };

  return lang === "en" ? en : lang === "ur" ? ur : ar;
}

export function useAdminI18n() {
  const { lang, dir } = useI18n();
  return { L: mk(lang), lang, dir };
}

export function statusLabel(L: AdminDict, status: string): string {
  const k = ("st_" + status) as keyof AdminDict;
  const v = L[k];
  return typeof v === "string" ? v : status;
}
