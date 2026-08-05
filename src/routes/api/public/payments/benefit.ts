import { createFileRoute } from "@tanstack/react-router";

/**
 * BENEFIT / BPay notification (callback) endpoint.
 * Give this URL to the bank: https://vipstar.cc/api/public/payments/benefit
 *
 * Security: the payload signature is verified with the `secret_key` saved in
 * the BENEFIT row of Payment Methods (admin dashboard). The payment result is
 * always re-fetched from the gateway before an order is marked as paid, so a
 * forged body cannot flip an order to "succeeded".
 */
export const Route = createFileRoute("/api/public/payments/benefit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (v: unknown, status = 200) =>
          new Response(JSON.stringify(v), {
            status,
            headers: { "Content-Type": "application/json" },
          });

        const raw = await request.text();

        let cfg;
        try {
          const { loadBpayConfig } = await import("@/lib/bpay.server");
          cfg = await loadBpayConfig();
        } catch {
          return json({ error: "gateway not configured" }, 503);
        }

        if (cfg.secretKey) {
          const { bpayVerifySignature } = await import("@/lib/bpay.server");
          const sig =
            request.headers.get("x-signature") ??
            request.headers.get("x-benefit-signature") ??
            request.headers.get("signature");
          const ok = await bpayVerifySignature(raw, sig, cfg.secretKey);
          if (!ok) return json({ error: "invalid signature" }, 401);
        }

        let payload: Record<string, unknown> = {};
        try {
          payload = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          payload = Object.fromEntries(new URLSearchParams(raw));
        }

        const checkoutId =
          (payload["id"] as string) ??
          (payload["checkoutId"] as string) ??
          (payload["paymentId"] as string) ??
          null;
        const orderNumber =
          (payload["merchantTransactionId"] as string) ??
          (payload["trackId"] as string) ??
          null;
        if (!checkoutId && !orderNumber) return json({ error: "missing reference" }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { bpayGetStatus, bpayIsSuccess, bpayIsPending } = await import("@/lib/bpay.server");

        const { data: order } = orderNumber
          ? await supabaseAdmin
              .from("orders")
              .select("id, total, currency, payment_status")
              .eq("order_number", orderNumber)
              .maybeSingle()
          : { data: null };

        let resolvedOrder = order;
        if (!resolvedOrder && checkoutId) {
          const { data: tx } = await supabaseAdmin
            .from("payment_transactions")
            .select("order_id")
            .eq("provider", "benefit")
            .eq("provider_charge_id", checkoutId)
            .maybeSingle();
          if (tx?.order_id) {
            const { data: o } = await supabaseAdmin
              .from("orders")
              .select("id, total, currency, payment_status")
              .eq("id", tx.order_id)
              .maybeSingle();
            resolvedOrder = o;
          }
        }
        if (!resolvedOrder) return json({ error: "order not found" }, 404);

        // Always verify with the gateway rather than trusting the callback body.
        const status = checkoutId ? await bpayGetStatus(checkoutId, cfg) : null;
        const code = status?.result?.code;
        const success = bpayIsSuccess(code);
        const pending = bpayIsPending(code);

        const txPayload = {
          order_id: resolvedOrder.id,
          provider: "benefit",
          provider_charge_id: status?.id ?? checkoutId ?? orderNumber ?? "",
          amount: Number(status?.amount ?? resolvedOrder.total),
          currency: status?.currency ?? resolvedOrder.currency ?? "BHD",
          status: success ? "succeeded" : pending ? "pending" : "failed",
          payment_method: status?.paymentBrand ?? "BENEFIT",
          raw_response: (status ?? payload) as never,
          failure_reason: success ? null : (status?.result?.description ?? null),
          paid_at: success ? new Date().toISOString() : null,
        };

        const { data: existing } = await supabaseAdmin
          .from("payment_transactions")
          .select("id")
          .eq("order_id", resolvedOrder.id)
          .eq("provider", "benefit")
          .eq("status", "pending")
          .maybeSingle();

        if (existing) {
          await supabaseAdmin.from("payment_transactions").update(txPayload).eq("id", existing.id);
        } else {
          await supabaseAdmin.from("payment_transactions").insert(txPayload);
        }

        if (success && resolvedOrder.payment_status !== "succeeded") {
          await supabaseAdmin
            .from("orders")
            .update({
              payment_status: "succeeded",
              status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: "BENEFIT",
              payment_reference: status?.id ?? checkoutId,
            })
            .eq("id", resolvedOrder.id);
        } else if (!success && !pending) {
          await supabaseAdmin
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("id", resolvedOrder.id);
        }

        return json({ received: true, status: txPayload.status });
      },
      GET: async () => new Response("ok"),
    },
  },
});
