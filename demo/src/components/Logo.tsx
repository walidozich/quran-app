import React from "react";
import { Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

/** Animated brand mark: soft scale-in with a breathing gold halo. */
export const Logo: React.FC<{ size?: number; delay?: number }> = ({
  size = 260,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 120, mass: 0.8 } });
  const scale = interpolate(s, [0, 1], [0.72, 1]);
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const halo = 0.5 + Math.sin(frame / 22) * 0.18;

  return (
    <div style={{ position: "relative", width: size, height: size, opacity }}>
      <div
        style={{
          position: "absolute",
          inset: -size * 0.35,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(218,170,62,${halo * 0.5}) 0%, rgba(218,170,62,0) 62%)`,
        }}
      />
      <Img
        src={staticFile("assets/logo.svg")}
        style={{
          width: size,
          height: size,
          transform: `scale(${scale})`,
          filter: "drop-shadow(0 18px 40px rgba(0,0,0,0.5))",
        }}
      />
    </div>
  );
};

/** Small wordmark used under the logo. */
export const Wordmark: React.FC<{ delay?: number }> = ({ delay = 10 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [18, 0]);
  return (
    <div style={{ opacity, transform: `translateY(${y}px)`, textAlign: "center" }}>
      <div
        style={{
          fontFamily: "Tajawal",
          direction: "rtl",
          fontSize: 60,
          fontWeight: 700,
          color: COLORS.cream,
        }}
      >
        منصّة تعليم القرآن
      </div>
      <div
        style={{
          fontFamily: "Inter",
          fontSize: 24,
          letterSpacing: 6,
          textTransform: "uppercase",
          color: COLORS.gold,
          marginTop: 8,
        }}
      >
        Quran Learning Platform
      </div>
    </div>
  );
};
