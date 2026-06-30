import { ReactNode, useMemo } from "react";
import { ScrollView, StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ColorScheme, spacing, useColors } from "../theme";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
};

export function Screen({ children, scroll = false, style }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const inner = <View style={[styles.content, style]}>{children}</View>;
  return (
    <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {inner}
        </ScrollView>
      ) : (
        inner
      )}
    </SafeAreaView>
  );
}

const makeStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: colors.background,
      // Force RTL layout at the Yoga level so the UI is right-to-left even when
      // the native I18nManager.forceRTL flag doesn't take effect (e.g. in Expo Go).
      direction: "rtl",
    },
    scroll: {
      flexGrow: 1,
    },
    content: {
      flex: 1,
      padding: spacing.md,
      gap: spacing.sm,
    },
  });
