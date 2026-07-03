import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/features/session/auth";
import { useColors } from "../src/theme";

export default function Index() {
  const colors = useColors();
  const { loading, session, profiles, profile, mode } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!session) return <Redirect href="/(auth)/sign-in" />;
  // Signed in but no person-profile yet (app closed mid-wizard) → finish setup.
  if (profiles.length === 0) return <Redirect href="/(auth)/profile-setup" />;
  // Always pick who's reciting (family phones) before entering the app.
  if (!profile) return <Redirect href="/profile-picker" />;
  // Route by MODE (Airbnb-style): a teacher profile may be in learning mode.
  return <Redirect href={mode === "teacher" ? "/(teacher)" : "/(student)"} />;
}
