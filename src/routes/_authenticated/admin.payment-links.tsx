import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Link2, Copy, Check, Loader2, Trash2, MessageCircle, Mail, Search,
  FileDown, ExternalLink, Ban, Download, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { generateInvoicePDF } from "@/lib/invoice-pdf";
import { waAnchorProps } from "@/lib/whatsapp";

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

const COUNTRY_CODES = [
  { code: "+973", label: "🇧🇭 Bahrain +973" },
  { code: "+966", label: "🇸🇦 Saudi Arabia +966" },
  { code: "+971", label: "🇦🇪 UAE +971" },
  { code: "+965", label: "🇰🇼 Kuwait +965" },
  { code: "+974", label: "🇶🇦 Qatar +974" },
  { code: "+968", label: "🇴🇲 Oman +968" },
  { code: "+20", label: "🇪🇬 Egypt +20" },
  { code: "+92", label: "🇵🇰 Pakistan +92" },
  { code: "+91", label: "🇮🇳 India +91" },
  { code: "+880", label: "🇧🇩 Bangladesh +880" },
  { code: "+63", label: "🇵🇭 Philippines +63" },
  { code: "+44", label: "🇬🇧 UK +44" },
  { code: "+1", label: "🇺🇸 USA +1" },
];

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
  const [dial, setDial] = useState("+973");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState("7");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [copied, setCopied] = useState<string | null>(null);

  const { data: links = [], isLoading, isFetching, refetch } = useQuery({
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

  const { data: settings } = useQuery({
    queryKey: ["site-settings-company"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("site_name,company_cr,company_vat_no,company_address,contact_email,contact_phone")
        .maybeSingle();
      return data;
    },
  });

  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const urlFor = (token: string) => `${origin}/pay-link/${token}`;

  const create = useMutation({
    mutationFn: async () => {
      const value = Number(amount);
      if (!value || value <= 0) throw new Error(t("أدخل مبلغاً صحيحاً", "Enter a valid amount"));
      const fullPhone = phone.trim() ? `${dial}${phone.replace(/[^\d]/g, "").replace(/^0+/, "")}` : null;
      const { error } = await supabase.from("payment_links").insert({
        token: randomToken(),
        amount: value,
        currency: "BHD",
        customer_name: name || null,
        customer_email: email || null,
        customer_phone: fullPhone,
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

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("payment_links").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("تم التحديث", "Updated"));
      qc.invalidateQueries({ queryKey: ["admin-payment-links"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("payment_links").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("تم الحذف", "Deleted"));
      qc.invalidateQueries({ queryKey: ["admin-payment-links"] });
    },
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
    return links.filter((l) => {
      if (statusFilter !== "all" && l.status !== statusFilter) return false;
      if (!s) return true;
      return [l.customer_name, l.customer_email, l.customer_phone, l.description, l.token, String(l.amount)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(s));
    });
  }, [links, q, statusFilter]);

  const copy = async (token: string) => {
    await navigator.clipboard.writeText(urlFor(token));
    setCopied(token);
    toast.success(t("تم نسخ الرابط", "Link copied"));
    setTimeout(() => setCopied(null), 1500);
  };

  const downloadInvoice = async (l: PaymentLink) => {
    await generateInvoicePDF(
      {
        order_number: `PL-${l.token.slice(0, 8).toUpperCase()}`,
        created_at: l.created_at,
        buyer_name: l.customer_name,
        buyer_email: l.customer_email ?? "",
        buyer_phone: l.customer_phone,
        subtotal: Number(l.amount),
        discount: 0,
        shipping: 0,
        tax: 0,
        total: Number(l.amount),
        currency: l.currency,
        payment_status: l.status,
        status: l.status,
        payment_method: "card",
        order_items: [
          {
            product_name: l.description || t("رابط دفع مخصص", "Custom payment link"),
            quantity: 1,
            unit_price: Number(l.amount),
            total: Number(l.amount),
          },
        ],
      },
      {
        name: settings?.site_name,
        cr: settings?.company_cr ?? undefined,
        vat: settings?.company_vat_no ?? undefined,
        address: settings?.company_address ?? undefined,
        email: settings?.contact_email ?? undefined,
        phone: settings?.contact_phone ?? undefined,
      },
    );
  };

  const exportCsv = () => {
    const rows = [
      ["amount", "currency", "status", "customer", "email", "phone", "description", "created_at", "url"],
      ...filtered.map((l) => [
        l.amount, l.currency, l.status, l.customer_name ?? "", l.customer_email ?? "",
        l.customer_phone ?? "", (l.description ?? "").replace(/[\n,]/g, " "), l.created_at, urlFor(l.token),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `payment-links-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const statusLabel = (s: string) =>
    s === "paid" ? t("مدفوع", "Paid", "ادا شدہ", "পরিশোধিত")
      : s === "cancelled" ? t("ملغي", "Cancelled", "منسوخ", "বাতিল")
      : t("بانتظار الدفع", "Pending", "زیر التوا", "অপেক্ষমাণ");

  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-primary/80";

  return (
    <div className="space-y-6" style={{ unicodeBidi: "plaintext" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <Link2 className="h-6 w-6 text-primary" /> {t("روابط الدفع", "Payment links", "ادائیگی لنکس", "পেমেন্ট লিংক")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("أنشئ رابط دفع بالبطاقة وأرسله للزبون عبر واتساب أو البريد.", "Create a card payment link and send it to the customer via WhatsApp or email.")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1" onClick={() => refetch()}>
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            {t("تحديث", "Refresh")}
          </Button>
          <Button variant="outline" size="sm" className="gap-1" onClick={exportCsv}>
            <Download className="h-4 w-4" />
            {t("تصدير CSV", "Export CSV")}
          </Button>
        </div>
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
        <h2 className="mb-4 font-semibold">{t("إنشاء رابط جديد", "Create a new link")}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label className={labelCls}>{t("المبلغ (د.ب)", "Amount (BHD)")} *</Label>
            <Input type="number" step="0.001" placeholder="0.000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label className={labelCls}>{t("اسم الزبون", "Customer name")}</Label>
            <Input placeholder={t("مثال: أحمد علي", "e.g. Ahmed Ali")} value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label className={labelCls}>{t("البريد الإلكتروني", "Email")}</Label>
            <Input type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label className={labelCls}>{t("رقم الواتساب", "WhatsApp number")}</Label>
            <div className="flex gap-2" dir="ltr">
              <select
                value={dial}
                onChange={(e) => setDial(e.target.value)}
                className="h-10 w-32 shrink-0 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {COUNTRY_CODES.map((c) => (
                  <option key={c.code} value={c.code}>{c.label}</option>
                ))}
              </select>
              <Input
                inputMode="numeric"
                placeholder="33xxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
          </div>
          <div>
            <Label className={labelCls}>{t("صلاحية الرابط (أيام)", "Valid for (days)")}</Label>
            <Input type="number" min="1" placeholder="7" value={days} onChange={(e) => setDays(e.target.value)} />
          </div>
          <div className="sm:col-span-3">
            <Label className={labelCls}>{t("وصف الدفعة", "Payment description")}</Label>
            <Textarea rows={2} placeholder={t("مثال: اشتراك IPTV سنة", "e.g. IPTV subscription — 1 year")} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4" disabled={create.isPending} onClick={() => create.mutate()}>
          {create.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
          {t("إنشاء الرابط", "Create link")}
        </Button>
      </div>

      <div className="rounded-xl border border-primary/10 bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-primary/10 p-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input className="min-w-40 flex-1 border-0 bg-transparent focus-visible:ring-0" placeholder={t("بحث…", "Search…")} value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="flex gap-1">
            {[
              { k: "all", l: t("الكل", "All") },
              { k: "pending", l: statusLabel("pending") },
              { k: "paid", l: statusLabel("paid") },
              { k: "cancelled", l: statusLabel("cancelled") },
            ].map((f) => (
              <Button key={f.k} size="sm" variant={statusFilter === f.k ? "default" : "outline"} onClick={() => setStatusFilter(f.k)}>
                {f.l}
              </Button>
            ))}
          </div>
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
                  {l.customer_phone && <div className="text-xs text-muted-foreground" dir="ltr">{l.customer_phone}</div>}
                  {l.description && <div className="mt-1 text-xs text-muted-foreground">{l.description}</div>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${l.status === "paid" ? "bg-primary/15 text-primary" : l.status === "cancelled" ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}>
                  {statusLabel(l.status)}
                </span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" title={t("نسخ", "Copy")} onClick={() => copy(l.token)}>
                    {copied === l.token ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <a href={urlFor(l.token)} target="_blank" rel="noopener noreferrer">
                    <Button size="icon" variant="ghost" title={t("فتح الرابط", "Open link")}><ExternalLink className="h-4 w-4" /></Button>
                  </a>
                  <Button size="icon" variant="ghost" title={t("تحميل الفاتورة", "Download invoice")} onClick={() => downloadInvoice(l)}>
                    <FileDown className="h-4 w-4" />
                  </Button>
                  {l.customer_phone && (
                    <a {...waAnchorProps(l.customer_phone, urlFor(l.token))}>
                      <Button size="icon" variant="ghost" title="WhatsApp"><MessageCircle className="h-4 w-4" /></Button>
                    </a>
                  )}
                  {l.customer_email && (
                    <a href={`mailto:${l.customer_email}?subject=${encodeURIComponent("VIPSTAR payment link")}&body=${encodeURIComponent(urlFor(l.token))}`}>
                      <Button size="icon" variant="ghost" title="Email"><Mail className="h-4 w-4" /></Button>
                    </a>
                  )}
                  {l.status === "pending" && (
                    <Button size="icon" variant="ghost" title={t("إلغاء", "Cancel")} onClick={() => setStatus.mutate({ id: l.id, status: "cancelled" })}>
                      <Ban className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                  {l.status !== "paid" && (
                    <Button
                      size="icon"
                      variant="ghost"
                      title={t("حذف", "Delete")}
                      onClick={() => {
                        if (confirm(t("تأكيد حذف الرابط؟", "Delete this link?"))) remove.mutate(l.id);
                      }}
                    >
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
