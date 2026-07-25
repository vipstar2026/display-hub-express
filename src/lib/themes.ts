// VIP STAR — theme presets. Each key maps to a set of CSS variables that get
// applied to :root. Kept in sync with src/styles.css tokens.

export type ThemePreset = {
  id: string;
  name: string;
  swatches: string[]; // for the picker UI
  vars: Record<string, string>;
};

const shared = {
  "--radius": "0.875rem",
  "--foreground": "oklch(0.97 0.01 60)",
  "--card-foreground": "oklch(0.97 0.01 60)",
  "--popover-foreground": "oklch(0.97 0.01 60)",
  "--secondary-foreground": "oklch(0.97 0.01 60)",
  "--muted-foreground": "oklch(0.72 0.02 40)",
  "--accent-foreground": "oklch(0.95 0.03 60)",
  "--destructive-foreground": "oklch(1 0 0)",
  "--brand-foreground": "oklch(1 0 0)",
  "--primary-foreground": "oklch(1 0 0)",
  "--transition-smooth": "all 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
};

export const THEME_PRESETS: Record<string, ThemePreset> = {
  crimson_noir: {
    id: "crimson_noir",
    name: "Crimson Noir",
    swatches: ["#0f0a0a", "#1a1010", "#c8102e", "#e8b84a"],
    vars: {
      ...shared,
      "--background": "oklch(0.14 0.015 25)",
      "--card": "oklch(0.19 0.02 25)",
      "--popover": "oklch(0.19 0.02 25)",
      "--secondary": "oklch(0.24 0.025 25)",
      "--muted": "oklch(0.22 0.02 25)",
      "--accent": "oklch(0.28 0.05 30)",
      "--border": "oklch(0.28 0.03 25)",
      "--input": "oklch(0.24 0.025 25)",
      "--brand": "oklch(0.58 0.21 25)",
      "--brand-dark": "oklch(0.46 0.18 25)",
      "--primary": "oklch(0.58 0.21 25)",
      "--ring": "oklch(0.58 0.21 25)",
      "--accent2": "oklch(0.78 0.14 75)",
      "--sale": "oklch(0.82 0.15 80)",
      "--destructive": "oklch(0.58 0.20 22)",
      "--gradient-brand": "linear-gradient(135deg, oklch(0.58 0.21 25), oklch(0.78 0.14 75))",
      "--gradient-topbar": "linear-gradient(90deg, oklch(0.20 0.03 25), oklch(0.14 0.015 25))",
      "--gradient-flash": "linear-gradient(90deg, oklch(0.58 0.21 25), oklch(0.82 0.15 80))",
      "--gradient-hero": "radial-gradient(ellipse at top, oklch(0.28 0.10 25) 0%, oklch(0.14 0.015 25) 70%)",
      "--shadow-card": "0 1px 3px oklch(0 0 0 / 40%), 0 8px 24px oklch(0 0 0 / 28%)",
      "--shadow-hover": "0 10px 40px oklch(0.58 0.21 25 / 26%), 0 0 0 1px oklch(0.58 0.21 25 / 32%)",
      "--shadow-glow": "0 0 32px oklch(0.58 0.21 25 / 34%)",
    },
  },
  ruby_velvet: {
    id: "ruby_velvet",
    name: "Ruby Velvet",
    swatches: ["#1a0f10", "#2d1618", "#e63946", "#f4d4a8"],
    vars: {
      ...shared,
      "--background": "oklch(0.17 0.02 20)",
      "--card": "oklch(0.22 0.025 20)",
      "--popover": "oklch(0.22 0.025 20)",
      "--secondary": "oklch(0.27 0.03 20)",
      "--muted": "oklch(0.24 0.02 20)",
      "--accent": "oklch(0.30 0.05 25)",
      "--border": "oklch(0.30 0.03 20)",
      "--input": "oklch(0.26 0.025 20)",
      "--brand": "oklch(0.62 0.19 30)",
      "--brand-dark": "oklch(0.50 0.17 28)",
      "--primary": "oklch(0.62 0.19 30)",
      "--ring": "oklch(0.62 0.19 30)",
      "--accent2": "oklch(0.52 0.14 300)",
      "--sale": "oklch(0.86 0.10 85)",
      "--destructive": "oklch(0.58 0.20 22)",
      "--gradient-brand": "linear-gradient(135deg, oklch(0.62 0.19 30), oklch(0.52 0.14 300))",
      "--gradient-topbar": "linear-gradient(90deg, oklch(0.24 0.04 25), oklch(0.20 0.03 15))",
      "--gradient-flash": "linear-gradient(90deg, oklch(0.62 0.19 30), oklch(0.86 0.10 85))",
      "--gradient-hero": "radial-gradient(ellipse at top, oklch(0.32 0.10 28) 0%, oklch(0.17 0.02 20) 70%)",
      "--shadow-card": "0 1px 3px oklch(0 0 0 / 30%), 0 8px 24px oklch(0 0 0 / 22%)",
      "--shadow-hover": "0 10px 40px oklch(0.62 0.19 30 / 24%), 0 0 0 1px oklch(0.62 0.19 30 / 30%)",
      "--shadow-glow": "0 0 32px oklch(0.62 0.19 30 / 32%)",
    },
  },
  scarlet_chrome: {
    id: "scarlet_chrome",
    name: "Scarlet Chrome",
    swatches: ["#0d0d10", "#1c1c22", "#ff3b3b", "#c0c4cc"],
    vars: {
      ...shared,
      "--background": "oklch(0.16 0.008 270)",
      "--card": "oklch(0.21 0.012 270)",
      "--popover": "oklch(0.21 0.012 270)",
      "--secondary": "oklch(0.26 0.015 270)",
      "--muted": "oklch(0.23 0.012 270)",
      "--accent": "oklch(0.30 0.02 270)",
      "--border": "oklch(0.30 0.015 270)",
      "--input": "oklch(0.24 0.012 270)",
      "--brand": "oklch(0.66 0.24 25)",
      "--brand-dark": "oklch(0.54 0.21 25)",
      "--primary": "oklch(0.66 0.24 25)",
      "--ring": "oklch(0.66 0.24 25)",
      "--accent2": "oklch(0.78 0.01 270)",
      "--sale": "oklch(0.82 0.12 80)",
      "--destructive": "oklch(0.58 0.20 22)",
      "--muted-foreground": "oklch(0.72 0.01 270)",
      "--gradient-brand": "linear-gradient(135deg, oklch(0.66 0.24 25), oklch(0.78 0.01 270))",
      "--gradient-topbar": "linear-gradient(90deg, oklch(0.21 0.012 270), oklch(0.16 0.008 270))",
      "--gradient-flash": "linear-gradient(90deg, oklch(0.66 0.24 25), oklch(0.82 0.12 80))",
      "--gradient-hero": "radial-gradient(ellipse at top, oklch(0.32 0.10 25) 0%, oklch(0.16 0.008 270) 70%)",
      "--shadow-card": "0 1px 3px oklch(0 0 0 / 40%), 0 8px 24px oklch(0 0 0 / 30%)",
      "--shadow-hover": "0 10px 40px oklch(0.66 0.24 25 / 26%), 0 0 0 1px oklch(0.66 0.24 25 / 32%)",
      "--shadow-glow": "0 0 32px oklch(0.66 0.24 25 / 34%)",
    },
  },
  royal_crimson: {
    id: "royal_crimson",
    name: "Royal Crimson",
    swatches: ["#14101e", "#231830", "#d81e3a", "#f5a3b4"],
    vars: {
      ...shared,
      "--background": "oklch(0.16 0.03 310)",
      "--card": "oklch(0.21 0.04 310)",
      "--popover": "oklch(0.21 0.04 310)",
      "--secondary": "oklch(0.26 0.05 310)",
      "--muted": "oklch(0.23 0.04 310)",
      "--accent": "oklch(0.30 0.06 310)",
      "--border": "oklch(0.30 0.05 310)",
      "--input": "oklch(0.24 0.04 310)",
      "--brand": "oklch(0.60 0.21 20)",
      "--brand-dark": "oklch(0.48 0.18 20)",
      "--primary": "oklch(0.60 0.21 20)",
      "--ring": "oklch(0.60 0.21 20)",
      "--accent2": "oklch(0.58 0.16 320)",
      "--sale": "oklch(0.82 0.10 15)",
      "--destructive": "oklch(0.58 0.20 22)",
      "--gradient-brand": "linear-gradient(135deg, oklch(0.60 0.21 20), oklch(0.58 0.16 320))",
      "--gradient-topbar": "linear-gradient(90deg, oklch(0.24 0.05 310), oklch(0.16 0.03 310))",
      "--gradient-flash": "linear-gradient(90deg, oklch(0.60 0.21 20), oklch(0.82 0.10 15))",
      "--gradient-hero": "radial-gradient(ellipse at top, oklch(0.32 0.12 320) 0%, oklch(0.16 0.03 310) 70%)",
      "--shadow-card": "0 1px 3px oklch(0 0 0 / 35%), 0 8px 24px oklch(0 0 0 / 25%)",
      "--shadow-hover": "0 10px 40px oklch(0.60 0.21 20 / 26%), 0 0 0 1px oklch(0.60 0.21 20 / 32%)",
      "--shadow-glow": "0 0 32px oklch(0.60 0.21 20 / 34%)",
    },
  },
};

export const THEME_LIST = Object.values(THEME_PRESETS);
export const DEFAULT_THEME = "ruby_velvet";

export function applyTheme(id: string | null | undefined) {
  if (typeof document === "undefined") return;
  const preset = THEME_PRESETS[id || DEFAULT_THEME] ?? THEME_PRESETS[DEFAULT_THEME];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(preset.vars)) {
    root.style.setProperty(k, v);
  }
  root.dataset.theme = preset.id;
}
