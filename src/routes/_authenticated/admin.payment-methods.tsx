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
import { Plus, Edit, Trash2, Landmark, Smartphone, Banknote, Wallet, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/payment-methods")({
  component: AdminPaymentMethods,
});

const TYPES = ["bank_transfer", "benefit", "stc_pay", "cash", "wallet", "other"] as const;
type PType = typeof TYPES[number];

const ICONS: Record<string, typeof Landmark> = { landmark: Landmark, smartphone: Smartphone, banknote: Banknote, wallet: Wallet, "credit-card": CreditCard };

interface Form {
  id?: string;
  code: string; name_ar: string; name_en: string; name_ur: string;
  type: PType; icon: string;
  instructions_ar: string; instructions_en: string; instructions_ur: string;
  account_details: string; // JSON as text
  requires_proof: boolean; is_active: boolean;
  sort_order: string; fee_amount: string; fee_percent: string;
  min_amount: string; max_amount: string;
}
const empty: Form = {
  code: "", name_ar: "", name_en: "", name_ur: "",
  type: "bank_transfer", icon: "landmark",
  instructions_ar: "", instructions_en: "", instructions_ur: "",
  account_details: "{}", requires_proof: true, is_active: true,
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
    let account: Record<string, unknown> = {};
    try { account = JSON.parse(form.account_details || "{}"); }
    catch { toast.error("Account details must be valid JSON"); return; }

    const payload = {
      code: form.code.trim(),
      name_ar: form.name_ar, name_en: form.name_en, name_ur: form.name_ur || null,
      type: form.type, icon: form.icon || null,
      instructions_ar: form.instructions_ar || null,
      instructions_en: form.instructions_en || null,
      instructions_ur: form.instructions_ur || null,
      account_details: account,
      requires_proof: form.requires_proof, is_active: form.is_active,
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Payment Methods · طرق الدفع</h1>
          <p className="text-sm text-muted-foreground">Manage manual payment options shown to customers at checkout.</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild>
            <Button className="bg-cyan-500 text-background hover:bg-cyan-400"><Plus className="me-1 h-4 w-4" />New Method</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader><DialogTitle>{form.id ? "Edit" : "New"} Payment Method</DialogTitle></DialogHeader>
            <div className="grid gap-3 md:grid-cols-2">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="bank_nbb" /></div>
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
              <div className="md:col-span-2"><Label>Instructions (AR)</Label><Textarea value={form.instructions_ar} onChange={(e) => setForm({ ...form, instructions_ar: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Instructions (EN)</Label><Textarea value={form.instructions_en} onChange={(e) => setForm({ ...form, instructions_en: e.target.value })} /></div>
              <div className="md:col-span-2"><Label>Instructions (UR)</Label><Textarea value={form.instructions_ur} onChange={(e) => setForm({ ...form, instructions_ur: e.target.value })} /></div>
              <div className="md:col-span-2">
                <Label>Account Details (JSON)</Label>
                <Textarea rows={5} className="font-mono text-xs" value={form.account_details} onChange={(e) => setForm({ ...form, account_details: e.target.value })}
                  placeholder='{"iban":"BH00...","account_name":"VIPSTAR","phone":"+973..."}' />
                <p className="mt-1 text-xs text-muted-foreground">Any keys you add here (iban, phone, bank, swift, account_number, ...) will be shown to customers.</p>
              </div>
              <div><Label>Sort Order</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              <div><Label>Fee (BHD)</Label><Input type="number" step="0.001" value={form.fee_amount} onChange={(e) => setForm({ ...form, fee_amount: e.target.value })} /></div>
              <div><Label>Fee (%)</Label><Input type="number" step="0.01" value={form.fee_percent} onChange={(e) => setForm({ ...form, fee_percent: e.target.value })} /></div>
              <div><Label>Min amount</Label><Input type="number" step="0.001" value={form.min_amount} onChange={(e) => setForm({ ...form, min_amount: e.target.value })} /></div>
              <div><Label>Max amount</Label><Input type="number" step="0.001" value={form.max_amount} onChange={(e) => setForm({ ...form, max_amount: e.target.value })} /></div>
              <div className="flex items-center gap-2"><Switch checked={form.requires_proof} onCheckedChange={(v) => setForm({ ...form, requires_proof: v })} /><Label>Requires payment proof</Label></div>
              <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} /><Label>Active</Label></div>
            </div>
            <Button onClick={save} className="mt-3 w-full bg-cyan-500 text-background hover:bg-cyan-400">Save</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {(data ?? []).map((m) => {
          const Icon = ICONS[m.icon ?? ""] ?? CreditCard;
          return (
            <div key={m.id} className={`rounded-xl border p-4 transition-colors ${m.is_active ? "border-cyan-500/20 bg-card" : "border-muted/20 bg-card/50 opacity-60"}`}>
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-500/10 text-cyan-400"><Icon className="h-5 w-5" /></div>
                <div className="flex-1">
                  <div className="font-medium">{m.name_en} <span className="text-muted-foreground">· {m.name_ar}</span></div>
                  <div className="text-xs text-muted-foreground">{m.type} · <code>{m.code}</code></div>
                </div>
                <Switch checked={m.is_active} onCheckedChange={(v) => toggle(m.id, v)} />
              </div>
              {m.instructions_en && <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{m.instructions_en}</p>}
              <div className="mt-2 flex flex-wrap gap-1 text-[11px]">
                {Object.entries((m.account_details ?? {}) as Record<string, unknown>).map(([k, v]) => (
                  <span key={k} className="rounded bg-background/50 px-2 py-0.5 font-mono text-muted-foreground">{k}: {String(v)}</span>
                ))}
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => {
                  setForm({
                    id: m.id, code: m.code, name_ar: m.name_ar, name_en: m.name_en, name_ur: m.name_ur ?? "",
                    type: m.type as PType, icon: m.icon ?? "landmark",
                    instructions_ar: m.instructions_ar ?? "", instructions_en: m.instructions_en ?? "", instructions_ur: m.instructions_ur ?? "",
                    account_details: JSON.stringify(m.account_details ?? {}, null, 2),
                    requires_proof: m.requires_proof, is_active: m.is_active,
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
            No payment methods yet. Click "New Method" to add one.
          </div>
        )}
      </div>
    </div>
  );
}
