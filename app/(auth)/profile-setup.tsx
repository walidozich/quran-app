import { Redirect, useRouter } from "expo-router";
import { useState } from "react";
import { AppText, AuthHero, Card, Screen } from "../../src/components";
import { createProfile } from "../../src/features/profiles/api";
import { ProfileForm, ProfileFormValues } from "../../src/features/profiles/ProfileForm";
import { useAuth } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { useColors } from "../../src/theme";

/**
 * Step 3 of the sign-up wizard: the first person-profile under the account.
 * Also reached when an account signs in without any profile (e.g. the app was
 * closed mid-wizard). Activates the new profile directly — no picker detour.
 */
export default function ProfileSetup() {
  const router = useRouter();
  const colors = useColors();
  const { session, loading, refreshProfile, activateProfile } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && !session) return <Redirect href="/(auth)/sign-in" />;

  const onSubmit = async (values: ProfileFormValues) => {
    if (!session) return;
    setError(null);
    setBusy(true);
    try {
      const created = await createProfile({
        accountId: session.user.id,
        fullName: values.fullName,
        sex: values.sex,
        birthDate: values.birthDate,
        isTeacher: values.isTeacher,
        avatarColor: values.avatarColor,
      });
      await refreshProfile();
      await activateProfile(created.id);
      router.replace("/");
    } catch {
      setError(t("profileSetup.errorCreate"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <AuthHero subtitle={t("profileSetup.title")} />
      <AppText variant="caption" color={colors.textMuted}>
        {t("profileSetup.subtitle")}
      </AppText>
      <ProfileForm submitLabel={t("profileSetup.create")} busy={busy} onSubmit={onSubmit} />
      {error ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText color={colors.danger}>{error}</AppText>
        </Card>
      ) : null}
    </Screen>
  );
}
