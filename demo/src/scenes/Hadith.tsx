import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Background } from "../components/Background";
import { COLORS, EN_FONT, SCRIPTURE_FONT } from "../theme";

const HADITH =
  "إنَّ القُرآنَ يَلْقى صاحبَه يومَ القيامةِ حين ينشَقُّ عنه قبْرُه كالرَّجُلِ الشَّاحبِ، يقولُ: هل تَعْرِفُني؟ فيقولُ له: ما أعرَفُك، فيقولُ: أنا صاحِبُك";

const EN_GLOSS =
  "“The Qur’an will meet its companion on the Day of Resurrection… saying: I am your companion.”";

/** Scene 0 — the opening hadith that gives the app its name (صاحبك / Sahibok). */
export const Hadith: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const reveal = (delay: number, dist = 26) => {
    const s = spring({ frame: frame - delay, fps, config: { damping: 200 } });
    return {
      opacity: interpolate(s, [0, 1], [0, 1]),
      transform: `translateY(${interpolate(s, [0, 1], [dist, 0])}px)`,
    };
  };

  return (
    <AbsoluteFill>
      <Background glow="center" />
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          padding: "0 220px",
          gap: 34,
        }}
      >
        {/* opening quote mark */}
        <div
          style={{
            ...reveal(2, 10),
            fontFamily: SCRIPTURE_FONT,
            fontSize: 120,
            lineHeight: 0.2,
            color: COLORS.gold,
            height: 40,
          }}
        >
          ”
        </div>

        <div
          style={{
            ...reveal(8),
            fontFamily: SCRIPTURE_FONT,
            direction: "rtl",
            textAlign: "center",
            fontSize: 52,
            lineHeight: 1.9,
            fontWeight: 700,
            color: COLORS.cream,
            textShadow: "0 4px 30px rgba(0,0,0,0.4)",
          }}
        >
          {HADITH}
        </div>

        <div
          style={{
            ...reveal(30),
            width: 260,
            height: 2,
            background: `linear-gradient(90deg, transparent, ${COLORS.gold}, transparent)`,
            marginTop: 6,
          }}
        />

        <div
          style={{
            ...reveal(40),
            fontFamily: EN_FONT,
            fontStyle: "italic",
            textAlign: "center",
            fontSize: 24,
            color: COLORS.creamDim,
            maxWidth: 900,
          }}
        >
          {EN_GLOSS}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
