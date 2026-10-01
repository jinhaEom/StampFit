import { ROW_HEIGHT, ROW_OVERLAP } from '../../constants';
import type { ReactNode } from 'react';
import Animated, { type SharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface Props {
  index: number; // 달 안에서 몇 번째 주
  expandProgress: SharedValue<number>;
  children: ReactNode;
}

/** 주 한 줄 (접힐수록 위로 겹쳐 올라감) */
export function WeekRow({ index, expandProgress, children }: Props) {
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -(1 - expandProgress.value) * index * ROW_OVERLAP }],
  }));

  return (
    <Animated.View className="flex-row bg-background" style={[{ height: ROW_HEIGHT }, style]}>
      {children}
    </Animated.View>
  );
}
