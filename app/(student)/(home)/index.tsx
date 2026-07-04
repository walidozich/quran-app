import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Button, Card, EmptyState, ErrorState, Screen, ScreenHeader } from "../../../src/components";
import { useStudentClasses } from "../../../src/features/classes/api";
import { useSession } from "../../../src/features/session/auth";
import { t } from "../../../src/i18n/ar";
import { useColors } from "../../../src/theme";

export default function StudentHome() {
  const router = useRouter();
  const colors = useColors();
  const { currentProfile } = useSession();
  const { data: classes, isLoading, isError, refetch } = useStudentClasses(currentProfile.id);

  const hasClasses = (classes?.length ?? 0) > 0;

  return (
    <Screen scroll>
      <ScreenHeader title={t("studentHome.title")} subtitle={currentProfile.full_name} back={false} />

      <Button
        label={hasClasses ? t("studentHome.joinAnother") : t("studentHome.joinClass")}
        variant={hasClasses ? "secondary" : "primary"}
        onPress={() => router.push("/(student)/join-class")}
      />

      <AppText variant="subheading">{t("studentHome.myClasses")}</AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : hasClasses ? (
        classes!.map((cls) => (
          <Pressable key={cls.id} onPress={() => router.push(`/(student)/class/${cls.id}`)}>
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
                {t("studentHome.teacher")}: {cls.teacher?.full_name ?? "—"}
              </AppText>
            </Card>
          </Pressable>
        ))
      ) : (
        <EmptyState message={t("studentHome.noClass")} />
      )}
    </Screen>
  );
}
