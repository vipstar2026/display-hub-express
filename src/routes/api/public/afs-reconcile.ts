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
        const { data: pending, error } = await supabaseAdmin
          .from("payment_transactions")
          .select("id, order_id, provider_charge_id, provider_checkout_id, status, created_at")
          .eq("provider", "afs")
          .eq("status", "pending")
          .gte("created_at", since)
          .limit(50);

        if (error) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }

        const { verifyAfsPaymentForOrder, applyAfsPaymentResult } = await import(
          "@/lib/afs-verify.server"
        );

        let settled = 0;
        let failed = 0;
        let review = 0;

        for (const tx of pending ?? []) {
          const checkoutId =
            (tx as { provider_checkout_id?: string | null }).provider_checkout_id ??
            tx.provider_charge_id;
          if (!checkoutId || !tx.order_id) continue;

          const { data: order } = await supabaseAdmin
            .from("orders")
            .select("id, order_number, total, currency, status, payment_status")
            .eq("id", tx.order_id)
            .maybeSingle();
          if (!order) continue;

          // Reconciliation uses the exact same verification gate as checkout.
          const result = await verifyAfsPaymentForOrder({
            order,
            checkoutId,
            expectedCheckoutId: checkoutId,
            source: "reconcile",
          });
          if (!result.ok && result.pending) continue;

          await applyAfsPaymentResult({ order, checkoutId, result, source: "reconcile" });

          if (result.ok) settled++;
          else if (result.category === "payment_failed" || result.category === "gateway_unknown")
            failed++;
          else review++;
        }

        return new Response(
          JSON.stringify({ checked: pending?.length ?? 0, settled, failed, review }),
          { headers: { "Content-Type": "application/json" } },
        );
      },
    },
  },
});
