import { Colors } from '@/constants/colors';
import { useEffect, useState } from 'react';
import { View, type DimensionValue } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const SHINE_COLOR = '#43464C'; 
const SWEEP_MS = 1200; // 빛이 지나가는 시간

interface Props {
  width: DimensionValue;
  height: number;
  radius?: number;
}

export function Skeleton({ width, height, radius = 8 }: Props) {
  const [boxWidth, setBoxWidth] = useState(0);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.ease) }), -1, false);
  }, [progress]);

  const shineStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -boxWidth + progress.value * boxWidth * 2 }],
  }));

  return (
    <View
      onLayout={(e) => setBoxWidth(e.nativeEvent.layout.width)}
      style={{ width, height, borderRadius: radius, backgroundColor: Colors.cardSelected, overflow: 'hidden' }}
    >
      {boxWidth > 0 && (
        <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: boxWidth }, shineStyle]}>
          <Svg width="100%" height="100%">
            <Defs>
              <LinearGradient id="shine" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor={SHINE_COLOR} stopOpacity={0} />
                <Stop offset="0.5" stopColor={SHINE_COLOR} stopOpacity={1} />
                <Stop offset="1" stopColor={SHINE_COLOR} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#shine)" />
          </Svg>
        </Animated.View>
      )}
    </View>
  );
}
