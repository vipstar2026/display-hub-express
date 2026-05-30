import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CreditCard, Smartphone, Apple, Wallet, Building2, Truck,
  Loader2, ShieldCheck, Plug, Save, KeyRound, AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPaymentsPage,
  head: () => ({ meta: [{ title: "بوابات الدفع | VIP STAR" }] }),
});

type GatewayId = "card" | "benefit" | "apple_pay" | "google_pay" | "bank_transfer" | "cod";
type Mode = "test" | "live";

type Gateway = {
  id: GatewayId;
  enabled: boolean;
  mode: Mode;
  provider?: string;        // e.g. "stripe", "tap", "benefit"
  public_key?: string;      // publishable key (safe in DB)
  webhook_url?: string;
  // bank transfer extras
  bank_name?: string;
  account_name?: string;
  iban?: string;
};

type GatewayMeta = {
  id: GatewayId;
  title: string;
  subtitle: string;
  icon: any;
  providers: string[];
  needsKeys: boolean;
  needsBank?: boolean;
};

const GATEWAYS: GatewayMeta[] = [
  { id: "card",          title: "بطاقات الائتمان",  subtitle: "Visa · Mastercard · Mada",                  icon: CreditCard, providers: ["stripe", "tap", "checkout.com", "paytabs"], needsKeys: true },
  { id: "benefit",       title: "BenefitPay",         subtitle: "بوابة بِنِفت البحرينية",                       icon: Smartphone, providers: ["benefit", "tap"], needsKeys: true },
  { id: "apple_pay",     title: "Apple Pay",          subtitle: "دفع سريع وآمن على أجهزة Apple",             icon: Apple,      providers: ["stripe", "tap"], needsKeys: true },
  { id: "google_pay",    title: "Google Pay",         subtitle: "ادفع ببطاقتك في Google Wallet",             icon: Wallet,     providers: ["stripe", "tap"], needsKeys: true },
  { id: "bank_transfer", title: "تحويل بنكي",          subtitle: "حوالة مباشرة إلى حساب المتجر",              icon: Building2,  providers: [], needsKeys: false, needsBank: true },
  { id: "cod",           title: "الدفع عند الاستلام", subtitle: "تحصيل نقدي عند توصيل الطلب للعميل",         icon: Truck,      providers: [], needsKeys: false },
];

const DEFAULTS: Record<GatewayId, Gateway> = {
  card:          { id: "card",          enabled: true,  mode: "test", provider: "stripe" },
  benefit:       { id: "benefit",       enabled: true,  mode: "test", provider: "benefit" },
  apple_pay:     { id: "apple_pay",     enabled: true,  mode: "test", provider: "stripe" },
  google_pay:    { id: "google_pay",    enabled: false, mode: "test", provider: "stripe" },
  bank_transfer: { id: "bank_transfer", enabled: true,  mode: "live", bank_name: "Bank of Bahrain & Kuwait (BBK)", account_name: "VIP STAR Trading", iban: "BH00 BBKU 0000 0000 0000 00" },
  cod:           { id: "cod",           enabled: true,  mode: "live" },
};

const SETTINGS_KEY = "payment_gateways";

function AdminPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gateways, setGateways] = useState<Record<GatewayId, Gateway>>(DEFAULTS);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", SETTINGS_KEY)
        .maybeSingle();
      if (data?.value) {
        const v = data.value as Partial<Record<GatewayId, Partial<Gateway>>>;
        const merged = { ...DEFAULTS };
        (Object.keys(DEFAULTS) as GatewayId[]).forEach((k) => {
          merged[k] = { ...DEFAULTS[k], ...(v[k] || {}) } as Gateway;
        });
        setGateways(merged);
      }
      setLoading(false);
    })();
  }, []);

  function update(id: GatewayId, patch: Partial<Gateway>) {
    setGateways((g) => ({ ...g, [id]: { ...g[id], ...patch } }));
  }

  async function save() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("site_settings")
        .upsert({ key: SETTINGS_KEY, value: gateways as any }, { onConflict: "key" });
      if (error) throw error;
      toast.success("تم حفظ إعدادات بوابات الدفع");
    } catch (e: any) {
      toast.error(e.message || "فشل الحفظ");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div dir="rtl" className="grid place-items-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  }

  const enabledCount = Object.values(gateways).filter((g) => g.enabled).length;

  return (
    <div dir="rtl" className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand" /> بوابات الدفع الإلكتروني
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            تحكم بطرق الدفع المتاحة للعملاء عند إتمام الشراء، وأضف مفاتيح الربط متى ما أردت تفعيل بوابة فعلية.
          </p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="h-11 px-5 rounded-xl bg-gradient-brand text-brand-foreground font-bold flex items-center gap-2 shadow-glow hover:opacity-90 transition-smooth disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          حفظ التغييرات
        </button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Stat icon={Plug}        label="بوابات مفعّلة"     value={`${enabledCount} / ${GATEWAYS.length}`} />
        <Stat icon={ShieldCheck} label="وضع الإنتاج"      value={Object.values(gateways).filter(g => g.mode === "live" && g.enabled).length.toString()} accent />
        <Stat icon={KeyRound}    label="بانتظار المفاتيح" value={Object.values(gateways).filter(g => g.enabled && GATEWAYS.find(m => m.id === g.id)?.needsKeys && !g.public_key).length.toString()} />
      </div>

      {/* Gateways list */}
      <div className="grid gap-4">
        {GATEWAYS.map((meta) => {
          const g = gateways[meta.id];
          const Icon = meta.icon;
          const needsKey = meta.needsKeys && g.enabled && !g.public_key;
          return (
            <section key={meta.id} className={`bg-card border rounded-2xl shadow-card transition-smooth ${g.enabled ? "border-brand/30" : "border-border opacity-90"}`}>
              <header className="p-5 flex items-start gap-4 border-b border-border">
                <div className={`w-12 h-12 rounded-xl grid place-items-center shrink-0 ${g.enabled ? "bg-gradient-brand text-brand-foreground shadow-glow" : "bg-secondary text-muted-foreground"}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-foreground">{meta.title}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${g.mode === "live" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {g.mode === "live" ? "إنتاج (Live)" : "تجريبي (Test)"}
                    </span>
                    {needsKey && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sale/15 text-sale font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> لم يتم الربط بعد
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{meta.subtitle}</p>
                </div>
                <Toggle checked={g.enabled} onChange={(v) => update(meta.id, { enabled: v })} />
              </header>

              {g.enabled && (
                <div className="p-5 grid sm:grid-cols-2 gap-4">
                  {/* Mode switch */}
                  <Field label="وضع التشغيل">
                    <div className="flex gap-2">
                      {(["test", "live"] as Mode[]).map((m) => (
                        <button
                          key={m}
                          onClick={() => update(meta.id, { mode: m })}
                          className={`flex-1 h-10 rounded-xl text-sm font-semibold border transition-smooth ${
                            g.mode === m
                              ? "bg-brand text-brand-foreground border-brand shadow-glow"
                              : "bg-background/40 text-foreground border-border hover:border-brand/40"
                          }`}
                        >
                          {m === "test" ? "تجريبي" : "إنتاج"}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {meta.providers.length > 0 && (
                    <Field label="مزود الخدمة">
                      <select
                        value={g.provider || ""}
                        onChange={(e) => update(meta.id, { provider: e.target.value })}
                        className="w-full h-10 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:border-brand"
                      >
                        {meta.providers.map((p) => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </Field>
                  )}

                  {meta.needsKeys && (
                    <>
                      <Field label="Publishable / Public Key" hint="مفتاح علني — يمكن تخزينه هنا">
                        <input
                          value={g.public_key || ""}
                          onChange={(e) => update(meta.id, { public_key: e.target.value })}
                          placeholder="pk_test_..."
                          dir="ltr"
                          className="w-full h-10 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:border-brand font-mono"
                        />
                      </Field>
                      <Field label="Webhook URL" hint="يُرسل من بوابة الدفع إلى متجرك">
                        <input
                          value={g.webhook_url || ""}
                          onChange={(e) => update(meta.id, { webhook_url: e.target.value })}
                          placeholder="https://your-site.com/api/public/payments/webhook"
                          dir="ltr"
                          className="w-full h-10 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:border-brand font-mono"
                        />
                      </Field>
                      <div className="sm:col-span-2 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-foreground flex gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                        <p>
                          المفتاح السري (Secret Key) لا يُخزَّن في قاعدة البيانات لأسباب أمنية — يُحفظ كـ <span className="font-mono">Secret</span> في إعدادات الخادم عند تفعيل الربط الفعلي.
                        </p>
                      </div>
                    </>
                  )}

                  {meta.needsBank && (
                    <>
                      <Field label="اسم البنك">
                        <input value={g.bank_name || ""} onChange={(e) => update(meta.id, { bank_name: e.target.value })}
                          className="w-full h-10 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:border-brand" />
                      </Field>
                      <Field label="اسم المستفيد">
                        <input value={g.account_name || ""} onChange={(e) => update(meta.id, { account_name: e.target.value })}
                          className="w-full h-10 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:border-brand" />
                      </Field>
                      <Field label="IBAN" className="sm:col-span-2">
                        <input value={g.iban || ""} onChange={(e) => update(meta.id, { iban: e.target.value })}
                          dir="ltr"
                          className="w-full h-10 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:border-brand font-mono" />
                      </Field>
                    </>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-card/60 p-5 text-sm text-muted-foreground">
        <div className="flex items-center gap-2 text-foreground font-semibold mb-2">
          <Plug className="w-4 h-4 text-brand" /> كيف يعمل الربط؟
        </div>
        <ul className="space-y-1 list-disc pr-5 text-xs leading-relaxed">
          <li>إيقاف أي بوابة يخفيها فوراً عن صفحة إتمام الشراء.</li>
          <li>الوضع التجريبي يسمح بمحاكاة الدفع دون تحصيل فعلي.</li>
          <li>عند ربط مفاتيح بوابة فعلية (Stripe / Tap / Benefit) يتم تحويل العميل تلقائياً لإتمام الدفع الآمن.</li>
          <li>يمكنك إضافة مفتاح Publishable هنا والمفتاح السري يُحفظ كسر مشفّر في إعدادات الخادم.</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-card flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${accent ? "bg-gradient-brand text-brand-foreground shadow-glow" : "bg-secondary text-brand"}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-lg font-bold text-foreground tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold text-foreground">{label}</label>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-7 rounded-full transition-smooth shrink-0 ${checked ? "bg-gradient-brand shadow-glow" : "bg-secondary border border-border"}`}
      aria-pressed={checked}
    >
      <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-card shadow transition-all ${checked ? "right-0.5" : "right-[22px]"}`} />
    </button>
  );
}
