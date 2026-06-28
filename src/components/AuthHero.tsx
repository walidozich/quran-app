import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import Logo from "../../assets/logo.svg";
import { t } from "../i18n/ar";
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";

/** Emerald gradient banner with the logo + app name — the auth screens' hero. */
export function AuthHero({ subtitle }: { subtitle: string }) {
  return (
    <LinearGradient
      colors={[colors.primary, colors.primaryDeep]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <Logo width={76} height={76} />
      <AppText variant="title" color={colors.textOnPrimary} style={styles.center}>
        {t("app.name")}
      </AppText>
      <View style={styles.ruleRow}>
        <View style={styles.rule} />
        <View style={styles.diamond} />
        <View style={styles.rule} />
      </View>
      <AppText variant="subheading" color={colors.accentSoft} style={styles.center}>
        {subtitle}
      </AppText>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
  },
  center: {
    textAlign: "center",
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    width: 140,
    marginVertical: spacing.xs,
  },
  rule: {
    flex: 1,
    height: 1,
    backgroundColor: colors.accent,
    opacity: 0.55,
  },
  diamond: {
    width: 7,
    height: 7,
    backgroundColor: colors.accent,
    transform: [{ rotate: "45deg" }],
  },
});
