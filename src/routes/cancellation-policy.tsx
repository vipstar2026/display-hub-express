import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/cancellation-policy")({
  component: () => <PolicyPage policyKey="cancellation" />,
  head: () => ({
    meta: [
      { title: "Cancellation Policy — VIP STAR Satellite & Electronics" },
      { name: "description", content: "When an order can be cancelled, how to request it, and how long the refund takes." },
      { property: "og:title", content: "Cancellation Policy — VIP STAR" },
      { property: "og:description", content: "Order cancellation rules and refund timelines for VIP STAR customers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
