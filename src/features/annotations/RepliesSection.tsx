import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText, Button, TextField } from "../../components";
import { t } from "../../i18n/ar";
import { spacing, useColors } from "../../theme";
import { useAddReply, useAnnotationReplies, useSetResolved } from "./api";

type Props = {
  annotationId: string;
  recordingId: string;
  resolved: boolean;
  authorId: string; // current user
  canResolve: boolean; // teacher only
};

/** Collapsible conversation on a single annotation + (teacher) resolve toggle. */
export function RepliesSection({ annotationId, recordingId, resolved, authorId, canResolve }: Props) {
  const colors = useColors();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const { data: replies, isLoading } = useAnnotationReplies(annotationId);
  const addReply = useAddReply(annotationId, authorId);
  const setResolved = useSetResolved(recordingId);

  const count = replies?.length ?? 0;
  const send = () => {
    if (!text.trim()) return;
    addReply.mutate(text, { onSuccess: () => setText("") });
  };

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.xs }}>
      <View style={styles.headerRow}>
        <Pressable onPress={() => setOpen((o) => !o)} hitSlop={6}>
          <AppText variant="caption" color={colors.primary}>
            💬 {t("replies.toggle")}{count > 0 ? ` (${count})` : ""} {open ? "▾" : "▸"}
          </AppText>
        </Pressable>
        {resolved ? (
          <AppText variant="caption" color={colors.success}>
            {t("replies.resolved")}
          </AppText>
        ) : null}
      </View>

      {open ? (
        <>
          {isLoading ? (
            <ActivityIndicator color={colors.primary} />
          ) : count > 0 ? (
            replies!.map((r) => (
              <View key={r.id} style={[styles.bubble, { backgroundColor: colors.primarySoft }]}>
                <AppText variant="caption" color={colors.textMuted}>
                  {r.author?.full_name ?? "—"}
                </AppText>
                <AppText variant="body">{r.body}</AppText>
              </View>
            ))
          ) : (
            <AppText variant="caption" color={colors.textMuted}>
              {t("replies.none")}
            </AppText>
          )}

          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}>
            <View style={{ flex: 1 }}>
              <TextField value={text} onChangeText={setText} placeholder={t("replies.placeholder")} />
            </View>
            <Button
              label={t("replies.send")}
              variant="secondary"
              onPress={send}
              loading={addReply.isPending}
            />
          </View>

          {canResolve ? (
            <Pressable
              onPress={() => setResolved.mutate({ id: annotationId, resolved: !resolved })}
              hitSlop={6}
            >
              <AppText variant="caption" color={resolved ? colors.textMuted : colors.success}>
                {resolved ? t("replies.markUnresolved") : t("replies.markResolved")}
              </AppText>
            </Pressable>
          ) : null}
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bubble: {
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: 2,
  },
});
