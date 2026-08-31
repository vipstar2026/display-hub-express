import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Tells the storefront whether the BENEFIT gateway is live yet. */
export const bpayStatus = createServerFn({ method: "GET" }).handler(async () => {
  const { bpayIsEnabled } = await import("@/lib/bpay.server");
  return { enabled: await bpayIsEnabled() };
});

/**
 * Starts a BENEFIT Payment Gateway hosted payment (classic trandata flow) and
 * returns the URL the shopper must be redirected to (top-level window).
 */
export const createBpayCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string; attempt_key?: string; lang?: string }) => input)
  .handler(async ({ data, context }) => {
    const { bpayInitPayment, loadBpayConfig, bpayFormatAmount } = await import("@/lib/bpay.server");
    const cfg = await loadBpayConfig();

    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, order_number, total, currency, buyer_id, buyer_email, buyer_name, payment_status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order || order.buyer_id !== context.userId) throw new Error("Order not found");
    if (order.payment_status === "succeeded") throw new Error("Order already paid");

    const currency = (order.currency || cfg.currency || "BHD").toUpperCase();
    const init = await bpayInitPayment({
      amount: Number(order.total),
      currency,
      trackId: order.order_number,
      orderId: order.id,
      lang: data.lang,
      email: order.buyer_email,
      cfg,
    });

    const { createPaymentAttempt, attachGatewayCheckout } = await import("@/lib/payments/core.server");
    const attempt = await createPaymentAttempt({
      order: { ...order, total: Number(order.total), status: "pending" },
      provider: "benefit",
      kind: "gateway",
      attemptKey: data.attempt_key ?? `benefit:${order.id}:${crypto.randomUUID()}`,
      returnUrl: cfg.responseUrl,
    });
    await attachGatewayCheckout(attempt.id, init.paymentId);

    return {
      paymentId: init.paymentId,
      redirectUrl: init.paymentUrl,
      amount: bpayFormatAmount(Number(order.total), currency),
      currency,
      testMode: cfg.testMode,
    };
  });
