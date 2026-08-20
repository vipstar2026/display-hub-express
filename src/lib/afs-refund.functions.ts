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
    const { data: attempt } = await admin.from("payment_attempts").select("*").eq("order_id", data.order_id).eq("provider", "afs").in("state", ["succeeded", "refunded"]).order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!attempt?.external_payment_id) throw new Error("no_refundable_payment");
    const { data: previous } = await admin.from("payment_refunds").select("amount").eq("attempt_id", attempt.id).eq("state", "succeeded");
    const alreadyRefunded = (previous ?? []).reduce((sum: number, row: { amount: number }) => sum + Number(row.amount), 0);
    const remaining = Number((Number(attempt.expected_amount) - alreadyRefunded).toFixed(3));
    const amount = data.amount ?? remaining;
    if (!Number.isFinite(amount) || amount <= 0 || amount > remaining) throw new Error("invalid_refund_amount");
    const idempotencyKey = `refund:${attempt.id}:${crypto.randomUUID()}`;
    const { data: refund, error: insertError } = await admin.from("payment_refunds").insert({
      attempt_id: attempt.id,
      amount,
      currency: attempt.currency,
      state: "processing",
      idempotency_key: idempotencyKey,
      reason: data.reason ?? null,
      requested_by: context.userId,
    }).select("id").single();
    if (insertError) throw new Error(insertError.message);
    const { refundAfsPaymentById } = await import("@/lib/payments/afs-adapter.server");
    const result = await refundAfsPaymentById(attempt.external_payment_id, Number(amount).toFixed(2), attempt.currency);
    if (result.state !== "succeeded" || !result.externalPaymentId) {
      await admin.from("payment_refunds").update({ state: result.state === "unknown" ? "requires_review" : "failed", failure_code: result.code, failure_reason: result.description }).eq("id", refund.id);
      return { success: false, amount, partial: amount < remaining, code: result.code, message: result.description };
    }
    const { error } = await admin.rpc("finalize_payment_refund", { _refund_id: refund.id, _provider_refund_id: result.externalPaymentId, _provider_code: result.code });
    if (error) throw new Error(error.message);
    return { success: true, amount, partial: amount < remaining, code: result.code, message: result.description };
  });