import { BASE } from "@/lib/site-url";
import { createAfsPayment, getAfsCheckoutEnvironment, getAfsPaymentStatus } from "./afs-adapter.server";
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
    const config = await import("./afs-adapter.server").then((m) =>
      m.loadAfsPaymentConfig(getAfsCheckoutEnvironment(attempt.external_checkout_id)),
    );
    return { attemptId: attempt.id, checkoutId: attempt.external_checkout_id, scriptUrl: `${config.widgetUrl}?checkoutId=${encodeURIComponent(attempt.external_checkout_id)}`, amount: order.total, currency: order.currency, brands: config.brands, widgetLang: config.widgetLang };
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
  return { attemptId: attempt.id, checkoutId: gateway.checkoutId, scriptUrl: gateway.scriptUrl, scriptIntegrity: gateway.integrity, amount: order.total, currency: order.currency, brands: gateway.config.brands, widgetLang: gateway.config.widgetLang };
}

export async function confirmAfsCheckout(input: { orderId: string; checkoutId: string; resourcePath?: string | null; source: string; background?: boolean }) {
  const attempt = await getAttemptByCheckout("afs", input.checkoutId);
  if (attempt.order_id !== input.orderId) throw new Error("payment_attempt_mismatch");
  const order = await loadOrderForPayment(input.orderId);
  let status = await getAfsPaymentStatus(input.checkoutId, input.resourcePath);
  // Immediately after the widget redirect, AFS can briefly return "cannot find
  // transaction" or a rate-limit code before the transaction becomes visible.
  // Retry that narrow race on the customer return path only (4 attempts total),
  // backing off further when the gateway is rate limiting us.
  // A background sweep gets a single attempt with no retries.
  if (!input.background) {
    for (let attemptNo = 1; attemptNo <= 3; attemptNo++) {
      const retryable = status.state === "unknown" || status.state === "processing";
      if (!retryable) break;
      const delay = 2_000 + attemptNo * 1_500 + (status.rateLimited ? 2_000 + attemptNo * 1_500 : 0);
      await new Promise((resolve) => setTimeout(resolve, delay));
      status = await getAfsPaymentStatus(input.checkoutId, input.resourcePath);
    }
  }
  return applyGatewayStatus({ attempt, order, status, source: input.source, background: input.background });
}
