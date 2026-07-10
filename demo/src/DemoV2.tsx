import React from "react";
import { AbsoluteFill } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Hadith } from "./scenes/Hadith";
import { Open } from "./scenes/Open";
import { Close } from "./scenes/Close";
import { SplitScene } from "./components/SplitScene";
import { Callout } from "./components/Callout";
import { COLORS } from "./theme";

const XFADE = 16; // crossfade length in frames

// Called (not <T/>) so its element type is TransitionSeries.Transition.
const T = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: XFADE })}
  />
);

// Scene lengths (frames @30fps). v2: family profiles, dual role, the wird
// loop, quick assign and co-teachers — chapters alternate green/cream tones.
const D = {
  hadith: 240,
  open: 150,
  family: 310, //   vid_coldstart (trimmed to 10.6s — the OS stop-recording dialog is cut)
  picker: 140,
  verify: 120,
  mode: 195, //     vid_modeswitch (6.1s)
  wird: 150,
  record: 205, //   vid_record (reused)
  review: 250, //   vid_review (reused)
  complete: 150,
  assign: 330, //   vid_assign (pre-sped 1.6x, trimmed to 11.2s — stop-recording dialog cut)
  coteach: 160,
  stats: 130,
  close: 230,
} as const;

const N_TRANSITIONS = 13;

