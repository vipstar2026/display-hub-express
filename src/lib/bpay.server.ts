/** BENEFIT Payment Gateway (BPG) — classic hosted API (`trandata` → hosted.htm).
 *
 *  BENEFIT confirmed (Aug 2026) that BPG is a completely separate integration
 *  from AFS/OPPWA Copy&Pay. The supported flow is:
 *
 *    1. Build a query string of transaction fields.
 *    2. Encrypt it with AES-256-CBC (key = Terminal Resource Key,
 *       IV = "PGKEYENCDECIVSPC") and hex-encode it → `trandata`.
 *    3. POST `trandata` + `tranportalId` + `responseURL` + `errorURL` to the
 *       API endpoint (`.../payment/API/hosted.htm`).
 *    4. The reply body is `<paymentId>:<paymentPageUrl>` — redirect the
 *       shopper to `paymentPageUrl?PaymentID=<paymentId>`.
 *    5. BPG posts the encrypted result back to our response URL. We log it,
 *       print `REDIRECT=<url>`, and only then process it.
 *
 *  Credentials come from the `payment_methods` row (gateway_provider =
 *  benefit | bpay | benefit_gateway), with env secrets taking priority.
 */

export interface BpayConfig {
  tranportalId: string;
  tranportalPassword: string;
  resourceKey: string;
  merchantId: string | null;
  /** Full endpoint, e.g. https://test.benefit-gateway.bh/payment/API/hosted.htm */
  endpoint: string;
  testMode: boolean;
  currency: string;
  currencyCode: string;
  responseUrl: string;
  errorUrl: string;
}

const TEST_ENDPOINT = "https://test.benefit-gateway.bh/payment/API/hosted.htm";
const LIVE_ENDPOINT = "https://www.benefit-gateway.bh/payment/API/hosted.htm";
const IV = "PGKEYENCDECIVSPC";

/** ISO-4217 numeric codes used by BPG. */
const CURRENCY_CODES: Record<string, string> = {
  BHD: "048",
  USD: "840",
  EUR: "978",
  GBP: "826",
  SAR: "682",
  AED: "784",
  KWD: "414",
  QAR: "634",
  OMR: "512",
};

const CURRENCY_DECIMALS: Record<string, number> = { BHD: 3, KWD: 3, OMR: 3 };

export function bpayFormatAmount(amount: number | string, currency: string) {
  const decimals = CURRENCY_DECIMALS[currency.toUpperCase()] ?? 2;
  return Number(amount).toFixed(decimals);
}

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

  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = cred[k];
      if (typeof v === "string" && v.trim() !== "") return v.trim();
    }
    return null;
  };
  const env = (...keys: string[]) => {
    for (const k of keys) {
      const v = process.env[k];
      if (typeof v === "string" && v.trim() !== "") return v.trim();
    }
    return null;
  };

  const mode = pick("mode") ?? (rowTestMode === false ? "live" : "test");
  const testMode = mode !== "live";
  const suffix = testMode ? "_TEST" : "_LIVE";

  const tranportalId =
    env(`BPG_TRANPORTAL_ID${suffix}`, "BPG_TRANPORTAL_ID") ??
    pick("tranportal_id", `tranportal_id_${mode}`, "terminal_id", "entity_id") ??
    "";
  const tranportalPassword =
    env(`BPG_TRANPORTAL_PASSWORD${suffix}`, "BPG_TRANPORTAL_PASSWORD") ??
    pick("tranportal_password", `tranportal_password_${mode}`, "password") ??
    "";
  const resourceKey =
    env(`BPG_RESOURCE_KEY${suffix}`, "BPG_RESOURCE_KEY") ??
    pick("resource_key", `resource_key_${mode}`, "terminal_resource_key", "secret_key") ??
    "";

  if (!tranportalId || !tranportalPassword || !resourceKey) {
    throw new Error("BENEFIT gateway is not configured yet");
  }
  if (resourceKey.length !== 32) {
    throw new Error("BENEFIT resource key must be exactly 32 characters");
  }

  const { BASE } = await import("@/lib/site-url");
  const currency = (pick("currency") ?? "BHD").toUpperCase();

  return {
    tranportalId,
    tranportalPassword,
    resourceKey,
    merchantId: pick("merchant_id"),
    endpoint: pick("api_endpoint", "api_base") ?? (testMode ? TEST_ENDPOINT : LIVE_ENDPOINT),
    testMode,
    currency,
    currencyCode: pick("currency_code") ?? CURRENCY_CODES[currency] ?? "048",
    responseUrl: pick("response_url", "webhook_url") ?? `${BASE}/api/public/payments/benefit`,
    errorUrl: pick("error_url") ?? `${BASE}/api/public/payments/benefit`,
  };
}

/** Returns true when a BENEFIT gateway row exists, is active and configured. */
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
    if (!data) return false;
    await loadBpayConfig();
    return true;
  } catch {
    return false;
  }
}

/* -------------------------------------------------------- trandata crypto */

export async function encryptTrandata(plain: string, resourceKey: string) {
  const { createCipheriv } = await import("crypto");
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(resourceKey, "utf8"), Buffer.from(IV, "utf8"));
  return Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]).toString("hex");
}

export async function decryptTrandata(hex: string, resourceKey: string) {
  const { createDecipheriv } = await import("crypto");
  const decipher = createDecipheriv("aes-256-cbc", Buffer.from(resourceKey, "utf8"), Buffer.from(IV, "utf8"));
  return Buffer.concat([decipher.update(Buffer.from(hex, "hex")), decipher.final()]).toString("utf8");
}

function toQuery(fields: Record<string, string>) {
  return Object.entries(fields)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
}

/* --------------------------------------------------------------- payment */

export interface BpayInitResult {
  paymentId: string;
  paymentUrl: string;
}

