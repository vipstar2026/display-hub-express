import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { formatPrice } from "@/lib/format";
import { UsersRound, Mail, ShoppingBag, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  component: CustomersPage,
});

type Row = {
  buyer_email: string;
  buyer_name: string | null;
  orders_count: number;
  total_spent: number;
  first_order_at: string;
  last_order_at: string;
};

function CustomersPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");
  const { data } = useQuery({
    queryKey: ["customer-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_customer_analytics");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const rows = (data ?? []).filter((r) =>
    !q.trim() || r.buyer_email.toLowerCase().includes(q.toLowerCase()) || (r.buyer_name ?? "").toLowerCase().includes(q.toLowerCase())
  );
  const total = data?.length ?? 0;
  const sum = (data ?? []).reduce((s, r) => s + Number(r.total_spent), 0);
  const avg = total > 0 ? sum / total : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><UsersRound className="h-6 w-6 text-primary" />{t("customers.title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("customers.subtitle")}</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Kpi icon={UsersRound} label={t("customers.total")} value={String(total)} />
        <Kpi icon={TrendingUp} label={t("reports.revenue")} value={formatPrice(sum, "BHD")} />
        <Kpi icon={ShoppingBag} label={t("customers.avg")} value={formatPrice(avg, "BHD")} />
      </div>

      <div className="max-w-sm">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="🔍" />
      </div>

      <div className="rounded-2xl border border-primary/10 bg-card">
        {rows.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <UsersRound className="mx-auto mb-2 h-10 w-10 text-primary/30" />{t("customers.empty")}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-primary/10 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="p-3 text-start">{t("customers.email")}</th>
                  <th className="p-3 text-start">{t("customers.name")}</th>
                  <th className="p-3 text-start">{t("customers.orders")}</th>
                  <th className="p-3 text-start">{t("customers.spent")}</th>
                  <th className="p-3 text-start">{t("customers.first")}</th>
                  <th className="p-3 text-start">{t("customers.last")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.buyer_email} className="border-b border-primary/5 last:border-0 hover:bg-primary/5">
                    <td className="p-3">
                      <a href={`mailto:${r.buyer_email}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                        <Mail className="h-3.5 w-3.5" />{r.buyer_email}
                      </a>
                    </td>
                    <td className="p-3">{r.buyer_name ?? "—"}</td>
                    <td className="p-3 font-mono">{r.orders_count}</td>
                    <td className="p-3 font-mono font-bold text-primary">{formatPrice(Number(r.total_spent), "BHD")}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(r.first_order_at).toLocaleDateString()}</td>
                    <td className="p-3 text-xs text-muted-foreground">{new Date(r.last_order_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: typeof UsersRound; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-5">
      <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground"><Icon className="h-4 w-4 text-primary" />{label}</div>
      <div className="font-mono text-2xl font-bold">{value}</div>
    </div>
  );
}
