import { useState } from "react";
import { Pressable, StyleSheet, Switch, View } from "react-native";
import { AppText, Button, Card, TextField } from "../../components";
import { t } from "../../i18n/ar";
import { spacing, useColors } from "../../theme";
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

/** The person-profile form: name, sex, birth date, teach flag, tile color. */
export function ProfileForm({ initial, submitLabel, busy, onSubmit }: Props) {
  const colors = useColors();
  const init = initial?.birth_date ? new Date(initial.birth_date) : null;
  const [fullName, setFullName] = useState(initial?.full_name ?? "");
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null);
  const [day, setDay] = useState(init ? String(init.getUTCDate()) : "");
  const [month, setMonth] = useState(init ? String(init.getUTCMonth() + 1) : "");
  const [year, setYear] = useState(init ? String(init.getUTCFullYear()) : "");
  const [isTeacher, setIsTeacher] = useState(initial?.is_teacher ?? false);
  const [avatarColor, setAvatarColor] = useState(initial?.avatar_color ?? "green");
  const [error, setError] = useState<string | null>(null);

  const birthDate = (): string | null => {
    const d = Number(day);
    const m = Number(month);
    const y = Number(year);
    if (!d || !m || !y || y < 1900 || y > new Date().getFullYear()) return null;
    const date = new Date(Date.UTC(y, m - 1, d));
    // Reject overflowed dates like 31/02.
    if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
    if (date.getTime() > Date.now()) return null;
    return date.toISOString().slice(0, 10);
  };

  const submit = () => {
    const bd = birthDate();
    if (!bd) {
      setError(t("profileSetup.errorDate"));
      return;
    }
    if (!sex) return;
    setError(null);
    onSubmit({ fullName: fullName.trim(), sex, birthDate: bd, isTeacher, avatarColor });
  };

  const valid = fullName.trim().length > 0 && sex !== null && day && month && year.length === 4;

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
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <TextField
              label={t("profileSetup.day")}
              value={day}
              onChangeText={(v) => setDay(v.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={2}
              inputStyle={{ textAlign: "center" }}
            />
          </View>
          <View style={{ flex: 1 }}>
            <TextField
              label={t("profileSetup.month")}
              value={month}
              onChangeText={(v) => setMonth(v.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={2}
              inputStyle={{ textAlign: "center" }}
            />
          </View>
          <View style={{ flex: 1.4 }}>
            <TextField
              label={t("profileSetup.year")}
              value={year}
              onChangeText={(v) => setYear(v.replace(/[^0-9]/g, ""))}
              keyboardType="number-pad"
              maxLength={4}
              inputStyle={{ textAlign: "center" }}
            />
          </View>
        </View>

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

      {error ? (
        <Card style={{ borderColor: colors.danger }}>
          <AppText color={colors.danger}>{error}</AppText>
        </Card>
      ) : null}

      <Button label={submitLabel} onPress={submit} loading={busy} disabled={!valid} />
    </>
  );
}

const styles = StyleSheet.create({
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
