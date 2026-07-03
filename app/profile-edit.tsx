import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Alert } from "react-native";
import { AppText, Button, Card, Screen, ScreenHeader } from "../src/components";
import {
  createProfile,
  deleteProfileById,
  updateProfileById,
} from "../src/features/profiles/api";
import { ProfileForm, ProfileFormValues } from "../src/features/profiles/ProfileForm";
import { useAuth } from "../src/features/session/auth";
import { t } from "../src/i18n/ar";
import { spacing, useColors } from "../src/theme";

/** Add a family member (no id param) or edit one (id param). Reached from the picker. */
export default function ProfileEdit() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { session, loading, profiles, profile: active, refreshProfile, deactivateProfile } = useAuth();
  const editing = id ? profiles.find((p) => p.id === id) ?? null : null;
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!loading && !session) return <Redirect href="/(auth)/sign-in" />;

  const onSubmit = async (values: ProfileFormValues) => {
    if (!session) return;
    setError(null);
    setBusy(true);
    try {
      if (editing) {
        await updateProfileById(editing.id, {
          full_name: values.fullName,
          sex: values.sex,
          birth_date: values.birthDate,
          is_teacher: values.isTeacher,
          avatar_color: values.avatarColor,
        });
      } else {
        await createProfile({
          accountId: session.user.id,
          fullName: values.fullName,
          sex: values.sex,
          birthDate: values.birthDate,
          isTeacher: values.isTeacher,
          avatarColor: values.avatarColor,
        });
      }
      await refreshProfile();
      router.back();
    } catch {
      setError(t("profileEdit.errorSave"));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = () => {
    if (!editing) return;
    Alert.alert(t("profileEdit.deleteConfirmTitle"), t("profileEdit.deleteConfirmBody"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("profileEdit.deleteConfirm"),
        style: "destructive",
        onPress: async () => {
          setBusy(true);
          try {
            await deleteProfileById(editing.id);
            if (active?.id === editing.id) deactivateProfile();
            await refreshProfile();
            router.back();
          } catch {
            setError(t("profileEdit.errorDelete"));
          } finally {
            setBusy(false);
          }
        },
      },
    ]);
  };

  return (
    <Screen scroll>
      <ScreenHeader
        title={editing ? t("profileEdit.editTitle") : t("profileEdit.addTitle")}
        bell={false}
        reload={false}
      />
      <ProfileForm
        initial={editing}
        submitLabel={editing ? t("profileEdit.save") : t("profileEdit.add")}
        busy={busy}
        onSubmit={onSubmit}
      />
      {error ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText color={colors.danger}>{error}</AppText>
        </Card>
      ) : null}
      {editing ? (
        <Button
          label={t("profileEdit.delete")}
          variant="ghost"
          onPress={onDelete}
          style={{ marginTop: spacing.md }}
        />
      ) : null}
    </Screen>
  );
}
