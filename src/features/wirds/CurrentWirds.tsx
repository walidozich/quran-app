import { useRouter } from "expo-router";
import { useMemo } from "react";
import { View } from "react-native";
import { AppText, Badge, Button, Card } from "../../components";
import { t } from "../../i18n/ar";
import { spacing, useColors } from "../../theme";
import { Recording, Wird, WirdCompletion } from "../../types/database";
import { isOverdue, recordWirdUrl, wirdRefLabel, wirdStatusFor, WirdStatus } from "./format";

type Props = {
  wirds: Wird[];
  recordings: Recording[];
  completions: WirdCompletion[];
  /** class_id → class name, for the small context line. */
  classNames: Map<string, string>;
  profileId: string;
};

const MAX_CARDS = 3;

/**
 * "وِردُك الحالي" — the dashboard's lead section (spec.md §17). One card per
 * active wird with ONE primary action that does the right next thing:
 * record attempt 1, view the pending attempt, or listen + record the next attempt.
 */
export function CurrentWirds({ wirds, recordings, completions, classNames, profileId }: Props) {
  const router = useRouter();
  const colors = useColors();

  const active = useMemo(() => {
    const mine = new Set(completions.filter((c) => c.student_id === profileId).map((c) => c.wird_id));
    return wirds
      // Defense in depth: only class-wide wirds or the ones addressed to me.
      .filter((w) => w.student_id === null || w.student_id === profileId)
      .map((w) => ({ w, status: wirdStatusFor(w.id, recordings, mine.has(w.id)) }))
      .filter((x) => x.status !== "done")
      .sort((a, b) => {
        // Due first (earliest), then newest.
        if (a.w.due_at && b.w.due_at) return a.w.due_at.localeCompare(b.w.due_at);
        if (a.w.due_at) return -1;
        if (b.w.due_at) return 1;
        return b.w.created_at.localeCompare(a.w.created_at);
      })
      .slice(0, MAX_CARDS);
  }, [wirds, recordings, completions, profileId]);

  if (wirds.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText variant="heading">{t("wird.currentSection")}</AppText>
      {active.length === 0 ? (
        <Card style={{ borderColor: colors.success }}>
          <AppText color={colors.success}>{t("wird.allDone")} ✓</AppText>
        </Card>
      ) : (
        active.map(({ w, status }) => (
          <WirdCard key={w.id} wird={w} status={status} className={classNames.get(w.class_id)} recordings={recordings} />
        ))
      )}
    </View>
  );
}

function WirdCard({
  wird,
  status,
  className,
  recordings,
}: {
  wird: Wird;
  status: WirdStatus;
  className?: string;
  recordings: Recording[];
}) {
  const router = useRouter();
  const colors = useColors();

  const linked = recordings
    .filter((r) => r.wird_id === wird.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  const latest = linked[0] ?? null;
  const attemptNo = linked.length;
  const overdue = isOverdue(wird.due_at) && status !== "done";

  const openLatest = () => latest && router.push(`/(student)/recording/${latest.id}` as never);

  return (
    <Card style={status === "reviewed" ? { borderColor: colors.accent } : undefined}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <AppText variant="heading" color={colors.primary} style={{ flexShrink: 1 }}>
          {wirdRefLabel(wird)}
        </AppText>
        {overdue ? <Badge label={t("wird.overdue")} status="pending" /> : null}
      </View>
      <AppText variant="caption" color={colors.textMuted}>
        {className ? `${className} · ` : ""}
        {attemptNo > 0 ? `${t("wird.attempt")} ${attemptNo} · ` : ""}
        {status === "new"
          ? t("wird.statusNew")
          : status === "submitted"
            ? t("wird.statusAwaiting")
            : t("wird.statusCorrected")}
      </AppText>
      {wird.note ? <AppText variant="body">{wird.note}</AppText> : null}

      {status === "new" ? (
        <Button label={`🎤 ${t("wird.recordNow")}`} onPress={() => router.push(recordWirdUrl(wird) as never)} />
      ) : null}
      {status === "submitted" ? (
        <Button label={t("wird.viewAttempt")} variant="secondary" onPress={openLatest} />
      ) : null}
      {status === "reviewed" ? (
        <View style={{ gap: spacing.sm }}>
          <Button label={`🎧 ${t("wird.listenCorrection")}`} onPress={openLatest} />
          <Button
            label={`🎤 ${t("wird.nextAttempt")}`}
            variant="secondary"
            onPress={() => router.push(recordWirdUrl(wird, latest?.id) as never)}
          />
        </View>
      ) : null}
    </Card>
  );
}
