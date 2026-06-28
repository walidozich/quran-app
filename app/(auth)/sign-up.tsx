import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { AppText, AuthHero, Button, Card, Screen, TextField } from "../../src/components";
import { signUpWithEmail, useAuth } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { UserRole } from "../../src/types/database";
import { colors, spacing } from "../../src/theme";

export default function SignUp() {
  const router = useRouter();
  const { refreshProfile } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSignUp = async () => {
    setError(null);
    setBusy(true);
    try {
      await signUpWithEmail(email.trim(), password, fullName.trim(), role);
      await refreshProfile();
      router.replace("/");
    } catch {
      setError(t("auth.errorSignUp"));
    } finally {
      setBusy(false);
    }
  };

  const valid = fullName.trim() && email.trim() && password.length >= 6;

  return (
    <Screen scroll>
      <AuthHero subtitle={t("auth.signUpTitle")} />

      <Card>
        <TextField label={t("auth.fullName")} value={fullName} onChangeText={setFullName} />
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

        <AppText variant="subheading">{t("auth.roleQuestion")}</AppText>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Button
            label={t("roles.student")}
            variant={role === "student" ? "primary" : "secondary"}
            onPress={() => setRole("student")}
            style={{ flex: 1 }}
          />
          <Button
            label={t("roles.teacher")}
            variant={role === "teacher" ? "primary" : "secondary"}
            onPress={() => setRole("teacher")}
            style={{ flex: 1 }}
          />
        </View>
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
