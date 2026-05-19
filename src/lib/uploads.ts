import { supabase } from "@/integrations/supabase/client";

export function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0600-\u06FF]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `item-${Date.now()}`;
}

export async function uploadAsset(userId: string, file: File, folder: string): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("vendor-assets").upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("vendor-assets").getPublicUrl(path);
  return data.publicUrl;
}
