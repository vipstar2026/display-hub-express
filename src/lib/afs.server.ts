/** AFS (Arab Financial Services) — OPPWA COPYandPAY server helpers.
 *  All settings are managed manually from the admin dashboard
 *  (Payment Methods → AFS). Environment secrets are only a fallback. */

export interface AfsConfig {
  entityId: string;
  token: string;
  base: string;
  widgetBase: string;
  testMode: boolean;
  paymentType: string;
  brands: string;
  currency: string | null;
  widgetLang: string | null;
  merchantName: string | null;
  resultUrl: string | null;
  /** Hex key supplied by AFS to decrypt production webhook payloads. */
  webhookKey: string | null;
}

export function afsBaseUrl(mode?: string) {
  return (mode ?? process.env.AFS_MODE ?? "test") === "live"
    ? "https://eu-prod.oppwa.com"
    : "https://eu-test.oppwa.com";
}

export function afsWidgetBase(mode?: string) {
  return `${afsBaseUrl(mode)}/v1/paymentWidgets.js`;
}

/** Reads the AFS row from payment_methods; falls back to env secrets.
 *  `forceMode` lets the webhook verify a notification against the other
 *  environment when test/live are mixed during activation. */
export async function loadAfsConfig(forceMode?: "test" | "live"): Promise<AfsConfig> {
  let cred: Record<string, string> = {};
  let rowTestMode: boolean | null = null;

  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("payment_methods")
      .select("credentials, config, test_mode, is_active")
      .eq("gateway_provider", "afs")
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
  } catch {
    /* fall back to env */
  }

  const pick = (k: string) => {
    const v = cred[k];
    return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
  };

  const mode =
    forceMode ??
    pick("mode") ??
    (rowTestMode === false ? "live" : (process.env.AFS_MODE ?? "test"));
  const live = mode === "live";

  // Production credentials are stored separately so the test pair stays intact.
  const entityId =
    (live ? pick("live_entity_id") : null) ?? pick("entity_id") ?? process.env.AFS_ENTITY_ID ?? "";
  const token =
    (live ? pick("live_access_token") : null) ??
    pick("access_token") ??
    process.env.AFS_ACCESS_TOKEN ??
    "";
  if (!entityId || !token) throw new Error("AFS gateway is not configured");

  return {
    entityId,
    token,
    base: afsBaseUrl(mode),
    widgetBase: afsWidgetBase(mode),
    testMode: !live,
    paymentType: pick("payment_type") ?? "DB",
    brands: pick("brands") ?? "VISA MASTER",
    currency: pick("currency"),
    widgetLang: pick("widget_lang"),
    merchantName: pick("merchant_name"),
    resultUrl: pick("shopper_result_url"),
    webhookKey: pick("webhook_decryption_key") ?? process.env.AFS_WEBHOOK_KEY ?? null,
  };
}

export async function afsPrepareCheckout(params: {
  amount: string;
  currency: string;
  merchantTransactionId: string;
  email?: string | null;
  givenName?: string | null;
  surname?: string | null;
  cfg?: AfsConfig;
}) {
  const cfg = params.cfg ?? (await loadAfsConfig());
  const body = new URLSearchParams({
    entityId: cfg.entityId,
    amount: params.amount,
    currency: cfg.currency || params.currency,
    paymentType: cfg.paymentType,
    merchantTransactionId: params.merchantTransactionId,
  });
  if (cfg.merchantName) body.set("merchantTransactionId", params.merchantTransactionId);
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
    result?: {
      code: string;
      description: string;
      parameterErrors?: { name: string; value?: string; message?: string }[];
    };
  };
  if (!json.id) {
    // Server-side diagnostic only — never contains credentials or card data.
    console.error("[afs] checkout creation failed", {
      httpStatus: res.status,
      contentType: res.headers.get("content-type"),
      resultCode: json.result?.code,
      resultDescription: json.result?.description,
      parameterErrors: json.result?.parameterErrors?.map((p) => ({
        name: p.name,
        value: p.value,
        message: p.message,
      })),
      sentFields: [...body.keys()].filter((k) => k !== "entityId"),
      amount: params.amount,
      currency: body.get("currency"),
      merchantTransactionId: params.merchantTransactionId,
    });
    // Generic error for the shopper; details stay in the server log.
    throw new Error("afs_init_failed");
  }
  return { checkoutId: json.id, resultCode: json.result?.code ?? "" };
}

