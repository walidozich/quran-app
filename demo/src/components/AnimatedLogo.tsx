import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { LOGO_PATHS, LOGO_VIEWBOX } from "../logoPaths";

// How each path animates in. Indices come from logoPaths.ts:
//  0 = squircle background
//  2,7 = gold arch + inner star frame
//  1,3,4,5,6 = gold wing + cream book pages
//  8..14 = waveform bars (8 = center, then symmetric pairs outward)
type Kind = "bg" | "frame" | "book" | "bar";
const PLAN: Record<number, { kind: Kind; delay: number }> = {
  0: { kind: "bg", delay: 0 },
  2: { kind: "frame", delay: 8 },
  7: { kind: "frame", delay: 11 },
  1: { kind: "book", delay: 15 },
  3: { kind: "book", delay: 16 },
  4: { kind: "book", delay: 16 },
  5: { kind: "book", delay: 18 },
  6: { kind: "book", delay: 18 },
  8: { kind: "bar", delay: 24 }, // center
  9: { kind: "bar", delay: 28 },
  10: { kind: "bar", delay: 28 },
  11: { kind: "bar", delay: 32 },
  12: { kind: "bar", delay: 32 },
  13: { kind: "bar", delay: 36 },
  14: { kind: "bar", delay: 36 },
};

/**
 * The brand mark, animated per-SVG-path: the squircle scales in, the frame and
 * book settle, then the waveform bars pop from the center outward like an
 * equalizer catching the recitation. After assembling, the bars keep a subtle
 * idle bounce so the mark feels alive (solid shapes, so no shimmer).
 */
export const AnimatedLogo: React.FC<{ size?: number; delay?: number }> = ({
  size = 260,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - delay;

  const halo = 0.5 + Math.sin(frame / 22) * 0.18;

  const styleFor = (i: number): React.CSSProperties => {
    const plan = PLAN[i] ?? { kind: "frame" as Kind, delay: 10 };
    const s = spring({
      frame: f - plan.delay,
      fps,
      config: plan.kind === "bar" ? { damping: 11, mass: 0.5 } : { damping: 200 },
    });
    const opacity = interpolate(s, [0, 1], [0, 1], { extrapolateRight: "clamp" });
    const common: React.CSSProperties = {
      opacity,
      transformBox: "fill-box",
      transformOrigin: "center",
    };

    if (plan.kind === "bg") {
      return { ...common, transform: `scale(${interpolate(s, [0, 1], [0.72, 1])})` };
    }
    if (plan.kind === "frame") {
      return { ...common, transform: `scale(${interpolate(s, [0, 1], [0.9, 1])})` };
    }
    if (plan.kind === "book") {
      // rise from below + settle
      return { ...common, transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)` };
    }
    // bar: grow from its own centre (equalizer), then a gentle idle bounce
    const settled = interpolate(f - plan.delay, [0, 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const idle = 1 + settled * Math.sin((frame - plan.delay) / 9) * 0.06;
    const grow = interpolate(s, [0, 1], [0, 1]);
    return { ...common, transform: `scaleY(${grow * idle})` };
  };

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div
        style={{
          position: "absolute",
          inset: -size * 0.35,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(218,170,62,${halo * 0.5}) 0%, rgba(218,170,62,0) 62%)`,
        }}
      />
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`}
        style={{ filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.5))" }}
      >
        {LOGO_PATHS.map((p, i) => (
          <path key={i} d={p.d} fill={p.fill} style={styleFor(i)} />
        ))}
      </svg>
    </div>
  );
};
