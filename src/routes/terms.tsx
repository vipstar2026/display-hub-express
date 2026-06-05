import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/PageShell";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "الشروط والأحكام — VIP STAR" },
      { name: "description", content: "الشروط والأحكام الخاصة باستخدام موقع VIP STAR والشراء منه." },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PageShell>
      <section className="mx-auto max-w-3xl px-4 py-10" dir="rtl">
        <h1 className="text-3xl font-extrabold text-foreground">الشروط والأحكام</h1>
        <div className="mt-6 space-y-5 text-foreground leading-relaxed text-[15px]">
          <p>
            باستخدامك لموقع VIP STAR فإنك توافق على الالتزام بالشروط والأحكام التالية.
            يحتفظ المتجر بحق تعديل أو تحديث هذه الشروط في أي وقت دون إشعار مسبق،
            ويسري التعديل فور نشره على الموقع.
          </p>

          <h2 className="text-xl font-bold mt-6">1. حساب المستخدم</h2>
          <p>
            المستخدم هو المسؤول الوحيد عن المحافظة على سرية بيانات حسابه وكلمة المرور،
            وعن جميع الأنشطة التي تتم من خلال حسابه. يجب إبلاغنا فورًا عند أي استخدام
            غير مصرح به للحساب.
          </p>

          <h2 className="text-xl font-bold mt-6">2. حقوق الملكية الفكرية</h2>
          <p>
            جميع المحتويات على الموقع من نصوص وصور وشعارات وعلامات تجارية هي ملك حصري
            لـ VIP STAR أو لمالكيها الأصليين، ولا يجوز نسخها أو إعادة استخدامها دون
            إذن خطي مسبق.
          </p>

          <h2 className="text-xl font-bold mt-6">3. الأسعار والمنتجات</h2>
          <p>
            نسعى لعرض أسعار ومواصفات دقيقة لجميع المنتجات. في حال وجود خطأ في السعر أو
            التوفر، يحق لنا إلغاء الطلب وإبلاغ العميل بذلك ورد المبلغ بالكامل.
          </p>

          <h2 className="text-xl font-bold mt-6">4. القانون الحاكم</h2>
          <p>
            تخضع هذه الشروط وتُفسَّر وفقًا لقوانين مملكة البحرين، وتختص محاكم مملكة
            البحرين بالنظر في أي نزاع ينشأ عنها.
          </p>

          <h2 className="text-xl font-bold mt-6">5. إخلاء المسؤولية والضمان</h2>
          <p>
            يتم تقديم الموقع وخدماته "كما هي"، ونحن غير مسؤولين عن أي أضرار غير
            مباشرة أو تبعية ناتجة عن استخدام الموقع. الضمان على المنتجات يقتصر على
            ضمان الوكيل الرسمي المرفق مع كل منتج.
          </p>

          <h2 className="text-xl font-bold mt-6">6. الدول المحظورة</h2>
          <p>
            لا يتم تقديم أي خدمات أو منتجات إلى الأفراد أو الكيانات الموجودة في الدول
            الخاضعة لعقوبات مكتب مراقبة الأصول الأجنبية (OFAC) أو الدول المحظورة دوليًا.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
