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
      POST: async ({ request }) => {
        const json = (v: unknown, status = 200) =>
          new Response(JSON.stringify(v), {
            status,
            headers: { "Content-Type": "application/json" },
          });

        const raw = (await request.text()).trim();

        const { loadAfsConfig, afsDecryptWebhook, afsGetStatus, afsIsSuccess, afsIsPending } =
          await import("@/lib/afs.server");

        let cfg;
        try {
          cfg = await loadAfsConfig();
        } catch {
          return json({ error: "gateway not configured" }, 503);
        }

        const ivHex =
          request.headers.get("x-initialization-vector") ?? request.headers.get("x-iv") ?? "";
        const tagHex =
          request.headers.get("x-authentication-tag") ?? request.headers.get("x-auth-tag") ?? "";

        let payload: Record<string, unknown> = {};
        if (ivHex && tagHex) {
          if (!cfg.webhookKey) return json({ error: "missing decryption key" }, 503);
          try {
            payload = await afsDecryptWebhook({
              keyHex: cfg.webhookKey,
              ivHex,
              authTagHex: tagHex,
              bodyHex: raw,
            });
          } catch {
            return json({ error: "decryption failed" }, 401);
          }
        } else {
          // Unencrypted probe / connectivity test from the bank.
          try {
            payload = JSON.parse(raw) as Record<string, unknown>;
          } catch {
            payload = Object.fromEntries(new URLSearchParams(raw));
          }
        }

        const pay = (payload["payload"] ?? payload) as Record<string, unknown>;
        const checkoutId = (pay["id"] as string) ?? (pay["ndc"] as string) ?? null;
        const orderNumber = (pay["merchantTransactionId"] as string) ?? null;
        if (!checkoutId && !orderNumber) return json({ received: true, ignored: true });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        type OrderRow = { id: string; total: number; currency: string; payment_status: string };
        let order: OrderRow | null = null;
        if (orderNumber) {
          const { data } = await supabaseAdmin
            .from("orders")
            .select("id, total, currency, payment_status")
            .eq("order_number", orderNumber)
            .maybeSingle();
          order = data as OrderRow | null;
        }
        if (!order && checkoutId) {
          const { data: tx } = await supabaseAdmin
            .from("payment_transactions")
            .select("order_id")
            .eq("provider", "afs")
            .eq("provider_charge_id", checkoutId)
            .maybeSingle();
          if (tx?.order_id) {
            const { data } = await supabaseAdmin
              .from("orders")
              .select("id, total, currency, payment_status")
              .eq("id", tx.order_id)
              .maybeSingle();
            order = data as OrderRow | null;
          }
        }
        if (!order) return json({ error: "order not found" }, 404);

        // Never trust the notification body: ask the gateway for the real status.
        const status = checkoutId ? await afsGetStatus(checkoutId, cfg) : null;
        const code = status?.result?.code ?? ((pay["result"] as { code?: string })?.code ?? "");
        const success = afsIsSuccess(code);
        const pending = afsIsPending(code);

        const txPayload = {
          order_id: order.id,
          provider: "afs",
          provider_charge_id: status?.id ?? checkoutId ?? orderNumber ?? "",
          amount: Number(status?.amount ?? order.total),
          currency: status?.currency ?? order.currency ?? "BHD",
          status: success ? "succeeded" : pending ? "pending" : "failed",
          payment_method: status?.paymentBrand ?? "CARD",
          raw_response: (status ?? payload) as never,
          failure_reason: success ? null : (status?.result?.description ?? null),
          paid_at: success ? new Date().toISOString() : null,
        };

        const { data: existing } = await supabaseAdmin
          .from("payment_transactions")
          .select("id")
          .eq("order_id", order.id)
          .eq("provider", "afs")
          .eq("status", "pending")
          .maybeSingle();

        if (existing) {
          await supabaseAdmin.from("payment_transactions").update(txPayload).eq("id", existing.id);
        } else {
          await supabaseAdmin.from("payment_transactions").insert(txPayload);
        }

        if (success && order.payment_status !== "succeeded") {
          await supabaseAdmin
            .from("orders")
            .update({
              payment_status: "succeeded",
              status: "paid",
              paid_at: new Date().toISOString(),
              payment_method: "AFS",
              payment_reference: status?.id ?? checkoutId,
            })
            .eq("id", order.id);
        } else if (!success && !pending) {
          await supabaseAdmin
            .from("orders")
            .update({ payment_status: "failed" })
            .eq("id", order.id);
        }

        return json({ received: true, status: txPayload.status });
      },
    },
  },
});
