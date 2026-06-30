import { Amiri_400Regular, Amiri_700Bold } from "@expo-google-fonts/amiri";
import { AmiriQuran_400Regular, useFonts } from "@expo-google-fonts/amiri-quran";
import { QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { I18nManager } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BrandSplash } from "../src/components";
import { DrawerProvider } from "../src/features/drawer/Drawer";
import { AuthProvider, useAuth } from "../src/features/session/auth";
import { useAppBadge, useNotificationRouting } from "../src/features/notifications/useNotificationRouting";
import { useUnreadCount } from "../src/features/notifications/api";
import { queryClient } from "../src/lib/queryClient";
import { ThemeProvider, useThemeMode } from "../src/theme";

// Force right-to-left for the whole app, regardless of device locale.
// NOTE: in Expo Go the native RTL flag may only take effect after one manual
// reload on first launch (press "r" in the Metro terminal, or shake → Reload).
// The setting persists, so subsequent launches start in RTL. Layout is also
// forced RTL at the Yoga level (Screen `direction: "rtl"`) so it works regardless.
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  // Amiri (400 + 700) drives the UI so we get real bold hierarchy; Amiri Quran is
  // kept for actual Quranic/ayah text (variant="quran").
  const [fontsLoaded] = useFonts({
    Amiri_400Regular,
    Amiri_700Bold,
    AmiriQuran_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded) {
      // Hide the native splash; our in-app BrandSplash takes over seamlessly.
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SafeAreaProvider>
            <DrawerProvider>
              <Chrome fontsLoaded={fontsLoaded} />
            </DrawerProvider>
          </SafeAreaProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

function Chrome({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { mode } = useThemeMode();
  const { profile } = useAuth();
  const { data: unread = 0 } = useUnreadCount(profile?.id);
  const [splashDone, setSplashDone] = useState(false);
  // Tapping a push notification deep-links to the relevant recording.
  useNotificationRouting(profile?.role);
  // Mirror the unread count onto the app-icon badge.
  useAppBadge(unread);
  return (
    <>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }} />
      {!splashDone ? <BrandSplash ready={fontsLoaded} onFinish={() => setSplashDone(true)} /> : null}
    </>
  );
}
