import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, Screen } from "../../src/components";
import { BadgeStatus } from "../../src/components/Badge";
import { useStudentClass } from "../../src/features/classes/api";
import { useStudentRecordings } from "../../src/features/recordings/api";
import { buildThreads } from "../../src/features/recordings/threads";
import { useAuth, useSession } from "../../src/features/session/auth";
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
  const { signOut } = useAuth();
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
        buildThreads(recordings).map((thread) => {
          const badge = studentBadge(thread.latest.status);
          return (
            <Pressable key={thread.rootId} onPress={() => router.push(`/(student)/thread/${thread.rootId}`)}>
              <Card>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <AppText variant="heading">{thread.label}</AppText>
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
        <AppText color={colors.textMuted}>{t("studentHome.noRecordings")}</AppText>
      )}

      <Button
        label={t("auth.signOut")}
        variant="ghost"
        onPress={signOut}
        style={{ marginTop: spacing.md }}
      />
    </Screen>
  );
}
