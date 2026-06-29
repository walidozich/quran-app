import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { AppText, Button, Card, Screen, ScreenHeader, TextField } from "../../src/components";
import {
  ClassMemberWithProfile,
  useClassMembers,
  useCreateClass,
  useDeleteClass,
  useRemoveMember,
  useRenameClass,
  useTeacherClasses,
} from "../../src/features/classes/api";
import { useSession } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { ClassRow } from "../../src/types/database";
import { radius, spacing, useColors } from "../../src/theme";

function ClassCard({ cls }: { cls: ClassRow }) {
  const colors = useColors();
  const { currentProfile } = useSession();
  const { data: members, isLoading } = useClassMembers(cls.id);
  const rename = useRenameClass(currentProfile.id);
  const del = useDeleteClass(currentProfile.id);
  const removeMember = useRemoveMember(cls.id);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cls.name);
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    await Clipboard.setStringAsync(cls.join_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const saveName = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    rename.mutate({ classId: cls.id, name: trimmed }, { onSuccess: () => setEditing(false) });
  };

  const confirmDelete = () =>
    Alert.alert(t("manage.deleteClass"), t("manage.deleteClassConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("manage.deleteClass"), style: "destructive", onPress: () => del.mutate(cls.id) },
    ]);

  const confirmRemove = (studentId: string) =>
    Alert.alert(t("manage.removeStudent"), t("manage.removeStudentConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("manage.removeStudent"), style: "destructive", onPress: () => removeMember.mutate(studentId) },
    ]);

  return (
    <Card>
      {editing ? (
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <TextField value={name} onChangeText={setName} />
          </View>
          <Button label={t("manage.saveName")} onPress={saveName} loading={rename.isPending} />
        </View>
      ) : (
        <AppText variant="heading">{cls.name}</AppText>
      )}

      <Pressable
        onPress={copyCode}
        style={{
          backgroundColor: colors.primarySoft,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          alignSelf: "flex-start",
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.md,
        }}
      >
        <View>
          <AppText variant="caption" color={colors.textMuted}>
            {t("classes.joinCode")}
          </AppText>
          <AppText variant="heading" color={colors.primary} style={{ writingDirection: "ltr" }}>
            {cls.join_code}
          </AppText>
        </View>
        <AppText variant="caption" color={copied ? colors.success : colors.primary}>
          {copied ? t("classes.copied") : `⧉ ${t("classes.copyCode")}`}
        </AppText>
      </Pressable>

      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <Pressable onPress={() => setEditing((e) => !e)} hitSlop={6}>
          <AppText variant="caption" color={colors.primary}>
            ✎ {t("manage.rename")}
          </AppText>
        </Pressable>
        <Pressable onPress={confirmDelete} hitSlop={6}>
          <AppText variant="caption" color={colors.danger}>
            🗑 {t("manage.deleteClass")}
          </AppText>
        </Pressable>
      </View>

      <AppText variant="subheading" style={{ marginTop: spacing.sm }}>
        {t("classes.members")}
      </AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : members && members.length > 0 ? (
        members.map((m: ClassMemberWithProfile) => (
          <View
            key={m.id}
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <AppText color={colors.text}>• {m.student.full_name}</AppText>
            <Pressable onPress={() => confirmRemove(m.student.id)} hitSlop={8}>
              <AppText variant="caption" color={colors.danger}>
                {t("manage.removeStudent")}
              </AppText>
            </Pressable>
          </View>
        ))
      ) : (
        <AppText color={colors.textMuted}>{t("classes.noMembers")}</AppText>
      )}
    </Card>
  );
}

export default function ManageClass() {
  const colors = useColors();
  const { currentProfile } = useSession();
  const [name, setName] = useState("");
  const createClass = useCreateClass(currentProfile.id);
  const { data: classes, isLoading } = useTeacherClasses(currentProfile.id);

  const onCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createClass.mutate(trimmed, { onSuccess: () => setName("") });
  };

  return (
    <Screen scroll>
      <ScreenHeader title={t("classes.createTitle")} />
      <TextField
        label={t("classes.nameLabel")}
        value={name}
        onChangeText={setName}
        placeholder={t("classes.namePlaceholder")}
      />
      <Button
        label={t("classes.create")}
        onPress={onCreate}
        loading={createClass.isPending}
        disabled={!name.trim()}
      />

      <AppText variant="subheading" style={{ marginTop: spacing.md }}>
        {t("classes.myClasses")}
      </AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : classes && classes.length > 0 ? (
        classes.map((cls) => <ClassCard key={cls.id} cls={cls} />)
      ) : (
        <AppText color={colors.textMuted}>{t("classes.noClasses")}</AppText>
      )}
    </Screen>
  );
}
