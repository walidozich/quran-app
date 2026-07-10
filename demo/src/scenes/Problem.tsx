import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { AR_FONT, COLORS, EN_FONT } from "../theme";

const LINES: { ar: string; en: string }[] = [
  { ar: "كيف يتابع المعلّم تلاوة كل طالب؟", en: "How does one teacher follow every student's recitation?" },
  { ar: "كيف يصحّح التجويد بدقّة، عن بُعد؟", en: "How do you correct tajweed precisely, from anywhere?" },
];

/** Scene 2 — the problem, posed as two questions that fade up in sequence. */
export const Problem: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Background glow="center" />
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 60 }}
      >
        {LINES.map((l, i) => {
          const delay = 8 + i * 40;
          const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
          const opacity = interpolate(s, [0, 1], [0, 1]);
          const y = interpolate(s, [0, 1], [30, 0]);
          return (
            <div key={i} style={{ opacity, transform: `translateY(${y}px)`, textAlign: "center" }}>
              <div
                style={{
                  fontFamily: AR_FONT,
                  direction: "rtl",
                  fontSize: 72,
                  fontWeight: 700,
                  color: COLORS.cream,
                }}
              >
                {l.ar}
              </div>
              <div
                style={{
                  fontFamily: EN_FONT,
                  fontSize: 28,
                  color: COLORS.creamDim,
                  marginTop: 12,
                }}
              >
                {l.en}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
