import { Colors } from '@/constants/colors';
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Rect, Text } from 'react-native-svg';

const DELAY = 350;
const DOWN = 160; // 내려찍기
const SETTLE = 120; // 눌렸다가 복원
const TILT = '-18deg';
// 도장은 살짝 흐리게
const STAMP_OPACITY = 0.7;
// 날짜를 가리지 않게 우측아래로.
const OFFSET_X = '30%';
const OFFSET_Y = '35%';

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

    scale.value = 2;
    opacity.value = 0;
    scale.value = withDelay(
      DELAY,
      withSequence(
        withTiming(0.88, { duration: DOWN, easing: Easing.in(Easing.quad) }),
        withTiming(1, { duration: SETTLE, easing: Easing.out(Easing.quad) }),
      ),
    );
    opacity.value = withDelay(DELAY, withTiming(1, { duration: DOWN }));

    const timer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPlayed?.();
    }, DELAY + DOWN);
    return () => clearTimeout(timer);
  }, [animate, onPlayed, scale, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: TILT }, { scale: scale.value }],
  }));

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: inset, right: inset, bottom: inset, left: inset }}
    >
      <Animated.View
        style={[
          {
            position: 'absolute',
            top: OFFSET_Y,
            left: OFFSET_X,
            width: '100%',
            height: '100%',
            alignItems: 'center',
            justifyContent: 'center',
          },
          animatedStyle,
        ]}
      >
        <View style={{ width: '108%'}}>
          <ClearStampSvg />
        </View>
      </Animated.View>
    </View>
  );
}

/** CLEAR 도장  */
export function ClearStampSvg() {
  return (
    <View style={{ width: '100%', aspectRatio: 112 / 44 }}>
      <Svg width="100%" height="100%" viewBox="0 0 112 44" opacity={STAMP_OPACITY}>
        <Rect x={2} y={2} width={108} height={40} rx={5} fill="none" stroke={Colors.stampRed} strokeWidth={4} />
        <Rect x={8} y={8} width={96} height={28} rx={2} fill="none" stroke={Colors.stampRed} strokeWidth={1.5} />
        <Text
          x={56}
          y={30}
          textAnchor="middle"
          fontSize={22}
          fontWeight="500"
          letterSpacing={2}
          fill={Colors.stampRed}
        >
          CLEAR
        </Text>
      </Svg>
    </View>
  );
}
