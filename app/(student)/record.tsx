import {
  RecordingPresets,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { View } from "react-native";
import { AppText, Button, Card, Screen, ScreenHeader, TextField } from "../../src/components";
import { useStudentClasses } from "../../src/features/classes/api";
import { useCreateRecording } from "../../src/features/recordings/api";
import { useSession } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { ensureRecordingReady, formatMillis, setPlaybackMode } from "../../src/lib/audio";
import { spacing, useColors } from "../../src/theme";

export default function RecordScreen() {
  const router = useRouter();
  const { respondsTo, label: inheritedLabel, classId } = useLocalSearchParams<{
    respondsTo?: string;
    label?: string;
    classId?: string;
  }>();
  const colors = useColors();
  const { currentProfile } = useSession();
  const { data: classes } = useStudentClasses(currentProfile.id);
  // Record into the class passed in the route; fall back to the first joined class.
  const studentClass = classes?.find((c) => c.id === classId) ?? classes?.[0] ?? null;

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);

  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [label, setLabel] = useState(inheritedLabel ?? "");
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
      {
        classId: studentClass.id,
        label: label.trim(),
        localUri: recordedUri,
        durationMs,
        respondsToId: respondsTo ?? null,
      },
      {
        onSuccess: () => router.back(),
        onError: () => setError(t("record.uploadError")),
      }
    );
  };

  if (!studentClass) {
    return (
      <Screen>
        <ScreenHeader title={t("record.title")} reload={false} />
        <Card>
          <AppText color={colors.warning}>{t("record.needClass")}</AppText>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenHeader title={t("record.title")} reload={false} />
      <AppText variant="subheading" color={colors.primary}>
        {t("record.classLabel")}: {studentClass.name}
      </AppText>

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
