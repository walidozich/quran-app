import { StyleSheet, View } from "react-native";
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";

export type BadgeStatus = "pending" | "draft" | "reviewed";

const statusColor: Record<BadgeStatus, string> = {
  pending: colors.statusPending,
  draft: colors.statusDraft,
  reviewed: colors.statusReviewed,
};

type Props = {
  label: string;
  status?: BadgeStatus;
};

export function Badge({ label, status = "pending" }: Props) {
  const tint = statusColor[status];
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
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  text: {
    textAlign: "center",
  },
});
