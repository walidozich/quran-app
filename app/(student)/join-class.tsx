import { useRouter } from "expo-router";
import { useState } from "react";
import { AppText, Button, Card, Screen, ScreenHeader, TextField } from "../../src/components";
import { JoinClassError, useJoinClass } from "../../src/features/classes/api";
import { useSession } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { colors } from "../../src/theme";

export default function JoinClass() {
  const router = useRouter();
  const { currentProfile } = useSession();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const join = useJoinClass(currentProfile.id);

  const onJoin = () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    join.mutate(trimmed, {
      onSuccess: () => router.back(),
      onError: (e) =>
        setError(e instanceof JoinClassError ? t("classes.errorNotFound") : t("classes.errorGeneric")),
    });
  };

  return (
    <Screen scroll>
      <ScreenHeader title={t("classes.joinTitle")} reload={false} />
      <TextField
        label={t("classes.codeLabel")}
        value={code}
        onChangeText={setCode}
        placeholder={t("classes.codePlaceholder")}
        autoCapitalize="none"
      />
      {error ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText color={colors.danger}>{error}</AppText>
        </Card>
      ) : null}
      <Button
        label={t("classes.join")}
        onPress={onJoin}
        loading={join.isPending}
        disabled={!code.trim()}
      />
    </Screen>
  );
}
