import { Pressable, StyleSheet, View } from "react-native";
import { radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";

type Props = {
  label: string;
  color?: string;
  selected?: boolean;
  onPress?: () => void;
};

export function TagChip({ label, color, selected = false, onPress }: Props) {
  const colors = useColors();
  const tint = color ?? colors.primary;
  const body = (
    <View
      style={[
        styles.chip,
        { borderColor: tint },
        selected ? { backgroundColor: tint } : { backgroundColor: tint + "14" },
      ]}
    >
      <AppText variant="caption" color={selected ? colors.textOnPrimary : tint} style={styles.text}>
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
    paddingTop: spacing.xs + 2,
    paddingBottom: spacing.xs + 4,
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
