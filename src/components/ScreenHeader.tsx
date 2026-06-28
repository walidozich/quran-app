import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { t } from "../i18n/ar";
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";

type Props = {
  title: string;
  subtitle?: string;
  /** Show a back arrow (RTL → points right). Defaults to true when navigation can go back. */
  back?: boolean;
  /** Hide the reload button on screens where it isn't useful. */
  reload?: boolean;
};

/**
 * App bar: optional back arrow + title + manual reload, closed by a thin gold
 * "illumination" rule (a nod to mushaf section borders) — the app's signature.
 */
export function ScreenHeader({ title, subtitle, back, reload = true }: Props) {
  const router = useRouter();
  const qc = useQueryClient();
  const fetching = useIsFetching() > 0;
  const showBack = back ?? router.canGoBack();

  const goBack = () => {
    // Guard: only dispatch GO_BACK when there's actually a screen to return to.
    if (router.canGoBack()) router.back();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {showBack ? (
          <Pressable
            onPress={goBack}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            {/* RTL: the previous screen is to the right, so "back" points right. */}
            <AppText variant="heading" color={colors.primary}>
              →
            </AppText>
          </Pressable>
        ) : null}

        <View style={styles.titleCol}>
          <AppText variant="title">{title}</AppText>
          {subtitle ? (
            <AppText variant="subheading" color={colors.textMuted}>
              {subtitle}
            </AppText>
          ) : null}
        </View>

        {reload ? (
          <Pressable
            onPress={() => qc.invalidateQueries()}
            disabled={fetching}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("common.reload")}
            style={({ pressed }) => [styles.reloadBtn, pressed && styles.pressed]}
          >
            {fetching ? (
              <ActivityIndicator color={colors.primary} size="small" />
            ) : (
              <AppText variant="button" color={colors.primary}>
                ⟳
              </AppText>
            )}
          </Pressable>
        ) : null}
      </View>

      {/* Signature: thin gold rule with a centered diamond (mushaf illumination). */}
      <View style={styles.ruleRow}>
        <View style={styles.rule} />
        <View style={styles.diamond} />
        <View style={styles.rule} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
  },
  titleCol: {
    flex: 1,
    gap: spacing.xs,
    paddingTop: spacing.xs,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
  },
  reloadBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.6,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.accentMuted,
  },
  diamond: {
    width: 7,
    height: 7,
    backgroundColor: colors.accent,
    transform: [{ rotate: "45deg" }],
  },
});
