import { ActivityIndicator, View } from "react-native";
import {
  AppText,
  BarList,
  Card,
  Donut,
  ErrorState,
  LegendDot,
  Screen,
  ScreenHeader,
  StatTile,
} from "../../src/components";
import { useTeacherAnnotations } from "../../src/features/annotations/api";
import { useTeacherClasses } from "../../src/features/classes/api";
import { useTeacherRecordings } from "../../src/features/recordings/api";
import { useSession } from "../../src/features/session/auth";
import { statusCounts, tagFrequency } from "../../src/features/stats/aggregate";
import { t } from "../../src/i18n/ar";
import { spacing, useColors } from "../../src/theme";

export default function TeacherDashboard() {
  const colors = useColors();
  const { currentProfile } = useSession();
  const { data: recordings, isLoading: recLoading, isError, refetch } = useTeacherRecordings(currentProfile.id);
  const { data: classes } = useTeacherClasses(currentProfile.id);
  const { data: annotations, isLoading: annLoading } = useTeacherAnnotations(currentProfile.id);

  const recs = recordings ?? [];
  const sc = statusCounts(recs);
  const studentCount = new Set(recs.map((r) => r.student_id)).size;
  const topMistakes = tagFrequency(annotations ?? []).slice(0, 6);

  return (
    <Screen scroll>
      <ScreenHeader title={t("dashboard.titleTeacher")} />

      {recLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <View style={styles.tileRow}>
            <StatTile value={classes?.length ?? 0} label={t("dashboard.classes")} />
            <StatTile value={studentCount} label={t("dashboard.students")} tone="accent" />
            <StatTile value={sc.total} label={t("dashboard.recordings")} />
            <StatTile value={sc.pending} label={t("dashboard.pending")} tone="muted" />
          </View>

          <Card>
            <AppText variant="heading">{t("dashboard.statusTitle")}</AppText>
            <Donut
              centerValue={sc.total}
              centerLabel={t("dashboard.recordings")}
              segments={[
                { value: sc.reviewed, color: colors.statusReviewed },
                { value: sc.inReview, color: colors.statusDraft },
                { value: sc.pending, color: colors.statusPending },
              ]}
            />
            <View style={styles.legendRow}>
              <LegendDot color={colors.statusReviewed} label={`${t("dashboard.reviewed")} (${sc.reviewed})`} />
              <LegendDot color={colors.statusDraft} label={`${t("dashboard.inReview")} (${sc.inReview})`} />
              <LegendDot color={colors.statusPending} label={`${t("dashboard.pending")} (${sc.pending})`} />
            </View>
          </Card>

          <Card>
            <AppText variant="heading">{t("dashboard.topMistakes")}</AppText>
            {annLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <BarList items={topMistakes} emptyText={t("dashboard.noMistakes")} />
            )}
          </Card>
        </>
      )}
    </Screen>
  );
}

const styles = {
  tileRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: spacing.sm,
  },
  legendRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    justifyContent: "center" as const,
    gap: spacing.md,
    marginTop: spacing.sm,
  },
};
