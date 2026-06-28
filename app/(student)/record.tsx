import {
  RecordingPresets,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { AppText, Button, Card, Screen, TextField } from "../../src/components";
import { useStudentClass } from "../../src/features/classes/api";
import { useCreateRecording } from "../../src/features/recordings/api";
import { useSession } from "../../src/features/session/DevSessionProvider";
import { t } from "../../src/i18n/ar";
import { ensureRecordingReady, formatMillis, setPlaybackMode } from "../../src/lib/audio";
import { colors, spacing } from "../../src/theme";

export default function RecordScreen() {
  const router = useRouter();
  const { currentProfile } = useSession();
  const { data: studentClass } = useStudentClass(currentProfile.id);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const source = useMemo(() => (recordedUri ? { uri: recordedUri } : null), [recordedUri]);
  const player = useAudioPlayer(source);
  const playerStatus = useAudioPlayerStatus(player);

  const createRecording = useCreateRecording(currentProfile.id);

  const startRecording = async () => {
    setError(null);
    const ready = await ensureRecordingReady();
    if (!ready) {
      setError(t("record.permissionDenied"));
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
  };

  const stopRecording = async () => {
    await recorder.stop();
    setDurationMs(recorderState.durationMillis);
    setRecordedUri(recorder.uri ?? null);
    await setPlaybackMode();
  };

  const reRecord = () => {
    if (playerStatus.playing) player.pause();
    setRecordedUri(null);
    setDurationMs(0);
  };

  const togglePlay = () => {
    if (playerStatus.playing) {
      player.pause();
    } else {
      player.seekTo(0);
      player.play();
    }
  };

  const onUpload = () => {
    if (!studentClass || !recordedUri) return;
    setError(null);
    createRecording.mutate(
      { classId: studentClass.id, label: label.trim(), localUri: recordedUri, durationMs },
      {
        onSuccess: () => router.back(),
        onError: () => setError(t("record.uploadError")),
      }
    );
  };

  if (!studentClass) {
    return (
      <Screen>
        <AppText variant="title">{t("record.title")}</AppText>
        <Card>
          <AppText color={colors.warning}>{t("record.needClass")}</AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <AppText variant="title">{t("record.title")}</AppText>

      <Card>
        {recorderState.isRecording ? (
          <>
            <AppText variant="heading" color={colors.danger}>
              {t("record.recording")}
            </AppText>
            <AppText variant="title" style={{ writingDirection: "ltr", textAlign: "center" }}>
              {formatMillis(recorderState.durationMillis)}
            </AppText>
            <Button label={t("record.stop")} variant="secondary" onPress={stopRecording} />
          </>
        ) : recordedUri ? (
          <>
            <AppText variant="subheading" color={colors.textMuted}>
              {t("record.title")} — {formatMillis(durationMs)}
            </AppText>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button
                label={playerStatus.playing ? t("record.pause") : t("record.play")}
                variant="secondary"
                onPress={togglePlay}
                style={{ flex: 1 }}
              />
              <Button label={t("record.rerecord")} variant="ghost" onPress={reRecord} style={{ flex: 1 }} />
            </View>
          </>
        ) : (
          <Button label={t("record.start")} onPress={startRecording} />
        )}
      </Card>

      {recordedUri ? (
        <>
          <TextField
            label={t("record.labelLabel")}
            value={label}
            onChangeText={setLabel}
            placeholder={t("record.labelPlaceholder")}
          />
          <Button
            label={createRecording.isPending ? t("record.uploading") : t("record.upload")}
            onPress={onUpload}
            loading={createRecording.isPending}
            disabled={!label.trim()}
          />
        </>
      ) : null}

      {error ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText color={colors.danger}>{error}</AppText>
        </Card>
      ) : null}
    </Screen>
  );
}
