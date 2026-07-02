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
import { Plus, Edit, Trash2, Landmark, Smartphone, Banknote, Wallet, CreditCard, Zap, KeyRound } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/payment-methods")({
  component: AdminPaymentMethods,
});

const TYPES = ["bank_transfer", "benefit", "stc_pay", "cash", "wallet", "card", "bnpl", "crypto", "other"] as const;
type PType = typeof TYPES[number];

const GATEWAYS = [
  "stripe", "paypal", "apple_pay", "google_pay", "tap", "benefit",
  "myfatoorah", "paytabs", "checkout", "hyperpay", "telr", "amazon_pay",
  "razorpay", "coinbase", "tabby", "tamara", "custom",
] as const;

// Suggested credential field names per provider — shown as JSON template
const GATEWAY_CREDS: Record<string, Record<string, string>> = {
  stripe: { publishable_key: "", secret_key: "", webhook_secret: "" },
  paypal: { client_id: "", client_secret: "", webhook_id: "" },
  apple_pay: { merchant_id: "", certificate: "" },
  google_pay: { merchant_id: "", gateway_merchant_id: "" },
  tap: { public_key: "", secret_key: "", webhook_secret: "" },
  benefit: { terminal_id: "", password: "", secret_key: "" },
  myfatoorah: { api_key: "", vendor_code: "" },
  paytabs: { profile_id: "", server_key: "", region: "GLOBAL" },
  checkout: { public_key: "", secret_key: "", processing_channel_id: "" },
  hyperpay: { entity_id: "", access_token: "" },
  telr: { store_id: "", auth_key: "" },
  amazon_pay: { merchant_id: "", public_key_id: "", private_key: "" },
  razorpay: { key_id: "", key_secret: "" },
  coinbase: { api_key: "", webhook_secret: "" },
  tabby: { public_key: "", secret_key: "", merchant_code: "" },
  tamara: { api_token: "", notification_token: "" },
  custom: { api_key: "" },
};

const ICONS: Record<string, typeof Landmark> = { landmark: Landmark, smartphone: Smartphone, banknote: Banknote, wallet: Wallet, "credit-card": CreditCard };

interface Form {
  id?: string;
  code: string; name_ar: string; name_en: string; name_ur: string;
  type: PType; icon: string; logo_url: string;
  instructions_ar: string; instructions_en: string; instructions_ur: string;
  account_details: string;
  is_gateway: boolean; gateway_provider: string; test_mode: boolean;
  credentials: string; config: string; supported_currencies: string;
  requires_proof: boolean; is_active: boolean;
  sort_order: string; fee_amount: string; fee_percent: string;
  min_amount: string; max_amount: string;
}
const empty: Form = {
  code: "", name_ar: "", name_en: "", name_ur: "",
  type: "bank_transfer", icon: "landmark", logo_url: "",
  instructions_ar: "", instructions_en: "", instructions_ur: "",
  account_details: "{}", is_gateway: false, gateway_provider: "",
  test_mode: true, credentials: "{}", config: "{}", supported_currencies: "BHD",
  requires_proof: true, is_active: true,
  sort_order: "0", fee_amount: "0", fee_percent: "0", min_amount: "0", max_amount: "",
};

