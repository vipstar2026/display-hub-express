/** Customer-safe payment initialization failure message.
 *  Gateway diagnostics stay server-side. */
export function payInitMessage(lang: string) {
  return lang === "ar"
    ? "تعذر تهيئة عملية الدفع. يرجى المحاولة مرة أخرى."
    : lang === "ur"
      ? "ادائیگی شروع نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔"
      : lang === "bn"
        ? "পেমেন্ট শুরু করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
        : "Unable to initialize the payment. Please try again.";
}

/** Customer-safe payment result message. Never surfaces gateway text/codes. */
export function payResultMessage(lang: string, pending: boolean) {
  if (pending) {
    return lang === "ar"
      ? "لم يتم تأكيد الدفع بعد. سنحدّث حالة طلبك تلقائيًا خلال دقائق."
      : lang === "ur"
        ? "ادائیگی ابھی تصدیق نہیں ہوئی۔ آپ کے آرڈر کی حالت خودکار طور پر اپ ڈیٹ ہوگی۔"
        : lang === "bn"
          ? "পেমেন্ট এখনও নিশ্চিত হয়নি। আপনার অর্ডারের অবস্থা স্বয়ংক্রিয়ভাবে আপডেট হবে।"
          : "Your payment is not confirmed yet. We will update your order automatically.";
  }
  return lang === "ar"
    ? "لم تكتمل عملية الدفع ولم يتم خصم أي مبلغ. يرجى المحاولة مرة أخرى."
    : lang === "ur"
      ? "ادائیگی مکمل نہیں ہوئی اور کوئی رقم نہیں کاٹی گئی۔ براہ کرم دوبارہ کوشش کریں۔"
      : lang === "bn"
        ? "পেমেন্ট সম্পন্ন হয়নি এবং কোনো অর্থ কাটা হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।"
        : "The payment did not go through and you have not been charged. Please try again.";
}
