import { Pressable, StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";

type Props = {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
};

export function TagChip({ label, color = colors.primary, selected = false, onPress }: Props) {
  const body = (
    <View
      style={[
        styles.chip,
        { borderColor: color },
        selected ? { backgroundColor: color } : { backgroundColor: color + "14" },
      ]}
    >
      <AppText
        variant="caption"
        color={selected ? colors.textOnPrimary : color}
        style={styles.text}
      >
        {label}
      </AppText>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      {body}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: {
    textAlign: "center",
  },
  pressed: {
    opacity: 0.7,
  },
});
