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