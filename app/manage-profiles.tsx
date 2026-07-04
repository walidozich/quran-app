import { Redirect, useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { AppText, Card, Screen, ScreenHeader } from "../src/components";
import { avatarColorOf, avatarInitial } from "../src/features/profiles/avatar";
import { useAuth } from "../src/features/session/auth";
import { t } from "../src/i18n/ar";
import { radius, spacing, useColors } from "../src/theme";

const MAX_PROFILES = 6;

/** Manage the account's people: edit, delete, add — reached from حسابي. */
export default function ManageProfiles() {
  const router = useRouter();
  const colors = useColors();
  const { loading, session, profiles } = useAuth();

  if (!loading && !session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Screen scroll>
      <ScreenHeader title={t("manageProfiles.title")} bell={false} reload={false} />

      {profiles.map((p) => (
        <Pressable key={p.id} onPress={() => router.push(`/profile-edit?id=${p.id}` as never)}>
          <Card>
            <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.md }}>
              <View
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: radius.md,
                  backgroundColor: avatarColorOf(p.avatar_color),
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText variant="heading" color="#FBF1D9">
                  {avatarInitial(p.full_name)}
                </AppText>
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="subheading" style={{ flexShrink: 1 }}>
                  {p.full_name}
                </AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {p.is_teacher ? t("roles.teacher") : t("roles.student")}
                </AppText>
              </View>
              <AppText variant="caption" color={colors.primary}>
                {t("manageProfiles.edit")} ‹
              </AppText>
            </View>
          </Card>
        </Pressable>
      ))}

      {profiles.length < MAX_PROFILES ? (
        <Pressable onPress={() => router.push("/profile-edit" as never)}>
          <Card style={{ borderStyle: "dashed" }}>
            <AppText variant="subheading" color={colors.primary} style={{ textAlign: "center" }}>
              + {t("picker.add")}
            </AppText>
          </Card>
        </Pressable>
      ) : (
        <AppText variant="caption" color={colors.textMuted} style={{ textAlign: "center" }}>
          {t("picker.limitReached")}
        </AppText>
      )}
    </Screen>
  );
}
