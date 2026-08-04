import { useEffect, useRef, useState } from "react";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

type LocalMsg = { role: "user" | "system"; text: string; at: number };
const STORAGE_KEY = "vipstar_livechat_v1";

export function LiveChatWidget() {
  const { t, lang } = useI18n();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<LocalMsg[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        if (data.name) setName(data.name);
        if (data.email) setEmail(data.email);
        if (Array.isArray(data.messages)) setMessages(data.messages);
      }
    } catch {}
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      if (u) {
        setEmail((prev) => prev || u.email || "");
        setName((prev) => prev || (u.user_metadata as any)?.display_name || u.email?.split("@")[0] || "");
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ name, email, messages }));
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, name, email]);

  async function send() {
    if (!text.trim()) return;
    if (!name.trim() || !email.trim()) {
      toast.error(lang === "ar" ? "أدخل الاسم والبريد" : lang === "ur" ? "نام اور ای میل درج کریں" : lang === "bn" ? "নাম ও ইমেইল লিখুন" : "Enter name and email");
      return;
    }
    setSending(true);
    const msgText = text.trim();
    const localMsg: LocalMsg = { role: "user", text: msgText, at: Date.now() };
    setMessages((m) => [...m, localMsg]);
    setText("");
    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      subject: "[Live Chat]",
      message: msgText,
      status: "new",
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          role: "system",
          text:
            lang === "ar"
              ? "تم استلام رسالتك! سنرد عليك عبر البريد الإلكتروني في أقرب وقت."
              : lang === "ur"
              ? "آپ کا پیغام موصول ہو گیا! ہم جلد ای میل پر جواب دیں گے۔"
              : lang === "bn"
              ? "আপনার বার্তা পেয়েছি! আমরা শীঘ্রই ইমেইলে উত্তর দেব।"
              : "Message received! We'll reply to your email shortly.",
          at: Date.now(),
        },
      ]);
    }, 400);
  }

  const labels = {
    ar: { title: "الدردشة المباشرة", sub: "نرد خلال دقائق", name: "الاسم", email: "البريد", placeholder: "اكتب رسالتك...", welcome: "مرحباً! كيف نساعدك اليوم؟" },
    en: { title: "Live Chat", sub: "We reply in minutes", name: "Name", email: "Email", placeholder: "Type your message...", welcome: "Hi! How can we help you today?" },
    ur: { title: "لائیو چیٹ", sub: "چند منٹوں میں جواب", name: "نام", email: "ای میل", placeholder: "پیغام لکھیں...", welcome: "ہیلو! ہم کیسے مدد کر سکتے ہیں؟" },
    bn: { title: "লাইভ চ্যাট", sub: "কয়েক মিনিটেই উত্তর", name: "নাম", email: "ইমেইল", placeholder: "আপনার বার্তা লিখুন...", welcome: "হ্যালো! কীভাবে সাহায্য করতে পারি?" },
  }[lang as "ar" | "en" | "ur" | "bn"] ?? { title: "Live Chat", sub: "", name: "Name", email: "Email", placeholder: "Type...", welcome: "Hi!" };

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-24 md:bottom-6 start-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-background shadow-lg shadow-primary/40 transition hover:scale-105"
          aria-label={labels.title}
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -end-1 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-primary" />
          </span>
        </button>
      )}
      {open && (
        <div className="fixed bottom-24 md:bottom-6 start-6 z-50 flex h-[520px] w-[calc(100vw-3rem)] max-w-sm flex-col overflow-hidden rounded-2xl border border-primary/30 bg-card shadow-2xl shadow-primary/20">
          <div className="flex items-center justify-between border-b border-border/50 bg-gradient-to-r from-primary/20 to-transparent p-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" /><span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" /></span>
                <h3 className="font-semibold">{labels.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{labels.sub}</p>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-muted"><X className="h-4 w-4" /></button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            <div className="flex">
              <div className="max-w-[80%] rounded-2xl rounded-ss-sm bg-muted px-3 py-2 text-sm">{labels.welcome}</div>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : ""}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === "user" ? "rounded-ee-sm bg-primary text-background" : "rounded-ss-sm bg-muted"}`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {(!name || !email) && (
            <div className="grid grid-cols-2 gap-2 border-t border-border/50 p-2">
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={labels.name} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={labels.email} type="email" className="rounded-md border border-border bg-background px-2 py-1.5 text-sm" />
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-border/50 p-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              placeholder={labels.placeholder}
              className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button onClick={send} disabled={sending || !text.trim()} className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-background disabled:opacity-50">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
