import { View } from "react-native";
import { Button } from "../../components/Button";
import { t } from "../../i18n/ar";
import { spacing } from "../../theme";
import { useSession } from "./DevSessionProvider";

// Dev-only control to flip between the seeded teacher and student profiles.
export function RoleSwitcher() {
  const { role, switchRole } = useSession();
  return (
    <View style={{ flexDirection: "row", gap: spacing.sm }}>
      <Button
        label={t("roles.teacher")}
        variant={role === "teacher" ? "primary" : "secondary"}
        onPress={() => switchRole("teacher")}
        style={{ flex: 1 }}
      />
      <Button
        label={t("roles.student")}
        variant={role === "student" ? "primary" : "secondary"}
        onPress={() => switchRole("student")}
        style={{ flex: 1 }}
      />
    </View>
  );
}
