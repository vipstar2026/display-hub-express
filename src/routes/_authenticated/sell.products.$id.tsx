import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "./sell.products.new";

export const Route = createFileRoute("/_authenticated/sell/products/$id")({
  component: EditProduct,
  head: () => ({ meta: [{ title: "Edit Product | VIP STAR" }] }),
});

function EditProduct() {
  const { id } = Route.useParams();
  return <ProductForm id={id} />;
}