export const DemoV2: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.greenDeep }}>
      <TransitionSeries>
        {/* 0 — opening hadith */}
        <TransitionSeries.Sequence durationInFrames={D.hadith}>
          <Hadith />
        </TransitionSeries.Sequence>
        {T()}

        {/* 1 — name reveal (Sahibok) */}
        <TransitionSeries.Sequence durationInFrames={D.open}>
          <Open />
        </TransitionSeries.Sequence>
        {T()}

        {/* 2 — chapter 01: the family opens one app (cold start clip) */}
        <TransitionSeries.Sequence durationInFrames={D.family}>
          <SplitScene
            src="vid_coldstart_cfr2.mp4"
            video
            startFrom={0}
            phoneSide="right"
            kicker="One account"
            chapter="01"
            ar="عائلة كاملة… حسابٌ واحد"
            en="Open the app, pick who is reciting, and go. Profiles for the whole family, like Netflix."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 3 — the picker, up close (cream) */}
        <TransitionSeries.Sequence durationInFrames={D.picker}>
          <SplitScene
            src="s12_picker.png"
            phoneSide="left"
            tone="cream"
            kicker="Profiles"
            ar="لكلِّ فردٍ ملفُّه الخاص"
            en="Up to six people per account, each with their own recordings, reviews and progress."
          >
            <Callout x={600} y={320} ar="معلّم العائلة" delay={55} tone="green" />
          </SplitScene>
        </TransitionSeries.Sequence>
        {T()}

        {/* 4 — verified accounts */}
        <TransitionSeries.Sequence durationInFrames={D.verify}>
          <SplitScene
            src="s14_verify.png"
            phoneSide="right"
            kicker="Worldwide"
            ar="حساباتٌ موثّقة برمزٍ واحد"
            en="Sign up anywhere in the world: a 6-digit email code, no links, no hassle."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 5 — chapter 02: dual role (mode switch clip, cream) */}
        <TransitionSeries.Sequence durationInFrames={D.mode}>
          <SplitScene
            src="vid_modeswitch_cfr.mp4"
            video
            startFrom={0}
            phoneSide="left"
            tone="cream"
            kicker="Dual role"
            chapter="02"
            ar="معلّمٌ… وما زال طالبًا"
            en="One tap flips a teacher into learning mode, with their own teacher and their own wird."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 6 — chapter 03: the wird loop starts on the dashboard */}
        <TransitionSeries.Sequence durationInFrames={D.wird}>
          <SplitScene
            src="s15_wird_card.png"
            phoneSide="right"
            kicker="Your wird"
            chapter="03"
            ar="وِردُك الحالي بانتظارك"
            en="The dashboard leads with your current portion and one smart button for the next step."
          >
            <Callout x={1080} y={375} ar="اسمع التصحيح" delay={60} tone="gold" />
            <Callout x={1030} y={465} ar="المحاولة التالية" delay={82} tone="cream" />
          </SplitScene>
        </TransitionSeries.Sequence>
        {T()}

        {/* 7 — record the attempt (reused clip, cream) */}
        <TransitionSeries.Sequence durationInFrames={D.record}>
          <SplitScene
            src="vid_record_cfr.mp4"
            video
            startFrom={0}
            phoneSide="left"
            tone="cream"
            kicker="Record"
            ar="سجّل محاولتك"
            en="Record the attempt and send it. Corrections come back as a conversation."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 8 — teacher review (reused clip) with tags + reviewed-by */}
        <TransitionSeries.Sequence durationInFrames={D.review}>
          <SplitScene
            src="vid_review_cfr.mp4"
            video
            startFrom={0}
            phoneSide="left"
            kicker="For teachers"
            ar="مراجعة دقيقة بالتوقيت"
            en="Timestamped notes, tajweed tags and voice corrections, each review signed by its teacher."
            captionDelay={10}
          >
            <Callout x={1120} y={640} ar="مدّ" delay={70} tone="gold" />
            <Callout x={1300} y={700} ar="غُنّة" delay={90} tone="green" />
            <Callout x={1150} y={780} ar="راجعه: الشيخ أحمد" delay={115} tone="cream" />
          </SplitScene>
        </TransitionSeries.Sequence>
        {T()}

        {/* 9 — complete right where you listened (cream) */}
        <TransitionSeries.Sequence durationInFrames={D.complete}>
          <SplitScene
            src="s11_roster.png"
            phoneSide="right"
            tone="cream"
            kicker="Done means done"
            ar="أتمّ الوردَ وتابع كلَّ طالب"
            en="One tap completes the student's wird right where the teacher heard it, and the class progress is always in sight."
          >
            <Callout x={1090} y={560} ar="تمّ الإتمام ✓" delay={55} tone="green" />
          </SplitScene>
        </TransitionSeries.Sequence>
        {T()}

        {/* 10 — quick assign + auto-continuation (new clip) */}
        <TransitionSeries.Sequence durationInFrames={D.assign}>
          <SplitScene
            src="vid_assign_cfr2.mp4"
            video
            startFrom={0}
            phoneSide="left"
            kicker="Two taps"
            ar="الوردُ التالي يُقترَح تلقائيًا"
            en="Assigning continues where the last wird ended: two taps, and the whole class is notified."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 11 — chapter 04: co-teachers (cream) */}
        <TransitionSeries.Sequence durationInFrames={D.coteach}>
          <SplitScene
            src="s17_manage.png"
            phoneSide="right"
            tone="cream"
            kicker="Co-teachers"
            chapter="04"
            ar="معلّمون يتعاونون في صفٍّ واحد"
            en="A secret teachers' code invites co-teachers with full reviewing rights. The owner stays in charge."
          >
            <Callout x={1070} y={585} ar="رمز المعلّمين" delay={60} tone="gold" />
          </SplitScene>
        </TransitionSeries.Sequence>
        {T()}

        {/* 12 — progress for everyone */}
        <TransitionSeries.Sequence durationInFrames={D.stats}>
          <SplitScene
            src="s18_stats.png"
            phoneSide="left"
            kicker="Progress"
            ar="تقدُّمٌ يُرى بوضوح"
            en="Coverage, most-recited surahs and common mistakes, for every member of the family."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 13 — close */}
        <TransitionSeries.Sequence durationInFrames={D.close}>
          <Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const DEMO_V2_DURATION =
  Object.values(D).reduce((a, b) => a + b, 0) - N_TRANSITIONS * XFADE;
