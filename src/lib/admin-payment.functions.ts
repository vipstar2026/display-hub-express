import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const reviewManualPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string; approved: boolean; notes?: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("not_authorized");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    let { data: attempt } = await admin.from("payment_attempts").select("id").eq("order_id", data.order_id).eq("kind", "manual").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!attempt) {
      const { loadOrderForPayment, createPaymentAttempt } = await import("@/lib/payments/core.server");
      const order = await loadOrderForPayment(data.order_id);
      attempt = await createPaymentAttempt({ order, provider: "manual", kind: "manual", attemptKey: `legacy-manual:${order.id}`, returnUrl: null });
      await admin.from("manual_payment_reviews").upsert({ attempt_id: attempt.id, state: "pending" }, { onConflict: "attempt_id" });
    }
    const { error } = await admin.rpc("review_manual_payment_attempt", {
      _attempt_id: attempt.id,
      _approved: data.approved,
      _reviewed_by: context.userId,
      _notes: data.notes ?? null,
    });
    if (error) throw new Error(error.message);
    return { success: true };
  });