export type FieldType = "text" | "number" | "select" | "boolean" | "textarea";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
}

export interface CategoryPreset {
  productType: "physical" | "digital" | "subscription";
  sectionTitle: string;
  fields: FieldDef[];
  /** Show the weight (grams) field in the product form. */
  showWeight?: boolean;
}

export const CATEGORY_PRESETS: Record<string, CategoryPreset> = {
  "iptv": {
    productType: "subscription",
    sectionTitle: "تفاصيل اشتراك IPTV",
    showWeight: false,
    fields: [
      { key: "duration_months", label: "المدة (شهور)", type: "number", placeholder: "12" },
      { key: "channels", label: "عدد القنوات", type: "text", placeholder: "25,000+" },
      { key: "quality", label: "الجودة", type: "select", options: ["SD", "HD", "FHD", "4K", "8K", "4K/FHD"] },
      { key: "vod", label: "أفلام VOD", type: "text", placeholder: "50,000+" },
      { key: "devices", label: "عدد الأجهزة", type: "number", placeholder: "1" },
      { key: "downloader_code", label: "كود Downloader", type: "text", placeholder: "123456" },
      { key: "app_download_url", label: "رابط تحميل APK", type: "text", placeholder: "https://..." },
      { key: "supported_apps", label: "التطبيقات المدعومة", type: "text", placeholder: "IBO, Smarters, Duplex" },
    ],
  },
  "satellite-receivers": {
    productType: "physical",
    sectionTitle: "مواصفات الرسيفر",
    showWeight: true,
    fields: [
      { key: "brand", label: "الماركة", type: "text", placeholder: "Tiger, Starsat..." },
      { key: "model", label: "الموديل", type: "text" },
      { key: "resolution", label: "الدقة", type: "select", options: ["SD", "HD", "FHD", "4K", "8K"] },
      { key: "wifi", label: "WiFi مدمج", type: "boolean" },
      { key: "bluetooth", label: "Bluetooth", type: "boolean" },
      { key: "storage", label: "التخزين", type: "text", placeholder: "USB, HDD" },
      { key: "ports", label: "المنافذ", type: "text", placeholder: "HDMI, USB x2, LAN" },
      { key: "warranty_months", label: "الضمان (شهور)", type: "number" },
    ],
  },
  "bein-ranwel": {
    productType: "physical",
    sectionTitle: "مواصفات BeIN / Ranwel",
    showWeight: true,
    fields: [
      { key: "brand", label: "الماركة", type: "select", options: ["BeIN", "Ranwel", "Other"] },
      { key: "model", label: "الموديل", type: "text" },
      { key: "resolution", label: "الدقة", type: "select", options: ["HD", "FHD", "4K"] },
      { key: "subscription_included", label: "اشتراك مضمّن", type: "boolean" },
      { key: "subscription_duration", label: "مدة الاشتراك", type: "text", placeholder: "12 شهر" },
      { key: "warranty_months", label: "الضمان (شهور)", type: "number" },
    ],
  },
  "android-tv-boxes": {
    productType: "physical",
    sectionTitle: "مواصفات Android TV Box",
    showWeight: true,
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "model", label: "الموديل", type: "text" },
      { key: "android_version", label: "إصدار Android", type: "text", placeholder: "13" },
      { key: "ram", label: "RAM", type: "text", placeholder: "4GB" },
      { key: "storage", label: "التخزين", type: "text", placeholder: "64GB" },
      { key: "resolution", label: "الدقة", type: "select", options: ["FHD", "4K", "8K"] },
      { key: "wifi", label: "WiFi", type: "text", placeholder: "WiFi 6" },
      { key: "bluetooth", label: "Bluetooth", type: "boolean" },
    ],
  },
  "mobile-accessories": {
    productType: "physical",
    sectionTitle: "تفاصيل الإكسسوار",
    showWeight: false,
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "type", label: "النوع", type: "text", placeholder: "شاحن، كيبل، حامل..." },
      { key: "compatible_with", label: "متوافق مع", type: "text", placeholder: "iPhone, Samsung..." },
      { key: "color", label: "اللون", type: "text" },
      { key: "material", label: "الخامة", type: "text" },
    ],
  },
  "tp-link": {
    productType: "physical",
    sectionTitle: "مواصفات TP-Link",
    showWeight: false,
    fields: [
      { key: "model", label: "الموديل", type: "text" },
      { key: "device_type", label: "نوع الجهاز", type: "select", options: ["Router", "Extender", "Switch", "Access Point", "Powerline"] },
      { key: "wifi_standard", label: "معيار WiFi", type: "select", options: ["WiFi 4", "WiFi 5", "WiFi 6", "WiFi 6E", "WiFi 7"] },
      { key: "speed", label: "السرعة", type: "text", placeholder: "AX3000" },
      { key: "band", label: "النطاق", type: "select", options: ["Single Band", "Dual Band", "Tri Band"] },
      { key: "ports", label: "المنافذ", type: "text", placeholder: "4x Gigabit LAN" },
    ],
  },
  "cctv": {
    productType: "physical",
    sectionTitle: "مواصفات نظام CCTV",
    showWeight: true,
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "channels", label: "عدد القنوات", type: "number", placeholder: "4/8/16/32" },
      { key: "resolution", label: "الدقة", type: "select", options: ["1080p", "2K", "4MP", "5MP", "4K", "8MP"] },
      { key: "night_vision", label: "رؤية ليلية", type: "boolean" },
      { key: "storage", label: "التخزين", type: "text", placeholder: "HDD 2TB" },
      { key: "weatherproof", label: "مقاوم للماء", type: "boolean" },
      { key: "package_contents", label: "محتويات العلبة", type: "textarea" },
    ],
  },
  "ip-cameras": {
    productType: "physical",
    sectionTitle: "مواصفات كاميرا IP",
    showWeight: true,
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "resolution", label: "الدقة", type: "select", options: ["1080p", "2K", "4MP", "5MP", "4K", "8MP"] },
      { key: "lens", label: "العدسة", type: "text", placeholder: "2.8mm" },
      { key: "night_vision_range", label: "مسافة الرؤية الليلية", type: "text", placeholder: "30m" },
      { key: "connectivity", label: "الاتصال", type: "select", options: ["WiFi", "PoE", "WiFi + PoE", "4G"] },
      { key: "weatherproof", label: "مقاوم للماء (IP66/67)", type: "boolean" },
      { key: "audio", label: "صوت ثنائي الاتجاه", type: "boolean" },
    ],
  },
  "keyboards-mice": {
    productType: "physical",
    sectionTitle: "تفاصيل الكيبورد/الماوس",
    showWeight: false,
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "type", label: "النوع", type: "select", options: ["Keyboard", "Mouse", "Combo"] },
      { key: "connection", label: "الاتصال", type: "select", options: ["Wired", "Wireless", "Bluetooth"] },
      { key: "layout", label: "اللغة", type: "select", options: ["Arabic", "English", "Arabic/English"] },
      { key: "backlit", label: "إضاءة خلفية", type: "boolean" },
      { key: "color", label: "اللون", type: "text" },
    ],
  },
  "power-adapters": {
    productType: "physical",
    sectionTitle: "مواصفات المحوّل",
    showWeight: false,
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "input_voltage", label: "الجهد الداخل", type: "text", placeholder: "100-240V" },
      { key: "output_voltage", label: "الجهد الخارج", type: "text", placeholder: "12V" },
      { key: "current", label: "التيار", type: "text", placeholder: "2A" },
      { key: "wattage", label: "الواط", type: "text", placeholder: "24W" },
      { key: "connector", label: "نوع الوصلة", type: "text", placeholder: "5.5x2.5mm" },
    ],
  },
  "new-tvs": {
    productType: "physical",
    sectionTitle: "مواصفات التلفزيون",
    showWeight: true,
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "model", label: "الموديل", type: "text" },
      { key: "size_inch", label: "الحجم (بوصة)", type: "select", options: ["55", "65", "75", "85"] },
      { key: "resolution", label: "الدقة", type: "select", options: ["FHD", "4K", "8K"] },
      { key: "smart_os", label: "نظام التشغيل", type: "text", placeholder: "Google TV, WebOS..." },
      { key: "hdr", label: "HDR", type: "boolean" },
      { key: "refresh_rate", label: "معدل التحديث", type: "text", placeholder: "60Hz / 120Hz" },
      { key: "warranty_months", label: "الضمان (شهور)", type: "number" },
    ],
  },
  "video-intercom": {
    productType: "physical",
    sectionTitle: "مواصفات الإنتركم",
    showWeight: true,
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "monitor_size", label: "حجم الشاشة", type: "text", placeholder: "7 inch" },
      { key: "resolution", label: "الدقة", type: "text" },
      { key: "wired_wireless", label: "النوع", type: "select", options: ["Wired", "Wireless", "WiFi"] },
      { key: "night_vision", label: "رؤية ليلية", type: "boolean" },
      { key: "unlock_support", label: "دعم فتح الباب", type: "boolean" },
    ],
  },
  "multiswitches": {
    productType: "physical",
    sectionTitle: "مواصفات Multiswitch",
    showWeight: true,
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "inputs", label: "عدد المداخل", type: "number", placeholder: "5" },
      { key: "outputs", label: "عدد المخارج", type: "number", placeholder: "8" },
      { key: "powered", label: "يحتاج طاقة خارجية", type: "boolean" },
    ],
  },
  "remote-controls": {
    productType: "physical",
    sectionTitle: "مواصفات الريموت",
    showWeight: false,
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "compatible_with", label: "متوافق مع", type: "text", placeholder: "Tiger T8, Starsat..." },
      { key: "model", label: "الموديل", type: "text" },
      { key: "type", label: "النوع", type: "select", options: ["IR", "Bluetooth", "RF", "Voice"] },
      { key: "backlit", label: "إضاءة", type: "boolean" },
    ],
  },
};

