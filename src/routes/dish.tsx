import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage, type ProductGroup } from "./iptv";
import dishImg from "@/assets/dish.jpg";

const DISH_GROUPS: ProductGroup[] = [
  { key: "dish-receivers", labelKey: "dish.gReceivers", match: (_t, slug) => slug === "dish-receivers" },
  { key: "dish-cables", labelKey: "dish.gCables", match: (_t, slug) => slug === "dish-cables" },
  { key: "dish-accessories", labelKey: "dish.gDishes", match: (_t, slug) => slug === "dish-accessories" },
];

export const Route = createFileRoute("/dish")({
  head: () => ({
    meta: [
      { title: "Satellite Dish — VIP STAR" },
      { name: "description", content: "Satellite dishes, LNBs and receivers." },
      { property: "og:image", content: dishImg },
    ],
  }),
  component: () => <CategoryPage category="dish" img={dishImg} titleKey="dish.title" subKey="dish.sub" groups={DISH_GROUPS} />,
});
