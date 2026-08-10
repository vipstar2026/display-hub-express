import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: any) {
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!isAdmin) throw new Error("forbidden");
}

/** Sends all queued emails in the outbox now. */
export const dispatchEmails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { dispatchOutbox } = await import("@/lib/email.server");
    return await dispatchOutbox(50);
  });

/** Sends a test email to verify the API credentials. */
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { to: string }) => {
    if (!input?.to || !input.to.includes("@")) throw new Error("invalid_email");
    return { to: input.to.trim() };
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { deliver } = await import("@/lib/email.server");
    await deliver({
      to: data.to,
      subject: "VIPSTAR — Test email / رسالة تجريبية",
      text: "تم إعداد إرسال البريد بنجاح.\nEmail sending is configured correctly.\n\nVIPSTAR",
    });
    return { ok: true };
  });
