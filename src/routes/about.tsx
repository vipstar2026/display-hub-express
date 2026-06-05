import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "من نحن — VIP STAR" },
      { name: "description", content: "VIP STAR Satellite & Electronics W.L.L — متجر متخصص في أنظمة IPTV وأطباق الاستقبال وكاميرات المراقبة في البحرين." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
        <h1 className="text-3xl font-extrabold text-foreground">من نحن</h1>
        <div className="mt-6 space-y-4 text-foreground leading-relaxed">
          <p>
            <strong>VIP STAR Satellite &amp; Electronics W.L.L</strong> هو متجر إلكتروني متخصص في
            بيع وتركيب أنظمة الاستقبال الفضائي (Dish)، باقات IPTV، أجهزة الاستقبال،
            كاميرات المراقبة (CCTV)، الكابلات والأسلاك، والإكسسوارات المتعلقة بها.
          </p>
          <p>
            نقدم خدمات التركيب والصيانة والدعم الفني للعملاء داخل مملكة البحرين وقطر،
            مع التزام كامل بالجودة والضمان وخدمة ما بعد البيع.
          </p>
          <div className="rounded-md border border-border bg-card p-4 mt-6">
            <h2 className="font-bold text-foreground mb-2">معلومات الشركة</h2>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>الاسم القانوني: VIP STAR Satellite &amp; Electronics W.L.L</li>
              <li>رقم السجل التجاري (CR): 158814-1</li>
              <li>الدولة: مملكة البحرين</li>
              <li>البريد الإلكتروني: pppahmed71@gmail.com</li>
              <li>الهاتف / واتساب: 1049 3316 / 2893 7708</li>
              <li>إنستغرام: @vipstar449</li>
            </ul>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