/** Step 1–4: creates the hosted payment session and returns the redirect URL. */
export async function bpayInitPayment(params: {
  amount: number | string;
  currency?: string;
  trackId: string;
  orderId: string;
  lang?: string;
  email?: string | null;
  cfg?: BpayConfig;
}): Promise<BpayInitResult> {
  const cfg = params.cfg ?? (await loadBpayConfig());
  const currency = (params.currency ?? cfg.currency).toUpperCase();
  const currencyCode = CURRENCY_CODES[currency] ?? cfg.currencyCode;

  const fields: Record<string, string> = {
    id: cfg.tranportalId,
    password: cfg.tranportalPassword,
    action: "1", // purchase
    langid: params.lang === "ar" ? "ARA" : "USA",
    currencycode: currencyCode,
    amt: bpayFormatAmount(params.amount, currency),
    responseURL: cfg.responseUrl,
    errorURL: cfg.errorUrl,
    trackid: params.trackId,
    udf1: params.orderId,
  };
  if (params.email) fields["udf2"] = params.email.slice(0, 80);

  const trandata = await encryptTrandata(toQuery(fields), cfg.resourceKey);
  const body = new URLSearchParams({
    trandata,
    tranportalId: cfg.tranportalId,
    responseURL: cfg.responseUrl,
    errorURL: cfg.errorUrl,
  });

  const res = await fetch(cfg.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const text = (await res.text()).trim();

  // Success: "<paymentId>:<paymentPageUrl>". Failure: "!ERROR!..." / "ERROR:..."
  if (!text || /^!?ERROR/i.test(text)) {
    throw new Error(`benefit_init_failed:${text.slice(0, 200) || res.status}`);
  }
  const sep = text.indexOf(":");
  const paymentId = sep > 0 ? text.slice(0, sep) : "";
  const url = sep > 0 ? text.slice(sep + 1) : "";
  if (!paymentId || !/^https?:\/\//i.test(url)) {
    throw new Error(`benefit_init_unexpected_response:${text.slice(0, 200)}`);
  }
  return {
    paymentId,
    paymentUrl: `${url}${url.includes("?") ? "&" : "?"}PaymentID=${encodeURIComponent(paymentId)}`,
  };
}

export interface BpayNotification {
  paymentId: string | null;
  trackId: string | null;
  tranId: string | null;
  result: string;
  amount: string | null;
  auth: string | null;
  ref: string | null;
  cardType: string | null;
  orderId: string | null;
  error: string | null;
  errorText: string | null;
  raw: Record<string, string>;
}

/** Parses a BPG response/error post body (encrypted `trandata` or plain fields). */
export async function bpayParseNotification(raw: string, cfg?: BpayConfig): Promise<BpayNotification> {
  const c = cfg ?? (await loadBpayConfig());
  const outer = new URLSearchParams(raw);
  let params = outer;
  const trandata = outer.get("trandata");
  if (trandata) {
    const decrypted = await decryptTrandata(trandata.trim(), c.resourceKey);
    params = new URLSearchParams(decrypted);
  }
  const get = (...keys: string[]) => {
    for (const k of keys) {
      const v = params.get(k) ?? params.get(k.toLowerCase()) ?? params.get(k.toUpperCase());
      if (v != null && v !== "") return v;
    }
    return null;
  };
  return {
    paymentId: get("paymentid", "PaymentID"),
    trackId: get("trackid"),
    tranId: get("tranid"),
    result: (get("result") ?? "").toUpperCase(),
    amount: get("amt", "amount"),
    auth: get("auth"),
    ref: get("ref"),
    cardType: get("cardtype", "card"),
    orderId: get("udf1"),
    error: get("Error", "error"),
    errorText: get("ErrorText", "errortext"),
    raw: Object.fromEntries(params.entries()),
  };
}

export function bpayIsSuccessResult(result: string) {
  return result.toUpperCase() === "CAPTURED";
}

export function bpayIsCancelled(result: string) {
  return /CANCEL/i.test(result);
}

/** Maps a parsed BPG notification onto the shared GatewayStatus shape. */
export function bpayToGatewayStatus(n: BpayNotification, currency: string) {
  const success = bpayIsSuccessResult(n.result);
  const cancelled = bpayIsCancelled(n.result);
  return {
    externalPaymentId: n.tranId ?? n.paymentId,
    merchantReference: n.trackId,
    amount: n.amount,
    currency,
    brand: n.cardType ?? "BENEFIT",
    code: n.result || n.error || "",
    description: n.errorText ?? n.result ?? "",
    state: (success ? "succeeded" : cancelled || n.result || n.error ? "failed" : "unknown") as
      | "succeeded"
      | "processing"
      | "failed"
      | "unknown",
  };
}

/** Transaction inquiry (action = 8) used by the reconciliation watchdog. */
export async function bpayInquiry(input: { paymentId: string; trackId: string; amount: string }, cfg?: BpayConfig) {
  const c = cfg ?? (await loadBpayConfig());
  const fields: Record<string, string> = {
    id: c.tranportalId,
    password: c.tranportalPassword,
    action: "8",
    transid: input.paymentId,
    trackid: input.trackId,
    amt: input.amount,
    currencycode: c.currencyCode,
    udf5: "TrackID",
  };
  const trandata = await encryptTrandata(toQuery(fields), c.resourceKey);
  const res = await fetch(c.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ trandata, tranportalId: c.tranportalId }).toString(),
  });
  const text = (await res.text()).trim();
  if (!text || /^!?ERROR/i.test(text)) return null;
  try {
    return await bpayParseNotification(text.startsWith("trandata=") ? text : `trandata=${text}`, c);
  } catch {
    return await bpayParseNotification(text, c);
  }
}
