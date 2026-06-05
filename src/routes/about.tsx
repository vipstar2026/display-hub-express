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
            <h2 className="font-bold text-foreground mb-2">معلومات الشركة (السجل التجاري)</h2>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>الاسم التجاري: VIP STAR SATELITE AND ELECTRONICS W.L.L</li>
              <li>الاسم بالعربية: في اي بي ستار للستلايت و للالكترونيات ذ.م.م</li>
              <li>نوع القيد: شركة ذات مسئولية محدودة (With Limited Liability Company)</li>
              <li>رقم السجل التجاري (CR): 158814-1</li>
              <li>حالة القيد: نشطة (ACTIVE)</li>
              <li>تاريخ القيد: 27/10/2022</li>
              <li>تاريخ الاستحقاق: 27/10/2026</li>
              <li>الجهة المُصدِرة: وزارة الصناعة والتجارة — مملكة البحرين</li>
            </ul>
          </div>

          <div className="rounded-md border border-border bg-card p-4 mt-4">
            <h2 className="font-bold text-foreground mb-2">العنوان التجاري</h2>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>المنطقة: الرفاع / الحجيات (RIFFA / ALHAJIYAT)</li>
              <li>مجمع (Block): 935</li>
              <li>طريق (Road): 35</li>
              <li>مبنى (Building): 62</li>
              <li>رقم المحل (Flat/Shop No.): 0</li>
              <li>صندوق بريد (P.O. Box): 679304</li>
              <li>الدولة: مملكة البحرين</li>
            </ul>
          </div>

          <div className="rounded-md border border-border bg-card p-4 mt-4">
            <h2 className="font-bold text-foreground mb-2">الأنشطة المرخّصة</h2>
            <ul className="list-disc pr-6 text-sm space-y-1 text-muted-foreground">
              <li>تجارة/بيع الأجهزة الكهربائية والإلكترونية المنزلية</li>
              <li>إصلاح المعدات الإلكترونية الاستهلاكية</li>
              <li>تجارة/بيع معدات المعلومات والاتصالات بالتجزئة</li>
            </ul>
          </div>

          <div className="rounded-md border border-border bg-card p-4 mt-4">
            <h2 className="font-bold text-foreground mb-2">التواصل</h2>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li>الهاتف / واتساب: 1049 3316 / 2893 7708</li>
              <li>البريد الإلكتروني: pppahmed71@gmail.com</li>
              <li>إنستغرام: @vipstar449</li>
            </ul>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
