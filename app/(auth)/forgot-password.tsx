import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { AppText, AuthHero, Button, Card, Screen, TextField } from "../../src/components";
import {
  requestPasswordReset,
  SamePasswordError,
  updatePassword,
  useAuth,
  verifyRecoveryCode,
} from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { spacing, useColors } from "../../src/theme";

/**
 * Forgot password, fully in-app: email → recovery code → new password.
 * The recovery code is SINGLE-USE: once verified (which signs the user in),
 * we never re-verify it — retries after a password error only retry the
 * password update. Each phase reports its own error.
 */
export default function ForgotPassword() {
  const router = useRouter();
  const colors = useColors();
  const { refreshProfile } = useAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // True once the code has been accepted (user is signed in from that moment).
  const verifiedRef = useRef(false);

  const onSendCode = async () => {
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      verifiedRef.current = false;
      setStep("code");
    } catch {
      setError(t("auth.errorReset"));
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!verifiedRef.current) {
        try {
          await verifyRecoveryCode(email.trim(), code);
          verifiedRef.current = true;
        } catch {
          setError(t("auth.errorCode"));
          return;
        }
      }
      try {
        await updatePassword(password);
      } catch (e) {
        setError(e instanceof SamePasswordError ? t("auth.errorSamePassword") : t("auth.errorPasswordUpdate"));
        return;
      }
      await refreshProfile();
      router.replace("/");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <AuthHero subtitle={t("auth.resetTitle")} />

      {step === "email" ? (
        <>
          <Card>
            <AppText color={colors.textMuted}>{t("auth.resetHint")}</AppText>
            <TextField
              label={t("auth.email")}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </Card>
          {error ? (
            <Card style={{ borderColor: colors.danger }}>
              <AppText color={colors.danger}>{error}</AppText>
            </Card>
          ) : null}
          <Button
            label={t("auth.sendCode")}
            onPress={onSendCode}
            loading={busy}
            disabled={!email.trim().includes("@")}
          />
        </>
      ) : (
        <>
          <Card>
            <AppText color={colors.textMuted}>
              {t("auth.codeSentTo")} {email.trim()}
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
            <TextField
              label={t("auth.newPassword")}
              value={password}
              onChangeText={setPassword}
              autoCapitalize="none"
              secureTextEntry
              placeholder={t("auth.passwordHint")}
            />
          </Card>
          {error ? (
            <Card style={{ borderColor: colors.danger }}>
              <AppText color={colors.danger}>{error}</AppText>
            </Card>
          ) : null}
          <Button
            label={t("auth.resetDo")}
            onPress={onReset}
            loading={busy}
            disabled={code.length < 6 || password.length < 6}
          />
        </>
      )}

      <Button
        label={t("auth.toSignIn")}
        variant="ghost"
        onPress={() => router.replace("/(auth)/sign-in")}
        style={{ marginTop: spacing.xs }}
      />
    </Screen>
  );
}
