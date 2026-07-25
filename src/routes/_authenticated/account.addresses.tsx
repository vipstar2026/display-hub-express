import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Plus, Trash2, Edit, Star, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account/addresses")({
  component: AddressBookPage,
});

type Address = {
  id: string; user_id: string; full_name: string; phone: string;
  country: string; city: string; address_line: string; postal_code: string | null;
  is_default: boolean;
};

function AddressBookPage() {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [dialog, setDialog] = useState<Partial<Address> | null>(null);

  const { data: addresses = [] } = useQuery({
    queryKey: ["my-addresses"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return [];
      const { data } = await supabase.from("addresses").select("*").eq("user_id", u.user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false });
      return (data ?? []) as Address[];
    },
  });

  const save = async (form: Partial<Address>) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const payload = {
      user_id: u.user.id,
      full_name: form.full_name ?? "",
      phone: form.phone ?? "",
      country: form.country || "Bahrain",
      city: form.city ?? "",
      address_line: form.address_line ?? "",
      postal_code: form.postal_code || null,
      is_default: form.is_default ?? false,
    };
    // If marking default, unset others
    if (payload.is_default) {
      await supabase.from("addresses").update({ is_default: false }).eq("user_id", u.user.id);
    }
    const q = form.id
      ? supabase.from("addresses").update(payload).eq("id", form.id)
      : supabase.from("addresses").insert(payload);
    const { error } = await q;
    if (error) { toast.error(error.message); return; }
    toast.success(t("common.saved"));
    qc.invalidateQueries({ queryKey: ["my-addresses"] });
    setDialog(null);
  };

  const remove = async (id: string) => {
    if (!confirm(t("common.confirm_delete"))) return;
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["my-addresses"] });
  };

  const makeDefault = async (id: string) => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", u.user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["my-addresses"] });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/account"><Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5 rtl:rotate-180" /></Button></Link>
            <h1 className="flex items-center gap-2 font-display text-3xl font-bold"><MapPin className="h-6 w-6 text-primary" />{t("addresses.title")}</h1>
          </div>
          <Button onClick={() => setDialog({ full_name: "", phone: "", country: "Bahrain", city: "", address_line: "", postal_code: "", is_default: addresses.length === 0 })} className="bg-primary text-background hover:bg-primary">
            <Plus className="me-2 h-4 w-4" />{t("addresses.new")}
          </Button>
        </div>

        {addresses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-primary/20 bg-card p-12 text-center">
            <MapPin className="mx-auto mb-3 h-12 w-12 text-primary/30" />
            <p className="text-muted-foreground">{t("addresses.empty")}</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((a) => (
              <div key={a.id} className="rounded-xl border border-primary/20 bg-card p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{a.full_name}</span>
                      {a.is_default && <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary"><Star className="h-2.5 w-2.5 fill-current" />{t("addresses.default")}</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-muted-foreground">{a.phone}</div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setDialog(a)}><Edit className="h-3.5 w-3.5" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                  </div>
                </div>
                <div className="space-y-0.5 text-sm text-muted-foreground">
                  <div>{a.address_line}</div>
                  <div>{a.city}{a.postal_code ? ` · ${a.postal_code}` : ""}</div>
                  <div>{a.country}</div>
                </div>
                {!a.is_default && (
                  <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => makeDefault(a.id)}>
                    <Star className="me-2 h-3.5 w-3.5" />{t("addresses.make_default")}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={!!dialog} onOpenChange={(o) => { if (!o) setDialog(null); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{dialog?.id ? t("addresses.edit") : t("addresses.new")}</DialogTitle></DialogHeader>
            {dialog && (
              <form onSubmit={(e) => { e.preventDefault(); save(dialog); }} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{t("addresses.full_name")}</Label><Input value={dialog.full_name ?? ""} onChange={(e) => setDialog({ ...dialog, full_name: e.target.value })} required /></div>
                  <div><Label>{t("addresses.phone")}</Label><Input value={dialog.phone ?? ""} onChange={(e) => setDialog({ ...dialog, phone: e.target.value })} required /></div>
                </div>
                <div><Label>{t("addresses.address_line")}</Label><Input value={dialog.address_line ?? ""} onChange={(e) => setDialog({ ...dialog, address_line: e.target.value })} required /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>{t("addresses.city")}</Label><Input value={dialog.city ?? ""} onChange={(e) => setDialog({ ...dialog, city: e.target.value })} required /></div>
                  <div><Label>{t("addresses.postal_code")}</Label><Input value={dialog.postal_code ?? ""} onChange={(e) => setDialog({ ...dialog, postal_code: e.target.value })} /></div>
                  <div><Label>{t("addresses.country")}</Label><Input value={dialog.country ?? "Bahrain"} onChange={(e) => setDialog({ ...dialog, country: e.target.value })} /></div>
                </div>
                <div className="flex items-center gap-2 pt-2"><Switch checked={dialog.is_default ?? false} onCheckedChange={(v) => setDialog({ ...dialog, is_default: v })} /><Label>{t("addresses.set_default")}</Label></div>
                <Button type="submit" className="w-full bg-primary text-background hover:bg-primary">{t("common.save")}</Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
}
