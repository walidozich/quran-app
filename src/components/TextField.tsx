import { StyleSheet, TextInput, View } from "react-native";
import { colors, fonts, radius, spacing, textStyles } from "../theme";
import { AppText } from "./AppText";

type Props = {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoCapitalize?: "none" | "sentences";
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
};

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  autoCapitalize = "sentences",
  secureTextEntry,
  keyboardType = "default",
}: Props) {
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
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingVertical: spacing.md,
    textAlign: "right",
    writingDirection: "rtl",
  },
});
