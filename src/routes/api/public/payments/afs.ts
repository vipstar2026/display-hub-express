import { createFileRoute } from "@tanstack/react-router";

/**
 * AFS / Payon (OPPWA) production webhook endpoint.
 * URL to register with AFS: https://vipstar.cc/api/public/payments/afs
 *
 * AFS posts an AES-256-GCM encrypted body with these headers:
 *   X-Initialization-Vector, X-Authentication-Tag
 * The decryption key is stored manually in the dashboard
 * (Payment Methods → AFS → Webhook decryption key).
 *
 * The payment result is always re-verified against the gateway API before an
 * order is flipped to paid, so a forged notification cannot mark an order paid.
 */
export const Route = createFileRoute("/api/public/payments/afs")({
  server: {
    handlers: {
      GET: async () => new Response("ok"),
      HEAD: async () => new Response(null, { status: 200 }),
      OPTIONS: async () =>
        new Response(null, {
          status: 200,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
          },
        }),
      POST: async ({ request }) => {
        // AFS treats any non-2xx reply as a failed notification and retries.
        // This endpoint therefore ALWAYS answers 200; problems are reported in
        // the JSON body and recorded in activity_log for diagnostics.
        const json = (v: unknown) =>
          new Response(JSON.stringify(v), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });

        const log = async (action: string, details: unknown) => {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            await supabaseAdmin.from("activity_log").insert({
              action,
              entity_type: "afs_webhook",
              details: details as never,
            });
          } catch {
            /* diagnostics only */
          }
        };

        const raw = (await request.text()).trim();

        const { loadAfsConfig, afsDecryptWebhook, afsVerifyNotification, afsIsSuccess, afsIsPending } =
          await import("@/lib/afs.server");


        let cfg;
        try {
          cfg = await loadAfsConfig();
        } catch {
          await log("config_missing", { raw: raw.slice(0, 200) });
          return json({ received: true, error: "gateway not configured" });
        }

        const ivHex =
          request.headers.get("x-initialization-vector") ?? request.headers.get("x-iv") ?? "";
        const tagHex =
          request.headers.get("x-authentication-tag") ?? request.headers.get("x-auth-tag") ?? "";

        let payload: Record<string, unknown> = {};
        if (ivHex && tagHex) {
          if (!cfg.webhookKey) {
            await log("missing_key", { ivHex });
            return json({ received: true, error: "missing decryption key" });
          }
          try {
            payload = await afsDecryptWebhook({
              keyHex: cfg.webhookKey,
              ivHex,
              authTagHex: tagHex,
              bodyHex: raw,
            });
          } catch (e) {
            await log("decryption_failed", { ivHex, message: (e as Error).message });
            return json({ received: true, error: "decryption failed" });
          }
          encrypted = true;
        } else {
          // Unencrypted body: only ever treated as a connectivity probe. It is
          // NEVER allowed to mutate payment or order state.
          try {
            payload = JSON.parse(raw) as Record<string, unknown>;
          } catch {
            payload = Object.fromEntries(new URLSearchParams(raw));
          }
        }

        const pay = (payload["payload"] ?? payload) as Record<string, unknown>;
        const checkoutId = (pay["id"] as string) ?? (pay["ndc"] as string) ?? null;
        const orderNumber = (pay["merchantTransactionId"] as string) ?? null;
        await log("received", {
          checkoutId,
          orderNumber,
          encrypted,
          type: payload["type"] ?? null,
        });

        if (!encrypted) {
          await log("unencrypted_probe_ignored", { checkoutId, orderNumber });
          return json({ received: true, ignored: "unencrypted notification (probe only)" });
        }
        if (!checkoutId && !orderNumber) return json({ received: true, ignored: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        type OrderRow = {
          id: string;
          order_number: string;
          total: number;
          currency: string;
          status: string;
          payment_status: string;
        };
        const cols = "id, order_number, total, currency, status, payment_status";
        let order: OrderRow | null = null;
        let txCheckoutId: string | null = null;
        if (orderNumber) {
          const { data } = await supabaseAdmin
            .from("orders")
            .select(cols)
            .eq("order_number", orderNumber)
            .maybeSingle();
          order = data as OrderRow | null;
        }
        if (checkoutId) {
          const { data: tx } = await supabaseAdmin
            .from("payment_transactions")
            .select("order_id, provider_checkout_id, provider_charge_id")
            .eq("provider", "afs")
            .or(`provider_checkout_id.eq.${checkoutId},provider_charge_id.eq.${checkoutId}`)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (tx) {
            txCheckoutId = (tx.provider_checkout_id as string) ?? (tx.provider_charge_id as string);
            if (!order && tx.order_id) {
              const { data } = await supabaseAdmin
                .from("orders")
                .select(cols)
                .eq("id", tx.order_id)
                .maybeSingle();
              order = data as OrderRow | null;
            }
          }
        }
        // A bank test notification has no matching order — acknowledge it.
        if (!order || !checkoutId) return json({ received: true, ignored: "order not found" });

        const { verifyAfsPaymentForOrder, applyAfsPaymentResult } = await import(
          "@/lib/afs-verify.server"
        );
        // Never trust the notification body: the gate re-queries the gateway
        // and validates amount / currency / reference / association.
        const result = await verifyAfsPaymentForOrder({
          order,
          checkoutId,
          expectedCheckoutId: txCheckoutId,
          source: "webhook",
        });
        await applyAfsPaymentResult({ order, checkoutId, result, source: "webhook" });

        return json({
          received: true,
          status: result.ok ? "succeeded" : result.pending ? "pending" : result.category,
        });
      },
    },
  },
});
