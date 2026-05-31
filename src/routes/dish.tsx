import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage, type ProductGroup } from "./iptv";
import dishImg from "@/assets/dish.jpg";

const DISH_GROUPS: ProductGroup[] = [
  {
    key: "receivers",
    labelKey: "dish.gReceivers",
    match: (t) => /receiver|ريسيفر|استقبال|جهاز/i.test(t),
  },
  {
    key: "cables",
    labelKey: "dish.gCables",
    match: (t) => /cable|coax|wire|كابل|كيبل|سلك|اسلاك|أسلاك/i.test(t),
  },
  {
    key: "dishes",
    labelKey: "dish.gDishes",
    match: (t) => /dish|lnb|mount|طبق|أطباق|حامل|تركيب/i.test(t),
  },
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
