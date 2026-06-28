import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, ViewStyle } from "react-native";
import { ColorScheme, radius, spacing, textStyles, useColors } from "../theme";
import { AppText } from "./AppText";

type Variant = "primary" | "secondary" | "ghost";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

export function Button({ label, onPress, variant = "primary", disabled, loading, style }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const isPrimary = variant === "primary";
  const isSecondary = variant === "secondary";
  const textColor = isPrimary ? colors.textOnPrimary : colors.primary;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        isPrimary && styles.primary,
        isSecondary && styles.secondary,
        variant === "ghost" && styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <AppText variant="button" color={textColor} style={[textStyles.button, styles.label]}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

const makeStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    base: {
      minHeight: 52,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    primary: {
      backgroundColor: colors.primary,
      shadowColor: colors.primaryDeep,
      shadowOpacity: 0.25,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },
    secondary: {
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.primary,
    },
    ghost: {
      backgroundColor: "transparent",
    },
    disabled: {
      opacity: 0.5,
    },
    pressed: {
      opacity: 0.9,
      transform: [{ scale: 0.985 }],
    },
    label: {
      textAlign: "center",
    },
  });
