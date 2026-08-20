import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Plus, Edit, Trash2, Landmark, Smartphone, Banknote, Wallet, CreditCard, Zap, KeyRound, BookOpen, ExternalLink, Link as LinkIcon, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { makeAdminT } from "@/lib/admin-i18n";
import { PAYMENT_PROVIDERS, providerByCode, type PaymentProvider } from "@/lib/payment-providers";
import { BASE } from "@/lib/site-url";

const siteOrigin = () => (typeof window !== "undefined" ? window.location.origin.replace(/^https?:\/\/(id-preview|localhost).*$/, BASE) : BASE);

export const Route = createFileRoute("/_authenticated/admin/payment-methods")({
  component: AdminPaymentMethods,
});

const TYPES = ["bank_transfer", "benefit", "stc_pay", "cash", "wallet", "card", "bnpl", "crypto", "other"] as const;
type PType = typeof TYPES[number];

const ICONS: Record<string, typeof Landmark> = { landmark: Landmark, smartphone: Smartphone, banknote: Banknote, wallet: Wallet, "credit-card": CreditCard };

interface Form {
  id?: string;
  provider: string;
  code: string; name_ar: string; name_en: string; name_ur: string; name_bn: string;
  type: PType; icon: string; logo_url: string;
  instructions_ar: string; instructions_en: string; instructions_ur: string; instructions_bn: string;
  values: Record<string, string>;
  is_gateway: boolean; gateway_provider: string; test_mode: boolean;
  config: string; supported_currencies: string;
  requires_proof: boolean; is_active: boolean;
  sort_order: string; fee_amount: string; fee_percent: string;
  min_amount: string; max_amount: string;
}

const empty: Form = {
  provider: "", code: "", name_ar: "", name_en: "", name_ur: "", name_bn: "",
  type: "bank_transfer", icon: "landmark", logo_url: "",
  instructions_ar: "", instructions_en: "", instructions_ur: "", instructions_bn: "",
  values: {}, is_gateway: false, gateway_provider: "",
  test_mode: false, config: "{}", supported_currencies: "BHD",
  requires_proof: true, is_active: true,
  sort_order: "0", fee_amount: "0", fee_percent: "0", min_amount: "0", max_amount: "",
};

