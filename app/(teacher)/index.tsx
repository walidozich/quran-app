import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Button, Card, Screen, ScreenHeader } from "../../src/components";
import { useTeacherClasses } from "../../src/features/classes/api";
import { useAuth, useSession } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { colors, spacing } from "../../src/theme";

export default function TeacherHome() {
  const router = useRouter();
  const { currentProfile } = useSession();
  const { signOut } = useAuth();
  const { data: classes, isLoading } = useTeacherClasses(currentProfile.id);

  const hasClasses = (classes?.length ?? 0) > 0;

  return (
    <Screen scroll>
      <ScreenHeader title={t("teacherHome.title")} subtitle={currentProfile.full_name} back={false} />

      <Button label={t("teacherHome.manageClass")} onPress={() => router.push("/(teacher)/manage-class")} />
      <Button
        label={t("dashboard.open")}
        variant="secondary"
        onPress={() => router.push("/(teacher)/dashboard")}
      />

      <AppText variant="subheading">{t("classes.myClasses")}</AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : hasClasses ? (
        classes!.map((cls) => (
          <Pressable key={cls.id} onPress={() => router.push(`/(teacher)/class/${cls.id}`)}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <AppText variant="heading">{cls.name}</AppText>
                <AppText variant="heading" color={colors.primary}>
                  ‹
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                {t("classes.joinCode")}: {cls.join_code}
              </AppText>
            </Card>
          </Pressable>
        ))
      ) : (
        <Card>
          <AppText color={colors.textMuted}>{t("classes.noClasses")}</AppText>
        </Card>
      )}

      <Button
        label={t("auth.signOut")}
        variant="ghost"
        onPress={signOut}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}
