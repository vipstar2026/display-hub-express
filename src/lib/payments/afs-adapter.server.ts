import type { GatewayStatus, PaymentOrder } from "./types";
import { formatGatewayAmount } from "./money";

type Config = {
  entityId: string;
  token: string;
  baseUrl: string;
  widgetUrl: string;
  paymentType: string;
  brands: string;
  widgetLang: string | null;
  webhookKey: string | null;
};

const SUCCESS = /^(000\.000\.|000\.100\.1|000\.[36]|000\.400\.0[^3]|000\.400\.100)/;
const PROCESSING = /^(000\.200|800\.400\.5|100\.400\.500)/;
// 700.400.580 means AFS cannot find a transaction for this checkout, and
// 200.300.404 means the checkout itself is invalid. Neither can become paid
// later, so treating them as "unknown" leaves the shopper pending forever.
// 700.400.580 ("cannot find transaction") and any 800.120.* rate-limit code are
// NOT rejections: the transaction may still be in flight at the bank. Treating
// them as failures deletes perfectly good orders.
const RATE_LIMITED = /^800\.120\./;
const UNKNOWN = /^(100\.100\.104|800\.[89]|700\.400\.580|800\.120\.)/;

function value(source: Record<string, unknown>, key: string) {
  const v = source[key];
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

// AFS runs in LIVE mode only. Test/UAT support was removed on purpose.
export type AfsEnvironment = "live";

export function getAfsCheckoutEnvironment(_checkoutId: string): AfsEnvironment {
  return "live";
}

export async function loadAfsPaymentConfig(_environment?: AfsEnvironment | null): Promise<Config> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("payment_methods")
    .select("credentials, config, is_active")
    .eq("gateway_provider", "afs")
    .eq("is_active", true)
    .order("sort_order")
    .limit(1)
    .maybeSingle();
  if (!data) throw new Error("payment_method_unavailable");
  const source = { ...((data.config ?? {}) as Record<string, unknown>), ...((data.credentials ?? {}) as Record<string, unknown>) };
  const entityId = value(source, "live_entity_id") ?? value(source, "entity_id");
  const token = value(source, "live_access_token") ?? value(source, "access_token");
  if (!entityId || !token) throw new Error("gateway_not_configured");
  const baseUrl = "https://eu-prod.oppwa.com";
  return {
    entityId,
    token,
    baseUrl,
    widgetUrl: `${baseUrl}/v1/paymentWidgets.js`,
    paymentType: value(source, "payment_type") ?? "DB",
    // BENEFIT is intentionally NOT here: AFS confirmed Bahraini Benefit debit
    // cards must go through the Benefit Payment Gateway only — routing them to
    // AFS gets an automatic "Deny by ReD Shield" (100.400.142).
    brands: value(source, "brands") ?? "VISA MASTER MAESTRO AMEX DINERS DISCOVER JCB UNIONPAY MADA",
    widgetLang: value(source, "widget_lang"),
    webhookKey: value(source, "webhook_decryption_key"),
  };
}

async function request(path: string, config: Config, init?: RequestInit) {
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${config.token}`, ...(init?.headers ?? {}) },
  });
  const body = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return { response, body };
}

// IMPORTANT: never send `shopperResultUrl` here. COPYandPAY takes the return
// URL from the widget form's `action` attribute; sending it at checkout
// creation too makes AFS reject the card submission with
// 200.300.404 "shopperResultUrl was already set and cannot be overwritten",
// so no transaction is ever created. Verified end-to-end against AFS.
export async function createAfsPayment(order: PaymentOrder) {
  const config = await loadAfsPaymentConfig();
  const names = (order.buyer_name ?? "").trim().split(/\s+/).filter(Boolean);
  const form = new URLSearchParams({
    entityId: config.entityId,
    amount: formatGatewayAmount(order.total, order.currency),
    currency: order.currency.toUpperCase(),
    paymentType: config.paymentType,
    merchantTransactionId: order.order_number,
    integrity: "true",
  });
  if (order.buyer_email) form.set("customer.email", order.buyer_email);
  if (names[0]) form.set("customer.givenName", names[0].slice(0, 48));
  if (names.length > 1) form.set("customer.surname", names.slice(1).join(" ").slice(0, 48));
  const { response, body } = await request("/v1/checkouts", config, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const checkoutId = typeof body.id === "string" ? body.id : null;
  if (!response.ok || !checkoutId) {
    const result = body.result as { code?: string; description?: string } | undefined;
    console.error("[payment:afs] checkout rejected", { status: response.status, code: result?.code, description: result?.description });
    throw new Error("gateway_checkout_failed");
  }
  const integrity = typeof body.integrity === "string" ? body.integrity : null;
  return { checkoutId, scriptUrl: `${config.widgetUrl}?checkoutId=${encodeURIComponent(checkoutId)}`, integrity, config };
}

function normalizeStatus(body: Record<string, unknown>): GatewayStatus {
  const result = body.result as { code?: string; description?: string } | undefined;
  const code = result?.code ?? "";
  const rateLimited = RATE_LIMITED.test(code);
  const state = SUCCESS.test(code) ? "succeeded" : PROCESSING.test(code) ? "processing" : !code || UNKNOWN.test(code) ? "unknown" : "failed";
  return {
    externalPaymentId: typeof body.id === "string" ? body.id : null,
    merchantReference: typeof body.merchantTransactionId === "string" ? body.merchantTransactionId : null,
    amount: typeof body.amount === "string" ? body.amount : null,
    currency: typeof body.currency === "string" ? body.currency : null,
    brand: typeof body.paymentBrand === "string" ? body.paymentBrand : null,
    code,
    description: result?.description ?? "",
    rateLimited,
    state,
  };
}

export async function getAfsPaymentStatus(checkoutId: string, resourcePath?: string | null) {
  const config = await loadAfsPaymentConfig(getAfsCheckoutEnvironment(checkoutId));
  const expectedPath = `/v1/checkouts/${checkoutId}/payment`;
  const path = resourcePath || expectedPath;
  if (!/^\/v1\/[A-Za-z0-9._~%\/-]+(\?[A-Za-z0-9._~%&=+-]*)?$/.test(path)) throw new Error("payment_resource_invalid");
  if (decodeURIComponent(path) !== expectedPath) throw new Error("payment_resource_mismatch");
  const separator = path.includes("?") ? "&" : "?";
  const { body } = await request(`${path}${separator}entityId=${encodeURIComponent(config.entityId)}`, config);
  return normalizeStatus(body);
}

export async function refundAfsPaymentById(paymentId: string, amount: string, currency: string) {
  const config = await loadAfsPaymentConfig();
  const form = new URLSearchParams({ entityId: config.entityId, amount, currency, paymentType: "RF" });
  const { body } = await request(`/v1/payments/${encodeURIComponent(paymentId)}`, config, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  return normalizeStatus(body);
}

export async function decryptAfsWebhook(input: { body: string; iv: string; tag: string; key: string }) {
  const { createDecipheriv } = await import("crypto");
  const decipher = createDecipheriv("aes-256-gcm", Buffer.from(input.key, "hex"), Buffer.from(input.iv, "hex"));
  decipher.setAuthTag(Buffer.from(input.tag, "hex"));
  const plain = Buffer.concat([decipher.update(Buffer.from(input.body, "hex")), decipher.final()]).toString("utf8");
  return JSON.parse(plain) as Record<string, unknown>;
}
