import { Redirect, Stack } from "expo-router";
import { useSession } from "../../src/features/session/DevSessionProvider";

export default function StudentLayout() {
  const { role } = useSession();
  if (role !== "student") return <Redirect href="/(teacher)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
