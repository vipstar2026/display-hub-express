import { createServerFn } from "@tanstack/react-start";

/**
 * Guest checkout. Runs entirely server-side with the admin client so the
 * anonymous role needs no table privileges. Prices, stock and totals are
 * re-computed from the database — never trusted from the browser.
 */

type GuestItem = { product_id: string; quantity: number };

type PlaceGuestOrderInput = {
  items: GuestItem[];
  buyer_email: string;
  buyer_name?: string | null;
  buyer_phone?: string | null;
  payment_method_id: string;
  payment_reference?: string | null;
  customer_notes?: string | null;
  coupon_code?: string | null;
  fulfillment: "delivery" | "pickup";
  shipping_rate_id?: string | null;
  shipping_address?: Record<string, string> | null;
  idempotency_key: string;
};

function bad(message: string): never {
  throw new Error(message);
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function randomToken() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const placeGuestOrder = createServerFn({ method: "POST" })
  .inputValidator((input: PlaceGuestOrderInput) => {
    if (!Array.isArray(input.items) || input.items.length === 0) bad("empty_cart");
    if (input.items.length > 50) bad("too_many_items");
    if (!input.buyer_email || !EMAIL_RE.test(input.buyer_email)) bad("invalid_email");
    if (!input.payment_method_id) bad("payment_method_required");
    if (!input.idempotency_key || input.idempotency_key.length < 8) bad("invalid_request");
    for (const i of input.items) {
      if (!i.product_id || !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 99) bad("invalid_quantity");
    }
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as any;

    // Idempotency: the same submission never creates two orders.
    const { data: existing } = await admin
      .from("orders")
      .select("id, guest_token")
      .eq("idempotency_key", data.idempotency_key)
      .maybeSingle();
    if (existing) return { order_id: existing.id as string, guest_token: existing.guest_token as string, gateway: null as string | null };

    const { data: settings } = await admin
      .from("site_settings")
      .select("allow_guest_checkout, default_currency, vat_percent, prices_include_vat")
      .eq("id", 1)
      .maybeSingle();
    if (!settings?.allow_guest_checkout) bad("guest_checkout_disabled");

    const ids = data.items.map((i) => i.product_id);
    const { data: products } = await admin
      .from("products")
      .select("id, name_en, name_ar, price, type, status, stock, track_stock")
      .in("id", ids);
    if (!products || products.length !== ids.length) bad("product_unavailable");

    let subtotal = 0;
    const orderItems: Record<string, unknown>[] = [];
    let hasPhysical = false;

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

    // Payment method (must be active)
    const { data: method } = await admin
      .from("payment_methods")
      .select("id, code, is_active, is_gateway, gateway_provider, fee_amount, fee_percent, requires_proof")
      .eq("id", data.payment_method_id)
      .maybeSingle();
    if (!method || !method.is_active) bad("payment_method_unavailable");
    if (method.requires_proof) bad("payment_method_requires_account");
    const fee = Number(method.fee_amount ?? 0) + (subtotal * Number(method.fee_percent ?? 0)) / 100;

    // Shipping
    let shippingCost = 0;
    let shippingMethod: string | null = "digital";
    let rateId: string | null = null;
    if (hasPhysical) {
      if (data.fulfillment === "pickup") {
        shippingMethod = "pickup";
      } else {
        if (!data.shipping_address?.full_name || !data.shipping_address?.address_line) bad("address_required");
        const { data: rate } = data.shipping_rate_id
          ? await admin.from("shipping_rates").select("id, price, free_over, method, is_active").eq("id", data.shipping_rate_id).maybeSingle()
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
    const vat = Number(settings.vat_percent ?? 0);
    const tax = vat > 0
      ? settings.prices_include_vat
        ? Number(((beforeTax * vat) / (100 + vat)).toFixed(3))
        : Number(((beforeTax * vat) / 100).toFixed(3))
      : 0;
    const total = settings.prices_include_vat ? beforeTax : Number((beforeTax + tax).toFixed(3));

    const guestToken = randomToken();
    const { data: order, error } = await admin
      .from("orders")
      .insert({
        buyer_id: null,
        buyer_email: data.buyer_email.trim().toLowerCase(),
        buyer_name: data.buyer_name || null,
        buyer_phone: data.buyer_phone || null,
        subtotal,
        discount,
        tax,
        shipping: shippingCost,
        shipping_cost: shippingCost,
        total,
        currency: settings.default_currency || "BHD",
        status: "pending",
        payment_status: "pending",
        payment_method_id: method.id,
        payment_reference: data.payment_reference || null,
        customer_notes: data.customer_notes || null,
        coupon_id: couponId,
        coupon_code: couponCode,
        shipping_rate_id: rateId,
        shipping_method: shippingMethod,
        shipping_address: hasPhysical && data.fulfillment === "delivery" ? data.shipping_address : null,
        idempotency_key: data.idempotency_key,
        guest_token: guestToken,
        channel: "online",
      })
      .select("id, order_number")
      .single();
    if (error) throw new Error(error.message);

    const { error: itemsError } = await admin
      .from("order_items")
      .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));
    if (itemsError) {
      await admin.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    return {
      order_id: order.id as string,
      guest_token: guestToken,
      gateway: method.is_gateway ? (method.gateway_provider || method.code) : null,
    };
  });

async function loadGuestOrder(orderId: string, token: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const admin = supabaseAdmin as any;
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, total, currency, buyer_email, buyer_name, payment_status, status, subtotal, discount, tax, shipping_cost, shipping_method, guest_token, order_items(product_name, quantity, unit_price, total, product_type, delivered_codes)")
    .eq("id", orderId)
    .maybeSingle();
  if (!order || !order.guest_token || order.guest_token !== token) bad("order_not_found");
  return { admin, order };
}

export const getGuestOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { order_id: string; token: string }) => input)
  .handler(async ({ data }) => {
    const { order } = await loadGuestOrder(data.order_id, data.token);
    const { guest_token: _t, ...safe } = order;
    return safe;
  });

