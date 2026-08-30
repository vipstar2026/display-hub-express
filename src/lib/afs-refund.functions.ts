import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const refundAfsPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string; amount?: number; reason?: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("not_authorized");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    // The database owns refund safety: it locks the order + attempt rows and
    // refuses any amount that would push the refunded total past what was paid.
    const { data: started, error: startError } = await admin.rpc("begin_payment_refund", {
      _actor: context.userId,
      _order_id: data.order_id,
      _amount: data.amount ?? null,
      _reason: data.reason ?? null,
    });
    if (startError) throw new Error(startError.message);
    const refund = Array.isArray(started) ? started[0] : started;
    if (!refund) throw new Error("no_refundable_payment");
    if (refund.provider !== "afs") throw new Error("refund_not_supported_for_provider");

    const amount = Number(refund.amount);
    const { refundAfsPaymentById } = await import("@/lib/payments/afs-adapter.server");
    const result = await refundAfsPaymentById(refund.external_payment_id, amount.toFixed(2), refund.currency);
    if (result.state !== "succeeded" || !result.externalPaymentId) {
      await admin.from("payment_refunds").update({
        state: result.state === "unknown" ? "requires_review" : "failed",
        failure_code: result.code,
        failure_reason: result.description,
      }).eq("id", refund.refund_id);
      return { success: false, amount, partial: amount < Number(refund.remaining), code: result.code, message: result.description };
    }
    const { error } = await admin.rpc("finalize_payment_refund", {
      _refund_id: refund.refund_id,
      _provider_refund_id: result.externalPaymentId,
      _provider_code: result.code,
    });
    if (error) throw new Error(error.message);
    return { success: true, amount, partial: amount < Number(refund.remaining), code: result.code, message: result.description };
  });
