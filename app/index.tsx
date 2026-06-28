import { View } from "react-native";
import {
  AppText,
  Badge,
  Button,
  Card,
  Screen,
  TagChip,
  TextField,
} from "../src/components";
import { t } from "../src/i18n/ar";
import { spacing } from "../src/theme";
import { useState } from "react";

const demoTags = [
  t("tags.madd"),
  t("tags.ghunnah"),
  t("tags.qalqalah"),
  t("tags.idgham"),
  t("tags.ikhfa"),
  t("tags.makhraj"),
];

export default function Index() {
  const [label, setLabel] = useState("");
  const [selected, setSelected] = useState(0);

  return (
    <Screen scroll>
      <AppText variant="title">{t("app.name")}</AppText>
      <AppText variant="subheading" color="#6B7280">
        {t("home.tagline")}
      </AppText>

      <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
        <Button label={t("demo.primaryButton")} onPress={() => {}} />
        <Button label={t("demo.secondaryButton")} variant="secondary" onPress={() => {}} />
      </View>

      <TextField
        label={t("demo.fieldLabel")}
        value={label}
        onChangeText={setLabel}
        placeholder={t("demo.fieldPlaceholder")}
      />

      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText variant="heading">{t("demo.cardTitle")}</AppText>
          <Badge label={t("status.reviewed")} status="reviewed" />
        </View>
        <AppText variant="body" color="#6B7280">
          {t("demo.cardBody")}
        </AppText>
      </Card>

      <AppText variant="subheading">{t("demo.tagsTitle")}</AppText>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {demoTags.map((tag, i) => (
          <TagChip key={tag} label={tag} selected={i === selected} onPress={() => setSelected(i)} />
        ))}
      </View>

      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
        <Badge label={t("status.pending")} status="pending" />
        <Badge label={t("status.draft")} status="draft" />
        <Badge label={t("status.reviewed")} status="reviewed" />
      </View>
    </Screen>
  );
}
