import { Redirect, Stack } from "expo-router";
import { useSession } from "../../src/features/session/DevSessionProvider";

export default function TeacherLayout() {
  const { role } = useSession();
  if (role !== "teacher") return <Redirect href="/(student)" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
