import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/refund")({
  head: () => ({
    meta: [
      { title: "سياسة الإرجاع والاسترداد — VIP STAR" },
      { name: "description", content: "الشروط والمدة وآلية استرداد المبالغ عند إرجاع المنتجات." },
    ],
  }),
  component: RefundPage,
});

function RefundPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
        <h1 className="text-3xl font-extrabold text-foreground">سياسة الإرجاع والاسترداد</h1>
        <div className="mt-6 space-y-5 text-foreground leading-relaxed text-[15px]">
          <p>
            نحرص في VIP STAR على رضا عملائنا، ونوفر سياسة إرجاع واسترداد واضحة
            وعادلة وفقًا للشروط التالية:
          </p>

          <h2 className="text-xl font-bold mt-6">1. هل الإرجاع مسموح؟</h2>
          <p>
            نعم، يمكن للعميل طلب إرجاع المنتج خلال <strong>7 أيام</strong> من تاريخ
            الاستلام، بشرط أن يكون المنتج في حالته الأصلية، غير مستخدم، وداخل علبته
            الأصلية وبكامل ملحقاته.
          </p>

          <h2 className="text-xl font-bold mt-6">2. تكلفة الإرجاع</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>إذا كان الإرجاع بسبب عيب في المنتج أو خطأ من المتجر: المتجر يتحمل كامل تكلفة الشحن.</li>
            <li>إذا كان الإرجاع لرغبة شخصية: العميل يتحمل تكلفة شحن الإرجاع.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">3. مدة استرداد المبلغ</h2>
          <p>
            يتم استرداد المبلغ خلال <strong>7 إلى 14 يوم عمل</strong> من استلامنا للمنتج
            المرتجع والتأكد من حالته.
          </p>

          <h2 className="text-xl font-bold mt-6">4. طريقة الاسترداد</h2>
          <p>
            <strong>يتم استرداد المبلغ عبر نفس وسيلة الدفع الأصلية فقط</strong>
            (بطاقة ائتمانية، تحويل بنكي، إلخ). لا يمكن استرداد المبلغ بطريقة دفع
            مختلفة عن التي تم الدفع بها.
          </p>

          <h2 className="text-xl font-bold mt-6">5. المنتجات غير القابلة للإرجاع</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>اشتراكات IPTV الرقمية بعد تفعيلها.</li>
            <li>المنتجات التي تم تركيبها أو تم فك أختامها.</li>
            <li>الكابلات والأسلاك التي تم قصها حسب الطلب.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">6. كيفية طلب الإرجاع</h2>
          <p>
            تواصل معنا عبر صفحة الدعم الفني أو على البريد pppahmed71@gmail.com مع
            ذكر رقم الطلب وسبب الإرجاع، وسيقوم فريقنا بإرشادك لخطوات الإرجاع.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
