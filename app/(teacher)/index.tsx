import { useRouter } from "expo-router";
import { AppText, Button, Card, Screen } from "../../src/components";
import { useSession } from "../../src/features/session/DevSessionProvider";
import { RoleSwitcher } from "../../src/features/session/RoleSwitcher";
import { t } from "../../src/i18n/ar";
import { colors } from "../../src/theme";

export default function TeacherHome() {
  const router = useRouter();
  const { currentProfile } = useSession();

  return (
    <Screen scroll>
      <AppText variant="title">{t("teacherHome.title")}</AppText>
      <AppText variant="subheading" color={colors.textMuted}>
        {currentProfile.full_name}
      </AppText>

      <Button label={t("teacherHome.manageClass")} onPress={() => router.push("/(teacher)/manage-class")} />

      <Card>
        <AppText variant="heading">{t("dev.title")}</AppText>
        <AppText color={colors.textMuted}>{t("dev.switchRole")}</AppText>
        <RoleSwitcher />
      </Card>
    </Screen>
  );
}
