import { StyleSheet, View } from "react-native";
import { ColorScheme, radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";

export type BadgeStatus = "pending" | "draft" | "reviewed";

function statusColor(colors: ColorScheme, status: BadgeStatus): string {
  if (status === "reviewed") return colors.statusReviewed;
  if (status === "draft") return colors.statusDraft;
  return colors.statusPending;
}

type Props = {
  label: string;
  status?: BadgeStatus;
};

export function Badge({ label, status = "pending" }: Props) {
  const colors = useColors();
  const tint = statusColor(colors, status);
  return (
    <View style={[styles.badge, { backgroundColor: tint + "1A", borderColor: tint }]}>
      <AppText variant="caption" color={tint} style={styles.text}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.sm,
    paddingTop: 3,
    paddingBottom: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: {
    textAlign: "center",
  },
});
