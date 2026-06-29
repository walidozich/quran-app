import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { USE_LOCAL_BACKEND } from "../../config/backend";
import { supabase } from "../../config/supabase";

// Show notifications while the app is foregrounded too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

/**
 * Ask for permission, get this device's Expo push token, and save it on the
 * user's profile. No-ops on the local backend, on simulators, in Expo Go (remote
 * push needs a dev/EAS build), or if permission is denied — always best-effort.
 */
export async function registerForPush(profileId: string): Promise<void> {
  try {
    if (USE_LOCAL_BACKEND || !Device.isDevice) return;

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
