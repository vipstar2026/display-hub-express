import { createFileRoute } from "@tanstack/react-router";

/**
 * AFS / Payon (OPPWA) production webhook endpoint.
 * URL to register with AFS: https://vipstar.cc/api/public/payments/afs
 *
 * Behaviour: the raw notification is recorded, 200 is returned immediately,
 * and decryption + verification + fulfilment happen in the background. The
 * payment result is always re-verified against the gateway API before an
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
        const raw = (await request.text()).trim();
        const ivHex = request.headers.get("x-initialization-vector") ?? request.headers.get("x-iv") ?? "";
        const tagHex = request.headers.get("x-authentication-tag") ?? request.headers.get("x-auth-tag") ?? "";

        try {
          const { logRawNotification, headerMap, processAfsNotification } = await import("@/lib/payments/webhook.server");
          const { runInBackground } = await import("@/lib/payments/background.server");
          await logRawNotification({
            provider: "afs",
            raw,
            headers: headerMap(request, ["x-initialization-vector", "x-authentication-tag", "content-type"]),
          });
          runInBackground(() => processAfsNotification({ raw, ivHex, tagHex }));
        } catch {
          // Only a genuine transient failure gets a 5xx so AFS retries.
          return new Response(JSON.stringify({ error: "temporary" }), {
            status: 503,
            headers: { "Content-Type": "application/json" },
          });
        }

        // Always 200 for accepted/unknown references so the gateway stops retrying.
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
