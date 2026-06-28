import { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { AppText, Button, Card, Screen, TextField } from "../../src/components";
import {
  ClassMemberWithProfile,
  useClassMembers,
  useCreateClass,
  useTeacherClasses,
} from "../../src/features/classes/api";
import { useSession } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { ClassRow } from "../../src/types/database";
import { colors, radius, spacing } from "../../src/theme";

function ClassCard({ cls }: { cls: ClassRow }) {
  const { data: members, isLoading } = useClassMembers(cls.id);
  return (
    <Card>
      <AppText variant="heading">{cls.name}</AppText>
      <View
        style={{
          backgroundColor: colors.primarySoft,
          borderRadius: radius.sm,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          alignSelf: "flex-start",
        }}
      >
        <AppText variant="caption" color={colors.textMuted}>
          {t("classes.joinCode")}
        </AppText>
        <AppText variant="heading" color={colors.primary} style={{ writingDirection: "ltr" }}>
          {cls.join_code}
        </AppText>
      </View>

      <AppText variant="subheading" style={{ marginTop: spacing.sm }}>
        {t("classes.members")}
      </AppText>
      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : members && members.length > 0 ? (
        members.map((m: ClassMemberWithProfile) => (
          <AppText key={m.id} color={colors.text}>
            • {m.student.full_name}
          </AppText>
        ))
      ) : (
        <AppText color={colors.textMuted}>{t("classes.noMembers")}</AppText>
      )}
    </Card>
  );
}

export default function ManageClass() {
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
      <AppText variant="title">{t("classes.createTitle")}</AppText>
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