function AdminPaymentMethods() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const { data } = useQuery({
    queryKey: ["admin-payment-methods"],
    queryFn: async () => (await supabase.from("payment_methods").select("*").order("sort_order")).data ?? [],
  });

  const save = async () => {
    const parseJson = (raw: string, label: string) => {
      try { return JSON.parse(raw || "{}"); }
      catch { toast.error(`${label} must be valid JSON`); throw new Error("bad json"); }
    };
    let account, creds, cfg;
    try {
      account = parseJson(form.account_details, "Account details");
      creds = parseJson(form.credentials, "Credentials");
      cfg = parseJson(form.config, "Config");
    } catch { return; }

    const payload = {
      code: form.code.trim(),
      name_ar: form.name_ar, name_en: form.name_en, name_ur: form.name_ur || null,
      type: form.type, icon: form.icon || null, logo_url: form.logo_url || null,
      instructions_ar: form.instructions_ar || null,
      instructions_en: form.instructions_en || null,
      instructions_ur: form.instructions_ur || null,
      account_details: account as never,
      is_gateway: form.is_gateway,
      gateway_provider: form.is_gateway ? (form.gateway_provider || null) : null,
      test_mode: form.test_mode,
      credentials: creds as never,
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
    toast.success("Saved");
    setOpen(false); setForm(empty);
    qc.invalidateQueries({ queryKey: ["admin-payment-methods"] });
  };

  const del = async (id: string) => {
    if (!confirm("Delete this payment method?")) return;
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin-payment-methods"] }); }
  };

  const toggle = async (id: string, is_active: boolean) => {
    const { error } = await supabase.from("payment_methods").update({ is_active }).eq("id", id);
    if (error) toast.error(error.message);
    else qc.invalidateQueries({ queryKey: ["admin-payment-methods"] });
  };

  const applyGatewayTemplate = (provider: string) => {
    const tpl = GATEWAY_CREDS[provider] ?? { api_key: "" };
    setForm((f) => ({ ...f, gateway_provider: provider, credentials: JSON.stringify(tpl, null, 2) }));
  };

  const hasCreds = (creds: Record<string, unknown> | null | undefined) =>
    creds ? Object.values(creds).some((v) => typeof v === "string" && v.trim() !== "") : false;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Payment Methods · طرق الدفع</h1>
          <p className="text-sm text-muted-foreground">Manage manual + electronic gateway payment options.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 text-background hover:bg-cyan-400"><Plus className="me-1 h-4 w-4" />New Method</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} Payment Method</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="bank_nbb / stripe" /></div>
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as PType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Name (AR)</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
              <div><Label>Name (EN)</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
              <div><Label>Name (UR)</Label><Input value={form.name_ur} onChange={(e) => setForm({ ...form, name_ur: e.target.value })} /></div>
              <div><Label>Icon</Label>
                <Select value={form.icon} onValueChange={(v) => setForm({ ...form, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.keys(ICONS).map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2"><Label>Logo URL (optional)</Label><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="https://..." /></div>

              {/* Gateway section */}
              <div className="md:col-span-2 rounded-lg border border-cyan-500/20 bg-background/40 p-3 space-y-3">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-cyan-400" />
                  <Label className="text-base font-semibold">Electronic Gateway</Label>
                  <div className="ms-auto flex items-center gap-2">
                    <Switch checked={form.is_gateway} onCheckedChange={(v) => setForm({ ...form, is_gateway: v, requires_proof: v ? false : form.requires_proof })} />
                    <span className="text-xs text-muted-foreground">{form.is_gateway ? "Gateway" : "Manual"}</span>
                  </div>
                </div>
                {form.is_gateway && (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label>Provider</Label>
                        <Select value={form.gateway_provider} onValueChange={applyGatewayTemplate}>
                          <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                          <SelectContent>{GATEWAYS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end gap-2">
                        <Switch checked={form.test_mode} onCheckedChange={(v) => setForm({ ...form, test_mode: v })} />
                        <Label>Test mode (sandbox)</Label>
                      </div>
                    </div>
                    <div>
                      <Label className="flex items-center gap-1"><KeyRound className="h-3 w-3" /> Credentials (JSON)</Label>
                      <Textarea rows={6} className="font-mono text-xs" value={form.credentials} onChange={(e) => setForm({ ...form, credentials: e.target.value })} />
                      <p className="mt-1 text-[11px] text-muted-foreground">Fill each key when you get your API keys from the provider. Leave empty until then — the method stays inactive until keys are added.</p>
                    </div>
                    <div>
                      <Label>Extra Config (JSON)</Label>
                      <Textarea rows={3} className="font-mono text-xs" value={form.config} onChange={(e) => setForm({ ...form, config: e.target.value })} placeholder='{"success_url":"","cancel_url":""}' />
                    </div>
                    <div>
                      <Label>Supported Currencies (comma-separated)</Label>
                      <Input value={form.supported_currencies} onChange={(e) => setForm({ ...form, supported_currencies: e.target.value })} placeholder="BHD, USD, SAR" />
                    </div>
                  </>
                )}
              </div>

              {!form.is_gateway && (
                <>
                  <div className="md:col-span-2"><Label>Instructions (AR)</Label><Textarea value={form.instructions_ar} onChange={(e) => setForm({ ...form, instructions_ar: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label>Instructions (EN)</Label><Textarea value={form.instructions_en} onChange={(e) => setForm({ ...form, instructions_en: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label>Instructions (UR)</Label><Textarea value={form.instructions_ur} onChange={(e) => setForm({ ...form, instructions_ur: e.target.value })} /></div>
                  <div className="md:col-span-2">
                    <Label>Account Details (JSON)</Label>
                    <Textarea rows={4} className="font-mono text-xs" value={form.account_details} onChange={(e) => setForm({ ...form, account_details: e.target.value })}
                      placeholder='{"iban":"BH00...","account_name":"VIPSTAR","phone":"+973..."}' />
                  </div>
                  <div className="flex items-center gap-2"><Switch checked={form.requires_proof} onCheckedChange={(v) => setForm({ ...form, requires_proof: v })} /><Label>Requires payment proof</Label></div>
                </>
              )}

              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              <div><Label>Fee (BHD)</Label><Input type="number" step="0.001" value={form.fee_amount} onChange={(e) => setForm({ ...form, fee_amount: e.target.value })} /></div>
              <div><Label>Fee (%)</Label><Input type="number" step="0.01" value={form.fee_percent} onChange={(e) => setForm({ ...form, fee_percent: e.target.value })} /></div>
              <div><Label>Min amount</Label><Input type="number" step="0.001" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} /></div>
              <div><Label>Max amount</Label><Input type="number" step="0.001" value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: e.target.value })} /></div>
              <div className="flex items-center gap-2 md:col-span-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active (visible at checkout)</Label></div>
            </div>
            <Button onClick={save} className="mt-3 w-full bg-cyan-500 text-background hover:bg-cyan-400">Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((m) => {
          const Icon = ICONS[m.icon ?? ""] ?? CreditCard;
          const isGw = !!(m as { is_gateway?: boolean }).is_gateway;
          const creds = (m as { credentials?: Record<string, unknown> }).credentials;
          const ready = !isGw || hasCreds(creds);
          return (
            <div key={m.id} className={`rounded-xl border p-4 transition-colors ${m.is_active ? "border-cyan-500/20 bg-card" : "border-muted/20 bg-card/50 opacity-70"}`}>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-500/10 text-cyan-400">
                  {(m as { logo_url?: string }).logo_url
                    ? <img src={(m as { logo_url?: string }).logo_url} alt="" className="h-6 w-6 object-contain" />
                    : <Icon className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{m.name_en}</span>
                    <span className="text-muted-foreground">· {m.name_ar}</span>
                    {isGw && <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 text-[10px]"><Zap className="me-0.5 h-3 w-3" />Gateway</Badge>}
                    {isGw && (m as { test_mode?: boolean }).test_mode && <Badge variant="outline" className="text-[10px]">TEST</Badge>}
                    {isGw && !ready && <Badge variant="outline" className="border-amber-500/40 text-amber-400 text-[10px]">Needs API keys</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">{m.type} · <code>{m.code}</code>{isGw && (m as { gateway_provider?: string }).gateway_provider ? ` · ${(m as { gateway_provider?: string }).gateway_provider}` : ""}</div>
                </div>
                <Switch checked={!!m.is_active} onCheckedChange={(v) => toggle(m.id, v)} />
              </div>
              {!isGw && m.instructions_en && <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{m.instructions_en}</p>}
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => {
                  const mx = m as typeof m & { is_gateway?: boolean; gateway_provider?: string; test_mode?: boolean; credentials?: Record<string, unknown>; config?: Record<string, unknown>; supported_currencies?: string[]; logo_url?: string };
                  setForm({
                    id: m.id, code: m.code, name_ar: m.name_ar, name_en: m.name_en, name_ur: m.name_ur ?? "",
                    type: m.type as PType, icon: m.icon ?? "landmark", logo_url: mx.logo_url ?? "",
                    instructions_ar: m.instructions_ar ?? "", instructions_en: m.instructions_en ?? "", instructions_ur: m.instructions_ur ?? "",
                    account_details: JSON.stringify(m.account_details ?? {}, null, 2),
                    is_gateway: !!mx.is_gateway, gateway_provider: mx.gateway_provider ?? "",
                    test_mode: mx.test_mode ?? true,
                    credentials: JSON.stringify(mx.credentials ?? {}, null, 2),
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
          <div className="col-span-full rounded-xl border border-cyan-500/10 bg-card p-8 text-center text-muted-foreground">
            No payment methods yet.
          </div>
        )}
      </div>
    </div>
  );
}
