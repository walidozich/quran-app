import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { USE_LOCAL_BACKEND } from "../../config/backend";
import { supabase } from "../../config/supabase";

// Expo Go (SDK 53+) removed remote push; even *importing* expo-notifications there
// logs warnings/errors. So we never touch the module in Expo Go and lazy-load it
// only inside a real dev/standalone build.
const IS_EXPO_GO =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

/**
 * Ask for permission, get this device's Expo push token, and save it on the
 * user's profile. No-ops on the local backend, in Expo Go, on simulators, or
 * without an EAS projectId — always best-effort.
 */
export async function registerForPush(profileId: string): Promise<void> {
  try {
    if (USE_LOCAL_BACKEND || IS_EXPO_GO || !Device.isDevice) return;

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
    await supabase.from("profiles").update({ expo_push_token: token }).eq("id", profileId);
  } catch {
    // Expo Go / no FCM / offline — ignore.
  }
}

/** Send a push to a user (by profile id), looking up their stored token. Best-effort. */
export async function sendPushToProfile(
  profileId: string,
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<void> {
  try {
    if (USE_LOCAL_BACKEND) return;
    const { data: prof } = await supabase
      .from("profiles")
      .select("expo_push_token")
      .eq("id", profileId)
      .maybeSingle();
    const token = prof?.expo_push_token;
    if (!token) return;

    await fetch(EXPO_PUSH_ENDPOINT, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: JSON.stringify([{ to: token, title, body, data, sound: "default" }]),
    });
  } catch {
    // never block the action on a failed notification
  }
}
