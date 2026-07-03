import { useState } from "react";
import { AppText, Button, Card, Screen, ScreenHeader, TextField } from "../src/components";
import { useAuth } from "../src/features/session/auth";
import { t } from "../src/i18n/ar";
import { useColors } from "../src/theme";
import { profileRole } from "../src/types/database";

export default function ProfileScreen() {
  const colors = useColors();
  const { profile, email, updateProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [mail, setMail] = useState(email ?? "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const onSave = async () => {
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      await updateProfile({
        fullName: fullName.trim(),
        whatsapp: whatsapp.trim() ? whatsapp.trim() : null,
        email: mail.trim() && mail.trim() !== email ? mail.trim() : undefined,
      });
      setSaved(true);
    } catch {
      setError(t("profile.error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader title={t("profile.title")} reload={false} />

      <Card>
        <TextField label={t("profile.fullName")} value={fullName} onChangeText={setFullName} />
        <TextField
          label={t("profile.email")}
          value={mail}
          onChangeText={setMail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField
          label={t("profile.whatsapp")}
          value={whatsapp}
          onChangeText={setWhatsapp}
          autoCapitalize="none"
          placeholder={t("profile.whatsappPlaceholder")}
        />
        {profile ? (
          <AppText variant="caption" color={colors.textMuted}>
            {t(`roles.${profileRole(profile)}`)}
          </AppText>
        ) : null}
      </Card>

      {error ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText color={colors.danger}>{error}</AppText>
        </Card>
      ) : null}
      {saved ? (
        <AppText color={colors.success}>{t("profile.saved")}</AppText>
      ) : null}

      <Button
        label={t("profile.save")}
        onPress={onSave}
        loading={busy}
        disabled={!fullName.trim()}
      />
    </Screen>
  );
}
