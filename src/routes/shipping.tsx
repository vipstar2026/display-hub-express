import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "سياسة الشحن والتوصيل — VIP STAR" },
      { name: "description", content: "تفاصيل التوصيل المحلي والدولي، المدد الزمنية، تكلفة الشحن وتأكيد الدفع." },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
        <h1 className="text-3xl font-extrabold text-foreground">سياسة الشحن والتوصيل</h1>
        <div className="mt-6 space-y-5 text-foreground leading-relaxed text-[15px]">

          <h2 className="text-xl font-bold mt-2">1. طريقة التوصيل</h2>
          <p>
            يتم توصيل الطلبات داخل مملكة البحرين عبر مندوبي التوصيل الخاصين بالمتجر
            أو عبر شركات شحن معتمدة. أما الطلبات الدولية فيتم شحنها عبر شركات شحن
            دولية مثل Aramex وDHL.
          </p>

          <h2 className="text-xl font-bold mt-6">2. مدة التوصيل</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li><strong>التوصيل المحلي (داخل البحرين):</strong> من 1 إلى 3 أيام عمل من تأكيد الطلب.</li>
            <li><strong>التوصيل الدولي:</strong> من 5 إلى 10 أيام عمل حسب الدولة وشركة الشحن.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">3. تكلفة الشحن</h2>
          <p>
            تكلفة الشحن يتم حسابها وعرضها بوضوح أثناء عملية الدفع (Checkout) قبل
            تأكيد الطلب. التوصيل داخل البحرين قد يكون مجانيًا للطلبات التي تتجاوز
            قيمة معينة، ويتم إبلاغ العميل بذلك في سلة الشراء.
          </p>

          <h2 className="text-xl font-bold mt-6">4. تكلفة شحن الإرجاع</h2>
          <p>
            في حال إرجاع المنتج لأسباب لا تعود إلى عيب من المصنع أو خطأ من المتجر،
            <strong> يتحمل العميل تكلفة شحن الإرجاع</strong>. أما إذا كان الإرجاع بسبب
            عيب في المنتج أو خطأ في الشحن، فإن <strong>المتجر يتحمل تكلفة الإرجاع كاملة</strong>.
          </p>

          <h2 className="text-xl font-bold mt-6">5. تأكيد الدفع والطلب</h2>
          <p>
            يستلم العميل (حامل البطاقة) تأكيدًا بالدفع والطلب عبر <strong>البريد
            الإلكتروني</strong> المسجل لدينا، وكذلك عبر <strong>رسالة نصية SMS</strong> على
            الرقم المسجل، فور إتمام عملية الدفع بنجاح.
          </p>

          <h2 className="text-xl font-bold mt-6">6. تتبع الطلب</h2>
          <p>
            بعد شحن الطلب يتم إرسال رقم تتبع الشحنة عبر البريد الإلكتروني لتتمكن من
            متابعة حالة طلبك حتى الاستلام.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
