import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/privacy")({
  component: () => <PolicyPage policyKey="privacy" />,
  head: () => ({
    meta: [
      { title: "Privacy Policy — VIP STAR Satellite & Electronics" },
      { name: "description", content: "How VIP STAR collects, uses, protects and discloses customer and payment information." },
      { property: "og:title", content: "Privacy Policy — VIP STAR" },
      { property: "og:description", content: "Data collection, cookies, payment data handling and disclosure practices at VIP STAR." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
