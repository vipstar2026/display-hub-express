import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, Key, Package, CheckCircle2, XCircle, Search, Download, Upload, FileText } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/codes")({
  component: AdminCodes,
});

type StatsRow = { product_id: string; product_name: string; total_codes: number; used_codes: number; available_codes: number };

function AdminCodes() {
  const qc = useQueryClient();
  const [productId, setProductId] = useState("");
  const [bulk, setBulk] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"all" | "available" | "used">("all");

  const { data: stats = [] } = useQuery({
    queryKey: ["codes-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_digital_codes_stats");
      if (error) throw error;
      return (data ?? []) as StatsRow[];
    },
  });

  const { data: codes = [] } = useQuery({
    queryKey: ["codes", productId],
    enabled: !!productId,
    queryFn: async () =>
      (await supabase.from("digital_codes").select("*").eq("product_id", productId).order("created_at", { ascending: false })).data ?? [],
  });

  const totals = useMemo(() => {
    return stats.reduce(
      (acc, s) => ({
        total: acc.total + Number(s.total_codes),
        used: acc.used + Number(s.used_codes),
        available: acc.available + Number(s.available_codes),
      }),
      { total: 0, used: 0, available: 0 }
    );
  }, [stats]);

  // Parse: split by newline/comma/semicolon/tab, trim, strip surrounding quotes, remove empties, dedupe within input
  const parsedInput = useMemo(() => {
    const raw = bulk.split(/[\r\n,;\t]+/).map((l) => l.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    return Array.from(new Set(raw));
  }, [bulk]);

  const existingSet = useMemo(() => new Set(codes.map((c) => c.code)), [codes]);
  const newCodes = useMemo(() => parsedInput.filter((c) => !existingSet.has(c)), [parsedInput, existingSet]);
  const dupCount = parsedInput.length - newCodes.length;

  const handleAdd = async () => {
    if (!productId || newCodes.length === 0) return;
    const { error } = await supabase.from("digital_codes").insert(newCodes.map((code) => ({ product_id: productId, code })));
    if (error) toast.error(error.message);
    else {
      toast.success(`Added ${newCodes.length} codes${dupCount ? ` (${dupCount} duplicates skipped)` : ""}`);
      setBulk("");
      qc.invalidateQueries({ queryKey: ["codes", productId] });
      qc.invalidateQueries({ queryKey: ["codes-stats"] });
    }
  };

  const handleFile = async (file: File) => {
    const text = await file.text();
    // If CSV with header, keep the first column
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const looksCsv = /,/.test(lines[0] ?? "") && /code/i.test(lines[0] ?? "");
    const rows = looksCsv ? lines.slice(1).map((l) => l.split(",")[0]) : lines;
    setBulk((prev) => (prev.trim() ? prev + "\n" : "") + rows.join("\n"));
    toast.success(`Loaded ${rows.length} lines from ${file.name}`);
  };

  const filteredCodes = codes.filter((c) => {
    if (filter === "available" && c.is_used) return false;
    if (filter === "used" && !c.is_used) return false;
    if (q && !c.code.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const currentProduct = stats.find((s) => s.product_id === productId);

  const exportCsv = () => {
    if (codes.length === 0) return;
    const header = "code,is_used,used_at,created_at";
    const rows = codes.map((c) => [c.code, c.is_used, c.used_at ?? "", c.created_at].join(","));
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `codes-${currentProduct?.product_name ?? "export"}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Key className="h-6 w-6 text-primary" /> Digital / IPTV Codes
        </h1>
        <p className="text-sm text-muted-foreground">Manage subscription codes and stock per digital product.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={Package} label="Products" value={stats.length} />
        <Kpi icon={Key} label="Total codes" value={totals.total} />
        <Kpi icon={CheckCircle2} label="Available" value={totals.available} accent="text-emerald-400" />
        <Kpi icon={XCircle} label="Used" value={totals.used} accent="text-amber-400" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* Product picker with stock levels */}
        <div className="rounded-2xl border border-primary/15 bg-card">
          <div className="border-b border-primary/10 p-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Products
          </div>
          <div className="max-h-[520px] divide-y divide-primary/10 overflow-y-auto">
            {stats.length === 0 && (
              <div className="p-6 text-center text-xs text-muted-foreground">No digital products found</div>
            )}
            {stats.map((s) => (
              <button
                key={s.product_id}
                onClick={() => setProductId(s.product_id)}
                className={`flex w-full items-center gap-3 p-3 text-start text-sm transition ${
                  productId === s.product_id ? "bg-primary/10 text-primary" : "hover:bg-primary/5"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{s.product_name}</div>
                  <div className="mt-0.5 flex gap-2 text-[10px] text-muted-foreground">
                    <span className="text-emerald-400">✓ {s.available_codes}</span>
                    <span className="text-amber-400">◉ {s.used_codes}</span>
                  </div>
                </div>
                {Number(s.available_codes) === 0 && Number(s.total_codes) > 0 && (
                  <span className="rounded bg-red-500/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-400">Out</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {!productId ? (
            <div className="grid h-full min-h-[300px] place-items-center rounded-2xl border border-dashed border-primary/20 bg-card/40 p-10 text-center text-sm text-muted-foreground">
              Select a product on the left to add or manage its codes.
            </div>
          ) : (
            <>
              <div className="space-y-3 rounded-2xl border border-primary/15 bg-card p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-lg font-bold">{currentProduct?.product_name}</h3>
                  <Button size="sm" variant="outline" onClick={exportCsv} disabled={codes.length === 0}>
                    <Download className="me-1.5 h-3.5 w-3.5" /> CSV
                  </Button>
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <Label>Bulk add codes</Label>
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-primary/20 bg-background/60 px-2.5 py-1 text-xs hover:bg-primary/10">
                      <Upload className="h-3 w-3" /> Import file (.txt / .csv)
                      <input
                        type="file"
                        accept=".txt,.csv,text/plain,text/csv"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }}
                      />
                    </label>
                  </div>
                  <Textarea
                    rows={6}
                    value={bulk}
                    onChange={(e) => setBulk(e.target.value)}
                    placeholder="One code per line, or paste CSV / comma-separated&#10;ABC-123&#10;DEF-456&#10;GHI-789"
                    className="font-mono text-xs"
                  />
                  {parsedInput.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">
                        <FileText className="me-1 inline h-3 w-3" />
                        {parsedInput.length} parsed
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-400">
                        {newCodes.length} new
                      </span>
                      {dupCount > 0 && (
                        <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-400">
                          {dupCount} already exist (will skip)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Button onClick={handleAdd} disabled={newCodes.length === 0} className="bg-primary text-background hover:bg-primary">
                  Add {newCodes.length} codes
                </Button>
              </div>

              <div className="rounded-2xl border border-primary/15 bg-card">
                <div className="flex flex-wrap items-center gap-2 border-b border-primary/10 p-3">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search code…" className="h-8 ps-8 text-xs" />
                  </div>
                  <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
                    <SelectTrigger className="h-8 w-32 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="max-h-[420px] divide-y divide-primary/10 overflow-y-auto">
                  {filteredCodes.length === 0 && (
                    <div className="p-8 text-center text-sm text-muted-foreground">No codes match</div>
                  )}
                  {filteredCodes.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 p-3 text-sm">
                      <code className="font-mono text-primary">{c.code}</code>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${c.is_used ? "bg-amber-500/15 text-amber-400" : "bg-emerald-500/15 text-emerald-400"}`}>
                        {c.is_used ? "USED" : "AVAILABLE"}
                      </span>
                      {c.used_at && <span className="text-xs text-muted-foreground">{new Date(c.used_at).toLocaleDateString()}</span>}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="ms-auto text-red-400 hover:text-red-300"
                        onClick={async () => {
                          if (!confirm("Delete this code?")) return;
                          await supabase.from("digital_codes").delete().eq("id", c.id);
                          qc.invalidateQueries({ queryKey: ["codes", productId] });
                          qc.invalidateQueries({ queryKey: ["codes-stats"] });
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className={`mt-1 font-display text-2xl font-bold ${accent ?? ""}`}>{value}</div>
    </div>
  );
}
