import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const startUserAfsPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string; attempt_key: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase.from("orders").select("id, buyer_id, payment_method_id").eq("id", data.order_id).maybeSingle();
    if (!order || order.buyer_id !== context.userId) throw new Error("order_not_found");
    const { startAfsCheckout } = await import("@/lib/payments/checkout.server");
    return startAfsCheckout({ orderId: order.id, paymentMethodId: order.payment_method_id, attemptKey: data.attempt_key, returnPath: `/pay/result?order=${order.id}` });
  });

export const confirmUserAfsPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { order_id: string; checkout_id: string; resource_path?: string; background?: boolean }) => input)
  .handler(async ({ data }) => {
    // The gateway returns in a new top-level navigation. Browser privacy and
    // cross-site 3DS flows can omit the customer's auth session on that first
    // request, so authorize this callback by the unguessable checkout id and
    // its server-side order binding instead of requiring a browser bearer.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Database first: a webhook may already have settled this order, in which
    // case we answer "paid" without touching the gateway at all.
    const { data: paidOrder } = await supabaseAdmin
      .from("orders")
      .select("payment_status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (paidOrder?.payment_status === "succeeded") {
      return { success: true, pending: false, abandoned: false, cancelled: false, rateLimited: false, code: "", message: "" };
    }

    const { data: attempt } = await supabaseAdmin
      .from("payment_attempts")
      .select("order_id")
      .eq("provider", "afs")
      .eq("external_checkout_id", data.checkout_id)
      .maybeSingle();
    if (!attempt || attempt.order_id !== data.order_id) throw new Error("payment_attempt_mismatch");
    const { confirmAfsCheckout } = await import("@/lib/payments/checkout.server");
    return confirmAfsCheckout({ orderId: data.order_id, checkoutId: data.checkout_id, resourcePath: data.resource_path, source: data.background ? "background_check" : "customer_return", background: !!data.background });
  });
/**
 * Database-first payment state for the result page. Returns "paid" as soon as
 * the webhook has settled the order, without depending on the gateway.
 * Authorized by the unguessable order id (returns status only, no PII).
 */
export const getOrderPaymentState = createServerFn({ method: "POST" })
  .inputValidator((input: { order_id: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("payment_status, status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (!order) throw new Error("order_not_found");
    const { data: attempt } = await (supabaseAdmin as any)
      .from("payment_attempts")
      .select("state, failure_code, failure_reason, payment_brand, external_payment_id")
      .eq("order_id", data.order_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const paid = order.payment_status === "succeeded";
    const state: string = attempt?.state ?? (paid ? "succeeded" : "created");
    return {
      success: paid,
      cancelled: !paid && (state === "cancelled" || order.status === "cancelled"),
      pending: !paid && (state === "created" || state === "awaiting_customer" || state === "processing" || state === "requires_review"),
      abandoned: state === "abandoned" || state === "expired",
      rateLimited: false,
      code: attempt?.failure_code ?? "",
      message: attempt?.failure_reason ?? "",
    };
  });
