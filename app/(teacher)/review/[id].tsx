import { useLocalSearchParams } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { AppText, Button, Card, Player, Screen, ScreenHeader } from "../../../src/components";
import { PlayerMarker } from "../../../src/components/Player";
import { AnnotationCard } from "../../../src/features/annotations/AnnotationCard";
import { AnnotationEditor } from "../../../src/features/annotations/AnnotationEditor";
import {
  AnnotationWithTags,
  useAnnotations,
  useCreateAnnotation,
  useDeleteAnnotation,
  useUpdateAnnotation,
} from "../../../src/features/annotations/api";
import {
  useRecording,
  useSetRecordingStatus,
  useSignedAudioUrl,
} from "../../../src/features/recordings/api";
import { useSession } from "../../../src/features/session/auth";
import { useCreateTag, useTags } from "../../../src/features/tags/useTags";
import { t } from "../../../src/i18n/ar";
import { spacing, useColors } from "../../../src/theme";

export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordingId = id as string;
  const colors = useColors();
  const { currentProfile } = useSession();

  const { data: recording, isLoading: recLoading } = useRecording(recordingId);
  const { data: audioUrl } = useSignedAudioUrl(recording?.audio_path);
  const { data: annotations } = useAnnotations(recordingId);
  const { data: tags } = useTags();

  const createAnnotation = useCreateAnnotation(recordingId, currentProfile.id);
  const updateAnnotation = useUpdateAnnotation(recordingId);
  const deleteAnnotation = useDeleteAnnotation(recordingId);
  const createTag = useCreateTag(currentProfile.id);
  const setStatus = useSetRecordingStatus();

  const currentMsRef = useRef(0);
  const onPosition = useCallback((ms: number) => {
    currentMsRef.current = ms;
  }, []);

  const [seekToMs, setSeekToMs] = useState<number | null>(null);
  const [pauseSignal, setPauseSignal] = useState(0);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<AnnotationWithTags | null>(null);
  const [createTimestamp, setCreateTimestamp] = useState(0);
  const [createEnd, setCreateEnd] = useState<number | null>(null);
  // Optional range selection for the next note.
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [rangeEnd, setRangeEnd] = useState<number | null>(null);

  const markStart = () => {
    const c = currentMsRef.current;
    setRangeStart(c);
    if (rangeEnd != null && rangeEnd <= c) setRangeEnd(null);
  };
  const markEnd = () => {
    const c = currentMsRef.current;
    if (rangeStart != null && c > rangeStart) setRangeEnd(c);
  };
  const clearRange = () => {
    setRangeStart(null);
    setRangeEnd(null);
  };

  const openCreate = () => {
    if (rangeStart != null) {
      setCreateTimestamp(rangeStart);
      setCreateEnd(rangeEnd != null && rangeEnd > rangeStart ? rangeEnd : null);
    } else {
      setCreateTimestamp(currentMsRef.current);
      setCreateEnd(null);
    }
    setPauseSignal((n) => n + 1); // auto-pause playback at the current moment
    setEditing(null);
    setEditorMode("create");
    setEditorVisible(true);
  };
  const openEdit = (a: AnnotationWithTags) => {
    setEditing(a);
    setEditorMode("edit");
    setEditorVisible(true);
  };

  // Reopen an already-submitted review for editing (student won't see changes
  // until it's submitted again). Confirm first so it's never silent.
  const reopenReview = () => {
    Alert.alert(t("review.reopen"), t("review.reopenConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("common.continue"),
        onPress: () => setStatus.mutate({ id: recordingId, status: "in_review" }),
      },
    ]);
  };

  const markers: PlayerMarker[] = (annotations ?? []).map((a) => ({
    id: a.id,
    timestampMs: a.timestamp_ms,
    endMs: a.end_ms,
    color: a.tags[0]?.color ?? colors.accent,
  }));

  const onMarkerPress = (markerId: string) => {
    const a = annotations?.find((x) => x.id === markerId);
    if (a) setSeekToMs(a.timestamp_ms);
  };

  if (recLoading || !recording) {
    return (
      <Screen>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }

  const isReviewed = recording.status === "reviewed";

  return (
    <Screen scroll>
      <ScreenHeader title={recording.label} />

      <Card>
        {audioUrl ? (
          <Player
            uri={audioUrl}
            markers={markers}
            onMarkerPress={onMarkerPress}
            onPosition={onPosition}
            seekToMs={seekToMs}
            pauseSignal={pauseSignal}
            pending={rangeStart != null ? { startMs: rangeStart, endMs: rangeEnd } : null}
          />
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
        {isReviewed ? (
          <Button
            label={t("review.reopen")}
            variant="secondary"
            onPress={reopenReview}
            loading={setStatus.isPending}
            style={{ marginTop: spacing.sm }}
          />
        ) : (
          <>
            <AppText variant="caption" color={colors.textMuted} style={{ marginTop: spacing.sm }}>
              {t("review.rangeHint")}
            </AppText>
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button
                label={`${t("review.setStart")}${rangeStart != null ? " ✓" : ""}`}
                variant="secondary"
                onPress={markStart}
                style={{ flex: 1 }}
              />
              <Button
                label={`${t("review.setEnd")}${rangeEnd != null ? " ✓" : ""}`}
                variant="secondary"
                onPress={markEnd}
                style={{ flex: 1 }}
              />
            </View>
            {rangeStart != null ? (
              <Pressable onPress={clearRange} hitSlop={6}>
                <AppText variant="caption" color={colors.danger} style={{ textAlign: "center" }}>
                  {t("review.clearRange")}
                </AppText>
              </Pressable>
            ) : null}
            <Button label={t("review.addNote")} onPress={openCreate} />
          </>
        )}
      </Card>

      <AppText variant="subheading">{t("review.annotations")}</AppText>
      {annotations && annotations.length > 0 ? (
        annotations.map((a) => (
          <AnnotationCard
            key={a.id}
            annotation={a}
            onJump={(ms) => setSeekToMs(ms)}
            editable={!isReviewed}
            onEdit={() => openEdit(a)}
            onDelete={() => deleteAnnotation.mutate(a.id)}
            showReplies
            recordingId={recordingId}
            currentUserId={currentProfile.id}
            canResolve
          />
        ))
      ) : (
        <AppText color={colors.textMuted}>{t("review.noAnnotations")}</AppText>
      )}

      {isReviewed ? (
        <Card style={{ borderColor: colors.success }}>
          <AppText color={colors.success}>{t("review.submitted")}</AppText>
        </Card>
      ) : (
        <Button
          label={t("review.submit")}
          onPress={() =>
            setStatus.mutate({ id: recordingId, status: "reviewed", reviewedAt: new Date().toISOString() })
          }
          loading={setStatus.isPending}
          disabled={!annotations || annotations.length === 0}
        />
      )}

      <AnnotationEditor
        visible={editorVisible}
        mode={editorMode}
        timestampMs={editorMode === "create" ? createTimestamp : editing?.timestamp_ms ?? 0}
        endMs={editorMode === "create" ? createEnd : editing?.end_ms ?? null}
        tags={tags ?? []}
        initialComment={editing?.comment_text}
        initialTagIds={editing?.tags.map((x) => x.id)}
        hasExistingVoice={Boolean(editing?.voice_path)}
        saving={createAnnotation.isPending || updateAnnotation.isPending}
        onClose={() => setEditorVisible(false)}
        onCreateTag={(name) => createTag.mutateAsync(name)}
        onSubmitCreate={(p) =>
          createAnnotation.mutate(
            { ...p, timestampMs: createTimestamp, endMs: createEnd },
            {
              onSuccess: () => {
                setEditorVisible(false);
                clearRange();
                if (recording.status === "pending") {
                  setStatus.mutate({ id: recordingId, status: "in_review" });
                }
              },
            }
          )
        }
        onSubmitEdit={(p) =>
          updateAnnotation.mutate(
            { id: editing?.id ?? "", commentText: p.commentText, tagIds: p.tagIds },
            { onSuccess: () => setEditorVisible(false) }
          )
        }
      />
    </Screen>
  );
}
