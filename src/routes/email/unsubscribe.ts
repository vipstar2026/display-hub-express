import { createFileRoute } from "@tanstack/react-router";

/**
 * Email unsubscribe endpoint.
 * GET  /email/unsubscribe?token=... -> validates the token
 * POST /email/unsubscribe { token } -> records the opt-out
 */
export const Route = createFileRoute("/email/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const json = (b: unknown, status = 200) =>
          new Response(JSON.stringify(b), {
            status,
            headers: { "Content-Type": "application/json" },
          });

        const token = new URL(request.url).searchParams.get("token")?.trim();
        if (!token) return json({ valid: false }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin
          .from("email_unsubscribe_tokens")
          .select("email, used_at")
          .eq("token", token)
          .maybeSingle();

        if (error) return json({ valid: false }, 500);
        if (!data) return json({ valid: false }, 404);
        return json({ valid: true, email: data.email, used: !!data.used_at });
      },

      POST: async ({ request }) => {
        const json = (b: unknown, status = 200) =>
          new Response(JSON.stringify(b), {
            status,
            headers: { "Content-Type": "application/json" },
          });

        let token: string | undefined;
        try {
          const body = (await request.json()) as { token?: string };
          token = body?.token?.trim();
        } catch {
          return json({ ok: false }, 400);
        }
        if (!token) return json({ ok: false }, 400);

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const admin = supabaseAdmin as any;

        const { data: row, error } = await admin
          .from("email_unsubscribe_tokens")
          .select("email, used_at")
          .eq("token", token)
          .maybeSingle();
        if (error) return json({ ok: false }, 500);
        if (!row) return json({ ok: false }, 404);

        const email = String(row.email).toLowerCase();

        await admin
          .from("suppressed_emails")
          .upsert({ email, reason: "unsubscribe", metadata: null }, { onConflict: "email" });

        await admin
          .from("newsletter_subscribers")
          .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
          .eq("email", email);

        if (!row.used_at) {
          await admin
            .from("email_unsubscribe_tokens")
            .update({ used_at: new Date().toISOString() })
            .eq("token", token);
        }

        return json({ ok: true });
      },
    },
  },
});
