import { useMemo } from "react";
import { StyleProp, StyleSheet, TextInput, TextStyle, View } from "react-native";
import { ColorScheme, fonts, radius, spacing, textStyles, useColors } from "../theme";
import { AppText } from "./AppText";

type Props = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences";
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "number-pad";
  multiline?: boolean;
  maxLength?: number;
  inputStyle?: StyleProp<TextStyle>;
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "sentences",
  secureTextEntry,
  keyboardType = "default",
  multiline = false,
  maxLength,
  inputStyle,
}: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.wrap}>
      {label ? (
        <AppText variant="subheading" style={styles.label}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize={autoCapitalize}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        maxLength={maxLength}
        style={[styles.input, multiline ? styles.multiline : null, inputStyle]}
      />
    </View>
  );
}

const makeStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    wrap: {
      gap: spacing.xs,
    },
    label: {
      marginBottom: 2,
    },
    input: {
      ...textStyles.body,
      fontFamily: fonts.regular,
      color: colors.text,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.md + 4,
      minHeight: 62,
      textAlign: "right",
      writingDirection: "rtl",
      includeFontPadding: true,
    },
    multiline: {
      minHeight: 90,
      textAlignVertical: "top",
    },
  });
