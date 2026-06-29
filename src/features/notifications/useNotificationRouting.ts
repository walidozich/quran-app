import { useRouter } from "expo-router";
import { useEffect } from "react";
import { UserRole } from "../../types/database";
import { isPushSupported } from "./push";

/**
 * When a notification is tapped, open the recording it refers to. The payload
 * carries `recordingId`; we route by role (teacher → review, student → their
 * recording view). Handles both warm taps and cold starts (app launched from
 * the notification). No-ops in Expo Go / local backend / simulators.
 */
export function useNotificationRouting(role: UserRole | null | undefined): void {
  const router = useRouter();

  useEffect(() => {
    if (!role || !isPushSupported()) return;

    // Lazy require so Expo Go never loads expo-notifications.
    const Notifications = require("expo-notifications") as typeof import("expo-notifications");

    const open = (data: unknown) => {
      const recordingId = (data as { recordingId?: unknown } | null)?.recordingId;
      if (typeof recordingId !== "string" || !recordingId) return;
      const path =
        role === "teacher"
          ? `/(teacher)/review/${recordingId}`
          : `/(student)/recording/${recordingId}`;
      router.push(path as never);
    };

    // Cold start: the app was opened by tapping a notification.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) open(response.notification.request.content.data);
      })
      .catch(() => {});

    // Warm taps while the app is running/backgrounded.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      open(response.notification.request.content.data);
    });

    return () => sub.remove();
  }, [role, router]);
}

/** Keep the app-icon badge in sync with the unread notification count. */
export function useAppBadge(count: number): void {
  useEffect(() => {
    if (!isPushSupported()) return;
    const Notifications = require("expo-notifications") as typeof import("expo-notifications");
    Notifications.setBadgeCountAsync(Math.max(0, count)).catch(() => {});
  }, [count]);
}
