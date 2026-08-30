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

/** Customer-safe explanation of WHY a payment failed, mapped from the gateway
 *  result code. Never exposes raw gateway text to the shopper. */
export function payFailureReason(lang: string, code?: string | null): string | null {
  if (!code) return null;
  const L = (ar: string, en: string, ur: string, bn: string) =>
    lang === "ar" ? ar : lang === "ur" ? ur : lang === "bn" ? bn : en;

  // Benefit debit cards routed to AFS are auto-declined by risk screening.
  if (code === "100.400.142") {
    return L(
      "تم رفض العملية من نظام الحماية البنكي. إذا كنت تستخدم بطاقة بنفت (Benefit) فهي غير مدعومة في هذه البوابة — يرجى استخدام بطاقة فيزا أو ماستركارد أو وسيلة دفع أخرى.",
      "The payment was declined by the bank's security screening. If you used a Benefit debit card, it is not supported on this gateway — please use a Visa/Mastercard or another payment method.",
      "ادائیگی بینک کی سیکیورٹی اسکریننگ سے مسترد ہو گئی۔ اگر آپ نے Benefit ڈیبٹ کارڈ استعمال کیا تو وہ اس گیٹ وے پر نہیں چلتا — براہ کرم Visa/Mastercard یا کوئی اور طریقہ استعمال کریں۔",
      "ব্যাংকের নিরাপত্তা যাচাই পেমেন্টটি বাতিল করেছে। Benefit ডেবিট কার্ড এই গেটওয়েতে সমর্থিত নয় — অনুগ্রহ করে Visa/Mastercard বা অন্য পদ্ধতি ব্যবহার করুন।",
    );
  }
  // Issuer declines (insufficient funds, card blocked, expired...).
  if (/^(100\.|800\.1(?!20))/.test(code)) {
    return L(
      "رفض البنك المصدر للبطاقة العملية. تحقق من رصيد البطاقة وحدودها أو استخدم بطاقة أخرى.",
      "Your card issuer declined the payment. Check the card balance/limits or use a different card.",
      "آپ کے کارڈ جاری کرنے والے بینک نے ادائیگی مسترد کر دی۔ بیلنس/حدود چیک کریں یا دوسرا کارڈ استعمال کریں۔",
      "আপনার কার্ড ইস্যুকারী ব্যাংক পেমেন্ট বাতিল করেছে। ব্যালেন্স/লিমিট যাচাই করুন বা অন্য কার্ড ব্যবহার করুন।",
    );
  }
  // 3-D Secure / OTP failures.
  if (/^(000\.400\.0|100\.390|100\.380|100\.395|100\.396)/.test(code)) {
    return L(
      "فشل التحقق الثلاثي (رمز OTP). أعد المحاولة وأدخل الرمز المرسل إلى هاتفك بشكل صحيح.",
      "3-D Secure (OTP) verification failed. Try again and enter the code sent to your phone correctly.",
      "3-D Secure (OTP) تصدیق ناکام ہو گئی۔ دوبارہ کوشش کریں اور بھیجا گیا کوڈ درست درج کریں۔",
      "3-D Secure (OTP) যাচাই ব্যর্থ হয়েছে। আবার চেষ্টা করে ফোনে পাঠানো কোডটি সঠিকভাবে দিন।",
    );
  }
  // Invalid/expired checkout session or malformed transaction.
  if (/^(200\.|700\.|800\.4|800\.5|800\.7)/.test(code)) {
    return L(
      "انتهت صلاحية جلسة الدفع أو حدث خلل تقني مؤقت. أعد المحاولة — لم يتم خصم أي مبلغ.",
      "The payment session expired or a temporary technical issue occurred. Try again — you were not charged.",
      "ادائیگی کا سیشن ختم ہو گیا یا عارضی تکنیکی مسئلہ پیش آیا۔ دوبارہ کوشش کریں — کوئی رقم نہیں کٹی۔",
      "পেমেন্ট সেশনের মেয়াদ শেষ বা সাময়িক প্রযুক্তিগত সমস্যা হয়েছে। আবার চেষ্টা করুন — কোনো অর্থ কাটা হয়নি।",
    );
  }
  return null;
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
