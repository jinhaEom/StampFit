import { heatColor } from '@/lib/heatmap';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const DELAY = 350; // 기록 화면이 닫히는 동안 기다림
const DOWN = 160; // 내려찍기
const SETTLE = 120; // 눌렸다가 복원

interface Props {
  level: number;
  animate?: boolean;
  inset?: number;
  onPlayed?: () => void;
}

export function StampDot({ level, animate = false, inset = 0, onPlayed }: Props) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(animate ? 0 : 1);

  useEffect(() => {
    if (!animate) {
      scale.value = 1;
      opacity.value = 1;
      return;
    }

    scale.value = 1.8;
    opacity.value = 0;
    scale.value = withDelay(
      DELAY,
      withSequence(
        withTiming(0.88, { duration: DOWN, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: SETTLE, easing: Easing.out(Easing.quad) }),
      ),
    );
    opacity.value = withDelay(DELAY, withTiming(1, { duration: DOWN }));

    // 칸에 닿는 순간 햅틱
    const timer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPlayed?.();
    }, DELAY + DOWN);
    return () => clearTimeout(timer);
  }, [animate, onPlayed, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: inset,
          right: inset,
          bottom: inset,
          left: inset,
          borderRadius: 999,
          backgroundColor: heatColor(level),
        },
        animatedStyle,
      ]}
    />
  );
}
