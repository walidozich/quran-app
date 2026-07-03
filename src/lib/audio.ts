import { Directory, File, Paths } from "expo-file-system";
import {
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import { supabase } from "../config/supabase";

/** Format milliseconds as mm:ss (LTR — used inside the LTR seek bar). */
export function formatMillis(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

/** Request mic permission and set an audio mode suitable for recording. */
export async function ensureRecordingReady(): Promise<boolean> {
  const { granted } = await requestRecordingPermissionsAsync();
  if (!granted) return false;
  await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
  return true;
}

/** Switch audio mode back to playback (call before playing recorded audio). */
export async function setPlaybackMode(): Promise<void> {
  await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
}

/**
 * Upload a local audio file (file:// uri) to a Supabase Storage bucket.
 * Returns the stored object path.
 */
export async function uploadAudio(
  localUri: string,
  bucket: "recordings" | "corrections",
  path: string,
  contentType = "audio/m4a"
): Promise<string> {
  const buffer = await new File(localUri).arrayBuffer();
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw error;
  return path;
}
