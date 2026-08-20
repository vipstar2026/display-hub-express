/** Centralised AFS payment verification gate.
 *
 *  EVERY path that can move an order to payment_status = 'succeeded'
 *  (authenticated confirm, guest confirm, webhook, reconciliation) MUST go
 *  through `verifyAfsPaymentForOrder` + `applyAfsPaymentResult`.
 *
 *  The gate only returns ok when ALL of the following hold:
 *    1. the gateway itself reports a successful result code
 *    2. the gateway amount equals orders.total (exact minor units)
 *    3. the gateway currency equals orders.currency
 *    4. the gateway merchantTransactionId equals orders.order_number
 *    5. the verified payment belongs to this order's payment transaction
 *    6. the order has not already been fulfilled
 *    7. the payment has not been refunded / the order cancelled
 *
 *  Nothing here logs card data, tokens or keys. */

import { amountsEqual, formatAmount, toMinorUnits } from "@/lib/afs-money";
import type { AfsStatus } from "@/lib/afs.server";

export interface GateOrder {
  id: string;
  order_number: string;
  total: number | string;
  currency: string | null;
  payment_status: string | null;
  status?: string | null;
}

export type GateFailure = {
  ok: false;
  /** machine-readable failure bucket, safe to store */
  category:
    | "gateway_unknown"
    | "payment_pending"
    | "payment_failed"
    | "amount_mismatch"
    | "currency_mismatch"
    | "reference_mismatch"
    | "association_mismatch"
    | "already_paid"
    | "order_refunded"
    | "order_cancelled";
  reason: string;
  pending: boolean;
  status: AfsStatus | null;
  code: string;
};

export type GateSuccess = {
  ok: true;
  status: AfsStatus;
  code: string;
  /** the id AFS returned for the captured payment (used for refunds) */
  paymentId: string;
  checkoutId: string;
  paymentBrand: string | null;
};

export type GateResult = GateSuccess | GateFailure;

/** Records a failed integrity check. Never stores card data or secrets. */
export async function logIntegrityEvent(details: {
  category: string;
  reason: string;
  order_id?: string | null;
  order_number?: string | null;
  transaction_id?: string | null;
  afs_id?: string | null;
  expected_amount?: string | null;
  received_amount?: string | null;
  currency?: string | null;
  source: string;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("activity_log").insert({
      action: `afs_integrity_${details.category}`,
      entity_type: "payment_integrity",
      entity_id: details.order_id ?? null,
      details: { ...details, at: new Date().toISOString() } as never,
    });
  } catch {
    /* diagnostics only — never block the payment path */
  }
}

/**
 * The single payment success gate. `status` may be supplied when the caller
 * already fetched it; otherwise the gateway is queried (never the browser).
 */
export async function verifyAfsPaymentForOrder(input: {
  order: GateOrder;
  checkoutId: string;
  status?: AfsStatus | null;
  /** when known, the checkout id recorded on the order's payment transaction */
  expectedCheckoutId?: string | null;
  source: string;
}): Promise<GateResult> {
  const { afsGetStatus, afsIsSuccess, afsIsPending, afsVerifyNotification } = await import(
    "@/lib/afs.server"
  );
  const order = input.order;
  const currency = (order.currency || "BHD").toUpperCase();

  let status: AfsStatus | null = input.status ?? null;
  // "unknown reference" codes mean the id we hold could not be resolved by that
  // endpoint (the shopper return may carry a payment id instead of a checkout
  // id). Try the other lookup, but never let a worse answer replace a good one.
  const unresolved = (s: AfsStatus | null) => {
    const c = s?.result?.code ?? "";
    return !c || /^(700\.400\.580|200\.300\.404|100\.100\.104|800\.[89])/.test(c);
  };
  if (!status) status = await afsGetStatus(input.checkoutId).catch(() => null);
  if (unresolved(status)) {
    const alt = await afsVerifyNotification(input.checkoutId).catch(() => null);
    if (!unresolved(alt)) status = alt;
  }

  const code = status?.result?.code ?? "";


  const fail = async (category: GateFailure["category"], reason: string, pending = false): Promise<GateFailure> => {
    if (category !== "already_paid" && category !== "payment_pending") {
      await logIntegrityEvent({
        category,
        reason,
        order_id: order.id,
        order_number: order.order_number,
        afs_id: status?.id ?? input.checkoutId,
        expected_amount: formatAmount(order.total, currency),
        received_amount: status?.amount ? String(status.amount) : null,
        currency,
        source: input.source,
      });
    }
    return { ok: false, category, reason, pending, status, code };
  };

  if (!status || !code || unresolved(status))
    return fail("gateway_unknown", "gateway did not recognise the payment reference");
  if (afsIsPending(code)) return fail("payment_pending", "payment still pending", true);
  if (!afsIsSuccess(code)) return fail("payment_failed", "declined by the gateway");


  // 6/7 — order eligibility
  if (order.payment_status === "succeeded") return fail("already_paid", "order already paid");
  if (order.payment_status === "refunded") return fail("order_refunded", "order already refunded");
  if ((order.status ?? "") === "cancelled")
    return fail("order_cancelled", "local order was cancelled before the gateway reported success");

  // 4 — merchant transaction id
  const mtx = (status.merchantTransactionId ?? "").trim();
  if (!mtx || mtx !== order.order_number)
    return fail("reference_mismatch", "merchantTransactionId does not match the order number");

  // 3 — currency
  const gwCurrency = (status.currency ?? "").trim().toUpperCase();
  if (!gwCurrency || gwCurrency !== currency)
    return fail("currency_mismatch", "gateway currency does not match the order currency");

  // 2 — amount (exact minor units, no float compare, no silent rounding)
  const expected = toMinorUnits(order.total, currency);
  const received = toMinorUnits(status.amount ?? null, currency);
  if (expected === null || received === null || expected !== received)
    return fail("amount_mismatch", "gateway amount does not match the order total");

  // 5 — checkout/payment association
  if (input.expectedCheckoutId && input.expectedCheckoutId !== input.checkoutId)
    return fail("association_mismatch", "checkout id does not belong to this order's transaction");

  if (!amountsEqual(status.amount ?? "0", order.total, currency))
    return fail("amount_mismatch", "gateway amount does not match the order total");

  return {
    ok: true,
    status,
    code,
    paymentId: status.id ?? input.checkoutId,
    checkoutId: input.checkoutId,
    paymentBrand: status.paymentBrand ?? null,
  };
}

