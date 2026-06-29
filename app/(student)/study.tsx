import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AppText, Card, ErrorState, Screen, ScreenHeader, TagChip } from "../../src/components";
import { AnnotationCard } from "../../src/features/annotations/AnnotationCard";
import { AnnotationWithTags } from "../../src/features/annotations/api";
import { useStudentAnnotations } from "../../src/features/tags/studyByTag";
import { useSession } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { Tag } from "../../src/types/database";
import { spacing, useColors } from "../../src/theme";

export default function StudyByTag() {
  const router = useRouter();
  const colors = useColors();
  const { currentProfile } = useSession();
  const { data: results, isLoading, isError, refetch } = useStudentAnnotations(currentProfile.id);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);

  const allTags = useMemo<Tag[]>(() => {
    const map = new Map<string, Tag>();
    (results ?? []).forEach((a) => a.tags.forEach((tg) => map.set(tg.id, tg)));
    return [...map.values()];
  }, [results]);

  const filtered = useMemo(
    () => (selectedTagId ? (results ?? []).filter((a) => a.tags.some((tg) => tg.id === selectedTagId)) : []),
    [results, selectedTagId]
  );

  return (
    <Screen scroll>
      <ScreenHeader title={t("study.title")} />

      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : allTags.length === 0 ? (
        <Card>
          <AppText color={colors.textMuted}>{t("study.noTags")}</AppText>
        </Card>
      ) : (
        <>
          <AppText variant="subheading" color={colors.textMuted}>
            {t("study.pickTag")}
          </AppText>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {allTags.map((tg) => (
              <TagChip
                key={tg.id}
                label={tg.name}
                color={tg.color}
                selected={selectedTagId === tg.id}
                onPress={() => setSelectedTagId(tg.id)}
              />
            ))}
          </View>

          {selectedTagId ? (
            filtered.length > 0 ? (
              filtered.map((a) => (
                <View key={a.id} style={{ gap: spacing.xs }}>
                  <AppText variant="caption" color={colors.textMuted}>
                    {t("study.inRecording")}: {a.recording.label}
                  </AppText>
                  <AnnotationCard
                    annotation={a as AnnotationWithTags}
                    onJump={(ms) => router.push(`/(student)/recording/${a.recording.id}?at=${ms}`)}
                  />
                </View>
              ))
            ) : (
              <AppText color={colors.textMuted}>{t("study.noResults")}</AppText>
            )
          ) : null}
        </>
      )}
    </Screen>
  );
}
