import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect, Text } from 'react-native-svg';

const DOWN = 180; // 내려찍기
const SETTLE = 140; // 눌렸다가 복원

export function DoneStamp() {
  const scale = useSharedValue(2.2);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(0.9, { duration: DOWN, easing: Easing.in(Easing.quad) }),
      withTiming(1, { duration: SETTLE, easing: Easing.out(Easing.quad) }),
    );
    opacity.value = withTiming(1, { duration: DOWN });

    // 종이에 닿는 순간 햅틱
    const timer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, DOWN);
    return () => clearTimeout(timer);
  }, [scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: '-12deg' }, { scale: scale.value }],
  }));

  return (
    <View className="absolute inset-0 items-center justify-center bg-black/60">
      <Animated.View style={[{ width: 240, aspectRatio: 112 / 44 }, animatedStyle]}>
        <Svg width="100%" height="100%" viewBox="0 0 112 44" opacity={0.9}>
          <Rect x={2} y={2} width={108} height={40} rx={5} fill="none" stroke={Colors.danger} strokeWidth={4} />
          <Rect x={8} y={8} width={96} height={28} rx={2} fill="none" stroke={Colors.danger} strokeWidth={1.5} />
          <Text
            x={56}
            y={30}
            textAnchor="middle"
            fontSize={22}
            fontWeight="500"
            letterSpacing={2}
            fill={Colors.danger}
          >
            DONE!
          </Text>
        </Svg>
      </Animated.View>
    </View>
  );
}
