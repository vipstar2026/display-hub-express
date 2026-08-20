import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Tells the storefront whether the BENEFIT gateway is live yet. */
export const bpayStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { bpayIsEnabled } = await import("@/lib/bpay.server");
  return { enabled: await bpayIsEnabled() };
});

export const createBpayCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string; attempt_key?: string }) => input)
  .handler(async ({ data, context }) => {
    const { bpayPrepareCheckout, loadBpayConfig } = await import("@/lib/bpay.server");
    const cfg = await loadBpayConfig();

    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, order_number, total, currency, buyer_id, buyer_email, buyer_name, payment_status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order || order.buyer_id !== context.userId) throw new Error("Order not found");
    if (order.payment_status === "succeeded") throw new Error("Order already paid");

    const [givenName, ...rest] = (order.buyer_name ?? "").trim().split(" ");
    const { checkoutId, redirectUrl } = await bpayPrepareCheckout({
      amount: Number(order.total).toFixed(2),
      currency: order.currency || "BHD",
      merchantTransactionId: order.order_number,
      email: order.buyer_email,
      givenName: givenName || null,
      surname: rest.join(" ") || null,
      cfg,
    });

    if (!checkoutId) throw new Error("benefit_checkout_reference_missing");
    const { createPaymentAttempt, attachGatewayCheckout } = await import("@/lib/payments/core.server");
    const attempt = await createPaymentAttempt({
      order: { ...order, total: Number(order.total), status: "pending" },
      provider: "benefit",
      kind: "gateway",
      attemptKey: data.attempt_key ?? `benefit:${order.id}:${crypto.randomUUID()}`,
      returnUrl: cfg.resultUrl,
    });
    await attachGatewayCheckout(attempt.id, checkoutId);

    return {
      checkoutId,
      redirectUrl,
      flow: cfg.flow,
      scriptUrl: checkoutId ? `${cfg.widgetBase}?checkoutId=${checkoutId}` : null,
      amount: Number(order.total).toFixed(2),
      currency: cfg.currency || order.currency || "BHD",
      testMode: cfg.testMode,
      brands: cfg.brands,
      widgetLang: cfg.widgetLang,
      resultUrl: cfg.resultUrl,
    };
  });

export const confirmBpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string; checkout_id: string }) => input)
  .handler(async ({ data, context }) => {
    const { bpayGetStatus, bpayIsSuccess, bpayIsPending } = await import("@/lib/bpay.server");

    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, order_number, total, currency, payment_status, status, buyer_id")
      .eq("id", data.order_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order || order.buyer_id !== context.userId) throw new Error("Order not found");

    const status = await bpayGetStatus(data.checkout_id);
    const code = status.result?.code;
    const { getAttemptByCheckout, applyGatewayStatus } = await import("@/lib/payments/core.server");
    const attempt = await getAttemptByCheckout("benefit", data.checkout_id);
    return applyGatewayStatus({
      attempt,
      order: { ...order, total: Number(order.total) },
      status: {
        externalPaymentId: status.id ?? null,
        merchantReference: status.merchantTransactionId ?? null,
        amount: status.amount ?? null,
        currency: status.currency ?? null,
        brand: status.paymentBrand ?? "BENEFIT",
        code: code ?? "",
        description: status.result?.description ?? "",
        state: bpayIsSuccess(code) ? "succeeded" : bpayIsPending(code) ? "processing" : code ? "failed" : "unknown",
      },
      source: "customer_return",
    });
  });
