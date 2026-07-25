import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export function NewsletterSignup() {
  const { t, lang } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      toast.error(t("newsletter.invalidEmail"));
      return;
    }
    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: v, lang, source: "footer" });
    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.info(t("newsletter.already"));
        setDone(true);
        return;
      }
      toast.error(error.message);
      return;
    }
    toast.success(t("newsletter.thanks"));
    setDone(true);
    setEmail("");
  }

  return (
    <div>
      <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary">
        {t("newsletter.title")}
      </h4>
      <p className="mb-3 text-sm text-muted-foreground">{t("newsletter.subtitle")}</p>
      {done ? (
        <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          <CheckCircle2 className="h-4 w-4" /> {t("newsletter.thanks")}
        </div>
      ) : (
        <form onSubmit={submit} className="flex gap-2">
          <div className="relative flex-1">
            <Mail className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("newsletter.placeholder")}
              className="h-10 border-primary/20 bg-background/50 ps-9"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-10">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("newsletter.subscribe")}
          </Button>
        </form>
      )}
    </div>
  );
}
