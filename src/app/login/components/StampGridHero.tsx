import { Colors } from '@/constants/colors';
import { heatColor } from '@/lib/heatmap';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

// 한 달치 칸 (0 쉰 날, 1~4 도장 진하기)
const MONTH = [
  2, 0, 3, 1, 0, 4, 0,
  3, 2, 0, 4, 1, 0, 2,
  0, 3, 4, 0, 2, 3, 0,
  4, 1, 0, 3, 4, 2, 0,
  2, 4, 3, 0, 4, 3, 1,
];
const CELL = 26;
const GAP = 10;
const STEP_MS = 160; // 한 칸씩 찍히는 간격
const PAUSE_STEPS = 8; // 다 찍고 쉬는 칸 수 (이후 처음부터)

/** 시작 화면 한 달 도장 애니메이션 */
export function StampGridHero() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => (c >= MONTH.length + PAUSE_STEPS ? 0 : c + 1));
    }, STEP_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <View style={{ width: CELL * 7 + GAP * 6, flexDirection: 'row', flexWrap: 'wrap', gap: GAP }}>
      {MONTH.map((level, i) => (
        <View
          key={i}
          style={{ width: CELL, height: CELL, borderRadius: CELL / 2, backgroundColor: Colors.border }}
        >
          {i < count && level > 0 && (
            <Animated.View
              entering={ZoomIn.springify()}
              exiting={FadeOut.duration(300)}
              style={{ flex: 1, borderRadius: CELL / 2, backgroundColor: heatColor(level) }}
            />
          )}
        </View>
      ))}
    </View>
  );
}
