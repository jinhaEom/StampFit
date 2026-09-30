import { CALENDAR_H_PADDING, MONTH_RANGE } from '../constants';
import { monthMatrix, todayStr } from '@/lib/date';
import { useMemo, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, useWindowDimensions } from 'react-native';

/** 달 한 장 */
export interface MonthPage {
  year: number;
  month: number;
  weeks: (string | null)[][]; // 주 단위 날짜 (해당 달 밖은 null)
}

/** 좌우로 달 넘기기 */
export function useMonthPager() {
  const { width } = useWindowDimensions();
  const pageWidth = width - CALENDAR_H_PADDING * 2; // 달 한 장 너비
  const listRef = useRef<FlatList<MonthPage>>(null);
  const [index, setIndex] = useState(MONTH_RANGE); // 지금 보는 달 위치 (가운데 = 이번 달)

  // 오늘 기준 앞뒤 MONTH_RANGE개월
  const months = useMemo<MonthPage[]>(() => {
    const today = todayStr();
    const baseYear = Number(today.slice(0, 4));
    const baseMonth = Number(today.slice(5, 7));

    return Array.from({ length: MONTH_RANGE * 2 + 1 }, (_, i) => {
      const d = new Date(baseYear, baseMonth - 1 + (i - MONTH_RANGE), 1);
      const [year, month] = [d.getFullYear(), d.getMonth() + 1];
      return { year, month, weeks: monthMatrix(year, month) };
    });
  }, []);

  const scrollTo = (i: number) => {
    if (i < 0 || i >= months.length) return;
    listRef.current?.scrollToIndex({ index: i, animated: true });
  };

  return {
    listRef,
    months,
    pageWidth,
    current: months[index],
    initialIndex: MONTH_RANGE,
    goToMonth: (dir: -1 | 1) => scrollTo(index + dir),
    goToToday: () => scrollTo(MONTH_RANGE),
    onMomentumScrollEnd: (e: NativeSyntheticEvent<NativeScrollEvent>) =>
      setIndex(Math.round(e.nativeEvent.contentOffset.x / pageWidth)),
    getItemLayout: (_: unknown, i: number) => ({ length: pageWidth, offset: pageWidth * i, index: i }),
  };
}
