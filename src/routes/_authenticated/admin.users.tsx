import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Shield, Store, User as UserIcon, X, Check } from "lucide-react";
import { useAdminI18n } from "@/lib/i18n-admin";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

type RoleRow = { id: string; user_id: string; role: "admin" | "vendor" | "customer"; created_at: string };
type Profile = { id: string; display_name: string | null; phone: string | null; avatar_url: string | null };

type UserAggregate = {
  user_id: string;
  profile: Profile | null;
  roles: RoleRow["role"][];
  joined: string;
};

const ROLES: RoleRow["role"][] = ["admin", "vendor", "customer"];

const ROLE_ICON: Record<string, typeof Shield> = { admin: Shield, vendor: Store, customer: UserIcon };
const ROLE_COLOR: Record<string, string> = {
  admin: "bg-rose-100 text-rose-800",
  vendor: "bg-indigo-100 text-indigo-800",
  customer: "bg-slate-100 text-slate-700",
};

function AdminUsers() {
  const { L } = useAdminI18n();
  const [rows, setRows] = useState<UserAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  const roleLabel = (r: RoleRow["role"]) => (r === "admin" ? L.role_admin : r === "vendor" ? L.role_vendor : L.role_customer);

  async function load() {
    setLoading(true);
    const [{ data: roleData }, { data: profiles }] = await Promise.all([
      supabase.from("user_roles").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, display_name, phone, avatar_url"),
    ]);

    const profilesById = new Map((profiles || []).map((p) => [p.id, p as Profile]));
    const grouped = new Map<string, UserAggregate>();
    (roleData as RoleRow[] | null || []).forEach((r) => {
      const existing = grouped.get(r.user_id);
      if (existing) {
        existing.roles.push(r.role);
      } else {
        grouped.set(r.user_id, {
          user_id: r.user_id,
          profile: profilesById.get(r.user_id) ?? null,
          roles: [r.role],
          joined: r.created_at,
        });
      }
    });

    setRows(Array.from(grouped.values()).sort((a, b) => b.joined.localeCompare(a.joined)));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleRole(userId: string, role: RoleRow["role"], has: boolean) {
    if (has) {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) return toast.error(error.message);
      toast.success(L.usRemoved(roleLabel(role)));
    } else {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) return toast.error(error.message);
      toast.success(L.usGranted(roleLabel(role)));
    }
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">{L.usTitle}</h1>
      <p className="text-sm text-muted-foreground mt-1">{L.usSub}</p>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : rows.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center text-muted-foreground mt-6">{L.usNo}</div>
      ) : (
        <div className="mt-6 bg-card border border-border rounded-xl overflow-hidden overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="text-start p-3">{L.usCol_user}</th>
                <th className="text-start p-3">{L.usCol_roles}</th>
                <th className="text-start p-3 hidden md:table-cell">{L.usCol_joined}</th>
                <th className="text-end p-3">{L.usCol_manage}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((u) => (
                <tr key={u.user_id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-brand/10 text-brand grid place-items-center font-bold">
                        {(u.profile?.display_name || u.user_id).charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground truncate">{u.profile?.display_name || L.usUnnamed}</div>
                        <div className="text-[10px] text-muted-foreground font-mono truncate max-w-[180px]">{u.user_id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1 flex-wrap">
                      {u.roles.map((r) => {
                        const Icon = ROLE_ICON[r];
                        return (
                          <span key={r} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1 ${ROLE_COLOR[r]}`}>
                            <Icon className="w-3 h-3" /> {roleLabel(r)}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell text-muted-foreground">{new Date(u.joined).toLocaleDateString()}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {ROLES.map((role) => {
                        const has = u.roles.includes(role);
                        return (
                          <button
                            key={role}
                            onClick={() => toggleRole(u.user_id, role, has)}
                            className={`text-xs px-2 py-1 rounded border inline-flex items-center gap-1 ${has ? "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100" : "border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
                          >
                            {has ? <X className="w-3 h-3" /> : <Check className="w-3 h-3" />}
                            {roleLabel(role)}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
