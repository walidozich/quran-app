import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/features/session/auth";
import { useColors } from "../src/theme";

export default function Index() {
  const colors = useColors();
  const { loading, profile } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!profile) return <Redirect href="/(auth)/sign-in" />;
  return <Redirect href={profile.role === "teacher" ? "/(teacher)" : "/(student)"} />;
}
