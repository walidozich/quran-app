import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useEffect, useRef, useState } from "react";
import { GestureResponderEvent, Pressable, StyleSheet, View } from "react-native";
import { formatMillis } from "../lib/audio";
import { colors, radius, spacing } from "../theme";
import { AppText } from "./AppText";

export type PlayerMarker = { id: string; timestampMs: number; color?: string };

type Props = {
  uri: string;
  markers?: PlayerMarker[];
  onMarkerPress?: (id: string) => void;
  onPosition?: (ms: number) => void;
  /** When this value changes to a number, the player seeks there and plays. */
  seekToMs?: number | null;
};

export function Player({ uri, markers = [], onMarkerPress, onPosition, seekToMs }: Props) {
  const player = useAudioPlayer({ uri });
  const status = useAudioPlayerStatus(player);
  const [barWidth, setBarWidth] = useState(0);

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
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${fraction * 100}%` }]} />
            {markers.map((m) => {
              const left = durationMs > 0 ? Math.min(1, m.timestampMs / durationMs) : 0;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => onMarkerPress?.(m.id)}
                  style={[
                    styles.marker,
                    { left: `${left * 100}%`, backgroundColor: m.color ?? colors.accent },
                  ]}
                  hitSlop={8}
                />
              );
            })}
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

const BAR_HEIGHT = 6;
const MARKER_SIZE = 14;

const styles = StyleSheet.create({
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
  barTrack: {
    height: BAR_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    justifyContent: "center",
  },
  barFill: {
    position: "absolute",
    left: 0,
    height: BAR_HEIGHT,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  marker: {
    position: "absolute",
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    marginLeft: -MARKER_SIZE / 2,
    top: BAR_HEIGHT / 2 - MARKER_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  timeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.xs,
  },
});
