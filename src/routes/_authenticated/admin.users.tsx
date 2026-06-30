import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  const qc = useQueryClient();
  const { data: profiles } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: roles } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => (await supabase.from("user_roles").select("user_id, role")).data ?? [],
  });

  const isAdmin = (uid: string) => roles?.some((r) => r.user_id === uid && r.role === "admin");

  const toggleAdmin = async (uid: string) => {
    if (isAdmin(uid)) {
      await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", "admin");
      toast.success("Admin removed");
    } else {
      await supabase.from("user_roles").insert({ user_id: uid, role: "admin" });
      toast.success("Granted admin");
    }
    qc.invalidateQueries({ queryKey: ["admin-roles"] });
  };

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold">Users</h1>
      <div className="rounded-xl border border-cyan-500/10 bg-card divide-y divide-cyan-500/10">
        {(profiles ?? []).map((u) => (
          <div key={u.id} className="flex items-center gap-3 p-3">
            <div className="flex-1">
              <div className="font-medium">{u.display_name ?? "—"}</div>
              <div className="text-xs text-muted-foreground">{u.id}</div>
            </div>
            {isAdmin(u.id) && <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-400">ADMIN</span>}
            <Button size="sm" variant="outline" onClick={() => toggleAdmin(u.id)}>
              {isAdmin(u.id) ? "Revoke admin" : "Make admin"}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
