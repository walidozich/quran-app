import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { AppText, Button, Screen } from "../../../../src/components";
import { useRecording } from "../../../../src/features/recordings/api";
import { RecordingReviewPanel } from "../../../../src/features/recordings/RecordingReviewPanel";
import { t } from "../../../../src/i18n/ar";
import { spacing, useColors } from "../../../../src/theme";
import type { Recording } from "../../../../src/types/database";

export default function StudentRecordingView() {
  const router = useRouter();
  const colors = useColors();
  const { id, at } = useLocalSearchParams<{ id: string; at?: string }>();
  const recordingId = id as string;
  const { data: recording, isLoading } = useRecording(recordingId);

  if (isLoading || !recording) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="title">{recording.label}</AppText>

      <RecordingReviewPanel recordingId={recordingId} initialSeekMs={at ? Number(at) : null} />

      {recording.status === "reviewed" ? (
        <Button
          label={t("thread.newAttempt")}
          onPress={() => router.push(recordAttemptUrl(recording))}
          style={{ marginTop: spacing.md }}
        />
      ) : null}
    </Screen>
  );
}

function recordAttemptUrl(recording: Recording): string {
  const params = new URLSearchParams({
    respondsTo: recording.id,
    label: recording.label,
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
