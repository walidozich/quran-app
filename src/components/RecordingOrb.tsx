import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useColors } from "../theme";

/**
 * Animated "speaking" orb — a soft pulsing circle with expanding ripple rings,
 * like a voice-assistant listening indicator. Purely decorative (continuous loop).
 */
export function RecordingOrb({ size = 132 }: { size?: number }) {
  const colors = useColors();
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;
  const core = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const ripple = (v: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 2100,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(core, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(core, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    const anims = [ripple(ring1, 0), ripple(ring2, 700), ripple(ring3, 1400), breathe];
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, [ring1, ring2, ring3, core]);

  const ringStyle = (v: Animated.Value) => ({
    transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1.55] }) }],
    opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.45, 0] }),
  });
  const coreScale = core.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });

  const ringBase = {
    position: "absolute" as const,
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.primary,
  };

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View style={[ringBase, ringStyle(ring1)]} />
      <Animated.View style={[ringBase, ringStyle(ring2)]} />
      <Animated.View style={[ringBase, ringStyle(ring3)]} />
      <Animated.View
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: size * 0.25,
          backgroundColor: colors.primary,
          alignItems: "center",
          justifyContent: "center",
          transform: [{ scale: coreScale }],
        }}
      >
        <View
          style={{
            width: size * 0.16,
            height: size * 0.16,
            borderRadius: size * 0.08,
            backgroundColor: colors.textOnPrimary,
          }}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
});
