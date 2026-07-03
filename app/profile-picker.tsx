import { Redirect, useRouter } from "expo-router";
import { ReactNode, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, View } from "react-native";
import { AppText, Screen } from "../src/components";
import { avatarColorOf, avatarInitial } from "../src/features/profiles/avatar";
import { useAuth } from "../src/features/session/auth";
import { t } from "../src/i18n/ar";
import { useReducedMotion } from "../src/lib/useReducedMotion";
import { ColorScheme, radius, spacing, useColors } from "../src/theme";
import { Profile } from "../src/types/database";

/** Tiles fade-and-rise one after another (Netflix-style entrance). */
function StaggerIn({ index, children }: { index: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduced) {
      v.setValue(1);
      return;
    }
    const anim = Animated.sequence([
      Animated.delay(120 + index * 80),
      Animated.timing(v, { toValue: 1, duration: 340, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reduced, index, v]);
  return (
    <Animated.View
      style={{ opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [18, 0] }) }] }}
    >
      {children}
    </Animated.View>
  );
}

const MAX_PROFILES = 6;

/**
 * "من يقرأ الآن؟" — Netflix-style person picker, shown on every cold start
 * (family phones must always land recordings on the right person).
 * Tap = enter as that person; long-press = edit their profile.
 */
export default function ProfilePicker() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { loading, session, profiles, lastProfileId, activateProfile } = useAuth();

  if (!loading && !session) return <Redirect href="/(auth)/sign-in" />;
  if (!loading && session && profiles.length === 0) return <Redirect href="/(auth)/profile-setup" />;

  const enter = async (p: Profile) => {
    await activateProfile(p.id);
    router.replace("/");
  };

  return (
    <Screen scroll>
      <View style={styles.header}>
        <AppText variant="title" style={{ textAlign: "center" }}>
          {t("picker.title")}
        </AppText>
        <AppText variant="caption" color={colors.textMuted} style={{ textAlign: "center" }}>
          {t("picker.manageHint")}
        </AppText>
      </View>

      <View style={styles.grid}>
        {profiles.map((p, i) => (
          <StaggerIn key={p.id} index={i}>
            <Pressable
              onPress={() => enter(p)}
              onLongPress={() => router.push(`/profile-edit?id=${p.id}` as never)}
              style={styles.tileWrap}
            >
              <View
                style={[
                  styles.tile,
                  { backgroundColor: avatarColorOf(p.avatar_color) },
                  p.id === lastProfileId ? { borderColor: colors.accent, borderWidth: 3 } : null,
                ]}
              >
                <AppText variant="title" color="#FBF1D9" style={styles.initial}>
                  {avatarInitial(p.full_name)}
                </AppText>
              </View>
              <AppText variant="subheading" style={styles.name} numberOfLines={1}>
                {p.full_name}
              </AppText>
              {p.is_teacher ? (
                <AppText variant="caption" color={colors.textMuted}>
                  {t("roles.teacher")}
                </AppText>
              ) : null}
            </Pressable>
          </StaggerIn>
        ))}

        {profiles.length < MAX_PROFILES ? (
          <StaggerIn index={profiles.length}>
            <Pressable onPress={() => router.push("/profile-edit" as never)} style={styles.tileWrap}>
              <View style={[styles.tile, styles.addTile, { borderColor: colors.border }]}>
                <AppText variant="title" color={colors.textMuted}>
                  +
                </AppText>
              </View>
              <AppText variant="subheading" color={colors.textMuted} style={styles.name}>
                {t("picker.add")}
              </AppText>
            </Pressable>
          </StaggerIn>
        ) : (
          <AppText variant="caption" color={colors.textMuted} style={{ textAlign: "center", width: "100%" }}>
            {t("picker.limitReached")}
          </AppText>
        )}
      </View>
    </Screen>
  );
}

const makeStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    header: {
      marginTop: spacing.xl,
      marginBottom: spacing.lg,
      gap: spacing.xs,
    },
    grid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: spacing.lg,
    },
    tileWrap: {
      alignItems: "center",
      width: 132,
      gap: spacing.xs,
    },
    tile: {
      width: 108,
      height: 108,
      borderRadius: radius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    addTile: {
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderStyle: "dashed",
    },
    initial: {
      fontSize: 44,
      lineHeight: 64,
    },
    name: {
      textAlign: "center",
      maxWidth: 128,
    },
  });
