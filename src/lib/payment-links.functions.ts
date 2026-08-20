import { createServerFn } from "@tanstack/react-start";

export const startPaymentLinkCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; name?: string; email?: string; phone?: string }) => input)
  .handler(async ({ data }) => {
    const { afsPrepareCheckout, loadAfsConfig } = await import("@/lib/afs.server");
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
    let orderNumber: string | null = null;

    if (orderId) {
      const { data: existing } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, payment_status")
        .eq("id", orderId)
        .maybeSingle();
      if (existing && existing.payment_status !== "succeeded") orderNumber = existing.order_number;
      else orderId = null;
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
      orderNumber = order.order_number;
      await supabaseAdmin
        .from("payment_links")
        .update({ order_id: orderId, customer_email: email, customer_name: name || link.customer_name })
        .eq("id", link.id);
    }

    const cfg = await loadAfsConfig();
    const [givenName, ...rest] = name.split(" ");
    const { checkoutId } = await afsPrepareCheckout({
      amount: Number(link.amount).toFixed(2),
      currency: link.currency || cfg.currency || "BHD",
      merchantTransactionId: orderNumber!,
      email,
      givenName: givenName || null,
      surname: rest.join(" ") || null,
      cfg,
    });

    try {
      await supabaseAdmin.from("payment_transactions").insert({
        order_id: orderId,
        provider: "afs",
        provider_charge_id: checkoutId,
        provider_checkout_id: checkoutId,
        amount: Number(link.amount),
        currency: link.currency || cfg.currency || "BHD",
        status: "pending",
      });
    } catch {
      /* non-fatal */
    }

    return {
      checkoutId,
      orderId,
      scriptUrl: `${cfg.widgetBase}?checkoutId=${checkoutId}`,
      amount: Number(link.amount).toFixed(2),
      currency: link.currency || cfg.currency || "BHD",
      testMode: cfg.testMode,
      brands: cfg.brands,
      widgetLang: cfg.widgetLang,
    };
  });

export const confirmPaymentLinkPayment = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; checkout_id: string }) => input)
  .handler(async ({ data }) => {
    const { afsGetStatus, afsIsSuccess, afsIsPending } = await import("@/lib/afs.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: link } = await supabaseAdmin
      .from("payment_links")
      .select("id, order_id, amount, currency")
      .eq("token", data.token)
      .maybeSingle();
    if (!link?.order_id) throw new Error("Payment link not found");

    const status = await afsGetStatus(data.checkout_id);
    const code = status.result?.code;
    const success = afsIsSuccess(code);
    const pending = afsIsPending(code);

    const txPayload = {
      order_id: link.order_id,
      provider: "afs",
      provider_charge_id: status.id ?? data.checkout_id,
      amount: Number(status.amount ?? link.amount),
      currency: status.currency ?? link.currency ?? "BHD",
      status: success ? "succeeded" : pending ? "pending" : "failed",
      payment_method: status.paymentBrand ?? null,
      raw_response: status as never,
      failure_reason: success ? null : (status.result?.description ?? null),
      paid_at: success ? new Date().toISOString() : null,
    };

    const { data: existing } = await supabaseAdmin
      .from("payment_transactions")
      .select("id")
      .eq("order_id", link.order_id)
      .eq("provider", "afs")
      .eq("provider_charge_id", data.checkout_id)
      .maybeSingle();

    if (existing) await supabaseAdmin.from("payment_transactions").update(txPayload).eq("id", existing.id);
    else await supabaseAdmin.from("payment_transactions").insert(txPayload);

    if (success) {
      const now = new Date().toISOString();
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "succeeded",
          status: "paid",
          paid_at: now,
          payment_method: "AFS",
          payment_reference: status.id ?? data.checkout_id,
        })
        .eq("id", link.order_id);
      await supabaseAdmin.from("payment_links").update({ status: "paid", paid_at: now }).eq("id", link.id);
    } else if (!pending) {
      await supabaseAdmin.from("orders").update({ payment_status: "failed" }).eq("id", link.order_id);
    }

    return {
      success,
      pending,
      code: code ?? "",
      message: status.result?.description ?? "",
      orderId: link.order_id,
    };
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
