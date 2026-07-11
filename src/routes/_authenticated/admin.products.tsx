import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Package, Tv, Satellite, Smartphone, Wifi, Camera, Keyboard, Plug, Monitor, Bell, Radio, Cable } from "lucide-react";
import { useState, type ComponentType } from "react";
import { toast } from "sonner";
import { formatPrice, firstImage } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/products")({
  component: AdminProducts,
});

/* ============ Category-specific field schema ============ */

type FieldType = "text" | "number" | "select" | "boolean" | "textarea";
interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  placeholder?: string;
}
interface CategoryPreset {
  productType: "physical" | "digital" | "subscription";
  fields: FieldDef[];
}

const CATEGORY_PRESETS: Record<string, CategoryPreset> = {
  "iptv": {
    productType: "subscription",
    fields: [
      { key: "duration_months", label: "المدة (شهور)", type: "number", placeholder: "12" },
      { key: "channels", label: "عدد القنوات", type: "number", placeholder: "20000" },
      { key: "quality", label: "الجودة", type: "select", options: ["SD", "HD", "FHD", "4K", "8K"] },
      { key: "vod", label: "أفلام VOD", type: "text", placeholder: "50000" },
      { key: "devices", label: "عدد الأجهزة", type: "number", placeholder: "1" },
      { key: "downloader_code", label: "كود Downloader", type: "text", placeholder: "123456" },
      { key: "app_download_url", label: "رابط تحميل APK", type: "text", placeholder: "https://..." },
      { key: "supported_apps", label: "التطبيقات المدعومة", type: "text", placeholder: "IBO, Smarters, Duplex" },
    ],
  },
  "satellite-receivers": {
    productType: "physical",
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
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "inputs", label: "عدد المداخل", type: "number", placeholder: "5" },
      { key: "outputs", label: "عدد المخارج", type: "number", placeholder: "8" },
      { key: "powered", label: "يحتاج طاقة خارجية", type: "boolean" },
    ],
  },
  "remote-controls": {
    productType: "physical",
    fields: [
      { key: "brand", label: "الماركة", type: "text" },
      { key: "compatible_with", label: "متوافق مع", type: "text", placeholder: "Tiger T8, Starsat..." },
      { key: "model", label: "الموديل", type: "text" },
      { key: "type", label: "النوع", type: "select", options: ["IR", "Bluetooth", "RF", "Voice"] },
      { key: "backlit", label: "إضاءة", type: "boolean" },
    ],
  },
};

const CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  "iptv": Tv,
  "satellite-receivers": Satellite,
  "bein-ranwel": Satellite,
  "android-tv-boxes": Tv,
  "mobile-accessories": Smartphone,
  "tp-link": Wifi,
  "cctv": Camera,
  "ip-cameras": Camera,
  "keyboards-mice": Keyboard,
  "power-adapters": Plug,
  "new-tvs": Monitor,
  "video-intercom": Bell,
  "multiswitches": Cable,
  "remote-controls": Radio,
};

/* ============ Form state ============ */

interface ProductForm {
  id?: string;
  slug: string;
  name_ar: string;
  name_en: string;
  name_ur: string;
  description_ar: string;
  description_en: string;
  description_ur: string;
  category_id: string;
  category_slug: string;
  type: "physical" | "digital" | "subscription";
  status: "draft" | "active" | "archived";
  price: string;
  compare_price: string;
  currency: string;
  stock: string;
  is_featured: boolean;
  image_url: string;
  features: Record<string, string | number | boolean>;
}

const empty: ProductForm = {
  slug: "", name_ar: "", name_en: "", name_ur: "",
  description_ar: "", description_en: "", description_ur: "",
  category_id: "", category_slug: "",
  type: "physical", status: "active",
  price: "0", compare_price: "", currency: "USD", stock: "0",
  is_featured: false, image_url: "", features: {},
};

