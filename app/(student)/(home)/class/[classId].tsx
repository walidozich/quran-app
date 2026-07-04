import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, EmptyState, ErrorState, Screen, ScreenHeader } from "../../../../src/components";
import { BadgeStatus } from "../../../../src/components/Badge";
import { useStudentClasses } from "../../../../src/features/classes/api";
import { useStudentRecordings } from "../../../../src/features/recordings/api";
import { buildThreads } from "../../../../src/features/recordings/threads";
import { useSession } from "../../../../src/features/session/auth";
import { useClassWirds, useWirdCompletions } from "../../../../src/features/wirds/api";
import { isOverdue, WirdStatus, wirdRefLabel, wirdStatusFor } from "../../../../src/features/wirds/format";
import { t } from "../../../../src/i18n/ar";
import { formatDateTime } from "../../../../src/lib/datetime";
import { RecordingStatus, Wird } from "../../../../src/types/database";
import { useColors } from "../../../../src/theme";

function studentBadge(status: RecordingStatus): { status: BadgeStatus; label: string } {
  if (status === "reviewed") return { status: "reviewed", label: t("status.reviewed") };
  return { status: "pending", label: t("status.pending") };
}

function wirdBadge(s: WirdStatus): { status: BadgeStatus; label: string } {
  if (s === "done") return { status: "reviewed", label: t("wird.statusDone") };
  if (s === "reviewed") return { status: "reviewed", label: t("wird.statusReviewed") };
  if (s === "submitted") return { status: "draft", label: t("wird.statusSubmitted") };
  return { status: "pending", label: t("wird.statusNew") };
}

/** Route to the record screen, pre-filled and linked to this wird. */
function recordWirdUrl(w: Wird): string {
  const params = new URLSearchParams({ classId: w.class_id, label: wirdRefLabel(w), wird_id: w.id });
  if (w.ref_type) {
    params.set("ref_type", w.ref_type);
    for (const k of ["surah_start", "ayah_start", "surah_end", "ayah_end", "page_start", "page_end"] as const) {
      const v = w[k];
      if (v != null) params.set(k, String(v));
    }
  }
  return `/(student)/record?${params.toString()}`;
}

export default function StudentClass() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const colors = useColors();
  const { currentProfile } = useSession();
  const { data: classes } = useStudentClasses(currentProfile.id);
  const { data: recordings, isLoading, isError, refetch } = useStudentRecordings(currentProfile.id);

  const cls = classes?.find((c) => c.id === classId) ?? null;
  const threads = buildThreads((recordings ?? []).filter((r) => r.class_id === classId));

  // --- wirds assigned to ME in this class. RLS scopes per ACCOUNT (it cannot
  // know which family profile is active), so the per-person filter lives here:
  // class-wide wirds + the ones addressed to this profile, nothing else.
  const { data: allWirds = [] } = useClassWirds(classId);
  const wirds = useMemo(
    () => allWirds.filter((w) => w.student_id === null || w.student_id === currentProfile.id),
    [allWirds, currentProfile.id]
  );
  const wirdIds = useMemo(() => wirds.map((w) => w.id), [wirds]);
  const { data: completions = [] } = useWirdCompletions(wirdIds);
  const myCompleted = useMemo(
    () => new Set(completions.filter((c) => c.student_id === currentProfile.id).map((c) => c.wird_id)),
    [completions, currentProfile.id]
  );

  return (
    <Screen scroll>
      <ScreenHeader
        title={cls?.name ?? t("studentHome.yourClass")}
        subtitle={cls?.teacher ? `${t("studentHome.teacher")}: ${cls.teacher.full_name}` : undefined}
      />

      {/* Assigned wirds */}
      {wirds.length > 0 ? (
        <>
          <AppText variant="subheading">{t("wird.section")}</AppText>
          {wirds.map((w) => {
            const status = wirdStatusFor(w.id, recordings ?? [], myCompleted.has(w.id));
            const badge = wirdBadge(status);
            const overdue = isOverdue(w.due_at) && status !== "done";
            return (
              <Card key={w.id}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <AppText variant="heading" style={{ flexShrink: 1 }}>
                    {wirdRefLabel(w)}
                  </AppText>
                  <Badge label={badge.label} status={badge.status} />
                </View>
                {w.note ? <AppText variant="body">{w.note}</AppText> : null}
                {w.due_at ? (
                  <AppText variant="caption" color={overdue ? colors.danger : colors.textMuted}>
                    {t("wird.dueLabel")}: {formatDateTime(w.due_at)}
                    {overdue ? ` · ${t("wird.overdue")}` : ""}
                  </AppText>
                ) : null}
                {status !== "done" ? (
                  <Button label={t("wird.record")} onPress={() => router.push(recordWirdUrl(w) as never)} />
                ) : null}
              </Card>
            );
          })}
        </>
      ) : null}

      <Button
        label={t("studentHome.newRecording")}
        onPress={() => router.push(`/(student)/record?classId=${classId}`)}
      />

      <AppText variant="subheading">{t("studentHome.myRecordings")}</AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : threads.length > 0 ? (
        threads.map((thread) => {
          const badge = studentBadge(thread.latest.status);
          return (
            <Pressable key={thread.rootId} onPress={() => router.push(`/(student)/thread/${thread.rootId}`)}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                  <AppText variant="heading" style={{ flexShrink: 1 }}>
                    {thread.label}
                  </AppText>
                  <Badge label={badge.label} status={badge.status} />
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  {thread.attempts.length} {t("thread.attemptsCount")}
                </AppText>
              </Card>
            </Pressable>
          );
        })
      ) : (
        <EmptyState message={t("studentClass.noRecordings")} />
      )}
    </Screen>
  );
}
