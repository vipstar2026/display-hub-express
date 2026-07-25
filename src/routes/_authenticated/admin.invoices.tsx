import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, Download, Search } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/invoices")({
  component: AdminInvoicesPage,
});

type Invoice = {
  id: string; invoice_number: string; issued_at: string; status: string;
  customer_name: string | null; customer_email: string | null; customer_phone: string | null;
  subtotal: number; tax: number; tax_rate: number; discount: number; total: number; currency: string;
  order_id: string | null; pos_sale_id: string | null;
};

function AdminInvoicesPage() {
  const { t } = useI18n();
  const [q, setQ] = useState("");

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async () => {
      const { data } = await supabase.from("invoices").select("*").order("issued_at", { ascending: false }).limit(500);
      return (data ?? []) as Invoice[];
    },
  });
  const { data: settings } = useQuery({
    queryKey: ["site-settings-company"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("site_name,company_cr,company_vat_no,company_address,contact_email,contact_phone").maybeSingle();
      return data;
    },
  });

  const filtered = invoices.filter((i) => {
    if (!q) return true;
    const s = q.toLowerCase();
    return i.invoice_number.toLowerCase().includes(s)
      || (i.customer_name ?? "").toLowerCase().includes(s)
      || (i.customer_email ?? "").toLowerCase().includes(s);
  });

  const downloadInvoice = async (inv: Invoice) => {
    let orderPayload: Parameters<typeof generateInvoicePDF>[0] = {
      order_number: inv.invoice_number,
      created_at: inv.issued_at,
      buyer_name: inv.customer_name,
      buyer_email: inv.customer_email ?? "",
      buyer_phone: inv.customer_phone,
      subtotal: inv.subtotal, discount: inv.discount, shipping: 0, tax: inv.tax, total: inv.total,
      currency: inv.currency, payment_status: inv.status, status: inv.status, payment_method: null,
      order_items: [],
    };

    if (inv.order_id) {
      const { data: o } = await supabase.from("orders").select("*, order_items(*)").eq("id", inv.order_id).maybeSingle();
      if (o) orderPayload = { ...(o as unknown as typeof orderPayload) };
    } else if (inv.pos_sale_id) {
      const { data: sale } = await supabase.from("pos_sales").select("*, pos_sale_items(*)").eq("id", inv.pos_sale_id).maybeSingle();
      if (sale) {
        const s = sale as unknown as { pos_sale_items?: Array<{ product_name?: string; quantity: number; unit_price: number; total: number }> };
        orderPayload.order_items = (s.pos_sale_items ?? []).map((it) => ({
          product_name: it.product_name, quantity: it.quantity, unit_price: it.unit_price, total: it.total,
        }));
      }
    }

    await generateInvoicePDF(orderPayload, {
      name: settings?.site_name,
      cr: settings?.company_cr ?? undefined,
      vat: settings?.company_vat_no ?? undefined,
      address: settings?.company_address ?? undefined,
      email: settings?.contact_email ?? undefined,
      phone: settings?.contact_phone ?? undefined,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <FileText className="h-6 w-6 text-primary" />
            {t("invoices.title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("invoices.subtitle")}</p>
        </div>
        <div className="relative w-full max-w-xs">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("invoices.search")} className="ps-9" />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-primary/20 bg-card">
        <table className="w-full text-sm">
          <thead className="bg-primary/5 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3 text-start">{t("invoices.number")}</th>
              <th className="px-4 py-3 text-start">{t("invoices.customer")}</th>
              <th className="px-4 py-3 text-start">{t("invoices.date")}</th>
              <th className="px-4 py-3 text-end">{t("invoices.subtotal")}</th>
              <th className="px-4 py-3 text-end">{t("invoices.vat")}</th>
              <th className="px-4 py-3 text-end">{t("invoices.total")}</th>
              <th className="px-4 py-3 text-end">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-primary/5">
            {isLoading && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">…</td></tr>}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">{t("invoices.empty")}</td></tr>
            )}
            {filtered.map((i) => (
              <tr key={i.id} className="hover:bg-primary/5">
                <td className="px-4 py-3 font-mono text-xs font-semibold text-primary">{i.invoice_number}</td>
                <td className="px-4 py-3">
                  <div className="font-medium">{i.customer_name || "—"}</div>
                  <div className="text-xs text-muted-foreground">{i.customer_email || i.customer_phone || ""}</div>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(i.issued_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-end font-mono text-xs">{formatPrice(Number(i.subtotal), i.currency)}</td>
                <td className="px-4 py-3 text-end font-mono text-xs">{formatPrice(Number(i.tax), i.currency)}</td>
                <td className="px-4 py-3 text-end font-mono font-bold text-primary">{formatPrice(Number(i.total), i.currency)}</td>
                <td className="px-4 py-3 text-end">
                  <Button size="sm" variant="outline" onClick={() => downloadInvoice(i)} className="gap-1">
                    <Download className="h-3.5 w-3.5" />PDF
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
