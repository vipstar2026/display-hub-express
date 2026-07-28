/** AFS (Arab Financial Services) — OPPWA COPYandPAY server helpers. */

export function afsBaseUrl() {
  return (process.env.AFS_MODE ?? "test") === "live"
    ? "https://eu-prod.oppwa.com"
    : "https://eu-test.oppwa.com";
}

export function afsWidgetBase() {
  return `${afsBaseUrl()}/v1/paymentWidgets.js`;
}

function afsConfig() {
  const entityId = process.env.AFS_ENTITY_ID;
  const token = process.env.AFS_ACCESS_TOKEN;
  if (!entityId || !token) throw new Error("AFS gateway is not configured");
  return { entityId, token, base: afsBaseUrl() };
}

export async function afsPrepareCheckout(params: {
  amount: string;
  currency: string;
  merchantTransactionId: string;
  email?: string | null;
  givenName?: string | null;
  surname?: string | null;
}) {
  const { entityId, token, base } = afsConfig();
  const body = new URLSearchParams({
    entityId,
    amount: params.amount,
    currency: params.currency,
    paymentType: "DB",
    merchantTransactionId: params.merchantTransactionId,
  });
  if (params.email) body.set("customer.email", params.email);
  if (params.givenName) body.set("customer.givenName", params.givenName.slice(0, 48));
  if (params.surname) body.set("customer.surname", params.surname.slice(0, 48));

  const res = await fetch(`${base}/v1/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });
  const json = (await res.json()) as {
    id?: string;
    result?: { code: string; description: string };
  };
  if (!json.id) throw new Error(json.result?.description ?? "AFS checkout failed");
  return { checkoutId: json.id, resultCode: json.result?.code ?? "" };
}

export async function afsGetStatus(checkoutId: string) {
  const { entityId, token, base } = afsConfig();
  const res = await fetch(`${base}/v1/checkouts/${encodeURIComponent(checkoutId)}/payment?entityId=${entityId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return (await res.json()) as {
    id?: string;
    merchantTransactionId?: string;
    amount?: string;
    currency?: string;
    paymentBrand?: string;
    result?: { code: string; description: string };
  };
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
