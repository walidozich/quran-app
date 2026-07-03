import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../session/auth";
import { isPushSupported } from "./push";

/**
 * When a notification is tapped, open the recording it refers to. The payload
 * carries `recordingId` + `recipientProfileId`; on a shared (family) phone the
 * app auto-switches to the person the notification is for, then routes by
 * their role (teacher → review, student → their recording view). Handles both
 * warm taps and cold starts. No-ops in Expo Go / simulators.
 */
export function useNotificationRouting(): void {
  const router = useRouter();
  const { profiles, profile, activateProfile, setMode } = useAuth();

  useEffect(() => {
    if (profiles.length === 0 || !isPushSupported()) return;

    // Lazy require so Expo Go never loads expo-notifications.
    const Notifications = require("expo-notifications") as typeof import("expo-notifications");

    const open = async (data: unknown) => {
      const payload = data as
        | { recordingId?: unknown; recipientProfileId?: unknown; targetRole?: unknown }
        | null;
      const recordingId = typeof payload?.recordingId === "string" ? payload.recordingId : null;
      const recipientId =
        typeof payload?.recipientProfileId === "string" ? payload.recipientProfileId : null;

      // Switch to the person the notification is for (no PINs in v1 — family trust).
      let target = profile;
      const recipient = recipientId ? profiles.find((p) => p.id === recipientId) : undefined;
      if (recipient && profile?.id !== recipient.id) {
        await activateProfile(recipient.id);
        target = recipient;
      }
      if (!target || !recordingId) return;

      // The notification says which side of the loop it belongs to; a dual-role
      // person is flipped into the right mode before routing.
      const asTeacher = payload?.targetRole ? payload.targetRole === "teacher" : target.is_teacher;
      if (target.is_teacher) setMode(asTeacher ? "teacher" : "student");

      const path = asTeacher
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
  }, [profiles, profile, activateProfile, setMode, router]);
}

/** Keep the app-icon badge in sync with the unread notification count. */
export function useAppBadge(count: number): void {
  useEffect(() => {
    if (!isPushSupported()) return;
    const Notifications = require("expo-notifications") as typeof import("expo-notifications");
    Notifications.setBadgeCountAsync(Math.max(0, count)).catch(() => {});
  }, [count]);
}
