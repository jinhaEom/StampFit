import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';


const DELAY = 350; 
const DURATION = 180;

interface Props {
  animate?: boolean;
  inset?: number;
  onPlayed?: () => void;
}

export function StampRing({ animate = false, inset = 0, onPlayed }: Props) {
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
    scale.value = withDelay(DELAY, withTiming(1, { duration: DURATION, easing: Easing.in(Easing.quad) }));
    opacity.value = withDelay(DELAY, withTiming(1, { duration: DURATION }));

    const timer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPlayed?.();
    }, DELAY + DURATION);
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
          borderWidth: 2,
          borderColor: Colors.mainColor,
        },
        animatedStyle,
      ]}
    />
  );
}
