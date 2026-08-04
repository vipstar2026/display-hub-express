import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage } from "@/components/PolicyPage";

export const Route = createFileRoute("/terms")({
  component: () => <PolicyPage policyKey="terms" />,
  head: () => ({
    meta: [
      { title: "Terms and Conditions — VIP STAR Satellite & Electronics" },
      { name: "description", content: "Terms of service for purchases and payments on the VIP STAR Satellite & Electronics website in Bahrain." },
      { property: "og:title", content: "Terms and Conditions — VIP STAR" },
      { property: "og:description", content: "Terms of service governing use of the VIP STAR website and online payments." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});