function AdminProducts() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ProductForm>(empty);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => (await supabase.from("products").select("*, categories(slug, name_en, name_ar)").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: cats } = useQuery({
    queryKey: ["admin-cats-list"],
    queryFn: async () => (await supabase.from("categories").select("id, slug, name_en, name_ar").order("sort_order")).data ?? [],
  });

  const openForCategory = (cat: { id: string; slug: string }) => {
    const preset = CATEGORY_PRESETS[cat.slug];
    setForm({
      ...empty,
      category_id: cat.id,
      category_slug: cat.slug,
      type: preset?.productType ?? "physical",
      features: {},
    });
    setOpen(true);
  };

  const handleEdit = (p: {
    id: string; slug: string; name_ar: string; name_en: string; name_ur: string | null;
    description_ar: string | null; description_en: string | null; description_ur: string | null;
    category_id: string | null; type: string; status: string; price: number;
    compare_price: number | null; currency: string; stock: number; is_featured: boolean;
    images: unknown; features: unknown; categories?: { slug: string } | null;
  }) => {
    const feats = (p.features && typeof p.features === "object" ? p.features : {}) as Record<string, string | number | boolean>;
    setForm({
      id: p.id, slug: p.slug,
      name_ar: p.name_ar, name_en: p.name_en, name_ur: p.name_ur ?? "",
      description_ar: p.description_ar ?? "", description_en: p.description_en ?? "", description_ur: p.description_ur ?? "",
      category_id: p.category_id ?? "",
      category_slug: p.categories?.slug ?? "",
      type: p.type as ProductForm["type"], status: p.status as ProductForm["status"],
      price: String(p.price), compare_price: p.compare_price ? String(p.compare_price) : "",
      currency: p.currency, stock: String(p.stock), is_featured: p.is_featured,
      image_url: firstImage(p.images) ?? "",
      features: feats,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name_ar || !form.name_en) { toast.error("الاسم مطلوب (AR/EN)"); return; }
    const payload = {
      slug: form.slug || form.name_en.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      name_ar: form.name_ar, name_en: form.name_en, name_ur: form.name_ur || null,
      description_ar: form.description_ar || null, description_en: form.description_en || null, description_ur: form.description_ur || null,
      category_id: form.category_id || null,
      type: form.type, status: form.status,
      price: Number(form.price),
      compare_price: form.compare_price ? Number(form.compare_price) : null,
      currency: form.currency, stock: Number(form.stock),
      is_featured: form.is_featured,
      images: form.image_url ? [form.image_url] : [],
      features: form.features ?? {},
    };
    const { error } = form.id
      ? await supabase.from("products").update(payload).eq("id", form.id)
      : await supabase.from("products").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحفظ");
    setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف"); qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const preset = form.category_slug ? CATEGORY_PRESETS[form.category_slug] : undefined;
  const dynamicFields = preset?.fields ?? [];
  const showStock = form.type !== "subscription" && form.type !== "digital";
  const currentCategoryName = cats?.find((c) => c.id === form.category_id)?.name_ar ?? "";

  const setFeature = (key: string, value: string | number | boolean) => {
    setForm((f) => ({ ...f, features: { ...f.features, [key]: value } }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">المنتجات</h1>
        <p className="mt-1 text-sm text-muted-foreground">اختر القسم لإضافة منتج بالحقول الخاصة به</p>
      </div>

      {/* Category-specific add buttons */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {(cats ?? []).map((c) => {
          const Icon = CATEGORY_ICONS[c.slug] ?? Package;
          const hasPreset = !!CATEGORY_PRESETS[c.slug];
          return (
            <button
              key={c.id}
              onClick={() => openForCategory(c)}
              className="group flex items-center gap-3 rounded-xl border border-cyan-500/20 bg-card p-3 text-start transition hover:-translate-y-0.5 hover:border-cyan-400/60 hover:bg-cyan-500/5"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan-500/10 text-cyan-400">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{c.name_ar}</div>
                <div className="truncate text-[10px] text-muted-foreground">{hasPreset ? `+ حقول مخصصة` : "حقول أساسية"}</div>
              </div>
              <Plus className="h-4 w-4 text-cyan-400 opacity-70 group-hover:opacity-100" />
            </button>
          );
        })}
      </div>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {form.id ? "تعديل" : "إضافة"} منتج
              {currentCategoryName && <span className="ms-2 text-sm font-normal text-cyan-400">— {currentCategoryName}</span>}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5">
            {/* Basics */}
            <section className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2 text-xs font-semibold uppercase tracking-wider text-cyan-400/80">الأساسيات</div>
              <div><Label>الاسم (AR) *</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
              <div><Label>الاسم (EN) *</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
              <div><Label>الاسم (UR)</Label><Input value={form.name_ur} onChange={(e) => setForm({ ...form, name_ur: e.target.value })} /></div>
              <div><Label>الرابط (Slug)</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-from-en" /></div>
              <div>
                <Label>القسم</Label>
                <Select
                  value={form.category_id}
                  onValueChange={(v) => {
                    const c = cats?.find((x) => x.id === v);
                    const p = c ? CATEGORY_PRESETS[c.slug] : undefined;
                    setForm({ ...form, category_id: v, category_slug: c?.slug ?? "", type: p?.productType ?? form.type });
                  }}
                >
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>{(cats ?? []).map((c) => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>النوع</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ProductForm["type"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="physical">منتج فعلي</SelectItem>
                    <SelectItem value="digital">رقمي</SelectItem>
                    <SelectItem value="subscription">اشتراك</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </section>

            {/* Pricing */}
            <section className="grid gap-3 md:grid-cols-2">
              <div className="md:col-span-2 text-xs font-semibold uppercase tracking-wider text-cyan-400/80">السعر والمخزون</div>
              <div><Label>السعر</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div><Label>السعر قبل الخصم</Label><Input type="number" step="0.01" value={form.compare_price} onChange={(e) => setForm({ ...form, compare_price: e.target.value })} /></div>
              <div><Label>العملة</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
              {showStock && <div><Label>المخزون</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>}
              <div>
                <Label>الحالة</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ProductForm["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">مسودة</SelectItem>
                    <SelectItem value="active">مفعّل</SelectItem>
                    <SelectItem value="archived">مؤرشف</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <input type="checkbox" id="feat" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                <Label htmlFor="feat">مميز</Label>
              </div>
            </section>

            {/* Category-specific fields */}
            {dynamicFields.length > 0 && (
              <section className="grid gap-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4 md:grid-cols-2">
                <div className="md:col-span-2 text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  حقول القسم: {currentCategoryName}
                </div>
                {dynamicFields.map((f) => {
                  const v = form.features[f.key];
                  if (f.type === "boolean") {
                    return (
                      <div key={f.key} className="flex items-end gap-2">
                        <input type="checkbox" id={`f-${f.key}`} checked={Boolean(v)} onChange={(e) => setFeature(f.key, e.target.checked)} />
                        <Label htmlFor={`f-${f.key}`}>{f.label}</Label>
                      </div>
                    );
                  }
                  if (f.type === "select") {
                    return (
                      <div key={f.key}>
                        <Label>{f.label}</Label>
                        <Select value={String(v ?? "")} onValueChange={(val) => setFeature(f.key, val)}>
                          <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>{(f.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    );
                  }
                  if (f.type === "textarea") {
                    return (
                      <div key={f.key} className="md:col-span-2">
                        <Label>{f.label}</Label>
                        <Textarea value={String(v ?? "")} onChange={(e) => setFeature(f.key, e.target.value)} placeholder={f.placeholder} />
                      </div>
                    );
                  }
                  return (
                    <div key={f.key}>
                      <Label>{f.label}</Label>
                      <Input
                        type={f.type === "number" ? "number" : "text"}
                        value={String(v ?? "")}
                        onChange={(e) => setFeature(f.key, f.type === "number" ? Number(e.target.value) : e.target.value)}
                        placeholder={f.placeholder}
                      />
                    </div>
                  );
                })}
              </section>
            )}

            {/* Descriptions */}
            <section className="grid gap-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80">الوصف</div>
              <div><Label>الوصف (AR)</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} /></div>
              <div><Label>الوصف (EN)</Label><Textarea value={form.description_en} onChange={(e) => setForm({ ...form, description_en: e.target.value })} /></div>
              <div><Label>رابط الصورة</Label><Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." /></div>
            </section>

            <Button onClick={handleSave} className="w-full bg-cyan-500 text-background hover:bg-cyan-400">حفظ</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Products list */}
      <div className="rounded-xl border border-cyan-500/10 bg-card">
        <div className="flex items-center justify-between border-b border-cyan-500/10 p-3">
          <div className="text-sm font-semibold">جميع المنتجات ({(products ?? []).length})</div>
        </div>
        {(products ?? []).length === 0 && <div className="p-8 text-center text-muted-foreground">لا توجد منتجات بعد — اختر قسمًا أعلاه للبدء</div>}
        <div className="divide-y divide-cyan-500/10">
          {(products ?? []).map((p) => {
            const img = firstImage(p.images);
            const catName = (p as { categories?: { name_ar?: string } }).categories?.name_ar;
            return (
              <div key={p.id} className="flex items-center gap-3 p-3">
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-background/50">
                  {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Package className="h-5 w-5 text-cyan-500/30" /></div>}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{p.name_ar}</div>
                  <div className="text-xs text-muted-foreground">{catName ?? "—"} · {p.type} · {p.status} · مخزون: {p.stock}</div>
                </div>
                <div className="font-mono text-cyan-400">{formatPrice(Number(p.price), p.currency)}</div>
                <Button size="sm" variant="ghost" onClick={() => handleEdit(p)}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
