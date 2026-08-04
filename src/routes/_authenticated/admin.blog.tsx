import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Newspaper, Plus, Search, Pencil, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/blog")({
  component: AdminBlog,
});

type Post = {
  id: string;
  slug: string;
  title_ar: string | null; title_en: string | null; title_ur: string | null;
  excerpt_ar: string | null; excerpt_en: string | null; excerpt_ur: string | null;
  content_ar: string | null; content_en: string | null; content_ur: string | null;
  cover_url: string | null;
  tags: string[];
  status: "draft" | "published";
  published_at: string | null;
  views: number;
  created_at: string;
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[\u0600-\u06FF]/g, (c) => c) // keep arabic
    .replace(/['"]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const empty: Partial<Post> = {
  slug: "", title_ar: "", title_en: "", title_ur: "", title_bn: "",
  excerpt_ar: "", excerpt_en: "", excerpt_ur: "", excerpt_bn: "",
  content_ar: "", content_en: "", content_ur: "", content_bn: "",
  cover_url: "", tags: [], status: "draft",
};

function AdminBlog() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState<"all" | "draft" | "published">("all");
  const [editing, setEditing] = useState<Partial<Post> | null>(null);
  const [saving, setSaving] = useState(false);
  const [tagsText, setTagsText] = useState("");

  const { data: posts, isFetching } = useQuery({
    queryKey: ["admin-blog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts" as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Post[];
    },
  });

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (posts ?? []).filter((p) => {
      if (statusF !== "all" && p.status !== statusF) return false;
      if (!term) return true;
      return (
        p.slug.toLowerCase().includes(term) ||
        p.title_ar?.toLowerCase().includes(term) ||
        p.title_en?.toLowerCase().includes(term) ||
        p.title_ur?.toLowerCase().includes(term)
      );
    });
  }, [posts, q, statusF]);

  const openNew = () => {
    setEditing({ ...empty });
    setTagsText("");
  };
  const openEdit = (p: Post) => {
    setEditing({ ...p });
    setTagsText((p.tags ?? []).join(", "));
  };

  const save = async () => {
    if (!editing) return;
    const title = editing.title_ar || editing.title_en || editing.title_ur;
    if (!title) return toast.error("Add a title in at least one language");
    let slug = editing.slug?.trim() || slugify(title);
    if (!slug) slug = `post-${Date.now()}`;

    const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
    const payload: any = {
      slug,
      title_ar: editing.title_ar || null,
      title_en: editing.title_en || null,
      title_ur: editing.title_ur || null,
      title_bn: (editing as any).title_bn || null,
      excerpt_ar: editing.excerpt_ar || null,
      excerpt_en: editing.excerpt_en || null,
      excerpt_ur: editing.excerpt_ur || null,
      excerpt_bn: (editing as any).excerpt_bn || null,
      content_ar: editing.content_ar || null,
      content_en: editing.content_en || null,
      content_ur: editing.content_ur || null,
      content_bn: (editing as any).content_bn || null,
      cover_url: editing.cover_url || null,
      tags,
      status: editing.status || "draft",
      published_at:
        editing.status === "published"
          ? editing.published_at || new Date().toISOString()
          : null,
    };

    setSaving(true);
    try {
      if (editing.id) {
        const { error } = await supabase.from("blog_posts" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("Post updated");
      } else {
        const { data: u } = await supabase.auth.getUser();
        payload.author_id = u.user?.id;
        const { error } = await supabase.from("blog_posts" as any).insert(payload);
        if (error) throw error;
        toast.success("Post created");
      }
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-blog"] });
      qc.invalidateQueries({ queryKey: ["blog-posts-public"] });
    } catch (e: any) {
      toast.error(e.message ?? "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this post?")) return;
    const { error } = await supabase.from("blog_posts" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["admin-blog"] });
  };

  const togglePublish = async (p: Post) => {
    const next = p.status === "published" ? "draft" : "published";
    const patch: any = { status: next };
    if (next === "published" && !p.published_at) patch.published_at = new Date().toISOString();
    const { error } = await supabase.from("blog_posts" as any).update(patch).eq("id", p.id);
    if (error) return toast.error(error.message);
    toast.success(next === "published" ? "Published" : "Unpublished");
    qc.invalidateQueries({ queryKey: ["admin-blog"] });
  };

  const stats = useMemo(() => {
    const total = posts?.length ?? 0;
    const published = posts?.filter((p) => p.status === "published").length ?? 0;
    const drafts = total - published;
    const views = posts?.reduce((s, p) => s + (p.views || 0), 0) ?? 0;
    return { total, published, drafts, views };
  }, [posts]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Newspaper className="h-6 w-6 text-primary" /> Blog
          </h1>
          <p className="text-sm text-muted-foreground">Publish news, articles and product guides</p>
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> New post</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Total" value={stats.total} />
        <Stat label="Published" value={stats.published} />
        <Stat label="Drafts" value={stats.drafts} />
        <Stat label="Total views" value={stats.views} />
      </div>

      <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur">
        <div className="grid gap-3 md:grid-cols-[1fr_180px]">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title or slug" className="ps-9" />
          </div>
          <Select value={statusF} onValueChange={(v) => setStatusF(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-primary/20 bg-card/60 backdrop-blur">
        {isFetching && !posts ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">No posts</div>
        ) : (
          <div className="divide-y divide-primary/10">
            {filtered.map((p) => {
              const title = p.title_ar || p.title_en || p.title_ur || p.slug;
              return (
                <div key={p.id} className="flex flex-wrap items-center gap-3 p-4 hover:bg-primary/5">
                  <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded bg-primary/5">
                    {p.cover_url && <img src={p.cover_url} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <code className="font-mono">/{p.slug}</code>
                      <span>·</span>
                      <span>{new Date(p.created_at).toLocaleDateString()}</span>
                      <span>·</span>
                      <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views}</span>
                    </div>
                  </div>
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                    p.status === "published"
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                  }`}>{p.status}</span>
                  {p.status === "published" && (
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-primary" title="Open">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Button size="sm" variant="outline" onClick={() => togglePublish(p)} className="gap-1">
                    {p.status === "published" ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {p.status === "published" ? "Unpublish" : "Publish"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openEdit(p)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => remove(p.id)} className="text-red-400 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Edit post" : "New post"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
                <div>
                  <label className="text-xs text-muted-foreground">Slug</label>
                  <Input
                    value={editing.slug ?? ""}
                    onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                    placeholder="auto-generated-from-title"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Status</label>
                  <Select value={editing.status ?? "draft"} onValueChange={(v) => setEditing({ ...editing, status: v as any })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Cover image URL</label>
                <Input value={editing.cover_url ?? ""} onChange={(e) => setEditing({ ...editing, cover_url: e.target.value })} placeholder="https://…" />
              </div>

              <div>
                <label className="text-xs text-muted-foreground">Tags (comma separated)</label>
                <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="IPTV, tips, receivers" />
              </div>

              {(["ar", "en", "ur", "bn"] as const).map((L) => (
                <div key={L} className="rounded-lg border border-primary/10 p-3 space-y-2">
                  <div className="text-xs font-semibold uppercase text-primary">{L === "ar" ? "العربية" : L === "en" ? "English" : L === "ur" ? "اردو" : "বাংলা"}</div>
                  <Input
                    placeholder="Title"
                    value={(editing as any)[`title_${L}`] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [`title_${L}`]: e.target.value })}
                    dir={L === "en" || L === "bn" ? "ltr" : "rtl"}
                  />
                  <Textarea
                    placeholder="Short excerpt"
                    rows={2}
                    value={(editing as any)[`excerpt_${L}`] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [`excerpt_${L}`]: e.target.value })}
                    dir={L === "en" || L === "bn" ? "ltr" : "rtl"}
                  />
                  <Textarea
                    placeholder="Content (HTML or plain text)"
                    rows={8}
                    value={(editing as any)[`content_${L}`] ?? ""}
                    onChange={(e) => setEditing({ ...editing, [`content_${L}`]: e.target.value })}
                    dir={L === "en" || L === "bn" ? "ltr" : "rtl"}
                  />
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-primary/20 bg-card/60 p-4 backdrop-blur">
      <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-2xl font-bold text-primary">{value.toLocaleString()}</div>
    </div>
  );
}
