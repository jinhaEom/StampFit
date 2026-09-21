import { Colors } from '@/constants/colors';
import { heatColor } from '@/lib/heatmap';
import { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

export interface WeekDay {
  date: string;
  /** 0 = 기록 없음, 1~4 = 히트맵 농도 */
  level: number;
  isToday: boolean;
}

const WEEKDAY = ['월', '화', '수', '목', '금', '토', '일'];

/** 이번 주 잔디 7칸 */
export function WeekGrass({
  days,
  onPressDay,
}: {
  days: WeekDay[];
  onPressDay?: (date: string) => void;
}) {
  return (
    <View className="flex-row gap-[8px]">
      {days.map((d, i) => (
        <Pressable
          key={d.date}
          className="flex-1 items-center gap-[6px]"
          disabled={!onPressDay}
          onPress={() => onPressDay?.(d.date)}
          hitSlop={4}
        >
          <Cell level={d.level} isToday={d.isToday} />
          <Text className={`text-[12px] ${d.isToday ? 'font-medium text-fg' : 'text-sub'}`}>
            {WEEKDAY[i]}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function Cell({ level, isToday }: { level: number; isToday: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;
  const prev = useRef(level);

  useEffect(() => {
    if (prev.current === 0 && level > 0) {
      scale.setValue(0.4);
      Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    }
    prev.current = level;
  }, [level, scale]);

  return (
    <Animated.View
      style={[
        {
          width: '100%',
          aspectRatio: 1,
          borderRadius: 6,
          backgroundColor: heatColor(level),
          transform: [{ scale }],
        },
        isToday && { borderWidth: 1, borderColor: Colors.gray2Color },
      ]}
    />
  );
}
