import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link2, Copy, Check, Loader2, Trash2, MessageCircle, Mail, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/payment-links")({
  component: PaymentLinksPage,
});

type PaymentLink = {
  id: string;
  token: string;
  amount: number;
  currency: string;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  description: string | null;
  status: string;
  order_id: string | null;
  paid_at: string | null;
  expires_at: string | null;
  created_at: string;
};

function randomToken() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function PaymentLinksPage() {
  const { lang } = useI18n();
  const qc = useQueryClient();
  const t = (ar: string, en: string, ur?: string, bn?: string) =>
    lang === "ar" ? ar : lang === "ur" ? (ur ?? en) : lang === "bn" ? (bn ?? en) : en;

  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState("7");
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: links = [], isLoading } = useQuery({
    queryKey: ["admin-payment-links"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_links")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PaymentLink[];
    },
  });

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const urlFor = (token: string) => `${origin}/pay-link/${token}`;

  const create = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!value || value <= 0) throw new Error(t("أدخل مبلغاً صحيحاً", "Enter a valid amount"));
      const { error } = await supabase.from("payment_links").insert({
        token: randomToken(),
        amount: value,
        currency: "BHD",
        customer_name: name || null,
        customer_email: email || null,
        customer_phone: phone || null,
        description: description || null,
        expires_at: days ? new Date(Date.now() + Number(days) * 86400000).toISOString() : null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("تم إنشاء رابط الدفع", "Payment link created"));
      setAmount(""); setName(""); setEmail(""); setPhone(""); setDescription("");
      qc.invalidateQueries({ queryKey: ["admin-payment-links"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-payment-links"] }),
    onError: (e: Error) => toast.error(e.message),
  });

  const stats = useMemo(() => {
    const paid = links.filter((l) => l.status === "paid");
    const pending = links.filter((l) => l.status === "pending");
    return {
      paidCount: paid.length,
      pendingCount: pending.length,
      collected: paid.reduce((s, l) => s + Number(l.amount), 0),
      outstanding: pending.reduce((s, l) => s + Number(l.amount), 0),
    };
  }, [links]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return links;
    return links.filter((l) =>
      [l.customer_name, l.customer_email, l.customer_phone, l.description, l.token, String(l.amount)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s)),
    );
  }, [links, q]);

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(urlFor(token));
    setCopied(token);
    toast.success(t("تم نسخ الرابط", "Link copied"));
    setTimeout(() => setCopied(null), 1500);
  };

  const statusLabel = (s: string) =>
    s === "paid" ? t("مدفوع", "Paid", "ادا شدہ", "পরিশোধিত")
      : s === "cancelled" ? t("ملغي", "Cancelled", "منسوخ", "বাতিল")
      : t("بانتظار الدفع", "Pending", "زیر التوا", "অপেক্ষমাণ");

  return (
    <div className="space-y-6" style={{ unicodeBidi: "plaintext" }}>
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <Link2 className="h-6 w-6 text-primary" /> {t("روابط الدفع", "Payment links", "ادائیگی لنکس", "পেমেন্ট লিংক")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("أنشئ رابط دفع بالبطاقة وأرسله للزبون عبر واتساب أو البريد.", "Create a card payment link and send it to the customer via WhatsApp or email.")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          { label: t("محصّل", "Collected"), value: `${stats.collected.toFixed(3)} BHD` },
          { label: t("مستحق", "Outstanding"), value: `${stats.outstanding.toFixed(3)} BHD` },
          { label: t("روابط مدفوعة", "Paid links"), value: stats.paidCount },
          { label: t("بانتظار الدفع", "Pending links"), value: stats.pendingCount },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-primary/10 bg-card p-4">
            <div className="text-xs text-muted-foreground">{c.label}</div>
            <div className="mt-1 font-display text-xl font-bold text-primary">{c.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-primary/10 bg-card p-5">
        <h2 className="mb-3 font-semibold">{t("إنشاء رابط جديد", "Create a new link")}</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Input type="number" step="0.001" placeholder={t("المبلغ (د.ب)", "Amount (BHD)")} value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Input placeholder={t("اسم الزبون", "Customer name")} value={name} onChange={(e) => setName(e.target.value)} />
          <Input type="email" placeholder={t("البريد الإلكتروني", "Email")} value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input placeholder={t("رقم الواتساب", "WhatsApp number")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input type="number" placeholder={t("صلاحية الرابط (أيام)", "Valid for (days)")} value={days} onChange={(e) => setDays(e.target.value)} />
          <Textarea className="sm:col-span-3" rows={2} placeholder={t("وصف الدفعة", "Payment description")} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button className="mt-3" disabled={create.isPending} onClick={() => create.mutate()}>
          {create.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t("إنشاء الرابط", "Create link")}
        </Button>
      </div>

      <div className="rounded-xl border border-primary/10 bg-card">
        <div className="flex items-center gap-2 border-b border-primary/10 p-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input className="border-0 bg-transparent focus-visible:ring-0" placeholder={t("بحث…", "Search…")} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {isLoading ? (
          <div className="flex justify-center p-10"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">{t("لا توجد روابط بعد.", "No payment links yet.")}</p>
        ) : (
          <div className="divide-y divide-primary/10">
            {filtered.map((l) => (
              <div key={l.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-40 flex-1">
                  <div className="font-semibold text-primary">{Number(l.amount).toFixed(3)} {l.currency}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.customer_name || l.customer_email || t("بدون اسم", "No name")} · {new Date(l.created_at).toLocaleDateString()}
                  </div>
                  {l.description && <div className="mt-1 text-xs text-muted-foreground">{l.description}</div>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${l.status === "paid" ? "bg-primary/15 text-primary" : l.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                  {statusLabel(l.status)}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" title={t("نسخ", "Copy")} onClick={() => copy(l.token)}>
                    {copied === l.token ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  {l.customer_phone && (
                    <a href={`https://wa.me/${l.customer_phone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(urlFor(l.token))}`} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="ghost" title="WhatsApp"><MessageCircle className="h-4 w-4" /></Button>
                    </a>
                  )}
                  {l.customer_email && (
                    <a href={`mailto:${l.customer_email}?subject=${encodeURIComponent("VIPSTAR payment link")}&body=${encodeURIComponent(urlFor(l.token))}`}>
                      <Button size="icon" variant="ghost" title="Email"><Mail className="h-4 w-4" /></Button>
                    </a>
                  )}
                  {l.status !== "paid" && (
                    <Button size="icon" variant="ghost" title={t("حذف", "Delete")} onClick={() => remove.mutate(l.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
