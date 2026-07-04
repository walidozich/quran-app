import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Card, EmptyState, ErrorState, Screen, ScreenHeader } from "../../../src/components";
import { useTeacherClasses } from "../../../src/features/classes/api";
import { useSession } from "../../../src/features/session/auth";
import { t } from "../../../src/i18n/ar";
import { useColors } from "../../../src/theme";

export default function TeacherHome() {
  const router = useRouter();
  const colors = useColors();
  const { currentProfile } = useSession();
  const { data: classes, isLoading, isError, refetch } = useTeacherClasses(currentProfile.id);

  const hasClasses = (classes?.length ?? 0) > 0;

  return (
    <Screen scroll>
      <ScreenHeader title={t("teacherHome.title")} subtitle={currentProfile.full_name} back={false} />

      <AppText variant="subheading">{t("classes.myClasses")}</AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : hasClasses ? (
        classes!.map((cls) => (
          <Pressable key={cls.id} onPress={() => router.push(`/(teacher)/class/${cls.id}`)}>
            <Card>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                {/* flexShrink so long names wrap instead of clipping off-screen */}
                <AppText variant="heading" style={{ flexShrink: 1 }}>
                  {cls.name}
                </AppText>
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
        <EmptyState message={t("classes.noClasses")} />
      )}
    </Screen>
  );
}
