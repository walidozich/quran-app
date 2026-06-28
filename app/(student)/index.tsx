import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, Screen } from "../../src/components";
import { BadgeStatus } from "../../src/components/Badge";
import { useStudentClass } from "../../src/features/classes/api";
import { useStudentRecordings } from "../../src/features/recordings/api";
import { useSession } from "../../src/features/session/DevSessionProvider";
import { RoleSwitcher } from "../../src/features/session/RoleSwitcher";
import { t } from "../../src/i18n/ar";
import { RecordingStatus } from "../../src/types/database";
import { colors, spacing } from "../../src/theme";

// From the student's view, an in-progress (draft) review still reads as "pending".
function studentBadge(status: RecordingStatus): { status: BadgeStatus; label: string } {
  if (status === "reviewed") return { status: "reviewed", label: t("status.reviewed") };
  return { status: "pending", label: t("status.pending") };
}

export default function StudentHome() {
  const router = useRouter();
  const { currentProfile } = useSession();
  const { data: studentClass, isLoading: classLoading } = useStudentClass(currentProfile.id);
  const { data: recordings, isLoading: recLoading } = useStudentRecordings(currentProfile.id);

  return (
    <Screen scroll>
      <AppText variant="title">{t("studentHome.title")}</AppText>
      <AppText variant="subheading" color={colors.textMuted}>
        {currentProfile.full_name}
      </AppText>

      <Card>
        <AppText variant="heading">{t("studentHome.yourClass")}</AppText>
        {classLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : studentClass ? (
          <AppText variant="subheading" color={colors.primary}>
            {studentClass.name}
          </AppText>
        ) : (
          <AppText color={colors.textMuted}>{t("studentHome.noClass")}</AppText>
        )}
      </Card>

      {studentClass ? (
        <Button label={t("studentHome.newRecording")} onPress={() => router.push("/(student)/record")} />
      ) : (
        <Button label={t("studentHome.joinClass")} onPress={() => router.push("/(student)/join-class")} />
      )}
      <Button
        label={t("studentHome.studyByTag")}
        variant="secondary"
        onPress={() => router.push("/(student)/study")}
      />

      <AppText variant="subheading">{t("studentHome.myRecordings")}</AppText>
      {recLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : recordings && recordings.length > 0 ? (
        recordings.map((rec) => {
          const badge = studentBadge(rec.status);
          return (
            <Pressable key={rec.id} onPress={() => router.push(`/(student)/recording/${rec.id}`)}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <AppText variant="heading">{rec.label}</AppText>
                  <Badge label={badge.label} status={badge.status} />
                </View>
              </Card>
            </Pressable>
          );
        })
      ) : (
        <AppText color={colors.textMuted}>{t("studentHome.noRecordings")}</AppText>
      )}

      <Card style={{ marginTop: spacing.md }}>
        <AppText variant="heading">{t("dev.title")}</AppText>
        <RoleSwitcher />
      </Card>
    </Screen>
  );
}
