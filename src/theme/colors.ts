// Calm Islamic-modern palette: deep teal-green + warm cream/gold.
export const colors = {
  primary: "#0E5E4E", // deep teal-green
  primaryDark: "#0A463A",
  primaryDeep: "#063026", // darkest emerald — gradient end / splash
  primarySoft: "#E3F0EB", // tinted background for primary surfaces

  accent: "#C9A227", // warm gold (mushaf illumination)
  accentSoft: "#F6EFD8",
  accentMuted: "#D8C9A0", // hairline gold for dividers

  background: "#FBF8F1", // warm cream
  surface: "#FFFFFF",

  text: "#1C2B27", // dark green-gray
  textMuted: "#6B7280",
  textOnPrimary: "#FFFFFF",

  border: "#E7E1D5",

  success: "#2E7D5B",
  warning: "#B8860B",
  danger: "#B4413C",

  // recording status badges
  statusPending: "#B8860B",
  statusDraft: "#6B7280",
  statusReviewed: "#2E7D5B",
} as const;

export type ColorKey = keyof typeof colors;
