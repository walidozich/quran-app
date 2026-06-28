import { useRouter } from "expo-router";
import { ActivityIndicator } from "react-native";
import { AppText, Button, Card, Screen } from "../../src/components";
import { useStudentClass } from "../../src/features/classes/api";
import { useSession } from "../../src/features/session/DevSessionProvider";
import { RoleSwitcher } from "../../src/features/session/RoleSwitcher";
import { t } from "../../src/i18n/ar";
import { colors } from "../../src/theme";

export default function StudentHome() {
  const router = useRouter();
  const { currentProfile } = useSession();
  const { data: studentClass, isLoading } = useStudentClass(currentProfile.id);

  return (
    <Screen scroll>
      <AppText variant="title">{t("studentHome.title")}</AppText>
      <AppText variant="subheading" color={colors.textMuted}>
        {currentProfile.full_name}
      </AppText>

      <Card>
        <AppText variant="heading">{t("studentHome.yourClass")}</AppText>
        {isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : studentClass ? (
          <AppText variant="subheading" color={colors.primary}>
            {studentClass.name}
          </AppText>
        ) : (
          <AppText color={colors.textMuted}>{t("studentHome.noClass")}</AppText>
        )}
      </Card>

      <Button label={t("studentHome.joinClass")} onPress={() => router.push("/(student)/join-class")} />

      <Card>
        <AppText variant="heading">{t("dev.title")}</AppText>
        <AppText color={colors.textMuted}>{t("dev.switchRole")}</AppText>
        <RoleSwitcher />
      </Card>
    </Screen>
  );
}
