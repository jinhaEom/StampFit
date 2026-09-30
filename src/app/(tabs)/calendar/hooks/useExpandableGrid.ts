import {
  CELL_COLLAPSED,
  CELL_EXPANDED,
  CELL_V_PADDING,
  EXPAND_DRAG_DISTANCE,
  EXPAND_FLING_VELOCITY,
  EXPAND_SETTLE_MS,
  GESTURE_SLOP,
  ROW_HEIGHT,
} from '../constants';
import { Gesture } from 'react-native-gesture-handler';
import { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

/** 위아래로 끌어 칸 펼치기 (강도·컨디션 보기) */
export function useExpandableGrid(weekRows: number) {
  const expandProgress = useSharedValue(0); // 펼침 정도 (0 접힘 ~ 1 펼침)
  const progressAtDragStart = useSharedValue(0); // 드래그 시작 시점의 펼침 정도

  const expandGesture = Gesture.Pan()
    .activeOffsetY([-GESTURE_SLOP, GESTURE_SLOP]) // 세로로 먼저 움직여야 시작
    .failOffsetX([-GESTURE_SLOP, GESTURE_SLOP]) // 가로가 먼저면 포기 (달 넘기기 우선)
    .onStart(() => {
      progressAtDragStart.value = expandProgress.value;
    })
    .onUpdate((e) => {
      const next = progressAtDragStart.value + e.translationY / EXPAND_DRAG_DISTANCE;
      expandProgress.value = Math.min(1, Math.max(0, next));
    })
    .onEnd((e) => {
      /* 절반 이상 끌었거나 아래로 튕기면 펼침 */
      const shouldExpand = expandProgress.value > 0.5 || e.velocityY > EXPAND_FLING_VELOCITY;
      expandProgress.value = withTiming(shouldExpand ? 1 : 0, { duration: EXPAND_SETTLE_MS });
    });

  // 격자 높이 (주 수에 맞춰 접힘~펼침)
  const gridHeightStyle = useAnimatedStyle(
    () => ({
      height: interpolate(
        expandProgress.value,
        [0, 1],
        [weekRows * (CELL_COLLAPSED + CELL_V_PADDING), weekRows * ROW_HEIGHT],
        Extrapolation.CLAMP,
      ),
    }),
    [weekRows],
  );

  // 선택 날짜 배경 높이
  const pillStyle = useAnimatedStyle(() => ({
    height: interpolate(expandProgress.value, [0, 1], [CELL_COLLAPSED, CELL_EXPANDED], Extrapolation.CLAMP),
  }));

  return { expandProgress, expandGesture, gridHeightStyle, pillStyle };
}
