import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AppText, Card, Player, Screen, TagChip } from "../../../src/components";
import { PlayerMarker } from "../../../src/components/Player";
import { AnnotationCard } from "../../../src/features/annotations/AnnotationCard";
import { useAnnotations } from "../../../src/features/annotations/api";
import { useRecording, useSignedAudioUrl } from "../../../src/features/recordings/api";
import { t } from "../../../src/i18n/ar";
import { Tag } from "../../../src/types/database";
import { colors, spacing } from "../../../src/theme";

export default function StudentRecordingView() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const recordingId = id as string;

  const { data: recording, isLoading } = useRecording(recordingId);
  const { data: audioUrl } = useSignedAudioUrl(recording?.audio_path);
  const isReviewed = recording?.status === "reviewed";
  const { data: annotations } = useAnnotations(isReviewed ? recordingId : "");

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [seekToMs, setSeekToMs] = useState<number | null>(null);

  // Unique tags used across this recording's annotations.
  const tagsInRecording = useMemo<Tag[]>(() => {
    const map = new Map<string, Tag>();
    (annotations ?? []).forEach((a) => a.tags.forEach((tg) => map.set(tg.id, tg)));
    return [...map.values()];
  }, [annotations]);

  const filtered = useMemo(
    () =>
      selectedTagId
        ? (annotations ?? []).filter((a) => a.tags.some((tg) => tg.id === selectedTagId))
        : annotations ?? [],
    [annotations, selectedTagId]
  );

  const markers: PlayerMarker[] = filtered.map((a) => ({
    id: a.id,
    timestampMs: a.timestamp_ms,
    color: a.tags[0]?.color ?? colors.accent,
  }));

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

      <Card>
        {audioUrl ? (
          <Player
            uri={audioUrl}
            markers={markers}
            onMarkerPress={(mid) => {
              const a = filtered.find((x) => x.id === mid);
              if (a) setSeekToMs(a.timestamp_ms);
            }}
            seekToMs={seekToMs}
          />
        ) : (
          <ActivityIndicator color={colors.primary} />
        )}
      </Card>

      {!isReviewed ? (
        <Card style={{ borderColor: colors.warning }}>
          <AppText color={colors.warning}>{t("studentReview.pending")}</AppText>
        </Card>
      ) : (
        <>
          <AppText variant="subheading">{t("studentReview.annotations")}</AppText>

          {tagsInRecording.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              <TagChip
                label={t("studentReview.filterAll")}
                selected={selectedTagId === null}
                onPress={() => setSelectedTagId(null)}
              />
              {tagsInRecording.map((tg) => (
                <TagChip
                  key={tg.id}
                  label={tg.name}
                  color={tg.color}
                  selected={selectedTagId === tg.id}
                  onPress={() => setSelectedTagId(tg.id)}
                />
              ))}
            </View>
          ) : null}

          {filtered.length > 0 ? (
            filtered.map((a) => (
              <AnnotationCard key={a.id} annotation={a} onJump={(ms) => setSeekToMs(ms)} />
            ))
          ) : (
            <AppText color={colors.textMuted}>{t("studentReview.noAnnotations")}</AppText>
          )}
        </>
      )}
    </Screen>
  );
}
