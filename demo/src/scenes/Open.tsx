import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { AnimatedLogo } from "../components/AnimatedLogo";
import { AR_FONT, COLORS, EN_FONT } from "../theme";

/** Scene 1 — name reveal: "…أنا صاحبك" → the logo and the name Sahibok. */
export const Open: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = (delay: number, dist = 20) => {
    const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
    return {
      opacity: interpolate(s, [0, 1], [0, 1]),
      transform: `translateY(${interpolate(s, [0, 1], [dist, 0])}px)`,
    };
  };

  const line = interpolate(frame, [46, 70], [0, 360], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <Background glow="center" />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 22 }}
      >
        {/* echo of the hadith's last words */}
        <div
          style={{
            ...reveal(2, 12),
            fontFamily: AR_FONT,
            direction: "rtl",
            fontSize: 34,
            color: COLORS.gold,
            marginBottom: 6,
          }}
        >
          ‌…ولهذا سمّيناه
        </div>

        <AnimatedLogo size={230} delay={12} />

        {/* the name */}
        <div
          style={{
            ...reveal(26),
            fontFamily: AR_FONT,
            direction: "rtl",
            fontSize: 96,
            fontWeight: 700,
            color: COLORS.cream,
            lineHeight: 1.1,
          }}
        >
          صاحِبُك
        </div>
        <div
          style={{
            ...reveal(34),
            fontFamily: EN_FONT,
            fontSize: 30,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: COLORS.gold,
          }}
        >
          Sahibok
        </div>

        <div
          style={{
            width: line,
            height: 3,
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            marginTop: 10,
          }}
        />

        <div
          style={{
            ...reveal(52),
            fontFamily: AR_FONT,
            direction: "rtl",
            fontSize: 28,
            color: COLORS.creamDim,
            textAlign: "center",
          }}
        >
          رفيقُك في حفظ كتاب الله: تلاوة، مراجعة، ومتابعة
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
