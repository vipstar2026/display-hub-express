import { createFileRoute, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useI18n, localizedName } from "@/lib/i18n";
import { useCart } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { formatPrice, firstImage } from "@/lib/format";
import { Package, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const Route = createFileRoute("/product/$slug")({
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { t, lang } = useI18n();
  const { add } = useCart();
  const [qty, setQty] = useState(1);

  const { data: p, isLoading } = useQuery({
    queryKey: ["product", slug],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("slug", slug).eq("status", "active").maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });

  if (isLoading) return <div className="min-h-screen bg-background"><Header /><div className="container mx-auto py-20 text-center text-muted-foreground">...</div></div>;
  if (!p) return null;

  const name = localizedName(p, "name", lang);
  const description = localizedName(p, "description", lang);
  const img = firstImage(p.images);
  const oos = p.track_stock && p.stock <= 0;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto grid gap-8 px-4 py-8 md:grid-cols-2">
        <div className="aspect-square overflow-hidden rounded-2xl border border-cyan-500/20 bg-card">
          {img ? (
            <img src={img} alt={name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-cyan-500/30"><Package className="h-32 w-32" /></div>
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold">{name}</h1>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="font-mono text-3xl font-bold text-cyan-400">{formatPrice(Number(p.price), p.currency)}</span>
            {p.compare_price && Number(p.compare_price) > Number(p.price) && (
              <span className="text-lg text-muted-foreground line-through">{formatPrice(Number(p.compare_price), p.currency)}</span>
            )}
          </div>

          {description && <p className="mt-6 whitespace-pre-line leading-relaxed text-foreground/80">{description}</p>}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center rounded-md border border-cyan-500/20">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-cyan-500/10">−</button>
              <span className="w-12 text-center font-mono">{qty}</span>
              <button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-cyan-500/10">+</button>
            </div>
            <Button
              size="lg"
              disabled={oos}
              onClick={() => {
                add({ product_id: p.id, slug: p.slug, name, image: img, price: Number(p.price), type: p.type }, qty);
                toast.success(t("shop.addToCart"));
              }}
              className="flex-1 bg-cyan-500 text-background hover:bg-cyan-400"
            >
              <ShoppingCart className="me-2 h-4 w-4" />
              {oos ? t("shop.outOfStock") : t("shop.addToCart")}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
