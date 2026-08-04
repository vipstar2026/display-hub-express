import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { makeAdminT } from "@/lib/admin-i18n";
import {
  PERMISSION_GROUPS,
  PERMISSION_PRESETS,
  ALL_PERMISSIONS,
  permLabel,
} from "@/lib/permissions";
import {
  adminCreateUser,
  adminDeleteUser,
  adminSendPasswordReset,
  adminSetUserPassword,
} from "@/lib/admin-users.functions";
import {
  Users as UsersIcon, Shield, ShieldCheck, User as UserIcon, Search, Mail, Phone,
  Calendar, Plus, Trash2, KeyRound, Ban, CheckCircle2, Briefcase, Settings2, Copy,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
  head: () => ({
    meta: [
      { title: "Users & Roles · VIPSTAR Admin" },
      { name: "description", content: "Manage staff accounts, roles, and granular task permissions." },
    ],
  }),
});

type RoleKey = "admin" | "moderator" | "customer";

type Row = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  job_title: string | null;
  department: string | null;
  staff_notes: string | null;
  is_suspended: boolean;
  email_confirmed: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
  permissions: string[];
  orders_count: number;
  total_spent: number;
};

const ROLES: { key: RoleKey; ar: string; en: string; ur: string; bn: string; icon: typeof Shield; color: string }[] = [
  { key: "admin", ar: "مدير", en: "Admin", ur: "ایڈمن", bn: "অ্যাডমিন", icon: ShieldCheck, color: "bg-primary/15 text-primary border-primary/30" },
  { key: "moderator", ar: "مشرف", en: "Moderator", ur: "موڈریٹر", bn: "মডারেটর", icon: Shield, color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { key: "customer", ar: "عميل", en: "Customer", ur: "گاہک", bn: "গ্রাহক", icon: UserIcon, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
];

function AdminUsers() {
  const { lang } = useI18n();
  const ar = lang !== "en";
  const t = makeAdminT(lang);
  const qc = useQueryClient();

  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [editing, setEditing] = useState<Row | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users-full"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users_full");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-users-full"] });

  const toggleRole = async (uid: string, role: RoleKey) => {
    const { error } = await supabase.rpc("admin_toggle_user_role", { _user_id: uid, _role: role });
    if (error) return toast.error(error.message);
    toast.success(t("تم تحديث الدور", "Role updated"));
    refresh();
  };

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return users.filter((u) => {
      if (tab === "staff" && !u.roles.some((r) => r === "admin" || r === "moderator") && u.permissions.length === 0) return false;
      if (tab === "customers" && !u.roles.includes("customer")) return false;
      if (tab === "suspended" && !u.is_suspended) return false;
      if (!s) return true;
      return [u.email, u.display_name, u.phone, u.job_title, u.department]
        .some((v) => (v ?? "").toLowerCase().includes(s));
    });
  }, [users, q, tab]);

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.roles.includes("admin")).length,
    staff: users.filter((u) => u.roles.includes("moderator") || u.permissions.length > 0).length,
    suspended: users.filter((u) => u.is_suspended).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
            <UsersIcon className="h-6 w-6 text-primary" />
            {t("المستخدمون والصلاحيات", "Users & Roles")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("أضف موظفين، حدّد أدوارهم، وامنح كل واحد المهام المسموح له بها فقط.",
              "Add staff, set their roles, and grant each person only the tasks they are allowed to do.")}
          </p>
        </div>
        <Button onClick={() => setCreating(true)} className="gap-2">
          <Plus className="h-4 w-4" /> {t("مستخدم جديد", "New user")}
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={UsersIcon} label={t("إجمالي المستخدمين", "Total users")} value={stats.total} />
        <Kpi icon={ShieldCheck} label={t("المدراء", "Admins")} value={stats.admins} />
        <Kpi icon={Briefcase} label={t("الموظفون", "Staff")} value={stats.staff} />
        <Kpi icon={Ban} label={t("موقوفون", "Suspended")} value={stats.suspended} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="all">{t("الكل", "All")}</TabsTrigger>
            <TabsTrigger value="staff">{t("الفريق", "Staff")}</TabsTrigger>
            <TabsTrigger value="customers">{t("العملاء", "Customers")}</TabsTrigger>
            <TabsTrigger value="suspended">{t("موقوفون", "Suspended")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("بحث بالبريد أو الاسم أو الهاتف…", "Search email, name, phone…")} className="ps-9" />
        </div>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-card">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">{t("جارٍ التحميل…", "Loading…")}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <UsersIcon className="mx-auto mb-2 h-10 w-10 text-primary/30" />
            {t("لا يوجد مستخدمون", "No users")}
          </div>
        ) : (
          <div className="divide-y divide-primary/10">
            {filtered.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-4 p-4 hover:bg-primary/5">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 font-bold text-background">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    (u.display_name?.[0] ?? u.email?.[0] ?? "U").toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{u.display_name ?? "—"}</span>
                    {u.job_title && <span className="text-xs text-muted-foreground">· {u.job_title}</span>}
                    {u.roles.map((r) => {
                      const meta = ROLES.find((x) => x.key === r);
                      if (!meta) return null;
                      return (
                        <Badge key={r} variant="outline" className={`text-[10px] ${meta.color}`}>
                          {permLabel(meta, lang)}
                        </Badge>
                      );
                    })}
                    {u.permissions.length > 0 && (
                      <Badge variant="outline" className="border-sky-500/30 bg-sky-500/10 text-[10px] text-sky-400">
                        {u.permissions.length} {t("مهمة", "tasks")}
                      </Badge>
                    )}
                    {u.is_suspended && (
                      <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-[10px] text-destructive">
                        {t("موقوف", "Suspended")}
                      </Badge>
                    )}
                    {!u.email_confirmed && (
                      <Badge variant="outline" className="text-[10px]">{t("بريد غير مؤكد", "Unverified")}</Badge>
                    )}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <a href={`mailto:${u.email}`} className="inline-flex items-center gap-1 hover:text-primary">
                      <Mail className="h-3 w-3" /> {u.email}
                    </a>
                    {u.phone && (
                      <a href={`tel:${u.phone}`} className="inline-flex items-center gap-1 hover:text-primary">
                        <Phone className="h-3 w-3" /> {u.phone}
                      </a>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {t("انضم", "Joined")} {new Date(u.created_at).toLocaleDateString()}
                    </span>
                    {u.orders_count > 0 && (
                      <span>{u.orders_count} {t("طلب", "orders")} · {Number(u.total_spent).toFixed(3)}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ROLES.map((r) => {
                    const has = u.roles.includes(r.key);
                    const Icon = r.icon;
                    return (
                      <Button key={r.key} size="sm" variant={has ? "default" : "outline"}
                        onClick={() => toggleRole(u.id, r.key)}
                        className={`h-8 gap-1.5 text-xs ${has ? "" : "border-primary/20"}`}>
                        <Icon className="h-3 w-3" /> {permLabel(r, lang)}
                      </Button>
                    );
                  })}
                  <Button size="sm" variant="outline" className="h-8 gap-1.5 border-primary/20 text-xs" onClick={() => setEditing(u)}>
                    <Settings2 className="h-3 w-3" /> {t("إدارة", "Manage")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <ManageUserDialog user={editing} onClose={() => setEditing(null)} onSaved={refresh} lang={lang} ar={ar} />
      )}
      {creating && <CreateUserDialog onClose={() => setCreating(false)} onSaved={refresh} lang={lang} />}
    </div>
  );
}

/* ---------------- Manage dialog ---------------- */

function ManageUserDialog({
  user, onClose, onSaved, lang,
}: { user: Row; onClose: () => void; onSaved: () => void; lang: string; ar: boolean }) {
  const t = makeAdminT(lang);
  const deleteUser = useServerFn(adminDeleteUser);
  const resetPassword = useServerFn(adminSendPasswordReset);
  const setPassword = useServerFn(adminSetUserPassword);

  const [perms, setPerms] = useState<string[]>(user.permissions ?? []);
  const [profile, setProfile] = useState({
    display_name: user.display_name ?? "",
    phone: user.phone ?? "",
    job_title: user.job_title ?? "",
    department: user.department ?? "",
    staff_notes: user.staff_notes ?? "",
    is_suspended: user.is_suspended,
  });
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = user.roles.includes("admin");
  const toggle = (key: string) =>
    setPerms((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));

  const save = async () => {
    setSaving(true);
    const [{ error: e1 }, { error: e2 }] = await Promise.all([
      supabase.rpc("admin_set_user_permissions", { _user_id: user.id, _permissions: perms }),
      supabase.rpc("admin_update_user_profile", { _user_id: user.id, payload: profile }),
    ]);
    setSaving(false);
    if (e1 || e2) return toast.error((e1 ?? e2)!.message);
    toast.success(t("تم الحفظ", "Saved"));
    onSaved();
    onClose();
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user.display_name ?? user.email}</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="tasks">
          <TabsList className="w-full">
            <TabsTrigger value="tasks" className="flex-1">{t("المهام والصلاحيات", "Tasks & permissions")}</TabsTrigger>
            <TabsTrigger value="profile" className="flex-1">{t("بيانات الموظف", "Staff details")}</TabsTrigger>
            <TabsTrigger value="security" className="flex-1">{t("الأمان", "Security")}</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4 pt-4">
            {isAdmin && (
              <div className="rounded-lg border border-primary/25 bg-primary/5 p-3 text-xs text-muted-foreground">
                {t("هذا المستخدم مدير عام — لديه كل الصلاحيات تلقائياً.",
                  "This user is an admin — they automatically have every permission.")}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {PERMISSION_PRESETS.map((p) => (
                <Button key={p.key} size="sm" variant="outline" className="border-primary/20 text-xs"
                  onClick={() => setPerms(p.permissions)}>
                  {permLabel(p, lang)}
                </Button>
              ))}
            </div>
            <div className="space-y-4">
              {PERMISSION_GROUPS.map((g) => {
                const groupKeys = g.items.map((i) => i.key);
                const allOn = groupKeys.every((k) => perms.includes(k));
                return (
                  <div key={g.key} className="rounded-xl border border-primary/15 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-sm font-semibold">{permLabel(g, lang)}</div>
                      <Button size="sm" variant="ghost" className="h-7 text-xs"
                        onClick={() => setPerms((p) => allOn
                          ? p.filter((k) => !groupKeys.includes(k))
                          : Array.from(new Set([...p, ...groupKeys])))}>
                        {allOn ? t("إلغاء الكل", "Clear all") : t("تحديد الكل", "Select all")}
                      </Button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {g.items.map((i) => (
                        <label key={i.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-primary/5">
                          <Checkbox checked={perms.includes(i.key)} onCheckedChange={() => toggle(i.key)} />
                          <span>{permLabel(i, lang)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {perms.length}/{ALL_PERMISSIONS.length} {t("مهمة مفعّلة", "tasks enabled")}
            </div>
          </TabsContent>

          <TabsContent value="profile" className="space-y-3 pt-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("الاسم", "Display name")}>
                <Input value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} />
              </Field>
              <Field label={t("الهاتف", "Phone")}>
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              </Field>
              <Field label={t("المسمى الوظيفي", "Job title")}>
                <Input value={profile.job_title} onChange={(e) => setProfile({ ...profile, job_title: e.target.value })} />
              </Field>
              <Field label={t("القسم", "Department")}>
                <Input value={profile.department} onChange={(e) => setProfile({ ...profile, department: e.target.value })} />
              </Field>
            </div>
            <Field label={t("ملاحظات داخلية", "Internal notes")}>
              <Textarea rows={3} value={profile.staff_notes} onChange={(e) => setProfile({ ...profile, staff_notes: e.target.value })} />
            </Field>
            <div className="flex items-center justify-between rounded-xl border border-primary/15 p-3">
              <div>
                <div className="text-sm font-medium">{t("إيقاف الحساب", "Suspend account")}</div>
                <div className="text-xs text-muted-foreground">{t("يمنع الموظف من استخدام لوحة التحكم.", "Blocks this person from staff tools.")}</div>
              </div>
              <Switch checked={profile.is_suspended} onCheckedChange={(v) => setProfile({ ...profile, is_suspended: v })} />
            </div>
            <div className="text-xs text-muted-foreground">
              {t("البريد", "Email")}: {user.email} · {t("آخر دخول", "Last sign-in")}:{" "}
              {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : "—"}
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 pt-4">
            <div className="rounded-xl border border-primary/15 p-3">
              <div className="mb-2 text-sm font-medium">{t("تعيين كلمة مرور جديدة", "Set a new password")}</div>
              <div className="flex gap-2">
                <Input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="********" />
                <Button variant="outline" className="gap-1.5 border-primary/20"
                  onClick={async () => {
                    try {
                      await setPassword({ data: { user_id: user.id, password: newPassword } });
                      setNewPassword("");
                      toast.success(t("تم تغيير كلمة المرور", "Password updated"));
                    } catch (e: any) { toast.error(e?.message ?? "Error"); }
                  }}>
                  <KeyRound className="h-4 w-4" /> {t("حفظ", "Save")}
                </Button>
              </div>
            </div>
            <div className="rounded-xl border border-primary/15 p-3">
              <div className="mb-2 text-sm font-medium">{t("رابط استعادة كلمة المرور", "Password recovery link")}</div>
              <Button variant="outline" className="gap-1.5 border-primary/20"
                onClick={async () => {
                  try {
                    const res: any = await resetPassword({ data: { email: user.email, redirect_to: window.location.origin } });
                    if (res?.action_link) {
                      await navigator.clipboard.writeText(res.action_link).catch(() => {});
                      toast.success(t("تم نسخ الرابط", "Link copied"));
                    }
                  } catch (e: any) { toast.error(e?.message ?? "Error"); }
                }}>
                <Copy className="h-4 w-4" /> {t("إنشاء ونسخ الرابط", "Generate & copy link")}
              </Button>
            </div>
            <div className="rounded-xl border border-destructive/30 p-3">
              <div className="mb-2 text-sm font-medium text-destructive">{t("حذف الحساب نهائياً", "Delete account permanently")}</div>
              <Button variant="destructive" className="gap-1.5"
                onClick={async () => {
                  if (!confirm(t("هل أنت متأكد من حذف هذا الحساب؟", "Delete this account?"))) return;
                  try {
                    await deleteUser({ data: { user_id: user.id } });
                    toast.success(t("تم الحذف", "Deleted"));
                    onSaved(); onClose();
                  } catch (e: any) { toast.error(e?.message ?? "Error"); }
                }}>
                <Trash2 className="h-4 w-4" /> {t("حذف", "Delete")}
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="border-primary/20" onClick={onClose}>{t("إلغاء", "Cancel")}</Button>
          <Button onClick={save} disabled={saving} className="gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> {saving ? t("جارٍ الحفظ…", "Saving…") : t("حفظ التغييرات", "Save changes")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------------- Create dialog ---------------- */

function CreateUserDialog({ onClose, onSaved, lang }: { onClose: () => void; onSaved: () => void; lang: string }) {
  const t = makeAdminT(lang);
  const createUser = useServerFn(adminCreateUser);
  const [form, setForm] = useState({
    email: "", password: "", display_name: "", phone: "", job_title: "", department: "",
    send_invite: false,
  });
  const [roles, setRoles] = useState<string[]>(["customer"]);
  const [perms, setPerms] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await createUser({ data: { ...form, roles, permissions: perms } });
      toast.success(t("تم إنشاء المستخدم", "User created"));
      onSaved(); onClose();
    } catch (e: any) {
      toast.error(e?.message ?? "Error");
    } finally { setBusy(false); }
  };

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("إضافة مستخدم / موظف", "Add user / staff member")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("البريد الإلكتروني", "Email")}>
              <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@vipstar.cc" />
            </Field>
            <Field label={t("كلمة المرور", "Password")}>
              <Input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="********" disabled={form.send_invite} />
            </Field>
            <Field label={t("الاسم", "Display name")}>
              <Input value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
            </Field>
            <Field label={t("الهاتف", "Phone")}>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </Field>
            <Field label={t("المسمى الوظيفي", "Job title")}>
              <Input value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
            </Field>
            <Field label={t("القسم", "Department")}>
              <Input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-primary/15 p-3">
            <div>
              <div className="text-sm font-medium">{t("إرسال دعوة بالبريد بدل كلمة المرور", "Send email invite instead of password")}</div>
              <div className="text-xs text-muted-foreground">{t("سيستلم رابط لتعيين كلمة المرور بنفسه.", "They receive a link to set their own password.")}</div>
            </div>
            <Switch checked={form.send_invite} onCheckedChange={(v) => setForm({ ...form, send_invite: v })} />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">{t("الأدوار", "Roles")}</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const on = roles.includes(r.key);
                return (
                  <Button key={r.key} size="sm" variant={on ? "default" : "outline"} className={on ? "" : "border-primary/20"}
                    onClick={() => setRoles((p) => on ? p.filter((x) => x !== r.key) : [...p, r.key])}>
                    {permLabel(r, lang)}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">{t("قالب المهام", "Task preset")}</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {PERMISSION_PRESETS.map((p) => (
                <Button key={p.key} size="sm" variant="outline" className="border-primary/20 text-xs" onClick={() => setPerms(p.permissions)}>
                  {permLabel(p, lang)}
                </Button>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              {perms.length} {t("مهمة محددة — يمكن تعديلها بالتفصيل بعد الإنشاء.", "tasks selected — fine-tune after creating.")}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" className="border-primary/20" onClick={onClose}>{t("إلغاء", "Cancel")}</Button>
          <Button onClick={submit} disabled={busy || !form.email} className="gap-1.5">
            <Plus className="h-4 w-4" /> {busy ? t("جارٍ الإنشاء…", "Creating…") : t("إنشاء", "Create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function Kpi({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-primary/15 bg-card p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="mt-1 font-display text-2xl font-bold">{value}</div>
    </div>
  );
}
