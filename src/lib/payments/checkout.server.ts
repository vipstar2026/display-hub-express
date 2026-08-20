import { BASE } from "@/lib/site-url";
import { createAfsPayment, getAfsPaymentStatus } from "./afs-adapter.server";
import { applyGatewayStatus, attachGatewayCheckout, createPaymentAttempt, getAttemptByCheckout, loadOrderForPayment } from "./core.server";

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
  if (attempt.external_checkout_id) {
    const config = await import("./afs-adapter.server").then((m) => m.loadAfsPaymentConfig());
    return { attemptId: attempt.id, checkoutId: attempt.external_checkout_id, scriptUrl: `${config.widgetUrl}?checkoutId=${encodeURIComponent(attempt.external_checkout_id)}`, amount: order.total, currency: order.currency, testMode: config.testMode, brands: config.brands, widgetLang: config.widgetLang };
  }
  const gateway = await createAfsPayment(order);
  await attachGatewayCheckout(attempt.id, gateway.checkoutId);
  return { attemptId: attempt.id, checkoutId: gateway.checkoutId, scriptUrl: gateway.scriptUrl, amount: order.total, currency: order.currency, testMode: gateway.config.testMode, brands: gateway.config.brands, widgetLang: gateway.config.widgetLang };
}

export async function confirmAfsCheckout(input: { orderId: string; checkoutId: string; source: string }) {
  const attempt = await getAttemptByCheckout("afs", input.checkoutId);
  if (attempt.order_id !== input.orderId) throw new Error("payment_attempt_mismatch");
  const order = await loadOrderForPayment(input.orderId);
  const status = await getAfsPaymentStatus(input.checkoutId);
  return applyGatewayStatus({ attempt, order, status, source: input.source });
}
