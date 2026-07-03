import { Redirect, Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountIcon, HomeIcon, ManageIcon, StatsIcon } from "../../src/components/TabBarIcon";
import { useAuth } from "../../src/features/session/auth";
import { t } from "../../src/i18n/ar";
import { useColors } from "../../src/theme";
import { tabScreenOptions } from "../../src/theme/tabBar";

export default function TeacherLayout() {
  const { loading, profile, mode } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  if (loading) return null;
  if (!profile) return <Redirect href="/" />;
  if (!profile.is_teacher || mode !== "teacher") return <Redirect href="/(student)" />;

  return (
    <Tabs screenOptions={tabScreenOptions(colors, insets.bottom)}>
      <Tabs.Screen
        name="(home)"
        options={{ title: t("tabs.home"), tabBarIcon: ({ color }) => <HomeIcon color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{ title: t("tabs.stats"), tabBarIcon: ({ color }) => <StatsIcon color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="manage-class"
        options={{ title: t("tabs.manage"), tabBarIcon: ({ color }) => <ManageIcon color={color} size={22} /> }}
      />
      <Tabs.Screen
        name="more"
        options={{ title: t("tabs.account"), tabBarIcon: ({ color }) => <AccountIcon color={color} size={22} /> }}
      />
    </Tabs>
  );
}
