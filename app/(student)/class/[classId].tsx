import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, EmptyState, ErrorState, Screen, ScreenHeader } from "../../../src/components";
import { BadgeStatus } from "../../../src/components/Badge";
import { useStudentClasses } from "../../../src/features/classes/api";
import { useStudentRecordings } from "../../../src/features/recordings/api";
import { buildThreads } from "../../../src/features/recordings/threads";
import { useSession } from "../../../src/features/session/auth";
import { t } from "../../../src/i18n/ar";
import { RecordingStatus } from "../../../src/types/database";
import { useColors } from "../../../src/theme";

function studentBadge(status: RecordingStatus): { status: BadgeStatus; label: string } {
  if (status === "reviewed") return { status: "reviewed", label: t("status.reviewed") };
  return { status: "pending", label: t("status.pending") };
}

export default function StudentClass() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const colors = useColors();
  const { currentProfile } = useSession();
  const { data: classes } = useStudentClasses(currentProfile.id);
  const { data: recordings, isLoading, isError, refetch } = useStudentRecordings(currentProfile.id);

  const cls = classes?.find((c) => c.id === classId) ?? null;
  const threads = buildThreads((recordings ?? []).filter((r) => r.class_id === classId));

  return (
    <Screen scroll>
      <ScreenHeader
        title={cls?.name ?? t("studentHome.yourClass")}
        subtitle={cls?.teacher ? `${t("studentHome.teacher")}: ${cls.teacher.full_name}` : undefined}
      />

      <Button
        label={t("studentHome.newRecording")}
        onPress={() => router.push(`/(student)/record?classId=${classId}`)}
      />

      <AppText variant="subheading">{t("studentHome.myRecordings")}</AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : threads.length > 0 ? (
        threads.map((thread) => {
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
        <EmptyState message={t("studentClass.noRecordings")} />
      )}
    </Screen>
  );
}
