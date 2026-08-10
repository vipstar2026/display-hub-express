import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { formatPrice } from "./format";

type Item = {
  product_name?: string | null;
  name?: string | null;
  quantity: number;
  unit_price: number | string;
  total?: number | string;
};

type Order = {
  order_number: string;
  created_at: string;
  buyer_name?: string | null;
  buyer_email: string;
  buyer_phone?: string | null;
  subtotal: number | string;
  discount: number | string;
  shipping: number | string;
  tax: number | string;
  total: number | string;
  currency: string;
  payment_method?: string | null;
  payment_status: string;
  status: string;
  coupon_code?: string | null;
  order_items?: Item[];
};

type Company = {
  name?: string;
  cr?: string;
  vat?: string;
  address?: string;
  email?: string;
  phone?: string;
};

// Build a ZATCA/GCC-style TLV Base64 payload for the QR code.
// Tags: 1=seller, 2=vat, 3=timestamp, 4=total, 5=vat amount.
function buildTlvBase64(fields: { seller: string; vat: string; timestamp: string; total: string; vatAmount: string }) {
  const enc = new TextEncoder();
  const parts: Uint8Array[] = [];
  const values = [fields.seller, fields.vat, fields.timestamp, fields.total, fields.vatAmount];
  values.forEach((val, idx) => {
    const tag = idx + 1;
    const bytes = enc.encode(val);
    const header = new Uint8Array([tag, bytes.length]);
    parts.push(header, bytes);
  });
  const total = parts.reduce((n, p) => n + p.length, 0);
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const p of parts) { merged.set(p, offset); offset += p.length; }
  let binary = "";
  for (const b of merged) binary += String.fromCharCode(b);
  return typeof btoa !== "undefined" ? btoa(binary) : Buffer.from(binary, "binary").toString("base64");
}

export async function generateInvoicePDF(order: Order, company: Company = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const currency = order.currency || "BHD";
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(139, 21, 56);
  doc.rect(0, 0, pageWidth, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(company.name || "VIPSTAR", 40, 40);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(Number(order.tax) > 0 ? "TAX INVOICE / فاتورة ضريبية" : "INVOICE / فاتورة", 40, 58);

  doc.setFontSize(11);
  doc.text(`#${order.order_number}`, pageWidth - 40, 40, { align: "right" });
  doc.setFontSize(9);
  doc.text(new Date(order.created_at).toLocaleString("en-GB"), pageWidth - 40, 58, { align: "right" });

  // Company + customer
  doc.setTextColor(60, 60, 60);
  doc.setFontSize(9);
  const y = 110;
  const left: string[] = [];
  if (company.address) left.push(company.address);
  if (company.cr) left.push(`CR: ${company.cr}`);
  if (company.vat) left.push(`VAT: ${company.vat}`);
  if (company.email) left.push(company.email);
  if (company.phone) left.push(company.phone);
  left.forEach((l, i) => doc.text(l, 40, y + i * 12));

  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", pageWidth - 240, y);
  doc.setFont("helvetica", "normal");
  const cust = [order.buyer_name || "-", order.buyer_email, order.buyer_phone || ""].filter(Boolean);
  cust.forEach((l, i) => doc.text(String(l), pageWidth - 240, y + 14 + i * 12));

  // Items
  const rows = (order.order_items ?? []).map((it) => {
    const price = Number(it.unit_price);
    const total = it.total !== undefined ? Number(it.total) : price * it.quantity;
    return [
      it.product_name || it.name || "-",
      String(it.quantity),
      formatPrice(price, currency),
      formatPrice(total, currency),
    ];
  });

  autoTable(doc, {
    startY: y + 80,
    head: [["Item", "Qty", "Unit Price", "Total"]],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [139, 21, 56], textColor: 255 },
    styles: { fontSize: 9, cellPadding: 6 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "right" }, 3: { halign: "right" } },
  });

  // @ts-expect-error jspdf-autotable extends
  const finalY = doc.lastAutoTable.finalY as number;

  const totals: [string, string][] = [
    ["Subtotal", formatPrice(Number(order.subtotal), currency)],
  ];
  if (Number(order.discount) > 0) totals.push([`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`, `- ${formatPrice(Number(order.discount), currency)}`]);
  if (Number(order.shipping) > 0) totals.push(["Shipping", formatPrice(Number(order.shipping), currency)]);
  if (Number(order.tax) > 0) totals.push(["VAT", formatPrice(Number(order.tax), currency)]);

  let ty = finalY + 20;
  doc.setFontSize(10);
  totals.forEach(([k, v]) => {
    doc.setFont("helvetica", "normal");
    doc.text(k, pageWidth - 200, ty);
    doc.text(v, pageWidth - 40, ty, { align: "right" });
    ty += 16;
  });
  doc.setDrawColor(200);
  doc.line(pageWidth - 200, ty, pageWidth - 40, ty);
  ty += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("TOTAL", pageWidth - 200, ty);
  doc.text(formatPrice(Number(order.total), currency), pageWidth - 40, ty, { align: "right" });

  // QR (ZATCA/GCC TLV)
  try {
    const qrPayload = buildTlvBase64({
      seller: company.name || "VIPSTAR",
      vat: company.vat || "",
      timestamp: new Date(order.created_at).toISOString(),
      total: Number(order.total).toFixed(3),
      vatAmount: Number(order.tax).toFixed(3),
    });
    const dataUrl = await QRCode.toDataURL(qrPayload, { margin: 0, width: 220 });
    doc.addImage(dataUrl, "PNG", 40, finalY + 20, 90, 90);
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text("Scan for tax details", 40, finalY + 122);
  } catch { /* ignore QR failure */ }

  ty += 30;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100);
  doc.text(`Payment: ${order.payment_method || "—"} • Status: ${order.payment_status} • Order: ${order.status}`, 40, Math.max(ty, finalY + 140));

  doc.setFontSize(8);
  doc.setTextColor(140);
  doc.text("Thank you for your business • شكراً لتعاملكم معنا", pageWidth / 2, doc.internal.pageSize.getHeight() - 24, { align: "center" });

  doc.save(`invoice-${order.order_number}.pdf`);
}
