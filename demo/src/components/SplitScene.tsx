import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, EN_FONT, Tone } from "../theme";
import { Background } from "./Background";
import { Caption } from "./Caption";
import { PhoneFrame } from "./PhoneFrame";

type Props = {
  src: string;
  video?: boolean;
  startFrom?: number;
  phoneSide?: "left" | "right";
  phoneHeight?: number;
  kicker?: string;
  ar: string;
  en: string;
  captionDelay?: number;
  tone?: Tone;
  /** Big faint chapter numeral behind the caption (v2 style), e.g. "02". */
  chapter?: string;
  children?: React.ReactNode; // callouts, extra overlays
};

/**
 * Standard scene: a phone on one side with a bilingual caption on the other,
 * over the shared branded background. The phone slides + fades in and then
 * floats gently; the caption reveals slightly after.
 */
export const SplitScene: React.FC<Props> = ({
  src,
  video,
  startFrom,
  phoneSide = "left",
  phoneHeight = 900,
  kicker,
  ar,
  en,
  captionDelay = 12,
  tone = "green",
  chapter,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame, fps, config: { damping: 200, mass: 1.1 } });
  const y = interpolate(enter, [0, 1], [90, 0]);
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  // Gentle vertical drift only — pure translation, no rotation (rotation
  // resampling was making the screenshot text shimmer).
  const float = Math.sin(frame / 55) * 6;

  const phoneFirst = phoneSide === "left";

  const Phone = (
    <div
      style={{
        flex: "0 0 auto",
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${y + float}px)`,
      }}
    >
      <PhoneFrame src={src} video={video} startFrom={startFrom} height={phoneHeight} />
    </div>
  );

  const Text = (
    <div
      style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        flexDirection: "column",
        paddingRight: phoneFirst ? 90 : 60,
        paddingLeft: phoneFirst ? 60 : 90,
        position: "relative",
      }}
    >
      {chapter ? (
        <div
          style={{
            position: "absolute",
            top: -40,
            right: phoneFirst ? 40 : undefined,
            left: phoneFirst ? undefined : 40,
            fontFamily: EN_FONT,
            fontSize: 340,
            fontWeight: 800,
            lineHeight: 1,
            color: tone === "cream" ? COLORS.green : COLORS.cream,
            opacity: 0.07,
            userSelect: "none",
          }}
        >
          {chapter}
        </div>
      ) : null}
      <Caption
        ar={ar}
        en={en}
        kicker={kicker}
        align="right"
        delay={captionDelay}
        maxWidth={760}
        tone={tone}
      />
    </div>
  );

  return (
    <AbsoluteFill>
      <Background glow={phoneFirst ? "left" : "right"} tone={tone} />
      <AbsoluteFill
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingLeft: 120,
          paddingRight: 120,
          gap: 40,
        }}
      >
        {phoneFirst ? Phone : Text}
        {phoneFirst ? Text : Phone}
      </AbsoluteFill>
      {children}
    </AbsoluteFill>
  );
};
