import { ActivityIndicator, View } from "react-native";
import { AppText, Card, Screen, TagChip } from "../src/components";
import { isSupabaseConfigured } from "../src/config/supabase";
import { useSession } from "../src/features/session/DevSessionProvider";
import { RoleSwitcher } from "../src/features/session/RoleSwitcher";
import { useTags } from "../src/features/tags/useTags";
import { t } from "../src/i18n/ar";
import { colors, spacing } from "../src/theme";

function TagsFromDb() {
  const { data, isLoading, isError } = useTags();

  if (isLoading) {
    return (
      <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "center" }}>
        <ActivityIndicator color={colors.primary} />
        <AppText color={colors.textMuted}>{t("tagsState.loading")}</AppText>
      </View>
    );
  }
  if (isError) {
    return <AppText color={colors.danger}>{t("tagsState.error")}</AppText>;
  }
  if (!data || data.length === 0) {
    return <AppText color={colors.textMuted}>{t("tagsState.empty")}</AppText>;
  }
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
      {data.map((tag) => (
        <TagChip key={tag.id} label={tag.name} color={tag.color} />
      ))}
    </View>
  );
}

export default function Index() {
  const { currentProfile, role } = useSession();

  return (
    <Screen scroll>
      <AppText variant="title">{t("app.name")}</AppText>
      <AppText variant="subheading" color={colors.textMuted}>
        {t("home.tagline")}
      </AppText>

      <Card>
        <AppText variant="heading">{t("dev.title")}</AppText>
        <AppText color={colors.textMuted}>
          {t("dev.signedInAs")}: {currentProfile.full_name} ({t(`roles.${role}`)})
        </AppText>
        <RoleSwitcher />
      </Card>

      <AppText variant="subheading">{t("tagsState.title")}</AppText>
      {isSupabaseConfigured ? (
        <TagsFromDb />
      ) : (
        <Card>
          <AppText variant="heading" color={colors.warning}>
            {t("setup.needed")}
          </AppText>
          <AppText color={colors.textMuted}>{t("setup.body")}</AppText>
        </Card>
      )}
    </Screen>
  );
}
