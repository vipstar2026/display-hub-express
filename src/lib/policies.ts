/**
 * Legal / commercial policies required by the AFS payment gateway.
 * Content is stored per-language (ar / en). Non-Arabic UI languages fall back to English.
 */

export type PolicySection = { heading: string; body: string[] };
export type PolicyDoc = { title: string; intro?: string; sections: PolicySection[] };
export type PolicyKey = "terms" | "privacy" | "shipping" | "refund" | "exchange" | "cancellation";

export const COMPANY = {
  name_en: "VIP STAR Satellite & Electronics W.L.L",
  name_ar: "في آي بي ستار للستلايت والإلكترونيات ذ.م.م",
  cr: "CR-158814-1",
  address_en: "Building 62, Shop No 62, Block 935, Road 35, Riffa Alhajiyat, Bahrain",
  address_ar: "مبنى 62، محل رقم 62، مجمع 935، طريق 35، الرفاع الحجيات، مملكة البحرين",
  email: "pppahmed71@gmail.com",
  phone: "+973 77082893",
  whatsapp: "+973 33161049",
  currency: "BHD",
};

const EN: Record<PolicyKey, PolicyDoc> = {
  terms: {
    title: "Terms and Conditions",
    intro: `This website is operated by ${COMPANY.name_en} (${COMPANY.cr}). Throughout the site, the terms "we", "us" and "our" refer to ${COMPANY.name_en}. We offer this website, including all information, tools and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies and notices stated here.`,
    sections: [
      {
        heading: "Overview",
        body: [
          "By visiting our site and/or completing payments, you engage in our \"Service\" and agree to be bound by these Terms of Service, including any additional terms and policies referenced herein or available by hyperlink.",
          "These Terms apply to all users of the site, including browsers, vendors, customers and merchants. Please read them carefully before using our website. If you do not agree to all the terms and conditions of this agreement, you may not access the website or use any services.",
          "Any new features or tools added to the website shall also be subject to these Terms. We reserve the right to update, change or replace any part of these Terms by posting updates to this page; it is your responsibility to check this page periodically. Your continued use of the website constitutes acceptance of those changes.",
          "By agreeing to these Terms you represent that you are at least the age of majority in your country of residence, and that you have given us consent to allow any of your minor dependents to use this site.",
        ],
      },
      {
        heading: "Accuracy of information and payments",
        body: [
          "We reserve the right to refuse service to anyone for any reason at any time. Credit card information is always encrypted during transfer over networks.",
          "You agree to provide current, complete and accurate payment amounts and account information for all payments made on our website, and to promptly update your account details (email address, card number and expiry date) so that we can complete your transactions and contact you as needed.",
          "You agree not to reproduce, duplicate, copy, sell, resell or exploit any portion of the Service without our express written permission.",
        ],
      },
      {
        heading: "Prohibited uses",
        body: [
          "You are prohibited from using the site or its content: (a) for any unlawful purpose; (b) to solicit others to perform unlawful acts; (c) to violate any international, federal or local regulations, rules or laws; (d) to infringe upon our intellectual property rights or those of others; (e) to harass, abuse, insult, harm, defame, intimidate or discriminate; (f) to submit false or misleading information; (g) to upload viruses or malicious code; (h) to collect or track the personal information of others; (i) to spam, phish, pharm, pretext, spider, crawl or scrape; (j) for any obscene or immoral purpose; or (k) to interfere with or circumvent the security features of the Service.",
          "We reserve the right to terminate your use of the Service for violating any of the prohibited uses.",
        ],
      },
      {
        heading: "Governing law",
        body: [
          "These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of the Kingdom of Bahrain.",
          `Registered office: ${COMPANY.address_en}.`,
        ],
      },
      {
        heading: "Changes to Terms of Service",
        body: [
          "You can review the most current version of the Terms of Service at any time on this page. We reserve the right, at our sole discretion, to update, change or replace any part of these Terms by posting updates and changes to our website.",
        ],
      },
    ],
  },

  privacy: {
    title: "Privacy Policy",
    intro:
      "This Privacy Policy explains how information about you is collected, used and disclosed by your access to or use of this site, or otherwise as a result of your interactions with us. By visiting this site directly or through another site, you accept the terms of this Policy. We are not responsible for the content or privacy practices of any website not operated by us.",
    sections: [
      {
        heading: "Children's privacy",
        body: [
          "We respect children's privacy. We do not knowingly or intentionally collect personal information from children under the age of 18. If you are under 18, please do not submit any personal information to us and rely on a parent or guardian to assist you.",
        ],
      },
      {
        heading: "Information we collect automatically",
        body: [
          "Transaction information: when you complete a payment on the website we collect information about the transaction, such as the payment amount and the date and location of the transaction.",
          "Log information: the type of browser you use, access times, pages viewed, your IP address and the page you visited before navigating to this site.",
          "Device information: hardware model, operating system and version, unique device identifiers, mobile network information and browsing behaviour.",
          "Location information: approximate location each time you access this site, and precise location where you consent to it.",
          "Cookies and tracking technologies: we may use cookies, web beacons and similar technologies to collect information about your interaction with the site. Most browsers accept cookies by default; you can change your browser settings to remove or reject cookies.",
        ],
      },
      {
        heading: "Internal use of information",
        body: [
          "We use your personal information to process your payment and provide you with the service. We may internally use your personal information to improve this site's content and layout, to improve outreach and for our own marketing efforts, and to determine general marketplace information about visitors to this site.",
        ],
      },
      {
        heading: "External use and disclosure",
        body: [
          "We do not sell, rent, trade, license or otherwise disclose your specific personal information or financial information to anyone. Your information is processed in a secure manner.",
          "We may disclose information to third parties that perform specific functions on our behalf, and only the information necessary for them to perform their service. Card details are provided to financial-services corporations such as card processors and issuers as required to process your orders, using industry standard security measures including data encryption.",
          "We may disclose personal or financial information in response to requests from law enforcement officials, subpoenas, a court order, or where otherwise required by law, and where disclosure is necessary to protect our legal rights, enforce our Terms and Conditions, or reduce the risk of fraud.",
        ],
      },
      {
        heading: "Updates to this Policy",
        body: [
          "If we change or update this Privacy Policy, we will post the changes on this site so you are always aware of what information we collect, use and disclose. We encourage you to review this Policy from time to time.",
        ],
      },
    ],
  },

  shipping: {
    title: "Shipping & Delivery Policy",
    intro:
      "We deliver physical products across the Kingdom of Bahrain and internationally. Digital products (IPTV subscriptions, activation codes) are delivered electronically.",
    sections: [
      {
        heading: "Local delivery (Kingdom of Bahrain)",
        body: [
          `Cost: a flat delivery fee of BHD 15.000 applies. Orders above BHD 200.000 are delivered free of charge.`,
          "Timelines: orders confirmed before 4:00 PM are dispatched the same working day and delivered within 1–3 working days.",
          "Methods: local courier delivery to your address, or free pickup from our shop in Riffa Alhajiyat.",
        ],
      },
      {
        heading: "International delivery",
        body: [
          "Cost: calculated at checkout based on destination country and parcel weight; any customs duties or import taxes are payable by the customer.",
          "Timelines: 5–14 working days depending on destination and customs clearance.",
          "Methods: registered international courier (DHL / Aramex) with online tracking.",
        ],
      },
      {
        heading: "Digital products",
        body: [
          "IPTV subscriptions and activation codes are delivered by email and inside your account page immediately after payment is confirmed, and normally within a maximum of 24 hours.",
        ],
      },
      {
        heading: "Order tracking",
        body: [
          "Once your order is dispatched we send you a tracking number by email. You can also track any order at any time from the Track Order page using your order number and email address.",
        ],
      },
      {
        heading: "Return shipping cost",
        body: [
          "If the return or exchange is due to a defective, damaged or incorrect item, we cover the return shipping cost in full.",
          "If the return is for any other reason, the return shipping cost is borne by the customer and the original delivery fee is non-refundable.",
        ],
      },
    ],
  },

  refund: {
    title: "Refund Policy",
    sections: [
      {
        heading: "Is a refund allowed?",
        body: [
          "Yes. Physical products may be refunded within 7 days of delivery, provided the item is unused, in its original condition and complete with all packaging and accessories.",
          "Digital products (IPTV subscriptions, activation codes, licences) are non-refundable once the code has been delivered or activated, unless the code is proven faulty and cannot be replaced.",
        ],
      },
      {
        heading: "Method & procedure",
        body: [
          `Contact us by WhatsApp (${COMPANY.whatsapp}), phone (${COMPANY.phone}) or email (${COMPANY.email}) with your order number and the reason for the refund.`,
          "Our team reviews the request and, once approved, arranges collection of the item or asks you to return it to our shop.",
          "After the item is received and inspected, the refund is issued to the original payment method used at checkout. Refunds are never paid to a different card or account.",
        ],
      },
      {
        heading: "Terms & timelines",
        body: [
          "Refund requests must be submitted within 7 days from the delivery date.",
          "Items that are used, damaged by the customer, missing accessories, or sold as clearance items are not eligible for refund.",
          "Delivery charges are non-refundable unless the item was defective or incorrectly supplied.",
        ],
      },
      {
        heading: "How long does a refund take?",
        body: [
          "Approved refunds are processed by us within 3 working days of receiving and inspecting the item.",
          "The amount is credited back to your card or account by your bank within 7–14 working days, depending on the issuing bank.",
          `All refunds are made in ${COMPANY.currency}, for the amount actually paid.`,
        ],
      },
    ],
  },

  exchange: {
    title: "Exchange Policy",
    sections: [
      {
        heading: "Is an exchange allowed?",
        body: [
          "Yes. Products may be exchanged within 7 days of delivery when unused and in their original condition and packaging.",
          "Defective or incorrectly supplied items are exchanged free of charge, including shipping.",
        ],
      },
      {
        heading: "Method & procedure",
        body: [
          `Contact us by WhatsApp (${COMPANY.whatsapp}), phone (${COMPANY.phone}) or email (${COMPANY.email}) with your order number and the item you wish to exchange.`,
          "Bring the item to our shop or hand it to our courier together with the original invoice.",
          "After inspection we dispatch the replacement item, normally within 1–3 working days.",
        ],
      },
      {
        heading: "Terms & timelines",
        body: [
          "Exchange requests must be submitted within 7 days of delivery.",
          "The replacement item must be of equal or higher value, and each order may be exchanged once.",
          "Digital products and activation codes may only be exchanged when proven faulty.",
        ],
      },
      {
        heading: "Overpayment & underpayment",
        body: [
          "If the replacement item costs more than the original, the difference must be paid before the item is released.",
          "If the replacement item costs less, the difference is refunded to the original payment method within 7–14 working days.",
          "If you were charged twice or an incorrect amount was captured, the excess is refunded in full to the original payment method as soon as the transaction is verified.",
        ],
      },
    ],
  },

  cancellation: {
    title: "Cancellation Policy",
    sections: [
      {
        heading: "Is cancellation allowed?",
        body: [
          "Yes. An order may be cancelled free of charge at any time before it has been dispatched or, for digital products, before the code has been delivered.",
          "Once a physical order has been dispatched, or a digital code has been delivered or activated, the order can no longer be cancelled and the Refund Policy applies instead.",
        ],
      },
      {
        heading: "Method & procedure",
        body: [
          `Send a cancellation request by WhatsApp (${COMPANY.whatsapp}), phone (${COMPANY.phone}) or email (${COMPANY.email}), quoting your order number.`,
          "You will receive a written confirmation once the cancellation has been accepted and the refund initiated.",
        ],
      },
      {
        heading: "Terms & timelines",
        body: [
          "Cancellation requests are handled during our working hours and are confirmed within 24 hours.",
          "No cancellation fee is charged; the full amount paid is refunded.",
        ],
      },
      {
        heading: "How long does the refund take?",
        body: [
          "Cancelled orders are refunded to the original payment method within 3 working days of confirmation, and the amount appears in your account within 7–14 working days depending on your bank.",
        ],
      },
    ],
  },
};

