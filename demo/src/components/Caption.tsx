import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { AR_FONT, COLORS, EN_FONT, Tone } from "../theme";

/** Reveal a value with a spring + upward slide, delayed by `delay` frames. */
function useReveal(delay: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [26, 0]);
  return { opacity, transform: `translateY(${y}px)` };
}

/**
 * Bilingual caption block: large Arabic headline (RTL) + smaller English line.
 * `align` controls text alignment; use "right" when the phone sits on the left.
 */
export const Caption: React.FC<{
  ar: string;
  en: string;
  align?: "left" | "right" | "center";
  delay?: number;
  kicker?: string; // small gold eyebrow label
  maxWidth?: number;
  tone?: Tone;
}> = ({ ar, en, align = "right", delay = 6, kicker, maxWidth = 720, tone = "green" }) => {
  const k = useReveal(delay);
  const a = useReveal(delay + 6);
  const e = useReveal(delay + 14);

  const items = align === "right" ? "flex-end" : align === "center" ? "center" : "flex-start";
  const textAlign = align;
  const kickerColor = tone === "cream" ? COLORS.goldDeep : COLORS.gold;
  const headColor = tone === "cream" ? COLORS.ink : COLORS.cream;
  const bodyColor = tone === "cream" ? COLORS.inkDim : COLORS.creamDim;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: items,
        gap: 16,
        maxWidth,
      }}
    >
      {kicker ? (
        <div
          style={{
            ...k,
            fontFamily: EN_FONT,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontSize: 20,
            fontWeight: 700,
            color: kickerColor,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ width: 34, height: 2, background: kickerColor, display: "inline-block" }} />
          {kicker}
        </div>
      ) : null}

      <div
        style={{
          ...a,
          fontFamily: AR_FONT,
          direction: "rtl",
          textAlign,
          fontSize: 66,
          lineHeight: 1.25,
          fontWeight: 700,
          color: headColor,
          textShadow: tone === "cream" ? "none" : "0 4px 24px rgba(0,0,0,0.35)",
        }}
      >
        {ar}
      </div>

      <div
        style={{
          ...e,
          fontFamily: EN_FONT,
          textAlign,
          fontSize: 27,
          lineHeight: 1.4,
          fontWeight: 400,
          color: bodyColor,
          maxWidth: maxWidth - 40,
        }}
      >
        {en}
      </div>
    </div>
  );
};
