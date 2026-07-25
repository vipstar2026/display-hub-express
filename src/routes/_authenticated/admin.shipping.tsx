import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { Truck, Plus, Trash2, MapPin, Edit } from "lucide-react";
import { formatPrice } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/shipping")({
  component: AdminShippingPage,
});

type Zone = {
  id: string; name_ar: string; name_en: string; name_ur: string | null;
  country_code: string; regions: string[]; is_active: boolean; sort_order: number;
};
type Rate = {
  id: string; zone_id: string; name_ar: string; name_en: string; name_ur: string | null;
  method: string; price: number; free_over: number | null;
  min_delivery_days: number; max_delivery_days: number; is_active: boolean; sort_order: number;
};

function AdminShippingPage() {
  const { t, lang } = useI18n();
  const qc = useQueryClient();
  const [zoneDialog, setZoneDialog] = useState<Zone | null>(null);
  const [zoneOpen, setZoneOpen] = useState(false);
  const [rateDialog, setRateDialog] = useState<{ zoneId: string; rate: Rate | null } | null>(null);

  const { data: zones = [] } = useQuery({
    queryKey: ["admin-shipping-zones"],
    queryFn: async () => {
      const { data } = await supabase.from("shipping_zones").select("*").order("sort_order");
      return (data ?? []) as Zone[];
    },
  });
  const { data: rates = [] } = useQuery({
    queryKey: ["admin-shipping-rates"],
    queryFn: async () => {
      const { data } = await supabase.from("shipping_rates").select("*").order("sort_order");
      return (data ?? []) as Rate[];
    },
  });

  const zoneName = (z: Zone) => (lang === "ar" ? z.name_ar : lang === "ur" ? (z.name_ur || z.name_en) : z.name_en);
  const rateName = (r: Rate) => (lang === "ar" ? r.name_ar : lang === "ur" ? (r.name_ur || r.name_en) : r.name_en);

  const saveZone = async (form: Partial<Zone>) => {
    const payload = {
      name_ar: form.name_ar ?? "",
      name_en: form.name_en ?? "",
      name_ur: form.name_ur || null,
      country_code: form.country_code || "BH",
      regions: (Array.isArray(form.regions) ? form.regions : String(form.regions || "").split(",").map(s => s.trim()).filter(Boolean)) as unknown as never,
      is_active: form.is_active ?? true,
      sort_order: form.sort_order ?? 0,
    };
    const q = form.id
      ? supabase.from("shipping_zones").update(payload).eq("id", form.id)
      : supabase.from("shipping_zones").insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.saved"));
    qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
    setZoneOpen(false); setZoneDialog(null);
  };

  const deleteZone = async (id: string) => {
    if (!confirm(t("common.confirm_delete"))) return;
    const { error } = await supabase.from("shipping_zones").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-shipping-zones"] });
    qc.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
  };

  const saveRate = async (form: Partial<Rate> & { zone_id: string }) => {
    const payload = {
      zone_id: form.zone_id,
      name_ar: form.name_ar ?? "", name_en: form.name_en ?? "", name_ur: form.name_ur || null,
      method: form.method || "standard",
      price: Number(form.price ?? 0),
      free_over: form.free_over === null || form.free_over === undefined || String(form.free_over) === "" ? null : Number(form.free_over),
      min_delivery_days: Number(form.min_delivery_days ?? 1),
      max_delivery_days: Number(form.max_delivery_days ?? 3),
      is_active: form.is_active ?? true,
      sort_order: Number(form.sort_order ?? 0),
    };
    const q = form.id
      ? supabase.from("shipping_rates").update(payload).eq("id", form.id)
      : supabase.from("shipping_rates").insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.saved"));
    qc.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
    setRateDialog(null);
  };

  const deleteRate = async (id: string) => {
    if (!confirm(t("common.confirm_delete"))) return;
    const { error } = await supabase.from("shipping_rates").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["admin-shipping-rates"] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Truck className="h-6 w-6 text-primary" />
            {t("shipping.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("shipping.subtitle")}</p>
        </div>
        <Button onClick={() => { setZoneDialog({ id: "", name_ar: "", name_en: "", name_ur: "", country_code: "BH", regions: [], is_active: true, sort_order: 0 } as unknown as Zone); setZoneOpen(true); }} className="bg-primary text-background hover:bg-primary">
          <Plus className="me-2 h-4 w-4" />{t("shipping.new_zone")}
        </Button>
      </div>

      <div className="space-y-4">
        {zones.length === 0 && (
          <div className="rounded-xl border border-dashed border-primary/20 bg-card p-10 text-center">
            <MapPin className="mx-auto mb-2 h-10 w-10 text-primary/30" />
            <p className="text-muted-foreground">{t("shipping.no_zones")}</p>
          </div>
        )}

        {zones.map((z) => {
          const zoneRates = rates.filter((r) => r.zone_id === z.id);
          return (
            <div key={z.id} className="rounded-xl border border-primary/20 bg-card">
              <div className="flex flex-wrap items-center gap-3 border-b border-primary/10 p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{zoneName(z)}</span>
                    <span className="rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-[10px] uppercase text-primary">{z.country_code}</span>
                    {!z.is_active && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{t("common.inactive")}</span>}
                  </div>
                  {(z.regions?.length ?? 0) > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {z.regions.slice(0, 8).map((r) => <span key={r} className="rounded bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{r}</span>)}
                      {z.regions.length > 8 && <span className="text-[11px] text-muted-foreground">+{z.regions.length - 8}</span>}
                    </div>
                  )}
                </div>
                <Button size="sm" variant="outline" onClick={() => { setZoneDialog(z); setZoneOpen(true); }}><Edit className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => deleteZone(z.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                <Button size="sm" onClick={() => setRateDialog({ zoneId: z.id, rate: null })} className="bg-primary/10 text-primary hover:bg-primary/20"><Plus className="me-1 h-3.5 w-3.5" />{t("shipping.new_rate")}</Button>
              </div>

              <div className="divide-y divide-primary/5">
                {zoneRates.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">{t("shipping.no_rates")}</div>
                )}
                {zoneRates.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{rateName(r)}</span>
                        <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] uppercase text-primary">{r.method}</span>
                        {!r.is_active && <span className="rounded-full bg-muted px-2 py-0.5 text-[10px]">{t("common.inactive")}</span>}
                      </div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {r.min_delivery_days}-{r.max_delivery_days} {t("shipping.days")}
                        {r.free_over && <> · {t("shipping.free_over")} {formatPrice(Number(r.free_over))}</>}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-primary">{formatPrice(Number(r.price))}</div>
                    <Button size="sm" variant="outline" onClick={() => setRateDialog({ zoneId: z.id, rate: r })}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteRate(r.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone Dialog */}
      <Dialog open={zoneOpen} onOpenChange={setZoneOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{zoneDialog?.id ? t("shipping.edit_zone") : t("shipping.new_zone")}</DialogTitle></DialogHeader>
          {zoneDialog && (
            <ZoneForm initial={zoneDialog} onSave={saveZone} />
          )}
        </DialogContent>
      </Dialog>

      {/* Rate Dialog */}
      <Dialog open={!!rateDialog} onOpenChange={(o) => { if (!o) setRateDialog(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{rateDialog?.rate ? t("shipping.edit_rate") : t("shipping.new_rate")}</DialogTitle></DialogHeader>
          {rateDialog && (
            <RateForm zoneId={rateDialog.zoneId} initial={rateDialog.rate} onSave={saveRate} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ZoneForm({ initial, onSave }: { initial: Zone; onSave: (v: Partial<Zone>) => Promise<void> }) {
  const { t } = useI18n();
  const [f, setF] = useState({
    ...initial,
    regionsText: (initial.regions ?? []).join(", "),
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...f, id: initial.id || undefined, regions: f.regionsText.split(",").map(s => s.trim()).filter(Boolean) }); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{t("shipping.name_ar")}</Label><Input value={f.name_ar} onChange={(e) => setF({ ...f, name_ar: e.target.value })} required /></div>
        <div><Label>{t("shipping.name_en")}</Label><Input value={f.name_en} onChange={(e) => setF({ ...f, name_en: e.target.value })} required /></div>
        <div><Label>{t("shipping.name_ur")}</Label><Input value={f.name_ur ?? ""} onChange={(e) => setF({ ...f, name_ur: e.target.value })} /></div>
        <div><Label>{t("shipping.country")}</Label><Input value={f.country_code} onChange={(e) => setF({ ...f, country_code: e.target.value.toUpperCase() })} /></div>
      </div>
      <div><Label>{t("shipping.regions")}</Label><Input value={f.regionsText} onChange={(e) => setF({ ...f, regionsText: e.target.value })} placeholder="Manama, Muharraq, ..." /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{t("shipping.sort")}</Label><Input type="number" value={f.sort_order} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} /></div>
        <div className="flex items-end gap-2"><Switch checked={f.is_active} onCheckedChange={(v) => setF({ ...f, is_active: v })} /><Label>{t("common.active")}</Label></div>
      </div>
      <Button type="submit" className="w-full bg-primary text-background hover:bg-primary">{t("common.save")}</Button>
    </form>
  );
}

function RateForm({ zoneId, initial, onSave }: { zoneId: string; initial: Rate | null; onSave: (v: Partial<Rate> & { zone_id: string }) => Promise<void> }) {
  const { t } = useI18n();
  const [f, setF] = useState<Partial<Rate>>(initial ?? {
    name_ar: "", name_en: "", name_ur: "", method: "standard",
    price: 0, free_over: null, min_delivery_days: 1, max_delivery_days: 3,
    is_active: true, sort_order: 0,
  });
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ ...f, zone_id: zoneId, id: initial?.id }); }} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>{t("shipping.name_ar")}</Label><Input value={f.name_ar ?? ""} onChange={(e) => setF({ ...f, name_ar: e.target.value })} required /></div>
        <div><Label>{t("shipping.name_en")}</Label><Input value={f.name_en ?? ""} onChange={(e) => setF({ ...f, name_en: e.target.value })} required /></div>
        <div><Label>{t("shipping.name_ur")}</Label><Input value={f.name_ur ?? ""} onChange={(e) => setF({ ...f, name_ur: e.target.value })} /></div>
        <div>
          <Label>{t("shipping.method")}</Label>
          <select value={f.method} onChange={(e) => setF({ ...f, method: e.target.value })} className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="standard">Standard</option>
            <option value="express">Express</option>
            <option value="same_day">Same Day</option>
            <option value="pickup">Pickup</option>
          </select>
        </div>
        <div><Label>{t("shipping.price")}</Label><Input type="number" step="0.001" value={f.price ?? 0} onChange={(e) => setF({ ...f, price: Number(e.target.value) })} required /></div>
        <div><Label>{t("shipping.free_over")}</Label><Input type="number" step="0.001" value={f.free_over ?? ""} onChange={(e) => setF({ ...f, free_over: e.target.value === "" ? null : Number(e.target.value) })} /></div>
        <div><Label>{t("shipping.min_days")}</Label><Input type="number" value={f.min_delivery_days ?? 1} onChange={(e) => setF({ ...f, min_delivery_days: Number(e.target.value) })} /></div>
        <div><Label>{t("shipping.max_days")}</Label><Input type="number" value={f.max_delivery_days ?? 3} onChange={(e) => setF({ ...f, max_delivery_days: Number(e.target.value) })} /></div>
        <div><Label>{t("shipping.sort")}</Label><Input type="number" value={f.sort_order ?? 0} onChange={(e) => setF({ ...f, sort_order: Number(e.target.value) })} /></div>
        <div className="flex items-end gap-2"><Switch checked={f.is_active ?? true} onCheckedChange={(v) => setF({ ...f, is_active: v })} /><Label>{t("common.active")}</Label></div>
      </div>
      <Button type="submit" className="w-full bg-primary text-background hover:bg-primary">{t("common.save")}</Button>
    </form>
  );
}
