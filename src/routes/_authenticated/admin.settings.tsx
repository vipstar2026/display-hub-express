import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: AdminSettings,
});

interface SettingsForm {
  site_name: string;
  tagline_ar: string; tagline_en: string; tagline_ur: string;
  contact_email: string; contact_phone: string; whatsapp: string;
  default_currency: string;
  shipping_flat: string; free_shipping_threshold: string;
}

function AdminSettings() {
  const qc = useQueryClient();
  const [form, setForm] = useState<SettingsForm | null>(null);

  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => (await supabase.from("site_settings").select("*").eq("id", 1).single()).data,
  });

  useEffect(() => {
    if (data && !form) {
      setForm({
        site_name: data.site_name,
        tagline_ar: data.tagline_ar ?? "", tagline_en: data.tagline_en ?? "", tagline_ur: data.tagline_ur ?? "",
        contact_email: data.contact_email ?? "", contact_phone: data.contact_phone ?? "", whatsapp: data.whatsapp ?? "",
        default_currency: data.default_currency,
        shipping_flat: String(data.shipping_flat),
        free_shipping_threshold: data.free_shipping_threshold ? String(data.free_shipping_threshold) : "",
      });
    }
  }, [data, form]);

  const handleSave = async () => {
    if (!form) return;
    const { error } = await supabase.from("site_settings").update({
      site_name: form.site_name,
      tagline_ar: form.tagline_ar, tagline_en: form.tagline_en, tagline_ur: form.tagline_ur,
      contact_email: form.contact_email, contact_phone: form.contact_phone, whatsapp: form.whatsapp,
      default_currency: form.default_currency,
      shipping_flat: Number(form.shipping_flat),
      free_shipping_threshold: form.free_shipping_threshold ? Number(form.free_shipping_threshold) : null,
    }).eq("id", 1);
    if (error) toast.error(error.message); else { toast.success("Saved"); qc.invalidateQueries({ queryKey: ["site-settings"] }); }
  };

  if (!form) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="font-display text-2xl font-bold">Settings</h1>
      <div className="space-y-3 rounded-xl border border-cyan-500/10 bg-card p-4">
        <div><Label>Site name</Label><Input value={form.site_name} onChange={(e) => setForm({ ...form, site_name: e.target.value })} /></div>
        <div><Label>Tagline (AR)</Label><Input value={form.tagline_ar} onChange={(e) => setForm({ ...form, tagline_ar: e.target.value })} /></div>
        <div><Label>Tagline (EN)</Label><Input value={form.tagline_en} onChange={(e) => setForm({ ...form, tagline_en: e.target.value })} /></div>
        <div><Label>Tagline (UR)</Label><Input value={form.tagline_ur} onChange={(e) => setForm({ ...form, tagline_ur: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Email</Label><Input value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
          <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
          <div><Label>Default Currency</Label><Input value={form.default_currency} onChange={(e) => setForm({ ...form, default_currency: e.target.value })} /></div>
          <div><Label>Flat shipping</Label><Input type="number" value={form.shipping_flat} onChange={(e) => setForm({ ...form, shipping_flat: e.target.value })} /></div>
          <div><Label>Free shipping over</Label><Input type="number" value={form.free_shipping_threshold} onChange={(e) => setForm({ ...form, free_shipping_threshold: e.target.value })} /></div>
        </div>
        <Button onClick={handleSave} className="bg-cyan-500 text-background hover:bg-cyan-400">Save</Button>
      </div>
    </div>
  );
}