export async function afsGetStatus(checkoutId: string, cfg?: AfsConfig) {
  const c = cfg ?? (await loadAfsConfig());
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

export type AfsStatus = Awaited<ReturnType<typeof afsGetStatus>>;

/** Looks a payment up by its payment id (used by webhook notifications). */
export async function afsGetPayment(paymentId: string, cfg?: AfsConfig) {
  const c = cfg ?? (await loadAfsConfig());
  const res = await fetch(
    `${c.base}/v1/payments/${encodeURIComponent(paymentId)}?entityId=${c.entityId}`,
    { headers: { Authorization: `Bearer ${c.token}` } },
  );
  return (await res.json()) as AfsStatus;
}

/** Verifies a notification id against the gateway, trying the checkout lookup,
 *  then the payment lookup, then the opposite environment (test/live).
 *  Returns null when the gateway does not recognise the id — callers must NOT
 *  mark an order paid in that case. */
export async function afsVerifyNotification(id: string): Promise<AfsStatus | null> {
  const known = (s: AfsStatus | null) => {
    const code = s?.result?.code ?? "";
    return code && !/^(200\.300\.404|700\.400|800\.[89])/.test(code) ? s : null;
  };
  for (const mode of ["test", "live"] as const) {
    let cfg: AfsConfig;
    try {
      cfg = await loadAfsConfig(mode);
    } catch {
      continue;
    }
    const viaCheckout = known(await afsGetStatus(id, cfg).catch(() => null));
    if (viaCheckout) return viaCheckout;
    const viaPayment = known(await afsGetPayment(id, cfg).catch(() => null));
    if (viaPayment) return viaPayment;
  }
  return null;
}



/** Successful / successfully-pending result codes per AFS result-code reference. */
export function afsIsSuccess(code?: string) {
  if (!code) return false;
  return (
    /^(000\.000\.|000\.100\.1|000\.[36]|000\.400\.0[^3]|000\.400\.100)/.test(code)
  );
}

export function afsIsPending(code?: string) {
  if (!code) return false;
  return /^(000\.200|800\.400\.5|100\.400\.500)/.test(code);
}

/** Full or partial refund of a captured AFS payment (paymentType=RF). */
export async function afsRefund(params: {
  paymentId: string;
  amount: string;
  currency: string;
  cfg?: AfsConfig;
}) {
  const cfg = params.cfg ?? (await loadAfsConfig());
  const body = new URLSearchParams({
    entityId: cfg.entityId,
    amount: params.amount,
    currency: cfg.currency || params.currency,
    paymentType: "RF",
  });
  const res = await fetch(`${cfg.base}/v1/payments/${encodeURIComponent(params.paymentId)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  return (await res.json()) as {
    id?: string;
    amount?: string;
    currency?: string;
    result?: { code: string; description: string };
  };
}

/** Decrypts an AFS/OPPWA webhook body (AES-256-GCM, all values hex-encoded). */
export async function afsDecryptWebhook(params: {
  keyHex: string;
  ivHex: string;
  authTagHex: string;
  bodyHex: string;
}) {
  const { createDecipheriv } = await import("crypto");
  const key = Buffer.from(params.keyHex, "hex");
  const iv = Buffer.from(params.ivHex, "hex");
  const tag = Buffer.from(params.authTagHex, "hex");
  const data = Buffer.from(params.bodyHex, "hex");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  return JSON.parse(plain) as Record<string, unknown>;
}
