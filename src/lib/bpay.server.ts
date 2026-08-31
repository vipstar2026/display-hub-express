/** BENEFIT Payment Gateway (BPG) / BenefitPay Checkout — server helpers.
 *
 *  Everything is driven by the row saved in `payment_methods`
 *  (gateway_provider = 'benefit' | 'bpay' | 'benefit_gateway'), so the whole
 *  gateway can be configured manually from the admin dashboard once BENEFIT
 *  sends the merchant credentials. No redeploy is needed.
 *
 *  Supported integration shape: OPPWA-style Copy&Pay (the same family AFS
 *  uses) plus a generic hosted-redirect fallback. Adjust `api_base` /
 *  `widget_base` from the dashboard to match the endpoints BENEFIT provides.
 */

export interface BpayConfig {
  /** Entity / Terminal identifier issued by BENEFIT. */
  entityId: string;
  /** Bearer access token (or terminal password when using the classic BPG). */
  token: string;
  merchantId: string | null;
  secretKey: string | null;
  base: string;
  widgetBase: string;
  testMode: boolean;
  paymentType: string;
  brands: string;
  currency: string | null;
  widgetLang: string | null;
  resultUrl: string | null;
  /** 'copyandpay' (widget) or 'redirect' (hosted page). */
  flow: "copyandpay" | "redirect";
}

const TEST_BASE = "https://test.benefit-gateway.bh";
const LIVE_BASE = "https://benefit-gateway.bh";

export function bpayBaseUrl(mode?: string) {
  return mode === "live" ? LIVE_BASE : TEST_BASE;
}

/** Loads the BENEFIT row from payment_methods. Throws when unconfigured. */
export async function loadBpayConfig(): Promise<BpayConfig> {
  let cred: Record<string, string> = {};
  let rowTestMode: boolean | null = null;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("payment_methods")
    .select("credentials, config, test_mode, is_active, gateway_provider")
    .in("gateway_provider", ["benefit", "bpay", "benefit_gateway"])
    .order("sort_order")
    .limit(1)
    .maybeSingle();

  if (data) {
    cred = {
      ...((data.config ?? {}) as Record<string, string>),
      ...((data.credentials ?? {}) as Record<string, string>),
    };
    rowTestMode = data.test_mode;
  }

  const pick = (k: string) => {
    const v = cred[k];
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };
  const env = (k: string) => {
    const v = process.env[k];
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };

  // Secrets from the encrypted env store (add_secret) take priority over DB credentials.
  const entityId =
    env('BPG_ENTITY_ID_LIVE') ?? env('BPG_TRANPORTAL_ID_LIVE') ??
    pick("entity_id") ?? pick("entity_id_live") ?? pick("tranportal_id_live") ??
    pick("terminal_id") ?? pick("merchant_id") ?? "";
  const token =
    env('BPG_ACCESS_TOKEN_LIVE') ?? env('BPG_TRANPORTAL_PASSWORD_LIVE') ?? env('BPG_RESOURCE_KEY_LIVE') ??
    pick("access_token") ?? pick("access_token_live") ?? pick("password") ?? pick("tranportal_password_live") ?? "";
  if (!entityId || !token) throw new Error("BENEFIT gateway is not configured yet");

  const mode = pick("mode") ?? (rowTestMode === false ? "live" : "test");
  const base = pick("api_base") ?? bpayBaseUrl(mode);

  return {
    entityId,
    token,
    merchantId: pick("merchant_id"),
    secretKey: pick("secret_key"),
    base: base.replace(/\/+$/, ""),
    widgetBase: pick("widget_base") ?? `${base.replace(/\/+$/, "")}/v1/paymentWidgets.js`,
    testMode: mode !== "live",
    paymentType: pick("payment_type") ?? "DB",
    brands: pick("brands") ?? "BENEFIT VISA MASTER",
    currency: pick("currency") ?? "BHD",
    widgetLang: pick("widget_lang"),
    resultUrl: pick("shopper_result_url"),
    flow: (pick("flow") as BpayConfig["flow"]) ?? "copyandpay",
  };
}

/** Returns true when a BENEFIT gateway row exists and is active. */
export async function bpayIsEnabled(): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("payment_methods")
      .select("is_active")
      .in("gateway_provider", ["benefit", "bpay", "benefit_gateway"])
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

export async function bpayPrepareCheckout(params: {
  amount: string;
  currency: string;
  merchantTransactionId: string;
  email?: string | null;
  givenName?: string | null;
  surname?: string | null;
  cfg?: BpayConfig;
}) {
  const cfg = params.cfg ?? (await loadBpayConfig());
  const body = new URLSearchParams({
    entityId: cfg.entityId,
    amount: params.amount,
    currency: cfg.currency || params.currency,
    paymentType: cfg.paymentType,
    merchantTransactionId: params.merchantTransactionId,
  });
  if (params.email) body.set("customer.email", params.email);
  if (params.givenName) body.set("customer.givenName", params.givenName.slice(0, 48));
  if (params.surname) body.set("customer.surname", params.surname.slice(0, 48));

  const res = await fetch(`${cfg.base}/v1/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  const json = (await res.json()) as {
    id?: string;
    redirectUrl?: string;
    result?: { code: string; description: string };
  };
  if (!json.id && !json.redirectUrl) {
    throw new Error(json.result?.description ?? "BENEFIT checkout failed");
  }
  return {
    checkoutId: json.id ?? "",
    redirectUrl: json.redirectUrl ?? null,
    resultCode: json.result?.code ?? "",
  };
}

export async function bpayGetStatus(checkoutId: string, cfg?: BpayConfig) {
  const c = cfg ?? (await loadBpayConfig());
  const res = await fetch(
    `${c.base}/v1/checkouts/${encodeURIComponent(checkoutId)}/payment?entityId=${c.entityId}`,
    { headers: { Authorization: `Bearer ${c.token}` } },
  );
  return (await res.json()) as {
    id?: string;
    merchantTransactionId?: string;
    amount?: string;
    currency?: string;
    paymentBrand?: string;
    result?: { code: string; description: string };
  };
}

export function bpayIsSuccess(code?: string) {
  if (!code) return false;
  return /^(000\.000\.|000\.100\.1|000\.[36]|000\.400\.0[^3]|000\.400\.100)/.test(code);
}

export function bpayIsPending(code?: string) {
  if (!code) return false;
  return /^(000\.200|800\.400\.5|100\.400\.500)/.test(code);
}

/** HMAC-SHA256 signature check used by BENEFIT webhook notifications. */
export async function bpayVerifySignature(rawBody: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const { createHmac, timingSafeEqual } = await import("crypto");
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature.trim().toLowerCase());
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
