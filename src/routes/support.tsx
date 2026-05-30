import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { LifeBuoy, HelpCircle, Send, Clock, ShieldCheck, ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import heroImg from "@/assets/hero.jpg";


export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: "Help & Support — VIP STAR" },
      { name: "description", content: "Get help, open a support ticket, browse FAQs and contact our technical team 24/7." },
      { property: "og:title", content: "Help & Support — VIP STAR" },
      { property: "og:description", content: "Technical support, FAQs and live chat for VIP STAR customers." },
      { property: "og:image", content: heroImg },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [open, setOpen] = useState<number | null>(0);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: user?.email ?? "", problem_type: "", message: "" });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.from("support_tickets").insert({
      user_id: user?.id ?? null,
      name: form.name,
      email: form.email,
      problem_type: form.problem_type,
      message: form.message,
    });
    setSubmitting(false);
    if (error) { setError(error.message); return; }
    setSent(true);
  };

    { q: "كيف يمكنني تتبع طلبي؟", a: "يمكنك تتبع طلبك من صفحة \"طلباتي\" بعد تسجيل الدخول، أو عبر رابط التتبع المرسل في رسالة التأكيد." },
    { q: "ما هي طرق الدفع المتاحة؟", a: "ندعم البطاقات الائتمانية، Apple Pay، Google Pay، والدفع عند الاستلام داخل قطر." },
    { q: "كم تستغرق عملية التركيب؟", a: "التركيب القياسي يستغرق من 1 إلى 3 ساعات حسب نوع الخدمة (IPTV، Dish، CCTV)." },
    { q: "هل يوجد ضمان على المنتجات؟", a: "نعم، جميع المنتجات تشمل ضمان الوكيل الرسمي لمدة 12 شهرًا على الأقل." },
    { q: "كيف يمكنني إرجاع منتج؟", a: "يمكنك طلب الإرجاع خلال 7 أيام من الاستلام عبر تذكرة دعم أو الواتساب." },
  ];

  return (
    <PageShell>
      {/* Hero */}
      <section className="mx-auto max-w-7xl px-4 py-4">
        <div className="relative rounded-md overflow-hidden bg-gradient-brand h-[220px] md:h-[280px] shadow-card">
          <img src={heroImg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
          <div className="relative h-full p-6 md:p-10 flex flex-col justify-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur grid place-items-center">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <span className="text-xs uppercase tracking-[0.2em] opacity-80">Help Center</span>
            </div>
            <h1 className="mt-3 text-2xl md:text-4xl font-extrabold">المساعدة والدعم الفني</h1>
            <p className="mt-2 text-sm md:text-base text-white/90 max-w-2xl">
              فريقنا متاح على مدار الساعة للإجابة على استفساراتك وحل مشاكلك التقنية بسرعة واحترافية.
            </p>
          </div>
        </div>
      </section>

      {/* Quick channels */}
      <section className="mx-auto max-w-7xl px-4 mt-6 grid gap-4 md:grid-cols-3">
        {channels.map((c) => (
          <a
            key={c.title}
            href={c.href}
            target="_blank"
            rel="noreferrer"
            className="group bg-card rounded-md border border-border shadow-card p-5 flex items-center gap-4 hover:border-brand hover:shadow-lg transition-smooth"
          >
            <div className={`w-12 h-12 rounded-full ${c.color} grid place-items-center text-white shrink-0`}>
              <c.icon className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{c.title}</div>
              <div className="text-base font-bold text-foreground group-hover:text-brand transition-smooth">{c.desc}</div>
            </div>
          </a>
        ))}
      </section>

      {/* Status strip */}
      <section className="mx-auto max-w-7xl px-4 mt-4">
        <div className="bg-card rounded-md border border-border shadow-card p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-foreground">جميع الخدمات تعمل بشكل طبيعي</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> متوسط الرد: 5 دقائق</span>
            <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" /> دعم آمن ومشفّر</span>
          </div>
        </div>
      </section>

      {/* FAQ + Ticket form */}
      <section className="mx-auto max-w-7xl px-4 mt-6 mb-12 grid gap-5 md:grid-cols-5">
        {/* FAQ */}
        <div className="md:col-span-3 bg-card rounded-md border border-border shadow-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-foreground">الأسئلة الشائعة</h2>
          </div>
          <div className="divide-y divide-border">
            {faqs.map((f, i) => (
              <div key={i} className="py-3">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between text-start gap-3"
                >
                  <span className="font-semibold text-foreground">{f.q}</span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open === i ? "rotate-180" : ""}`} />
                </button>
                {open === i && <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>

        {/* Ticket form */}
        <form
          onSubmit={submit}
          className="md:col-span-2 bg-card rounded-md border border-border shadow-card p-5 space-y-3 h-fit"
        >
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-brand" />
            <h2 className="text-lg font-bold text-foreground">فتح تذكرة دعم</h2>
          </div>
          {sent ? (
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4 text-sm text-emerald-700 dark:text-emerald-300">
              تم استلام تذكرتك ✅ سيتواصل معك فريق الدعم خلال 24 ساعة.
            </div>
          ) : (
            <>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم الكامل" className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground outline-none focus:border-brand transition-smooth" />
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="البريد الإلكتروني" className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground outline-none focus:border-brand transition-smooth" />
              <select required value={form.problem_type} onChange={(e) => setForm({ ...form, problem_type: e.target.value })} className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground outline-none focus:border-brand transition-smooth">
                <option value="">اختر نوع المشكلة</option>
                <option>مشكلة في الطلب</option>
                <option>مشكلة تقنية في الجهاز</option>
                <option>استفسار عن الفاتورة</option>
                <option>طلب تركيب أو صيانة</option>
                <option>أخرى</option>
              </select>
              <textarea required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="اشرح المشكلة بالتفصيل..." className="w-full px-3 py-2.5 rounded-md border border-border bg-background text-foreground outline-none focus:border-brand transition-smooth" />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <button type="submit" disabled={submitting} className="w-full h-11 rounded-md bg-brand hover:bg-brand-dark text-white font-semibold transition-smooth disabled:opacity-60 flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "جاري الإرسال..." : "إرسال التذكرة"}
              </button>
              <p className="text-xs text-muted-foreground text-center">
                أو تواصل مباشرة عبر <Link to="/contact" className="text-brand hover:underline">صفحة الاتصال</Link>
              </p>
            </>
          )}
        </form>

      </section>
    </PageShell>
  );
}
