import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useUnreadCount } from "../features/notifications/api";
import { useDrawer } from "../features/drawer/Drawer";
import { useAuth } from "../features/session/auth";
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
  /** Hide the notification bell (e.g. on the notifications screen itself). */
  bell?: boolean;
};

/**
 * App bar: a leading control (menu on roots, back elsewhere) + title + manual
 * reload, closed by a thin gold "illumination" rule — the app's signature.
 */
export function ScreenHeader({ title, subtitle, back, menu, reload = true, bell = true }: Props) {
  const router = useRouter();
  const drawer = useDrawer();
  const qc = useQueryClient();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const fetching = useIsFetching() > 0;
  const showBack = !menu && (back ?? router.canGoBack());
  const { profile } = useAuth();
  const { data: unread = 0 } = useUnreadCount(profile?.id);
  const showBell = bell && Boolean(profile);

  const goBack = () => {
    if (router.canGoBack()) router.back();
  };

  return (
    <View style={styles.wrap}>
      {/* Physical layout (forced LTR): actions on the left, title flush right,
          back/menu on the far right — independent of the global RTL flag. */}
      <View style={styles.row}>
        {showBell ? (
          <Pressable
            onPress={() => router.push("/notifications")}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={t("notifCenter.title")}
            style={({ pressed }) => [styles.reloadBtn, pressed && styles.pressed]}
          >
            <BellIcon color={colors.primary} />
            {unread > 0 ? (
              <View style={styles.badge}>
                <AppText color={colors.textOnPrimary} style={styles.badgeText}>
                  {unread > 9 ? "9+" : String(unread)}
                </AppText>
              </View>
            ) : null}
          </Pressable>
        ) : null}

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

        <View style={styles.titleCol}>
          <AppText variant="title" style={styles.titleText}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="subheading" color={colors.textMuted} style={styles.titleText}>
              {subtitle}
            </AppText>
          ) : null}
        </View>

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
            <BackIcon color={colors.primary} />
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
      alignItems: "center",
      gap: spacing.sm,
      // Force LTR + physical order so the title is always flush right and the
      // action buttons on the left, regardless of the native RTL flag.
      direction: "ltr",
    },
    titleCol: {
      flex: 1,
      gap: spacing.xs,
    },
    titleText: {
      textAlign: "right",
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
    badge: {
      position: "absolute",
      top: -3,
      right: -3,
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 4,
      backgroundColor: colors.danger,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: colors.background,
    },
    badgeText: {
      fontSize: 10,
      lineHeight: 14,
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

function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M13.7 21a2 2 0 0 1-3.4 0" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
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
