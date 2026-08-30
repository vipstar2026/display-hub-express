import { createFileRoute } from "@tanstack/react-router";

/**
 * BENEFIT (BPG) watchdog — the twin of the AFS reconciler.
 * Every few minutes it re-queries the gateway for BENEFIT attempts that are
 * still pending and settles them.
 * Protected by a shared secret header (x-reconcile-key = AFS_RECONCILE_SECRET
 * or the `benefit_reconcile` cron key).
 */
export const Route = createFileRoute("/api/public/benefit-reconcile")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (v: unknown, status = 200) =>
          new Response(JSON.stringify(v), { status, headers: { "Content-Type": "application/json" } });

        const provided = request.headers.get("x-reconcile-key");
        if (!provided) return json({ error: "unauthorized" }, 401);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const safeEqual = (a: string, b: string) => {
          if (a.length !== b.length) return false;
          let diff = 0;
          for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
          return diff === 0;
        };
        const envSecret = process.env.AFS_RECONCILE_SECRET;
        let authorized = !!envSecret && safeEqual(provided, envSecret);
        if (!authorized) {
          const { data: ok } = await supabaseAdmin.rpc("verify_cron_key", { _name: "benefit_reconcile", _key: provided });
          authorized = ok === true;
        }
        if (!authorized) return json({ error: "unauthorized" }, 401);

        const admin = supabaseAdmin as any;
        const windowStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        // Leave a grace period so a shopper still completing 3-D Secure is
        // never written off as abandoned.
        const settleGrace = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: pending, error } = await admin
          .from("payment_attempts")
          .select("*")
          .eq("provider", "benefit")
          .in("state", ["awaiting_customer", "processing"])
          .gte("created_at", windowStart)
          .lte("created_at", settleGrace)
          .order("created_at", { ascending: true })
          .limit(40);
        if (error) return json({ error: error.message }, 500);

        const { loadOrderForPayment, applyGatewayStatus } = await import("@/lib/payments/core.server");
        const { bpayGetStatus, bpayIsSuccess, bpayIsPending } = await import("@/lib/bpay.server");

        let settled = 0;
        let failed = 0;
        let review = 0;
        let first = true;

        for (const attempt of pending ?? []) {
          if (!attempt.external_checkout_id || !attempt.order_id) continue;
          if (!first) await new Promise((r) => setTimeout(r, 1_200));
          first = false;
          try {
            const order = await loadOrderForPayment(attempt.order_id);
            const status = await bpayGetStatus(attempt.external_checkout_id);
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
              source: "reconciliation",
              background: true,
            });
            if (result.success) settled++;
            else if (result.message === "amount_mismatch") review++;
            else failed++;
          } catch {
            review++;
          }
        }

        return json({ checked: pending?.length ?? 0, settled, failed, review });
      },
    },
  },
});
