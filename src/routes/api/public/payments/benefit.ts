import { createFileRoute } from "@tanstack/react-router";
import { BASE } from "@/lib/site-url";

/**
 * BENEFIT Payment Gateway (classic BPG) response / error endpoint.
 * Registered with the bank as: https://vipstar.cc/api/public/payments/benefit
 *
 * BENEFIT's required order for this page:
 *   1. log the received notification,
 *   2. print the string `REDIRECT=<someURL>`,
 *   3. only then run internal processing (in the background).
 *
 * The posted body is AES-encrypted with the Terminal Resource Key, so a body
 * that decrypts is genuine; a CAPTURED result is still re-confirmed with a
 * transaction inquiry before the order is finalized.
 */
export const Route = createFileRoute("/api/public/payments/benefit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();

        let orderId = new URL(request.url).searchParams.get("order");
        try {
          const { logRawNotification, headerMap, processBenefitNotification } = await import(
            "@/lib/payments/webhook.server"
          );
          const { runInBackground } = await import("@/lib/payments/background.server");

          // 1 — log the raw notification first (backup if processing fails).
          await logRawNotification({
            provider: "benefit",
            raw,
            headers: headerMap(request, ["content-type", "user-agent"]),
          });

          if (!orderId) {
            try {
              const { bpayParseNotification } = await import("@/lib/bpay.server");
              const note = await bpayParseNotification(raw);
              orderId = note.orderId;
            } catch {
              /* keep the generic result page */
            }
          }

          // 3 — internal processing runs after the reply is produced.
          runInBackground(() => processBenefitNotification({ raw, signature: null }));
        } catch {
          /* never block the REDIRECT reply */
        }

        // 2 — the exact contract BPG expects from the response page.
        // Detect guest orders so the browser lands on the guest result page
        // (which uses the token, not a Supabase session, for confirmation).
        let target = `${BASE}/pay/result?provider=benefit`;
        if (orderId) {
          try {
            const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
            const { data: ord } = await (supabaseAdmin as any)
              .from("orders")
              .select("guest_token")
              .eq("id", orderId)
              .maybeSingle();
            if (ord?.guest_token) {
              target = `${BASE}/guest-pay/result?order=${encodeURIComponent(orderId)}&t=${encodeURIComponent(ord.guest_token)}&provider=benefit`;
            } else {
              target = `${BASE}/pay/result?order=${encodeURIComponent(orderId)}&provider=benefit`;
            }
          } catch {
            target = `${BASE}/pay/result?order=${encodeURIComponent(orderId)}&provider=benefit`;
          }
        }
        return new Response(`REDIRECT=${target}`, {
          status: 200,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      },
      GET: async ({ request }) => {
        const orderId = new URL(request.url).searchParams.get("order");
        if (orderId) {
          return new Response(null, {
            status: 303,
            headers: { Location: `${BASE}/pay/result?order=${encodeURIComponent(orderId)}&provider=benefit` },
          });
        }
        return new Response("ok");
      },
    },
  },
});
