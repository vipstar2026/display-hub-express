import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { formatAmount, toMinorUnits } from "@/lib/afs-money";

/**
 * Admin refund of a captured AFS payment.
 *
 * Guards enforced before anything is sent to the gateway:
 *  - caller is an admin
 *  - the order is actually paid and not already fully refunded
 *  - a *final AFS payment id* can be established (never a bare checkout id)
 *  - 0 < amount <= remaining refundable amount, compared in exact minor units
 *
 * NOTE (owner decisions, unchanged by design):
 *  - a refund does NOT restock physical items (payment refund != product return)
 *  - a refund does NOT revoke or return delivered digital codes
 */
export const refundAfsPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string; amount?: number; reason?: string }) => input)
  .handler(async ({ data, context }) => {
    // Admin only
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("not_authorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { afsRefund, afsIsSuccess, loadAfsConfig, afsGetStatus } = await import(
      "@/lib/afs.server"
    );
    const { logIntegrityEvent } = await import("@/lib/afs-verify.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, currency, payment_status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order) throw new Error("order_not_found");
    if (order.payment_status !== "succeeded") throw new Error("order_not_paid");

    const currency = (order.currency || "BHD").toUpperCase();

    // All AFS rows for this order: the capture plus any previous refunds.
    const { data: rows } = await supabaseAdmin
      .from("payment_transactions")
      .select("id, provider_charge_id, provider_checkout_id, provider_payment_id, amount, currency, status, raw_response, created_at")
      .eq("order_id", order.id)
      .eq("provider", "afs")
      .order("created_at", { ascending: false });

    const all = (rows ?? []) as Array<Record<string, unknown>>;
    const capture = all.find((r) => r["status"] === "succeeded" && Number(r["amount"]) > 0);
    if (!capture) throw new Error("no_afs_transaction");

    // --- Establish the FINAL payment id (never a bare checkout id) ---------
    let paymentId =
      (capture["provider_payment_id"] as string | null) ??
      ((capture["raw_response"] as { id?: string } | null)?.id ?? null);

    if (!paymentId) {
      // Historical row: resolve unambiguously via the gateway using the checkout id.
      const checkoutId =
        (capture["provider_checkout_id"] as string | null) ??
        (capture["provider_charge_id"] as string | null);
      if (checkoutId) {
        const st = await afsGetStatus(checkoutId).catch(() => null);
        if (
          st?.id &&
          st.merchantTransactionId === order.order_number &&
          (st.currency ?? "").toUpperCase() === currency
        ) {
          paymentId = st.id;
          await supabaseAdmin
            .from("payment_transactions")
            .update({ provider_payment_id: st.id, provider_checkout_id: checkoutId } as never)
            .eq("id", capture["id"] as string);
        }
      }
    }

    if (!paymentId) {
      await logIntegrityEvent({
        category: "refund_reference_unresolved",
        reason: "final AFS payment id could not be established",
        order_id: order.id,
        order_number: order.order_number,
        transaction_id: capture["id"] as string,
        currency,
        source: "refund",
      });
      throw new Error("Payment reference could not be verified for refund.");
    }

    // --- Amount validation in exact minor units ---------------------------
    const capturedUnits = toMinorUnits(Number(capture["amount"]), currency);
    const refundedUnits = all
      .filter((r) => r["status"] === "refunded")
      .reduce((sum, r) => sum + (toMinorUnits(Math.abs(Number(r["amount"])), currency) ?? 0n), 0n);
    if (capturedUnits === null) throw new Error("invalid_amount");

    const remaining = capturedUnits - refundedUnits;
    if (remaining <= 0n) throw new Error("already_refunded");

    const requestedUnits =
      data.amount === undefined ? remaining : toMinorUnits(data.amount, currency);
    if (requestedUnits === null || requestedUnits <= 0n) throw new Error("invalid_amount");
    if (requestedUnits > remaining) throw new Error("refund_exceeds_remaining");

    const exact = formatAmount(
      (Number(requestedUnits) / 10 ** currencyDecimals(currency)).toFixed(
        currencyDecimals(currency),
      ),
      currency,
    );
    const amountStr = formatGatewayAmount(exact, currency);
    const amount = Number(exact);

    const cfg = await loadAfsConfig();
    const res = await afsRefund({
      paymentId,
      amount: amountStr,
      currency,
      cfg,
    });

    const ok = afsIsSuccess(res.result?.code);

    await supabaseAdmin.from("payment_transactions").insert({
      order_id: order.id,
      provider: "afs",
      provider_charge_id: res.id ?? paymentId,
      provider_payment_id: res.id ?? null,
      amount: -amount,
      currency,
      status: ok ? "refunded" : "failed",
      payment_method: "AFS refund",
      raw_response: res as never,
      failure_reason: ok ? null : (res.result?.description ?? "refund failed"),
    } as never);

    if (ok) {
      const full = requestedUnits >= remaining;
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: full ? "refunded" : "succeeded",
          status: full ? "refunded" : undefined,
          admin_notes: data.reason ?? undefined,
        } as never)
        .eq("id", order.id);
    }

    return {
      success: ok,
      amount,
      partial: ok && requestedUnits < remaining,
      code: res.result?.code ?? "",
      message: res.result?.description ?? "",
    };
  });
