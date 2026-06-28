import { Redirect, Stack } from "expo-router";
import { useAuth } from "../../src/features/session/auth";

export default function TeacherLayout() {
  const { loading, profile } = useAuth();
  if (loading) return null;
  if (!profile) return <Redirect href="/(auth)/sign-in" />;
  if (profile.role !== "teacher") return <Redirect href="/(student)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
