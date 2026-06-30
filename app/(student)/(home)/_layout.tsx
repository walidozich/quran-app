import { Stack } from "expo-router";

// The home tab's stack: list → class → record / recording / thread. Living inside
// the tab keeps the bottom navbar visible while pushing these detail screens.
export default function StudentHomeStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
