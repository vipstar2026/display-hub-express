import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Users } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { makeAdminTE } from "@/lib/admin-i18n";

export const Route = createFileRoute("/_authenticated/admin/suppliers")({
  ssr: false,
  component: SuppliersPage,
});

type Supplier = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  balance: number;
  created_at: string;
};

function SuppliersPage() {
  const { lang } = useI18n();
  const te = useMemo(() => makeAdminTE(lang), [lang]);
  const [rows, setRows] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "" });

  async function load() {
    setLoading(true);
    const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data as Supplier[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  function openNew() {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", address: "", notes: "" });
    setOpen(true);
  }
  function openEdit(s: Supplier) {
    setEditing(s);
    setForm({ name: s.name, phone: s.phone ?? "", email: s.email ?? "", address: s.address ?? "", notes: s.notes ?? "" });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) { toast.error(te("Name required")); return; }
    const payload = {
      name: form.name.trim(),
      phone: form.phone || null,
      email: form.email || null,
      address: form.address || null,
      notes: form.notes || null,
    };
    const res = editing
      ? await supabase.from("suppliers").update(payload).eq("id", editing.id)
      : await supabase.from("suppliers").insert(payload);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? te("Updated") : te("Created"));
    setOpen(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm(te("Delete supplier?"))) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(te("Deleted"));
    load();
  }

  const filtered = rows.filter((r) =>
    !q || r.name.toLowerCase().includes(q.toLowerCase()) || (r.email ?? "").toLowerCase().includes(q.toLowerCase()) || (r.phone ?? "").includes(q)
  );

  const totalBalance = rows.reduce((s, r) => s + Number(r.balance || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold">{te("Suppliers")}</h1>
          <p className="text-sm text-muted-foreground">{te("Manage vendors and outstanding balances")}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 me-1" /> {te("New Supplier")}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? te("Edit Supplier") : te("New Supplier")}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input placeholder={te("Name *")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Input placeholder={te("Phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input placeholder={te("Email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input placeholder={te("Address")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              <Textarea placeholder={te("Notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <DialogFooter><Button onClick={save}>{te("Save")}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Kpi label={te("Total Suppliers")} value={rows.length.toString()} />
        <Kpi label={te("Outstanding Balance")} value={`${totalBalance.toFixed(3)} BHD`} />
        <Kpi label={te("Active")} value={rows.filter((r) => r.balance > 0).length.toString()} />
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder={te("Search name / email / phone")} value={q} onChange={(e) => setQ(e.target.value)} className="ps-9" />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-start">{te("Name")}</th>
              <th className="p-3 text-start">{te("Phone")}</th>
              <th className="p-3 text-start">{te("Email")}</th>
              <th className="p-3 text-end">{te("Balance")}</th>
              <th className="p-3 text-end">{te("Actions")}</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{te("Loading…")}</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">{te("No suppliers")}</td></tr>}
            {filtered.map((s) => (
              <tr key={s.id} className="border-t border-border/60">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3 text-muted-foreground">{s.phone || "—"}</td>
                <td className="p-3 text-muted-foreground">{s.email || "—"}</td>
                <td className="p-3 text-end font-mono">{Number(s.balance).toFixed(3)}</td>
                <td className="p-3 text-end">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(s.id)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
