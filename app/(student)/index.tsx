import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Button, Card, Screen, ScreenHeader } from "../../src/components";
import { useStudentClasses } from "../../src/features/classes/api";
import { useAuth, useSession } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { colors, spacing } from "../../src/theme";

export default function StudentHome() {
  const router = useRouter();
  const { currentProfile } = useSession();
  const { signOut } = useAuth();
  const { data: classes, isLoading } = useStudentClasses(currentProfile.id);

  const hasClasses = (classes?.length ?? 0) > 0;

  return (
    <Screen scroll>
      <ScreenHeader title={t("studentHome.title")} subtitle={currentProfile.full_name} back={false} />

      <AppText variant="subheading">{t("studentHome.myClasses")}</AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : hasClasses ? (
        classes!.map((cls) => (
          <Pressable key={cls.id} onPress={() => router.push(`/(student)/class/${cls.id}`)}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <AppText variant="heading">{cls.name}</AppText>
                <AppText variant="heading" color={colors.primary}>
                  ‹
                </AppText>
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                {t("studentHome.teacher")}: {cls.teacher?.full_name ?? "—"}
              </AppText>
            </Card>
          </Pressable>
        ))
      ) : (
        <Card>
          <AppText color={colors.textMuted}>{t("studentHome.noClass")}</AppText>
        </Card>
      )}

      <Button
        label={hasClasses ? t("studentHome.joinAnother") : t("studentHome.joinClass")}
        variant={hasClasses ? "secondary" : "primary"}
        onPress={() => router.push("/(student)/join-class")}
      />
      <Button
        label={t("studentHome.studyByTag")}
        variant="secondary"
        onPress={() => router.push("/(student)/study")}
      />
      <Button
        label={t("dashboard.open")}
        variant="secondary"
        onPress={() => router.push("/(student)/dashboard")}
      />

      <Button
        label={t("auth.signOut")}
        variant="ghost"
        onPress={signOut}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}
