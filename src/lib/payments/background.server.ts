/**
 * Runs work *after* the HTTP response has been sent.
 *
 * Payment gateways treat a slow webhook reply as a failed notification and
 * retry it, so every webhook must answer immediately and finish verification
 * in the background. On Cloudflare Workers the isolate is kept alive with
 * `waitUntil`; elsewhere (dev/node) the floating promise is enough.
 */
export function runInBackground(task: () => Promise<unknown>): Promise<void> {
  const promise = Promise.resolve()
    .then(task)
    .then(
      () => undefined,
      async (err) => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("activity_log").insert({
            action: "background_task_failed",
            entity_type: "payment_webhook",
            details: { message: (err as Error)?.message ?? String(err) } as never,
          });
        } catch {
          /* diagnostics only */
        }
      },
    );

  const specifier = "cloudflare:workers";
  try {
    import(/* @vite-ignore */ specifier)
      .then((mod: Record<string, unknown>) => {
        const waitUntil = mod["waitUntil"];
        if (typeof waitUntil === "function") (waitUntil as (p: Promise<unknown>) => void)(promise);
      })
      .catch(() => {});
  } catch {
    /* not running on Workers */
  }

  return promise;
}
