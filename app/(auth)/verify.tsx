import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { AppText, AuthHero, Button, Card, Screen, TextField } from "../../src/components";
import { resendSignUpCode, verifySignUpCode } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { spacing, useColors } from "../../src/theme";

const RESEND_COOLDOWN_S = 30;

/** Step 2 of the sign-up wizard: type the 6-digit code emailed by Supabase. */
export default function Verify() {
  const router = useRouter();
  const colors = useColors();
  const { email = "" } = useLocalSearchParams<{ email?: string }>();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const onVerify = async () => {
    setError(null);
    setInfo(null);
    setBusy(true);
    try {
      await verifySignUpCode(email, code);
      // Verified → session exists; the person's profile comes next.
      router.replace("/(auth)/profile-setup");
    } catch {
      setError(t("auth.errorCode"));
    } finally {
      setBusy(false);
    }
  };

  const onResend = async () => {
    setError(null);
    setInfo(null);
    try {
      await resendSignUpCode(email);
      setInfo(t("auth.resent"));
      setCooldown(RESEND_COOLDOWN_S);
    } catch {
      setError(t("auth.errorResend"));
    }
  };

  return (
    <Screen scroll>
      <AuthHero subtitle={t("auth.verifyTitle")} />

      <Card>
        <AppText color={colors.textMuted}>
          {t("auth.codeSentTo")} {email}
        </AppText>
        {/* Supabase's OTP length is configurable (6-10 digits) — accept them all. */}
        <TextField
          label={t("auth.codeLabel")}
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          maxLength={10}
          inputStyle={{ textAlign: "center", fontSize: 26, letterSpacing: 8 }}
        />
      </Card>

      {error ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText color={colors.danger}>{error}</AppText>
        </Card>
      ) : null}
      {info ? (
        <Card>
          <AppText color={colors.primary}>{info}</AppText>
        </Card>
      ) : null}

      <Button label={t("auth.verify")} onPress={onVerify} loading={busy} disabled={code.length < 6} />
      <Button
        label={cooldown > 0 ? `${t("auth.resend")} (${cooldown})` : t("auth.resend")}
        variant="ghost"
        onPress={onResend}
        disabled={cooldown > 0}
        style={{ marginTop: spacing.xs }}
      />
    </Screen>
  );
}
