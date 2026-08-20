import { BASE } from "@/lib/site-url";
import { createAfsPayment, getAfsPaymentStatus } from "./afs-adapter.server";
import { applyGatewayStatus, attachGatewayCheckout, createPaymentAttempt, getAttemptByCheckout, loadOrderForPayment } from "./core.server";

const CHECKOUT_TTL_MS = 25 * 60 * 1000;

export async function startAfsCheckout(input: { orderId: string; attemptKey: string; paymentMethodId?: string | null; returnPath: string }) {
  const order = await loadOrderForPayment(input.orderId);
  if (order.payment_status === "succeeded") throw new Error("order_already_paid");
  const attempt = await createPaymentAttempt({
    order,
    paymentMethodId: input.paymentMethodId,
    provider: "afs",
    kind: "gateway",
    attemptKey: input.attemptKey,
    returnUrl: `${BASE}${input.returnPath}`,
  });
  const checkoutIsFresh =
    attempt.external_checkout_id &&
    attempt.created_at &&
    Date.now() - new Date(attempt.created_at).getTime() < CHECKOUT_TTL_MS;
  if (checkoutIsFresh) {
    const config = await import("./afs-adapter.server").then((m) => m.loadAfsPaymentConfig());
    return { attemptId: attempt.id, checkoutId: attempt.external_checkout_id, scriptUrl: `${config.widgetUrl}?checkoutId=${encodeURIComponent(attempt.external_checkout_id)}`, amount: order.total, currency: order.currency, testMode: config.testMode, brands: config.brands, widgetLang: config.widgetLang };
  }
  // AFS checkout IDs expire after roughly 30 minutes. A repeated server call
  // with the same idempotency key must never revive an expired widget session.
  if (attempt.external_checkout_id) {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any)
      .from("payment_attempts")
      .update({ state: "failed", failure_reason: "checkout_expired" })
      .eq("id", attempt.id)
      .in("state", ["created", "awaiting_customer", "processing"]);
    return startAfsCheckout({
      ...input,
      attemptKey: `${input.attemptKey}:refresh:${crypto.randomUUID()}`,
    });
  }
  const gateway = await createAfsPayment(order);
  await attachGatewayCheckout(attempt.id, gateway.checkoutId);
  return { attemptId: attempt.id, checkoutId: gateway.checkoutId, scriptUrl: gateway.scriptUrl, amount: order.total, currency: order.currency, testMode: gateway.config.testMode, brands: gateway.config.brands, widgetLang: gateway.config.widgetLang };
}

export async function confirmAfsCheckout(input: { orderId: string; checkoutId: string; resourcePath?: string | null; source: string }) {
  const attempt = await getAttemptByCheckout("afs", input.checkoutId);
  if (attempt.order_id !== input.orderId) throw new Error("payment_attempt_mismatch");
  const order = await loadOrderForPayment(input.orderId);
  let status = await getAfsPaymentStatus(input.checkoutId, input.resourcePath);
  // Immediately after the widget redirect, AFS can briefly return "session not
  // found" before the new transaction is visible. Retry only this narrow race;
  // all other gateway failures remain terminal.
  for (const delay of [1_500, 3_000]) {
    if (status.code !== "700.400.580" && status.code !== "200.300.404") break;
    await new Promise((resolve) => setTimeout(resolve, delay));
    status = await getAfsPaymentStatus(input.checkoutId, input.resourcePath);
  }
  return applyGatewayStatus({ attempt, order, status, source: input.source });
}
