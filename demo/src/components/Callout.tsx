import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AR_FONT, COLORS } from "../theme";

/**
 * A floating pill that points at part of the phone. Positioned absolutely in
 * the full 1920x1080 frame via `x`/`y` (top-left of the pill). Pops in with a
 * spring at `delay`.
 */
export const Callout: React.FC<{
  x: number;
  y: number;
  ar: string;
  delay?: number;
  tone?: "gold" | "green" | "cream";
}> = ({ x, y, ar, delay = 0, tone = "gold" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 14, mass: 0.6 } });
  const scale = interpolate(s, [0, 1], [0.6, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);

  const bg =
    tone === "gold" ? COLORS.gold : tone === "green" ? COLORS.green2 : COLORS.cream;
  const fg = tone === "cream" ? COLORS.green : tone === "gold" ? COLORS.green : COLORS.cream;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transform: `scale(${scale})`,
        transformOrigin: "center",
        opacity,
        background: bg,
        color: fg,
        fontFamily: AR_FONT,
        direction: "rtl",
        fontSize: 30,
        fontWeight: 700,
        padding: "14px 26px",
        borderRadius: 999,
        boxShadow: "0 16px 40px rgba(0,0,0,0.4)",
        whiteSpace: "nowrap",
      }}
    >
      {ar}
    </div>
  );
};
