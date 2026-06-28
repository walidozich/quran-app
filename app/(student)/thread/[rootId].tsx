import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AppText, Badge, Button, Screen, ScreenHeader } from "../../../src/components";
import { BadgeStatus } from "../../../src/components/Badge";
import { useStudentRecordings } from "../../../src/features/recordings/api";
import { RecordingReviewPanel } from "../../../src/features/recordings/RecordingReviewPanel";
import { buildThreads } from "../../../src/features/recordings/threads";
import { useSession } from "../../../src/features/session/auth";
import { t } from "../../../src/i18n/ar";
import { RecordingStatus } from "../../../src/types/database";
import { colors, spacing } from "../../../src/theme";

function badgeFor(status: RecordingStatus): { status: BadgeStatus; label: string } {
  if (status === "reviewed") return { status: "reviewed", label: t("status.reviewed") };
  return { status: "pending", label: t("status.pending") };
}

export default function StudentThread() {
  const router = useRouter();
  const { rootId } = useLocalSearchParams<{ rootId: string }>();
  const { currentProfile } = useSession();
  const { data: recordings, isLoading } = useStudentRecordings(currentProfile.id);

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

  const latest = thread.latest;

  return (
    <Screen scroll>
      <ScreenHeader title={thread.label} />

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
          </View>
        );
      })}

      {latest.status === "reviewed" ? (
        <Button
          label={t("thread.newAttempt")}
          onPress={() =>
            router.push(
              `/(student)/record?respondsTo=${latest.id}&label=${encodeURIComponent(thread.label)}&classId=${latest.class_id}`
            )
          }
        />
      ) : null}
    </Screen>
  );
}
