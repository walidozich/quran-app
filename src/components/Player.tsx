import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useMemo, useRef, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, View } from "react-native";
import { formatMillis } from "../lib/audio";
import { ColorScheme, spacing, useColors } from "../theme";
import { AppText } from "./AppText";

export type PlayerMarker = {
  id: string;
  timestampMs: number;
  /** When set (> timestampMs), the marker is a range highlighted on the bar. */
  endMs?: number | null;
  color?: string;
};

type Props = {
  uri: string;
  markers?: PlayerMarker[];
  onMarkerPress?: (id: string) => void;
  onPosition?: (ms: number) => void;
  /** When this value changes to a number, the player seeks there and plays. */
  seekToMs?: number | null;
  /** Increment this to pause playback (e.g. when opening the annotation editor). */
  pauseSignal?: number;
  /** In-progress range selection to preview on the bar (teacher review). */
  pending?: { startMs: number; endMs: number | null } | null;
};

export function Player({ uri, markers = [], onMarkerPress, onPosition, seekToMs, pauseSignal, pending }: Props) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const [barWidth, setBarWidth] = useState(0);
  // Stylized waveform bars — deterministic per source so they don't flicker.
  const heights = useMemo(() => waveformHeights(uri), [uri]);

  const durationMs = (status.duration || 0) * 1000;
  const currentMs = (status.currentTime || 0) * 1000;
  const fraction = durationMs > 0 ? Math.min(1, currentMs / durationMs) : 0;

  // Report position upward (e.g. so the teacher can pin "a note here").
  useEffect(() => {
    onPosition?.(currentMs);
  }, [currentMs, onPosition]);

  // External seek requests (e.g. tapping an annotation in a list).
  const lastSeek = useRef<number | null>(null);
  useEffect(() => {
    if (seekToMs != null && seekToMs !== lastSeek.current) {
      lastSeek.current = seekToMs;
      player.seekTo(seekToMs / 1000);
      player.play();
    }
  }, [seekToMs, player]);

  // External pause requests (e.g. teacher taps "add note" — pause automatically
  // so they don't have to stop playback first).
  const lastPause = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (pauseSignal != null && pauseSignal !== lastPause.current) {
      lastPause.current = pauseSignal;
      player.pause();
    }
  }, [pauseSignal, player]);

  const togglePlay = () => {
    if (status.playing) player.pause();
    else player.play();
  };

  const onSeekBarPress = (e: GestureResponderEvent) => {
    if (barWidth <= 0 || durationMs <= 0) return;
    const x = e.nativeEvent.locationX;
    const frac = Math.max(0, Math.min(1, x / barWidth));
    player.seekTo((frac * durationMs) / 1000);
  };

  return (
    <View style={styles.wrap}>
      <Pressable onPress={togglePlay} style={styles.playButton}>
        <AppText variant="button" color={colors.textOnPrimary}>
          {status.playing ? "⏸" : "▶"}
        </AppText>
      </Pressable>

      <View style={styles.barColumn}>
        <Pressable
          onPress={onSeekBarPress}
          onLayout={(e) => setBarWidth(e.nativeEvent.layout.width)}
          style={styles.barTouch}
        >
          <View style={styles.wave}>
            {/* Waveform bars — played portion in primary, rest muted. */}
            {heights.map((h, i) => {
              const center = (i + 0.5) / heights.length;
              return (
                <View
                  key={i}
                  style={[
                    styles.waveBar,
                    { height: `${Math.max(8, h * 100)}%`, backgroundColor: center <= fraction ? colors.primary : colors.border },
                  ]}
                />
              );
            })}

            {/* Range highlight (non-interactive) behind the markers. */}
            {markers.map((m) => {
              if (m.endMs == null || m.endMs <= m.timestampMs || durationMs <= 0) return null;
              const s = Math.min(1, m.timestampMs / durationMs);
              const e = Math.min(1, m.endMs / durationMs);
              return (
                <View
                  key={`${m.id}-seg`}
                  pointerEvents="none"
                  style={[
                    styles.segment,
                    { left: `${s * 100}%`, width: `${(e - s) * 100}%`, backgroundColor: m.color ?? colors.accent },
                  ]}
                />
              );
            })}

            {/* A pointer line + dot at each remark (tap to jump). */}
            {markers.map((m) => {
              const left = durationMs > 0 ? Math.min(1, m.timestampMs / durationMs) : 0;
              const color = m.color ?? colors.accent;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => onMarkerPress?.(m.id)}
                  hitSlop={10}
                  style={[styles.markerLine, { left: `${left * 100}%`, backgroundColor: color }]}
                >
                  <View style={[styles.markerDot, { backgroundColor: color }]} />
                </Pressable>
              );
            })}

            {/* In-progress selection preview. */}
            {pending && durationMs > 0
              ? (() => {
                  const s = Math.min(1, pending.startMs / durationMs);
                  const e = pending.endMs != null ? Math.min(1, pending.endMs / durationMs) : s;
                  return (
                    <>
                      {pending.endMs != null && e > s ? (
                        <View
                          style={[
                            styles.pendingSeg,
                            { left: `${s * 100}%`, width: `${(e - s) * 100}%` },
                          ]}
                        />
                      ) : null}
                      <View style={[styles.pendingEdge, { left: `${s * 100}%` }]} />
                    </>
                  );
                })()
              : null}
          </View>
        </Pressable>
        <View style={styles.timeRow}>
          <AppText variant="caption" color={colors.textMuted}>
            {formatMillis(currentMs)}
          </AppText>
          <AppText variant="caption" color={colors.textMuted}>
            {formatMillis(durationMs)}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const WAVE_BARS = 44;
