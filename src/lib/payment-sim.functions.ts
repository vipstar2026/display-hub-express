import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SimStep = {
  key: string;
  label_en: string;
  label_ar: string;
  ok: boolean;
  detail: string;
};

/** End-to-end simulation of the online-payment purchase flow (admin only).
 *  Creates a real order flagged as a simulation, drives it through the same
 *  code paths a card payment uses, then verifies fulfilment side-effects. */
export const runPaymentSimulation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { scenario: "success" | "failed" | "pending"; product_id?: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!isAdmin) throw new Error("Forbidden");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const steps: SimStep[] = [];
    const push = (key: string, label_en: string, label_ar: string, ok: boolean, detail: string) =>
      steps.push({ key, label_en, label_ar, ok, detail });

    // 1) Product
    let product;
    {
      const q = supabaseAdmin
        .from("products")
        .select("id, name_en, name_ar, price, stock, track_stock, type")
        .eq("status", "active");
      const { data: rows } = data.product_id
        ? await q.eq("id", data.product_id).limit(1)
        : await q.limit(1);
      product = rows?.[0];
    }
    if (!product) {
      push("product", "Pick a product", "اختيار منتج", false, "No active product found");
      return { steps, order_id: null as string | null };
    }
    push("product", "Pick a product", "اختيار منتج", true, `${product.name_en} — ${product.price}`);

    // 2) Settings / VAT
    const { data: settings } = await supabaseAdmin
      .from("site_settings")
      .select("vat_percent, prices_include_vat, default_currency")
      .eq("id", 1)
      .maybeSingle();
    const vat = Number(settings?.vat_percent ?? 0);
    const currency = settings?.default_currency || "BHD";
    const subtotal = Number(product.price);
    const tax = vat
      ? settings?.prices_include_vat
        ? Number(((subtotal * vat) / (100 + vat)).toFixed(3))
        : Number(((subtotal * vat) / 100).toFixed(3))
      : 0;
    const total = settings?.prices_include_vat ? subtotal : Number((subtotal + tax).toFixed(3));
    push("totals", "Calculate totals & VAT", "احتساب الإجمالي والضريبة", true, `${subtotal} + VAT ${tax} = ${total} ${currency}`);

    const stockBefore = Number(product.stock);

    // 3) Order + items (same shape the cart creates)
    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        buyer_id: context.userId,
        buyer_email: (context.claims as { email?: string })?.email ?? "simulation@vipstar.cc",
        buyer_name: "Payment Simulation",
        subtotal,
        discount: 0,
        tax,
        shipping: 0,
        shipping_cost: 0,
        total,
        currency,
        status: "pending",
        payment_status: "pending",
        channel: "simulation",
        admin_notes: "SIMULATION — created by the payment sandbox",
      })
      .select("id, order_number, total")
      .single();
    if (orderErr || !order) {
      push("order", "Create order", "إنشاء الطلب", false, orderErr?.message ?? "failed");
      return { steps, order_id: null as string | null };
    }
    push("order", "Create order", "إنشاء الطلب", true, order.order_number);

    const { error: itemErr } = await supabaseAdmin.from("order_items").insert({
      order_id: order.id,
      product_id: product.id,
      product_name: product.name_en,
      product_type: product.type,
      unit_price: subtotal,
      quantity: 1,
      total: subtotal,
    });
    push("items", "Add order items", "إضافة عناصر الطلب", !itemErr, itemErr?.message ?? "1 item");

    // 4) Gateway attempt row (mirrors createAfsCheckout)
    const fakeCheckoutId = `SIM-${Math.random().toString(36).slice(2, 12)}`;
    await supabaseAdmin.from("payment_transactions").insert({
      order_id: order.id,
      provider: "afs",
      provider_charge_id: fakeCheckoutId,
      amount: total,
      currency,
      status: "pending",
    });
    push("checkout", "Open gateway checkout", "فتح صفحة الدفع", true, fakeCheckoutId);

    // 5) Simulated gateway result → identical updates to the real webhook
    const success = data.scenario === "success";
    const pending = data.scenario === "pending";
    const code = success ? "000.100.110" : pending ? "000.200.000" : "800.100.152";
    await supabaseAdmin
      .from("payment_transactions")
      .update({
        status: success ? "succeeded" : pending ? "pending" : "failed",
        payment_method: "VISA",
        failure_reason: success ? null : pending ? null : "Simulated decline",
        paid_at: success ? new Date().toISOString() : null,
        raw_response: { simulated: true, result: { code } } as never,
      })
      .eq("order_id", order.id)
      .eq("provider_charge_id", fakeCheckoutId);

    if (success) {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "succeeded",
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: "AFS (simulated)",
          payment_reference: fakeCheckoutId,
        })
        .eq("id", order.id);
    } else if (!pending) {
      await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    }
    push("result", "Gateway result", "نتيجة البوابة", true, `${data.scenario} (${code})`);

    // 6) Verify fulfilment side-effects
    if (success) {
      const { data: prodAfter } = await supabaseAdmin
        .from("products")
        .select("stock")
        .eq("id", product.id)
        .maybeSingle();
      const stockAfter = Number(prodAfter?.stock ?? stockBefore);
      push(
        "stock",
        "Deduct stock",
        "خصم المخزون",
        !product.track_stock || stockAfter < stockBefore,
        product.track_stock ? `${stockBefore} → ${stockAfter}` : "stock tracking off",
      );

      const { data: invoice } = await supabaseAdmin
        .from("invoices")
        .select("invoice_number, total")
        .eq("order_id", order.id)
        .maybeSingle();
      push("invoice", "Generate tax invoice", "إصدار الفاتورة الضريبية", !!invoice, invoice?.invoice_number ?? "not created");

      const { data: mail } = await supabaseAdmin
        .from("email_outbox")
        .select("id, template, status")
        .eq("order_id", order.id)
        .limit(1)
        .maybeSingle();
      push("email", "Queue confirmation email", "جدولة بريد التأكيد", !!mail, mail ? `${mail.template} / ${mail.status}` : "not queued");

      if (product.type === "digital") {
        const { data: item } = await supabaseAdmin
          .from("order_items")
          .select("delivered_codes")
          .eq("order_id", order.id)
          .maybeSingle();
        const codes = (item?.delivered_codes as unknown[] | null) ?? [];
        push("codes", "Deliver digital codes", "تسليم الأكواد الرقمية", codes.length > 0, `${codes.length} code(s)`);
      }
    }

    return { steps, order_id: order.id as string | null };
  });

/** Removes every simulation order and its artefacts. */
export const clearPaymentSimulations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
  const { data: isAdmin } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!isAdmin) throw new Error("Forbidden");
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("id")
    .eq("channel", "simulation");
  const ids = (orders ?? []).map((o) => o.id);
  if (ids.length === 0) return { removed: 0 };
  await supabaseAdmin.from("email_outbox").delete().in("order_id", ids);
  await supabaseAdmin.from("invoices").delete().in("order_id", ids);
  await supabaseAdmin.from("payment_transactions").delete().in("order_id", ids);
  await supabaseAdmin.from("order_items").delete().in("order_id", ids);
  await supabaseAdmin.from("orders").delete().in("id", ids);
  return { removed: ids.length };
});
