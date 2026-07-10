import React from "react";
import { AbsoluteFill } from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { Hadith } from "./scenes/Hadith";
import { Open } from "./scenes/Open";
import { Problem } from "./scenes/Problem";
import { Close } from "./scenes/Close";
import { SplitScene } from "./components/SplitScene";
import { Callout } from "./components/Callout";
import { COLORS } from "./theme";

const XFADE = 16; // crossfade length in frames

// Every transition is identical. Called (not <T/>) so its element type is
// TransitionSeries.Transition, which the parent requires.
const T = () => (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: XFADE })}
  />
);

// Scene lengths (frames @30fps). Kept here so the total is easy to audit.
const D = {
  hadith: 240,
  open: 150,
  problem: 140,
  signin: 120,
  dash: 150,
  klass: 140,
  picker: 215,
  record: 205,
  submitted: 120,
  review: 250,
  compare: 220,
  thread: 195,
  roster: 175,
  close: 230,
} as const;

const N_TRANSITIONS = 13;

export const Demo: React.FC = () => {
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

        {/* 2 — the problem */}
        <TransitionSeries.Sequence durationInFrames={D.problem}>
          <Problem />
        </TransitionSeries.Sequence>
        {T()}

        {/* 3 — enter the app (sign-in) */}
        <TransitionSeries.Sequence durationInFrames={D.signin}>
          <SplitScene
            src="s1_signin.png"
            phoneSide="left"
            kicker="Get started"
            ar="حساب معلّم أو طالب"
            en="Sign in as a teacher or a student. One app, two roles."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 4 — student dashboard */}
        <TransitionSeries.Sequence durationInFrames={D.dash}>
          <SplitScene
            src="s2_student_dash.png"
            phoneSide="right"
            kicker="For students"
            ar="إحصاءاتك في لمحة"
            en="Recordings, reviews and wird progress, at a glance."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 5 — open a wird (student class screen) */}
        <TransitionSeries.Sequence durationInFrames={D.klass}>
          <SplitScene
            src="s3_student_class.png"
            phoneSide="left"
            kicker="Daily wird"
            ar="وردُ اليوم بانتظارك"
            en="The teacher assigns a portion; the student sees it and its status."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 6 — ayah / page picker (CFR clip, sped 1.8x, plays in full) */}
        <TransitionSeries.Sequence durationInFrames={D.picker}>
          <SplitScene
            src="vid_picker_cfr.mp4"
            video
            startFrom={0}
            phoneSide="right"
            kicker="Precise references"
            ar="اختر الآيات أو الصفحة"
            en="Pick an exact ayah range, or a whole page, in seconds."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 7 — record (CFR clip) */}
        <TransitionSeries.Sequence durationInFrames={D.record}>
          <SplitScene
            src="vid_record_cfr.mp4"
            video
            startFrom={0}
            phoneSide="left"
            kicker="Record"
            ar="سجّل تلاوتك"
            en="One tap to record a recitation and send it to the teacher."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 8 — submitted / notification */}
        <TransitionSeries.Sequence durationInFrames={D.submitted}>
          <SplitScene
            src="s5_submitted.png"
            phoneSide="right"
            kicker="Delivered"
            ar="تم الإرسال إلى المعلّم"
            en="Submitted. The teacher gets a push notification instantly."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 9 — teacher review (CFR clip) with tajweed chips */}
        <TransitionSeries.Sequence durationInFrames={D.review}>
          <SplitScene
            src="vid_review_cfr.mp4"
            video
            startFrom={0}
            phoneSide="left"
            kicker="For teachers"
            ar="مراجعة دقيقة بالتوقيت"
            en="Scrub the audio, drop timestamped notes, tag the tajweed, reply by voice."
            captionDelay={10}
          >
            <Callout x={1120} y={640} ar="مدّ" delay={70} tone="gold" />
            <Callout x={1300} y={700} ar="غُنّة" delay={90} tone="green" />
            <Callout x={1150} y={780} ar="ملاحظة صوتية" delay={110} tone="cream" />
          </SplitScene>
        </TransitionSeries.Sequence>
        {T()}

        {/* 9b — re-listen / compare: hear the teacher's correction, replay your own */}
        <TransitionSeries.Sequence durationInFrames={D.compare}>
          <SplitScene
            src="s9_completed.png"
            phoneSide="right"
            kicker="Learn from it"
            ar="استمع للتصحيح ثم أعد سماع نفسك"
            en="Play the teacher's voice correction, then replay your own recitation to hear the mistake and fix it."
          >
            <Callout x={995} y={540} ar="تصحيح المعلّم" delay={60} tone="gold" />
            <Callout x={1035} y={690} ar="تلاوتك أنت" delay={82} tone="cream" />
          </SplitScene>
        </TransitionSeries.Sequence>
        {T()}

        {/* 10 — feedback loop (thread) */}
        <TransitionSeries.Sequence durationInFrames={D.thread}>
          <SplitScene
            src="s10_thread.png"
            phoneSide="left"
            kicker="A conversation"
            ar="الطالب يردّ بمحاولة جديدة"
            en="Feedback becomes a thread: the student replies with a fresh attempt."
          />
        </TransitionSeries.Sequence>
        {T()}

        {/* 11 — wird complete (roster) */}
        <TransitionSeries.Sequence durationInFrames={D.roster}>
          <SplitScene
            src="s11_roster.png"
            phoneSide="right"
            kicker="Track the class"
            ar="متابعة كل طالب على حدة"
            en="Mark each student's wird complete and watch the class progress."
          >
            <Callout x={360} y={720} ar="تمّ الإتمام ✓" delay={55} tone="gold" />
          </SplitScene>
        </TransitionSeries.Sequence>
        {T()}

        {/* 12 — close */}
        <TransitionSeries.Sequence durationInFrames={D.close}>
          <Close />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const DEMO_DURATION =
  Object.values(D).reduce((a, b) => a + b, 0) - N_TRANSITIONS * XFADE;
