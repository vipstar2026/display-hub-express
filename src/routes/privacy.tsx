import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "سياسة الخصوصية — VIP STAR" },
      { name: "description", content: "كيف نجمع ونستخدم ونحمي بياناتك الشخصية في VIP STAR." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
        <h1 className="text-3xl font-extrabold text-foreground">سياسة الخصوصية</h1>
        <div className="mt-6 space-y-5 text-foreground leading-relaxed text-[15px]">
          <p>
            تحترم VIP STAR خصوصية عملائها وتلتزم بحماية بياناتهم الشخصية وفقًا
            لأفضل الممارسات والمعايير المعمول بها في مملكة البحرين.
          </p>

          <h2 className="text-xl font-bold mt-6">1. البيانات التي نجمعها</h2>
          <ul className="list-disc pr-6 space-y-1">
            <li>المعلومات الشخصية: الاسم، البريد الإلكتروني، رقم الهاتف، عنوان التوصيل.</li>
            <li>بيانات الطلب والدفع (تتم معالجة الدفع عبر بوابات دفع آمنة ومشفّرة، ولا نخزّن بيانات البطاقات الائتمانية على خوادمنا).</li>
            <li>بيانات الاستخدام وملفات تعريف الارتباط (Cookies) لتحسين تجربة التصفح.</li>
          </ul>

          <h2 className="text-xl font-bold mt-6">2. كيفية استخدام البيانات</h2>
          <p>
            نستخدم بياناتك لتنفيذ الطلبات وتوصيلها، وللتواصل بخصوص الطلب أو الدعم
            الفني، ولتحسين خدماتنا وتجربة المستخدم على الموقع.
          </p>

          <h2 className="text-xl font-bold mt-6">3. حماية البيانات</h2>
          <p>
            يتم تخزين بياناتك على خوادم آمنة وتُعالَج بطريقة مشفّرة. <strong>لا نقوم
            بمشاركة أو بيع بيانات المستخدمين لأي طرف ثالث</strong>، ولا تُستخدم بياناتك
            إلا للأغراض الموضحة في هذه السياسة.
          </p>

          <h2 className="text-xl font-bold mt-6">4. القاصرون</h2>
          <p>
            خدمات الموقع موجهة للأشخاص البالغين 18 عامًا فأكثر. لا نقوم عن قصد بجمع
            بيانات من الأطفال القاصرين، وفي حال علمنا بذلك يتم حذف هذه البيانات فورًا.
          </p>

          <h2 className="text-xl font-bold mt-6">5. ملفات تعريف الارتباط</h2>
          <p>
            نستخدم ملفات Cookies لتذكر تفضيلاتك وتحسين أداء الموقع. يمكنك تعطيلها من
            إعدادات المتصفح، لكن قد يؤثر ذلك على بعض ميزات الموقع.
          </p>

          <h2 className="text-xl font-bold mt-6">6. حقوقك</h2>
          <p>
            يحق لك طلب الاطلاع على بياناتك أو تعديلها أو حذفها بالتواصل معنا عبر
            البريد الإلكتروني: pppahmed71@gmail.com.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
