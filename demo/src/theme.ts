import { loadFont as loadTajawal } from "@remotion/google-fonts/Tajawal";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadAmiri } from "@remotion/google-fonts/Amiri";

// Arabic + Latin display face (also the app's bundled UI font family).
export const tajawal = loadTajawal();
// Clean Latin face for the English secondary line.
export const inter = loadInter();
// Elegant naskh face reserved for scripture / the opening hadith.
export const amiri = loadAmiri();

export const AR_FONT = tajawal.fontFamily;
export const EN_FONT = inter.fontFamily;
export const SCRIPTURE_FONT = amiri.fontFamily;

// Brand palette, sampled from logo.svg.
export const COLORS = {
  green: "#01443A", // deep primary
  greenDeep: "#012E27", // darker for gradient floor
  green2: "#0A6152", // lifted green for highlights
  gold: "#DAAA3E", // accent
  goldSoft: "#E8C877",
  cream: "#FBF1D9", // light text / surfaces
  creamDim: "rgba(251,241,217,0.72)",
  cream2: "#F3E7C9", // deeper cream for light-scene gradients
  ink: "#06231E", // near-black green for phone bezel
  inkDim: "rgba(6,35,30,0.66)",
  goldDeep: "#A67C1B", // gold with enough contrast on cream
  white: "#FFFFFF",
} as const;

/** Scene tone: v1 scenes are all "green"; v2 alternates green/cream chapters. */
export type Tone = "green" | "cream";

// Canvas
export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
