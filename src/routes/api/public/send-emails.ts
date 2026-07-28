import { createFileRoute } from "@tanstack/react-router";

/**
 * Sends queued emails from the outbox. Called by the scheduled job.
 * Protected by a shared key header (x-dispatch-key), verified against
 * private.cron_keys ('email_dispatch').
 */
export const Route = createFileRoute("/api/public/send-emails")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const json = (b: unknown, status = 200) =>
          new Response(JSON.stringify(b), {
            status,
            headers: { "Content-Type": "application/json" },
          });

        const provided = request.headers.get("x-dispatch-key");
        if (!provided) return json({ error: "unauthorized" }, 401);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: ok } = await supabaseAdmin.rpc("verify_cron_key", {
          _name: "email_dispatch",
          _key: provided,
        });
        if (ok !== true) return json({ error: "unauthorized" }, 401);

        const { dispatchOutbox } = await import("@/lib/email.server");
        try {
          return json(await dispatchOutbox(50));
        } catch (e) {
          return json({ error: (e as Error).message }, 500);
        }
      },
    },
  },
});
