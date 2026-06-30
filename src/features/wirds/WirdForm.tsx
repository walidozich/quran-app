import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText, AyahPicker, Button, PickedQuranReference, TextField } from "../../components";
import { t } from "../../i18n/ar";
import { formatDateTime } from "../../lib/datetime";
import { ColorScheme, radius, spacing, useColors } from "../../theme";
import { Wird } from "../../types/database";
import { ClassMemberWithProfile } from "../classes/api";
import { sendPushToProfile } from "../notifications/push";
import { useCreateWird, useUpdateWird } from "./api";
import { wirdRefLabel } from "./format";

type Props = {
  visible: boolean;
  onClose: () => void;
  classId: string;
  teacherId: string;
  members: ClassMemberWithProfile[];
  editing?: Wird | null;
};

const DAY = 24 * 60 * 60 * 1000;

function refFromWird(w: Wird): PickedQuranReference {
  return {
    label: wirdRefLabel(w),
    ref_type: w.ref_type ?? null,
    surah_start: w.surah_start ?? null,
    ayah_start: w.ayah_start ?? null,
    surah_end: w.surah_end ?? null,
    ayah_end: w.ayah_end ?? null,
    page_start: w.page_start ?? null,
    page_end: w.page_end ?? null,
  };
}

export function WirdForm({ visible, onClose, classId, teacherId, members, editing }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const createWird = useCreateWird();
  const updateWird = useUpdateWird(classId);

  const [studentId, setStudentId] = useState<string | null>(editing?.student_id ?? null);
  const [ref, setRef] = useState<PickedQuranReference | null>(editing ? refFromWird(editing) : null);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [dueAt, setDueAt] = useState<string | null>(editing?.due_at ?? null);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const close = () => {
    setError(null);
    onClose();
  };

  const onSave = async () => {
    if (!ref || !ref.ref_type) {
      setError(t("wird.needPortion"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const refFields = {
        ref_type: ref.ref_type,
        surah_start: ref.surah_start,
        ayah_start: ref.ayah_start,
        surah_end: ref.surah_end,
        ayah_end: ref.ayah_end,
        page_start: ref.page_start,
        page_end: ref.page_end,
        title: title.trim() || null,
        note: note.trim() || null,
      };

      if (editing) {
        await updateWird.mutateAsync({
          id: editing.id,
          patch: { ...refFields, due_at: dueAt, student_id: studentId },
        });
      } else {
        await createWird.mutateAsync({
          classId,
          teacherId,
          studentId,
          dueAt,
          ...refFields,
        });
        // Notify the targeted student(s): one student, or every class member.
        const targets = studentId ? [studentId] : members.map((m) => m.student.id);
        const body = ref.label;
        targets.forEach((id) => sendPushToProfile(id, t("notif.wirdTitle"), body));
      }
      close();
    } catch {
      setError(t("record.uploadError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <SafeAreaView edges={["bottom"]} style={{ gap: spacing.md }}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md }}>
              <AppText variant="heading">{editing ? t("wird.editTitle") : t("wird.assignTitle")}</AppText>

              {/* Target */}
              <AppText variant="subheading" color={colors.primary}>
                {t("wird.target")}
              </AppText>
              <View style={styles.chips}>
                <Chip label={t("wird.wholeClass")} active={studentId === null} onPress={() => setStudentId(null)} />
                {members.map((m) => (
                  <Chip
                    key={m.student.id}
                    label={m.student.full_name}
                    active={studentId === m.student.id}
                    onPress={() => setStudentId(m.student.id)}
                  />
                ))}
              </View>

              {/* Portion */}
              <Button
                label={ref?.label ?? t("wird.pickPortion")}
                variant="secondary"
                onPress={() => setPickerVisible(true)}
              />

              <TextField
                label={t("wird.titleLabel")}
                value={title}
                onChangeText={setTitle}
                placeholder={t("wird.titlePlaceholder")}
              />
              <TextField
                label={t("wird.noteLabel")}
                value={note}
                onChangeText={setNote}
                placeholder={t("wird.notePlaceholder")}
                multiline
              />

              {/* Due date presets */}
              <AppText variant="subheading" color={colors.primary}>
                {t("wird.due")}
              </AppText>
              <View style={styles.chips}>
                <Chip label={t("wird.dueNone")} active={dueAt === null} onPress={() => setDueAt(null)} />
                <Chip label={t("wird.due3")} active={false} onPress={() => setDueAt(new Date(Date.now() + 3 * DAY).toISOString())} />
                <Chip label={t("wird.dueWeek")} active={false} onPress={() => setDueAt(new Date(Date.now() + 7 * DAY).toISOString())} />
                <Chip label={t("wird.due2weeks")} active={false} onPress={() => setDueAt(new Date(Date.now() + 14 * DAY).toISOString())} />
              </View>
              <AppText variant="caption" color={colors.textMuted}>
                {t("wird.dueLabel")}: {dueAt ? formatDateTime(dueAt) : t("wird.dueNone")}
              </AppText>

              {error ? <AppText color={colors.danger}>{error}</AppText> : null}

              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <Button label={t("common.cancel")} variant="ghost" onPress={close} style={{ flex: 1 }} />
                <Button
                  label={editing ? t("wird.saveEdit") : t("wird.save")}
                  onPress={onSave}
                  loading={busy}
                  style={{ flex: 1 }}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>

      <AyahPicker visible={pickerVisible} onClose={() => setPickerVisible(false)} onPick={(picked) => setRef(picked)} />
    </Modal>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : styles.chipIdle]}>
      <AppText variant="caption" color={active ? colors.textOnPrimary : colors.primary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const makeStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
    sheet: {
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: spacing.lg,
      maxHeight: "90%",
      direction: "rtl",
    },
    chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipIdle: { backgroundColor: colors.surface, borderColor: colors.border },
  });
