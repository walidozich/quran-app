import React from "react";
import { Composition } from "remotion";
import { Demo, DEMO_DURATION } from "./Demo";
import { DemoV2, DEMO_V2_DURATION } from "./DemoV2";
import { LogoReveal } from "./scenes/LogoReveal";
import { FPS, HEIGHT, WIDTH } from "./theme";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Demo"
        component={Demo}
        durationInFrames={DEMO_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {/* v2 — family profiles, dual role, wird loop, co-teachers. */}
      <Composition
        id="DemoV2"
        component={DemoV2}
        durationInFrames={DEMO_V2_DURATION}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      {/* Standalone logo sting — square, 4s. */}
      <Composition
        id="LogoReveal"
        component={LogoReveal}
        durationInFrames={120}
        fps={FPS}
        width={1080}
        height={1080}
        defaultProps={{ transparent: false }}
      />
    </>
  );
};
