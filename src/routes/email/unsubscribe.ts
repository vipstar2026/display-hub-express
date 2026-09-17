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
        if (!token) return json({ valid: false, reason: "missing_token" });

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { data, error } = await supabaseAdmin
            .from("email_unsubscribe_tokens")
            .select("email, used_at")
            .eq("token", token)
            .maybeSingle();

          if (error) {
            console.error("[unsubscribe] lookup failed", error.message);
            return json({ valid: false, reason: "lookup_failed" });
          }
          if (!data) return json({ valid: false, reason: "not_found" });
          return json({ valid: true, email: data.email, used: !!data.used_at });
        } catch (e) {
          console.error("[unsubscribe] lookup threw", (e as Error).message);
          return json({ valid: false, reason: "lookup_failed" });
        }
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

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const admin = supabaseAdmin as any;

          const { data: row, error } = await admin
            .from("email_unsubscribe_tokens")
            .select("email, used_at")
            .eq("token", token)
            .maybeSingle();
          if (error) {
            console.error("[unsubscribe] POST lookup failed", error.message);
            return json({ ok: false, reason: "lookup_failed" });
          }
          if (!row) return json({ ok: false, reason: "not_found" });

          const email = String(row.email).toLowerCase();

          const { error: suppressError } = await admin
            .from("suppressed_emails")
            .upsert({ email, reason: "unsubscribe", metadata: null }, { onConflict: "email" });

          const { error: subError } = await admin
            .from("newsletter_subscribers")
            .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
            .eq("email", email);

          const writeFailed = suppressError || subError;
          const { error: logError } = await admin.from("email_send_log").insert({
            template_name: "unsubscribe",
            recipient_email: email,
            status: writeFailed ? "failed" : "suppressed",
            ...(writeFailed
              ? { error_message: `unsubscribe_write_failed: ${(suppressError || subError)!.message}` }
              : {}),
          });
          if (logError) console.warn("[unsubscribe] log insert failed", logError.message);

          if (writeFailed) {
            console.error("[unsubscribe] write failed", (suppressError || subError)!.message);
            return json({ ok: false, reason: "write_failed" }, 500);
          }

          if (!row.used_at) {
            const { error: tokenError } = await admin
              .from("email_unsubscribe_tokens")
              .update({ used_at: new Date().toISOString() })
              .eq("token", token);
            if (tokenError) console.warn("[unsubscribe] token stamp failed", tokenError.message);
          }

          return json({ ok: true });
        } catch (e) {
          console.error("[unsubscribe] POST threw", (e as Error).message);
          return json({ ok: false, reason: "lookup_failed" });
        }
      },
    },
  },
});
