/**
 * Shared webhook plumbing: raw notification logging + background processing.
 *
 * Contract for every gateway endpoint:
 *   1. record the raw notification,
 *   2. answer 200 in well under a second,
 *   3. verify + finalize in the background (reference + currency + exact
 *      amount + official success code), never trusting the posted body.
 */

const MAX_RAW = 4000;

export async function logRawNotification(input: {
  provider: string;
  raw: string;
  headers: Record<string, string>;
  note?: string;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("activity_log").insert({
      action: input.note ?? "webhook_received",
      entity_type: `${input.provider}_webhook`,
      details: {
        raw: input.raw.slice(0, MAX_RAW),
        headers: input.headers,
      } as never,
    });
  } catch {
    /* diagnostics only — never block the 200 reply */
  }
}

/** Mirrors the raw notification onto the payment attempt itself. */
export async function logAttemptNotification(attemptId: string, payload: Record<string, unknown>) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as any).from("payment_events").insert({
      attempt_id: attemptId,
      event_type: "webhook_notification",
      source: "webhook",
      sanitized_payload: payload as never,
    });
  } catch {
    /* diagnostics only */
  }
}

export function headerMap(request: Request, names: string[]) {
  const out: Record<string, string> = {};
  for (const n of names) {
    const v = request.headers.get(n);
    if (v) out[n] = v;
  }
  return out;
}

/* ------------------------------------------------------------------ AFS */

export async function processAfsNotification(input: {
  raw: string;
  ivHex: string;
  tagHex: string;
}) {
  const { logAfs } = await import("./webhook-log.server");
  const { loadAfsPaymentConfig, decryptAfsWebhook, getAfsPaymentStatus } = await import("./afs-adapter.server");

  let cfg;
  try {
    cfg = await loadAfsPaymentConfig();
  } catch {
    await logAfs("config_missing", {});
    return;
  }

  let payload: Record<string, unknown>;
  if (!input.ivHex || !input.tagHex) {
    // An unencrypted body is only ever a connectivity probe. It must never
    // mutate payment or order state.
    await logAfs("unencrypted_probe_ignored", {});
    return;
  }
  if (!cfg.webhookKey) {
    await logAfs("missing_key", {});
    return;
  }
  try {
    payload = await decryptAfsWebhook({ key: cfg.webhookKey, iv: input.ivHex, tag: input.tagHex, body: input.raw });
  } catch (e) {
    await logAfs("decryption_failed", { message: (e as Error).message });
    return;
  }

  const pay = (payload["payload"] ?? payload) as Record<string, unknown>;
  const checkoutId = (pay["id"] as string) ?? (pay["ndc"] as string) ?? null;
  const orderNumber = (pay["merchantTransactionId"] as string) ?? null;
  if (!checkoutId) {
    await logAfs("no_checkout_reference", { orderNumber });
    return;
  }

  const { getAttemptByCheckout, loadOrderForPayment, applyGatewayStatus } = await import("./core.server");
  let attempt;
  try {
    attempt = await getAttemptByCheckout("afs", checkoutId);
  } catch {
    await logAfs("attempt_not_found", { checkoutId, orderNumber });
    return;
  }
  await logAttemptNotification(attempt.id, { checkoutId, orderNumber, type: payload["type"] ?? null });

  const order = await loadOrderForPayment(attempt.order_id);
  if (orderNumber && order.order_number !== orderNumber) {
    await logAfs("reference_mismatch", { checkoutId, orderNumber });
    return;
  }
  const status = await getAfsPaymentStatus(checkoutId);
  await applyGatewayStatus({ attempt, order, status, source: "webhook" });
}

/* -------------------------------------------------------------- BENEFIT */

export async function processBenefitNotification(input: { raw: string; signature: string | null }) {
  const { logBenefit } = await import("./webhook-log.server");
  const { loadBpayConfig, bpayVerifySignature, bpayGetStatus, bpayIsSuccess, bpayIsPending } = await import("@/lib/bpay.server");

  let cfg;
  try {
    cfg = await loadBpayConfig();
  } catch {
    await logBenefit("config_missing", {});
    return;
  }

  if (cfg.secretKey) {
    const ok = await bpayVerifySignature(input.raw, input.signature, cfg.secretKey);
    if (!ok) {
      await logBenefit("invalid_signature", {});
      return;
    }
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = JSON.parse(input.raw) as Record<string, unknown>;
  } catch {
    payload = Object.fromEntries(new URLSearchParams(input.raw));
  }

  const checkoutId =
    (payload["id"] as string) ?? (payload["checkoutId"] as string) ?? (payload["paymentId"] as string) ?? null;
  const orderNumber = (payload["merchantTransactionId"] as string) ?? (payload["trackId"] as string) ?? null;
  if (!checkoutId) {
    await logBenefit("no_checkout_reference", { orderNumber });
    return;
  }

  const { getAttemptByCheckout, loadOrderForPayment, applyGatewayStatus } = await import("./core.server");
  let attempt;
  try {
    attempt = await getAttemptByCheckout("benefit", checkoutId);
  } catch {
    await logBenefit("attempt_not_found", { checkoutId, orderNumber });
    return;
  }
  await logAttemptNotification(attempt.id, { checkoutId, orderNumber });

  const order = await loadOrderForPayment(attempt.order_id);
  if (orderNumber && order.order_number !== orderNumber) {
    await logBenefit("reference_mismatch", { checkoutId, orderNumber });
    return;
  }
  const status = await bpayGetStatus(checkoutId, cfg);
  const code = status.result?.code;
  await applyGatewayStatus({
    attempt,
    order,
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
    source: "webhook",
  });
}
