import { amountCovers } from "./money";
import type { GatewayStatus, PaymentOrder, PaymentState } from "./types";

export async function loadOrderForPayment(orderId: string): Promise<PaymentOrder> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, total, currency, payment_status, status, buyer_email, buyer_name")
    .eq("id", orderId)
    .maybeSingle();
  if (!data) throw new Error("order_not_found");
  return { ...data, total: Number(data.total) };
}

export async function createPaymentAttempt(input: {
  order: PaymentOrder;
  paymentMethodId?: string | null;
  provider: string;
  kind: "gateway" | "manual" | "cash";
  attemptKey: string;
  returnUrl?: string | null;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const { data: existing } = await admin.from("payment_attempts").select("*").eq("attempt_key", input.attemptKey).maybeSingle();
  if (existing) return existing;
  const state: PaymentState = input.kind === "gateway" ? "created" : input.kind === "manual" ? "requires_review" : "awaiting_customer";
  const { data, error } = await admin.from("payment_attempts").insert({
    order_id: input.order.id,
    payment_method_id: input.paymentMethodId ?? null,
    provider: input.provider,
    kind: input.kind,
    state,
    attempt_key: input.attemptKey,
    expected_amount: input.order.total,
    currency: input.order.currency.toUpperCase(),
    merchant_reference: input.order.order_number,
    customer_return_url: input.returnUrl ?? null,
  }).select("*").single();
  if (error) throw new Error(error.message);
  await admin.from("payment_events").insert({ attempt_id: data.id, event_type: "attempt_created", source: "checkout" });
  return data;
}

export async function attachGatewayCheckout(attemptId: string, checkoutId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const { error } = await admin.from("payment_attempts").update({ state: "awaiting_customer", external_checkout_id: checkoutId }).eq("id", attemptId).eq("state", "created");
  if (error) throw new Error(error.message);
  await admin.from("payment_events").insert({ attempt_id: attemptId, event_type: "gateway_checkout_created", source: "checkout" });
}

export async function getAttemptByCheckout(provider: string, checkoutId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await (supabaseAdmin as any).from("payment_attempts").select("*").eq("provider", provider).eq("external_checkout_id", checkoutId).maybeSingle();
  if (!data) throw new Error("payment_attempt_not_found");
  return data;
}

export async function applyGatewayStatus(input: { attempt: any; order: PaymentOrder; status: GatewayStatus; source: string; background?: boolean }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const { attempt, order, status } = input;
  const sameCurrency = (status.currency ?? "").toUpperCase() === order.currency.toUpperCase();
  const valid =
    status.state === "succeeded" &&
    !!status.externalPaymentId &&
    // The gateway reference MUST match this order, and the captured amount must
    // cover what is due (allowing 1x/10x/3x currency conversion multiples).
    status.merchantReference === order.order_number &&
    amountCovers(status.amount, order.total, order.currency, sameCurrency);

  if (valid) {
    const { error } = await admin.rpc("finalize_payment_attempt", {
      _attempt_id: attempt.id,
      _external_payment_id: status.externalPaymentId,
      _payment_brand: status.brand,
      _source: input.source,
      _provider_code: status.code,
      _sanitized_payload: { code: status.code, description: status.description },
    });
    if (error) throw new Error(error.message);
    return { success: true, pending: false, abandoned: false, rateLimited: false, code: status.code, message: "" };
  }

  const integrityFailure = status.state === "succeeded";
  const undecided = status.state === "processing" || status.state === "unknown";
  // A background sweep gets exactly one look. An undecided result there means
  // the shopper never finished; record it as abandoned instead of keeping the
  // attempt alive and re-polling the gateway (which triggers 800.120.* limits).
  const nextState = integrityFailure
    ? "requires_review"
    : undecided
      ? (input.background ? "abandoned" : "processing")
      : "failed";
  const reason = integrityFailure ? "gateway_result_integrity_mismatch" : status.description || "payment_not_completed";
  const { error } = await admin.rpc("reject_payment_attempt", {
    _attempt_id: attempt.id,
    _state: nextState,
    _source: input.source,
    _provider_code: status.code,
    _reason: reason,
    _sanitized_payload: { code: status.code, description: status.description },
  });
  if (error) throw new Error(error.message);
  return { success: false, pending: nextState === "processing", abandoned: nextState === "abandoned", rateLimited: !!status.rateLimited, code: status.code, message: reason };
}
