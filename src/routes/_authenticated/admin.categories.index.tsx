import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n, localizedName } from "@/lib/i18n";
import { makeAdminT } from "@/lib/admin-i18n";
import { fieldDirProps } from "@/lib/dir";


export const Route = createFileRoute("/_authenticated/admin/categories/")({
  component: AdminCategories,
});

interface CatForm { id?: string; slug: string; name_ar: string; name_en: string; name_ur: string; name_bn: string; icon: string; sort_order: string; }
const empty: CatForm = { slug: "", name_ar: "", name_en: "", name_ur: "", name_bn: "", icon: "satellite", sort_order: "0" };

function AdminCategories() {
  const { lang } = useI18n();
  const t = makeAdminT(lang);
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CatForm>(empty);

  const { data } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort_order")).data ?? [],
  });

  const handleSave = async () => {
    const payload = {
      slug: form.slug,
      name_ar: form.name_ar, name_en: form.name_en, name_ur: form.name_ur || null, name_bn: form.name_bn || null,
      icon: form.icon || null, sort_order: Number(form.sort_order),
    };
    const { error } = form.id
      ? await supabase.from("categories").update(payload).eq("id", form.id)
      : await supabase.from("categories").insert(payload);
    if (error) { toast.error(error.message); return; }
    toast.success(t("تم الحفظ", "Saved")); setOpen(false); setForm(empty); qc.invalidateQueries({ queryKey: ["admin-cats"] });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">{t("التصنيفات", "Categories")}</h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setForm(empty); }}>
          <DialogTrigger asChild><Button className="bg-primary text-background hover:bg-primary"><Plus className="me-1 h-4 w-4" />{t("جديد", "New")}</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{form.id ? t("تعديل التصنيف", "Edit Category") : t("تصنيف جديد", "New Category")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{t("الرابط (Slug)", "Slug")}</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} /></div>
              <div><Label>{t("الاسم (عربي)", "Name AR")}</Label><Input dir="rtl" value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
              <div><Label>{t("الاسم (إنجليزي)", "Name EN")}</Label><Input dir="ltr" value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
              <div><Label>{t("الاسم (أردو)", "Name UR")}</Label><Input dir="rtl" value={form.name_ur} onChange={(e) => setForm({ ...form, name_ur: e.target.value })} /></div>
              <div><Label>{t("الاسم (بنغالي)", "Name BN")}</Label><Input dir="ltr" value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} /></div>
              <div><Label>{t("أيقونة (اسم lucide)", "Icon (lucide name)")}</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
              <div><Label>{t("ترتيب العرض", "Sort Order")}</Label><Input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} /></div>
              <Button onClick={handleSave} className="w-full bg-primary text-background hover:bg-primary">{t("حفظ", "Save")}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-primary/10 bg-card divide-y divide-primary/10">
        {(data ?? []).map((c) => (
          <div key={c.id} className="flex items-center gap-3 p-3 transition-colors hover:bg-primary/5">
            <Link
              to="/admin/categories/$slug"
              params={{ slug: c.slug }}
              className="flex min-w-0 flex-1 items-center gap-2"
            >
              <div className="min-w-0">
                <div className="truncate font-medium">{localizedName(c as unknown as Record<string, unknown>, "name", lang)}</div>
                <div className="text-xs text-muted-foreground">/{c.slug}</div>
              </div>
              <ChevronRight className="ms-auto h-4 w-4 text-muted-foreground rtl:rotate-180" />
            </Link>
            <Button size="sm" variant="ghost" onClick={() => { setForm({ id: c.id, slug: c.slug, name_ar: c.name_ar, name_en: c.name_en, name_ur: c.name_ur ?? "", name_bn: (c as unknown as { name_bn?: string | null }).name_bn ?? "", icon: c.icon ?? "", sort_order: String(c.sort_order) }); setOpen(true); }}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" onClick={async () => {
              if (!confirm(t("حذف؟", "Delete?"))) return;
              const { error } = await supabase.from("categories").delete().eq("id", c.id);
              if (error) toast.error(error.message); else { toast.success(t("تم الحذف", "Deleted")); qc.invalidateQueries({ queryKey: ["admin-cats"] }); }
            }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
          </div>
        ))}

      </div>
    </div>
  );
}
