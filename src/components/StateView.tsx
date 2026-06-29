import { t } from "../i18n/ar";
import { spacing, useColors } from "../theme";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { Card } from "./Card";

/** Friendly empty state for a list/section. */
export function EmptyState({ message }: { message: string }) {
  const colors = useColors();
  return (
    <Card style={{ alignItems: "center", paddingVertical: spacing.lg }}>
      <AppText color={colors.textMuted} style={{ textAlign: "center" }}>
        {message}
      </AppText>
    </Card>
  );
}

/** Error state with an optional retry. */
export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  const colors = useColors();
  return (
    <Card style={{ alignItems: "center", gap: spacing.sm, borderColor: colors.danger }}>
      <AppText variant="title">⚠️</AppText>
      <AppText color={colors.textMuted} style={{ textAlign: "center" }}>
        {t("common.errorLoading")}
      </AppText>
      {onRetry ? <Button label={t("common.retry")} variant="secondary" onPress={onRetry} /> : null}
    </Card>
  );
}
