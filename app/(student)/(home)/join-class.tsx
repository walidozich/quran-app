import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { AppText, Button, Card, Screen, ScreenHeader, TextField } from "../../../src/components";
import { ClassPreview, lookupClassByCode, useJoinClass } from "../../../src/features/classes/api";
import { oppositeSexWarning } from "../../../src/features/profiles/constraints";
import { useSession } from "../../../src/features/session/auth";
import { t } from "../../../src/i18n/ar";
import { useColors } from "../../../src/theme";

export default function JoinClass() {
  const router = useRouter();
  const colors = useColors();
  const { currentProfile } = useSession();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [looking, setLooking] = useState(false);
  const join = useJoinClass(currentProfile.id);

  const doJoin = (cls: ClassPreview) => {
    join.mutate(cls, {
      onSuccess: () => router.back(),
      onError: () => setError(t("classes.errorGeneric")),
    });
  };

  const onJoin = async () => {
    const trimmed = code.trim();
    if (!trimmed) return;
    setError(null);
    setLooking(true);
    try {
      const cls = await lookupClassByCode(trimmed);
      if (!cls) {
        setError(t("classes.errorNotFound"));
        return;
      }
      // The DB blocks this too (RLS) — surface a clear message instead.
      if (cls.teacher_id === currentProfile.id) {
        setError(t("classes.errorOwnClass"));
        return;
      }
      // Soft guideline (spec.md §15): an adult joining an opposite-sex
      // teacher's class gets a warning, and may still proceed.
      if (cls.teacher && oppositeSexWarning(currentProfile, cls.teacher.sex)) {
        Alert.alert(
          t("joinWarning.title"),
          cls.teacher.sex === "male" ? t("joinWarning.maleTeacher") : t("joinWarning.femaleTeacher"),
          [
            { text: t("common.cancel"), style: "cancel" },
            { text: t("joinWarning.proceed"), style: "default", onPress: () => doJoin(cls) },
          ]
        );
        return;
      }
      doJoin(cls);
    } catch {
      setError(t("classes.errorGeneric"));
    } finally {
      setLooking(false);
    }
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
        loading={looking || join.isPending}
        disabled={!code.trim()}
      />
    </Screen>
  );
}
