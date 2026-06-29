import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText, Badge, Card, EmptyState, ErrorState, Screen, ScreenHeader } from "../../../src/components";
import { BadgeStatus } from "../../../src/components/Badge";
import { useTeacherClasses } from "../../../src/features/classes/api";
import { RecordingWithStudent, useTeacherRecordings } from "../../../src/features/recordings/api";
import { buildThreads, Thread } from "../../../src/features/recordings/threads";
import { useSession } from "../../../src/features/session/auth";
import { t } from "../../../src/i18n/ar";
import { RecordingStatus } from "../../../src/types/database";
import { ColorScheme, radius, spacing, useColors } from "../../../src/theme";

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
});
