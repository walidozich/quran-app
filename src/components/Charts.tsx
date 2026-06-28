import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { TagCount } from "../features/stats/aggregate";
import { ColorScheme, radius, spacing, useColors } from "../theme";
import { AppText } from "./AppText";

// --- Stat tile -------------------------------------------------------------
type Tone = "primary" | "accent" | "muted";

export function StatTile({ value, label, tone = "primary" }: { value: number | string; label: string; tone?: Tone }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const color = tone === "accent" ? colors.accent : tone === "muted" ? colors.textMuted : colors.primary;
  return (
    <View style={styles.tile}>
      <AppText variant="title" color={color} style={styles.center}>
        {value}
      </AppText>
      <AppText variant="caption" color={colors.textMuted} style={styles.center}>
        {label}
      </AppText>
    </View>
  );
}

// --- Horizontal bar list (e.g. most-common mistakes) -----------------------
export function BarList({ items, emptyText }: { items: TagCount[]; emptyText: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  if (items.length === 0) {
    return <AppText color={colors.textMuted}>{emptyText}</AppText>;
  }
  const max = Math.max(...items.map((i) => i.count));
  return (
    <View style={{ gap: spacing.sm }}>
      {items.map((it) => (
        <View key={it.id} style={{ gap: 4 }}>
          <View style={styles.barLabelRow}>
            <AppText variant="caption">{it.name}</AppText>
            <AppText variant="caption" color={colors.textMuted}>
              {it.count}
            </AppText>
          </View>
          <View style={styles.barTrack}>
            {/* RTL: bar grows from the right edge. */}
            <View
              style={[styles.barFill, { width: `${(it.count / max) * 100}%`, backgroundColor: it.color }]}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// --- Donut (status breakdown) ----------------------------------------------
export type DonutSegment = { value: number; color: string };

export function Donut({
  segments,
  size = 150,
  stroke = 20,
  centerValue,
  centerLabel,
}: {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
  centerValue: number | string;
  centerLabel: string;
}) {
  const colors = useColors();
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <View style={{ width: size, height: size, alignSelf: "center" }}>
      <Svg width={size} height={size}>
        <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
          <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={stroke} fill="none" />
          {segments.map((seg, i) => {
            const dash = (seg.value / total) * circumference;
            const node = (
              <Circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={seg.color}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return node;
          })}
        </G>
      </Svg>
      <View style={[StyleSheet.absoluteFill, donutCenter]}>
        <AppText variant="title" color={colors.text}>
          {centerValue}
        </AppText>
        <AppText variant="caption" color={colors.textMuted}>
          {centerLabel}
        </AppText>
      </View>
    </View>
  );
}

export function LegendDot({ color, label }: { color: string; label: string }) {
  const colors = useColors();
  return (
    <View style={legendItem}>
      <View style={[dot, { backgroundColor: color }]} />
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

const donutCenter = { alignItems: "center", justifyContent: "center" } as const;
const legendItem = { flexDirection: "row", alignItems: "center", gap: spacing.xs } as const;
const dot = { width: 10, height: 10, borderRadius: 5 } as const;

const makeStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    center: { textAlign: "center" },
    tile: {
      flexGrow: 1,
      flexBasis: "44%",
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      alignItems: "center",
      gap: spacing.xs,
    },
    barLabelRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    barTrack: {
      height: 10,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
      overflow: "hidden",
    },
    barFill: {
      position: "absolute",
      right: 0,
      top: 0,
      bottom: 0,
      borderRadius: radius.pill,
    },
  });
