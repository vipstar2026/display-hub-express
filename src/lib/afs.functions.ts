import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const createAfsCheckout = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string }) => input)
  .handler(async ({ data, context }) => {
    const { afsPrepareCheckout, loadAfsConfig } = await import("@/lib/afs.server");
    const cfg = await loadAfsConfig();

    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, order_number, total, currency, buyer_id, buyer_email, buyer_name, payment_status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order || order.buyer_id !== context.userId) throw new Error("Order not found");
    if (order.payment_status === "succeeded") throw new Error("Order already paid");

    const [givenName, ...rest] = (order.buyer_name ?? "").trim().split(" ");
    const { checkoutId } = await afsPrepareCheckout({
      amount: Number(order.total).toFixed(2),
      currency: order.currency || "BHD",
      merchantTransactionId: order.order_number,
      email: order.buyer_email,
      givenName: givenName || null,
      surname: rest.join(" ") || null,
      cfg,
    });

    // Track the attempt so a shopper who closes the browser can still be reconciled.
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("payment_transactions").insert({
        order_id: order.id,
        provider: "afs",
        provider_charge_id: checkoutId,
        amount: Number(order.total),
        currency: cfg.currency || order.currency || "BHD",
        status: "pending",
      });
    } catch {
      /* non-fatal: the result page still confirms the payment */
    }

    return {
      checkoutId,
      scriptUrl: `${cfg.widgetBase}?checkoutId=${checkoutId}`,
      amount: Number(order.total).toFixed(2),
      currency: cfg.currency || order.currency || "BHD",
      testMode: cfg.testMode,
      brands: cfg.brands,
      widgetLang: cfg.widgetLang,
      resultUrl: cfg.resultUrl,
    };
  });

export const confirmAfsPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string; checkout_id: string }) => input)
  .handler(async ({ data, context }) => {
    const { afsGetStatus, afsIsSuccess, afsIsPending } = await import("@/lib/afs.server");

    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, order_number, total, buyer_id")
      .eq("id", data.order_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order || order.buyer_id !== context.userId) throw new Error("Order not found");

    const status = await afsGetStatus(data.checkout_id);
    const code = status.result?.code;
    const success = afsIsSuccess(code);
    const pending = afsIsPending(code);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const txPayload = {
      order_id: order.id,
      provider: "afs",
      provider_charge_id: status.id ?? data.checkout_id,
      amount: Number(status.amount ?? order.total),
      currency: status.currency ?? "BHD",
      status: success ? "succeeded" : pending ? "pending" : "failed",
      payment_method: status.paymentBrand ?? null,
      raw_response: status as never,
      failure_reason: success ? null : (status.result?.description ?? null),
      paid_at: success ? new Date().toISOString() : null,
    };

    // Reuse the pending row created when the checkout started, if any.
    const { data: existing } = await supabaseAdmin
      .from("payment_transactions")
      .select("id")
      .eq("order_id", order.id)
      .eq("provider", "afs")
      .eq("provider_charge_id", data.checkout_id)
      .eq("status", "pending")
      .maybeSingle();

    if (existing) {
      await supabaseAdmin.from("payment_transactions").update(txPayload).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("payment_transactions").insert(txPayload);
    }


    if (success) {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "succeeded",
          status: "paid",
          paid_at: new Date().toISOString(),
          payment_method: "AFS",
          payment_reference: status.id ?? data.checkout_id,
        })
        .eq("id", order.id);
    } else if (!pending) {
      await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", order.id);
    }

    return {
      success,
      pending,
      code: code ?? "",
      message: status.result?.description ?? "",
    };
  });
