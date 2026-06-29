import {
  RecordingPresets,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import {
  AppText,
  AyahPicker,
  Button,
  Card,
  RecordingOrb,
  Screen,
  ScreenHeader,
  TextField,
} from "../../src/components";
import type { PickedQuranReference } from "../../src/components";
import { MAX_RECITATION_MS } from "../../src/config/recording";
import { useStudentClasses } from "../../src/features/classes/api";
import { useCreateRecording } from "../../src/features/recordings/api";
import { useSession } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { ensureRecordingReady, formatMillis, setPlaybackMode } from "../../src/lib/audio";
import { spacing, useColors } from "../../src/theme";
import type { RecordingRefType } from "../../src/types/database";

export default function RecordScreen() {
  const router = useRouter();
  const {
    respondsTo,
    label: inheritedLabel,
    classId,
    ref_type,
    surah_start,
    ayah_start,
    surah_end,
    ayah_end,
    page_start,
    page_end,
  } = useLocalSearchParams<{
    respondsTo?: string;
    label?: string;
    classId?: string;
    ref_type?: RecordingRefType;
    surah_start?: string;
    ayah_start?: string;
    surah_end?: string;
    ayah_end?: string;
    page_start?: string;
    page_end?: string;
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
  const [quranReference, setQuranReference] = useState<PickedQuranReference | null>(() =>
    referenceFromParams({
      label: inheritedLabel,
      ref_type,
      surah_start,
      ayah_start,
      surah_end,
      ayah_end,
      page_start,
      page_end,
    })
  );
  const [pickerVisible, setPickerVisible] = useState(false);
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

  // Auto-stop at the length cap so uploads stay reasonable.
  useEffect(() => {
    if (recorderState.isRecording && recorderState.durationMillis >= MAX_RECITATION_MS) {
      stopRecording();
    }
  }, [recorderState.isRecording, recorderState.durationMillis]); // eslint-disable-line react-hooks/exhaustive-deps

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
        studentName: currentProfile.full_name,
        ref_type: quranReference?.ref_type ?? null,
        surah_start: quranReference?.surah_start ?? null,
        ayah_start: quranReference?.ayah_start ?? null,
        surah_end: quranReference?.surah_end ?? null,
        ayah_end: quranReference?.ayah_end ?? null,
        page_start: quranReference?.page_start ?? null,
        page_end: quranReference?.page_end ?? null,
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
            <RecordingOrb />
            <AppText variant="heading" color={colors.danger} style={{ textAlign: "center" }}>
              {t("record.recording")}
            </AppText>
            <AppText variant="title" style={{ writingDirection: "ltr", textAlign: "center" }}>
              {formatMillis(recorderState.durationMillis)}
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ textAlign: "center" }}>
              {t("record.cap")}
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
            onChangeText={(text) => {
              setLabel(text);
              setQuranReference(null);
            }}
            placeholder={t("record.labelPlaceholder")}
          />
          <Button label={t("ayah.pick")} variant="secondary" onPress={() => setPickerVisible(true)} />
          <Button
            label={createRecording.isPending ? t("record.uploading") : t("record.upload")}
            onPress={onUpload}
            loading={createRecording.isPending}
            disabled={!label.trim()}
          />
        </>
      ) : null}

      <AyahPicker
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onPick={(picked) => {
          setLabel(picked.label);
          setQuranReference(picked);
        }}
      />

      {error ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText color={colors.danger}>{error}</AppText>
        </Card>
      ) : null}
    </Screen>
  );
}

function parseParamNumber(value: string | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function referenceFromParams(params: {
  label?: string;
  ref_type?: RecordingRefType;
  surah_start?: string;
  ayah_start?: string;
  surah_end?: string;
  ayah_end?: string;
  page_start?: string;
  page_end?: string;
}): PickedQuranReference | null {
  if (!params.label || !params.ref_type) return null;
  if (params.ref_type === "ayah") {
    const surahStart = parseParamNumber(params.surah_start);
    const ayahStart = parseParamNumber(params.ayah_start);
    const surahEnd = parseParamNumber(params.surah_end);
    const ayahEnd = parseParamNumber(params.ayah_end);
    if (surahStart == null || ayahStart == null || surahEnd == null || ayahEnd == null) return null;
    return {
      label: params.label,
      ref_type: "ayah",
      surah_start: surahStart,
      ayah_start: ayahStart,
      surah_end: surahEnd,
      ayah_end: ayahEnd,
      page_start: null,
      page_end: null,
    };
  }

  const pageStart = parseParamNumber(params.page_start);
  const pageEnd = parseParamNumber(params.page_end);
  if (pageStart == null || pageEnd == null) return null;
  return {
    label: params.label,
    ref_type: "page",
    surah_start: null,
    ayah_start: null,
    surah_end: null,
    ayah_end: null,
    page_start: pageStart,
    page_end: pageEnd,
  };
}
