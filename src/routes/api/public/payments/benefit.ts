import { createFileRoute } from "@tanstack/react-router";
import { BASE } from "@/lib/site-url";

/**
 * BENEFIT / BPay notification (callback) endpoint.
 * Give this URL to the bank: https://vipstar.cc/api/public/payments/benefit
 *
 * Behaviour: the raw notification is recorded, the gateway is answered
 * immediately (200 for server-to-server, 303 to the public result page when
 * the shopper's browser is redirected here), and signature verification plus
 * gateway re-query happen in the background. A forged body can never flip an
 * order to "succeeded" because the result is always re-fetched from BPG.
 */
export const Route = createFileRoute("/api/public/payments/benefit")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const signature =
          request.headers.get("x-signature") ??
          request.headers.get("x-benefit-signature") ??
          request.headers.get("signature");

        let orderId: string | null = null;
        try {
          const { logRawNotification, headerMap, processBenefitNotification } = await import("@/lib/payments/webhook.server");
          const { runInBackground } = await import("@/lib/payments/background.server");
          await logRawNotification({
            provider: "benefit",
            raw,
            headers: headerMap(request, ["x-signature", "x-benefit-signature", "signature", "content-type"]),
          });
          runInBackground(() => processBenefitNotification({ raw, signature }));
          orderId = new URL(request.url).searchParams.get("order");
        } catch {
          return new Response(JSON.stringify({ error: "temporary" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Browser return (BPG posts the shopper back): send them to the public
        // result page instead of rendering a JSON body in their browser.
        const accept = request.headers.get("accept") ?? "";
        if (orderId && accept.includes("text/html")) {
          return new Response(null, {
            status: 303,
            headers: { Location: `${BASE}/pay/result?order=${encodeURIComponent(orderId)}&provider=benefit` },
          });
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
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
