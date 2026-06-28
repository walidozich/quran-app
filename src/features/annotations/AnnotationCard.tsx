import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useMemo } from "react";
import { Pressable, View } from "react-native";
import { AppText, Button, Card, TagChip } from "../../components";
import { t } from "../../i18n/ar";
import { formatMillis } from "../../lib/audio";
import { spacing, useColors } from "../../theme";
import { AnnotationWithTags, useCorrectionUrl } from "./api";

function VoiceCorrectionButton({ path }: { path: string }) {
  const { data: url } = useCorrectionUrl(path);
  const source = useMemo(() => (url ? { uri: url } : null), [url]);
  const player = useAudioPlayer(source);
  const status = useAudioPlayerStatus(player);

  const toggle = () => {
    if (!url) return;
    if (status.playing) player.pause();
    else {
      player.seekTo(0);
      player.play();
    }
  };

  return (
    <Button
      label={`🔊 ${status.playing ? t("editor.stopVoice") : t("review.playCorrection")}`}
      variant="secondary"
      onPress={toggle}
      disabled={!url}
    />
  );
}

type Props = {
  annotation: AnnotationWithTags;
  onJump?: (timestampMs: number) => void;
  editable?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function AnnotationCard({ annotation, onJump, editable, onEdit, onDelete }: Props) {
  const colors = useColors();
  return (
    <Card>
      <Pressable onPress={() => onJump?.(annotation.timestamp_ms)}>
        <AppText variant="subheading" color={colors.primary} style={{ writingDirection: "ltr" }}>
          ⏱ {formatMillis(annotation.timestamp_ms)}
        </AppText>
      </Pressable>

      {annotation.comment_text ? (
        <AppText variant="body">{annotation.comment_text}</AppText>
      ) : null}

      {annotation.tags.length > 0 ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
          {annotation.tags.map((tag) => (
            <TagChip key={tag.id} label={tag.name} color={tag.color} />
          ))}
        </View>
      ) : null}

      {annotation.voice_path ? <VoiceCorrectionButton path={annotation.voice_path} /> : null}

      {editable ? (
        <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs }}>
          <Button label={t("review.edit")} variant="ghost" onPress={onEdit} style={{ flex: 1 }} />
          <Button label={t("review.delete")} variant="ghost" onPress={onDelete} style={{ flex: 1 }} />
        </View>
      ) : null}
    </Card>
  );
}
