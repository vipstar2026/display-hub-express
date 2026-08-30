async function log(entity: string, action: string, details: Record<string, unknown>) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("activity_log").insert({
      action,
      entity_type: entity,
      details: details as never,
    });
  } catch {
    /* diagnostics only */
  }
}

export const logAfs = (action: string, details: Record<string, unknown>) => log("afs_webhook", action, details);
export const logBenefit = (action: string, details: Record<string, unknown>) => log("benefit_webhook", action, details);
