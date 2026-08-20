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



        // Sweep the last 30 minutes only — that is the lifetime of a Copy&Pay
        // session; anything older can never turn into a payment.
        const admin = supabaseAdmin as any;
        await admin.rpc("abandon_stale_payment_attempts", { _minutes: 30 });

        const windowStart = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: pending, error } = await admin
          .from("payment_attempts")
          .select("*")
          .eq("provider", "afs")
          .in("state", ["awaiting_customer", "processing"])
          .gte("created_at", windowStart)
          .order("created_at", { ascending: true })
          .limit(40);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        // "One attempt only": any checkout or order that already reached a
        // terminal result in the last 24h must never be queried again. Repeated
        // polling of settled checkouts is exactly what triggers 800.120.100.
        const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const { data: settledRows } = await admin
          .from("payment_attempts")
          .select("external_checkout_id, order_id, state")
          .eq("provider", "afs")
          .in("state", ["abandoned", "failed", "succeeded", "cancelled", "expired"])
          .gte("created_at", dayAgo);
        const skipCheckouts = new Set<string>();
        const skipOrders = new Set<string>();
        for (const row of settledRows ?? []) {
          if (row.external_checkout_id) skipCheckouts.add(row.external_checkout_id);
          if (row.order_id) skipOrders.add(row.order_id);
        }
        // Same exclusion for orders created from custom payment links.
        const { data: paidLinks } = await admin
          .from("payment_links")
          .select("order_id, status")
          .in("status", ["paid", "cancelled", "expired"])
          .gte("created_at", dayAgo);
        for (const link of paidLinks ?? []) if (link.order_id) skipOrders.add(link.order_id);

        const { loadOrderForPayment, applyGatewayStatus } = await import("@/lib/payments/core.server");
        const { getAfsPaymentStatus } = await import("@/lib/payments/afs-adapter.server");

        let settled = 0;
        let failed = 0;
        let review = 0;
        let skipped = 0;
        let first = true;

        for (const attempt of pending ?? []) {
          if (!attempt.external_checkout_id || !attempt.order_id) continue;
          if (skipCheckouts.has(attempt.external_checkout_id) || skipOrders.has(attempt.order_id)) {
            skipped++;
            continue;
          }
          // Space the gateway calls out so AFS never rate limits the sweep.
          if (!first) await new Promise((r) => setTimeout(r, 1_200));
          first = false;
          try {
            const order = await loadOrderForPayment(attempt.order_id);
            const status = await getAfsPaymentStatus(attempt.external_checkout_id);
            const result = await applyGatewayStatus({ attempt, order, status, source: "reconciliation", background: true });
            skipCheckouts.add(attempt.external_checkout_id);
            if (result.success) settled++;
            else if (result.message === "gateway_result_integrity_mismatch") review++;
            else failed++;
          } catch {
            review++;
          }
        }

        return new Response(
          JSON.stringify({ checked: pending?.length ?? 0, skipped, settled, failed, review }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
