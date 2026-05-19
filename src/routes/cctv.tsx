import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "./iptv";
import cctvImg from "@/assets/cctv.jpg";

export const Route = createFileRoute("/cctv")({
  head: () => ({
    meta: [
      { title: "CCTV Cameras — VIP STAR" },
      { name: "description", content: "Security cameras, NVRs and packages." },
      { property: "og:image", content: cctvImg },
    ],
  }),
  component: () => <CategoryPage category="cctv" img={cctvImg} titleKey="cctv.title" subKey="cctv.sub" />,
});
