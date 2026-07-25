import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { applyTheme, DEFAULT_THEME } from "@/lib/themes";

export function ThemeApplier() {
  const { data } = useQuery({
    queryKey: ["site-theme"],
    queryFn: async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("theme_preset")
        .eq("id", 1)
        .maybeSingle();
      return (data as any)?.theme_preset ?? DEFAULT_THEME;
    },
    staleTime: 60_000,
  });

  useEffect(() => {
    applyTheme(data ?? DEFAULT_THEME);
  }, [data]);

  return null;
}
