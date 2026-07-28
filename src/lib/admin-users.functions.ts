import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error || !data) throw new Error("Forbidden");
}

export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    email: string;
    password?: string;
    display_name?: string;
    phone?: string;
    job_title?: string;
    department?: string;
    roles?: string[];
    permissions?: string[];
    send_invite?: boolean;
  }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const email = data.email.trim().toLowerCase();
    if (!email || !email.includes("@")) throw new Error("Invalid email");

    let userId: string | null = null;

    if (data.send_invite || !data.password) {
      const { data: invited, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { display_name: data.display_name ?? null },
      });
      if (error) throw new Error(error.message);
      userId = invited.user?.id ?? null;
    } else {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: data.password,
        email_confirm: true,
        user_metadata: { display_name: data.display_name ?? null },
      });
      if (error) throw new Error(error.message);
      userId = created.user?.id ?? null;
    }

    if (!userId) throw new Error("User creation failed");

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      display_name: data.display_name ?? null,
      phone: data.phone ?? null,
      job_title: data.job_title ?? null,
      department: data.department ?? null,
    });

    const roles = (data.roles ?? []).filter((r) => ["admin", "moderator", "customer"].includes(r));
    if (roles.length) {
      await supabaseAdmin
        .from("user_roles")
        .upsert(roles.map((role) => ({ user_id: userId, role })), { onConflict: "user_id,role" });
    }

    const perms = data.permissions ?? [];
    if (perms.length) {
      await supabaseAdmin
        .from("user_permissions")
        .upsert(perms.map((permission) => ({ user_id: userId, permission })), {
          onConflict: "user_id,permission",
        });
    }

    return { id: userId, email };
  });

export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    if (data.user_id === (context as any).userId) throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.user_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminSendPasswordReset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { email: string; redirect_to?: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: link, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: data.email,
      options: data.redirect_to ? { redirectTo: data.redirect_to } : undefined,
    });
    if (error) throw new Error(error.message);
    return { action_link: link?.properties?.action_link ?? null };
  });

export const adminSetUserPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { user_id: string; password: string }) => input)
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    if (!data.password || data.password.length < 8) throw new Error("Password must be at least 8 characters");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
