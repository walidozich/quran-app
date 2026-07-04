import { ColorScheme } from "./colors";
import { fonts } from "./typography";

/** Shared bottom-tab navigator styling for the student & teacher tab layouts. */
export function tabScreenOptions(colors: ColorScheme, insetBottom: number) {
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.textMuted,
    // The active tab gets a soft tinted pill so the current page is obvious.
    // The bar is tall enough that icon + label both fit INSIDE the pill
    // (tight margins previously clipped the label via overflow hidden).
    tabBarActiveBackgroundColor: colors.primarySoft,
    tabBarItemStyle: {
      borderRadius: 16,
      marginHorizontal: 8,
      marginTop: 6,
      marginBottom: insetBottom + 6,
      paddingVertical: 4,
      overflow: "hidden" as const,
    },
    tabBarStyle: {
      backgroundColor: colors.surface,
      borderTopColor: colors.border,
      height: 76 + insetBottom,
      paddingBottom: 0,
      paddingTop: 0,
    },
    tabBarLabelStyle: { fontFamily: fonts.regular, fontSize: 11, marginTop: 2 },
  };
}