/**
 * Persists the verified (or rejected) result. This is the ONLY place that
 * flips orders.payment_status to 'succeeded'. Database triggers own the
 * fulfilment that follows (digital codes, stock, invoice, journal, loyalty,
 * email queue).
 */
export async function applyAfsPaymentResult(params: {
  order: GateOrder;
  checkoutId: string;
  result: GateResult;
  source: string;
}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { order, result, checkoutId } = params;
  const currency = (order.currency || "BHD").toUpperCase();
  const gwStatus = result.ok ? result.status : result.status;
  const paymentId = result.ok ? result.paymentId : (gwStatus?.id ?? null);

  const needsReview = !result.ok && (result.category === "order_cancelled" || result.category === "amount_mismatch" || result.category === "currency_mismatch" || result.category === "reference_mismatch" || result.category === "association_mismatch");

  const txStatus = result.ok
    ? "succeeded"
    : needsReview
      ? "requires_review"
      : result.pending
        ? "pending"
        : result.category === "already_paid"
          ? "succeeded"
          : "failed";

  const txPayload: Record<string, unknown> = {
    order_id: order.id,
    provider: "afs",
    provider_charge_id: paymentId ?? checkoutId,
    provider_checkout_id: checkoutId,
    provider_payment_id: result.ok ? result.paymentId : null,
    amount: Number(gwStatus?.amount ?? order.total),
    currency: (gwStatus?.currency ?? currency).toUpperCase(),
    status: txStatus,
    payment_method: gwStatus?.paymentBrand ?? null,
    raw_response: (gwStatus ?? {}) as never,
    failure_reason: result.ok ? null : `${result.category}: ${result.reason}`,
    paid_at: result.ok ? new Date().toISOString() : null,
  };

  // Reuse the pending row created when the checkout started, if any.
  const { data: existing } = await supabaseAdmin
    .from("payment_transactions")
    .select("id")
    .eq("order_id", order.id)
    .eq("provider", "afs")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from("payment_transactions").update(txPayload as never).eq("id", existing.id);
  } else {
    await supabaseAdmin.from("payment_transactions").insert(txPayload as never);
  }

  if (result.ok) {
    // Guarded transition: only a non-succeeded order can become paid, so a
    // duplicate webhook/callback cannot fulfil twice.
    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "succeeded",
        status: "paid",
        paid_at: new Date().toISOString(),
        payment_method: "AFS",
        payment_reference: result.paymentId,
      })
      .eq("id", order.id)
      .neq("payment_status", "succeeded");
    return;
  }

  if (needsReview) {
    // Never silently revive/fulfil — raise an admin review item instead.
    try {
      await supabaseAdmin.from("notifications").insert({
        type: "payment_review",
        severity: "critical",
        title: `Payment needs manual review — ${order.order_number}`,
        message: `AFS reported ${result.category} (${result.reason}). Order was NOT fulfilled.`,
        link: `/admin/orders`,
      });
    } catch {
      /* diagnostics only */
    }
    return;
  }

  if (!result.pending && result.category !== "already_paid") {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", order.id)
      .neq("payment_status", "succeeded");
  }
}
