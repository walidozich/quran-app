import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AppText, Badge, Button, Screen, ScreenHeader } from "../../../src/components";
import { BadgeStatus } from "../../../src/components/Badge";
import { useTeacherRecordings } from "../../../src/features/recordings/api";
import { RecordingReviewPanel } from "../../../src/features/recordings/RecordingReviewPanel";
import { buildThreads } from "../../../src/features/recordings/threads";
import { useSession } from "../../../src/features/session/auth";
import { t } from "../../../src/i18n/ar";
import { RecordingStatus } from "../../../src/types/database";
import { colors, spacing } from "../../../src/theme";

function badgeFor(status: RecordingStatus): { status: BadgeStatus; label: string } {
  if (status === "reviewed") return { status: "reviewed", label: t("status.reviewed") };
  if (status === "in_review") return { status: "draft", label: t("status.draft") };
  return { status: "pending", label: t("status.pending") };
}

export default function TeacherThread() {
  const router = useRouter();
  const { rootId } = useLocalSearchParams<{ rootId: string }>();
  const { currentProfile } = useSession();
  const { data: recordings, isLoading } = useTeacherRecordings(currentProfile.id);

  if (isLoading || !recordings) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const thread = buildThreads(recordings).find((th) => th.rootId === rootId);
  if (!thread) {
    return (
      <Screen>
        <AppText color={colors.textMuted}>{t("review.noClassYet")}</AppText>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenHeader title={thread.label} />
      <AppText variant="caption" color={colors.textMuted}>
        {t("teacherHome.by")}: {thread.latest.student.full_name}
      </AppText>

      {thread.attempts.map((attempt, index) => {
        const badge = badgeFor(attempt.status);
        return (
          <View key={attempt.id} style={{ gap: spacing.sm, marginBottom: spacing.lg }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <AppText variant="heading">
                {t("thread.attempt")} {index + 1}
              </AppText>
              <Badge label={badge.label} status={badge.status} />
            </View>
            <RecordingReviewPanel recordingId={attempt.id} />
            <Button
              label={t("thread.openReview")}
              variant="secondary"
              onPress={() => router.push(`/(teacher)/review/${attempt.id}`)}
            />
          </View>
        );
      })}
    </Screen>
  );
}
