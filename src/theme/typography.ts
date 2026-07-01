import { TextStyle } from "react-native";

// UI text uses Noto Naskh Arabic (clean naskh, correct RN metrics, real weights).
// Actual Quranic/ayah text uses Amiri Quran (variant="quran").
export const fonts = {
  regular: "NotoNaskhArabic_400Regular",
  medium: "NotoNaskhArabic_500Medium",
  bold: "NotoNaskhArabic_700Bold",
  quran: "AmiriQuran_400Regular",
} as const;

export const textStyles = {
  title: {
    fontFamily: fonts.bold,
    fontSize: 24,
    lineHeight: 36,
  },
  heading: {
    fontFamily: fonts.bold,
    fontSize: 19,
    lineHeight: 29,
  },
  subheading: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 24,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 24,
  },
  caption: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 20,
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 15,
    lineHeight: 22,
  },
  // For rendering actual Quran/ayah text; generous line-height for diacritics.
  quran: {
    fontFamily: fonts.quran,
    fontSize: 20,
    lineHeight: 40,
  },
} satisfies Record<string, TextStyle>;
