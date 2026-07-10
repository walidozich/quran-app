import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { AnimatedLogo } from "../components/AnimatedLogo";
import { AR_FONT, COLORS, EN_FONT } from "../theme";

/** Scene 12 — close: logo, charity promise, and the open-source handle. */
export const Close: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = (delay: number) => {
    const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
    return { opacity: interpolate(s, [0, 1], [0, 1]), transform: `translateY(${interpolate(s, [0, 1], [22, 0])}px)` };
  };

  return (
    <AbsoluteFill>
      <Background glow="center" />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 30 }}
      >
        <AnimatedLogo size={210} delay={2} />
        <div
          style={{
            ...reveal(14),
            fontFamily: AR_FONT,
            direction: "rtl",
            fontSize: 64,
            fontWeight: 700,
            color: COLORS.cream,
            textAlign: "center",
          }}
        >
          صدقةٌ جارية · مجّاني للأبد ❤️
        </div>
        <div
          style={{
            ...reveal(24),
            fontFamily: EN_FONT,
            fontSize: 28,
            color: COLORS.creamDim,
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          Built for good deeds. Free forever, non-commercial, open source.
        </div>
        <div
          style={{
            ...reveal(36),
            marginTop: 20,
            fontFamily: EN_FONT,
            fontSize: 26,
            fontWeight: 700,
            color: COLORS.gold,
            letterSpacing: 1,
            border: `2px solid ${COLORS.gold}`,
            borderRadius: 999,
            padding: "12px 30px",
          }}
        >
          صاحبك · Sahibok · github.com/walidozich/quran-app
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
