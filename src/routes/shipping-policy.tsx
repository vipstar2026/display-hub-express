import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/shipping-policy")({
  component: () => <PolicyPage policyKey="shipping" />,
  head: () => ({
    meta: [
      { title: "Shipping & Delivery Policy — VIP STAR Bahrain" },
      { name: "description", content: "Local and international delivery costs, timelines, methods and digital delivery for VIP STAR orders." },
      { property: "og:title", content: "Shipping & Delivery Policy — VIP STAR" },
      { property: "og:description", content: "Delivery fees, timelines and shipping methods inside Bahrain and worldwide." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
