import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import {
  AppText,
  AyahPicker,
  Button,
  Card,
  PickedQuranReference,
  Screen,
  ScreenHeader,
  TextField,
} from "../../../src/components";
import { useClassMembers } from "../../../src/features/classes/api";
import { sendPushToProfile } from "../../../src/features/notifications/push";
import { useClassWirds, useCreateWird, useUpdateWird } from "../../../src/features/wirds/api";
import { nextWirdRef, wirdRefLabel } from "../../../src/features/wirds/format";
import { useSession } from "../../../src/features/session/auth";
import { t } from "../../../src/i18n/ar";
import { formatDateTime } from "../../../src/lib/datetime";
import { ColorScheme, radius, spacing, useColors } from "../../../src/theme";
import { RecordingRefType, Wird } from "../../../src/types/database";

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

const n = (v: string | undefined): number | null => {
  const x = Number(v);
  return Number.isFinite(x) && v !== undefined && v !== "" ? x : null;
};

/**
 * One-screen quick assign (spec.md §17): the portion is the hero, the target
 * defaults to the whole class, due date optional, title/note collapsed. Two
 * taps for the common case. Also edits an existing wird (`wirdId` param) and
 * accepts a pre-filled portion (deep link from the "next wird" suggestion).
 */
export default function AssignWird() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const params = useLocalSearchParams<{
    classId: string;
    wirdId?: string;
    studentId?: string;
    label?: string;
    ref_type?: string;
    surah_start?: string;
    ayah_start?: string;
    surah_end?: string;
    ayah_end?: string;
    page_start?: string;
    page_end?: string;
  }>();
  const classId = params.classId as string;
  const { currentProfile } = useSession();
  const { data: members = [] } = useClassMembers(classId);
  const { data: wirds = [] } = useClassWirds(classId);
  const editing = params.wirdId ? wirds.find((w) => w.id === params.wirdId) ?? null : null;

  const prefill: PickedQuranReference | null =
    params.ref_type && params.label
      ? {
          label: params.label,
          ref_type: params.ref_type as RecordingRefType,
          surah_start: n(params.surah_start),
          ayah_start: n(params.ayah_start),
          surah_end: n(params.surah_end),
          ayah_end: n(params.ayah_end),
          page_start: n(params.page_start),
          page_end: n(params.page_end),
        }
      : null;

  const [ref, setRef] = useState<PickedQuranReference | null>(
    editing ? refFromWird(editing) : prefill
  );
  const [studentId, setStudentId] = useState<string | null>(
    editing?.student_id ?? (params.studentId as string | undefined) ?? null
  );
  const [dueAt, setDueAt] = useState<string | null>(editing?.due_at ?? null);
  const [title, setTitle] = useState(editing?.title ?? "");
  const [note, setNote] = useState(editing?.note ?? "");
  const [detailsOpen, setDetailsOpen] = useState(Boolean(editing?.title || editing?.note));
  const [pickerVisible, setPickerVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const createWird = useCreateWird();
  const updateWird = useUpdateWird(classId);

  // "Continue after the last wird" shortcut — pre-fills the portion that
  // follows the most recently assigned one.
  const lastWird = wirds[0] ?? null;
  const continuation = useMemo(() => (lastWird ? nextWirdRef(lastWird) : null), [lastWird]);

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
          teacherId: currentProfile.id,
          studentId,
          dueAt,
          ...refFields,
        });
        // Notify the targeted student(s): one student, or every class member.
        const targets = studentId ? [studentId] : members.map((m) => m.student.id);
        targets.forEach((id) =>
          sendPushToProfile(id, t("notif.wirdTitle"), ref.label, { targetRole: "student" })
        );
      }
      router.back();
    } catch {
      setError(t("record.uploadError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader title={editing ? t("wird.editTitle") : t("wird.assignTitle")} reload={false} />

      {/* Hero: the portion */}
      <Pressable onPress={() => setPickerVisible(true)}>
        <Card style={{ ...styles.hero, ...(ref ? { borderColor: colors.primary } : null) }}>
          <AppText variant="caption" color={colors.textMuted}>
            {t("wird.portion")}
          </AppText>
          <AppText variant="title" color={ref ? colors.primary : colors.textMuted}>
            {ref?.label ?? t("wird.pickPortion")}
          </AppText>
        </Card>
      </Pressable>

      {!editing && continuation && !ref ? (
        <Pressable
          onPress={() =>
            setRef({
              label: continuation.label,
              ref_type: continuation.ref_type,
              surah_start: continuation.surah_start,
              ayah_start: continuation.ayah_start,
              surah_end: continuation.surah_end,
              ayah_end: continuation.ayah_end,
              page_start: continuation.page_start,
              page_end: continuation.page_end,
            })
          }
        >
          <Card style={{ borderColor: colors.accent }}>
            <AppText variant="caption" color={colors.textMuted}>
              ⤵ {t("wird.continueLast")} ({wirdRefLabel(lastWird as Wird)})
            </AppText>
            <AppText variant="subheading" color={colors.primary}>
              {continuation.label}
            </AppText>
          </Card>
        </Pressable>
      ) : null}

      {/* Target — defaults to the whole class */}
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

      {/* Due date — optional */}
      <AppText variant="subheading" color={colors.primary}>
        {t("wird.due")}
      </AppText>
      <View style={styles.chips}>
        <Chip label={t("wird.dueNone")} active={dueAt === null} onPress={() => setDueAt(null)} />
        <Chip label={t("wird.due3")} active={false} onPress={() => setDueAt(new Date(Date.now() + 3 * DAY).toISOString())} />
        <Chip label={t("wird.dueWeek")} active={false} onPress={() => setDueAt(new Date(Date.now() + 7 * DAY).toISOString())} />
        <Chip label={t("wird.due2weeks")} active={false} onPress={() => setDueAt(new Date(Date.now() + 14 * DAY).toISOString())} />
      </View>
      {dueAt ? (
        <AppText variant="caption" color={colors.textMuted}>
          {t("wird.dueLabel")}: {formatDateTime(dueAt)}
        </AppText>
      ) : null}

      {/* Collapsed extras */}
      <Pressable onPress={() => setDetailsOpen((o) => !o)} hitSlop={6}>
        <AppText variant="caption" color={colors.primary}>
          {detailsOpen ? "▾" : "▸"} {t("wird.moreDetails")}
        </AppText>
      </Pressable>
      {detailsOpen ? (
        <>
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
        </>
      ) : null}

      {error ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText color={colors.danger}>{error}</AppText>
        </Card>
      ) : null}

      <Button
        label={editing ? t("wird.saveEdit") : t("wird.assignCta")}
        onPress={onSave}
        loading={busy}
        disabled={!ref}
      />

      <AyahPicker visible={pickerVisible} onClose={() => setPickerVisible(false)} onPick={(picked) => setRef(picked)} />
    </Screen>
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
    hero: {
      alignItems: "center",
      paddingVertical: spacing.xl,
      gap: spacing.xs,
      borderWidth: 2,
      borderColor: colors.border,
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
