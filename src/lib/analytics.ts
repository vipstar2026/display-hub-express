/**
 * Analytics layer — GA4, Meta Pixel and TikTok Pixel.
 *
 * IDs come from site_settings (admin panel). Trackers are only loaded after the
 * visitor accepts all cookies, and every call is a no-op when nothing is loaded,
 * so the rest of the app can fire events unconditionally.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue?: unknown[]; loaded?: boolean; version?: string; push?: unknown };
    _fbq?: unknown;
    ttq?: Record<string, unknown> & { track?: (...a: unknown[]) => void; page?: () => void; load?: (id: string) => void };
  }
}

export const CONSENT_KEY = "vipstar_cookie_consent_v1";
export const CONSENT_EVENT = "vipstar:consent";

export type AnalyticsIds = {
  ga4?: string | null;
  metaPixel?: string | null;
  tiktokPixel?: string | null;
};

export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    return JSON.parse(raw)?.choice === "all";
  } catch {
    return false;
  }
}

const loaded = { ga4: false, meta: false, tiktok: false };

function injectScript(src: string, attrs: Record<string, string> = {}) {
  const s = document.createElement("script");
  s.async = true;
  s.src = src;
  Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
  document.head.appendChild(s);
}

function loadGa4(id: string) {
  if (loaded.ga4) return;
  loaded.ga4 = true;
  injectScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false });
}

function loadMeta(id: string) {
  if (loaded.meta) return;
  loaded.meta = true;
  /* eslint-disable */
  const n: any = (window.fbq = function (...args: unknown[]) {
    n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
  });
  if (!window._fbq) window._fbq = n;
  n.push = n;
  n.loaded = true;
  n.version = "2.0";
  n.queue = [];
  /* eslint-enable */
  injectScript("https://connect.facebook.net/en_US/fbevents.js");
  window.fbq!("init", id);
}

function loadTiktok(id: string) {
  if (loaded.tiktok) return;
  loaded.tiktok = true;
  const w = window as unknown as Record<string, any>;
  const ttq: any = (w.ttq = w.ttq || []);
  ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
  ttq.setAndDefer = function (t: any, e: string) {
    t[e] = function () {
      // eslint-disable-next-line prefer-rest-params
      t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
    };
  };
  for (const m of ttq.methods) ttq.setAndDefer(ttq, m);
  ttq._i = ttq._i || {};
  ttq._i[id] = [];
  ttq._t = ttq._t || {};
  ttq._t[id] = +new Date();
  ttq._o = ttq._o || {};
  ttq._o[id] = {};
  injectScript(`https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${encodeURIComponent(id)}&lib=ttq`);
}

/** Loads whichever trackers are configured. Safe to call repeatedly. */
export function initAnalytics(ids: AnalyticsIds) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
  if (ids.ga4) loadGa4(ids.ga4.trim());
  if (ids.metaPixel) loadMeta(ids.metaPixel.trim());
  if (ids.tiktokPixel) loadTiktok(ids.tiktokPixel.trim());
}

export function isAnalyticsActive() {
  return loaded.ga4 || loaded.meta || loaded.tiktok;
}

type Item = { id: string; name: string; price: number; quantity?: number; category?: string | null };

function metaContents(items: Item[]) {
  return items.map((i) => ({ id: i.id, quantity: i.quantity ?? 1, item_price: i.price }));
}

function value(items: Item[]) {
  return Number(items.reduce((s, i) => s + i.price * (i.quantity ?? 1), 0).toFixed(3));
}

export const analytics = {
  pageView(path: string, title?: string) {
    window.gtag?.("event", "page_view", { page_path: path, page_title: title });
    window.fbq?.("track", "PageView");
    window.ttq?.page?.();
  },

  viewItem(item: Item, currency = "BHD") {
    window.gtag?.("event", "view_item", { currency, value: item.price, items: [{ item_id: item.id, item_name: item.name, price: item.price, item_category: item.category ?? undefined }] });
    window.fbq?.("track", "ViewContent", { content_ids: [item.id], content_type: "product", value: item.price, currency });
    window.ttq?.track?.("ViewContent", { content_id: item.id, content_name: item.name, value: item.price, currency });
  },

  addToCart(item: Item, currency = "BHD") {
    const qty = item.quantity ?? 1;
    window.gtag?.("event", "add_to_cart", { currency, value: item.price * qty, items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: qty }] });
    window.fbq?.("track", "AddToCart", { content_ids: [item.id], content_type: "product", value: item.price * qty, currency });
    window.ttq?.track?.("AddToCart", { content_id: item.id, content_name: item.name, value: item.price * qty, currency });
  },

  beginCheckout(items: Item[], currency = "BHD") {
    const v = value(items);
    window.gtag?.("event", "begin_checkout", { currency, value: v, items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1 })) });
    window.fbq?.("track", "InitiateCheckout", { contents: metaContents(items), content_type: "product", value: v, currency });
    window.ttq?.track?.("InitiateCheckout", { value: v, currency });
  },

  purchase(orderId: string, items: Item[], total: number, currency = "BHD") {
    // one purchase event per order, even if the success page is reloaded
    const key = `vipstar_purchase_${orderId}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch { /* ignore */ }
    window.gtag?.("event", "purchase", { transaction_id: orderId, currency, value: total, items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity ?? 1 })) });
    window.fbq?.("track", "Purchase", { contents: metaContents(items), content_type: "product", value: total, currency });
    window.ttq?.track?.("CompletePayment", { value: total, currency, content_id: orderId });
  },

  search(term: string) {
    window.gtag?.("event", "search", { search_term: term });
    window.fbq?.("track", "Search", { search_string: term });
    window.ttq?.track?.("Search", { query: term });
  },

  signUp(method = "email") {
    window.gtag?.("event", "sign_up", { method });
    window.fbq?.("track", "CompleteRegistration");
    window.ttq?.track?.("CompleteRegistration");
  },
};
