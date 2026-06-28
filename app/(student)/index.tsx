import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, Screen, ScreenHeader } from "../../src/components";
import { BadgeStatus } from "../../src/components/Badge";
import { useStudentClasses } from "../../src/features/classes/api";
import { useStudentRecordings } from "../../src/features/recordings/api";
import { buildThreads } from "../../src/features/recordings/threads";
import { useAuth, useSession } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { RecordingStatus } from "../../src/types/database";
import { colors, spacing } from "../../src/theme";

// From the student's view, an in-progress (draft) review still reads as "pending".
function studentBadge(status: RecordingStatus): { status: BadgeStatus; label: string } {
  if (status === "reviewed") return { status: "reviewed", label: t("status.reviewed") };
  return { status: "pending", label: t("status.pending") };
}

export default function StudentHome() {
  const router = useRouter();
  const { currentProfile } = useSession();
  const { signOut } = useAuth();
  const { data: classes, isLoading: classLoading } = useStudentClasses(currentProfile.id);
  const { data: recordings, isLoading: recLoading } = useStudentRecordings(currentProfile.id);

  const hasClasses = (classes?.length ?? 0) > 0;

  return (
    <Screen scroll>
      <ScreenHeader title={t("studentHome.title")} subtitle={currentProfile.full_name} back={false} />

      <AppText variant="subheading">{t("studentHome.myClasses")}</AppText>
      {classLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : hasClasses ? (
        classes!.map((cls) => (
          <Card key={cls.id}>
            <AppText variant="heading">{cls.name}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {t("studentHome.teacher")}: {cls.teacher?.full_name ?? "—"}
            </AppText>
            <Button
              label={t("studentHome.recordHere")}
              onPress={() => router.push(`/(student)/record?classId=${cls.id}`)}
              style={{ marginTop: spacing.sm }}
            />
          </Card>
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

      <AppText variant="subheading">{t("studentHome.myRecordings")}</AppText>
      {recLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : recordings && recordings.length > 0 ? (
        buildThreads(recordings).map((thread) => {
          const badge = studentBadge(thread.latest.status);
          return (
            <Pressable key={thread.rootId} onPress={() => router.push(`/(student)/thread/${thread.rootId}`)}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <AppText variant="heading">{thread.label}</AppText>
                  <Badge label={badge.label} status={badge.status} />
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  {thread.attempts.length} {t("thread.attemptsCount")}
                </AppText>
              </Card>
            </Pressable>
          );
        })
      ) : (
        <AppText color={colors.textMuted}>{t("studentHome.noRecordings")}</AppText>
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
