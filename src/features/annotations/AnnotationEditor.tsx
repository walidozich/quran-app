import {
  RecordingPresets,
  useAudioPlayer,
  useAudioPlayerStatus,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { useEffect, useMemo, useState } from "react";
import { Modal, ScrollView, StyleSheet, View } from "react-native";
import { AppText, Button, Card, TagChip, TextField } from "../../components";
import { t } from "../../i18n/ar";
import { ensureRecordingReady, formatMillis, setPlaybackMode } from "../../lib/audio";
import { colors, spacing } from "../../theme";
import { Tag } from "../../types/database";

type Props = {
  visible: boolean;
  mode: "create" | "edit";
  timestampMs: number;
  tags: Tag[];
  initialComment?: string | null;
  initialTagIds?: string[];
  hasExistingVoice?: boolean;
  saving?: boolean;
  onClose: () => void;
  onCreateTag: (name: string) => Promise<Tag>;
  onSubmitCreate: (p: {
    commentText: string | null;
    voiceLocalUri: string | null;
    voiceDurationMs: number | null;
    tagIds: string[];
  }) => void;
  onSubmitEdit: (p: { commentText: string | null; tagIds: string[] }) => void;
};

export function AnnotationEditor({
  visible,
  mode,
  timestampMs,
  tags,
  initialComment,
  initialTagIds,
  hasExistingVoice,
  saving,
  onClose,
  onCreateTag,
  onSubmitCreate,
  onSubmitEdit,
}: Props) {
  const [comment, setComment] = useState("");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [recordedUri, setRecordedUri] = useState<string | null>(null);
  const [durationMs, setDurationMs] = useState(0);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const source = useMemo(() => (recordedUri ? { uri: recordedUri } : null), [recordedUri]);
  const player = useAudioPlayer(source);
  const playerStatus = useAudioPlayerStatus(player);

  // Reset to the initial values whenever the editor opens.
  useEffect(() => {
    if (visible) {
      setComment(initialComment ?? "");
      setSelectedTagIds(initialTagIds ?? []);
      setNewTag("");
      setRecordedUri(null);
      setDurationMs(0);
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTag = (id: string) =>
    setSelectedTagIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const startVoice = async () => {
    const ready = await ensureRecordingReady();
    if (!ready) return;
    await recorder.prepareToRecordAsync();
    recorder.record();
  };
  const stopVoice = async () => {
    await recorder.stop();
    setDurationMs(recorderState.durationMillis);
    setRecordedUri(recorder.uri ?? null);
    await setPlaybackMode();
  };
  const togglePreview = () => {
    if (playerStatus.playing) player.pause();
    else {
      player.seekTo(0);
      player.play();
    }
  };

  const addCustomTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    const tag = await onCreateTag(name);
    setSelectedTagIds((prev) => (prev.includes(tag.id) ? prev : [...prev, tag.id]));
    setNewTag("");
  };

  const hasContent =
    comment.trim().length > 0 ||
    selectedTagIds.length > 0 ||
    recordedUri != null ||
    (mode === "edit" && Boolean(hasExistingVoice));

  const onSave = () => {
    if (!hasContent) return;
    const commentText = comment.trim() ? comment.trim() : null;
    if (mode === "create") {
      onSubmitCreate({
        commentText,
        voiceLocalUri: recordedUri,
        voiceDurationMs: recordedUri ? durationMs : null,
        tagIds: selectedTagIds,
      });
    } else {
      onSubmitEdit({ commentText, tagIds: selectedTagIds });
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={{ gap: spacing.md }} showsVerticalScrollIndicator={false}>
            <AppText variant="heading">
              {mode === "create" ? t("editor.createTitle") : t("editor.editTitle")}
            </AppText>
            <AppText variant="caption" color={colors.textMuted} style={{ writingDirection: "ltr" }}>
              {t("editor.at")} {formatMillis(timestampMs)}
            </AppText>

            {/* Voice correction (create mode only) */}
            {mode === "create" ? (
              <Card>
                {recorderState.isRecording ? (
                  <>
                    <AppText color={colors.danger}>{t("editor.voiceRecording")}</AppText>
                    <AppText variant="heading" style={{ writingDirection: "ltr", textAlign: "center" }}>
                      {formatMillis(recorderState.durationMillis)}
                    </AppText>
                    <Button label={t("editor.stopVoice")} variant="secondary" onPress={stopVoice} />
                  </>
                ) : recordedUri ? (
                  <View style={{ flexDirection: "row", gap: spacing.sm }}>
                    <Button
                      label={playerStatus.playing ? t("editor.stopVoice") : t("editor.playVoice")}
                      variant="secondary"
                      onPress={togglePreview}
                      style={{ flex: 1 }}
                    />
                    <Button
                      label={t("editor.clearVoice")}
                      variant="ghost"
                      onPress={() => setRecordedUri(null)}
                      style={{ flex: 1 }}
                    />
                  </View>
                ) : (
                  <Button label={t("editor.recordVoice")} variant="secondary" onPress={startVoice} />
                )}
              </Card>
            ) : hasExistingVoice ? (
              <Card>
                <AppText color={colors.primary}>{t("editor.voiceAttached")}</AppText>
              </Card>
            ) : null}

            {/* Text comment */}
            <TextField
              label={t("editor.commentLabel")}
              value={comment}
              onChangeText={setComment}
              placeholder={t("editor.commentPlaceholder")}
            />

            {/* Tags */}
            <AppText variant="subheading">{t("editor.tagsLabel")}</AppText>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {tags.map((tag) => (
                <TagChip
                  key={tag.id}
                  label={tag.name}
                  color={tag.color}
                  selected={selectedTagIds.includes(tag.id)}
                  onPress={() => toggleTag(tag.id)}
                />
              ))}
            </View>
            <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}>
              <View style={{ flex: 1 }}>
                <TextField
                  value={newTag}
                  onChangeText={setNewTag}
                  placeholder={t("editor.newTagPlaceholder")}
                />
              </View>
              <Button label={t("editor.addTag")} variant="secondary" onPress={addCustomTag} />
            </View>

            {!hasContent ? (
              <AppText variant="caption" color={colors.warning}>
                {t("editor.atLeastOne")}
              </AppText>
            ) : null}

            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button label={t("common.cancel")} variant="ghost" onPress={onClose} style={{ flex: 1 }} />
              <Button
                label={t("editor.save")}
                onPress={onSave}
                loading={saving}
                disabled={!hasContent}
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: "90%",
    // Modals render outside the Screen tree, so set RTL here too.
    direction: "rtl",
  },
});
