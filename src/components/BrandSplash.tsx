import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Logo from "../../assets/logo.svg";
import { t } from "../i18n/ar";
import { colors, spacing } from "../theme";
import { AppText } from "./AppText";

const MIN_DURATION = 1200;

type Props = {
  /** Once true (and the minimum brand moment has elapsed), the splash fades out. */
  ready: boolean;
  onFinish: () => void;
};

/** Branded launch screen: emerald gradient, the logo, app name + tagline. */
export function BrandSplash({ ready, onFinish }: Props) {
  const enter = useRef(new Animated.Value(0)).current; // logo fade + rise
  const fade = useRef(new Animated.Value(1)).current; // whole-screen fade-out
  const mountedAt = useRef(Date.now()).current;

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter]);

  useEffect(() => {
    if (!ready) return;
    const wait = Math.max(0, MIN_DURATION - (Date.now() - mountedAt));
    const timer = setTimeout(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 450,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(() => onFinish());
    }, wait);
    return () => clearTimeout(timer);
  }, [ready, fade, mountedAt, onFinish]);

  const translateY = enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} pointerEvents="none">
      <LinearGradient
        colors={[colors.primary, colors.primaryDeep]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.fill}
      >
        <Animated.View style={{ opacity: enter, transform: [{ translateY }], alignItems: "center" }}>
          <Logo width={108} height={108} />
          <AppText variant="title" color={colors.textOnPrimary} style={styles.name}>
            {t("app.name")}
          </AppText>
          <View style={styles.ruleRow}>
            <View style={styles.rule} />
            <View style={styles.diamond} />
            <View style={styles.rule} />
          </View>
          <AppText variant="subheading" color={colors.accentSoft} style={styles.tagline}>
            {t("home.tagline")}
          </AppText>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  name: {
    marginTop: spacing.lg,
    textAlign: "center",
  },
  tagline: {
    textAlign: "center",
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.md,
    width: 180,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.6,
  },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
    transform: [{ rotate: "45deg" }],
  },
});
