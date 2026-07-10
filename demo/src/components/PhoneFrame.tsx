import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, staticFile } from "remotion";
import { COLORS } from "../theme";

// Screenshot native size 1080x2340 (aspect 0.4615).
const SCREEN_ASPECT = 1080 / 2340;

/**
 * A portrait phone device shell containing a screenshot (Img) or screen
 * recording (video). `height` is the device outer height in px; width follows
 * the screen aspect + bezel.
 */
export const PhoneFrame: React.FC<{
  src: string; // asset filename under public/assets
  video?: boolean;
  height?: number;
  startFrom?: number; // for video: trim start (frames)
  muted?: boolean;
}> = ({ src, video = false, height = 940, startFrom, muted = true }) => {
  const bezel = Math.round(height * 0.018);
  const radius = Math.round(height * 0.062);
  const screenH = height - bezel * 2;
  const screenW = screenH * SCREEN_ASPECT;
  const outerW = screenW + bezel * 2;
  const inner = radius - bezel;

  return (
    <div
      style={{
        width: outerW,
        height,
        borderRadius: radius,
        background: `linear-gradient(160deg, #12332c 0%, ${COLORS.ink} 60%, #010f0c 100%)`,
        padding: bezel,
        boxShadow:
          "0 60px 120px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.45), inset 0 0 0 2px rgba(218,170,62,0.25)",
        position: "relative",
      }}
    >
      <div
        style={{
          width: screenW,
          height: screenH,
          borderRadius: inner,
          overflow: "hidden",
          position: "relative",
          background: COLORS.cream,
        }}
      >
        {video ? (
          <OffthreadVideo
            src={staticFile(`assets/${src}`)}
            startFrom={startFrom}
            muted={muted}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <Img
            src={staticFile(`assets/${src}`)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        )}
        {/* subtle screen sheen */}
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(115deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 30%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};
