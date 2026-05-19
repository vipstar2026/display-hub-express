import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "./iptv";
import dishImg from "@/assets/dish.jpg";

export const Route = createFileRoute("/dish")({
  head: () => ({
    meta: [
      { title: "Satellite Dish — VIP STAR" },
      { name: "description", content: "Satellite dishes, LNBs and receivers." },
      { property: "og:image", content: dishImg },
    ],
  }),
  component: () => <CategoryPage category="dish" img={dishImg} titleKey="dish.title" subKey="dish.sub" />,
});
