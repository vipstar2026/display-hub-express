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

  // BENEFIT Payment Gateway returns words, not OPPWA numeric codes.
  const word = code.trim().toUpperCase();
  if (word === "CANCELED" || word === "CANCELLED") {
    return L(
      "تم إلغاء العملية من صفحة الدفع. لم يتم خصم أي مبلغ — يمكنك إعادة المحاولة.",
      "The payment was cancelled on the gateway page. You were not charged — you can try again.",
      "ادائیگی منسوخ کر دی گئی۔ کوئی رقم نہیں کٹی — دوبارہ کوشش کریں۔",
      "পেমেন্ট বাতিল করা হয়েছে। কোনো অর্থ কাটা হয়নি — আবার চেষ্টা করুন।",
    );
  }
  if (word === "NOT CAPTURED") {
    return L(
      "رفض البنك المصدر للبطاقة العملية. تحقق من الرصيد أو صلاحية البطاقة أو الرمز السري، أو استخدم بطاقة أخرى.",
      "Your card issuer declined the payment. Check the balance, card validity or PIN, or use a different card.",
      "بینک نے ادائیگی مسترد کر دی۔ بیلنس، کارڈ کی میعاد یا PIN چیک کریں یا دوسرا کارڈ استعمال کریں۔",
      "ব্যাংক পেমেন্ট বাতিল করেছে। ব্যালেন্স, কার্ডের মেয়াদ বা PIN যাচাই করুন বা অন্য কার্ড ব্যবহার করুন।",
    );
  }
  if (word.includes("DENIED BY RISK")) {
    return L(
      "تم إيقاف العملية مؤقتاً من نظام الحماية بسبب تكرار المحاولات. انتظر بضع دقائق ثم أعد المحاولة.",
      "The transaction was blocked by risk screening after repeated attempts. Please wait a few minutes and try again.",
      "بار بار کوششوں کے باعث سیکیورٹی نے لین دین روک دیا۔ چند منٹ بعد دوبارہ کوشش کریں۔",
      "বারবার চেষ্টার কারণে নিরাপত্তা ব্যবস্থা লেনদেন আটকে দিয়েছে। কয়েক মিনিট পরে আবার চেষ্টা করুন।",
    );
  }
  if (word.includes("HOST TIMEOUT") || word === "TIMEOUT") {
    return L(
      "انتهت مهلة الاتصال بالبنك ولم يتم خصم أي مبلغ. أعد المحاولة.",
      "The connection to the bank timed out and you were not charged. Please try again.",
      "بینک سے رابطہ ٹائم آؤٹ ہو گیا اور کوئی رقم نہیں کٹی۔ دوبارہ کوشش کریں۔",
      "ব্যাংকের সাথে সংযোগ টাইম আউট হয়েছে, কোনো অর্থ কাটা হয়নি। আবার চেষ্টা করুন।",
    );
  }


  // Benefit debit cards routed to AFS are auto-declined by risk screening.
  if (code === "100.400.142") {
    return L(
      "تم رفض العملية من نظام الحماية البنكي. إذا كنت تستخدم بطاقة بنفت (Benefit) فهي غير مدعومة في هذه البوابة — يرجى استخدام بطاقة فيزا أو ماستركارد أو وسيلة دفع أخرى.",
      "The payment was declined by the bank's security screening. If you used a Benefit debit card, it is not supported on this gateway — please use a Visa/Mastercard or another payment method.",
      "ادائیگی بینک کی سیکیورٹی اسکریننگ سے مسترد ہو گئی۔ اگر آپ نے Benefit ڈیبٹ کارڈ استعمال کیا تو وہ اس گیٹ وے پر نہیں چلتا — براہ کرم Visa/Mastercard یا کوئی اور طریقہ استعمال کریں۔",
      "ব্যাংকের নিরাপত্তা যাচাই পেমেন্টটি বাতিল করেছে। Benefit ডেবিট কার্ড এই গেটওয়েতে সমর্থিত নয় — অনুগ্রহ করে Visa/Mastercard বা অন্য পদ্ধতি ব্যবহার করুন।",
    );
  }
  // Technical failures inside the 3-D Secure / bank authentication system.
  // These are NOT a wrong OTP — telling the customer to re-enter the code is
  // misleading, so they must be handled before the OTP branch below.
  if (/^(100\.390\.10[1-7]|100\.390\.11[1-5]|100\.395\.502)/.test(code)) {
    return L(
      "حدث خلل تقني في نظام التحقق الآمن (3-D Secure) لدى البنك ولم يتم خصم أي مبلغ. أعد المحاولة بعد قليل أو استخدم بطاقة أخرى.",
      "A technical error occurred in the bank's 3-D Secure system and you were not charged. Please try again shortly or use a different card.",
      "بینک کے 3-D Secure سسٹم میں تکنیکی خرابی ہوئی اور کوئی رقم نہیں کٹی۔ تھوڑی دیر بعد دوبارہ کوشش کریں یا دوسرا کارڈ استعمال کریں۔",
      "ব্যাংকের 3-D Secure সিস্টেমে কারিগরি ত্রুটি হয়েছে, কোনো অর্থ কাটা হয়নি। কিছুক্ষণ পরে আবার চেষ্টা করুন বা অন্য কার্ড ব্যবহার করুন।",
    );
  }
  // 3-D Secure / OTP failures. Must run BEFORE the generic issuer-decline
  // branch — 100.38x/100.39x codes also start with "100." and would otherwise
  // be misreported as a balance/limit decline instead of an OTP retry.
  if (/^(000\.400\.0|100\.390|100\.380|100\.395|100\.396)/.test(code)) {

    return L(
      "فشل التحقق الثلاثي (رمز OTP). أعد المحاولة وأدخل الرمز المرسل إلى هاتفك بشكل صحيح.",
      "3-D Secure (OTP) verification failed. Try again and enter the code sent to your phone correctly.",
      "3-D Secure (OTP) تصدیق ناکام ہو گئی۔ دوبارہ کوشش کریں اور بھیجا گیا کوڈ درست درج کریں۔",
      "3-D Secure (OTP) যাচাই ব্যর্থ হয়েছে। আবার চেষ্টা করে ফোনে পাঠানো কোডটি সঠিকভাবে দিন।",
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
