import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/exchange-policy")({
  component: () => <PolicyPage policyKey="exchange" />,
  head: () => ({
    meta: [
      { title: "Exchange Policy — VIP STAR Satellite & Electronics" },
      { name: "description", content: "Product exchange rules, procedure, timelines and overpayment handling at VIP STAR." },
      { property: "og:title", content: "Exchange Policy — VIP STAR" },
      { property: "og:description", content: "How to exchange a product and how price differences are settled." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
