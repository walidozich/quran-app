import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { t } from "../i18n/ar";
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";

type Props = {
  title: string;
  subtitle?: string;
};

/**
 * Screen title row with a manual reload button. Tapping it refetches every
 * active query (so a teacher/student can pull the other side's latest changes
 * on demand). Shows a spinner while any query is fetching.
 */
export function ScreenHeader({ title, subtitle }: Props) {
  const qc = useQueryClient();
  const fetching = useIsFetching() > 0;

  return (
    <View style={styles.row}>
      <View style={styles.titleCol}>
        <AppText variant="title">{title}</AppText>
        {subtitle ? (
          <AppText variant="subheading" color={colors.textMuted}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <Pressable
        onPress={() => qc.invalidateQueries()}
        disabled={fetching}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={t("common.reload")}
        style={styles.button}
      >
        {fetching ? (
          <ActivityIndicator color={colors.primary} size="small" />
        ) : (
          <AppText variant="button" color={colors.primary}>
            ⟳
          </AppText>
        )}
        <AppText variant="caption" color={colors.primary}>
          {t("common.reload")}
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  titleCol: {
    flex: 1,
    gap: spacing.xs,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    minHeight: 40,
  },
});
