import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from "react-native";
import { AppText, Badge, Button, Card, EmptyState, ErrorState, Screen, ScreenHeader } from "../../../../src/components";
import { BadgeStatus } from "../../../../src/components/Badge";
import { useClassMembers, useTeacherClasses } from "../../../../src/features/classes/api";
import { RecordingWithStudent, useTeacherRecordings } from "../../../../src/features/recordings/api";
import { buildThreads, Thread } from "../../../../src/features/recordings/threads";
import { useSession } from "../../../../src/features/session/auth";
import { useClassWirds, useDeleteWird, useSetWirdComplete, useWirdCompletions } from "../../../../src/features/wirds/api";
import { isOverdue, wirdRefLabel } from "../../../../src/features/wirds/format";
import { WirdForm } from "../../../../src/features/wirds/WirdForm";
import { t } from "../../../../src/i18n/ar";
import { formatDateTime } from "../../../../src/lib/datetime";
import { RecordingStatus, Wird } from "../../../../src/types/database";
import { ColorScheme, radius, spacing, useColors } from "../../../../src/theme";

function teacherBadge(status: RecordingStatus): { status: BadgeStatus; label: string } {
  if (status === "reviewed") return { status: "reviewed", label: t("status.reviewed") };
  if (status === "in_review") return { status: "draft", label: t("status.draft") };
  return { status: "pending", label: t("status.pending") };
}

type StudentGroup = { id: string; name: string; threads: Thread<RecordingWithStudent>[] };

