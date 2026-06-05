import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/exchange")({
  head: () => ({
    meta: [
      { title: "سياسة الاستبدال — VIP STAR" },
      { name: "description", content: "شروط ومدد استبدال المنتجات وتكاليف الشحن المرتبطة." },
    ],
  }),
  component: ExchangePage,
});

function ExchangePage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
        <h1 className="text-3xl font-extrabold text-foreground">سياسة الاستبدال</h1>
        <div className="mt-6 space-y-5 text-foreground leading-relaxed text-[15px]">

          <h2 className="text-xl font-bold mt-2">1. هل الاستبدال مسموح؟</h2>
          <p>
            نعم، الاستبدال مسموح خلال <strong>7 أيام</strong> من تاريخ الاستلام، بشرط
            أن يكون المنتج في حالته الأصلية، غير مستخدم، وبكامل ملحقاته وعلبته الأصلية.
          </p>

          <h2 className="text-xl font-bold mt-6">2. المدة الزمنية</h2>
          <p>
            يتم تنفيذ عملية الاستبدال خلال <strong>3 إلى 7 أيام عمل</strong> من استلامنا
            للمنتج الأصلي، حسب توفر المنتج البديل في المخزون.
          </p>

          <h2 className="text-xl font-bold mt-6">3. من يتحمل تكلفة الشحن؟</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>إذا كان الاستبدال بسبب عيب في المنتج أو خطأ من المتجر: <strong>المتجر يتحمل كامل تكاليف الشحن</strong> (الإرجاع والاستبدال).</li>
            <li>إذا كان الاستبدال لرغبة شخصية (تغيير الموديل أو اللون): <strong>العميل يتحمل تكاليف شحن الإرجاع والاستبدال</strong>.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">4. شروط إضافية</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>إذا كان سعر المنتج البديل أعلى، يدفع العميل الفرق.</li>
            <li>إذا كان السعر أقل، يتم استرداد الفرق عبر وسيلة الدفع الأصلية.</li>
            <li>المنتجات الرقمية (اشتراكات IPTV المفعّلة) غير قابلة للاستبدال.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">5. كيفية طلب الاستبدال</h2>
          <p>
            تواصل معنا عبر صفحة الدعم أو على البريد pppahmed71@gmail.com مع ذكر رقم
            الطلب والمنتج البديل المطلوب.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
