export type PaymentState =
  | "created"
  | "awaiting_customer"
  | "processing"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "expired"
  | "requires_review"
  | "refunded";

export type PaymentOrder = {
  id: string;
  order_number: string;
  total: number;
  currency: string;
  payment_status: string;
  status: string;
  buyer_email?: string | null;
  buyer_name?: string | null;
};

export type GatewayStatus = {
  externalPaymentId: string | null;
  merchantReference: string | null;
  amount: string | null;
  currency: string | null;
  brand: string | null;
  code: string;
  description: string;
  last4?: string | null;
  rateLimited?: boolean;
  state: "succeeded" | "processing" | "failed" | "unknown";
};

