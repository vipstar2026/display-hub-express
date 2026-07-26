import { useEffect } from "react";
import { applyTheme, DEFAULT_THEME } from "@/lib/themes";
import { useSiteSettings } from "@/lib/site-settings";

export function ThemeApplier() {
  const { data } = useSiteSettings();

  useEffect(() => {
    applyTheme(data?.theme_preset ?? DEFAULT_THEME);
  }, [data?.theme_preset]);

  return null;
}
