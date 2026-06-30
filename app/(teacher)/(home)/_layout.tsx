import { Stack } from "expo-router";

// The home tab's stack: class queue → class → review / thread. Living inside the
// tab keeps the bottom navbar visible while pushing these detail screens.
export default function TeacherHomeStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
