import { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useReducedMotion } from "../lib/useReducedMotion";
import { LOGO_PATHS, LOGO_VIEWBOX } from "./logoPaths";

const AnimatedPath = Animated.createAnimatedComponent(Path);

// Path roles in the generated list (same mapping as the promo video):
// 0 = squircle background · 1 = gold book/wings · 2 = gold arch · 3-6 = cream
// book pages · 7 = gold inner frame · 8-14 = the "recitation equalizer" bars,
// ordered center-outward as [8], [9,10], [11,12], [13,14].
const BAR_RINGS: number[][] = [[8], [9, 10], [11, 12], [13, 14]];
const BOOK = [1, 3, 4, 5, 6];
const FRAME = [2, 7];
const CENTER = LOGO_VIEWBOX / 2;
const BAR_CENTER_Y = 560; // all bars share this visual midline

type Props = {
  size: number;
  /** Extra start delay in ms. */
  delay?: number;
};

/**
 * The logo with its SVG parts animating in: background scales up, frame fades,
 * book rises, then the equalizer bars pop center-outward — the same
 * choreography as the promo video, on-device. Renders statically when the OS
 * asks for reduced motion.
 */
export function AnimatedLogo({ size, delay = 0 }: Props) {
  const reduced = useReducedMotion();
  const bg = useRef(new Animated.Value(0)).current;
  const frame = useRef(new Animated.Value(0)).current;
  const book = useRef(new Animated.Value(0)).current;
  const bars = useRef(BAR_RINGS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (reduced) {
      [bg, frame, book, ...bars].forEach((v) => v.setValue(1));
      return;
    }
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(bg, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: false, // SVG props animate on the JS driver
        }),
        Animated.sequence([
          Animated.delay(140),
          Animated.timing(frame, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        ]),
        Animated.sequence([
          Animated.delay(240),
          Animated.timing(book, { toValue: 1, duration: 460, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
        ]),
        ...bars.map((v, ring) =>
          Animated.sequence([
            Animated.delay(460 + ring * 90),
            Animated.spring(v, { toValue: 1, friction: 4.5, tension: 90, useNativeDriver: false }),
          ])
        ),
      ]),
    ]);
    anim.start();
    return () => anim.stop();
  }, [reduced, delay, bg, frame, book, bars]);

  const barRing = (i: number): Animated.Value => {
    const ring = BAR_RINGS.findIndex((r) => r.includes(i));
    return bars[ring === -1 ? 0 : ring];
  };

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${LOGO_VIEWBOX} ${LOGO_VIEWBOX}`}>
      {LOGO_PATHS.map((p, i) => {
        if (i === 0) {
          return (
            <AnimatedPath
              key={i}
              d={p.d}
              fill={p.fill}
              opacity={bg}
              originX={CENTER}
              originY={CENTER}
              scale={bg.interpolate({ inputRange: [0, 1], outputRange: [0.72, 1] })}
            />
          );
        }
        if (FRAME.includes(i)) {
          return (
            <AnimatedPath
              key={i}
              d={p.d}
              fill={p.fill}
              opacity={frame}
              originX={CENTER}
              originY={CENTER}
              scale={frame.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] })}
            />
          );
        }
        if (BOOK.includes(i)) {
          return (
            <AnimatedPath
              key={i}
              d={p.d}
              fill={p.fill}
              opacity={book}
              translateY={book.interpolate({ inputRange: [0, 1], outputRange: [46, 0] })}
            />
          );
        }
        const v = barRing(i);
        return (
          <AnimatedPath
            key={i}
            d={p.d}
            fill={p.fill}
            opacity={v}
            originX={p.x + 8}
            originY={BAR_CENTER_Y}
            scaleY={v.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] })}
          />
        );
      })}
    </Svg>
  );
}
