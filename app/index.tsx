import { Redirect } from "expo-router";
import { useSession } from "../src/features/session/DevSessionProvider";

export default function Index() {
  const { role } = useSession();
  return <Redirect href={role === "teacher" ? "/(teacher)" : "/(student)"} />;
}
