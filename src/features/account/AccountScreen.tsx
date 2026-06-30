import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { AppText, Card, Screen, ScreenHeader } from "../../components";
import { t } from "../../i18n/ar";
import { ColorScheme, radius, spacing, useColors, useThemeMode } from "../../theme";
import { useAuth } from "../session/auth";

/** The "account" tab: profile shortcut, settings (theme), and sign-out. */
export function AccountScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { mode, toggle } = useThemeMode();
  const { profile, signOut } = useAuth();

  return (
    <Screen scroll>
      <ScreenHeader title={t("drawer.account")} back={false} reload={false} />

      <Pressable onPress={() => router.push("/profile")}>
        <Card style={{ backgroundColor: colors.primarySoft }}>
          <AppText variant="heading">{profile?.full_name ?? "—"}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {profile ? t(`roles.${profile.role}`) : ""}
          </AppText>
          <AppText variant="caption" color={colors.primary}>
            {t("drawer.editProfile")} ‹
          </AppText>
        </Card>
      </Pressable>

      <AppText variant="caption" color={colors.textMuted} style={{ marginTop: spacing.sm }}>
        {t("drawer.settings")}
      </AppText>
      <Card>
        <View style={styles.row}>
          <AppText variant="subheading">{t("drawer.darkMode")}</AppText>
          <Switch
            value={mode === "dark"}
            onValueChange={toggle}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.surface}
          />
        </View>
      </Card>

      <Pressable onPress={signOut} style={[styles.logout, { borderColor: colors.danger }]}>
        <AppText variant="button" color={colors.danger}>
          {t("auth.signOut")}
        </AppText>
      </Pressable>
    </Screen>
  );
}

const makeStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    logout: {
      marginTop: spacing.md,
      borderWidth: 1.5,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: "center",
    },
  });
