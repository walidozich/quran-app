import { useRouter } from "expo-router";
import { useState } from "react";
import { AppText, AuthHero, Button, Card, Screen, TextField } from "../../src/components";
import { AuthTimeoutError, signUpWithEmail } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { spacing, useColors } from "../../src/theme";

/**
 * Step 1 of the sign-up wizard: create the auth account (email + password).
 * Person details (name, sex, birth date, teach flag) come after verification,
 * in profile-setup — the account is the family's, the profile is the person's.
 */
export default function SignUp() {
  const router = useRouter();
  const colors = useColors();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSignUp = async () => {
    setError(null);
    setBusy(true);
    try {
      const { needsVerification } = await signUpWithEmail(email.trim(), password);
      if (needsVerification) {
        router.replace(`/(auth)/verify?email=${encodeURIComponent(email.trim())}` as never);
      } else {
        // "Confirm email" disabled (dev): session exists, go straight to the profile.
        router.replace("/(auth)/profile-setup");
      }
    } catch (e) {
      setError(e instanceof AuthTimeoutError ? t("auth.errorConnection") : t("auth.errorSignUp"));
    } finally {
      setBusy(false);
    }
  };

  const valid = email.trim().includes("@") && password.length >= 6;

  return (
    <Screen scroll>
      <AuthHero subtitle={t("auth.signUpTitle")} />

      <Card>
        <TextField
          label={t("auth.email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextField
          label={t("auth.password")}
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

      <Button label={t("auth.signUp")} onPress={onSignUp} loading={busy} disabled={!valid} />
      <Button
        label={t("auth.toSignIn")}
        variant="ghost"
        onPress={() => router.replace("/(auth)/sign-in")}
        style={{ marginTop: spacing.xs }}
      />
    </Screen>
  );
}
