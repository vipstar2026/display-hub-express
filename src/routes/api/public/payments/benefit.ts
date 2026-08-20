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

        const { bpayGetStatus, bpayIsSuccess, bpayIsPending } = await import("@/lib/bpay.server");
        if (!checkoutId) return json({ error: "missing checkout reference" }, 400);
        const { getAttemptByCheckout, loadOrderForPayment, applyGatewayStatus } = await import("@/lib/payments/core.server");
        const attempt = await getAttemptByCheckout("benefit", checkoutId);
        const order = await loadOrderForPayment(attempt.order_id);
        if (orderNumber && order.order_number !== orderNumber) return json({ error: "reference mismatch" }, 400);
        const status = await bpayGetStatus(checkoutId, cfg);
        const code = status.result?.code;
        const result = await applyGatewayStatus({
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
        return json({ received: true, status: result.success ? "succeeded" : result.pending ? "pending" : "failed" });
      },
      GET: async () => new Response("ok"),
    },
  },
});
