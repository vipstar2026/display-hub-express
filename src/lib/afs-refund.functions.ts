import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const refundAfsPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string; amount?: number; reason?: string }) => input)
  .handler(async ({ data, context }) => {
    // Admin only
    const { data: role } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!role) throw new Error("not_authorized");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { afsRefund, afsIsSuccess, loadAfsConfig } = await import("@/lib/afs.server");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total, currency, payment_status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order) throw new Error("order_not_found");
    if (order.payment_status !== "succeeded") throw new Error("order_not_paid");

    const { data: tx } = await supabaseAdmin
      .from("payment_transactions")
      .select("id, provider_charge_id, amount, currency")
      .eq("order_id", order.id)
      .eq("provider", "afs")
      .eq("status", "succeeded")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!tx?.provider_charge_id) throw new Error("no_afs_transaction");

    const amount = Number(data.amount ?? order.total);
    if (!(amount > 0) || amount > Number(tx.amount ?? order.total)) throw new Error("invalid_amount");

    const cfg = await loadAfsConfig();
    const res = await afsRefund({
      paymentId: tx.provider_charge_id,
      amount: amount.toFixed(2),
      currency: tx.currency || order.currency || "BHD",
      cfg,
    });

    const ok = afsIsSuccess(res.result?.code);

    await supabaseAdmin.from("payment_transactions").insert({
      order_id: order.id,
      provider: "afs",
      provider_charge_id: res.id ?? tx.provider_charge_id,
      amount: -amount,
      currency: tx.currency || order.currency || "BHD",
      status: ok ? "refunded" : "failed",
      payment_method: "AFS refund",
      raw_response: res as never,
      failure_reason: ok ? null : (res.result?.description ?? "refund failed"),
    });

    if (ok) {
      const full = amount >= Number(order.total) - 0.001;
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: full ? "refunded" : "succeeded",
          status: full ? "refunded" : undefined,
          admin_notes: data.reason ?? undefined,
        } as never)
        .eq("id", order.id);
    }

    return {
      success: ok,
      amount,
      code: res.result?.code ?? "",
      message: res.result?.description ?? "",
    };
  });
