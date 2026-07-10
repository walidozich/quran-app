import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { COLORS, Tone } from "../theme";

/**
 * Branded backdrop shared by every scene. Two tones: the deep-green original,
 * and a cream "paper" variant (v2 alternates them per chapter). Only the soft
 * radial glow breathes — a smooth alpha change that cannot alias; the
 * geometric motif stays STATIC (moving thin lines caused shimmer).
 */
export const Background: React.FC<{ glow?: "left" | "right" | "center"; tone?: Tone }> = ({
  glow = "right",
  tone = "green",
}) => {
  const frame = useCurrentFrame();
  const glowPulse = 0.20 + (Math.sin(frame / 70) + 1) * 0.03;
  const glowX = glow === "left" ? "28%" : glow === "center" ? "50%" : "72%";

  if (tone === "cream") {
    return (
      <AbsoluteFill>
        <AbsoluteFill
          style={{
            background: `radial-gradient(120% 120% at 50% -10%, ${COLORS.cream} 0%, ${COLORS.cream} 46%, ${COLORS.cream2} 100%)`,
          }}
        />
        {/* soft green glow instead of gold */}
        <AbsoluteFill
          style={{
            background: `radial-gradient(46% 58% at ${glowX} 46%, rgba(10,97,82,${glowPulse * 0.55}) 0%, rgba(10,97,82,0) 62%)`,
          }}
        />
        <AbsoluteFill
          style={{
            opacity: 0.045,
            backgroundImage: `linear-gradient(45deg, ${COLORS.green} 1px, transparent 1px), linear-gradient(-45deg, ${COLORS.green} 1px, transparent 1px)`,
            backgroundSize: "92px 92px",
          }}
        />
        <AbsoluteFill style={{ boxShadow: "inset 0 0 320px rgba(105,80,20,0.18)" }} />
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill>
      {/* base gradient */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(120% 120% at 50% -10%, ${COLORS.green2} 0%, ${COLORS.green} 42%, ${COLORS.greenDeep} 100%)`,
        }}
      />
      {/* gold glow — soft, breathes gently in place */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(42% 55% at ${glowX} 44%, rgba(218,170,62,${glowPulse}) 0%, rgba(218,170,62,0) 62%)`,
        }}
      />
      {/* faint STATIC geometric motif (no motion → no flicker) */}
      <AbsoluteFill
        style={{
          opacity: 0.05,
          backgroundImage: `linear-gradient(45deg, ${COLORS.gold} 1px, transparent 1px), linear-gradient(-45deg, ${COLORS.gold} 1px, transparent 1px)`,
          backgroundSize: "92px 92px",
        }}
      />
      {/* soft vignette */}
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 400px rgba(0,0,0,0.55)",
        }}
      />
    </AbsoluteFill>
  );
};
