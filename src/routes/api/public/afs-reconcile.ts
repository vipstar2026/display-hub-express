import { createFileRoute } from "@tanstack/react-router";

/**
 * Reconciles orders that are still pending because the shopper closed the
 * browser before returning from the AFS payment page.
 * Protected by a shared secret header (x-reconcile-key = AFS_RECONCILE_SECRET).
 */
export const Route = createFileRoute("/api/public/afs-reconcile")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const provided = request.headers.get("x-reconcile-key");
        if (!provided) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Constant-time comparison so the shared secret cannot be probed byte-by-byte.
        const safeEqual = (a: string, b: string) => {
          if (a.length !== b.length) return false;
          let diff = 0;
          for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
          return diff === 0;
        };

        const envSecret = process.env.AFS_RECONCILE_SECRET;
        let authorized = !!envSecret && safeEqual(provided, envSecret);
        if (!authorized) {
          const { data: ok } = await supabaseAdmin.rpc("verify_cron_key", {
            _name: "afs_reconcile",
            _key: provided,
          });
          authorized = ok === true;
        }
        if (!authorized) {
          return new Response(JSON.stringify({ error: "unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }



        const since = new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString();
        const { data: pending, error } = await (supabaseAdmin as any)
          .from("payment_attempts")
          .select("*")
          .eq("provider", "afs")
          .in("state", ["awaiting_customer", "processing"])
          .gte("created_at", since)
          .limit(50);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { loadOrderForPayment, applyGatewayStatus } = await import("@/lib/payments/core.server");
        const { getAfsPaymentStatus } = await import("@/lib/payments/afs-adapter.server");

        let settled = 0;
        let failed = 0;
        let review = 0;

        for (const attempt of pending ?? []) {
          if (!attempt.external_checkout_id || !attempt.order_id) continue;
          try {
            const order = await loadOrderForPayment(attempt.order_id);
            const status = await getAfsPaymentStatus(attempt.external_checkout_id);
            const result = await applyGatewayStatus({ attempt, order, status, source: "reconciliation" });
            if (result.success) settled++;
            else if (result.pending) continue;
            else if (result.message === "gateway_result_integrity_mismatch") review++;
            else failed++;
          } catch {
            review++;
          }
        }

        return new Response(
          JSON.stringify({ checked: pending?.length ?? 0, settled, failed, review }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
