import { useLocalSearchParams, useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { AppText, Button, Screen } from "../../../src/components";
import { useRecording } from "../../../src/features/recordings/api";
import { RecordingReviewPanel } from "../../../src/features/recordings/RecordingReviewPanel";
import { t } from "../../../src/i18n/ar";
import { spacing, useColors } from "../../../src/theme";

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
          onPress={() =>
            router.push(
              `/(student)/record?respondsTo=${recording.id}&label=${encodeURIComponent(recording.label)}`
            )
          }
          style={{ marginTop: spacing.md }}
        />
      ) : null}
    </Screen>
  );
}