export const createGuestAfsCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { order_id: string; token: string }) => input)
  .handler(async ({ data }) => {
    const { admin, order } = await loadGuestOrder(data.order_id, data.token);
    if (order.payment_status === "succeeded") bad("order_already_paid");

    const { afsPrepareCheckout, loadAfsConfig } = await import("@/lib/afs.server");
    const { formatGatewayAmount } = await import("@/lib/afs-money");
    const cfg = await loadAfsConfig();
    const currency = String(cfg.currency || order.currency || "BHD").toUpperCase();
    const amount = formatGatewayAmount(order.total, currency);
    const [givenName, ...rest] = String(order.buyer_name ?? "").trim().split(" ");
    const { checkoutId } = await afsPrepareCheckout({
      amount,
      currency,
      merchantTransactionId: order.order_number,
      email: order.buyer_email,
      givenName: givenName || null,
      surname: rest.join(" ") || null,
      cfg,
    });

    try {
      await admin.from("payment_transactions").insert({
        order_id: order.id,
        provider: "afs",
        provider_charge_id: checkoutId,
        provider_checkout_id: checkoutId,
        amount: Number(order.total),
        currency,
        status: "pending",
      });
    } catch { /* non-fatal */ }

    return {
      checkoutId,
      scriptUrl: `${cfg.widgetBase}?checkoutId=${checkoutId}`,
      amount,
      currency,
      testMode: cfg.testMode,
      brands: cfg.brands,
      widgetLang: cfg.widgetLang,
    };
  });

export const confirmGuestAfsPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { order_id: string; token: string; checkout_id: string }) => input)
  .handler(async ({ data }) => {
    const { order } = await loadGuestOrder(data.order_id, data.token);
    const { verifyAfsPaymentForOrder, applyAfsPaymentResult } = await import(
      "@/lib/afs-verify.server"
    );

    // Same centralised gate as authenticated checkout / webhook / reconciliation.
    const gateOrder = {
      id: order.id as string,
      order_number: order.order_number as string,
      total: order.total as number,
      currency: (order.currency ?? "BHD") as string,
      payment_status: (order.payment_status ?? "pending") as string,
      status: (order.status ?? null) as string | null,
    };

    const result = await verifyAfsPaymentForOrder({
      order: gateOrder,
      checkoutId: data.checkout_id,
      source: "confirm_guest",
    });
    await applyAfsPaymentResult({
      order: gateOrder,
      checkoutId: data.checkout_id,
      result,
      source: "confirm_guest",
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
