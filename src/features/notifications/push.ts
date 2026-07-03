import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "../../config/supabase";

// Expo Go (SDK 53+) removed remote push; even *importing* expo-notifications there
// logs warnings/errors. So we never touch the module in Expo Go and lazy-load it
// only inside a real dev/standalone build.
const IS_EXPO_GO =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

// The active person-profile "acting" on this device (set by the auth context).
// Used as notifications.actor_id — RLS requires it to be one of the account's
// profiles (the account uid itself is NOT a profile id anymore).
let pushActorProfileId: string | null = null;
export function setPushActor(profileId: string | null): void {
  pushActorProfileId = profileId;
}

/** Push is only usable in a real dev/standalone build on a physical device. */
export function isPushSupported(): boolean {
  return !IS_EXPO_GO && Device.isDevice;
}

/**
 * Ask for permission, get this device's Expo push token, and save it on EVERY
 * profile of the account — the phone is shared (family), so a push aimed at any
 * of its people must reach this device. No-ops in Expo Go, on simulators, or
 * without an EAS projectId — always best-effort.
 */
export async function registerForPush(accountId: string): Promise<void> {
  try {
    if (!isPushSupported()) return;

    // Lazy require so Expo Go never loads expo-notifications.
    const Notifications = require("expo-notifications") as typeof import("expo-notifications");

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });

    // Android 8+ shows sound/heads-up per *channel*. HIGH = peek + sound; the
    // custom sound file is bundled via the expo-notifications plugin (app.json).
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "إشعارات صاحبك",
        importance: Notifications.AndroidImportance.HIGH,
        sound: "quran_app_notif.mp3",
        lightColor: "#01443A",
      });
    }

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (status !== "granted") {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== "granted") return;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    if (!projectId) return; // set after `eas init` — skip until then

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    await supabase.from("profiles").update({ expo_push_token: token }).eq("account_id", accountId);
  } catch (e) {
    // Expo Go / no FCM / offline — best-effort. Logged so `adb logcat` can surface
    // setup issues (e.g. missing google-services.json) during testing.
    console.warn("[push] registerForPush failed:", e);
  }
}

/** Send a push to a person (by profile id), looking up their stored token. Best-effort. */
export async function sendPushToProfile(
  profileId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  // 1) Persist for the in-app notification center (history). Best-effort; RLS
  //    requires actor_id to be one of the sender account's profile ids.
  try {
    if (pushActorProfileId) {
      await supabase.from("notifications").insert({
        recipient_id: profileId,
        actor_id: pushActorProfileId,
        title,
        body,
        recording_id: (data?.recordingId as string | undefined) ?? null,
      });
    }
  } catch {
    // history is best-effort
  }

  // 2) Deliver the push via Expo → FCM. Android plays the "default" channel's
  //    (custom) sound; channelId routes the notification to that channel.
  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("expo_push_token, full_name")
      .eq("id", profileId)
      .maybeSingle();
    const token = prof?.expo_push_token;
    if (!token) return;

    // The phone may be shared by several people — name the person the
    // notification is for, and carry their profile id so a tap can
    // auto-switch to them before routing.
    const namedTitle = prof?.full_name ? `${prof.full_name} · ${title}` : title;
    const payload = { ...data, recipientProfileId: profileId };

    await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify([
        { to: token, title: namedTitle, body, data: payload, sound: "default", channelId: "default" },
      ]),
    });
  } catch {
    // never block the action on a failed notification
  }
}
