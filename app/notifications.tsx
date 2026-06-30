import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { AppText, Button, Card, EmptyState, Screen, ScreenHeader } from "../src/components";
import {
  NotificationItem,
  useMarkAllRead,
  useMarkRead,
  useNotifications,
} from "../src/features/notifications/api";
import { useAuth } from "../src/features/session/auth";
import { t } from "../src/i18n/ar";
import { spacing, useColors } from "../src/theme";

function relativeAr(iso: string): string {
  const min = (Date.now() - new Date(iso).getTime()) / 60000;
  if (min < 1) return t("notifCenter.justNow");
  if (min < 60) return t("notifCenter.minutesAgo");
  if (min < 1440) return t("notifCenter.hoursAgo");
  return t("notifCenter.daysAgo");
}

export default function NotificationsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { profile } = useAuth();
  const userId = profile?.id ?? "";
  const { data: items = [], isLoading } = useNotifications(userId);
  const markAllRead = useMarkAllRead(userId);
  const markRead = useMarkRead(userId);

  const hasUnread = items.some((n) => !n.read);

  const open = (n: NotificationItem) => {
    if (!n.read) markRead.mutate(n.id);
    if (!n.recording_id || !profile) return;
    const path =
      profile.role === "teacher"
        ? `/(teacher)/review/${n.recording_id}`
        : `/(student)/recording/${n.recording_id}`;
    router.push(path as never);
  };

  return (
    <Screen scroll>
      <ScreenHeader title={t("notifCenter.title")} bell={false} reload={false} />

      {hasUnread ? (
        <Button
          label={t("notifCenter.markAllRead")}
          variant="secondary"
          onPress={() => markAllRead.mutate()}
          loading={markAllRead.isPending}
        />
      ) : null}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} />
      ) : items.length === 0 ? (
        <EmptyState message={t("notifCenter.empty")} />
      ) : (
        items.map((n) => (
          <Pressable key={n.id} onPress={() => open(n)}>
            <Card style={!n.read ? { borderColor: colors.primary, borderWidth: 1.5 } : undefined}>
              <View style={styles.titleRow}>
                {!n.read ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
                <AppText variant="subheading" style={{ flex: 1 }}>
                  {n.title}
                </AppText>
              </View>
              {n.body ? <AppText variant="body">{n.body}</AppText> : null}
              <AppText variant="caption" color={colors.textMuted}>
                {relativeAr(n.created_at)}
              </AppText>
            </Card>
          </Pressable>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
});
