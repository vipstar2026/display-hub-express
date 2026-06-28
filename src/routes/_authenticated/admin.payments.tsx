import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  CreditCard, Smartphone, Apple, Wallet, Building2, Truck,
  Loader2, ShieldCheck, Plug, Save, KeyRound, AlertTriangle,
} from "lucide-react";
import { useAdminI18n } from "@/lib/i18n-admin";

export const Route = createFileRoute("/_authenticated/admin/payments")({
  component: AdminPaymentsPage,
  head: () => ({ meta: [{ title: "Payment Gateways | VIP STAR" }] }),
});

type GatewayId = "card" | "benefit" | "apple_pay" | "google_pay" | "bank_transfer" | "cod";
type Mode = "test" | "live";

type Gateway = {
  id: GatewayId;
  enabled: boolean;
  mode: Mode;
  provider?: string;
  public_key?: string;
  webhook_url?: string;
  bank_name?: string;
  account_name?: string;
  iban?: string;
};

type GatewayMeta = {
  id: GatewayId;
  titleKey: "payG_card" | "payG_benefit" | "payG_apple" | "payG_google" | "payG_bank" | "payG_cod";
  subKey: "payG_cardSub" | "payG_benefitSub" | "payG_appleSub" | "payG_googleSub" | "payG_bankSub" | "payG_codSub";
  icon: any;
  providers: string[];
  needsKeys: boolean;
  needsBank?: boolean;
};

const GATEWAYS: GatewayMeta[] = [
  { id: "card",          titleKey: "payG_card",    subKey: "payG_cardSub",    icon: CreditCard, providers: ["stripe", "tap", "checkout.com", "paytabs"], needsKeys: true },
  { id: "benefit",       titleKey: "payG_benefit", subKey: "payG_benefitSub", icon: Smartphone, providers: ["benefit", "tap"], needsKeys: true },
  { id: "apple_pay",     titleKey: "payG_apple",   subKey: "payG_appleSub",   icon: Apple,      providers: ["stripe", "tap"], needsKeys: true },
  { id: "google_pay",    titleKey: "payG_google",  subKey: "payG_googleSub",  icon: Wallet,     providers: ["stripe", "tap"], needsKeys: true },
  { id: "bank_transfer", titleKey: "payG_bank",    subKey: "payG_bankSub",    icon: Building2,  providers: [], needsKeys: false, needsBank: true },
  { id: "cod",           titleKey: "payG_cod",     subKey: "payG_codSub",     icon: Truck,      providers: [], needsKeys: false },
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
  const { L, dir } = useAdminI18n();
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
      toast.success(L.paySaved);
    } catch (e: any) {
      toast.error(e.message || L.paySaveFail);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="grid place-items-center py-24"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  }

  const enabledCount = Object.values(gateways).filter((g) => g.enabled).length;
  const listPad = dir === "rtl" ? "pr-5" : "pl-5";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand" /> {L.payTitle}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">{L.paySub}</p>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="h-11 px-5 rounded-xl bg-gradient-brand text-brand-foreground font-bold flex items-center gap-2 shadow-glow hover:opacity-90 transition-smooth disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {L.saveChanges}
        </button>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Stat icon={Plug}        label={L.payEnabled}    value={`${enabledCount} / ${GATEWAYS.length}`} />
        <Stat icon={ShieldCheck} label={L.payLiveCount}  value={Object.values(gateways).filter(g => g.mode === "live" && g.enabled).length.toString()} accent />
        <Stat icon={KeyRound}    label={L.payNeedKeys}   value={Object.values(gateways).filter(g => g.enabled && GATEWAYS.find(m => m.id === g.id)?.needsKeys && !g.public_key).length.toString()} />
      </div>

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
                    <h3 className="font-bold text-foreground">{L[meta.titleKey]}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${g.mode === "live" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {g.mode === "live" ? L.payModeLive : L.payModeTest}
                    </span>
                    {needsKey && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sale/15 text-sale font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {L.payNotLinked}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{L[meta.subKey]}</p>
                </div>
                <Toggle checked={g.enabled} onChange={(v) => update(meta.id, { enabled: v })} />
              </header>

              {g.enabled && (
                <div className="p-5 grid sm:grid-cols-2 gap-4">
                  <Field label={L.payMode}>
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
                          {m === "test" ? L.payModeTest : L.payModeLive}
                        </button>
                      ))}
                    </div>
                  </Field>

                  {meta.providers.length > 0 && (
                    <Field label={L.payProvider}>
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
                      <Field label={L.payPubKey} hint={L.payPubKeyHint}>
                        <input
                          value={g.public_key || ""}
                          onChange={(e) => update(meta.id, { public_key: e.target.value })}
                          placeholder="pk_test_..."
                          dir="ltr"
                          className="w-full h-10 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:border-brand font-mono"
                        />
                      </Field>
                      <Field label={L.payWebhook} hint={L.payWebhookHint}>
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
                        <p>{L.paySecretNote}</p>
                      </div>
                    </>
                  )}

                  {meta.needsBank && (
                    <>
                      <Field label={L.payBank}>
                        <input value={g.bank_name || ""} onChange={(e) => update(meta.id, { bank_name: e.target.value })}
                          className="w-full h-10 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:border-brand" />
                      </Field>
                      <Field label={L.payAccountName}>
                        <input value={g.account_name || ""} onChange={(e) => update(meta.id, { account_name: e.target.value })}
                          className="w-full h-10 rounded-xl border border-border bg-background/60 px-3 text-sm text-foreground outline-none focus:border-brand" />
                      </Field>
                      <Field label={L.payIban} className="sm:col-span-2">
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
          <Plug className="w-4 h-4 text-brand" /> {L.payHowTitle}
        </div>
        <ul className={`space-y-1 list-disc ${listPad} text-xs leading-relaxed`}>
          <li>{L.payHow1}</li>
          <li>{L.payHow2}</li>
          <li>{L.payHow3}</li>
          <li>{L.payHow4}</li>
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
