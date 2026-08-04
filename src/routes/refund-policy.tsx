import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/refund-policy")({
  component: () => <PolicyPage policyKey="refund" />,
  head: () => ({
    meta: [
      { title: "Refund Policy — VIP STAR Satellite & Electronics" },
      { name: "description", content: "Refund eligibility, procedure and processing timelines for VIP STAR orders paid online." },
      { property: "og:title", content: "Refund Policy — VIP STAR" },
      { property: "og:description", content: "How and when refunds are issued to the original payment method." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
