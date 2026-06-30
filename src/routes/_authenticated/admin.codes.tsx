import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/codes")({
  component: AdminCodes,
});

function AdminCodes() {
  const qc = useQueryClient();
  const [productId, setProductId] = useState("");
  const [bulk, setBulk] = useState("");

  const { data: subProducts } = useQuery({
    queryKey: ["sub-products"],
    queryFn: async () => (await supabase.from("products").select("id, name_en").in("type", ["digital","subscription"])).data ?? [],
  });

  const { data: codes } = useQuery({
    queryKey: ["codes", productId],
    enabled: !!productId,
    queryFn: async () => (await supabase.from("digital_codes").select("*").eq("product_id", productId).order("created_at", { ascending: false })).data ?? [],
  });

  const handleAdd = async () => {
    const lines = bulk.split("\n").map((l) => l.trim()).filter(Boolean);
    if (!productId || lines.length === 0) return;
    const { error } = await supabase.from("digital_codes").insert(lines.map((code) => ({ product_id: productId, code })));
    if (error) toast.error(error.message); else { toast.success(`Added ${lines.length} codes`); setBulk(""); qc.invalidateQueries({ queryKey: ["codes", productId] }); }
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">IPTV / Digital Codes</h1>

      <div className="space-y-3 rounded-xl border border-cyan-500/10 bg-card p-4">
        <div>
          <Label>Product</Label>
          <Select value={productId} onValueChange={setProductId}>
            <SelectTrigger><SelectValue placeholder="Select a digital product" /></SelectTrigger>
            <SelectContent>{(subProducts ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        {productId && (
          <>
            <div>
              <Label>Bulk codes (one per line)</Label>
              <Textarea rows={6} value={bulk} onChange={(e) => setBulk(e.target.value)} placeholder="ABC123&#10;DEF456&#10;GHI789" />
            </div>
            <Button onClick={handleAdd} className="bg-cyan-500 text-background hover:bg-cyan-400">Add codes</Button>
          </>
        )}
      </div>

      {productId && (
        <div className="rounded-xl border border-cyan-500/10 bg-card divide-y divide-cyan-500/10">
          {(codes ?? []).length === 0 && <div className="p-6 text-center text-muted-foreground">No codes yet</div>}
          {(codes ?? []).map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 text-sm">
              <code className="font-mono text-cyan-400">{c.code}</code>
              <span className={`text-xs ${c.is_used ? "text-orange-400" : "text-green-400"}`}>{c.is_used ? "USED" : "AVAILABLE"}</span>
              <Button size="sm" variant="ghost" className="ms-auto" onClick={async () => {
                if (!confirm("Delete?")) return;
                await supabase.from("digital_codes").delete().eq("id", c.id);
                qc.invalidateQueries({ queryKey: ["codes", productId] });
              }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