export default function TeacherClass() {
  const router = useRouter();
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const { currentProfile } = useSession();
  const { data: classes } = useTeacherClasses(currentProfile.id);
  const { data: recordings, isLoading, isError, refetch } = useTeacherRecordings(currentProfile.id);

  const cls = classes?.find((c) => c.id === classId) ?? null;
  const [filter, setFilter] = useState<string | null>(null); // student_id, or null = all

  // --- wirds ---
  const { data: members = [] } = useClassMembers(classId);
  const { data: wirds = [] } = useClassWirds(classId);
  const wirdIds = useMemo(() => wirds.map((w) => w.id), [wirds]);
  const { data: completions = [] } = useWirdCompletions(wirdIds);
  const deleteWird = useDeleteWird(classId);
  const setWirdComplete = useSetWirdComplete();
  const [wirdFormVisible, setWirdFormVisible] = useState(false);
  const [editingWird, setEditingWird] = useState<Wird | null>(null);
  const [formKey, setFormKey] = useState(0); // remount the form fresh on each open
  const [expandedWird, setExpandedWird] = useState<string | null>(null);

  // Students who have submitted (a recording linked to the wird), per wird.
  const submittedByWird = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const r of recordings ?? []) {
      if (!r.wird_id) continue;
      const set = m.get(r.wird_id) ?? new Set<string>();
      set.add(r.student_id);
      m.set(r.wird_id, set);
    }
    return m;
  }, [recordings]);

  const completedCountByWird = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const c of completions) {
      const set = m.get(c.wird_id) ?? new Set<string>();
      set.add(c.student_id);
      m.set(c.wird_id, set);
    }
    return m;
  }, [completions]);

  const openAssign = () => {
    setEditingWird(null);
    setFormKey((k) => k + 1);
    setWirdFormVisible(true);
  };
  const openEdit = (w: Wird) => {
    setEditingWird(w);
    setFormKey((k) => k + 1);
    setWirdFormVisible(true);
  };
  const confirmDelete = (w: Wird) => {
    Alert.alert(t("wird.delete"), t("wird.deleteConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("wird.delete"), style: "destructive", onPress: () => deleteWird.mutate(w.id) },
    ]);
  };

  // Threads for this class (latest activity first), grouped by student.
  const groups = useMemo<StudentGroup[]>(() => {
    const threads = buildThreads((recordings ?? []).filter((r) => r.class_id === classId));
    const byStudent = new Map<string, StudentGroup>();
    for (const th of threads) {
      const sid = th.latest.student_id;
      const g = byStudent.get(sid) ?? { id: sid, name: th.latest.student.full_name, threads: [] };
      g.threads.push(th);
      byStudent.set(sid, g);
    }
    // Students ordered by most-recent activity (their first thread is the latest).
    return [...byStudent.values()];
  }, [recordings, classId]);

  const visible = filter ? groups.filter((g) => g.id === filter) : groups;
  const hasAny = groups.length > 0;

  return (
    <Screen scroll>
      <ScreenHeader title={cls?.name ?? t("teacherHome.queue")} />

      {/* Wirds (assignments) */}
      <View style={{ gap: spacing.sm }}>
        <View style={styles.cardRow}>
          <AppText variant="heading">{t("wird.section")}</AppText>
          <Button label={t("wird.assign")} onPress={openAssign} />
        </View>
        {wirds.length === 0 ? (
          <AppText variant="caption" color={colors.textMuted}>
            {t("wird.none")}
          </AppText>
        ) : (
          wirds.map((w) => {
            const targetName = w.student_id
              ? members.find((m) => m.student.id === w.student_id)?.student.full_name ?? "—"
              : t("wird.wholeClass");
            const targetCount = w.student_id ? 1 : members.length;
            const completed = completedCountByWird.get(w.id)?.size ?? 0;
            return (
              <Card key={w.id}>
                <View style={styles.cardRow}>
                  <AppText variant="subheading">{wirdRefLabel(w)}</AppText>
                  {isOverdue(w.due_at) ? <Badge label={t("wird.overdue")} status="pending" /> : null}
                </View>
                {w.note ? <AppText variant="body">{w.note}</AppText> : null}
                <AppText variant="caption" color={colors.textMuted}>
                  {t("wird.target")}: {targetName}
                  {w.due_at ? ` · ${t("wird.dueLabel")}: ${formatDateTime(w.due_at)}` : ""}
                </AppText>
                <Pressable onPress={() => setExpandedWird(expandedWird === w.id ? null : w.id)} hitSlop={6}>
                  <AppText variant="caption" color={colors.primary}>
                    {expandedWird === w.id ? "▾" : "▸"} {t("wird.students")} — {t("wird.progress")}: {completed}/{targetCount}
                  </AppText>
                </Pressable>

                {expandedWird === w.id ? (
                  <View style={{ gap: spacing.xs, marginTop: spacing.xs }}>
                    {(w.student_id ? members.filter((m) => m.student.id === w.student_id) : members).map((m) => {
                      const done = completedCountByWird.get(w.id)?.has(m.student.id) ?? false;
                      const submitted = submittedByWird.get(w.id)?.has(m.student.id) ?? false;
                      const statusLabel = done
                        ? t("wird.statusDone")
                        : submitted
                          ? t("wird.statusSubmitted")
                          : t("wird.statusNew");
                      return (
                        <View key={m.student.id} style={styles.studentRow}>
                          <View style={{ flex: 1 }}>
                            <AppText variant="body">{m.student.full_name}</AppText>
                            <AppText variant="caption" color={done ? colors.success : colors.textMuted}>
                              {statusLabel}
                            </AppText>
                          </View>
                          <Button
                            label={done ? t("wird.markUndone") : t("wird.markDone")}
                            variant={done ? "ghost" : "secondary"}
                            onPress={() =>
                              setWirdComplete.mutate({
                                wirdId: w.id,
                                studentId: m.student.id,
                                teacherId: currentProfile.id,
                                completed: !done,
                              })
                            }
                          />
                        </View>
                      );
                    })}
                    {members.length === 0 ? (
                      <AppText variant="caption" color={colors.textMuted}>
                        {t("classes.noMembers")}
                      </AppText>
                    ) : null}
                  </View>
                ) : null}

                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Button label={t("wird.edit")} variant="ghost" onPress={() => openEdit(w)} style={{ flex: 1 }} />
                  <Button label={t("wird.delete")} variant="ghost" onPress={() => confirmDelete(w)} style={{ flex: 1 }} />
                </View>
              </Card>
            );
          })
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !hasAny ? (
        <EmptyState message={t("teacherClass.noRecordings")} />
      ) : (
        <>
          {/* Filter by student — only worth showing with more than one student. */}
          {groups.length > 1 ? (
            <View style={styles.chips}>
              <Chip label={t("teacherClass.allStudents")} active={filter === null} onPress={() => setFilter(null)} />
              {groups.map((g) => (
                <Chip key={g.id} label={g.name} active={filter === g.id} onPress={() => setFilter(g.id)} />
              ))}
            </View>
          ) : null}

          {visible.map((g) => (
            <View key={g.id} style={{ gap: spacing.sm }}>
              <AppText variant="heading" color={colors.primary}>
                {g.name}
              </AppText>
              {g.threads.map((thread) => {
                const badge = teacherBadge(thread.latest.status);
                return (
                  <Pressable
                    key={thread.rootId}
                    onPress={() => router.push(`/(teacher)/thread/${thread.rootId}`)}
                  >
                    <Card>
                      <View style={styles.cardRow}>
                        <AppText variant="heading">{thread.label}</AppText>
                        <Badge label={badge.label} status={badge.status} />
                      </View>
                      <AppText variant="caption" color={colors.textMuted}>
                        {thread.attempts.length} {t("thread.attemptsCount")}
                      </AppText>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </>
      )}

      <WirdForm
        key={formKey}
        visible={wirdFormVisible}
        onClose={() => setWirdFormVisible(false)}
        classId={classId}
        teacherId={currentProfile.id}
        members={members}
        editing={editingWird}
      />
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
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipIdle: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  studentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
  },
});
