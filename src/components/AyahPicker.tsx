import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ayahRangeLabel, pageRangeLabel, QURAN_PAGES, SURAHS } from "../data/surahs";
import type { Surah } from "../data/surahs";
import { t } from "../i18n/ar";
import { ColorScheme, radius, spacing, useColors } from "../theme";
import type { RecordingReference } from "../types/database";
import { AppText } from "./AppText";
import { Button } from "./Button";
import { TextField } from "./TextField";

export type PickedQuranReference = RecordingReference & { label: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (reference: PickedQuranReference) => void;
};

type Mode = "ayah" | "page";
type Sub = null | "startSurah" | "startAyah" | "endSurah" | "endAyah" | "startPage" | "endPage";

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

/** Pad a list with nulls so the last grid row keeps uniform cell widths. */
function padToCols(items: number[], cols: number): (number | null)[] {
  const rem = items.length % cols;
  if (rem === 0) return items;
  return [...items, ...Array<null>(cols - rem).fill(null)];
}

export function AyahPicker({ visible, onClose, onPick }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [mode, setMode] = useState<Mode>("ayah");
  const [startSurah, setStartSurah] = useState<Surah | null>(null);
  const [startAyah, setStartAyah] = useState<number | null>(null);
  const [endSurah, setEndSurah] = useState<Surah | null>(null);
  const [endAyah, setEndAyah] = useState<number | null>(null);
  const [startPage, setStartPage] = useState<number | null>(null);
  const [endPage, setEndPage] = useState<number | null>(null);
  const [sub, setSub] = useState<Sub>(null);
  const [query, setQuery] = useState("");

  const reset = () => {
    setMode("ayah");
    setStartSurah(null);
    setStartAyah(null);
    setEndSurah(null);
    setEndAyah(null);
    setStartPage(null);
    setEndPage(null);
    setSub(null);
    setQuery("");
  };
  const close = () => {
    reset();
    onClose();
  };

  // Surah list for the active sub-picker — the *end* surah can't precede the start.
  const surahResults = useMemo(() => {
    const q = query.trim();
    let list: Surah[] = SURAHS;
    if (sub === "endSurah" && startSurah) {
      list = list.filter((s) => s.number >= startSurah.number);
    }
    if (!q) return list;
    return list.filter((s) => s.name.includes(q) || String(s.number) === q);
  }, [query, sub, startSurah]);

  // Valid numbers for the active number sub-picker (capped to the surah / page count).
  const numbers = useMemo<number[]>(() => {
    if (sub === "startAyah" && startSurah) return range(1, startSurah.ayahs);
    if (sub === "endAyah" && endSurah) {
      const min = endSurah.number === startSurah?.number ? startAyah ?? 1 : 1;
      return range(min, endSurah.ayahs);
    }
    if (sub === "startPage") return range(1, QURAN_PAGES);
    if (sub === "endPage") return range(startPage ?? 1, QURAN_PAGES);
    return [];
  }, [sub, startSurah, startAyah, endSurah, startPage]);

  const openSub = (s: Sub) => {
    setQuery("");
    setSub(s);
  };

  const pickSurah = (s: Surah) => {
    if (sub === "startSurah") {
      setStartSurah(s);
      setStartAyah(1);
      // Keep the end consistent: drop it if it now precedes the new start surah.
      if (endSurah && endSurah.number < s.number) {
        setEndSurah(null);
        setEndAyah(null);
      }
    } else if (sub === "endSurah") {
      setEndSurah(s);
      setEndAyah(s.ayahs);
    }
    setSub(null);
    setQuery("");
  };

  const pickNumber = (n: number) => {
    if (sub === "startAyah") {
      setStartAyah(n);
      if (endSurah?.number === startSurah?.number && endAyah != null && endAyah < n) {
        setEndAyah(n);
      }
    } else if (sub === "endAyah") setEndAyah(n);
    else if (sub === "startPage") {
      setStartPage(n);
      if (endPage != null && endPage < n) setEndPage(null);
    } else if (sub === "endPage") setEndPage(n);
    setSub(null);
  };

  const canConfirm = mode === "ayah" ? startSurah != null && startAyah != null : startPage != null;

  const confirm = () => {
    if (mode === "ayah") {
      if (!startSurah || startAyah == null) return;
      const resolvedEndSurah = endSurah ?? startSurah;
      const resolvedEndAyah = endAyah ?? startAyah;
      onPick({
        label: ayahRangeLabel(startSurah, startAyah, resolvedEndSurah, resolvedEndAyah),
        ref_type: "ayah",
        surah_start: startSurah.number,
        ayah_start: startAyah,
        surah_end: resolvedEndSurah.number,
        ayah_end: resolvedEndAyah,
        page_start: null,
        page_end: null,
      });
    } else {
      if (startPage == null) return;
      const resolvedEndPage = endPage ?? startPage;
      onPick({
        label: pageRangeLabel(startPage, resolvedEndPage),
        ref_type: "page",
        surah_start: null,
        ayah_start: null,
        surah_end: null,
        ayah_end: null,
        page_start: startPage,
        page_end: resolvedEndPage,
      });
    }
    reset();
    onClose();
  };

  const renderField = (opts: {
    flex: number;
    label: string;
    value: string | number | null;
    placeholder: string;
    onPress: () => void;
    disabled?: boolean;
  }) => {
    const has = opts.value != null && opts.value !== "";
    return (
      <Pressable
        onPress={opts.onPress}
        disabled={opts.disabled}
        style={[styles.field, { flex: opts.flex, opacity: opts.disabled ? 0.45 : 1 }]}
      >
        <AppText variant="caption" color={colors.textMuted}>
          {opts.label}
        </AppText>
        <AppText color={has ? colors.text : colors.textMuted} numberOfLines={1}>
          {has ? String(opts.value) : opts.placeholder}
        </AppText>
      </Pressable>
    );
  };

  const renderMain = () => (
    <>
      <AppText variant="heading">{t("ayah.pick")}</AppText>

      <View style={styles.toggle}>
        {(["ayah", "page"] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              onPress={() => setMode(m)}
              style={[styles.toggleBtn, active && { backgroundColor: colors.primary }]}
            >
              <AppText color={active ? colors.textOnPrimary : colors.text}>
                {t(m === "ayah" ? "ayah.modeAyah" : "ayah.modePage")}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {mode === "ayah" ? (
        <>
          <AppText variant="subheading" color={colors.primary}>
            {t("ayah.start")}
          </AppText>
          <View style={styles.fieldRow}>
            {renderField({
              flex: 2,
              label: t("ayah.surahField"),
              value: startSurah?.name ?? null,
              placeholder: t("ayah.selectSurah"),
              onPress: () => openSub("startSurah"),
            })}
            {renderField({
              flex: 1,
              label: t("ayah.fromAyah"),
              value: startAyah,
              placeholder: "—",
              onPress: () => openSub("startAyah"),
              disabled: !startSurah,
            })}
          </View>

          <AppText variant="subheading" color={colors.primary}>
            {t("ayah.end")}
          </AppText>
          <View style={styles.fieldRow}>
            {renderField({
              flex: 2,
              label: t("ayah.surahField"),
              value: endSurah?.name ?? null,
              placeholder: t("ayah.selectSurah"),
              onPress: () => openSub("endSurah"),
              disabled: !startSurah,
            })}
            {renderField({
              flex: 1,
              label: t("ayah.toAyah"),
              value: endAyah,
              placeholder: "—",
              onPress: () => openSub("endAyah"),
              disabled: !endSurah,
            })}
          </View>
        </>
      ) : (
        <View style={styles.fieldRow}>
          {renderField({
            flex: 1,
            label: t("ayah.fromPage"),
            value: startPage,
            placeholder: "—",
            onPress: () => openSub("startPage"),
          })}
          {renderField({
            flex: 1,
            label: t("ayah.toPage"),
            value: endPage,
            placeholder: "—",
            onPress: () => openSub("endPage"),
            disabled: startPage == null,
          })}
        </View>
      )}

      <View style={styles.actions}>
        <Button label={t("common.cancel")} variant="ghost" onPress={close} style={{ flex: 1 }} />
        <Button label={t("ayah.confirm")} onPress={confirm} style={{ flex: 1 }} disabled={!canConfirm} />
      </View>
    </>
  );

  const renderSub = () => {
    const isSurah = sub === "startSurah" || sub === "endSurah";
    return (
      <>
        <View style={styles.subHeader}>
          <Pressable onPress={() => openSub(null)} hitSlop={10} style={{ width: 56 }}>
            <AppText variant="button" color={colors.primary}>
              {t("common.back")}
            </AppText>
          </Pressable>
          <AppText variant="heading">{isSurah ? t("ayah.selectSurah") : t("ayah.pickNumber")}</AppText>
          <View style={{ width: 56 }} />
        </View>

        {isSurah ? (
          <>
            <TextField value={query} onChangeText={setQuery} placeholder={t("ayah.search")} />
            <FlatList
              data={surahResults}
              keyExtractor={(s) => String(s.number)}
              style={{ maxHeight: 400 }}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => pickSurah(item)}
                  style={[styles.row, { borderBottomColor: colors.border }]}
                >
                  <AppText>
                    {item.number}. {item.name}
                  </AppText>
                  <AppText variant="caption" color={colors.textMuted}>
                    {item.ayahs}
                  </AppText>
                </Pressable>
              )}
            />
          </>
        ) : (
          <FlatList
            key="numbers"
            data={padToCols(numbers, 5)}
            numColumns={5}
            keyExtractor={(_, i) => String(i)}
            style={{ maxHeight: 420 }}
            columnWrapperStyle={{ gap: spacing.sm }}
            contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.sm }}
            renderItem={({ item }) =>
              item == null ? (
                <View style={{ flex: 1 }} />
              ) : (
                <Pressable onPress={() => pickNumber(item)} style={styles.numCell}>
                  <AppText>{item}</AppText>
                </Pressable>
              )
            }
          />
        )}
      </>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <SafeAreaView edges={["bottom"]} style={{ gap: spacing.md }}>
            {sub ? renderSub() : renderMain()}
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: ColorScheme) =>
  StyleSheet.create({
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
    toggle: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.xs,
      gap: spacing.xs,
    },
    toggleBtn: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
    },
    fieldRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    field: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      gap: 2,
      backgroundColor: colors.surface,
    },
    actions: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    subHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
    },
    numCell: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.md,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
  });
