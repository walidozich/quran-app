import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountIcon, HomeIcon, StatsIcon, StudyIcon } from "../../../src/components/TabBarIcon";
import { t } from "../../../src/i18n/ar";
import { fonts, useColors } from "../../../src/theme";

export default function StudentTabsLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 66 + insets.bottom,
          paddingBottom: insets.bottom + 18,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontFamily: fonts.regular, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t("tabs.home"), tabBarIcon: ({ color }) => <HomeIcon color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{ title: t("tabs.stats"), tabBarIcon: ({ color }) => <StatsIcon color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="study"
        options={{ title: t("tabs.study"), tabBarIcon: ({ color }) => <StudyIcon color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: t("tabs.account"), tabBarIcon: ({ color }) => <AccountIcon color={color} size={22} /> }}
      />
    </Tabs>
  );
}
