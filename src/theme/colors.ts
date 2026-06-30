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
  // Warm charcoal: brown-charcoal surfaces, parchment text, emerald + gold accents.
  primary: "#2BA088", // emerald, pops on the warm dark
  primaryDark: "#21806C",
  primaryDeep: "#103B31",
  primarySoft: "#23291F", // warm soft tint for cards/badges

  accent: "#E8C45E", // gold
  accentSoft: "#F0DCA0", // light gold — text on the emerald gradient
  accentMuted: "#4E4326",

  background: "#14110D", // warm near-black
  surface: "#211C16",

  text: "#F2ECE0", // parchment
  textMuted: "#A89C86",
  textOnPrimary: "#FFFFFF",

  border: "#38301F",

  success: "#3FAE84",
  warning: "#E0A93A",
  danger: "#E0655E",

  statusPending: "#E0A93A",
  statusDraft: "#A89C86",
  statusReviewed: "#3FAE84",
};

// Fallback for any module not yet routed through useColors (light theme).
export const colors: ColorScheme = lightColors;