const AR: Record<PolicyKey, PolicyDoc> = {
  terms: {
    title: "الشروط والأحكام",
    intro: `يُدار هذا الموقع من قِبل ${COMPANY.name_ar} (${COMPANY.cr}). تشير كلمات "نحن" و"لنا" في هذا الموقع إلى ${COMPANY.name_ar}. نقدّم لك هذا الموقع وكل ما يتضمنه من معلومات وأدوات وخدمات بشرط قبولك لكافة الشروط والأحكام والسياسات والإشعارات الواردة هنا.`,
    sections: [
      {
        heading: "نظرة عامة",
        body: [
          "بزيارتك للموقع و/أو إتمامك لعملية دفع فإنك تستخدم «الخدمة» وتوافق على الالتزام بهذه الشروط، بما فيها أي شروط وسياسات إضافية مشار إليها هنا أو عبر روابط.",
          "تنطبق هذه الشروط على جميع مستخدمي الموقع من زوار وعملاء وموردين وتجّار. يُرجى قراءتها بعناية قبل استخدام الموقع، وإذا لم توافق عليها فلا يجوز لك استخدام الموقع أو أي من خدماته.",
          "تخضع أي ميزات أو أدوات جديدة تُضاف إلى الموقع لهذه الشروط أيضاً. ونحتفظ بالحق في تحديث أو تغيير أو استبدال أي جزء منها بنشر التحديثات على هذه الصفحة، وتقع عليك مسؤولية مراجعتها دورياً، ويُعدّ استمرارك في استخدام الموقع قبولاً للتغييرات.",
          "بموافقتك على هذه الشروط فإنك تُقرّ بأنك بلغت سن الرشد في بلد إقامتك، وأنك منحتنا الموافقة على استخدام من تعولهم من القاصرين لهذا الموقع.",
        ],
      },
      {
        heading: "دقة المعلومات والمدفوعات",
        body: [
          "نحتفظ بالحق في رفض تقديم الخدمة لأي شخص ولأي سبب وفي أي وقت. وتُشفَّر بيانات البطاقات الائتمانية دائماً أثناء نقلها عبر الشبكات.",
          "توافق على تقديم مبالغ دفع وبيانات حساب صحيحة وكاملة ومحدّثة لكل عملية دفع على الموقع، وعلى تحديث بياناتك (البريد الإلكتروني ورقم البطاقة وتاريخ انتهائها) فوراً حتى نتمكن من إتمام معاملاتك والتواصل معك.",
          "توافق على عدم نسخ أو إعادة إنتاج أو بيع أو استغلال أي جزء من الخدمة دون إذن كتابي صريح منّا.",
        ],
      },
      {
        heading: "الاستخدامات المحظورة",
        body: [
          "يُحظر عليك استخدام الموقع أو محتواه: (أ) لأي غرض غير قانوني؛ (ب) لحث الآخرين على أفعال غير قانونية؛ (ج) لمخالفة أي أنظمة أو قوانين محلية أو دولية؛ (د) لانتهاك حقوق الملكية الفكرية لنا أو للغير؛ (هـ) للمضايقة أو الإساءة أو التشهير أو التمييز؛ (و) لتقديم معلومات كاذبة أو مضللة؛ (ز) لرفع فيروسات أو أكواد ضارة؛ (ح) لجمع أو تتبّع بيانات الآخرين؛ (ط) للتصيّد أو الرسائل المزعجة أو الزحف على البيانات؛ (ي) لأي غرض مُخل بالآداب؛ (ك) للتحايل على وسائل الأمان في الخدمة.",
          "نحتفظ بالحق في إنهاء استخدامك للخدمة عند مخالفة أي من هذه الاستخدامات المحظورة.",
        ],
      },
      {
        heading: "القانون الحاكم",
        body: [
          "تخضع هذه الشروط وأي اتفاقيات منفصلة نقدّم بموجبها خدماتنا لقوانين مملكة البحرين وتُفسَّر وفقاً لها.",
          `العنوان المسجّل: ${COMPANY.address_ar}.`,
        ],
      },
      {
        heading: "التعديلات على الشروط",
        body: [
          "يمكنك مراجعة أحدث نسخة من الشروط والأحكام في أي وقت على هذه الصفحة، ونحتفظ بحقنا المطلق في تحديث أو تغيير أو استبدال أي جزء منها بنشر التحديثات على الموقع.",
        ],
      },
    ],
  },

  privacy: {
    title: "سياسة الخصوصية",
    intro:
      "توضّح سياسة الخصوصية هذه كيفية جمع المعلومات الخاصة بك واستخدامها والإفصاح عنها نتيجة دخولك إلى هذا الموقع أو استخدامه أو تعاملك معنا. بزيارتك للموقع فإنك تقبل شروط هذه السياسة. ولسنا مسؤولين عن محتوى أو ممارسات الخصوصية في أي موقع لا ندير تشغيله.",
    sections: [
      {
        heading: "خصوصية الأطفال",
        body: [
          "نحترم خصوصية الأطفال ولا نجمع عن قصد أي بيانات شخصية من الأطفال دون سن 18 عاماً. وإذا كان عمرك أقل من 18 عاماً فيُرجى عدم إرسال أي بيانات شخصية إلينا والاستعانة بأحد الوالدين أو ولي الأمر.",
        ],
      },
      {
        heading: "المعلومات التي نجمعها تلقائياً",
        body: [
          "معلومات المعاملة: عند إتمام الدفع نجمع بيانات العملية مثل المبلغ وتاريخ ومكان المعاملة.",
          "معلومات السجل: نوع المتصفح وأوقات الدخول والصفحات التي تمت زيارتها وعنوان IP والصفحة التي زرتها قبل الوصول إلينا.",
          "معلومات الجهاز: طراز الجهاز ونظام التشغيل ومعرّفات الجهاز وبيانات شبكة الهاتف وسلوك التصفح.",
          "معلومات الموقع الجغرافي: الموقع التقريبي في كل زيارة، والموقع الدقيق عند موافقتك على ذلك.",
          "ملفات الارتباط وتقنيات التتبّع: قد نستخدم الكوكيز وتقنيات مشابهة لجمع معلومات عن تفاعلك مع الموقع، ويمكنك تعديل إعدادات متصفحك لرفضها أو حذفها.",
        ],
      },
      {
        heading: "الاستخدام الداخلي للمعلومات",
        body: [
          "نستخدم بياناتك الشخصية لمعالجة الدفع وتقديم الخدمة لك، وقد نستخدمها داخلياً لتحسين محتوى الموقع وتصميمه ولأغراضنا التسويقية ولمعرفة معلومات عامة عن زوار الموقع.",
        ],
      },
      {
        heading: "الإفصاح للغير",
        body: [
          "لا نبيع أو نؤجّر أو نتاجر أو نُفصح عن بياناتك الشخصية أو المالية لأي جهة، وتتم معالجة بياناتك بطريقة آمنة.",
          "قد نُفصح عن المعلومات لأطراف ثالثة تؤدي مهام محددة نيابةً عنّا، وبالقدر اللازم فقط لأداء خدمتهم. وتُزوَّد شركات الخدمات المالية ومعالجات البطاقات ببيانات البطاقة اللازمة لتنفيذ طلبك مع استخدام معايير أمان قياسية تشمل التشفير.",
          "قد نُفصح عن المعلومات استجابةً لطلبات الجهات الأمنية أو أوامر المحاكم أو عندما يقتضي القانون ذلك، أو عند الضرورة لحماية حقوقنا القانونية أو تطبيق شروطنا أو الحد من مخاطر الاحتيال.",
        ],
      },
      {
        heading: "تحديثات هذه السياسة",
        body: [
          "في حال تغيير أو تحديث سياسة الخصوصية سننشر التعديلات على الموقع لتبقى على اطلاع دائم بما نجمعه ونستخدمه ونُفصح عنه، وننصحك بمراجعتها من وقت لآخر.",
        ],
      },
    ],
  },

  shipping: {
    title: "سياسة الشحن والتوصيل",
    intro:
      "نوصّل المنتجات الفعلية داخل مملكة البحرين وخارجها، أمّا المنتجات الرقمية (اشتراكات IPTV وأكواد التفعيل) فتُسلَّم إلكترونياً.",
    sections: [
      {
        heading: "التوصيل المحلي (مملكة البحرين)",
        body: [
          "التكلفة: رسوم توصيل ثابتة قدرها 15.000 د.ب، والتوصيل مجاني للطلبات التي تتجاوز 200.000 د.ب.",
          "المدة: الطلبات المؤكدة قبل الساعة 4:00 مساءً تُشحن في نفس يوم العمل وتصل خلال 1–3 أيام عمل.",
          "الوسيلة: شركة توصيل محلية إلى عنوانك، أو الاستلام مجاناً من المحل في الرفاع الحجيات.",
        ],
      },
      {
        heading: "التوصيل الدولي",
        body: [
          "التكلفة: تُحتسب عند الدفع حسب الدولة ووزن الشحنة، ويتحمّل العميل أي رسوم جمركية أو ضرائب استيراد.",
          "المدة: من 5 إلى 14 يوم عمل حسب الوجهة وإجراءات التخليص الجمركي.",
          "الوسيلة: شركات شحن دولية مسجّلة (DHL / أرامكس) مع إمكانية التتبّع.",
        ],
      },
      {
        heading: "المنتجات الرقمية",
        body: [
          "تُرسَل اشتراكات IPTV وأكواد التفعيل عبر البريد الإلكتروني وتظهر في صفحة حسابك فور تأكيد الدفع، وخلال 24 ساعة كحد أقصى.",
        ],
      },
      {
        heading: "تتبّع الطلب",
        body: [
          "عند شحن طلبك نرسل لك رقم التتبّع عبر البريد الإلكتروني، ويمكنك أيضاً تتبّع أي طلب في أي وقت من صفحة «تتبع الطلب» باستخدام رقم الطلب والبريد الإلكتروني.",
        ],
      },
      {
        heading: "تكلفة شحن الإرجاع",
        body: [
          "إذا كان الإرجاع أو الاستبدال بسبب منتج تالف أو معيب أو مخالف للطلب فنحن نتحمّل تكلفة الشحن كاملة.",
          "أمّا في الحالات الأخرى فيتحمّل العميل تكلفة إعادة الشحن، ولا تُسترد رسوم التوصيل الأصلية.",
        ],
      },
    ],
  },

  refund: {
    title: "سياسة الاسترجاع واسترداد المبالغ",
    sections: [
      {
        heading: "هل الاسترجاع متاح؟",
        body: [
          "نعم، يمكن استرجاع المنتجات الفعلية خلال 7 أيام من تاريخ الاستلام بشرط أن يكون المنتج غير مستخدم وبحالته الأصلية مع كامل التغليف والملحقات.",
          "المنتجات الرقمية (اشتراكات IPTV وأكواد التفعيل والتراخيص) غير قابلة للاسترجاع بعد تسليم الكود أو تفعيله، إلا إذا ثبت أن الكود معطّل ولا يمكن استبداله.",
        ],
      },
      {
        heading: "الطريقة والإجراءات",
        body: [
          `تواصل معنا عبر واتساب (${COMPANY.whatsapp}) أو الهاتف (${COMPANY.phone}) أو البريد (${COMPANY.email}) مع ذكر رقم الطلب وسبب الاسترجاع.`,
          "يراجع فريقنا الطلب، وبعد الموافقة نرتّب استلام المنتج أو نطلب منك إحضاره إلى المحل.",
          "بعد استلام المنتج وفحصه يُعاد المبلغ إلى نفس وسيلة الدفع المستخدمة عند الشراء، ولا تتم إعادة المبالغ إلى بطاقة أو حساب آخر.",
        ],
      },
      {
        heading: "الشروط والمدد",
        body: [
          "يجب تقديم طلب الاسترجاع خلال 7 أيام من تاريخ الاستلام.",
          "لا تُقبل المنتجات المستخدمة أو التالفة بفعل العميل أو الناقصة الملحقات أو المباعة ضمن التصفيات.",
          "رسوم التوصيل غير قابلة للاسترداد إلا إذا كان المنتج معيباً أو مخالفاً للطلب.",
        ],
      },
      {
        heading: "كم تستغرق عملية الاسترداد؟",
        body: [
          "نعالج طلبات الاسترداد المعتمدة خلال 3 أيام عمل من استلام المنتج وفحصه.",
          "يظهر المبلغ في بطاقتك أو حسابك خلال 7 إلى 14 يوم عمل حسب البنك المُصدِر.",
          `تتم جميع عمليات الاسترداد بالدينار البحريني (${COMPANY.currency}) وبالمبلغ المدفوع فعلياً.`,
        ],
      },
    ],
  },

  exchange: {
    title: "سياسة الاستبدال",
    sections: [
      {
        heading: "هل الاستبدال متاح؟",
        body: [
          "نعم، يمكن استبدال المنتجات خلال 7 أيام من الاستلام بشرط أن تكون غير مستخدمة وبحالتها وتغليفها الأصلي.",
          "المنتجات المعيبة أو المخالفة للطلب تُستبدل مجاناً بما في ذلك تكاليف الشحن.",
        ],
      },
      {
        heading: "الطريقة والإجراءات",
        body: [
          `تواصل معنا عبر واتساب (${COMPANY.whatsapp}) أو الهاتف (${COMPANY.phone}) أو البريد (${COMPANY.email}) مع ذكر رقم الطلب والمنتج المطلوب استبداله.`,
          "أحضر المنتج إلى المحل أو سلّمه لمندوب الشحن مع الفاتورة الأصلية.",
          "بعد الفحص يتم إرسال المنتج البديل خلال 1–3 أيام عمل عادةً.",
        ],
      },
      {
        heading: "الشروط والمدد",
        body: [
          "يجب تقديم طلب الاستبدال خلال 7 أيام من تاريخ الاستلام.",
          "يجب أن يكون المنتج البديل بنفس القيمة أو أعلى، ويُسمح بعملية استبدال واحدة لكل طلب.",
          "لا تُستبدل المنتجات الرقمية وأكواد التفعيل إلا إذا ثبت عطلها.",
        ],
      },
      {
        heading: "حالات الدفع الزائد أو الناقص",
        body: [
          "إذا كان سعر المنتج البديل أعلى فيجب سداد الفرق قبل تسليمه.",
          "وإذا كان أقل فيُعاد الفرق إلى وسيلة الدفع الأصلية خلال 7 إلى 14 يوم عمل.",
          "في حال خصم المبلغ مرتين أو خصم مبلغ خاطئ، يُعاد الفرق كاملاً إلى وسيلة الدفع الأصلية فور التحقق من العملية.",
        ],
      },
    ],
  },

  cancellation: {
    title: "سياسة الإلغاء",
    sections: [
      {
        heading: "هل الإلغاء متاح؟",
        body: [
          "نعم، يمكن إلغاء الطلب مجاناً في أي وقت قبل شحنه، أو قبل تسليم الكود بالنسبة للمنتجات الرقمية.",
          "بعد شحن الطلب أو تسليم/تفعيل الكود الرقمي لا يمكن الإلغاء، وتُطبَّق سياسة الاسترجاع بدلاً من ذلك.",
        ],
      },
      {
        heading: "الطريقة والإجراءات",
        body: [
          `أرسل طلب الإلغاء عبر واتساب (${COMPANY.whatsapp}) أو الهاتف (${COMPANY.phone}) أو البريد (${COMPANY.email}) مع ذكر رقم الطلب.`,
          "ستصلك رسالة تأكيد كتابية بمجرد قبول الإلغاء وبدء إجراءات إعادة المبلغ.",
        ],
      },
      {
        heading: "الشروط والمدد",
        body: [
          "تُعالَج طلبات الإلغاء خلال ساعات العمل ويتم تأكيدها خلال 24 ساعة.",
          "لا تُفرض أي رسوم على الإلغاء، ويُعاد كامل المبلغ المدفوع.",
        ],
      },
      {
        heading: "كم يستغرق إرجاع المبلغ؟",
        body: [
          "تُعاد مبالغ الطلبات الملغاة إلى وسيلة الدفع الأصلية خلال 3 أيام عمل من التأكيد، ويظهر المبلغ في حسابك خلال 7 إلى 14 يوم عمل حسب البنك.",
        ],
      },
    ],
  },
};

export function getPolicy(key: PolicyKey, lang: string): PolicyDoc {
  return lang === "ar" ? AR[key] : EN[key];
}

export const POLICY_LINKS: { key: PolicyKey; to: string }[] = [
  { key: "terms", to: "/terms" },
  { key: "privacy", to: "/privacy" },
  { key: "shipping", to: "/shipping-policy" },
  { key: "refund", to: "/refund-policy" },
  { key: "exchange", to: "/exchange-policy" },
  { key: "cancellation", to: "/cancellation-policy" },
];
