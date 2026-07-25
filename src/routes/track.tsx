import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Package, Search, CheckCircle2, Clock, Truck, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/track")({
  component: TrackPage,
  head: () => ({
    meta: [
      { title: "Track Order · VIPSTAR" },
      { name: "description", content: "Track your VIPSTAR order status using your order number and email." },
      { property: "og:title", content: "Track Order · VIPSTAR" },
      { property: "og:description", content: "Check the status of your VIPSTAR order." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type TrackItem = { product_name: string; quantity: number; unit_price: number };
type TrackResult = {
  order_number: string;
  status: string;
  payment_status: string;
  total: number;
  currency: string;
  created_at: string;
  updated_at: string;
  items: TrackItem[];
};

const STEPS = ["pending", "processing", "shipped", "delivered"];

function TrackPage() {
  const { t } = useI18n();
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !email.trim()) return;
    setLoading(true);
    setNotFound(false);
    setResult(null);
    const { data, error } = await supabase.rpc("track_order", {
      _order_number: orderNumber.trim(),
      _email: email.trim(),
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    const row = (Array.isArray(data) ? data[0] : null) as TrackResult | null;
    if (!row) {
      setNotFound(true);
      return;
    }
    setResult(row);
  }

  const isCancelled = result?.status === "cancelled";
  const currentStep = isCancelled ? -1 : STEPS.indexOf(result?.status ?? "pending");

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Package className="h-7 w-7" />
          </div>
          <h1 className="font-display text-3xl font-bold">{t("track.title")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("track.subtitle")}</p>
        </div>

        <form onSubmit={onSubmit} className="rounded-2xl border border-primary/20 bg-card p-6 shadow-lg shadow-primary/5">
          <div className="grid gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("track.orderNumber")}</label>
              <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="VS-XXXXXX" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">{t("track.email")}</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <Button type="submit" disabled={loading} className="mt-2 bg-primary text-background hover:bg-primary">
              <Search className="me-2 h-4 w-4" />
              {loading ? "..." : t("track.check")}
            </Button>
          </div>
        </form>

        {notFound && (
          <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/5 p-6 text-center">
            <XCircle className="mx-auto mb-2 h-8 w-8 text-red-400" />
            <p className="text-sm text-red-300">{t("track.notFound")}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-card p-6">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <span className="font-mono text-lg font-bold text-primary">{result.order_number}</span>
                <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-xs uppercase text-primary">{result.status}</span>
                <span className="rounded-full border border-primary/10 px-2 py-0.5 text-xs text-muted-foreground">{result.payment_status}</span>
                <span className="ms-auto font-mono font-bold">{formatPrice(Number(result.total), result.currency)}</span>
              </div>

              {isCancelled ? (
                <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
                  <XCircle className="h-4 w-4" /> {t("track.cancelled")}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {STEPS.map((s, i) => {
                    const done = i <= currentStep;
                    const Icon = i === 0 ? Clock : i === 1 ? Package : i === 2 ? Truck : CheckCircle2;
                    return (
                      <div key={s} className={`rounded-xl border p-3 text-center transition ${done ? "border-primary/40 bg-primary/10 text-primary" : "border-primary/10 bg-background text-muted-foreground"}`}>
                        <Icon className="mx-auto mb-1 h-5 w-5" />
                        <div className="text-[10px] uppercase tracking-wider">{t(`track.step.${s}`)}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 text-xs text-muted-foreground">
                {t("track.placed")}: {new Date(result.created_at).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("track.updated")}: {new Date(result.updated_at).toLocaleString()}
              </div>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold">{t("track.items")}</h2>
              <div className="space-y-2">
                {result.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{it.product_name} × {it.quantity}</span>
                    <span className="font-mono">{formatPrice(Number(it.unit_price) * it.quantity, result.currency)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