function AdminPaymentMethods() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const t = makeAdminT(lang);
  const pickL = (row: any, base: string) => row?.[`${base}_${lang}`] || row?.[`${base}_en`] || row?.[`${base}_ar`] || "";
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const preset: PaymentProvider | undefined = providerByCode(form.provider);

  const { data } = useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: async () => (await supabase.rpc("admin_list_payment_methods")).data ?? [],
  });

  const applyProvider = (code: string) => {
    const p = providerByCode(code);
    if (!p) return;
    setForm((f) => ({
      ...f,
      provider: code,
      code: f.id ? f.code : code,
      name_ar: f.id ? f.name_ar : p.name_ar,
      name_en: f.id ? f.name_en : p.name_en,
      type: p.type as PType,
      icon: p.icon,
      is_gateway: p.kind === "gateway",
      gateway_provider: p.kind === "gateway" ? code : "",
      requires_proof: p.kind === "manual",
      supported_currencies: p.currencies.join(", "),
      values: Object.fromEntries(p.fields.map((fl) => [fl.key, f.values[fl.key] ?? ""])),
    }));
  };

  const setVal = (k: string, v: string) => setForm((f) => ({ ...f, values: { ...f.values, [k]: v } }));

  const save = async () => {
    if (!form.code.trim()) { toast.error(t("أدخل الرمز (Code)", "Enter a code")); return; }
    let cfg: Record<string, unknown>;
    try { cfg = JSON.parse(form.config || "{}"); }
    catch { toast.error(t("الإعدادات الإضافية يجب أن تكون JSON صحيح", "Extra config must be valid JSON")); return; }

    const missing = (preset?.fields ?? []).filter((fl) => fl.required && !(form.values[fl.key] ?? "").trim());
    if (missing.length && form.is_active) {
      toast.error((t("حقول مطلوبة ناقصة: ", "Missing required fields: ")) + missing.map((m) => (ar ? m.label_ar : m.label_en)).join("، "));
      return;
    }

    const filled = Object.fromEntries(Object.entries(form.values).filter(([, v]) => String(v ?? "").trim() !== ""));

    const payload = {
      code: form.code.trim(),
      name_ar: form.name_ar, name_en: form.name_en, name_ur: form.name_ur || null, name_bn: form.name_bn || null,
      type: form.type, icon: form.icon || null, logo_url: form.logo_url || null,
      instructions_ar: form.instructions_ar || null,
      instructions_en: form.instructions_en || null,
      instructions_ur: form.instructions_ur || null,
      instructions_bn: form.instructions_bn || null,
      account_details: (form.is_gateway ? {} : filled) as never,
      is_gateway: form.is_gateway,
      gateway_provider: form.is_gateway ? (form.gateway_provider || form.provider || null) : null,
      test_mode: false,
      credentials: (form.is_gateway ? filled : {}) as never,
      config: cfg as never,
      supported_currencies: form.supported_currencies.split(",").map((s) => s.trim()).filter(Boolean),
      requires_proof: form.is_gateway ? false : form.requires_proof,
      is_active: form.is_active,
      sort_order: Number(form.sort_order) || 0,
      fee_amount: Number(form.fee_amount) || 0,
      fee_percent: Number(form.fee_percent) || 0,
      min_amount: Number(form.min_amount) || 0,
      max_amount: form.max_amount ? Number(form.max_amount) : null,
    };

    const { error } = form.id
      ? await supabase.from("payment_methods").update(payload).eq("id", form.id)
      : await supabase.from("payment_methods").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(t("تم الحفظ", "Saved"));
    setOpen(false); setForm(empty);
    qc.invalidateQueries({ queryKey: ["admin-payment-methods"] });
  };

  const del = async (id: string) => {
    if (!confirm(t("حذف وسيلة الدفع؟", "Delete this payment method?"))) return;
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(t("تم الحذف", "Deleted")); qc.invalidateQueries({ queryKey: ["admin-payment-methods"] }); }
  };

  const toggle = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("payment_methods").update({ is_active }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-payment-methods"] });
  };

  const hasVals = (o: Record<string, unknown> | null | undefined) =>
    o ? Object.values(o).some((v) => typeof v === "string" && v.trim() !== "") : false;

  const manualProviders = PAYMENT_PROVIDERS.filter((p) => p.kind === "manual");
  const gatewayProviders = PAYMENT_PROVIDERS.filter((p) => p.kind === "gateway");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold">{t("طرق الدفع", "Payment Methods")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("كل طرق الدفع المتاحة 2026 — اختر النوع واملأ البيانات يدوياً مع شرح التركيب.", "All 2026 payment options — pick a type, fill the data manually, with setup guides.")}
          </p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-background hover:bg-primary"><Plus className="me-1 h-4 w-4" />{t("وسيلة جديدة", "New Method")}</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{form.id ? (t("تعديل وسيلة الدفع", "Edit payment method")) : (t("إضافة وسيلة دفع", "Add payment method"))}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Provider picker */}
              <div>
                <Label>{t("نوع وسيلة الدفع", "Payment provider")}</Label>
                <Select value={form.provider} onValueChange={applyProvider}>
                  <SelectTrigger><SelectValue placeholder={t("اختر من القائمة", "Select from list")} /></SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">{t("يدوي / بدون API", "Manual / no API")}</div>
                    {manualProviders.map((p) => <SelectItem key={p.code} value={p.code}>{ar ? p.name_ar : p.name_en}</SelectItem>)}
                    <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground">{t("بوابات إلكترونية", "Electronic gateways")}</div>
                    {gatewayProviders.map((p) => <SelectItem key={p.code} value={p.code}>{ar ? p.name_ar : p.name_en}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Setup guide */}
              {preset && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-primary">
                    <BookOpen className="h-4 w-4" />
                    {t("طريقة التركيب خطوة بخطوة", "Step-by-step setup")}
                    {preset.docs && (
                      <a href={preset.docs} target="_blank" rel="noreferrer" className="ms-auto inline-flex items-center gap-1 text-xs underline">
                        {t("الوثائق", "Docs")} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <ol className="list-decimal space-y-1 ps-5 text-xs text-muted-foreground">
                    {(ar ? preset.steps_ar : preset.steps_en).map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}

              {/* Manual credential fields */}
              {preset && (
                <div className="rounded-lg border border-primary/20 bg-background/40 p-3">
                  <div className="mb-3 flex items-center gap-2">
                    {preset.kind === "gateway" ? <KeyRound className="h-4 w-4 text-primary" /> : <Landmark className="h-4 w-4 text-primary" />}
                    <Label className="text-base font-semibold">
                      {preset.kind === "gateway" ? (t("بيانات الاتصال بالبوابة", "Gateway credentials")) : (t("بيانات الحساب", "Account details"))}
                    </Label>
                    {preset.kind === "gateway" && (
                      <span className="ms-auto text-xs font-medium text-muted-foreground">{t("وضع الإنتاج (LIVE) فقط", "LIVE mode only")}</span>
                    )}
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {preset.fields.map((fl) => (
                      <div key={fl.key} className={fl.kind === "url" ? "md:col-span-2" : ""}>
                        <Label className="text-xs">
                          {ar ? fl.label_ar : fl.label_en}{fl.required && <span className="text-destructive"> *</span>}
                        </Label>
                        {fl.kind === "select" ? (
                          <Select value={form.values[fl.key] ?? ""} onValueChange={(v) => setVal(fl.key, v)}>
                            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                            <SelectContent>{(fl.options ?? []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                          </Select>
                        ) : (
                          <Input
                            type={fl.kind === "password" ? "password" : "text"}
                            value={form.values[fl.key] ?? ""}
                            placeholder={fl.placeholder}
                            onChange={(e) => setVal(fl.key, e.target.value)}
                          />
                        )}
                        {(ar ? fl.hint_ar : fl.hint_en) && (
                          <p className="mt-1 text-[11px] text-muted-foreground">{ar ? fl.hint_ar : fl.hint_en}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Integration endpoints (read-only, copyable) */}
              {preset?.endpoints?.length ? (
                <div className="rounded-lg border border-primary/20 bg-background/40 p-3">
                  <div className="mb-3 flex items-center gap-2">
                    <LinkIcon className="h-4 w-4 text-primary" />
                    <Label className="text-base font-semibold">{t("روابط التكامل (سجّلها لدى المزوّد)", "Integration URLs (register with provider)")}</Label>
                  </div>
                  <div className="space-y-3">
                    {preset.endpoints.map((ep) => {
                      const url = `${siteOrigin()}${ep.path}`;
                      return (
                        <div key={ep.path}>
                          <Label className="text-xs">{ar ? ep.label_ar : ep.label_en}</Label>
                          <div className="flex gap-2">
                            <Input readOnly dir="ltr" value={url} onFocus={(e) => e.currentTarget.select()} className="font-mono text-xs" />
                            <Button type="button" variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(url); toast.success(t("تم النسخ", "Copied")); }}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                          {(ar ? ep.hint_ar : ep.hint_en) && (
                            <p className="mt-1 text-[11px] text-muted-foreground">{ar ? ep.hint_ar : ep.hint_en}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Basics */}
              <Accordion type="single" collapsible defaultValue="basics">
                <AccordionItem value="basics">
                  <AccordionTrigger className="text-sm">{t("الأسماء والعرض", "Naming & display")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div><Label>{t("الرمز (Code)", "Code")}</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="bank_nbb" /></div>
                      <div>
                        <Label>{t("التصنيف", "Type")}</Label>
                        <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as PType })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div><Label>{t("الاسم (عربي)", "Name (AR)")}</Label><Input dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
                      <div><Label>{t("الاسم (إنجليزي)", "Name (EN)")}</Label><Input dir="ltr" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
                      <div><Label>{t("الاسم (أردو)", "Name (UR)")}</Label><Input dir="rtl" value={form.name_ur} onChange={(e) => setForm({ ...form, name_ur: e.target.value })} /></div>
                      <div><Label>{t("الاسم (بنغالي)", "Name (BN)")}</Label><Input dir="ltr" value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} /></div>
                      <div>
                        <Label>{t("الأيقونة", "Icon")}</Label>
                        <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>{Object.keys(ICONS).map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-2"><Label>{t("رابط الشعار", "Logo URL")}</Label><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></div>
                      <div className="md:col-span-2"><Label>{t("العملات المدعومة", "Supported currencies")}</Label><Input value={form.supported_currencies} onChange={(e) => setForm({ ...form, supported_currencies: e.target.value })} placeholder="BHD, USD, SAR" /></div>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="instructions">
                  <AccordionTrigger className="text-sm">{t("تعليمات تظهر للعميل", "Customer instructions")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3">
                      <div><Label>{t("التعليمات (عربي)", "Instructions (AR)")}</Label><Textarea dir="rtl" value={form.instructions_ar} onChange={(e) => setForm({ ...form, instructions_ar: e.target.value })} /></div>
                      <div><Label>{t("التعليمات (إنجليزي)", "Instructions (EN)")}</Label><Textarea dir="ltr" value={form.instructions_en} onChange={(e) => setForm({ ...form, instructions_en: e.target.value })} /></div>
                      <div><Label>{t("التعليمات (أردو)", "Instructions (UR)")}</Label><Textarea dir="rtl" value={form.instructions_ur} onChange={(e) => setForm({ ...form, instructions_ur: e.target.value })} /></div>
                      <div><Label>{t("التعليمات (بنغالي)", "Instructions (BN)")}</Label><Textarea dir="ltr" value={form.instructions_bn} onChange={(e) => setForm({ ...form, instructions_bn: e.target.value })} /></div>
                      {!form.is_gateway && (
                        <div className="flex items-center gap-2">
                          <Switch checked={form.requires_proof} onCheckedChange={(v) => setForm({ ...form, requires_proof: v })} />
                          <Label>{t("يتطلب إثبات دفع", "Requires payment proof")}</Label>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="limits">
                  <AccordionTrigger className="text-sm">{t("الرسوم والحدود", "Fees & limits")}</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div><Label>{t("الترتيب", "Sort order")}</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
                      <div><Label>{t("رسوم ثابتة (BHD)", "Fee (BHD)")}</Label><Input type="number" step="0.001" value={form.fee_amount} onChange={(e) => setForm({ ...form, fee_amount: e.target.value })} /></div>
                      <div><Label>{t("رسوم نسبة (%)", "Fee (%)")}</Label><Input type="number" step="0.01" value={form.fee_percent} onChange={(e) => setForm({ ...form, fee_percent: e.target.value })} /></div>
                      <div><Label>{t("أقل مبلغ", "Min amount")}</Label><Input type="number" step="0.001" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} /></div>
                      <div><Label>{t("أعلى مبلغ", "Max amount")}</Label><Input type="number" step="0.001" value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: e.target.value })} /></div>
                      <div className="md:col-span-2"><Label>{t("إعدادات إضافية (JSON)", "Extra config (JSON)")}</Label><Textarea rows={3} className="font-mono text-xs" value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} placeholder='{"success_url":"","cancel_url":""}' /></div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex items-center gap-2">
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
                <Label>{t("مفعّلة (تظهر في صفحة الدفع)", "Active (visible at checkout)")}</Label>
              </div>
            </div>

            <Button onClick={save} className="mt-3 w-full bg-primary text-background hover:bg-primary">{t("حفظ", "Save")}</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((m) => {
          const Icon = ICONS[m.icon ?? ""] ?? CreditCard;
          const mx = m as typeof m & { is_gateway?: boolean; gateway_provider?: string; test_mode?: boolean; credentials?: Record<string, unknown>; config?: Record<string, unknown>; supported_currencies?: string[]; logo_url?: string };
          const isGw = !!mx.is_gateway;
          const ready = isGw ? hasVals(mx.credentials) : hasVals(m.account_details as Record<string, unknown>);
          return (
            <div key={m.id} className={`rounded-xl border p-4 transition-colors ${m.is_active ? "border-primary/20 bg-card" : "border-muted/20 bg-card/50 opacity-70"}`}>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  {mx.logo_url ? <img src={mx.logo_url} alt="" className="h-6 w-6 object-contain" /> : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{pickL(m, "name") || m.name_en}</span>
                    <span className="text-muted-foreground">· {m.name_en || m.name_ar}</span>
                    {isGw
                      ? <Badge variant="outline" className="border-primary/40 text-primary text-[10px]"><Zap className="me-0.5 h-3 w-3" />{t("بوابة", "Gateway")}</Badge>
                      : <Badge variant="outline" className="text-[10px]">{t("يدوي", "Manual")}</Badge>}
                    
                    {!ready && <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">{t("البيانات ناقصة", "Data missing")}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.type} · <code>{m.code}</code>{isGw && mx.gateway_provider ? ` · ${mx.gateway_provider}` : ""}</div>
                </div>
                <Switch checked={!!m.is_active} onCheckedChange={(v) => toggle(m.id, v)} />
              </div>
              {!isGw && pickL(m, "instructions") && (
                <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{pickL(m, "instructions")}</p>
              )}
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => {
                  const guess = mx.gateway_provider || PAYMENT_PROVIDERS.find((p) => p.code === m.code)?.code || "";
                  const p = providerByCode(guess);
                  const stored = (isGw ? mx.credentials : (m.account_details as Record<string, unknown>)) ?? {};
                  const values: Record<string, string> = {};
                  (p?.fields ?? []).forEach((fl) => { values[fl.key] = String(stored[fl.key] ?? ""); });
                  Object.entries(stored).forEach(([k, v]) => { if (values[k] === undefined) values[k] = String(v ?? ""); });
                  setForm({
                    id: m.id, provider: p?.code ?? "", code: m.code,
                    name_ar: m.name_ar, name_en: m.name_en, name_ur: m.name_ur ?? "", name_bn: (m as any).name_bn ?? "",
                    type: m.type as PType, icon: m.icon ?? "landmark", logo_url: mx.logo_url ?? "",
                    instructions_ar: m.instructions_ar ?? "", instructions_en: m.instructions_en ?? "", instructions_ur: m.instructions_ur ?? "", instructions_bn: (m as any).instructions_bn ?? "",
                    values,
                    is_gateway: isGw, gateway_provider: mx.gateway_provider ?? "",
                    test_mode: false,
                    config: JSON.stringify(mx.config ?? {}, null, 2),
                    supported_currencies: (mx.supported_currencies ?? ["BHD"]).join(", "),
                    requires_proof: !!m.requires_proof, is_active: !!m.is_active,
                    sort_order: String(m.sort_order), fee_amount: String(m.fee_amount),
                    fee_percent: String(m.fee_percent), min_amount: String(m.min_amount),
                    max_amount: m.max_amount != null ? String(m.max_amount) : "",
                  });
                  setOpen(true);
                }}><Edit className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => del(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </div>
          );
        })}
        {(data ?? []).length === 0 && (
          <div className="col-span-full rounded-xl border border-primary/10 bg-card p-8 text-center text-muted-foreground">
            {t("لا توجد طرق دفع بعد.", "No payment methods yet.")}
          </div>
        )}
      </div>
    </div>
  );
}
