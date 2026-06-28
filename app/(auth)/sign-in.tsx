import { useRouter } from "expo-router";
import { useState } from "react";
import { AppText, AuthHero, Button, Card, Screen, TextField } from "../../src/components";
import { signInWithEmail, useAuth } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { colors, spacing } from "../../src/theme";

export default function SignIn() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithEmail(email.trim(), password);
      await refreshProfile();
      router.replace("/");
    } catch {
      setError(t("auth.errorInvalid"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen scroll>
      <AuthHero subtitle={t("auth.signInTitle")} />

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
        />
      </Card>

      {error ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText color={colors.danger}>{error}</AppText>
        </Card>
      ) : null}

      <Button label={t("auth.signIn")} onPress={onSignIn} loading={busy} disabled={!email.trim() || !password} />
      <Button
        label={t("auth.toSignUp")}
        variant="ghost"
        onPress={() => router.push("/(auth)/sign-up")}
        style={{ marginTop: spacing.xs }}
      />
    </Screen>
  );
}
