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

        const { afsGetStatus, afsIsSuccess, afsIsPending, loadAfsConfig } = await import(
          "@/lib/afs.server"
        );
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const envSecret = process.env.AFS_RECONCILE_SECRET;
        let authorized = !!envSecret && provided === envSecret;
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
          .select("id, order_id, provider_charge_id, status, created_at")
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

        let settled = 0;
        let failed = 0;
        const cfg = await loadAfsConfig();

        for (const tx of pending ?? []) {
          if (!tx.provider_charge_id || !tx.order_id) continue;
          let status;
          try {
            status = await afsGetStatus(tx.provider_charge_id, cfg);
          } catch {
            continue;
          }
          const code = status.result?.code;
          if (afsIsPending(code)) continue;

          const success = afsIsSuccess(code);
          await supabaseAdmin
            .from("payment_transactions")
            .update({
              status: success ? "succeeded" : "failed",
              payment_method: status.paymentBrand ?? null,
              raw_response: status as never,
              failure_reason: success ? null : (status.result?.description ?? null),
              paid_at: success ? new Date().toISOString() : null,
            })
            .eq("id", tx.id);

          if (success) {
            await supabaseAdmin
              .from("orders")
              .update({
                payment_status: "succeeded",
                status: "paid",
                paid_at: new Date().toISOString(),
                payment_method: "AFS",
                payment_reference: status.id ?? tx.provider_charge_id,
              })
              .eq("id", tx.order_id)
              .neq("payment_status", "succeeded");
            settled++;
          } else {
            await supabaseAdmin
              .from("orders")
              .update({ payment_status: "failed" })
              .eq("id", tx.order_id)
              .neq("payment_status", "succeeded");
            failed++;
          }
        }

        return new Response(JSON.stringify({ checked: pending?.length ?? 0, settled, failed }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
