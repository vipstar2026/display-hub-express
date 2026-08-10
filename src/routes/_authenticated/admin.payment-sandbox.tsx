import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { runPaymentSimulation, clearPaymentSimulations, type SimStep } from "@/lib/payment-sim.functions";
import { CheckCircle2, XCircle, Loader2, FlaskConical, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/payment-sandbox")({
  component: SandboxPage,
});

const WEBHOOK_URL = "https://vipstar.cc/api/public/payments/afs";

function SandboxPage() {
  const { lang } = useI18n();
  const ar = lang === "ar";
  const run = useServerFn(runPaymentSimulation);
  const clear = useServerFn(clearPaymentSimulations);
  const [steps, setSteps] = useState<SimStep[]>([]);

  const sim = useMutation({
    mutationFn: (scenario: "success" | "failed" | "pending") => run({ data: { scenario } }),
    onSuccess: (r) => setSteps(r.steps),
    onError: (e: Error) => toast.error(e.message),
  });

  const cleanup = useMutation({
    mutationFn: () => clear({ data: undefined as never }),
    onSuccess: (r) => {
      setSteps([]);
      toast.success(ar ? `تم حذف ${r.removed} طلب محاكاة` : `Removed ${r.removed} simulation orders`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <FlaskConical className="h-6 w-6 text-primary" />
          {ar ? "محاكاة الدفع الإلكتروني" : "Payment simulation"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {ar
            ? "تنفّذ عملية شراء كاملة (طلب، ضريبة، بوابة، فاتورة، مخزون، بريد) دون أي خصم حقيقي."
            : "Runs a complete purchase (order, VAT, gateway, invoice, stock, email) without any real charge."}
        </p>
      </div>

      <Card className="space-y-3 p-4">
        <p className="text-sm font-semibold">{ar ? "رابط إشعارات الإنتاج (Webhook)" : "Production webhook URL"}</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 truncate rounded-md bg-muted px-3 py-2 text-xs" dir="ltr">{WEBHOOK_URL}</code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(WEBHOOK_URL);
              toast.success(ar ? "تم النسخ" : "Copied");
            }}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          {ar
            ? "أرسل هذا الرابط للبنك، ثم احفظ مفتاح فك التشفير في: طرق الدفع ← AFS ← Webhook decryption key."
            : "Send this URL to the bank, then save the decryption key under Payment Methods → AFS → Webhook decryption key."}
        </p>
      </Card>

      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap gap-2">
          <Button disabled={sim.isPending} onClick={() => sim.mutate("success")}>
            {sim.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {ar ? "محاكاة دفع ناجح" : "Simulate successful payment"}
          </Button>
          <Button variant="outline" disabled={sim.isPending} onClick={() => sim.mutate("pending")}>
            {ar ? "دفع معلّق" : "Pending payment"}
          </Button>
          <Button variant="outline" disabled={sim.isPending} onClick={() => sim.mutate("failed")}>
            {ar ? "دفع مرفوض" : "Declined payment"}
          </Button>
          <Button variant="ghost" disabled={cleanup.isPending} onClick={() => cleanup.mutate()}>
            <Trash2 className="mr-2 h-4 w-4" />
            {ar ? "حذف طلبات المحاكاة" : "Delete simulation orders"}
          </Button>
        </div>

        {steps.length > 0 && (
          <div className="divide-y rounded-lg border">
            {steps.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-2">
                  {s.ok ? (
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  ) : (
                    <XCircle className="h-4 w-4 text-destructive" />
                  )}
                  <span className="text-sm font-medium">{ar ? s.label_ar : s.label_en}</span>
                </div>
                <Badge variant={s.ok ? "secondary" : "destructive"} className="max-w-[55%] truncate">
                  <span dir="ltr">{s.detail}</span>
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
