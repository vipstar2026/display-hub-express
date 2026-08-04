export function cleanWaNumber(value: string | null | undefined) {
  return (value ?? "").replace(/[^0-9]/g, "");
}

/** Fallback link that works everywhere (used for SSR href + mobile). */
export function waLink(phone: string | null | undefined, text?: string) {
  const n = cleanWaNumber(phone);
  if (!n) return "#";
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

function isMobileDevice() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

/**
 * On desktop (computer) open WhatsApp Web directly so the chat loads in the
 * browser instead of the "download WhatsApp" landing page.
 */
export function openWhatsApp(phone: string | null | undefined, text?: string) {
  const n = cleanWaNumber(phone);
  if (!n) return;
  const query = `phone=${n}${text ? `&text=${encodeURIComponent(text)}` : ""}`;
  const url = isMobileDevice()
    ? waLink(phone, text)
    : `https://web.whatsapp.com/send?${query}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** Spread onto an <a> to keep a valid href but force WhatsApp Web on desktop. */
export function waAnchorProps(phone: string | null | undefined, text?: string) {
  return {
    href: waLink(phone, text),
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (isMobileDevice()) return;
      e.preventDefault();
      openWhatsApp(phone, text);
    },
  };
}

/** URL that opens the chat on the current device (WhatsApp Web on desktop). */
export function waDesktopLink(phone: string | null | undefined, text?: string) {
  const n = cleanWaNumber(phone);
  if (!n) return "#";
  if (isMobileDevice()) return waLink(phone, text);
  return `https://web.whatsapp.com/send?phone=${n}${text ? `&text=${encodeURIComponent(text)}` : ""}`;
}
