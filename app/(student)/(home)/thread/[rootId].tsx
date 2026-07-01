import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AppText, Badge, Button, Screen, ScreenHeader } from "../../../../src/components";
import { BadgeStatus } from "../../../../src/components/Badge";
import { useStudentRecordings } from "../../../../src/features/recordings/api";
import { RecordingReviewPanel } from "../../../../src/features/recordings/RecordingReviewPanel";
import { buildThreads } from "../../../../src/features/recordings/threads";
import { useSession } from "../../../../src/features/session/auth";
import { t } from "../../../../src/i18n/ar";
import type { Recording, RecordingStatus } from "../../../../src/types/database";
import { spacing, useColors } from "../../../../src/theme";

function badgeFor(status: RecordingStatus): { status: BadgeStatus; label: string } {
  if (status === "reviewed") return { status: "reviewed", label: t("status.reviewed") };
  return { status: "pending", label: t("status.pending") };
}

export default function StudentThread() {
  const router = useRouter();
  const colors = useColors();
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
          onPress={() => router.push(recordAttemptUrl(latest, thread.label))}
        />
      ) : null}
    </Screen>
  );
}

function recordAttemptUrl(recording: Recording, label: string): string {
  const params = new URLSearchParams({
    respondsTo: recording.id,
    label,
    classId: recording.class_id,
  });
  if (recording.wird_id) params.set("wird_id", recording.wird_id);
  appendReferenceParams(params, recording);
  return `/(student)/record?${params.toString()}`;
}

function appendReferenceParams(params: URLSearchParams, recording: Recording) {
  if (!recording.ref_type) return;
  params.set("ref_type", recording.ref_type);
  for (const key of ["surah_start", "ayah_start", "surah_end", "ayah_end", "page_start", "page_end"] as const) {
    const value = recording[key];
    if (value != null) params.set(key, String(value));
  }
}
