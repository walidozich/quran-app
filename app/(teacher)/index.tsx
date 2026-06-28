import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, Screen, ScreenHeader } from "../../src/components";
import { BadgeStatus } from "../../src/components/Badge";
import { useTeacherRecordings } from "../../src/features/recordings/api";
import { buildThreads } from "../../src/features/recordings/threads";
import { useAuth, useSession } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { RecordingStatus } from "../../src/types/database";
import { colors, spacing } from "../../src/theme";

function teacherBadge(status: RecordingStatus): { status: BadgeStatus; label: string } {
  if (status === "reviewed") return { status: "reviewed", label: t("status.reviewed") };
  if (status === "in_review") return { status: "draft", label: t("status.draft") };
  return { status: "pending", label: t("status.pending") };
}

export default function TeacherHome() {
  const router = useRouter();
  const { currentProfile } = useSession();
  const { signOut } = useAuth();
  const { data: recordings, isLoading } = useTeacherRecordings(currentProfile.id);

  return (
    <Screen scroll>
      <ScreenHeader title={t("teacherHome.title")} subtitle={currentProfile.full_name} />

      <Button label={t("teacherHome.manageClass")} onPress={() => router.push("/(teacher)/manage-class")} />

      <AppText variant="subheading">{t("teacherHome.queue")}</AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : recordings && recordings.length > 0 ? (
        buildThreads(recordings).map((thread) => {
          const badge = teacherBadge(thread.latest.status);
          return (
            <Pressable key={thread.rootId} onPress={() => router.push(`/(teacher)/thread/${thread.rootId}`)}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <AppText variant="heading">{thread.label}</AppText>
                  <Badge label={badge.label} status={badge.status} />
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  {t("teacherHome.by")}: {thread.latest.student.full_name} · {thread.attempts.length}{" "}
                  {t("thread.attemptsCount")}
                </AppText>
              </Card>
            </Pressable>
          );
        })
      ) : (
        <AppText color={colors.textMuted}>{t("teacherHome.noQueue")}</AppText>
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
