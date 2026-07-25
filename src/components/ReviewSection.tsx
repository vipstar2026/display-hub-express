import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

function Stars({ value, onChange, size = 20 }: { value: number; onChange?: (n: number) => void; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <button
          key={n} type="button" disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star style={{ width: size, height: size }} className={n <= value ? "fill-primary text-primary" : "text-primary/30"} />
        </button>
      ))}
    </div>
  );
}

export function ReviewSection({ productId }: { productId: string }) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const { data: reviews } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => (await supabase.from("reviews_public").select("*").eq("product_id", productId).order("created_at", { ascending: false })).data ?? [],
  });

  const avg = reviews && reviews.length > 0 ? reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length : 0;

  const submit = async () => {
    if (!userId) return;
    if (!body.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: productId, user_id: userId, rating, title: title || null, body: body.trim(),
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("reviews.thanks"));
    setTitle(""); setBody(""); setRating(5);
    qc.invalidateQueries({ queryKey: ["reviews", productId] });
  };

  return (
    <section className="mt-16 border-t border-primary/10 pt-10">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">{t("reviews.title")}</h2>
          {reviews && reviews.length > 0 && (
            <div className="mt-1.5 flex items-center gap-2">
              <Stars value={Math.round(avg)} size={16} />
              <span className="text-sm text-muted-foreground">{avg.toFixed(1)} · {reviews.length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {(reviews ?? []).length === 0 ? (
            <div className="rounded-xl border border-primary/10 bg-card p-8 text-center text-muted-foreground">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 text-primary/30" />
              {t("reviews.none")}
            </div>
          ) : (
            (reviews ?? []).map((r) => (
              <div key={r.id} className="rounded-xl border border-primary/10 bg-card p-4">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating ?? 0} size={14} />
                  <span className="ms-auto text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                {r.title && <div className="mt-2 font-semibold">{r.title}</div>}
                <p className="mt-1 whitespace-pre-line text-sm text-foreground/80">{r.body}</p>
                <div className="mt-2 text-xs text-muted-foreground">— {r.author_name ?? "—"}</div>
              </div>
            ))
          )}
        </div>

        <div className="h-fit rounded-xl border border-primary/20 bg-card p-5">
          <h3 className="mb-4 font-display text-lg font-bold">{t("reviews.write")}</h3>
          {!userId ? (
            <Link to="/auth">
              <Button className="w-full bg-primary text-background hover:bg-primary">{t("reviews.signin_required")}</Button>
            </Link>
          ) : (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">{t("reviews.rating")}</Label>
                <div className="mt-1"><Stars value={rating} onChange={setRating} /></div>
              </div>
              <div>
                <Label className="text-xs">{t("reviews.your_title")}</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
              </div>
              <div>
                <Label className="text-xs">{t("reviews.your_review")}</Label>
                <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={1000} />
              </div>
              <Button onClick={submit} disabled={submitting || !body.trim()} className="w-full bg-primary text-background hover:bg-primary">
                {submitting ? "..." : t("reviews.submit")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
