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
    fontSize: 26,
    lineHeight: 52,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 20,
    lineHeight: 42,
  },
  subheading: {
    fontFamily: fonts.medium,
    fontSize: 16,
    lineHeight: 36,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 34,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 30,
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 34,
  },
} satisfies Record<string, TextStyle>;
