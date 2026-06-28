import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, Screen } from "../../src/components";
import { BadgeStatus } from "../../src/components/Badge";
import { useTeacherRecordings } from "../../src/features/recordings/api";
import { useSession } from "../../src/features/session/DevSessionProvider";
import { RoleSwitcher } from "../../src/features/session/RoleSwitcher";
import { t } from "../../src/i18n/ar";
import { RecordingStatus } from "../../src/types/database";
import { colors, spacing } from "../../src/theme";

function teacherBadge(status: RecordingStatus): { status: BadgeStatus; label: string } {
  if (status === "reviewed") return { status: "reviewed", label: t("status.reviewed") };
  if (status === "in_review") return { status: "draft", label: t("status.draft") };
  return { status: "pending", label: t("status.pending") };
}

export default function TeacherHome() {
  const router = useRouter();
  const { currentProfile } = useSession();
  const { data: recordings, isLoading } = useTeacherRecordings(currentProfile.id);

  return (
    <Screen scroll>
      <AppText variant="title">{t("teacherHome.title")}</AppText>
      <AppText variant="subheading" color={colors.textMuted}>
        {currentProfile.full_name}
      </AppText>

      <Button label={t("teacherHome.manageClass")} onPress={() => router.push("/(teacher)/manage-class")} />

      <AppText variant="subheading">{t("teacherHome.queue")}</AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : recordings && recordings.length > 0 ? (
        recordings.map((rec) => {
          const badge = teacherBadge(rec.status);
          return (
            <Pressable key={rec.id} onPress={() => router.push(`/(teacher)/review/${rec.id}`)}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <AppText variant="heading">{rec.label}</AppText>
                  <Badge label={badge.label} status={badge.status} />
                </View>
                <AppText variant="caption" color={colors.textMuted}>
                  {t("teacherHome.by")}: {rec.student.full_name}
                </AppText>
              </Card>
            </Pressable>
          );
        })
      ) : (
        <AppText color={colors.textMuted}>{t("teacherHome.noQueue")}</AppText>
      )}

      <Card style={{ marginTop: spacing.md }}>
        <AppText variant="heading">{t("dev.title")}</AppText>
        <RoleSwitcher />
      </Card>
    </Screen>
  );
}
