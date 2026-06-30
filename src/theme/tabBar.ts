import { ColorScheme } from "./colors";
import { fonts } from "./typography";

/** Shared bottom-tab navigator styling for the student & teacher tab layouts. */
export function tabScreenOptions(colors: ColorScheme, insetBottom: number) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      height: 66 + insetBottom,
      paddingBottom: insetBottom + 18,
      paddingTop: 10,
    },
    tabBarLabelStyle: { fontFamily: fonts.regular, fontSize: 11 },
  };
}
