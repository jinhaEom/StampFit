import { monthMatrix, todayStr } from '@/lib/date';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const H_PADDING = 16;
export const PAGE_WIDTH = Dimensions.get('window').width - H_PADDING * 2;

const RANGE = 60; // 오늘 기준 앞뒤로 넘길 수 있는 개월 수
const CELL_COLLAPSED = 46;
const CELL_EXPANDED = 78;
const ROW_PADDING = 6; // 셀 위아래 py-[3px]
const WEEK_ROWS = 6;
const DRAG_DISTANCE = 70; // 이만큼 끌면 완전히 펼쳐짐

/** 줄 높이는 펼친 상태로 고정하고, 접을 땐 이만큼씩 위로 겹쳐 올린다 */
export const ROW_HEIGHT = CELL_EXPANDED + ROW_PADDING; // 84
const ROW_OVERLAP = CELL_EXPANDED - CELL_COLLAPSED; // 32

export const GRID_MAX_HEIGHT = WEEK_ROWS * ROW_HEIGHT;

export type MonthPage = { year: number; month: number; weeks: (string | null)[][] };

/** 줄 하나의 위치. 접힐수록 자기 순서만큼 위로 당겨져 윗줄의 펼침 영역을 덮는다 */
function useRowOffset(progress: SharedValue<number>, index: number) {
  return useAnimatedStyle(() => ({
    transform: [{ translateY: -(1 - progress.value) * index * ROW_OVERLAP }],
  }));
}

/**
 * 캘린더의 두 가지 조작.
 * - pager: 좌우로 달 넘기기
 * - expandGesture + 스타일들: 위아래로 끌어 강도·컨디션 펼치기
 */
export function useCalendar() {
  const listRef = useRef<FlatList<MonthPage>>(null);
  const [index, setIndex] = useState(RANGE);

  const months = useMemo<MonthPage[]>(() => {
    const today = todayStr();
    const baseYear = Number(today.slice(0, 4));
    const baseMonth = Number(today.slice(5, 7));

    return Array.from({ length: RANGE * 2 + 1 }, (_, i) => {
      const d = new Date(baseYear, baseMonth - 1 + (i - RANGE), 1);
      const [year, month] = [d.getFullYear(), d.getMonth() + 1];
      return { year, month, weeks: monthMatrix(year, month) };
    });
  }, []);

  const pager = {
    listRef,
    months,
    current: months[index],
    initialIndex: RANGE,
    goToMonth: (dir: -1 | 1) => {
      const next = index + dir;
      if (next >= 0 && next < months.length) {
        listRef.current?.scrollToIndex({ index: next, animated: true });
      }
    },
    goToToday: () => {
      listRef.current?.scrollToIndex({ index: RANGE, animated: true });
    },
    onMomentumScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
      setIndex(Math.round(e.nativeEvent.contentOffset.x / PAGE_WIDTH)),
    getItemLayout: (_: unknown, i: number) => ({
      length: PAGE_WIDTH,
      offset: PAGE_WIDTH * i,
      index: i,
    }),
  };

  const progress = useSharedValue(0);
  const dragStart = useSharedValue(0);

  const expandGesture = Gesture.Pan()
    .activeOffsetY([-10, 10]) // 세로로 10px 넘게 움직여야 시작
    .failOffsetX([-10, 10]) // 가로가 먼저 움직이면 포기 → FlatList가 달 넘기기를 가져감
    .onStart(() => {
      dragStart.value = progress.value;
    })
    .onUpdate((e) => {
      const next = dragStart.value + e.translationY / DRAG_DISTANCE;
      progress.value = Math.min(1, Math.max(0, next));
    })
    .onEnd((e) => {
      // 절반을 넘겼거나 아래로 충분히 튕겼으면 펼침, 아니면 접힘
      const next = progress.value > 0.5 || e.velocityY > 600;
      progress.value = withTiming(next ? 1 : 0, { duration: 220 });
    });

  const rows = months[index].weeks.length;
  const gridHeightStyle = useAnimatedStyle(() => ({
    height: interpolate(
      progress.value,
      [0, 1],
      [rows * (CELL_COLLAPSED + ROW_PADDING), rows * ROW_HEIGHT],
      Extrapolation.CLAMP,
    ),
  }), [rows]);

  const pillStyle = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [CELL_COLLAPSED, CELL_EXPANDED], Extrapolation.CLAMP),
  }));

  const rowStyles = [
    useRowOffset(progress, 0),
    useRowOffset(progress, 1),
    useRowOffset(progress, 2),
    useRowOffset(progress, 3),
    useRowOffset(progress, 4),
    useRowOffset(progress, 5),
  ];

  return { pager, expandGesture, gridHeightStyle, rowStyles, pillStyle };
}
