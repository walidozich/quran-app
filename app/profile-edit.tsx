import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, View } from "react-native";
import { AppText, Button, Card, Screen, ScreenHeader, TextField } from "../src/components";
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

  // Deleting a person erases everything about them — the confirmation
  // requires TYPING the profile's exact name so it can never be a slip.
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteName, setDeleteName] = useState("");
  const deleteMatches = editing != null && deleteName.trim() === editing.full_name.trim();

  const onDelete = async () => {
    if (!editing || !deleteMatches) return;
    setBusy(true);
    try {
      await deleteProfileById(editing.id);
      setDeleteOpen(false);
      if (active?.id === editing.id) deactivateProfile();
      await refreshProfile();
      router.back();
    } catch {
      setDeleteOpen(false);
      setError(t("profileEdit.errorDelete"));
    } finally {
      setBusy(false);
    }
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
          onPress={() => {
            setDeleteName("");
            setDeleteOpen(true);
          }}
          style={{ marginTop: spacing.md }}
        />
      ) : null}

      {/* Type-the-name deletion confirmation */}
      <Modal visible={deleteOpen} transparent animationType="fade" onRequestClose={() => setDeleteOpen(false)}>
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "center",
            padding: spacing.lg,
          }}
        >
          <Card style={{ borderColor: colors.danger }}>
            <AppText variant="heading" color={colors.danger}>
              {t("profileEdit.deleteConfirmTitle")}
            </AppText>
            <AppText color={colors.text}>{t("profileEdit.deleteConfirmBody")}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {t("profileEdit.deleteTypeHint")} "{editing?.full_name}"
            </AppText>
            <TextField value={deleteName} onChangeText={setDeleteName} autoCapitalize="none" />
            <View style={{ flexDirection: "row", gap: spacing.sm }}>
              <Button
                label={t("common.cancel")}
                variant="ghost"
                onPress={() => setDeleteOpen(false)}
                style={{ flex: 1 }}
              />
              <Button
                label={t("profileEdit.deleteConfirm")}
                onPress={onDelete}
                loading={busy}
                disabled={!deleteMatches}
                style={{ flex: 1 }}
              />
            </View>
          </Card>
        </View>
      </Modal>
    </Screen>
  );
}
