import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AppText, Card, Player, TagChip } from "../../components";
import { PlayerMarker } from "../../components/Player";
import { t } from "../../i18n/ar";
import { spacing, useColors } from "../../theme";
import { Tag } from "../../types/database";
import { AnnotationCard } from "../annotations/AnnotationCard";
import { useAnnotations } from "../annotations/api";
import { useSession } from "../session/auth";
import { useRecording, useSignedAudioUrl } from "./api";

type Props = {
  recordingId: string;
  initialSeekMs?: number | null;
};

/** Read-only student view of one recording: player + markers + filtered annotation list. */
export function RecordingReviewPanel({ recordingId, initialSeekMs = null }: Props) {
  const colors = useColors();
  const { currentProfile } = useSession();
  const { data: recording, isLoading } = useRecording(recordingId);
  const { data: audioUrl } = useSignedAudioUrl(recording?.audio_path);
  const isReviewed = recording?.status === "reviewed";
  const { data: annotations } = useAnnotations(isReviewed ? recordingId : "");

  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [seekToMs, setSeekToMs] = useState<number | null>(initialSeekMs);

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
    endMs: a.end_ms,
    color: a.tags[0]?.color ?? colors.accent,
  }));

  if (isLoading || !recording) {
    return <ActivityIndicator color={colors.primary} />;
  }

  return (
    <View style={{ gap: spacing.md }}>
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
              <AnnotationCard
                key={a.id}
                annotation={a}
                onJump={(ms) => setSeekToMs(ms)}
                showReplies
                recordingId={recordingId}
                currentUserId={currentProfile.id}
              />
            ))
          ) : (
            <AppText color={colors.textMuted}>{t("studentReview.noAnnotations")}</AppText>
          )}
        </>
      )}
    </View>
  );
}
