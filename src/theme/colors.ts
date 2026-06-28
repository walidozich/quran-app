// Two palettes with identical keys. The active one is provided via ThemeProvider
// (useColors). Identity drawn from the mushaf: emerald + gold, parchment (light)
// or deep green-black (dark).

export const lightColors = {
  primary: "#0E5E4E",
  primaryDark: "#0A463A",
  primaryDeep: "#063026",
  primarySoft: "#E3F0EB",

  accent: "#C9A227",
  accentSoft: "#F6EFD8",
  accentMuted: "#D8C9A0",

  background: "#FBF8F1",
  surface: "#FFFFFF",

  text: "#1C2B27",
  textMuted: "#6B7280",
  textOnPrimary: "#FFFFFF",

  border: "#E7E1D5",

  success: "#2E7D5B",
  warning: "#B8860B",
  danger: "#B4413C",

  statusPending: "#B8860B",
  statusDraft: "#6B7280",
  statusReviewed: "#2E7D5B",
} as const;

export type ColorScheme = Record<keyof typeof lightColors, string>;
export type ColorKey = keyof typeof lightColors;

export const darkColors: ColorScheme = {
  primary: "#1E8E76", // emerald, deep enough for white text on buttons
  primaryDark: "#176B59",
  primaryDeep: "#0B3A30",
  primarySoft: "#15302A",

  accent: "#E3BC52", // brighter gold
  accentSoft: "#EBD9A0", // light gold — used as text on the emerald gradient
  accentMuted: "#5A5230",

  background: "#0F1714", // deep green-black
  surface: "#18221E",

  text: "#ECF2EF",
  textMuted: "#9BA8A2",
  textOnPrimary: "#FFFFFF",

  border: "#2A352F",

  success: "#3FAE84",
  warning: "#D9A521",
  danger: "#E0655E",

  statusPending: "#D9A521",
  statusDraft: "#9BA8A2",
  statusReviewed: "#3FAE84",
};

// Fallback for any module not yet routed through useColors (light theme).
export const colors: ColorScheme = lightColors;
