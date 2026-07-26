import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Users as UsersIcon, Shield, ShieldCheck, User as UserIcon, Search, Mail, Phone, Calendar } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

type Row = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
};

const ROLES: { key: "admin" | "moderator" | "customer"; label: string; icon: typeof Shield; color: string }[] = [
  { key: "admin", label: "Admin", icon: ShieldCheck, color: "bg-primary/15 text-primary border-primary/30" },
  { key: "moderator", label: "Moderator", icon: Shield, color: "bg-amber-500/15 text-amber-400 border-amber-500/30" },
  { key: "customer", label: "Customer", icon: UserIcon, color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" },
];

function AdminUsers() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users-full"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_list_users");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const toggleRole = async (uid: string, role: "admin" | "moderator" | "customer") => {
    const { error } = await supabase.rpc("admin_toggle_user_role", { _user_id: uid, _role: role });
    if (error) return toast.error(error.message);
    toast.success("Updated");
    qc.invalidateQueries({ queryKey: ["admin-users-full"] });
  };

  const filtered = users.filter((u) => {
    if (!q.trim()) return true;
    const s = q.toLowerCase();
    return (
      (u.email ?? "").toLowerCase().includes(s) ||
      (u.display_name ?? "").toLowerCase().includes(s) ||
      (u.phone ?? "").toLowerCase().includes(s)
    );
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.roles.includes("admin")).length,
    mods: users.filter((u) => u.roles.includes("moderator")).length,
    customers: users.filter((u) => u.roles.includes("customer")).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold">
          <UsersIcon className="h-6 w-6 text-primary" />
          Users & Roles
        </h1>
        <p className="text-sm text-muted-foreground">Manage all registered users and assign permissions.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi icon={UsersIcon} label="Total users" value={stats.total} />
        <Kpi icon={ShieldCheck} label="Admins" value={stats.admins} />
        <Kpi icon={Shield} label="Moderators" value={stats.mods} />
        <Kpi icon={UserIcon} label="Customers" value={stats.customers} />
      </div>

      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search email, name, phone…" className="ps-9" />
      </div>

      <div className="rounded-2xl border border-primary/15 bg-card">
        {isLoading ? (
          <div className="p-10 text-center text-muted-foreground">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <UsersIcon className="mx-auto mb-2 h-10 w-10 text-primary/30" />
            No users
          </div>
        ) : (
          <div className="divide-y divide-primary/10">
            {filtered.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-4 p-4 hover:bg-primary/5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 font-bold text-background">
                  {u.avatar_url ? (
                    <img src={u.avatar_url} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    (u.display_name?.[0] ?? u.email?.[0] ?? "U").toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{u.display_name ?? "—"}</span>
                    {u.roles.map((r) => {
                      const meta = ROLES.find((x) => x.key === r);
                      if (!meta) return null;
                      return (
                        <Badge key={r} variant="outline" className={`text-[10px] ${meta.color}`}>{meta.label}</Badge>
                      );
                    })}
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
                      <Calendar className="h-3 w-3" /> Joined {new Date(u.created_at).toLocaleDateString()}
                    </span>
                    {u.last_sign_in_at && (
                      <span className="opacity-75">Last seen {new Date(u.last_sign_in_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {ROLES.map((r) => {
                    const has = u.roles.includes(r.key);
                    const Icon = r.icon;
                    return (
                      <Button
                        key={r.key}
                        size="sm"
                        variant={has ? "default" : "outline"}
                        onClick={() => toggleRole(u.id, r.key)}
                        className={`h-8 gap-1.5 text-xs ${has ? "" : "border-primary/20"}`}
                      >
                        <Icon className="h-3 w-3" />
                        {has ? `Revoke ${r.label}` : `Make ${r.label}`}
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
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
