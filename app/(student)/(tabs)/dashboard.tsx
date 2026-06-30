import { ActivityIndicator, View } from "react-native";
import {
  AppText,
  BarList,
  Card,
  Donut,
  ErrorState,
  GenericBarList,
  LegendDot,
  Screen,
  ScreenHeader,
  StatTile,
} from "../../../src/components";
import { useStudentClasses } from "../../../src/features/classes/api";
import { useStudentRecordings } from "../../../src/features/recordings/api";
import { useSession } from "../../../src/features/session/auth";
import {
  coverageStats,
  mostRecitedSurahs,
  statusCounts,
  surahStruggleMap,
  tagFrequency,
} from "../../../src/features/stats/aggregate";
import { useStudentAnnotations } from "../../../src/features/tags/studyByTag";
import { t } from "../../../src/i18n/ar";
import { spacing, useColors } from "../../../src/theme";

export default function StudentDashboard() {
  const colors = useColors();
  const { currentProfile } = useSession();
  const { data: recordings, isLoading: recLoading, isError, refetch } = useStudentRecordings(currentProfile.id);
  const { data: classes } = useStudentClasses(currentProfile.id);
  const { data: annotations, isLoading: annLoading } = useStudentAnnotations(currentProfile.id);

  const recs = recordings ?? [];
  const sc = statusCounts(recs);
  // From the student's side, an in-progress review still reads as "pending".
  const awaiting = sc.pending + sc.inReview;
  const coverage = coverageStats(recs);
  const mostRecited = mostRecitedSurahs(recs).slice(0, 5);
  const struggleMap = surahStruggleMap(annotations ?? [], recs).slice(0, 5);
  const topMistakes = tagFrequency(annotations ?? []).slice(0, 6);

  return (
    <Screen scroll>
      <ScreenHeader title={t("dashboard.titleStudent")} />

      {recLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <>
          <View style={styles.tileRow}>
            <StatTile value={sc.total} label={t("dashboard.recordings")} />
            <StatTile value={sc.reviewed} label={t("dashboard.reviewed")} tone="accent" />
            <StatTile value={awaiting} label={t("dashboard.pending")} tone="muted" />
            <StatTile value={classes?.length ?? 0} label={t("dashboard.classes")} />
          </View>

          <Card>
            <AppText variant="heading">{t("dashboard.statusTitle")}</AppText>
            <Donut
              centerValue={sc.total}
              centerLabel={t("dashboard.recordings")}
              segments={[
                { value: sc.reviewed, color: colors.statusReviewed },
                { value: awaiting, color: colors.statusPending },
              ]}
            />
            <View style={styles.legendRow}>
              <LegendDot color={colors.statusReviewed} label={`${t("dashboard.reviewed")} (${sc.reviewed})`} />
              <LegendDot color={colors.statusPending} label={`${t("dashboard.pending")} (${awaiting})`} />
            </View>
          </Card>

          <Card>
            <AppText variant="heading">{t("dashboard.coverageTitle")}</AppText>
            <ProgressRow
              label={t("dashboard.ayahCoverage")}
              value={coverage.ayahPercent}
              detail={`${coverage.ayahsCovered} ${t("dashboard.ayahsCount")}`}
              color={colors.primary}
            />
            <ProgressRow
              label={t("dashboard.pageCoverage")}
              value={coverage.pagePercent}
              detail={`${coverage.pagesCovered} ${t("dashboard.pagesCount")}`}
              color={colors.accent}
            />
          </Card>

          <Card>
            <AppText variant="heading">{t("dashboard.mostRecited")}</AppText>
            <GenericBarList items={mostRecited} emptyText={t("dashboard.noLocationData")} />
          </Card>

          <Card>
            <AppText variant="heading">{t("dashboard.struggleMap")}</AppText>
            <GenericBarList items={struggleMap} emptyText={t("dashboard.noLocationData")} />
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

function ProgressRow({
  label,
  value,
  detail,
  color,
}: {
  label: string;
  value: number;
  detail: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressLabelRow}>
        <AppText variant="caption">{label}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {detail} · {value}%
        </AppText>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: colors.primarySoft }]}>
        <View style={[styles.progressFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
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
  progressWrap: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    gap: spacing.sm,
  },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    overflow: "hidden" as const,
  },
  progressFill: {
    position: "absolute" as const,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
  },
};
