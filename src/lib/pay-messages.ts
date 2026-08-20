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
