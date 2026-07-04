import * as Clipboard from "expo-clipboard";
import { useState } from "react";
import { ActivityIndicator, Alert, Pressable, View } from "react-native";
import { AppText, Badge, Button, Card, Screen, ScreenHeader, TextField } from "../../src/components";
import {
  ClassMemberWithProfile,
  TeachingClass,
  useClassMembers,
  useCoTeachers,
  useCreateClass,
  useDeleteClass,
  useJoinAsTeacher,
  useRemoveCoTeacher,
  useRemoveMember,
  useRenameClass,
  useTeacherClasses,
  useTeacherCode,
} from "../../src/features/classes/api";
import { useSession } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { radius, spacing, useColors } from "../../src/theme";

/** A copyable code chip (students' join code / teachers' secret code). */
function CodeChip({ label, code, hint }: { label: string; code: string; hint?: string }) {
  const colors = useColors();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await Clipboard.setStringAsync(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <Pressable
      onPress={copy}
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
          {label}
        </AppText>
        <AppText variant="heading" color={colors.primary} style={{ writingDirection: "ltr" }}>
          {code}
        </AppText>
        {hint ? (
          <AppText variant="caption" color={colors.textMuted}>
            {hint}
          </AppText>
        ) : null}
      </View>
      <AppText variant="caption" color={copied ? colors.success : colors.primary}>
        {copied ? t("classes.copied") : `⧉ ${t("classes.copyCode")}`}
      </AppText>
    </Pressable>
  );
}

function ClassCard({ cls }: { cls: TeachingClass }) {
  const colors = useColors();
  const { currentProfile } = useSession();
  const { data: members, isLoading } = useClassMembers(cls.id);
  const { data: teacherCode } = useTeacherCode(cls.id, cls.is_owner);
  const { data: coTeachers = [] } = useCoTeachers(cls.id);
  const rename = useRenameClass(currentProfile.id);
  const del = useDeleteClass(currentProfile.id);
  const removeMember = useRemoveMember(cls.id);
  const removeCoTeacher = useRemoveCoTeacher(cls.id);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(cls.name);

  const myCoTeacherRow = coTeachers.find((ct) => ct.teacher.id === currentProfile.id) ?? null;

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

  const confirmRemoveCoTeacher = (rowId: string) =>
    Alert.alert(t("classes.removeCoTeacher"), t("classes.removeCoTeacherConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      { text: t("classes.removeCoTeacher"), style: "destructive", onPress: () => removeCoTeacher.mutate(rowId) },
    ]);

  const confirmLeave = () => {
    if (!myCoTeacherRow) return;
    Alert.alert(t("classes.leaveTeaching"), t("classes.leaveTeachingConfirm"), [
      { text: t("common.cancel"), style: "cancel" },
      {
        text: t("classes.leaveTeaching"),
        style: "destructive",
        onPress: () => removeCoTeacher.mutate(myCoTeacherRow.id),
      },
    ]);
  };

  return (
    <Card>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        {editing ? (
          <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end", flex: 1 }}>
            <View style={{ flex: 1 }}>
              <TextField value={name} onChangeText={setName} />
            </View>
            <Button label={t("manage.saveName")} onPress={saveName} loading={rename.isPending} />
          </View>
        ) : (
          <AppText variant="heading" style={{ flexShrink: 1 }}>
            {cls.name}
          </AppText>
        )}
        <Badge
          label={cls.is_owner ? t("classes.owner") : t("classes.coTeacherBadge")}
          status={cls.is_owner ? "reviewed" : "draft"}
        />
      </View>

      <CodeChip label={t("classes.joinCode")} code={cls.join_code} />
      {cls.is_owner && teacherCode ? (
        <CodeChip label={t("classes.teacherCode")} code={teacherCode} hint={t("classes.teacherCodeHint")} />
      ) : null}

      {cls.is_owner ? (
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
      ) : null}

      {/* Co-teachers */}
      <AppText variant="subheading" style={{ marginTop: spacing.sm }}>
        {t("classes.coTeachers")}
      </AppText>
      {coTeachers.length > 0 ? (
        coTeachers.map((ct) => (
          <View
            key={ct.id}
            style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}
          >
            <AppText color={colors.text}>• {ct.teacher.full_name}</AppText>
            {cls.is_owner ? (
              <Pressable onPress={() => confirmRemoveCoTeacher(ct.id)} hitSlop={8}>
                <AppText variant="caption" color={colors.danger}>
                  {t("classes.removeCoTeacher")}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ))
      ) : (
        <AppText color={colors.textMuted}>{t("classes.noCoTeachers")}</AppText>
      )}

      {/* Students */}
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
            {cls.is_owner ? (
              <Pressable onPress={() => confirmRemove(m.student.id)} hitSlop={8}>
                <AppText variant="caption" color={colors.danger}>
                  {t("manage.removeStudent")}
                </AppText>
              </Pressable>
            ) : null}
          </View>
        ))
      ) : (
        <AppText color={colors.textMuted}>{t("classes.noMembers")}</AppText>
      )}

      {!cls.is_owner && myCoTeacherRow ? (
        <Button
          label={t("classes.leaveTeaching")}
          variant="ghost"
          onPress={confirmLeave}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </Card>
  );
}

export default function ManageClass() {
  const colors = useColors();
  const { currentProfile } = useSession();
  const [name, setName] = useState("");
  const [teacherJoinCode, setTeacherJoinCode] = useState("");
  const [joinError, setJoinError] = useState<string | null>(null);
  const createClass = useCreateClass(currentProfile.id);
  const joinAsTeacher = useJoinAsTeacher(currentProfile.id);
  const { data: classes, isLoading } = useTeacherClasses(currentProfile.id);

  const onCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    createClass.mutate(trimmed, { onSuccess: () => setName("") });
  };

  const onJoinAsTeacher = () => {
    const code = teacherJoinCode.trim();
    if (!code) return;
    setJoinError(null);
    joinAsTeacher.mutate(code, {
      onSuccess: () => setTeacherJoinCode(""),
      onError: () => setJoinError(t("classes.errorTeacherCode")),
    });
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

      {/* Join an existing class as a co-teacher */}
      <Card style={{ marginTop: spacing.md }}>
        <AppText variant="subheading">{t("classes.joinAsTeacher")}</AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {t("classes.joinAsTeacherHint")}
        </AppText>
        <View style={{ flexDirection: "row", gap: spacing.sm, alignItems: "flex-end" }}>
          <View style={{ flex: 1 }}>
            <TextField value={teacherJoinCode} onChangeText={setTeacherJoinCode} autoCapitalize="none" />
          </View>
          <Button
            label={t("classes.joinTeacher")}
            onPress={onJoinAsTeacher}
            loading={joinAsTeacher.isPending}
            disabled={!teacherJoinCode.trim()}
          />
        </View>
        {joinError ? <AppText color={colors.danger}>{joinError}</AppText> : null}
      </Card>

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
