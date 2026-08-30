import { amountsMatch } from "./money";
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

// Explicit shopper/gateway cancellation codes (OPPWA 100.396.*).
const CANCELLED = /^100\.396\.(101|103|104|106)/;

export async function applyGatewayStatus(input: { attempt: any; order: PaymentOrder; status: GatewayStatus; source: string; background?: boolean }) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const { attempt, order, status } = input;

  // Idempotency: an already-paid order (or already-succeeded attempt) is never
  // finalized twice — no duplicate delivery and no duplicate notification.
  if (order.payment_status === "succeeded" || attempt.state === "succeeded") {
    return { success: true, pending: false, abandoned: false, cancelled: false, rateLimited: false, code: status.code, message: "" };
  }

  const sameCurrency = (status.currency ?? "").toUpperCase() === order.currency.toUpperCase();
  const valid =
    status.state === "succeeded" &&
    !!status.externalPaymentId &&
    // Strict: same order reference, same currency, exact same amount. Anything
    // else is an amount_mismatch and must never be treated as paid.
    status.merchantReference === order.order_number &&
    sameCurrency &&
    amountsMatch(status.amount, order.total, order.currency);

  if (valid) {
    const { error } = await admin.rpc("finalize_payment_attempt", {
      _attempt_id: attempt.id,
      _external_payment_id: status.externalPaymentId,
      _payment_brand: status.brand,
      _source: input.source,
      _provider_code: status.code,
      _sanitized_payload: { code: status.code, description: status.description, last4: status.last4 ?? null, brand: status.brand ?? null },
    });
    if (error) throw new Error(error.message);
    return { success: true, pending: false, abandoned: false, cancelled: false, rateLimited: false, code: status.code, message: "" };
  }


  // A terminal attempt must never be rewritten by a later duplicate status
  // call (e.g. the result page retrying seconds after a real decline and
  // getting a transient gateway error like 200.300.404). Keep the original,
  // truthful decline reason so support and the shopper see what the bank said.
  if (attempt.state === "failed" || attempt.state === "succeeded") {
    return { success: attempt.state === "succeeded", pending: false, abandoned: false, rateLimited: false, code: status.code, message: attempt.failure_reason ?? "" };
  }

  const integrityFailure = status.state === "succeeded";
  const undecided = status.state === "processing" || status.state === "unknown";
  // A background sweep gets exactly one look. Only a genuinely UNKNOWN result
  // (e.g. 700.400.580 "cannot find transaction") means the shopper never
  // finished, so it is recorded as abandoned. An explicit gateway PENDING
  // (000.200.*) is a live transaction — 3-D Secure in progress — and must stay
  // "processing" or a real payment would be thrown away.
  const nextState = integrityFailure
    ? "requires_review"
    : undecided
      ? (input.background && status.state === "unknown" ? "abandoned" : "processing")
      : "failed";
  const reason = integrityFailure ? "amount_mismatch" : status.description || "payment_not_completed";
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
