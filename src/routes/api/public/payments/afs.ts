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

        let cfg;
        try {
          const { loadAfsPaymentConfig } = await import("@/lib/payments/afs-adapter.server");
          cfg = await loadAfsPaymentConfig();
        } catch {
          await log("config_missing", { raw: raw.slice(0, 200) });
          return json({ received: true, error: "gateway not configured" });
        }

        const ivHex =
          request.headers.get("x-initialization-vector") ?? request.headers.get("x-iv") ?? "";
        const tagHex =
          request.headers.get("x-authentication-tag") ?? request.headers.get("x-auth-tag") ?? "";

        let payload: Record<string, unknown> = {};
        let encrypted = false;
        if (ivHex && tagHex) {
          if (!cfg.webhookKey) {
            await log("missing_key", { ivHex });
            return json({ received: true, error: "missing decryption key" });
          }
          try {
            const { decryptAfsWebhook } = await import("@/lib/payments/afs-adapter.server");
            payload = await decryptAfsWebhook({
              key: cfg.webhookKey,
              iv: ivHex,
              tag: tagHex,
              body: raw,
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

        if (!checkoutId) return json({ received: true, ignored: "checkout not found" });
        const { getAttemptByCheckout, loadOrderForPayment, applyGatewayStatus } = await import("@/lib/payments/core.server");
        const { getAfsPaymentStatus } = await import("@/lib/payments/afs-adapter.server");
        let attempt;
        try {
          attempt = await getAttemptByCheckout("afs", checkoutId);
        } catch {
          return json({ received: true, ignored: "payment attempt not found" });
        }
        const order = await loadOrderForPayment(attempt.order_id);
        if (orderNumber && order.order_number !== orderNumber) {
          await log("reference_mismatch", { checkoutId, orderNumber });
          return json({ received: true, ignored: "reference mismatch" });
        }
        const status = await getAfsPaymentStatus(checkoutId);
        const result = await applyGatewayStatus({ attempt, order, status, source: "webhook" });

        return json({
          received: true,
          status: result.success ? "succeeded" : result.pending ? "pending" : "failed",
        });
      },
    },
  },
});
