import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ayahLabel, parseDigits, Surah, SURAHS, toArabicDigits } from "../data/surahs";
import { t } from "../i18n/ar";
import { radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { TextField } from "./TextField";

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (label: string) => void;
};

export function AyahPicker({ visible, onClose, onPick }: Props) {
  const colors = useColors();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Surah | null>(null);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return SURAHS;
    return SURAHS.filter((s) => s.name.includes(q) || String(s.number) === q);
  }, [query]);

  const reset = () => {
    setQuery("");
    setSelected(null);
    setFrom("");
    setTo("");
  };
  const close = () => {
    reset();
    onClose();
  };

  const confirm = () => {
    if (!selected) return;
    const f = parseDigits(from);
    const tt = parseDigits(to);
    onPick(ayahLabel(selected, Number.isFinite(f) ? f : null, Number.isFinite(tt) ? tt : null));
    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <SafeAreaView edges={["bottom"]} style={{ gap: spacing.md }}>
            {!selected ? (
              <>
                <AppText variant="heading">{t("ayah.pick")}</AppText>
                <TextField value={query} onChangeText={setQuery} placeholder={t("ayah.search")} />
                <FlatList
                  data={results}
                  keyExtractor={(s) => String(s.number)}
                  style={{ maxHeight: 360 }}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <Pressable
                      onPress={() => setSelected(item)}
                      style={[styles.row, { borderBottomColor: colors.border }]}
                    >
                      <AppText>
                        {toArabicDigits(item.number)}. {item.name}
                      </AppText>
                      <AppText variant="caption" color={colors.textMuted}>
                        {toArabicDigits(item.ayahs)}
                      </AppText>
                    </Pressable>
                  )}
                />
                <Button label={t("common.cancel")} variant="ghost" onPress={close} />
              </>
            ) : (
              <>
                <AppText variant="heading">سورة {selected.name}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {t("ayah.wholeSurah")} — {toArabicDigits(selected.ayahs)}
                </AppText>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <TextField
                      label={t("ayah.fromAyah")}
                      value={from}
                      onChangeText={setFrom}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <TextField
                      label={t("ayah.toAyah")}
                      value={to}
                      onChangeText={setTo}
                      keyboardType="number-pad"
                      autoCapitalize="none"
                    />
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                  <Button
                    label={t("common.back")}
                    variant="ghost"
                    onPress={() => setSelected(null)}
                    style={{ flex: 1 }}
                  />
                  <Button label={t("ayah.confirm")} onPress={confirm} style={{ flex: 1 }} />
                </View>
              </>
            )}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: "90%",
    direction: "rtl",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
});