const WAVE_HEIGHT = 40;
const MARKER_SIZE = 12;

// Deterministic pseudo-random bar heights (0.15–1) seeded by the audio source,
// so each recording has a stable "waveform" look. (Stylized, not decoded PCM.)
function waveformHeights(uri: string): number[] {
  let seed = 2166136261;
  for (let i = 0; i < uri.length; i++) seed = (Math.imul(seed ^ uri.charCodeAt(i), 16777619)) >>> 0;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  return Array.from({ length: WAVE_BARS }, () => 0.15 + rand() * 0.85);
}

const makeStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    wrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      direction: "ltr",
    },
    playButton: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    barColumn: {
      flex: 1,
    },
    barTouch: {
      paddingVertical: spacing.sm,
      justifyContent: "center",
    },
    wave: {
      height: WAVE_HEIGHT,
      flexDirection: "row",
      alignItems: "center",
    },
    waveBar: {
      flex: 1,
      marginHorizontal: 1,
      borderRadius: 2,
      minHeight: 3,
    },
    segment: {
      position: "absolute",
      top: 0,
      bottom: 0,
      borderRadius: 4,
      opacity: 0.22,
    },
    pendingSeg: {
      position: "absolute",
      top: 0,
      bottom: 0,
      borderRadius: 4,
      backgroundColor: colors.accent,
      opacity: 0.25,
    },
    pendingEdge: {
      position: "absolute",
      width: 2,
      top: -3,
      bottom: -3,
      marginLeft: -1,
      borderRadius: 2,
      backgroundColor: colors.accent,
    },
    markerLine: {
      position: "absolute",
      top: -4,
      bottom: -4,
      width: 2,
      marginLeft: -1,
      borderRadius: 1,
    },
    markerDot: {
      position: "absolute",
      top: -7,
      left: -(MARKER_SIZE / 2) + 1,
      width: MARKER_SIZE,
      height: MARKER_SIZE,
      borderRadius: MARKER_SIZE / 2,
      borderWidth: 2,
      borderColor: colors.surface,
    },
    timeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: spacing.xs,
    },
  });
