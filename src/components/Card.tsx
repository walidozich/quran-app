import { ReactNode, useMemo } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { ColorScheme, radius, spacing, useColors } from "../theme";

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

export function Card({ children, style }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={[styles.card, style]}>{children}</View>;
}

const makeStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
      shadowColor: "#000",
      shadowOpacity: 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
  });
