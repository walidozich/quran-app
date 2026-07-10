import React from "react";
import { AbsoluteFill } from "remotion";
import { Background } from "../components/Background";
import { AnimatedLogo } from "../components/AnimatedLogo";

/**
 * Standalone logo sting — just the animated mark, centred. Separate composition
 * so it renders independently of the main Demo. Pass `transparent: true` (via
 * --props) to drop the background for an alpha export usable as an overlay.
 */
export const LogoReveal: React.FC<{ transparent?: boolean }> = ({
  transparent = false,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: transparent ? "transparent" : undefined }}>
      {transparent ? null : <Background glow="center" />}
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <AnimatedLogo size={560} delay={4} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
