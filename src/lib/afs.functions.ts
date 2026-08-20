import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { formatGatewayAmount } from "@/lib/afs-money";

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

    const currency = (cfg.currency || order.currency || "BHD").toUpperCase();
    const amount = formatGatewayAmount(order.total, currency);

    const [givenName, ...rest] = (order.buyer_name ?? "").trim().split(" ");
    const { checkoutId } = await afsPrepareCheckout({
      amount,
      currency,
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
        provider_checkout_id: checkoutId,
        amount: Number(order.total),
        currency,
        status: "pending",
      } as never);
    } catch {
      /* non-fatal: the result page still confirms the payment */
    }

    return {
      checkoutId,
      scriptUrl: `${cfg.widgetBase}?checkoutId=${checkoutId}`,
      amount,
      currency,
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
    const { verifyAfsPaymentForOrder, applyAfsPaymentResult } = await import(
      "@/lib/afs-verify.server"
    );

    const { data: order, error } = await context.supabase
      .from("orders")
      .select("id, order_number, total, currency, status, payment_status, buyer_id")
      .eq("id", data.order_id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order || order.buyer_id !== context.userId) throw new Error("Order not found");

    const result = await verifyAfsPaymentForOrder({
      order,
      checkoutId: data.checkout_id,
      source: "confirm_authenticated",
    });
    await applyAfsPaymentResult({
      order,
      checkoutId: data.checkout_id,
      result,
      source: "confirm_authenticated",
    });

    const alreadyPaid = !result.ok && result.category === "already_paid";
    return {
      success: result.ok || alreadyPaid,
      pending: !result.ok && result.pending,
      code: result.code,
      message: result.ok
        ? (result.status.result?.description ?? "")
        : alreadyPaid
          ? ""
          : result.category === "payment_failed"
            ? result.reason
            : "payment_verification_failed",
    };
  });
