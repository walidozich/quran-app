import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useDrawer } from "../features/drawer/Drawer";
import { t } from "../i18n/ar";
import { ColorScheme, radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";

type Props = {
  title: string;
  subtitle?: string;
  /** Show a back arrow (RTL → points right). Defaults to true when navigation can go back. */
  back?: boolean;
  /** Show a menu (hamburger) that opens the drawer — use on root screens. */
  menu?: boolean;
  /** Hide the reload button on screens where it isn't useful. */
  reload?: boolean;
};

/**
 * App bar: a leading control (menu on roots, back elsewhere) + title + manual
 * reload, closed by a thin gold "illumination" rule — the app's signature.
 */
export function ScreenHeader({ title, subtitle, back, menu, reload = true }: Props) {
  const router = useRouter();
  const drawer = useDrawer();
  const qc = useQueryClient();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fetching = useIsFetching() > 0;
  const showBack = !menu && (back ?? router.canGoBack());

  const goBack = () => {
    if (router.canGoBack()) router.back();
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {menu ? (
          <Pressable
            onPress={drawer.open}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("drawer.menu")}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            <MenuIcon color={colors.primary} />
          </Pressable>
        ) : showBack ? (
          <Pressable
            onPress={goBack}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={t("common.back")}
            style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
          >
            {/* RTL: the previous screen is to the right, so "back" points right. */}
            <BackIcon color={colors.primary} />
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
              <ReloadIcon color={colors.primary} />
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

const makeStyles = (colors: ColorScheme) =>
  StyleSheet.create({
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

function MenuIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 7h14M5 12h14M5 17h14" stroke={color} strokeWidth={2.25} strokeLinecap="round" />
    </Svg>
  );
}

function BackIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M5 12h14M13 5l7 7-7 7" stroke={color} strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ReloadIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 6v5h-5" stroke={color} strokeWidth={2.1} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M19.2 14.1a7.2 7.2 0 1 1-1.7-7.4L20 11"
        stroke={color}
        strokeWidth={2.1}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
