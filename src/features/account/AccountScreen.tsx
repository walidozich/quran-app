import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { AppText, Card, Screen, ScreenHeader } from "../../components";
import { t } from "../../i18n/ar";
import { ColorScheme, radius, spacing, useColors, useThemeMode } from "../../theme";
import { useAuth } from "../session/auth";
import { profileRole } from "../../types/database";

/** The "account" tab: profile shortcut, settings (theme), and sign-out. */
export function AccountScreen() {
  const colors = useColors();
  const styles = makeStyles(colors);
  const router = useRouter();
  const { mode, toggle } = useThemeMode();
  const { profile, profiles, signOut, deactivateProfile, mode: uiMode, setMode } = useAuth();

  const switchProfile = () => {
    // Navigate FIRST, clear state after — clearing while the authenticated
    // screens are still mounted risks a teardown-frame crash in release.
    router.replace("/profile-picker");
    setTimeout(deactivateProfile, 0);
  };

  const switchMode = () => {
    setMode(uiMode === "teacher" ? "student" : "teacher");
    router.replace("/");
  };

  return (
    <Screen scroll>
      <ScreenHeader title={t("drawer.account")} back={false} reload={false} />

      <Pressable onPress={() => router.push("/profile")}>
        <Card style={{ backgroundColor: colors.primarySoft }}>
          <AppText variant="heading">{profile?.full_name ?? "—"}</AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {profile ? t(`roles.${profileRole(profile)}`) : ""}
          </AppText>
          <AppText variant="caption" color={colors.primary}>
            {t("drawer.editProfile")} ‹
          </AppText>
        </Card>
      </Pressable>

      {profile?.is_teacher ? (
        <Pressable onPress={switchMode}>
          <Card style={{ backgroundColor: colors.accentSoft }}>
            <AppText variant="subheading" color={colors.primary}>
              ⇄ {uiMode === "teacher" ? t("mode.toLearning") : t("mode.toTeaching")}
            </AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {uiMode === "teacher" ? t("mode.teachingHint") : t("mode.learningHint")}
            </AppText>
          </Card>
        </Pressable>
      ) : null}

      {profiles.length > 0 ? (
        <Pressable onPress={switchProfile}>
          <Card>
            <AppText variant="subheading" color={colors.primary}>
              {t("picker.switch")} ‹
            </AppText>
          </Card>
        </Pressable>
      ) : null}

      <Pressable onPress={() => router.push("/manage-profiles" as never)}>
        <Card>
          <AppText variant="subheading" color={colors.primary}>
            {t("manageProfiles.entry")} ‹
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {t("manageProfiles.entryHint")}
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

      <Pressable
        onPress={() => {
          // Navigate FIRST so no authenticated screen is mounted when the
          // session state clears (clearing first crashed release builds).
          router.replace("/(auth)/sign-in");
          setTimeout(signOut, 0);
        }}
        style={[styles.logout, { borderColor: colors.danger }]}
      >
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
