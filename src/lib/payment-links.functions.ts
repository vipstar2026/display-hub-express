import { createServerFn } from "@tanstack/react-start";

export const startPaymentLinkCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; name?: string; email?: string; phone?: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: link } = await supabaseAdmin
      .from("payment_links")
      .select("*")
      .eq("token", data.token)
      .maybeSingle();
    if (!link) throw new Error("Payment link not found");
    if (link.status === "paid") throw new Error("This payment link has already been paid");
    if (link.status === "cancelled") throw new Error("This payment link was cancelled");
    if (link.expires_at && new Date(link.expires_at) < new Date()) throw new Error("This payment link has expired");

    const email = (data.email || link.customer_email || "").trim();
    if (!email) throw new Error("Email is required");
    const name = (data.name || link.customer_name || "").trim();

    let orderId = link.order_id as string | null;

    if (orderId) {
      const { data: existing } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, payment_status")
        .eq("id", orderId)
        .maybeSingle();
      if (!existing || existing.payment_status === "succeeded") orderId = null;
    }

    if (!orderId) {
      const { data: order, error } = await supabaseAdmin
        .from("orders")
        .insert({
          buyer_email: email,
          buyer_name: name || null,
          buyer_phone: data.phone || link.customer_phone || null,
          channel: "payment_link",
          currency: link.currency || "BHD",
          subtotal: Number(link.amount),
          total: Number(link.amount),
          notes: link.description || null,
          payment_method: "AFS",
        })
        .select("id, order_number")
        .single();
      if (error) throw new Error(error.message);
      orderId = order.id;
      await supabaseAdmin
        .from("payment_links")
        .update({ order_id: orderId, customer_email: email, customer_name: name || link.customer_name })
        .eq("id", link.id);
    }

    const { startAfsCheckout } = await import("@/lib/payments/checkout.server");
    const checkout = await startAfsCheckout({
      orderId: orderId!,
      attemptKey: `pay-link:${link.id}:${crypto.randomUUID()}`,
      returnPath: `/pay-link/result?token=${encodeURIComponent(data.token)}`,
    });
    return { ...checkout, orderId };
  });

export const confirmPaymentLinkPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; checkout_id: string }) => input)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: link } = await supabaseAdmin
      .from("payment_links")
      .select("id, order_id, amount, currency")
      .eq("token", data.token)
      .maybeSingle();
    if (!link?.order_id) throw new Error("Payment link not found");

    const { confirmAfsCheckout } = await import("@/lib/payments/checkout.server");
    const result = await confirmAfsCheckout({ orderId: link.order_id, checkoutId: data.checkout_id, source: "customer_return" });
    if (result.success) {
      const now = new Date().toISOString();
      await supabaseAdmin.from("payment_links").update({ status: "paid", paid_at: now }).eq("id", link.id);
    }
    return { ...result, orderId: link.order_id };
  });

export const getPaymentLinkPublic = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => input)
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const client = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { data: rows, error } = await client.rpc("get_payment_link", { _token: data.token });
    if (error) throw new Error(error.message);
    const link = Array.isArray(rows) ? rows[0] : rows;
    if (!link) throw new Error("Payment link not found");
    return link as {
      token: string;
      amount: number;
      currency: string;
      description: string | null;
      customer_name: string | null;
      customer_email: string | null;
      status: string;
      expires_at: string | null;
      order_id: string | null;
    };
  });
