/** Preset avatar tile colors (stored by key in profiles.avatar_color). */
export const AVATAR_COLORS: Record<string, string> = {
  green: "#0E5E4E",
  teal: "#1B7A63",
  gold: "#C9A227",
  blue: "#3C7A9C",
  purple: "#7A5C9C",
  red: "#B4413C",
  brown: "#9C5A3C",
  slate: "#5B7B8A",
};

export const AVATAR_COLOR_KEYS = Object.keys(AVATAR_COLORS);

export function avatarColorOf(key: string | null | undefined): string {
  return AVATAR_COLORS[key ?? "green"] ?? AVATAR_COLORS.green;
}

/** The initial letter shown on a profile tile. */
export function avatarInitial(fullName: string): string {
  return fullName.trim().charAt(0) || "؟";
}
