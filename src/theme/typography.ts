import { TextStyle } from "react-native";

// Tajawal font family names as registered in app/_layout.tsx.
export const fonts = {
  regular: "Tajawal_400Regular",
  medium: "Tajawal_500Medium",
  bold: "Tajawal_700Bold",
} as const;

export const textStyles = {
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 36,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 30,
  },
  subheading: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 26,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 26,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 20,
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 22,
  },
} satisfies Record<string, TextStyle>;
