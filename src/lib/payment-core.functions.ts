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
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { order_id: string; checkout_id: string; resource_path?: string }) => input)
  .handler(async ({ data, context }) => {
    const { data: order } = await context.supabase.from("orders").select("id, buyer_id").eq("id", data.order_id).maybeSingle();
    if (!order || order.buyer_id !== context.userId) throw new Error("order_not_found");
    const { confirmAfsCheckout } = await import("@/lib/payments/checkout.server");
    return confirmAfsCheckout({ orderId: order.id, checkoutId: data.checkout_id, resourcePath: data.resource_path, source: "customer_return" });
  });