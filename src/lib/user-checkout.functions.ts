import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Authenticated checkout. Mirrors the guest-checkout server flow: prices,
 * stock, shipping, coupons and totals are re-computed from the database and
 * never trusted from the browser. The order is written with the admin client
 * after the bearer token has been verified, so `orders` needs no permissive
 * client-side INSERT policy.
 */

type Item = { product_id: string; quantity: number };

type PlaceUserOrderInput = {
  items: Item[];
  payment_method_id: string;
  payment_reference?: string | null;
  payment_proof_url?: string | null;
  customer_notes?: string | null;
  coupon_code?: string | null;
  fulfillment: "delivery" | "pickup";
  shipping_rate_id?: string | null;
  address_id?: string | null;
  shipping_address?: Record<string, string> | null;
  idempotency_key: string;
};

function bad(message: string): never {
  throw new Error(message);
}

export const placeUserOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: PlaceUserOrderInput) => {
    if (!Array.isArray(input.items) || input.items.length === 0) bad("empty_cart");
    if (input.items.length > 50) bad("too_many_items");
    if (!input.payment_method_id) bad("payment_method_required");
    if (!input.idempotency_key || input.idempotency_key.length < 8) bad("invalid_request");
    for (const i of input.items) {
      if (!i.product_id || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 99) bad("invalid_quantity");
    }
    return input;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;
    const userId = context.userId;

    const { data: existing } = await admin
      .from("orders")
      .select("id, payment_method_id")
      .eq("idempotency_key", data.idempotency_key)
      .maybeSingle();
    if (existing) return { order_id: existing.id as string, gateway: null as string | null };

    const { data: settings } = await admin
      .from("site_settings")
      .select("default_currency, vat_percent, prices_include_vat")
      .eq("id", 1)
      .maybeSingle();

    const ids = data.items.map((i) => i.product_id);
    const { data: products } = await admin
      .from("products")
      .select("id, name_en, name_ar, price, type, status, stock, track_stock")
      .in("id", ids);
    if (!products || products.length !== ids.length) bad("product_unavailable");

    let subtotal = 0;
    let hasPhysical = false;
    const orderItems: Record<string, unknown>[] = [];

    for (const item of data.items) {
      const p = products.find((x: any) => x.id === item.product_id);
      if (!p || p.status !== "active") bad("product_unavailable");
      if (p.type === "physical") {
        hasPhysical = true;
        if (p.track_stock && Number(p.stock) < item.quantity) bad("out_of_stock");
      } else {
        const { data: avail } = await admin.rpc("digital_stock_available", { _product_id: p.id });
        if (Number(avail ?? 0) < item.quantity) bad("digital_stock_unavailable");
      }
      const line = Number(p.price) * item.quantity;
      subtotal += line;
      orderItems.push({
        product_id: p.id,
        product_name: p.name_en || p.name_ar,
        product_type: p.type,
        unit_price: Number(p.price),
        quantity: item.quantity,
        total: Number(line.toFixed(3)),
      });
    }
    subtotal = Number(subtotal.toFixed(3));

    const { data: method } = await admin
      .from("payment_methods")
      .select("id, code, is_active, is_gateway, gateway_provider, fee_amount, fee_percent, requires_proof")
      .eq("id", data.payment_method_id)
      .maybeSingle();
    if (!method || !method.is_active) bad("payment_method_unavailable");
    if (method.requires_proof && !data.payment_proof_url) bad("payment_proof_required");
    const fee = Number(method.fee_amount ?? 0) + (subtotal * Number(method.fee_percent ?? 0)) / 100;

    // Shipping
    let shippingCost = 0;
    let shippingMethod: string | null = "digital";
    let rateId: string | null = null;
    let addressId: string | null = null;
    let addressSnapshot: Record<string, unknown> | null = null;

    if (hasPhysical) {
      if (data.fulfillment === "pickup") {
        shippingMethod = "pickup";
      } else {
        if (data.address_id) {
          const { data: addr } = await admin
            .from("addresses")
            .select("id, user_id, full_name, phone, address_line, city, country, postal_code")
            .eq("id", data.address_id)
            .maybeSingle();
          if (!addr || addr.user_id !== userId) bad("address_required");
          addressId = addr.id;
          addressSnapshot = {
            full_name: addr.full_name,
            phone: addr.phone,
            address_line: addr.address_line,
            city: addr.city,
            country: addr.country,
            postal_code: addr.postal_code,
          };
        } else if (data.shipping_address?.full_name && data.shipping_address?.address_line) {
          addressSnapshot = { ...data.shipping_address };
        } else {
          bad("address_required");
        }

        const { data: rate } = data.shipping_rate_id
          ? await admin
              .from("shipping_rates")
              .select("id, price, free_over, method, is_active")
              .eq("id", data.shipping_rate_id)
              .maybeSingle()
          : { data: null };
        if (rate?.is_active) {
          rateId = rate.id;
          shippingMethod = rate.method;
          shippingCost = rate.free_over && subtotal >= Number(rate.free_over) ? 0 : Number(rate.price);
        } else {
          shippingMethod = "delivery";
        }
      }
    }

    // Coupon (validated server-side)
    let discount = 0;
    let couponId: string | null = null;
    let couponCode: string | null = null;
    if (data.coupon_code) {
      const { data: res } = await admin.rpc("validate_coupon", { _code: data.coupon_code, _subtotal: subtotal });
      const row = Array.isArray(res) ? res[0] : res;
      if (row?.valid) {
        discount = Number(row.discount_amount ?? 0);
        couponId = row.coupon_id;
        couponCode = data.coupon_code.toUpperCase();
      }
    }

    const beforeTax = Math.max(0, subtotal + shippingCost + fee - discount);
    const vat = Number(settings?.vat_percent ?? 0);
    const tax =
      vat > 0
        ? settings?.prices_include_vat
          ? Number(((beforeTax * vat) / (100 + vat)).toFixed(3))
          : Number(((beforeTax * vat) / 100).toFixed(3))
        : 0;
    const total = settings?.prices_include_vat ? beforeTax : Number((beforeTax + tax).toFixed(3));

    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", userId)
      .maybeSingle();

    const { data: authUser } = await admin.auth.admin.getUserById(userId);
    const email = authUser?.user?.email ?? "";
    if (!email) bad("account_email_missing");

    const { data: order, error } = await admin
      .from("orders")
      .insert({
        buyer_id: userId,
        buyer_email: email,
        buyer_name: profile?.display_name ?? null,
        subtotal,
        discount,
        tax,
        shipping: shippingCost,
        shipping_cost: shippingCost,
        total,
        currency: settings?.default_currency || "BHD",
        status: "pending",
        payment_status: "pending",
        payment_method_id: method.id,
        payment_proof_url: data.payment_proof_url || null,
        payment_reference: data.payment_reference || null,
        customer_notes: data.customer_notes || null,
        coupon_id: couponId,
        coupon_code: couponCode,
        shipping_rate_id: rateId,
        shipping_method: shippingMethod,
        address_id: addressId,
        shipping_address: addressSnapshot,
        idempotency_key: data.idempotency_key,
        channel: "online",
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { error: itemsError } = await admin
      .from("order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
    if (itemsError) {
      await admin.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    if (couponId) {
      await admin.from("coupon_usage").insert({
        coupon_id: couponId,
        order_id: order.id,
        user_id: userId,
        discount_amount: discount,
      });
      const { data: c } = await admin.from("coupons").select("used_count").eq("id", couponId).maybeSingle();
      await admin
        .from("coupons")
        .update({ used_count: Number(c?.used_count ?? 0) + 1 })
        .eq("id", couponId);
    }

    const { createPaymentAttempt } = await import("@/lib/payments/core.server");
    const kind = method.is_gateway ? "gateway" : method.requires_proof ? "manual" : "cash";
    const attempt = await createPaymentAttempt({
      order: {
        id: order.id,
        order_number: (await admin.from("orders").select("order_number").eq("id", order.id).single()).data.order_number,
        total,
        currency: settings?.default_currency || "BHD",
        payment_status: "pending",
        status: "pending",
        buyer_email: email,
        buyer_name: profile?.display_name ?? null,
      },
      paymentMethodId: method.id,
      provider: method.gateway_provider || method.code,
      kind,
      attemptKey: `order:${order.id}:${method.id}`,
    });
    if (kind === "manual") {
      await admin.from("manual_payment_reviews").insert({
        attempt_id: attempt.id,
        proof_path: data.payment_proof_url || null,
        customer_reference: data.payment_reference || null,
      });
    }

    return {
      order_id: order.id as string,
      gateway: method.is_gateway ? (method.gateway_provider || method.code) : null,
    };
  });