export const RESERVED_FEATURE_KEYS = new Set<string>(
  Object.values(CATEGORY_PRESETS).flatMap((p) => p.fields.map((f) => f.key)),
);

// Translations for preset labels & section titles (Arabic → EN/UR).
const PRESET_TRANSLATIONS: Record<string, { en: string; ur: string }> = {
  // Section titles
  "تفاصيل اشتراك IPTV": { en: "IPTV subscription details", ur: "IPTV سبسکرپشن کی تفصیلات" },
  "مواصفات الرسيفر": { en: "Receiver specs", ur: "ریسیور کی تفصیلات" },
  "مواصفات BeIN / Ranwel": { en: "BeIN / Ranwel specs", ur: "BeIN / Ranwel تفصیلات" },
  "مواصفات Android TV Box": { en: "Android TV Box specs", ur: "Android TV Box تفصیلات" },
  "تفاصيل الإكسسوار": { en: "Accessory details", ur: "لوازمات کی تفصیلات" },
  "مواصفات TP-Link": { en: "TP-Link specs", ur: "TP-Link تفصیلات" },
  "مواصفات نظام CCTV": { en: "CCTV system specs", ur: "CCTV سسٹم تفصیلات" },
  "مواصفات كاميرا IP": { en: "IP camera specs", ur: "IP کیمرہ تفصیلات" },
  "تفاصيل الكيبورد/الماوس": { en: "Keyboard / Mouse details", ur: "کی بورڈ / ماؤس تفصیلات" },
  "مواصفات المحوّل": { en: "Adapter specs", ur: "اڈاپٹر تفصیلات" },
  "مواصفات التلفزيون": { en: "TV specs", ur: "ٹی وی تفصیلات" },
  "مواصفات الإنتركم": { en: "Intercom specs", ur: "انٹرکام تفصیلات" },
  "مواصفات Multiswitch": { en: "Multiswitch specs", ur: "ملٹی سوئچ تفصیلات" },
  "مواصفات الريموت": { en: "Remote specs", ur: "ریموٹ تفصیلات" },

  // Field labels
  "المدة (شهور)": { en: "Duration (months)", ur: "مدت (مہینے)" },
  "عدد القنوات": { en: "Channels", ur: "چینلز کی تعداد" },
  "الجودة": { en: "Quality", ur: "معیار" },
  "أفلام VOD": { en: "VOD movies", ur: "VOD فلمیں" },
  "عدد الأجهزة": { en: "Devices", ur: "آلات کی تعداد" },
  "كود Downloader": { en: "Downloader code", ur: "Downloader کوڈ" },
  "رابط تحميل APK": { en: "APK download URL", ur: "APK ڈاؤن لوڈ لنک" },
  "التطبيقات المدعومة": { en: "Supported apps", ur: "معاون ایپس" },
  "الماركة": { en: "Brand", ur: "برانڈ" },
  "الموديل": { en: "Model", ur: "ماڈل" },
  "الدقة": { en: "Resolution", ur: "ریزولوشن" },
  "WiFi مدمج": { en: "Built-in WiFi", ur: "بلٹ اِن WiFi" },
  "Bluetooth": { en: "Bluetooth", ur: "بلوٹوتھ" },
  "التخزين": { en: "Storage", ur: "اسٹوریج" },
  "المنافذ": { en: "Ports", ur: "پورٹس" },
  "الضمان (شهور)": { en: "Warranty (months)", ur: "وارنٹی (مہینے)" },
  "اشتراك مضمّن": { en: "Subscription included", ur: "سبسکرپشن شامل" },
  "مدة الاشتراك": { en: "Subscription duration", ur: "سبسکرپشن کی مدت" },
  "إصدار Android": { en: "Android version", ur: "Android ورژن" },
  "RAM": { en: "RAM", ur: "RAM" },
  "WiFi": { en: "WiFi", ur: "WiFi" },
  "النوع": { en: "Type", ur: "قسم" },
  "متوافق مع": { en: "Compatible with", ur: "مطابقت" },
  "اللون": { en: "Color", ur: "رنگ" },
  "الخامة": { en: "Material", ur: "مواد" },
  "نوع الجهاز": { en: "Device type", ur: "ڈیوائس کی قسم" },
  "معيار WiFi": { en: "WiFi standard", ur: "WiFi معیار" },
  "السرعة": { en: "Speed", ur: "رفتار" },
  "النطاق": { en: "Band", ur: "بینڈ" },
  "رؤية ليلية": { en: "Night vision", ur: "رات کی بینائی" },
  "مقاوم للماء": { en: "Weatherproof", ur: "موسم مزاحم" },
  "محتويات العلبة": { en: "Package contents", ur: "پیکج مواد" },
  "العدسة": { en: "Lens", ur: "لینس" },
  "مسافة الرؤية الليلية": { en: "Night vision range", ur: "رات کی بینائی کی حد" },
  "الاتصال": { en: "Connectivity", ur: "کنیکٹیویٹی" },
  "مقاوم للماء (IP66/67)": { en: "Weatherproof (IP66/67)", ur: "موسم مزاحم (IP66/67)" },
  "صوت ثنائي الاتجاه": { en: "Two-way audio", ur: "دو طرفہ آڈیو" },
  "اللغة": { en: "Layout / language", ur: "زبان" },
  "إضاءة خلفية": { en: "Backlit", ur: "بیک لِٹ" },
  "الجهد الداخل": { en: "Input voltage", ur: "ان پٹ وولٹیج" },
  "الجهد الخارج": { en: "Output voltage", ur: "آؤٹ پٹ وولٹیج" },
  "التيار": { en: "Current", ur: "کرنٹ" },
  "الواط": { en: "Wattage", ur: "واٹج" },
  "نوع الوصلة": { en: "Connector", ur: "کنیکٹر" },
  "الحجم (بوصة)": { en: "Size (inch)", ur: "سائز (انچ)" },
  "نظام التشغيل": { en: "Smart OS", ur: "آپریٹنگ سسٹم" },
  "HDR": { en: "HDR", ur: "HDR" },
  "معدل التحديث": { en: "Refresh rate", ur: "ریفریش ریٹ" },
  "حجم الشاشة": { en: "Monitor size", ur: "اسکرین سائز" },
  "دعم فتح الباب": { en: "Unlock support", ur: "دروازہ کھولنے کی سہولت" },
  "عدد المداخل": { en: "Inputs", ur: "ان پٹس" },
  "عدد المخارج": { en: "Outputs", ur: "آؤٹ پٹس" },
  "يحتاج طاقة خارجية": { en: "Needs external power", ur: "بیرونی طاقت درکار" },
  "إضاءة": { en: "Backlit", ur: "روشنی" },
};

export function translatePresetLabel(label: string, lang: "ar" | "en" | "ur"): string {
  if (lang === "ar") return label;
  return PRESET_TRANSLATIONS[label]?.[lang] ?? label;
}

