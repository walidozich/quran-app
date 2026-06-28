import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, Modal, Pressable, StyleSheet, Switch, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppText } from "../../components/AppText";
import { t } from "../../i18n/ar";
import { spacing, useColors, useThemeMode } from "../../theme";
import { useAuth } from "../session/auth";

type DrawerValue = { open: () => void; close: () => void };
const DrawerContext = createContext<DrawerValue | null>(null);

export function useDrawer(): DrawerValue {
  const ctx = useContext(DrawerContext);
  if (!ctx) throw new Error("useDrawer must be used within DrawerProvider");
  return ctx;
}

const PANEL_WIDTH = 300;

export function DrawerProvider({ children }: { children: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const value = useRef<DrawerValue>({ open: () => setVisible(true), close: () => setVisible(false) }).current;
  return (
    <DrawerContext.Provider value={value}>
      {children}
      <DrawerPanel visible={visible} onClose={value.close} />
    </DrawerContext.Provider>
  );
}

function DrawerPanel({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { mode, toggle } = useThemeMode();
  const { profile, signOut } = useAuth();

  // Slide the panel in from the right (RTL start edge).
  const slide = useRef(new Animated.Value(PANEL_WIDTH)).current;
  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) setMounted(true);
    Animated.timing(slide, {
      toValue: visible ? 0 : PANEL_WIDTH,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (!visible) setMounted(false);
    });
  }, [visible, slide]);

  if (!mounted) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View
          style={[styles.panel, { backgroundColor: colors.surface, transform: [{ translateX: slide }] }]}
        >
          {/* stop backdrop press from closing when tapping inside the panel */}
          <Pressable style={{ flex: 1 }} onPress={() => {}}>
            <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
              {/* Account */}
              <AppText variant="caption" color={colors.textMuted}>
                {t("drawer.account")}
              </AppText>
              <View style={[styles.accountCard, { backgroundColor: colors.primarySoft }]}>
                <AppText variant="heading">{profile?.full_name ?? "—"}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {profile ? t(`roles.${profile.role}`) : ""}
                </AppText>
              </View>

              {/* Settings */}
              <AppText variant="caption" color={colors.textMuted} style={{ marginTop: spacing.lg }}>
                {t("drawer.settings")}
              </AppText>
              <View style={[styles.row, { borderColor: colors.border }]}>
                <AppText variant="subheading">{t("drawer.darkMode")}</AppText>
                <Switch
                  value={mode === "dark"}
                  onValueChange={toggle}
                  trackColor={{ true: colors.primary, false: colors.border }}
                  thumbColor={colors.surface}
                />
              </View>

              <View style={{ flex: 1 }} />

              {/* Logout */}
              <Pressable
                onPress={() => {
                  onClose();
                  signOut();
                }}
                style={[styles.logout, { borderColor: colors.danger }]}
              >
                <AppText variant="button" color={colors.danger}>
                  {t("auth.signOut")}
                </AppText>
              </Pressable>
            </SafeAreaView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    flexDirection: "row",
    justifyContent: "flex-start", // RTL: panel sits at the start (right)
    direction: "rtl",
  },
  panel: {
    width: PANEL_WIDTH,
    height: "100%",
  },
  safe: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  accountCard: {
    borderRadius: 16,
    padding: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  logout: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
});
