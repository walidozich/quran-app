import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, Pressable, StyleSheet, Switch, View } from "react-native";
import { AppText, Button, Card, TextField } from "../../components";
import { t } from "../../i18n/ar";
import { radius, spacing, useColors } from "../../theme";
import { Profile, Sex } from "../../types/database";
import { AVATAR_COLOR_KEYS, AVATAR_COLORS } from "./avatar";

export type ProfileFormValues = {
  fullName: string;
  sex: Sex;
  birthDate: string; // ISO yyyy-mm-dd
  isTeacher: boolean;
  avatarColor: string;
};

type Props = {
  /** Existing profile when editing; omit for a new person. */
  initial?: Profile | null;
  submitLabel: string;
  busy?: boolean;
  onSubmit: (values: ProfileFormValues) => void;
};

const MIN_DATE = new Date(1900, 0, 1);

function toIsoDate(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString("ar", { year: "numeric", month: "long", day: "numeric" });
}

/** The person-profile form: name, sex, birth date (calendar), teach flag, tile color. */
export function ProfileForm({ initial, submitLabel, busy, onSubmit }: Props) {
  const colors = useColors();
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null);
  const [birthDate, setBirthDate] = useState<Date | null>(
    initial?.birth_date ? new Date(initial.birth_date) : null
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [isTeacher, setIsTeacher] = useState(initial?.is_teacher ?? false);
  const [avatarColor, setAvatarColor] = useState(initial?.avatar_color ?? "green");

  const submit = () => {
    if (!sex || !birthDate) return;
    onSubmit({ fullName: fullName.trim(), sex, birthDate: toIsoDate(birthDate), isTeacher, avatarColor });
  };

  const valid = fullName.trim().length > 0 && sex !== null && birthDate !== null;

  return (
    <>
      <Card>
        <TextField label={t("auth.fullName")} value={fullName} onChangeText={setFullName} />

        <AppText variant="subheading">{t("profileSetup.sex")}</AppText>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Button
            label={t("profileSetup.male")}
            variant={sex === "male" ? "primary" : "secondary"}
            onPress={() => setSex("male")}
            style={{ flex: 1 }}
          />
          <Button
            label={t("profileSetup.female")}
            variant={sex === "female" ? "primary" : "secondary"}
            onPress={() => setSex("female")}
            style={{ flex: 1 }}
          />
        </View>

        <AppText variant="subheading">{t("profileSetup.birthDate")}</AppText>
        <Pressable
          onPress={() => setPickerOpen(true)}
          style={[styles.dateField, { borderColor: colors.border, backgroundColor: colors.surface }]}
        >
          <AppText color={birthDate ? colors.text : colors.textMuted}>
            {birthDate ? formatDisplayDate(birthDate) : t("profileSetup.pickDate")}
          </AppText>
          <AppText color={colors.primary}>🗓</AppText>
        </Pressable>
        {pickerOpen ? (
          <DateTimePicker
            value={birthDate ?? new Date(2010, 0, 1)}
            mode="date"
            display={Platform.OS === "android" ? "spinner" : "default"}
            maximumDate={new Date()}
            minimumDate={MIN_DATE}
            onChange={(event, date) => {
              // Android fires once then dismisses; "dismissed" means cancelled.
              setPickerOpen(false);
              if (event.type !== "dismissed" && date) setBirthDate(date);
            }}
          />
        ) : null}

        <AppText variant="subheading">{t("profileSetup.color")}</AppText>
        <View style={styles.swatches}>
          {AVATAR_COLOR_KEYS.map((key) => (
            <Pressable
              key={key}
              onPress={() => setAvatarColor(key)}
              style={[
                styles.swatch,
                { backgroundColor: AVATAR_COLORS[key] },
                avatarColor === key ? { borderColor: colors.text, borderWidth: 3 } : null,
              ]}
            />
          ))}
        </View>

        <View style={styles.teachRow}>
          <View style={{ flex: 1 }}>
            <AppText variant="subheading">{t("profileSetup.teachToggle")}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {t("profileSetup.teachHint")}
            </AppText>
          </View>
          <Switch value={isTeacher} onValueChange={setIsTeacher} />
        </View>
      </Card>

      <Button label={submitLabel} onPress={submit} loading={busy} disabled={!valid} />
    </>
  );
}

const styles = StyleSheet.create({
  dateField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    minHeight: 62,
  },
  swatches: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  teachRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
  },
});
