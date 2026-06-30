import { TextStyle } from "react-native";

// Amiri Quran is registered in app/_layout.tsx. It ships a single weight, so all
// three roles point at the same family; hierarchy is carried by size and color.
const AMIRI = "AmiriQuran_400Regular";
export const fonts = {
  regular: AMIRI,
  medium: AMIRI,
  bold: AMIRI,
} as const;

export const textStyles = {
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 42,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 19,
    lineHeight: 34,
  },
  subheading: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 29,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 28,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 24,
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 28,
  },
} satisfies Record<string, TextStyle>;
