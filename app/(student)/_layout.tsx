import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/features/session/auth";

export default function StudentLayout() {
  const { loading, profile } = useAuth();
  if (loading) return null;
  if (!profile) return <Redirect href="/(auth)/sign-in" />;
  if (profile.role !== "student") return <Redirect href="/(teacher)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
